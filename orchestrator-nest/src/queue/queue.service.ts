import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface QueueJob {
  id: string;
  type: string;
  payload: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  delay: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

interface QueueOptions {
  priority?: number;
  delay?: number;
  maxAttempts?: number;
  backoff?: 'fixed' | 'exponential';
  backoffDelay?: number;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, QueueJob[]>();
  private readonly processing = new Map<string, boolean>();
  private readonly workers = new Map<string, NodeJS.Timeout>();
  private isShuttingDown = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.logger.log('Queue service initialized');
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    
    // Stop all workers
    this.workers.forEach((worker, queueName) => {
      clearInterval(worker);
      this.logger.log(`Stopped worker for queue: ${queueName}`);
    });
    
    this.workers.clear();
    this.logger.log('Queue service destroyed');
  }

  /**
   * Add a job to a queue
   */
  async add(
    queueName: string,
    type: string,
    payload: any,
    options: QueueOptions = {}
  ): Promise<string> {
    const job: QueueJob = {
      id: this.generateJobId(),
      type,
      payload,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      delay: options.delay || 0,
      createdAt: new Date(),
    };

    // Initialize queue if it doesn't exist
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
      this.processing.set(queueName, false);
    }

    const queue = this.queues.get(queueName)!;
    
    // Insert job based on priority (higher priority first)
    const insertIndex = queue.findIndex(existingJob => existingJob.priority < job.priority);
    if (insertIndex === -1) {
      queue.push(job);
    } else {
      queue.splice(insertIndex, 0, job);
    }

    this.logger.debug(`Job added to queue ${queueName}: ${job.id}`, {
      type: job.type,
      priority: job.priority,
    });

    // Start processing if not already started
    if (!this.workers.has(queueName)) {
      this.startWorker(queueName);
    }

    // Emit event
    this.eventEmitter.emit('queue.job.added', {
      queueName,
      jobId: job.id,
      type: job.type,
    });

    return job.id;
  }

  /**
   * Process jobs in a queue
   */
  private startWorker(queueName: string): void {
    const interval = this.configService.get<number>('QUEUE_POLL_INTERVAL', 1000);
    
    const worker = setInterval(async () => {
      if (this.isShuttingDown) {
        return;
      }

      await this.processQueue(queueName);
    }, interval);

    this.workers.set(queueName, worker);
    this.logger.log(`Started worker for queue: ${queueName}`);
  }

  private async processQueue(queueName: string): Promise<void> {
    if (this.processing.get(queueName) || this.isShuttingDown) {
      return;
    }

    const queue = this.queues.get(queueName);
    if (!queue || queue.length === 0) {
      return;
    }

    this.processing.set(queueName, true);

    try {
      const job = queue.shift()!;
      
      // Check if job should be delayed
      if (job.delay > 0 && Date.now() - job.createdAt.getTime() < job.delay) {
        // Put job back in queue
        queue.unshift(job);
        return;
      }

      await this.processJob(queueName, job);
    } catch (error) {
      this.logger.error(`Queue processing error for ${queueName}: ${error.message}`);
    } finally {
      this.processing.set(queueName, false);
    }
  }

  private async processJob(queueName: string, job: QueueJob): Promise<void> {
    job.attempts++;
    job.processedAt = new Date();

    this.logger.debug(`Processing job ${job.id} from queue ${queueName}`, {
      type: job.type,
      attempts: job.attempts,
    });

    try {
      // Emit processing event
      this.eventEmitter.emit('queue.job.processing', {
        queueName,
        jobId: job.id,
        type: job.type,
        attempts: job.attempts,
      });

      // Process the job based on type
      await this.executeJob(job);

      // Job completed successfully
      job.completedAt = new Date();
      
      this.eventEmitter.emit('queue.job.completed', {
        queueName,
        jobId: job.id,
        type: job.type,
        duration: job.completedAt.getTime() - job.processedAt.getTime(),
      });

      this.logger.debug(`Job completed: ${job.id}`);

    } catch (error) {
      job.error = error.message;
      job.failedAt = new Date();

      this.logger.error(`Job failed: ${job.id} - ${error.message}`);

      // Retry logic
      if (job.attempts < job.maxAttempts) {
        // Calculate backoff delay
        const backoffDelay = this.calculateBackoffDelay(job.attempts);
        job.delay = backoffDelay;
        job.createdAt = new Date(); // Reset created time for delay calculation

        // Put job back in queue for retry
        const queue = this.queues.get(queueName)!;
        queue.push(job);

        this.eventEmitter.emit('queue.job.retrying', {
          queueName,
          jobId: job.id,
          type: job.type,
          attempts: job.attempts,
          nextAttemptIn: backoffDelay,
        });

        this.logger.debug(`Job scheduled for retry: ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
      } else {
        // Max attempts reached, job failed permanently
        this.eventEmitter.emit('queue.job.failed', {
          queueName,
          jobId: job.id,
          type: job.type,
          attempts: job.attempts,
          error: error.message,
        });

        this.logger.error(`Job permanently failed: ${job.id} after ${job.attempts} attempts`);
      }
    }
  }

  private async executeJob(job: QueueJob): Promise<void> {
    // This is where specific job types would be handled
    // For now, we'll emit an event that other services can listen to
    
    switch (job.type) {
      case 'workflow.execute':
        this.eventEmitter.emit('queue.workflow.execute', job.payload);
        break;
      case 'node.execute':
        this.eventEmitter.emit('queue.node.execute', job.payload);
        break;
      case 'notification.send':
        this.eventEmitter.emit('queue.notification.send', job.payload);
        break;
      case 'cleanup.old_data':
        this.eventEmitter.emit('queue.cleanup.old_data', job.payload);
        break;
      case 'metrics.aggregate':
        this.eventEmitter.emit('queue.metrics.aggregate', job.payload);
        break;
      default:
        this.eventEmitter.emit(`queue.${job.type}`, job.payload);
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private calculateBackoffDelay(attempts: number): number {
    const baseDelay = this.configService.get<number>('QUEUE_BACKOFF_DELAY', 1000);
    const backoffType = this.configService.get<string>('QUEUE_BACKOFF_TYPE', 'exponential');

    if (backoffType === 'exponential') {
      return baseDelay * Math.pow(2, attempts - 1);
    } else {
      return baseDelay;
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getQueueStats(queueName: string): any {
    const queue = this.queues.get(queueName) || [];
    const isProcessing = this.processing.get(queueName) || false;

    return {
      name: queueName,
      pending: queue.length,
      processing: isProcessing,
      hasWorker: this.workers.has(queueName),
    };
  }

  /**
   * Get all queue statistics
   */
  getAllQueueStats(): any[] {
    const stats = [];
    
    for (const [queueName] of this.queues) {
      stats.push(this.getQueueStats(queueName));
    }

    return stats;
  }

  /**
   * Clear a queue
   */
  async clearQueue(queueName: string): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return 0;
    }

    const clearedJobs = queue.length;
    queue.length = 0;

    this.eventEmitter.emit('queue.cleared', {
      queueName,
      clearedJobs,
    });

    this.logger.log(`Cleared queue ${queueName}: ${clearedJobs} jobs removed`);
    return clearedJobs;
  }

  /**
   * Pause a queue
   */
  pauseQueue(queueName: string): void {
    const worker = this.workers.get(queueName);
    if (worker) {
      clearInterval(worker);
      this.workers.delete(queueName);
      this.logger.log(`Paused queue: ${queueName}`);
    }
  }

  /**
   * Resume a queue
   */
  resumeQueue(queueName: string): void {
    if (!this.workers.has(queueName)) {
      this.startWorker(queueName);
      this.logger.log(`Resumed queue: ${queueName}`);
    }
  }

  /**
   * Health check
   */
  getHealthStatus(): any {
    const queueStats = this.getAllQueueStats();
    const totalPending = queueStats.reduce((sum, stat) => sum + stat.pending, 0);
    const activeWorkers = this.workers.size;

    return {
      status: this.isShuttingDown ? 'shutting_down' : 'healthy',
      queues: queueStats.length,
      totalPendingJobs: totalPending,
      activeWorkers,
      isShuttingDown: this.isShuttingDown,
    };
  }
}
