import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer: unknown = null;

export async function connectDatabase(uri?: string): Promise<string> {
  const target = uri ?? env.mongoUri;

  mongoose.set('strictQuery', true);

  if (target) {
    await mongoose.connect(target, { serverSelectionTimeoutMS: 10000 });
    return target;
  }

  // Demo/unattended mode: boot an in-process MongoDB so the app is runnable
  // without external credentials. Data is NOT persisted between restarts.
  if (env.isProd) {
    throw new Error('MONGODB_URI is required in production');
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mem = await MongoMemoryServer.create();
  memoryServer = mem;
  await mongoose.connect(mem.getUri('paypilot'));
  // eslint-disable-next-line no-console
  console.warn(
    '[db] MONGODB_URI not set — using in-memory MongoDB (demo mode, data is lost on restart).',
  );
  return mem.getUri('paypilot');
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
  if (memoryServer) {
    await (memoryServer as { stop: () => Promise<void> }).stop();
    memoryServer = null;
  }
}
