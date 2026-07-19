import mongoose from 'mongoose';

const insightSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    insightId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['VULNERABILITY', 'PERFORMANCE', 'BEST_PRACTICE', 'ARCHITECTURE'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['error', 'warning', 'primary', 'info'],
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
    file: {
      type: String,
      required: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Insight = mongoose.model('Insight', insightSchema);
export default Insight;
