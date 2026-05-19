import mongoose from 'mongoose';

const FeedItemSchema = new mongoose.Schema({
  coachName: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['Strength', 'Nutrition', 'Mindset', 'Recovery', 'Technique', 'General'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const FeedItem = mongoose.model('FeedItem', FeedItemSchema);

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coaching_feed';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
}
