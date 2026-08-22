import { z } from 'zod';

const levelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

const evidenceSchema = z.object({
  source: z.string(),
  label: z.string(),
  detail: z.string(),
  weight: z.number().optional(),
});

export const skillAssessmentSchema = z.object({
  overallLevel: levelSchema,
  overallScore: z.number(),
  confidence: z.number(),
  summary: z.string(),
  categories: z.array(z.object({
    name: z.string(),
    slug: z.string(),
    level: levelSchema,
    score: z.number(),
    confidence: z.number(),
    description: z.string(),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    evidence: z.array(evidenceSchema),
    recommendedActions: z.array(z.string()),
  })),
  topLanguages: z.array(z.object({
    name: z.string(),
    proficiency: levelSchema,
    projectCount: z.number(),
  })),
  recommendations: z.array(z.string()),
  nextBestActions: z.array(z.object({
    title: z.string(),
    description: z.string(),
    categorySlug: z.string(),
    impact: z.string(),
  })),
  readinessScores: z.array(z.object({
    track: z.string(),
    score: z.number(),
    summary: z.string(),
  })),
});

export const roadmapSchema = z.object({
  items: z.array(z.object({
    projectId: z.string(),
    title: z.string(),
    description: z.string(),
    difficulty: levelSchema,
    estTime: z.string(),
    prereq: z.string(),
    targetSkills: z.array(z.object({ name: z.string(), slug: z.string() })),
    addressedGaps: z.array(z.string()),
    skillRationale: z.string(),
    readinessTrack: z.string(),
  })),
});

export const repoInsightsSchema = z.object({
  items: z.array(z.object({
    insightId: z.string(),
    type: z.enum(['VULNERABILITY', 'PERFORMANCE', 'ARCHITECTURE', 'BEST_PRACTICE']),
    severity: z.enum(['error', 'warning', 'info']),
    title: z.string(),
    description: z.string(),
    suggestedSolution: z.string(),
    file: z.string(),
  })),
});

export const projectPlanSchema = z.object({
  scope: z.string(),
  objectives: z.array(z.string()),
  methodologies: z.array(z.string()),
  techStack: z.array(z.string()),
  timelineOptions: z.array(z.object({
    id: z.string(),
    title: z.string(),
    duration: z.string(),
    durationDays: z.number().int(),
    description: z.string(),
  })).length(3),
});

export const projectPhasesSchema = z.object({
  items: z.array(z.object({
    phaseId: z.string(),
    title: z.string(),
    description: z.string(),
    estimatedTime: z.string(),
    estimatedHours: z.number().int(),
    suggestedSessionCount: z.number().int(),
  })).min(4).max(5),
});

export const phaseTasksSchema = z.object({
  items: z.array(z.object({
    taskId: z.string(),
    title: z.string(),
    description: z.string(),
    steps: z.array(z.string()),
  })).min(4).max(6),
});

export const unwrapItems = value => value.items;
