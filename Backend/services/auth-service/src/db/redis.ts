import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => console.error('[auth-service] Redis error', err));
redis.on('connect', () => console.log('[auth-service] Redis connected'));

export default redis;
