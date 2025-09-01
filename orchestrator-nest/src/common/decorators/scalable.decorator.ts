import { applyDecorators, UseInterceptors, SetMetadata } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';

/**
 * Scalable decorator that applies caching, rate limiting, and other performance optimizations
 */
export function Scalable(options?: {
  cache?: boolean;
  cacheTTL?: number;
  rateLimit?: { ttl: number; limit: number };
  timeout?: number;
}) {
  const decorators: (MethodDecorator | ClassDecorator)[] = [];

  // Apply caching if enabled
  if (options?.cache !== false) {
    decorators.push(UseInterceptors(CacheInterceptor));
    if (options?.cacheTTL) {
      decorators.push(CacheTTL(options.cacheTTL));
    }
  }

  // Apply rate limiting if specified
  if (options?.rateLimit) {
    decorators.push(
      Throttle({ 
        default: { 
          ttl: options.rateLimit.ttl, 
          limit: options.rateLimit.limit 
        } 
      })
    );
  }

  // Apply timeout if specified
  if (options?.timeout) {
    decorators.push(SetMetadata('timeout', options.timeout));
  }

  return applyDecorators(...decorators);
}

/**
 * High performance decorator for frequently accessed endpoints
 */
export const HighPerformance = () => Scalable({
  cache: true,
  cacheTTL: 300, // 5 minutes
  rateLimit: { ttl: 60, limit: 1000 }, // 1000 requests per minute
  timeout: 10000 // 10 seconds
});

/**
 * Standard performance decorator for regular endpoints
 */
export const StandardPerformance = () => Scalable({
  cache: true,
  cacheTTL: 60, // 1 minute
  rateLimit: { ttl: 60, limit: 100 }, // 100 requests per minute
  timeout: 30000 // 30 seconds
});

/**
 * Low performance decorator for resource-intensive endpoints
 */
export const ResourceIntensive = () => Scalable({
  cache: false,
  rateLimit: { ttl: 60, limit: 10 }, // 10 requests per minute
  timeout: 60000 // 1 minute
});
