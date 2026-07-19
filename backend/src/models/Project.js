import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['LOCKED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'LOCKED',
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      required: true,
    },
    estTime: {
      type: String,
      required: true,
    },
    prereq: {
      type: String,
      default: 'NONE',
    },
    order: {
      type: Number,
      required: true,
    },
    // --- Phase 2.5 Deep Dive Fields ---
    detailedPlan: {
      scope: { type: String },
      objectives: [{ type: String }],
      methodologies: [{ type: String }],
      techStack: [{ type: String }],
    },
    timelineOptions: [{
      id: { type: String },
      title: { type: String },
      duration: { type: String },
      description: { type: String }
    }],
    selectedTimeline: {
      type: String, // id of chosen timeline
    },
    phases: [{
      phaseId: { type: String },
      title: { type: String },
      description: { type: String },
      estimatedTime: { type: String },
      isCompleted: { type: Boolean, default: false }
    }]
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
