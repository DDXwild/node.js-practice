import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { MovieModel } from '../src/models/entity.model';

let mongo: MongoMemoryServer | undefined;

export async function connectTestDb(): Promise<void> {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await connectDatabase();
}

export async function disconnectTestDb(): Promise<void> {
  await disconnectDatabase();
  await mongo?.stop();
  mongo = undefined;
}

export async function clearMovieCollection(): Promise<void> {
  await MovieModel.deleteMany({});
}
