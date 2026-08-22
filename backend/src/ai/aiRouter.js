import { z } from 'zod';
import { createHash } from 'node:crypto';
import { getTaskPolicy } from './taskPolicies.js';
import { geminiProvider } from './providers/geminiProvider.js';
import { groqProvider } from './providers/groqProvider.js';

const numberFromEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const parseJson = text => {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  if (!cleaned) throw new SyntaxError('AI provider returned an empty response.');
  return JSON.parse(cleaned);
};

const toProviderJsonSchema = schema => {
  const { $schema, ...jsonSchema } = z.toJSONSchema(schema);
  return jsonSchema;
};

const statusOf = error => Number(error?.status || error?.statusCode || error?.response?.status);

const isRetryable = error => {
  const status = statusOf(error);
  return error?.name === 'ZodError'
    || error instanceof SyntaxError
    || error?.code === 'AI_TIMEOUT'
    || status === 408
    || status === 429
    || status >= 500;
};

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const retryDelayMs = (error, attempt) => {
  const header = error?.headers?.get?.('retry-after') ?? error?.headers?.['retry-after'];
  const retryAfterMs = Number(header) * 1000;
  if (Number.isFinite(retryAfterMs) && retryAfterMs > 0) return Math.min(retryAfterMs, 2000);
  return Math.min(100 * (2 ** attempt) + Math.floor(Math.random() * 50), 1000);
};

const withTimeout = async (promise, timeoutMs) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`AI request exceeded ${timeoutMs}ms.`);
      error.code = 'AI_TIMEOUT';
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

export const createAIRouter = ({ providers = { gemini: geminiProvider, groq: groqProvider } } = {}) => {
  const circuits = new Map();
  const inFlight = new Map();

  const deduplicate = (task, prompt, operation) => {
    const key = createHash('sha256').update(`${task}\0${prompt}`).digest('hex');
    if (inFlight.has(key)) return inFlight.get(key);
    const pending = Promise.resolve().then(operation).finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
    return pending;
  };

  const circuitFor = providerName => circuits.get(providerName) || { failures: 0, openUntil: 0 };

  const assertCircuitClosed = providerName => {
    const circuit = circuitFor(providerName);
    if (circuit.openUntil > Date.now()) {
      const error = new Error(`${providerName} AI circuit is temporarily open.`);
      error.code = 'AI_CIRCUIT_OPEN';
      throw error;
    }
    if (circuit.openUntil) circuits.set(providerName, { failures: 0, openUntil: 0 });
  };

  const recordSuccess = providerName => circuits.set(providerName, { failures: 0, openUntil: 0 });

  const recordFailure = (providerName, error) => {
    if (!isRetryable(error)) return;
    const threshold = numberFromEnv('AI_CIRCUIT_FAILURE_THRESHOLD', 3);
    const circuit = circuitFor(providerName);
    const failures = circuit.failures + 1;
    circuits.set(providerName, {
      failures,
      openUntil: failures >= threshold
        ? Date.now() + numberFromEnv('AI_CIRCUIT_COOLDOWN_MS', 60000)
        : 0,
    });
  };

  const callProvider = async ({ providerName, operation }) => {
    assertCircuitClosed(providerName);
    const maxRetries = numberFromEnv('AI_MAX_RETRIES', 1);
    const timeoutMs = numberFromEnv('AI_REQUEST_TIMEOUT_MS', 30000);
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const result = await withTimeout(operation(providers[providerName]), timeoutMs);
        recordSuccess(providerName);
        return result;
      } catch (error) {
        lastError = error;
        if (!isRetryable(error) || attempt === maxRetries) break;
        await delay(retryDelayMs(error, attempt));
      }
    }

    recordFailure(providerName, lastError);
    throw lastError;
  };

  const runWithFallback = async ({ task, operation }) => {
    const policy = getTaskPolicy(task);
    const failures = [];

    for (const providerName of policy.providers) {
      const provider = providers[providerName];
      if (!provider) continue;
      try {
        const result = await callProvider({ providerName, operation: current => operation(current, policy) });
        if (failures.length) console.warn(`[AI] ${task} succeeded via ${providerName} fallback.`);
        return result;
      } catch (error) {
        failures.push({ provider: providerName, error });
        console.warn(`[AI] ${task} failed via ${providerName}: ${error.message}`);
      }
    }

    const summary = failures.map(item => `${item.provider}: ${item.error.message}`).join('; ');
    throw new Error(`All configured AI providers failed for ${task}. ${summary}`);
  };

  return {
    async generateStructured({ task, prompt, schema }) {
      return deduplicate(task, prompt, async () => {
        const jsonSchema = toProviderJsonSchema(schema);
        const parsed = await runWithFallback({
          task,
          operation: async (provider, policy) => {
            const text = await provider.generateStructured({
              prompt,
              jsonSchema,
              reasoning: policy.reasoning,
              maxOutputTokens: policy.maxOutputTokens,
            });
            return schema.parse(parseJson(text));
          },
        });
        return getTaskPolicy(task).unwrapItems ? parsed.items : parsed;
      });
    },

    generateText({ task, systemInstruction, messages }) {
      return runWithFallback({
        task,
        operation: (provider, policy) => provider.generateText({
          systemInstruction,
          messages,
          reasoning: policy.reasoning,
          maxOutputTokens: policy.maxOutputTokens,
        }),
      });
    },

    generateGrounded({ task, prompt }) {
      return deduplicate(task, prompt, () => runWithFallback({
        task,
        operation: provider => {
          if (!provider.generateGrounded) throw new Error(`${provider.name} does not support grounded search.`);
          return provider.generateGrounded({ prompt });
        },
      }));
    },
  };
};

export const aiRouter = createAIRouter();
