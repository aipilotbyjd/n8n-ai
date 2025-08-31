import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  uri: process.env.RABBITMQ_URL || process.env.RABBITMQ_URI || 'amqp://localhost:5672',
  queues: {
    executions: process.env.RABBITMQ_EXECUTIONS_QUEUE || 'executions',
    nodeExecution: process.env.RABBITMQ_NODE_EXECUTION_QUEUE || 'node-execution',
  },
}));
