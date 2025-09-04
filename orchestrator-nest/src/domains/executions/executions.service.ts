import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution } from './entities/execution.entity';

@Injectable()
export class ExecutionsService {
  private readonly logger = new Logger(ExecutionsService.name);

  constructor(
    @InjectRepository(Execution)
    private readonly executionRepository: Repository<Execution>,
  ) {}

  async findOne(id: string): Promise<Execution | null> {
    return this.executionRepository.findOne({ where: { id } });
  }

  async create(executionData: Partial<Execution>): Promise<Execution> {
    const execution = this.executionRepository.create(executionData);
    return this.executionRepository.save(execution);
  }

  async update(id: string, updateData: Partial<Execution>): Promise<Execution | null> {
    await this.executionRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.executionRepository.delete(id);
  }
}