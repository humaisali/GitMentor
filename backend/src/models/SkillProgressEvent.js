import mongoose from 'mongoose';

const skillProgressEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
    },
    categorySlug: {
      type: String,
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      enum: ['TASK_COMPLETED', 'PHASE_COMPLETED', 'PROJECT_COMPLETED', 'INSIGHT_RESOLVED', 'BUILD_SESSION_COMPLETED'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    impactScore: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

const SkillProgressEvent = mongoose.model('SkillProgressEvent', skillProgressEventSchema);
export default SkillProgressEvent;
