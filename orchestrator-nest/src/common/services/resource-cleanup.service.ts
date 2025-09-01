import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface ManagedResource {
  id: string;
  type: 'interval' | 'timeout' | 'listener' | 'stream' | 'connection';
  resource: any;
  createdAt: Date;
  metadata?: any;
}

@Injectable()
export class ResourceCleanupService implements OnModuleDestroy {
  private readonly logger = new Logger(ResourceCleanupService.name);
  private readonly resources = new Map<string, ManagedResource>();
  private readonly cleanupCallbacks = new Map<string, () => Promise<void>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.startPeriodicCleanup();
  }

  async onModuleDestroy() {
    await this.cleanupAllResources();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Register a timer (setInterval/setTimeout) for automatic cleanup
   */
  registerTimer(timer: NodeJS.Timeout, metadata?: any): string {
    const id = this.generateResourceId();
    
    this.resources.set(id, {
      id,
      type: timer.hasRef() ? 'interval' : 'timeout',
      resource: timer,
      createdAt: new Date(),
      metadata,
    });

    return id;
  }

  /**
   * Register an event listener for automatic cleanup
   */
  registerEventListener(
    emitter: EventEmitter2 | NodeJS.EventEmitter,
    event: string,
    listener: (...args: any[]) => void,
    metadata?: any
  ): string {
    const id = this.generateResourceId();
    
    this.resources.set(id, {
      id,
      type: 'listener',
      resource: { emitter, event, listener },
      createdAt: new Date(),
      metadata,
    });

    return id;
  }

  /**
   * Register a stream or connection for cleanup
   */
  registerConnection(connection: any, cleanupCallback: () => Promise<void>, metadata?: any): string {
    const id = this.generateResourceId();
    
    this.resources.set(id, {
      id,
      type: 'connection',
      resource: connection,
      createdAt: new Date(),
      metadata,
    });

    this.cleanupCallbacks.set(id, cleanupCallback);
    return id;
  }

  /**
   * Manually cleanup a specific resource
   */
  async cleanup(resourceId: string): Promise<void> {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      this.logger.warn(`Resource not found for cleanup: ${resourceId}`);
      return;
    }

    try {
      await this.cleanupResource(resource);
      this.resources.delete(resourceId);
      this.cleanupCallbacks.delete(resourceId);
      
      this.logger.debug(`Resource cleaned up: ${resourceId} (${resource.type})`);
    } catch (error) {
      this.logger.error(`Failed to cleanup resource ${resourceId}: ${error.message}`);
    }
  }

  /**
   * Get resource statistics
   */
  getResourceStats(): any {
    const stats = {
      total: this.resources.size,
      byType: {} as Record<string, number>,
      oldResources: 0,
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const resource of this.resources.values()) {
      stats.byType[resource.type] = (stats.byType[resource.type] || 0) + 1;
      
      if (resource.createdAt < oneHourAgo) {
        stats.oldResources++;
      }
    }

    return stats;
  }

  /**
   * Force cleanup of old resources
   */
  async cleanupOldResources(maxAge: number = 3600000): Promise<number> { // 1 hour default
    const cutoffTime = new Date(Date.now() - maxAge);
    const oldResources = Array.from(this.resources.values())
      .filter(resource => resource.createdAt < cutoffTime);

    let cleanedCount = 0;
    for (const resource of oldResources) {
      await this.cleanup(resource.id);
      cleanedCount++;
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} old resources`);
    }

    return cleanedCount;
  }

  private async cleanupAllResources(): Promise<void> {
    this.logger.log(`Cleaning up ${this.resources.size} managed resources...`);
    
    const cleanupPromises = Array.from(this.resources.keys()).map(id => this.cleanup(id));
    await Promise.all(cleanupPromises);
    
    this.logger.log('All resources cleaned up');
  }

  private async cleanupResource(resource: ManagedResource): Promise<void> {
    switch (resource.type) {
      case 'interval':
      case 'timeout':
        clearInterval(resource.resource);
        clearTimeout(resource.resource);
        break;

      case 'listener':
        const { emitter, event, listener } = resource.resource;
        if (typeof emitter.removeListener === 'function') {
          emitter.removeListener(event, listener);
        } else if (typeof emitter.off === 'function') {
          emitter.off(event, listener);
        }
        break;

      case 'connection':
        const cleanupCallback = this.cleanupCallbacks.get(resource.id);
        if (cleanupCallback) {
          await cleanupCallback();
        } else if (resource.resource && typeof resource.resource.close === 'function') {
          await resource.resource.close();
        } else if (resource.resource && typeof resource.resource.destroy === 'function') {
          resource.resource.destroy();
        }
        break;

      case 'stream':
        if (resource.resource && typeof resource.resource.destroy === 'function') {
          resource.resource.destroy();
        } else if (resource.resource && typeof resource.resource.close === 'function') {
          await resource.resource.close();
        }
        break;
    }
  }

  private startPeriodicCleanup(): void {
    // Clean up old resources every 30 minutes
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupOldResources();
        
        // Log resource stats
        const stats = this.getResourceStats();
        if (stats.total > 100) { // Warn if too many resources
          this.logger.warn(`High resource count detected: ${JSON.stringify(stats)}`);
        }
      } catch (error) {
        this.logger.error(`Periodic cleanup failed: ${error.message}`);
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Register this cleanup interval for its own cleanup
    this.resources.set('cleanup-interval', {
      id: 'cleanup-interval',
      type: 'interval',
      resource: this.cleanupInterval,
      createdAt: new Date(),
      metadata: { system: true },
    });
  }

  private generateResourceId(): string {
    return `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check for resource management
   */
  getHealthStatus(): any {
    const stats = this.getResourceStats();
    const isHealthy = stats.total < 1000 && stats.oldResources < 100;

    return {
      status: isHealthy ? 'healthy' : 'warning',
      resourceCount: stats.total,
      oldResourceCount: stats.oldResources,
      resourcesByType: stats.byType,
      warnings: stats.total > 500 ? ['High resource count'] : [],
      lastCleanup: new Date().toISOString(),
    };
  }
}
