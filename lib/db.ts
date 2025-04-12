import mongoose, { Mongoose, ConnectOptions } from "mongoose";

const mongoDBURL = process.env.MONGODB_URL;

interface MongooseConn {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Improve type safety for global cache
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseConn | undefined;
}

// Initialize cache using global definition or a new object
const cache: MongooseConn = global.mongoose || { conn: null, promise: null };

// Ensure the global variable is set if it wasn't already
if (!global.mongoose) {
  global.mongoose = cache;
}

// Make options configurable
const connectOptions: ConnectOptions = {
  dbName: process.env.MONGODB_DB_NAME,
  bufferCommands: false,
};

/**
 * Establishes a connection to the MongoDB database.
 * Caches the connection promise and instance to prevent multiple connections.
 * @returns {Promise<Mongoose>} A promise that resolves to the Mongoose instance.
 * @throws {Error} If MONGODB_URL is not defined or connection fails.
 */
export const connect = async (): Promise<Mongoose> => {
  if (cache.conn) {
    // console.log("Using cached MongoDB connection");
    return cache.conn;
  }

  if (!mongoDBURL) {
    throw new Error("MONGODB_URL is not defined in the environment variables");
  }

  if (!cache.promise) {
    // console.log("Creating new MongoDB connection promise");
    cache.promise = mongoose.connect(mongoDBURL, connectOptions).then((mongooseInstance) => {
      // console.log("MongoDB connection promise resolved");
      return mongooseInstance;
    });
  }

  try {
    // console.log("Awaiting MongoDB connection promise");
    cache.conn = await cache.promise;
    // console.log("MongoDB Connected");
    return cache.conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // Reset the promise cache on error so subsequent calls can retry
    cache.promise = null;
    if (error instanceof Error) {
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
    // Rethrow if it's not a standard Error object
    throw error;
  }
};

/**
 * Checks if the MongoDB connection is currently established.
 * @returns {boolean} True if connected (readyState === 1), false otherwise.
 */
export const isConnected = (): boolean => {
  // Check if mongoose and connection exist before accessing readyState
  return !!cache.conn && cache.conn.connection.readyState === 1;
};

/**
 * Disconnects from the MongoDB database if a connection exists.
 */
export const disconnect = async (): Promise<void> => {
  if (!cache.conn) {
    // console.log("No active MongoDB connection to disconnect.");
    return;
  }
  // console.log("Disconnecting from MongoDB...");
  await cache.conn.disconnect();
  cache.conn = null;
  cache.promise = null;
  // console.log("Disconnected from MongoDB");
}; 