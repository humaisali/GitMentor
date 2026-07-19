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
    title: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    googleEventId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const BuildSession = mongoose.model('BuildSession', buildSessionSchema);
export default BuildSession;
