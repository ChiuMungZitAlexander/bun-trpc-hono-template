import { getRedisClient } from "./redis";

const SESSION_PREFIX = "sess:";

const redisClient = getRedisClient();

export const createSession = async (
  sessionId: string,
  userId: string,
  data: any,
  ttl = 60 * 60
) => {
  const key = SESSION_PREFIX + sessionId;

  await redisClient.set(key, JSON.stringify({ userId, data }), { EX: ttl });
};

export const getSession = async (sessionId: string) => {
  const data = await redisClient.get(SESSION_PREFIX + sessionId);

  return data ? JSON.parse(data) : null;
};

export const destroySession = async (sessionId: string) => {
  const key = SESSION_PREFIX + sessionId;

  await redisClient.del(key);
};
