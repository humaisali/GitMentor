import test from 'node:test';
import assert from 'node:assert/strict';
import { createAIRouter } from '../src/ai/aiRouter.js';
import { AI_TASKS } from '../src/ai/taskPolicies.js';
import { projectPlanSchema, repoInsightsSchema } from '../src/ai/schemas.js';

const validPlan = {
  scope: 'Build the API',
  objectives: ['Ship a working endpoint'],
  methodologies: ['TDD'],
  techStack: ['Node.js'],
  timelineOptions: [
    { id: 'fast', title: 'Fast', duration: '1 week', durationDays: 7, description: 'Focused delivery' },
    { id: 'normal', title: 'Normal', duration: '2 weeks', durationDays: 14, description: 'Balanced delivery' },
    { id: 'deep', title: 'Deep', duration: '4 weeks', durationDays: 28, description: 'Thorough delivery' },
  ],
};

const provider = (name, overrides = {}) => ({
  name,
  async generateStructured() { return JSON.stringify(validPlan); },
  async generateText() { return `${name} reply`; },
  ...overrides,
});

const withRouterEnv = async callback => {
  const previous = {
    AI_MAX_RETRIES: process.env.AI_MAX_RETRIES,
    AI_ROUTING_ENABLED: process.env.AI_ROUTING_ENABLED,
    AI_REQUEST_TIMEOUT_MS: process.env.AI_REQUEST_TIMEOUT_MS,
  };
  process.env.AI_MAX_RETRIES = '0';
  process.env.AI_ROUTING_ENABLED = 'true';
  try {
    await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

test('routes project plans to Groq first', () => withRouterEnv(async () => {
  const calls = [];
  const router = createAIRouter({
    providers: {
      groq: provider('groq', { async generateStructured() { calls.push('groq'); return JSON.stringify(validPlan); } }),
      gemini: provider('gemini', { async generateStructured() { calls.push('gemini'); return JSON.stringify(validPlan); } }),
    },
  });

  const result = await router.generateStructured({ task: AI_TASKS.PROJECT_PLAN, prompt: 'plan', schema: projectPlanSchema });
  assert.equal(result.scope, validPlan.scope);
  assert.deepEqual(calls, ['groq']);
}));

test('falls back from a Groq 429 to Gemini', () => withRouterEnv(async () => {
  const calls = [];
  const rateLimitError = Object.assign(new Error('rate limited'), { status: 429 });
  const router = createAIRouter({
    providers: {
      groq: provider('groq', { async generateStructured() { calls.push('groq'); throw rateLimitError; } }),
      gemini: provider('gemini', { async generateStructured() { calls.push('gemini'); return JSON.stringify(validPlan); } }),
    },
  });

  const result = await router.generateStructured({ task: AI_TASKS.PROJECT_PLAN, prompt: 'plan', schema: projectPlanSchema });
  assert.equal(result.scope, validPlan.scope);
  assert.deepEqual(calls, ['groq', 'gemini']);
}));

test('falls back when Groq returns schema-invalid JSON', () => withRouterEnv(async () => {
  const router = createAIRouter({
    providers: {
      groq: provider('groq', { async generateStructured() { return '{"scope":"incomplete"}'; } }),
      gemini: provider('gemini'),
    },
  });

  const result = await router.generateStructured({ task: AI_TASKS.PROJECT_PLAN, prompt: 'plan', schema: projectPlanSchema });
  assert.equal(result.timelineOptions.length, 3);
}));

test('unwraps provider-neutral items arrays', () => withRouterEnv(async () => {
  const insight = {
    insightId: 'INS-1', type: 'ARCHITECTURE', severity: 'info', title: 'Boundaries',
    description: 'Separate concerns.', suggestedSolution: 'Create service modules.', file: 'src/app.js',
  };
  const router = createAIRouter({
    providers: {
      groq: provider('groq', { async generateStructured() { return `\`\`\`json\n${JSON.stringify({ items: [insight] })}\n\`\`\``; } }),
      gemini: provider('gemini'),
    },
  });

  const result = await router.generateStructured({ task: AI_TASKS.REPO_INSIGHTS, prompt: 'inspect', schema: repoInsightsSchema });
  assert.deepEqual(result, [insight]);
}));

test('routes chat to Groq and preserves text output', () => withRouterEnv(async () => {
  const router = createAIRouter({ providers: { groq: provider('groq'), gemini: provider('gemini') } });
  const result = await router.generateText({
    task: AI_TASKS.PROJECT_CHAT,
    systemInstruction: 'Mentor this project.',
    messages: [{ role: 'user', content: 'What next?' }],
  });
  assert.equal(result, 'groq reply');
}));

test('deduplicates identical structured requests while one is in flight', () => withRouterEnv(async () => {
  let calls = 0;
  const router = createAIRouter({
    providers: {
      groq: provider('groq', {
        async generateStructured() {
          calls += 1;
          await new Promise(resolve => setTimeout(resolve, 10));
          return JSON.stringify(validPlan);
        },
      }),
      gemini: provider('gemini'),
    },
  });

  const request = () => router.generateStructured({
    task: AI_TASKS.PROJECT_PLAN,
    prompt: 'same plan',
    schema: projectPlanSchema,
  });
  const [first, second] = await Promise.all([request(), request()]);
  assert.equal(first.scope, second.scope);
  assert.equal(calls, 1);
}));

test('falls back when the primary provider times out', () => withRouterEnv(async () => {
  process.env.AI_REQUEST_TIMEOUT_MS = '5';
  const router = createAIRouter({
    providers: {
      groq: provider('groq', {
        async generateStructured() {
          await new Promise(resolve => setTimeout(resolve, 25));
          return JSON.stringify(validPlan);
        },
      }),
      gemini: provider('gemini'),
    },
  });

  const result = await router.generateStructured({ task: AI_TASKS.PROJECT_PLAN, prompt: 'timeout', schema: projectPlanSchema });
  assert.equal(result.scope, validPlan.scope);
}));

test('reports a bounded error when every configured provider fails', () => withRouterEnv(async () => {
  const unavailable = name => provider(name, {
    async generateStructured() { throw Object.assign(new Error('unavailable'), { status: 503 }); },
  });
  const router = createAIRouter({ providers: { groq: unavailable('groq'), gemini: unavailable('gemini') } });

  await assert.rejects(
    router.generateStructured({ task: AI_TASKS.PROJECT_PLAN, prompt: 'failure', schema: projectPlanSchema }),
    /All configured AI providers failed/,
  );
}));
