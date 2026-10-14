import { MongoClient, Db } from 'mongodb';

const MONGO_URI = 'mongodb://127.0.0.1:27017';
const DATABASE_NAME = 'gaming_player_db';

const mongoClient = new MongoClient(MONGO_URI);

let database: Db | null = null;

export async function connectMongoDB(): Promise<Db> {
  if (database) {
    return database;
  }

  await mongoClient.connect();

  database = mongoClient.db(DATABASE_NAME);

  console.log(`🍃 Connected to MongoDB database: ${DATABASE_NAME}`);

  return database;
}

export async function getMongoDB(): Promise<Db> {
  return await connectMongoDB();
}

export { mongoClient };
