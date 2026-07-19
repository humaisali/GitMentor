import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    githubRepoId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      default: 'main',
    },
    status: {
      type: String,
      enum: ['success', 'in-progress', 'error'],
      default: 'success',
    },
    lastCommit: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Repository = mongoose.model('Repository', repositorySchema);
export default Repository;
