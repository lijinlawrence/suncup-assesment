import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => {
  console.error('Redis Client Connection Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis client initiating connection...');
});

redisClient.on('ready', () => {
  console.log('Redis client connected and ready.');
});

export async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('Error connecting to Redis server:', error.message);
  }
}

export default redisClient;
