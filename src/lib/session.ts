import { getRedisClient } from "./redis";

const SESSION_PREFIX = "sess:";

const redisClient = getRedisClient();

interface ISessionData {
  userId: string;
}

export const createSession = async (
  sessionId: string,
  data: ISessionData,
  ttl = 60 * 60
) => {
  const key = SESSION_PREFIX + sessionId;

  await redisClient.set(key, JSON.stringify({ data }), { EX: ttl });
};

export const getSession = async (
  sessionId?: string | null
): Promise<ISessionData | null> => {
  if (!sessionId) return null;

  const data = await redisClient.get(SESSION_PREFIX + sessionId);

  return data ? (JSON.parse(data) as ISessionData) : null;
};

export const destroySession = async (sessionId: string) => {
  const key = SESSION_PREFIX + sessionId;

  await redisClient.del(key);
};
