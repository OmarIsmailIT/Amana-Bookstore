// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';

// Retrieve the MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || '';
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global is used here to maintain a cached connection across hot reloads in development.
// This prevents connections from growing exponentially during API Route usage.
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  // If a cached connection exists, return it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // If no cached connection, create a new one
  const client = await MongoClient.connect(MONGODB_URI);
  
  // The database name is extracted from the URI
  const db = client.db();

  // Cache the new connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}