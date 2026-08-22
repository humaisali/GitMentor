import dotenv from 'dotenv';
import mongoose from 'mongoose';
import BuildSession from '../src/models/BuildSession.js';
import Project from '../src/models/Project.js';

dotenv.config();

const migrate = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const legacySessions = await BuildSession.collection.find({
    startAt: { $exists: false },
    startTime: { $exists: true },
  }).toArray();
  let migrated = 0;
  let skipped = 0;

  for (const session of legacySessions) {
    const project = session.project
      ? await Project.findById(session.project)
      : await Project.findOne({ user: session.user, projectId: session.projectId });
    const startAt = new Date(session.startTime);
    const endAt = new Date(session.endTime || startAt.getTime() + 2 * 60 * 60 * 1000);
    if (!project || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      skipped += 1;
      continue;
    }
    await BuildSession.collection.updateOne({ _id: session._id }, {
      $set: {
        project: project._id,
        projectId: project.projectId,
        projectTitle: project.title,
        startAt,
        endAt,
        timeZone: session.timeZone || 'UTC',
        status: session.status || 'SCHEDULED',
        syncStatus: session.googleEventId ? 'SYNCED' : 'PENDING',
      },
      $unset: { startTime: '', endTime: '' },
    });
    migrated += 1;
  }
  console.log(`BuildSession migration complete: ${migrated} migrated, ${skipped} skipped.`);
  await mongoose.disconnect();
};

migrate().catch(async (error) => {
  console.error(`BuildSession migration failed: ${error.message}`);
  await mongoose.disconnect();
  process.exitCode = 1;
});
