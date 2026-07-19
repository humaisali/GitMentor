import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    data: {
      type: Object,
      required: true,
    },
    unlockedAchievements: [
      {
        badgeId: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now }
      }
    ],
    lastFetched: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;
