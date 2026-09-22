import dns from "node:dns";
import mongoose from "mongoose";

// Force Node.js DNS to use reliable public DNS servers.
// This helps when the ISP DNS resolver refuses MongoDB SRV queries.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Serverless/Vercel-safe MongoDB connection.
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.warn(
    "MONGO_URI is not set. Set it in your environment (.env.local or Vercel project settings)."
  );
}

let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = {
    conn: null,
    promise: null,
  };
}

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    mongoose.set("strictQuery", true);

    cached.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}