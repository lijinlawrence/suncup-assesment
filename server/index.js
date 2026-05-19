import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB, FeedItem } from './db.js';
import redisClient, { connectRedis } from './redisClient.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for testing/assessment simplicity
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Basic sanity check route
app.get('/', (req, res) => {
  res.json({ message: 'Coaching Feed Server is running.' });
});

/**
 * GET /feed
 * Retrieves coaching feed items. Checks Redis cache first.
 * If cache miss, queries MongoDB, caches the results for 60 seconds, and returns them.
 */
app.get('/feed', async (req, res) => {
  try {
    const cacheKey = 'feed_cache';
    console.log('[GET /feed] Checking Redis cache...');
    
    let cachedData;
    try {
      if (redisClient.isOpen) {
        cachedData = await redisClient.get(cacheKey);
      }
    } catch (redisErr) {
      console.error('[GET /feed] Redis get error:', redisErr.message);
    }

    if (cachedData) {
      console.log('[GET /feed] Cache HIT! Serving from Redis cache.');
      res.setHeader('X-Cache-Source', 'Redis Cache');
      return res.status(200).json({
        source: 'cache',
        data: JSON.parse(cachedData)
      });
    }

    console.log('[GET /feed] Cache MISS! Fetching from MongoDB...');
    const feedItems = await FeedItem.find().sort({ createdAt: -1 }).limit(50);
    
    // Store in Redis cache with an expiration of 60 seconds (TTL)
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, 60, JSON.stringify(feedItems));
        console.log('[GET /feed] Successfully cached results in Redis.');
      }
    } catch (redisErr) {
      console.error('[GET /feed] Redis set error:', redisErr.message);
    }

    res.setHeader('X-Cache-Source', 'MongoDB Database');
    return res.status(200).json({
      source: 'database',
      data: feedItems
    });
  } catch (error) {
    console.error('[GET /feed] Error retrieving feed:', error);
    return res.status(500).json({ error: 'Failed to retrieve feed items.' });
  }
});

/**
 * POST /feed
 * Creates a new coaching feed item, invalidates the Redis cache, and emits the event via Socket.io.
 */
app.post('/feed', async (req, res) => {
  try {
    const { coachName, content, category } = req.body;

    // Validation
    if (!coachName || !content || !category) {
      return res.status(400).json({ error: 'coachName, content, and category are required fields.' });
    }

    console.log('[POST /feed] Saving new feed item to MongoDB...');
    const newItem = new FeedItem({ coachName, content, category });
    await newItem.save();
    console.log(`[POST /feed] Saved successfully with ID: ${newItem._id}`);

    // Invalidate Redis cache
    try {
      if (redisClient.isOpen) {
        await redisClient.del('feed_cache');
        console.log('[POST /feed] Redis cache invalidated.');
      }
    } catch (redisErr) {
      console.error('[POST /feed] Redis invalidation error:', redisErr.message);
    }

    // Emit live WebSocket update to all connected clients
    console.log('[POST /feed] Broadcasting new_feed_item event to clients...');
    io.emit('new_feed_item', newItem);

    return res.status(201).json({
      message: 'Feed item created successfully.',
      data: newItem
    });
  } catch (error) {
    console.error('[POST /feed] Error creating feed item:', error);
    return res.status(500).json({ error: 'Failed to create feed item.' });
  }
});

// Create HTTP and Socket.IO server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Prevent duplicate event handlers by keeping it simple
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] Client disconnected: ${socket.id} (Reason: ${reason})`);
  });
});

// Start DB & Cache, then start server
async function startServer() {
  await connectDB();
  await connectRedis();
  
  httpServer.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`  Server is running on port ${PORT}          `);
    console.log(`  WebSocket Server initialized               `);
    console.log(`=============================================`);
  });
}

startServer();
