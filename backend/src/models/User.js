import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
    },
    accessToken: {
      type: String,
      required: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    googleRefreshToken: {
      type: String,
    },
    googleCalendar: {
      email: { type: String },
      refreshToken: { type: String },
      scopes: [{ type: String }],
      status: {
        type: String,
        enum: ['CONNECTED', 'RECONNECT_REQUIRED', 'DISCONNECTED'],
        default: 'DISCONNECTED',
      },
      connectedAt: { type: Date },
      lastValidatedAt: { type: Date },
    },
    githubReposCache: {
      type: Array,
      default: null
    },
    githubCacheUpdatedAt: {
      type: Date,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    preferences: {
      general: {
        timeZone: { type: String, default: 'UTC' },
        weekStartsOn: { type: Number, enum: [0, 1], default: 1 },
      },
      buildDays: {
        startTime: { type: String, default: '18:00' },
        durationMinutes: { type: Number, enum: [60, 90, 120, 180], default: 120 },
        reminderMinutes: { type: Number, enum: [10, 30, 60, 1440], default: 30 },
        workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
      },
      mentor: {
        style: { type: String, enum: ['GUIDED', 'BALANCED', 'DIRECT'], default: 'BALANCED' },
        explanationDepth: { type: String, enum: ['CONCISE', 'STANDARD', 'DETAILED'], default: 'STANDARD' },
        codeGuidance: { type: String, enum: ['HINTS_FIRST', 'COMPLETE_EXAMPLES'], default: 'HINTS_FIRST' },
      },
      skillEngine: {
        targetRole: { type: String, default: 'full-stack-developer' },
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;
