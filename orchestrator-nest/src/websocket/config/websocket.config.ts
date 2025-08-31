import { registerAs } from '@nestjs/config';

export default registerAs('websocket', () => ({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/workflow',
  transports: ['websocket', 'polling'],
  pingTimeout: parseInt(process.env.WS_PING_TIMEOUT) || 60000,
  pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 25000,
  upgradeTimeout: parseInt(process.env.WS_UPGRADE_TIMEOUT) || 10000,
  maxHttpBufferSize: parseInt(process.env.WS_MAX_HTTP_BUFFER_SIZE) || 1e6,
  allowEIO3: process.env.WS_ALLOW_EIO3 === 'true',
  cleanupInterval: parseInt(process.env.WS_CLEANUP_INTERVAL) || 300000, // 5 minutes
  metricsInterval: parseInt(process.env.WS_METRICS_INTERVAL) || 60000, // 1 minute
  rateLimits: {
    subscribe: { limit: 10, ttl: 60000 }, // 10 subscriptions per minute
    unsubscribe: { limit: 20, ttl: 60000 }, // 20 unsubscriptions per minute
    ping: { limit: 30, ttl: 60000 }, // 30 pings per minute
    status: { limit: 10, ttl: 60000 }, // 10 status requests per minute
  },
}));