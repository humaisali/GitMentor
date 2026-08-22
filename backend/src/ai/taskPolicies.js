export const AI_TASKS = Object.freeze({
  SKILL_ASSESSMENT: 'SKILL_ASSESSMENT',
  ROADMAP: 'ROADMAP',
  REPO_INSIGHTS: 'REPO_INSIGHTS',
  PROJECT_PLAN: 'PROJECT_PLAN',
  PROJECT_PHASES: 'PROJECT_PHASES',
  PHASE_TASKS: 'PHASE_TASKS',
  LEARNING_MATERIALS: 'LEARNING_MATERIALS',
  PROJECT_CHAT: 'PROJECT_CHAT',
});

export const TASK_POLICIES = Object.freeze({
  [AI_TASKS.SKILL_ASSESSMENT]: { providers: ['gemini', 'groq'], reasoning: true, maxOutputTokens: 12000 },
  [AI_TASKS.ROADMAP]: { providers: ['gemini', 'groq'], reasoning: true, maxOutputTokens: 8000, unwrapItems: true },
  [AI_TASKS.REPO_INSIGHTS]: { providers: ['groq', 'gemini'], reasoning: true, maxOutputTokens: 5000, unwrapItems: true },
  [AI_TASKS.PROJECT_PLAN]: { providers: ['groq', 'gemini'], reasoning: true, maxOutputTokens: 5000 },
  [AI_TASKS.PROJECT_PHASES]: { providers: ['groq', 'gemini'], reasoning: false, maxOutputTokens: 4000, unwrapItems: true },
  [AI_TASKS.PHASE_TASKS]: { providers: ['groq', 'gemini'], reasoning: true, maxOutputTokens: 7000, unwrapItems: true },
  [AI_TASKS.LEARNING_MATERIALS]: { providers: ['gemini'], reasoning: false, maxOutputTokens: 4000 },
  [AI_TASKS.PROJECT_CHAT]: { providers: ['groq', 'gemini'], reasoning: false, maxOutputTokens: 3000 },
});

export const getTaskPolicy = task => {
  const policy = TASK_POLICIES[task];
  if (!policy) throw new Error(`Unknown AI task: ${task}`);

  if (process.env.AI_ROUTING_ENABLED === 'false') {
    return { ...policy, providers: ['gemini'] };
  }

  return policy;
};
