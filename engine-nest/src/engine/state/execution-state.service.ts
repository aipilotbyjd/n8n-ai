import { Injectable } from '@nestjs/common';

@Injectable()
export class ExecutionStateService {
  private readonly results = new Map<string, any>();

  setResult(nodeId: string, result: any) {
    this.results.set(nodeId, result);
  }

  getResult(nodeId: string): any {
    return this.results.get(nodeId);
  }

  getAllResults(): Record<string, any> {
    return Object.fromEntries(this.results.entries());
  }
}
