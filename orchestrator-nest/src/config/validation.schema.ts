import * as Joi from 'joi';

export default Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_VERSION: Joi.string().default('1.0.0'),

  // Database
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_URI: Joi.string().optional(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().default(0),
  REDIS_URI: Joi.string().optional(),

  // RabbitMQ
  RABBITMQ_HOST: Joi.string().default('localhost'),
  RABBITMQ_PORT: Joi.number().default(5672),
  RABBITMQ_USER: Joi.string().default('guest'),
  RABBITMQ_PASSWORD: Joi.string().default('guest'),
  RABBITMQ_VHOST: Joi.string().default('/'),
  RABBITMQ_URI: Joi.string().optional(),
  RABBITMQ_QUEUES_EXECUTIONS: Joi.string().default('executions'),
  RABBITMQ_QUEUES_NODE_RUNNER: Joi.string().default('node_runner'),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_SECRET: Joi.string().optional(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Security
  BCRYPT_ROUNDS: Joi.number().default(12),
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // CORS
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),

  // Monitoring
  ENABLE_METRICS: Joi.boolean().default(true),
  ENABLE_TRACING: Joi.boolean().default(true),

  // External Services
  ENGINE_SERVICE_URL: Joi.string().optional(),
  NODE_RUNNER_SERVICE_URL: Joi.string().optional(),

  // File Storage
  STORAGE_TYPE: Joi.string().valid('local', 's3', 'gcs').default('local'),
  STORAGE_PATH: Joi.string().default('./uploads'),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_REGION: Joi.string().optional(),
  AWS_S3_BUCKET: Joi.string().optional(),

  // Email
  EMAIL_HOST: Joi.string().optional(),
  EMAIL_PORT: Joi.number().optional(),
  EMAIL_USER: Joi.string().optional(),
  EMAIL_PASSWORD: Joi.string().optional(),
  EMAIL_FROM: Joi.string().optional(),

  // Webhooks
  WEBHOOK_SECRET: Joi.string().optional(),
  WEBHOOK_TIMEOUT: Joi.number().default(30000),

  // Scheduling
  SCHEDULER_ENABLED: Joi.boolean().default(true),
  SCHEDULER_INTERVAL: Joi.number().default(60000),

  // Cache
  CACHE_TTL: Joi.number().default(300),
  CACHE_MAX_ITEMS: Joi.number().default(1000),

  // Rate Limiting
  RATE_LIMIT_WINDOW: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: Joi.boolean().default(false),

  // Database Connection Pool
  DATABASE_POOL_MIN: Joi.number().default(1),
  DATABASE_POOL_MAX: Joi.number().default(10),
  DATABASE_POOL_IDLE_TIMEOUT: Joi.number().default(30000),

  // Redis Connection Pool
  REDIS_POOL_MIN: Joi.number().default(1),
  REDIS_POOL_MAX: Joi.number().default(10),

  // RabbitMQ Connection
  RABBITMQ_PREFETCH_COUNT: Joi.number().default(1),
  RABBITMQ_RECONNECT_TIME_IN_MS: Joi.number().default(5000),
  RABBITMQ_HEARTBEAT_INTERVAL_IN_SECONDS: Joi.number().default(60),

  // Health Checks
  HEALTH_CHECK_TIMEOUT: Joi.number().default(5000),
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),

  // Metrics
  METRICS_PORT: Joi.number().default(9090),
  METRICS_PATH: Joi.string().default('/metrics'),

  // Tracing
  TRACING_SERVICE_NAME: Joi.string().default('n8n-work-orchestrator'),
  TRACING_SERVICE_VERSION: Joi.string().default('1.0.0'),
  TRACING_ENDPOINT: Joi.string().optional(),

  // Feature Flags
  FEATURE_AI_AGENTS: Joi.boolean().default(false),
  FEATURE_PLUGIN_MARKETPLACE: Joi.boolean().default(false),
  FEATURE_ADVANCED_MONITORING: Joi.boolean().default(false),
  FEATURE_MULTI_TENANCY: Joi.boolean().default(true),

  // Limits
  MAX_WORKFLOWS_PER_TENANT: Joi.number().default(1000),
  MAX_EXECUTIONS_PER_WORKFLOW: Joi.number().default(10000),
  MAX_NODES_PER_WORKFLOW: Joi.number().default(100),
  MAX_WEBHOOKS_PER_WORKFLOW: Joi.number().default(10),

  // Timeouts
  WORKFLOW_EXECUTION_TIMEOUT: Joi.number().default(300000), // 5 minutes
  NODE_EXECUTION_TIMEOUT: Joi.number().default(30000), // 30 seconds
  WEBHOOK_TIMEOUT: Joi.number().default(30000), // 30 seconds

  // Retention
  EXECUTION_LOG_RETENTION_DAYS: Joi.number().default(30),
  AUDIT_LOG_RETENTION_DAYS: Joi.number().default(90),
  TEMP_FILE_RETENTION_HOURS: Joi.number().default(24),
});
