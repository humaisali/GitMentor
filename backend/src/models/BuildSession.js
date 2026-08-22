import mongoose from 'mongoose';

const buildSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    projectId: { type: String, required: true },
    projectTitle: { type: String, required: true },
    phaseId: { type: String },
    phaseTitle: { type: String, trim: true },
    phaseNumber: { type: Number, min: 1 },
    phaseCount: { type: Number, min: 1 },
    taskIds: [{ type: String }],
    title: {
      type: String,
      required: true,
    },
    objective: { type: String, trim: true, maxlength: 1000 },
    milestone: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 2000 },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    timeZone: { type: String, required: true, default: 'UTC' },
    reminderMinutes: [{ type: Number, min: 0, max: 40320 }],
    status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
    syncStatus: {
      type: String,
      enum: ['PENDING', 'SYNCED', 'FAILED', 'DELETED'],
      default: 'PENDING',
    },
    googleCalendarId: { type: String, default: 'primary' },
    googleEventId: { type: String },
    googleEventUrl: { type: String },
    googleEventEtag: { type: String },
    syncAttempt: { type: Number, default: 0, min: 0 },
    lastSyncError: { type: String },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

buildSessionSchema.index({ user: 1, startAt: 1 });
buildSessionSchema.index({ project: 1, startAt: 1 });
buildSessionSchema.index({ user: 1, googleEventId: 1 }, { unique: true, sparse: true });

const BuildSession = mongoose.model('BuildSession', buildSessionSchema);
export default BuildSession;
