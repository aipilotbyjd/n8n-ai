import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
  queues: {
    executions: 'executions',
    nodeExecution: 'node-execution',
  },
}));
