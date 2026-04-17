import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
};

// Create reusable Redis connection for BullMQ
export const connection = new Redis(redisConfig);
