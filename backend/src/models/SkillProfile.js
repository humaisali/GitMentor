import mongoose from 'mongoose';

const skillCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      required: true,
    },
    score: { type: Number, required: true, min: 0, max: 100 },
    confidence: { type: Number, default: 50, min: 0, max: 100 },
    description: { type: String, required: true },
    strengths: [{ type: String }],
    gaps: [{ type: String }],
    evidence: [{
      source: { type: String },
      label: { type: String },
      detail: { type: String },
      weight: { type: Number, default: 1 },
    }],
    recommendedActions: [{ type: String }],
  },
  { _id: false }
);

const languageProficiencySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    proficiency: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      required: true,
    },
    projectCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const skillProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    overallLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    confidence: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    summary: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      default: 'full-stack-developer',
    },
    categories: [skillCategorySchema],
    topLanguages: [languageProficiencySchema],
    recommendations: [{ type: String }],
    nextBestActions: [{
      title: { type: String, required: true },
      description: { type: String, required: true },
      categorySlug: { type: String },
      impact: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'MEDIUM',
      },
    }],
    repoSkillMap: [{
      repoName: { type: String, required: true },
      url: { type: String },
      detectedSkills: [{ type: String }],
      primaryCategories: [{ type: String }],
      missingSignals: [{ type: String }],
      confidence: { type: Number, default: 50, min: 0, max: 100 },
    }],
    readinessScores: [{
      track: { type: String, required: true },
      score: { type: Number, required: true, min: 0, max: 100 },
      summary: { type: String },
    }],
    recentProgressEvents: [{
      categorySlug: { type: String },
      categoryName: { type: String },
      eventType: { type: String },
      title: { type: String },
      description: { type: String },
      impactScore: { type: Number },
      createdAt: { type: Date },
    }],
    assessmentSignals: {
      type: Object,
      default: {},
    },
    history: [{
      assessedAt: { type: Date, default: Date.now },
      overallScore: { type: Number, min: 0, max: 100 },
      overallLevel: {
        type: String,
        enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      },
      confidence: { type: Number, min: 0, max: 100 },
      categoryScores: [{
        slug: { type: String },
        score: { type: Number, min: 0, max: 100 },
      }],
    }],
    repositoriesAnalyzed: {
      type: Number,
      default: 0,
    },
    assessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const SkillProfile = mongoose.model('SkillProfile', skillProfileSchema);
export default SkillProfile;
