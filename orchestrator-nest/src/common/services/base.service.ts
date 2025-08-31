import { Logger, Injectable } from '@nestjs/common';
import { Repository, FindManyOptions, FindOptionsWhere, SelectQueryBuilder } from 'typeorm';
import { 
  BaseEntity, 
  PaginationOptions, 
  PaginatedResult, 
  FilterOptions,
  BaseAppError,
  ErrorFactory,
  ValidationError,
  ResourceNotFoundError,
  DatabaseError,
} from '@n8n-work/shared';
import { validateSchema, PaginationOptionsSchema, FilterOptionsSchema } from '@n8n-work/shared';

@Injectable()
export abstract class BaseService<T extends BaseEntity> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly repository: Repository<T>,
    protected readonly entityName: string
  ) {}

  /**
   * Find a single entity by ID
   */
  async findById(id: string, options?: { relations?: string[] }): Promise<T> {
    try {
      const entity = await this.repository.findOne({
        where: { id } as FindOptionsWhere<T>,
        relations: options?.relations,
      });

      if (!entity) {
        throw ErrorFactory.createResourceNotFoundError(this.entityName, id);
      }

      return entity;
    } catch (error) {
      this.handleError(error, `Failed to find ${this.entityName} by ID: ${id}`);
    }
  }

  /**
   * Find entities with pagination and filtering
   */
  async findMany(
    paginationOptions: PaginationOptions,
    filterOptions?: FilterOptions,
    options?: { relations?: string[] }
  ): Promise<PaginatedResult<T>> {
    try {
      // Validate pagination options
      const validatedPagination = validateSchema(PaginationOptionsSchema, paginationOptions);
      
      // Validate filter options if provided
      const validatedFilters = filterOptions 
        ? validateSchema(FilterOptionsSchema, filterOptions)
        : undefined;

      // Build query
      const queryBuilder = this.buildQuery(validatedFilters, options?.relations);
      
      // Apply pagination
      const offset = (validatedPagination.page - 1) * validatedPagination.limit;
      queryBuilder.skip(offset).take(validatedPagination.limit);

      // Apply sorting
      if (validatedPagination.sortBy) {
        queryBuilder.orderBy(
          `${this.repository.metadata.targetName}.${validatedPagination.sortBy}`,
          validatedPagination.sortOrder
        );
      } else {
        queryBuilder.orderBy(
          `${this.repository.metadata.targetName}.createdAt`,
          'DESC'
        );
      }

      // Execute query
      const [data, total] = await queryBuilder.getManyAndCount();

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / validatedPagination.limit);
      const hasNext = validatedPagination.page < totalPages;
      const hasPrev = validatedPagination.page > 1;

      return {
        data,
        pagination: {
          page: validatedPagination.page,
          limit: validatedPagination.limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      this.handleError(error, `Failed to find ${this.entityName} list`);
    }
  }

  /**
   * Create a new entity
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const entity = this.repository.create(data);
      const savedEntity = await this.repository.save(entity);
      
      this.logger.log(`Created ${this.entityName} with ID: ${savedEntity.id}`);
      return savedEntity;
    } catch (error) {
      this.handleError(error, `Failed to create ${this.entityName}`);
    }
  }

  /**
   * Update an existing entity
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const entity = await this.findById(id);
      
      // Update entity with new data
      Object.assign(entity, data);
      const updatedEntity = await this.repository.save(entity);
      
      this.logger.log(`Updated ${this.entityName} with ID: ${id}`);
      return updatedEntity;
    } catch (error) {
      this.handleError(error, `Failed to update ${this.entityName} with ID: ${id}`);
    }
  }

  /**
   * Delete an entity (soft delete if supported)
   */
  async delete(id: string): Promise<void> {
    try {
      const entity = await this.findById(id);
      
      // Check if entity supports soft delete
      if ('deletedAt' in entity) {
        // Soft delete
        await this.repository.update(id, { deletedAt: new Date() } as any);
        this.logger.log(`Soft deleted ${this.entityName} with ID: ${id}`);
      } else {
        // Hard delete
        await this.repository.remove(entity);
        this.logger.log(`Hard deleted ${this.entityName} with ID: ${id}`);
      }
    } catch (error) {
      this.handleError(error, `Failed to delete ${this.entityName} with ID: ${id}`);
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({
        where: { id } as FindOptionsWhere<T>,
      });
      return count > 0;
    } catch (error) {
      this.handleError(error, `Failed to check existence of ${this.entityName} with ID: ${id}`);
    }
  }

  /**
   * Count entities with optional filters
   */
  async count(filterOptions?: FilterOptions): Promise<number> {
    try {
      const validatedFilters = filterOptions 
        ? validateSchema(FilterOptionsSchema, filterOptions)
        : undefined;

      const queryBuilder = this.buildQuery(validatedFilters);
      return await queryBuilder.getCount();
    } catch (error) {
      this.handleError(error, `Failed to count ${this.entityName}`);
    }
  }

  /**
   * Find entities by specific criteria
   */
  async findBy(
    criteria: FindOptionsWhere<T>,
    options?: { relations?: string[]; order?: Record<string, 'ASC' | 'DESC'> }
  ): Promise<T[]> {
    try {
      const findOptions: FindManyOptions<T> = {
        where: criteria,
        relations: options?.relations,
      };

      if (options?.order) {
        findOptions.order = options.order;
      }

      return await this.repository.find(findOptions);
    } catch (error) {
      this.handleError(error, `Failed to find ${this.entityName} by criteria`);
    }
  }

  /**
   * Find one entity by specific criteria
   */
  async findOneBy(
    criteria: FindOptionsWhere<T>,
    options?: { relations?: string[] }
  ): Promise<T | null> {
    try {
      return await this.repository.findOne({
        where: criteria,
        relations: options?.relations,
      });
    } catch (error) {
      this.handleError(error, `Failed to find ${this.entityName} by criteria`);
    }
  }

  /**
   * Bulk create entities
   */
  async bulkCreate(data: Partial<T>[]): Promise<T[]> {
    try {
      const entities = data.map(item => this.repository.create(item));
      const savedEntities = await this.repository.save(entities);
      
      this.logger.log(`Bulk created ${savedEntities.length} ${this.entityName} entities`);
      return savedEntities;
    } catch (error) {
      this.handleError(error, `Failed to bulk create ${this.entityName} entities`);
    }
  }

  /**
   * Bulk update entities
   */
  async bulkUpdate(criteria: FindOptionsWhere<T>, data: Partial<T>): Promise<number> {
    try {
      const result = await this.repository.update(criteria, data);
      
      this.logger.log(`Bulk updated ${result.affected} ${this.entityName} entities`);
      return result.affected || 0;
    } catch (error) {
      this.handleError(error, `Failed to bulk update ${this.entityName} entities`);
    }
  }

  /**
   * Bulk delete entities
   */
  async bulkDelete(criteria: FindOptionsWhere<T>): Promise<number> {
    try {
      const result = await this.repository.delete(criteria);
      
      this.logger.log(`Bulk deleted ${result.affected} ${this.entityName} entities`);
      return result.affected || 0;
    } catch (error) {
      this.handleError(error, `Failed to bulk delete ${this.entityName} entities`);
    }
  }

  /**
   * Build query with filters
   */
  protected buildQuery(
    filterOptions?: FilterOptions,
    relations?: string[]
  ): SelectQueryBuilder<T> {
    const queryBuilder = this.repository.createQueryBuilder(this.getAlias());

    // Add relations
    if (relations) {
      relations.forEach(relation => {
        queryBuilder.leftJoinAndSelect(`${this.getAlias()}.${relation}`, relation);
      });
    }

    // Apply filters
    if (filterOptions) {
      this.applyFilters(queryBuilder, filterOptions);
    }

    return queryBuilder;
  }

  /**
   * Apply filters to query builder
   */
  protected applyFilters(
    queryBuilder: SelectQueryBuilder<T>,
    filters: FilterOptions
  ): void {
    const alias = this.getAlias();

    // Search filter
    if (filters.search) {
      queryBuilder.andWhere(
        `LOWER(${alias}.name) LIKE LOWER(:search) OR LOWER(${alias}.description) LIKE LOWER(:search)`,
        { search: `%${filters.search}%` }
      );
    }

    // Status filter
    if (filters.status) {
      queryBuilder.andWhere(`${alias}.status = :status`, { status: filters.status });
    }

    // Date range filters
    if (filters.dateFrom) {
      queryBuilder.andWhere(`${alias}.createdAt >= :dateFrom`, { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere(`${alias}.createdAt <= :dateTo`, { dateTo: filters.dateTo });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere(`${alias}.tags @> :tags`, { tags: filters.tags });
    }

    // Custom filters
    this.applyCustomFilters(queryBuilder, filters);
  }

  /**
   * Apply custom filters - override in subclasses
   */
  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<T>,
    filters: FilterOptions
  ): void {
    // Override in subclasses to add custom filters
  }

  /**
   * Get query alias
   */
  protected getAlias(): string {
    return this.repository.metadata.targetName.toLowerCase();
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: unknown, context: string): never {
    this.logger.error(`${context}: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof BaseAppError) {
      throw error;
    }

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('duplicate key')) {
        throw ErrorFactory.createResourceConflictError('Resource already exists');
      }

      if (error.message.includes('foreign key')) {
        throw ErrorFactory.createResourceNotFoundError('Referenced resource not found');
      }

      if (error.message.includes('not null')) {
        throw ErrorFactory.createValidationError('Required field is missing');
      }

      // Generic database error
      throw ErrorFactory.createDatabaseError(error.message);
    }

    // Unknown error
    throw ErrorFactory.createDatabaseError('An unexpected error occurred');
  }

  /**
   * Validate entity data
   */
  protected validateEntityData(data: Partial<T>): void {
    // Override in subclasses to add validation logic
  }

  /**
   * Transform entity data before saving
   */
  protected transformEntityData(data: Partial<T>): Partial<T> {
    // Override in subclasses to add transformation logic
    return data;
  }

  /**
   * Transform entity data after loading
   */
  protected transformEntityResponse(entity: T): T {
    // Override in subclasses to add transformation logic
    return entity;
  }
}