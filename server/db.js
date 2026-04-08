const mongoose = require('mongoose');

// Define Schema for AI Data Cache
// We use a simple key-value store to dump raw JSON, mimicking the local filesystem
const cacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. 'meta.json' or 'conflict-iran.json'
  data: { type: mongoose.Schema.Types.Mixed, required: true }, // The raw JSON object
  updatedAt: { type: Date, default: Date.now }
});

// Define Schema for Email Subscribers
const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subscribedAt: { type: Date, default: Date.now }
});

const Cache = mongoose.model('Cache', cacheSchema);
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('⚠️  MONGO_URI not set. Running in disk-only ephemeral mode.');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('✓ MongoDB Connected (Data persistence enabled)');
    return true;
  } catch (err) {
    console.error('✗ MongoDB Connection Error:', err.message);
    return false;
  }
}

// Helper: Save JSON blob to DB
async function dbSave(key, jsonData) {
  if (mongoose.connection.readyState !== 1) return false;
  try {
    await Cache.findOneAndUpdate(
      { key },
      { data: jsonData, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    return true;
  } catch (err) {
    console.error(`[db] Failed to save ${key}:`, err.message);
    return false;
  }
}

// Helper: Load JSON blob from DB
async function dbLoad(key) {
  if (mongoose.connection.readyState !== 1) return null;
  try {
    const doc = await Cache.findOne({ key });
    return doc ? doc.data : null;
  } catch (err) {
    console.error(`[db] Failed to load ${key}:`, err.message);
    return null;
  }
}

module.exports = { connectDB, dbSave, dbLoad, Subscriber, Cache };
