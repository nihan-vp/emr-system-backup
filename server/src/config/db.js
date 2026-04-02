import mongoose from 'mongoose';
import { env } from './env.js';

export const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: true
    });

    console.log(`[api] ✅ Connected to MongoDB`);
    return mongoose.connection;

  } catch (error) {
    console.error('[api] ❌ MongoDB connection error:', error.message);
    throw error;
  }
};