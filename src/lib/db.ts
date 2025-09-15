import mongoose, { ConnectOptions } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local',
  );
}

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // Use a unique name to avoid conflict
  var _mongoose: Cached | undefined;
}

const cached: Cached = global._mongoose || { conn: null, promise: null };

if (!global._mongoose) {
  global._mongoose = cached;
}

async function dbConnect() {
  // Always check if the connection is ready
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection is dead or not ready, reset the cache
  if (cached.conn && cached.conn.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;

    // Add connection event listeners for better error handling
    cached.conn.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      cached.conn = null;
      cached.promise = null;
    });

    cached.conn.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      cached.conn = null;
      cached.promise = null;
    });
  } catch (e) {
    cached.promise = null;
    console.error('Database connection failed:', e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
