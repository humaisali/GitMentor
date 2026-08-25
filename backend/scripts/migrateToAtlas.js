import readline from 'node:readline';
import { MongoClient } from 'mongodb';

const SOURCE_URI = process.env.MIGRATION_SOURCE_URI || 'mongodb://127.0.0.1:27017';
const DATABASE_NAME = process.env.MIGRATION_DATABASE || 'gitmentor';
const INDEX_OPTION_KEYS = [
  'name',
  'unique',
  'sparse',
  'expireAfterSeconds',
  'partialFilterExpression',
  'collation',
  'weights',
  'default_language',
  'language_override',
  'textIndexVersion',
  'sphereIndexVersion',
  'bits',
  'min',
  'max',
  'bucketSize',
  'wildcardProjection',
  'hidden',
];

const readTargetUri = async () => {
  if (process.env.MIGRATION_TARGET_URI) return process.env.MIGRATION_TARGET_URI;

  const input = readline.createInterface({ input: process.stdin, terminal: false });
  for await (const line of input) {
    const value = line.trim();
    if (value) return value;
  }
  throw new Error('Atlas target URI was not provided.');
};

const targetUri = await readTargetUri();
const source = new MongoClient(SOURCE_URI);
const target = new MongoClient(targetUri);

try {
  await source.connect();
  await target.connect();

  const sourceDb = source.db(DATABASE_NAME);
  const targetDb = target.db(DATABASE_NAME);
  const sourceCollections = await sourceDb.listCollections({}, { nameOnly: true }).toArray();
  const targetCollections = new Set(
    (await targetDb.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name),
  );
  const report = [];

  for (const { name } of sourceCollections) {
    if (!targetCollections.has(name)) {
      await targetDb.createCollection(name);
      targetCollections.add(name);
    }

    const sourceCollection = sourceDb.collection(name);
    const targetCollection = targetDb.collection(name);
    const sourceDocuments = await sourceCollection.find({}).toArray();
    const targetIds = new Set(
      (await targetCollection.find({}, { projection: { _id: 1 } }).toArray())
        .map(({ _id }) => String(_id)),
    );
    const missingDocuments = sourceDocuments.filter(({ _id }) => !targetIds.has(String(_id)));

    for (let index = 0; index < missingDocuments.length; index += 100) {
      await targetCollection.insertMany(missingDocuments.slice(index, index + 100), { ordered: true });
    }

    const sourceIndexes = await sourceCollection.indexes();
    for (const index of sourceIndexes) {
      if (index.name === '_id_') continue;

      const options = Object.fromEntries(
        INDEX_OPTION_KEYS
          .filter(key => index[key] !== undefined)
          .map(key => [key, index[key]]),
      );

      try {
        await targetCollection.createIndex(index.key, options);
      } catch (error) {
        if (!['IndexOptionsConflict', 'IndexKeySpecsConflict'].includes(error.codeName)) throw error;
      }
    }

    report.push({
      collection: name,
      sourceDocuments: sourceDocuments.length,
      targetDocuments: await targetCollection.countDocuments({}),
      sourceIndexes: sourceIndexes.length,
      targetIndexes: (await targetCollection.indexes()).length,
    });
  }

  console.log(JSON.stringify({ database: DATABASE_NAME, collections: report }));
} finally {
  await Promise.allSettled([source.close(), target.close()]);
}
