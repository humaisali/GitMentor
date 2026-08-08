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
    description: { type: String, required: true },
    strengths: [{ type: String }],
    gaps: [{ type: String }],
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
    summary: {
      type: String,
      required: true,
    },
    categories: [skillCategorySchema],
    topLanguages: [languageProficiencySchema],
    recommendations: [{ type: String }],
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
