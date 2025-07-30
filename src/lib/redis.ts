import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL!,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const initRedis = async () => {
  await redisClient.connect();
};

export const getRedisClient = () => {
  return redisClient;
};
