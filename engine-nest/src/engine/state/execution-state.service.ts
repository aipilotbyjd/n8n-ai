import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExecutionState } from '@n8n-work/contracts';

@Injectable()
export class ExecutionStateService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async getExecutionState(executionId: string): Promise<ExecutionState | null> {
    const key = `execution:${executionId}`;
    const result = await this.cacheManager.get<ExecutionState>(key);
    return result || null;
  }

  async setExecutionState(executionId: string, state: ExecutionState): Promise<void> {
    const key = `execution:${executionId}`;
    await this.cacheManager.set(key, state, 3600); // 1 hour TTL
  }

  async updateExecutionState(executionId: string, updates: Partial<ExecutionState>): Promise<void> {
    const currentState = await this.getExecutionState(executionId);
    if (currentState) {
      const updatedState = { ...currentState, ...updates };
      await this.setExecutionState(executionId, updatedState);
    }
  }

  async deleteExecutionState(executionId: string): Promise<void> {
    const key = `execution:${executionId}`;
    await this.cacheManager.del(key);
  }

  async listActiveExecutions(): Promise<string[]> {
    // This is a simplified implementation
    // In a real scenario, you might want to use Redis SCAN or maintain a separate index
    return [];
  }
}
