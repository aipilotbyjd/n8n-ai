import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ExecutionStateService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async setResult(nodeId: string, result: any) {
    await this.cacheManager.set(nodeId, result);
  }

  async getResult(nodeId: string): Promise<any> {
    return await this.cacheManager.get(nodeId);
  }

  async getAllResults(): Promise<Record<string, any>> {
    const keys = await this.cacheManager.store.keys();
    const results = {};
    for (const key of keys) {
      results[key] = await this.cacheManager.get(key);
    }
    return results;
  }
}
