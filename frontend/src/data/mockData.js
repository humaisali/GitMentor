// mockInsights and mockRepositories have been moved to the backend.

export const mockSystemMetrics = {
  linesAnalyzed: '1.2M',
  vulnerabilitiesFixed: '84',
  apiLatency: '42ms',
  lastSync: '08:42:11 UTC'
};

export const mockRoadmap = [
  {
    id: 'MOD-01',
    title: '01. Todo App Architecture',
    description: 'Master foundational React patterns, component state, and functional prop drilling.',
    status: 'COMPLETED',
    difficulty: 'BEGINNER',
    estTime: '4 HOURS',
    prereq: 'NONE'
  },
  {
    id: 'MOD-02',
    title: '02. Real-time Chat Sync',
    description: 'Implement WebSockets and complex state management using Context API and Reducers.',
    status: 'IN_PROGRESS',
    difficulty: 'INTERMEDIATE',
    estTime: '12 HOURS',
    prereq: 'MOD-01'
  },
  {
    id: 'MOD-03',
    title: '03. AI-Powered SaaS',
    description: 'Integrate LLM APIs, handle streaming responses, and implement robust error boundaries.',
    status: 'LOCKED',
    difficulty: 'ADVANCED',
    estTime: '24 HOURS',
    prereq: 'MOD-02'
  }
];
