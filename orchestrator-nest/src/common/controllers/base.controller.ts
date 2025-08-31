import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { 
  BaseEntity, 
  PaginationOptions, 
  PaginatedResult, 
  FilterOptions,
  BaseAppError,
  ErrorFactory,
  ValidationError,
  ResourceNotFoundError,
  API_PREFIX,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from '@n8n-work/shared';
import { validateSchema, PaginationOptionsSchema, FilterOptionsSchema } from '@n8n-work/shared';
import { BaseService } from '../services/base.service';

export interface BaseControllerOptions<T extends BaseEntity> {
  entityName: string;
  route: string;
  createDto?: any;
  updateDto?: any;
  listDto?: any;
  responseDto?: any;
  guards?: any[];
  swaggerTag?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    timestamp: string;
    correlationId: string;
    version: string;
  };
}

@Controller()
export abstract class BaseController<T extends BaseEntity> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly service: BaseService<T>,
    protected readonly options: BaseControllerOptions<T>
  ) {}

  @Get()
  @ApiOperation({ summary: `Get list of ${this.options.entityName}s` })
  @ApiResponse({ 
    status: 200, 
    description: `List of ${this.options.entityName}s retrieved successfully` 
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(
    @Query() query: any,
    @Request() req: any
  ): Promise<ApiResponse<T[]>> {
    try {
      // Parse and validate pagination options
      const paginationOptions: PaginationOptions = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 20,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder || 'DESC',
      };

      // Parse and validate filter options
      const filterOptions: FilterOptions = {
        search: query.search,
        status: query.status,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        tags: query.tags ? query.tags.split(',') : undefined,
      };

      // Get data from service
      const result = await this.service.findMany(paginationOptions, filterOptions);

      return this.formatResponse({
        data: result.data,
        pagination: result.pagination,
        message: `${this.options.entityName}s retrieved successfully`,
        correlationId: req.headers['x-correlation-id'] || req.correlationId,
      });
    } catch (error) {
      this.handleError(error, `Failed to get ${this.options.entityName} list`);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: `Get ${this.options.entityName} by ID` })
  @ApiResponse({ 
    status: 200, 
    description: `${this.options.entityName} retrieved successfully` 
  })
  @ApiResponse({ 
    status: 404, 
    description: `${this.options.entityName} not found` 
  })
  @ApiParam({ name: 'id', description: `${this.options.entityName} ID` })
  async findOne(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<ApiResponse<T>> {
    try {
      const entity = await this.service.findById(id);
      
      return this.formatResponse({
        data: entity,
        message: `${this.options.entityName} retrieved successfully`,
        correlationId: req.headers['x-correlation-id'] || req.correlationId,
      });
    } catch (error) {
      this.handleError(error, `Failed to get ${this.options.entityName} with ID: ${id}`);
    }
  }

  @Post()
  @HttpCode(HTTP_STATUS.CREATED)
  @ApiOperation({ summary: `Create new ${this.options.entityName}` })
  @ApiResponse({ 
    status: 201, 
    description: `${this.options.entityName} created successfully` 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Validation error' 
  })
  async create(
    @Body() createDto: any,
    @Request() req: any
  ): Promise<ApiResponse<T>> {
    try {
      // Validate DTO if provided
      if (this.options.createDto) {
        createDto = validateSchema(this.options.createDto, createDto);
      }

      // Transform data if needed
      const transformedData = this.transformCreateData(createDto, req);

      // Create entity
      const entity = await this.service.create(transformedData);

      return this.formatResponse({
        data: entity,
        message: SUCCESS_MESSAGES.CREATED,
        correlationId: req.headers['x-correlation-id'] || req.correlationId,
      });
    } catch (error) {
      this.handleError(error, `Failed to create ${this.options.entityName}`);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: `Update ${this.options.entityName}` })
  @ApiResponse({ 
    status: 200, 
    description: `${this.options.entityName} updated successfully` 
  })
  @ApiResponse({ 
    status: 404, 
    description: `${this.options.entityName} not found` 
  })
  @ApiParam({ name: 'id', description: `${this.options.entityName} ID` })
  async update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req: any
  ): Promise<ApiResponse<T>> {
    try {
      // Validate DTO if provided
      if (this.options.updateDto) {
        updateDto = validateSchema(this.options.updateDto, updateDto);
      }

      // Transform data if needed
      const transformedData = this.transformUpdateData(updateDto, req);

      // Update entity
      const entity = await this.service.update(id, transformedData);

      return this.formatResponse({
        data: entity,
        message: SUCCESS_MESSAGES.UPDATED,
        correlationId: req.headers['x-correlation-id'] || req.correlationId,
      });
    } catch (error) {
      this.handleError(error, `Failed to update ${this.options.entityName} with ID: ${id}`);
    }
  }

  @Delete(':id')
  @HttpCode(HTTP_STATUS.NO_CONTENT)
  @ApiOperation({ summary: `Delete ${this.options.entityName}` })
  @ApiResponse({ 
    status: 204, 
    description: `${this.options.entityName} deleted successfully` 
  })
  @ApiResponse({ 
    status: 404, 
    description: `${this.options.entityName} not found` 
  })
  @ApiParam({ name: 'id', description: `${this.options.entityName} ID` })
  async remove(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<void> {
    try {
      await this.service.delete(id);
      
      this.logger.log(`${this.options.entityName} with ID ${id} deleted successfully`);
    } catch (error) {
      this.handleError(error, `Failed to delete ${this.options.entityName} with ID: ${id}`);
    }
  }

  @Post(':id/activate')
  @ApiOperation({ summary: `Activate ${this.options.entityName}` })
  @ApiResponse({ 
    status: 200, 
    description: `${this.options.entityName} activated successfully` 
  })
  @ApiParam({ name: 'id', description: `${this.options.entityName} ID` })
  async activate(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<ApiResponse<T>> {
    try {
      const entity = await this.service.update(id, { isActive: true } as any);

      return this.formatResponse({
        data: entity,
        message: SUCCESS_MESSAGES.ACTIVATED,
        correlationId: req.headers['x-correlation-id'] || req.correlationId,
      });
    } catch (error) {
      this.handleError(error, `Failed to activate ${this.options.entityName} with ID: ${id}`);
    }
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: `Deactivate ${this.options.entityName}` })
  @ApiResponse({ 
    status: 200, 
    description: `${this.options.entityName} deactivated successfully` 
  })
  @ApiParam({ name: 'id', description: `${this.options.entityName} ID` })
  async deactivate(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<ApiResponse<T>> {
    try {
      const entity = await this.service.update(id, { isActive: false } as any);

      return this.formatResponse({
        data: entity,
        message: SUCCESS_MESSAGES.DEACTIVATED,
        correlationId: req.headers['x-correlation-id'] || req.correlationId,
      });
    } catch (error) {
      this.handleError(error, `Failed to deactivate ${this.options.entityName} with ID: ${id}`);
    }
  }

  @Get(':id/exists')
  @ApiOperation({ summary: `Check if ${this.options.entityName} exists` })
  @ApiResponse({ 
    status: 200, 
    description: 'Existence check completed' 
  })
  @ApiParam({ name: 'id', description: `${this.options.entityName} ID` })
  async exists(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<ApiResponse<{ exists: boolean }>> {
    try {
      const exists = await this.service.exists(id);

      return this.formatResponse({
        data: { exists },
        message: 'Existence check completed',
        correlationId: req.headers['x-correlation-id'] || req.correlationId,
      });
    } catch (error) {
      this.handleError(error, `Failed to check existence of ${this.options.entityName} with ID: ${id}`);
    }
  }

  /**
   * Format API response consistently
   */
  protected formatResponse(options: {
    data?: any;
    message?: string;
    pagination?: any;
    correlationId?: string;
  }): ApiResponse {
    return {
      success: true,
      data: options.data,
      message: options.message,
      pagination: options.pagination,
      meta: {
        timestamp: new Date().toISOString(),
        correlationId: options.correlationId || this.generateCorrelationId(),
        version: process.env.APP_VERSION || '1.0.0',
      },
    };
  }

  /**
   * Transform create data - override in subclasses
   */
  protected transformCreateData(data: any, req: any): any {
    // Add common fields
    return {
      ...data,
      createdBy: req.user?.id,
      tenantId: req.user?.tenantId,
    };
  }

  /**
   * Transform update data - override in subclasses
   */
  protected transformUpdateData(data: any, req: any): any {
    // Add common fields
    return {
      ...data,
      updatedBy: req.user?.id,
    };
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

      // Generic error
      throw ErrorFactory.createDatabaseError(error.message);
    }

    // Unknown error
    throw ErrorFactory.createDatabaseError('An unexpected error occurred');
  }

  /**
   * Generate correlation ID
   */
  protected generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get route prefix
   */
  protected getRoutePrefix(): string {
    return `${API_PREFIX}${this.options.route}`;
  }

  /**
   * Apply guards if specified
   */
  protected applyGuards(): any[] {
    return this.options.guards || [];
  }
}