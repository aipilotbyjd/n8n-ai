import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { WorkflowsService } from "./workflows.service";
import { CreateWorkflowDto } from "./dto/create-workflow.dto";
import { UpdateWorkflowDto } from "./dto/update-workflow.dto";
import { ListWorkflowsDto } from "./dto/list-workflows.dto";
import { Workflow } from "./entities/workflow.entity";
import { AuthUser } from "../auth/interfaces/auth-user.interface";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";



@ApiTags("Workflows")
@Controller({ path: "workflows", version: "1" })
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new workflow",
    description: "Creates a new workflow with the provided configuration",
  })
  @ApiBody({
    type: CreateWorkflowDto,
    description: "Workflow configuration",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Workflow created successfully",
    type: Workflow,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid workflow configuration",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Insufficient permissions",
  })
  async createWorkflow(
    @Body() createWorkflowDto: CreateWorkflowDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Workflow> {
    try {
      return await this.workflowsService.create(createWorkflowDto, user);
    } catch (error) {
      if (error.message.includes("already exists")) {
        throw new BadRequestException("Workflow with this name already exists");
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: "List workflows",
    description:
      "Retrieves a paginated list of workflows for the current tenant",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (starts from 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of workflows per page",
    example: 20,
  })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    description: "Filter by workflow status",
    example: "active",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search workflows by name or description",
    example: "customer onboarding",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of workflows retrieved successfully",
    type: [Workflow],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async listWorkflows(
    @Query() query: ListWorkflowsDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{
    data: Workflow[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.workflowsService.findAll(query, user);
    return {
      data: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get workflow by ID",
    description: "Retrieves a specific workflow by its unique identifier",
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Workflow UUID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Workflow retrieved successfully",
    type: Workflow,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Workflow not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async getWorkflow(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Workflow> {
    const workflow = await this.workflowsService.findOne(id, user);
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update workflow",
    description: "Updates an existing workflow with new configuration",
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Workflow UUID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({
    type: UpdateWorkflowDto,
    description: "Updated workflow configuration",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Workflow updated successfully",
    type: Workflow,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Workflow not found",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid workflow configuration",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async updateWorkflow(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Workflow> {
    const workflow = await this.workflowsService.update(
      id,
      updateWorkflowDto,
      user,
    );
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete workflow",
    description: "Permanently deletes a workflow and all its associated data",
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Workflow UUID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Workflow deleted successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Workflow not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Cannot delete workflow with active executions",
  })
  async deleteWorkflow(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.workflowsService.remove(id, user);
  }

  @Post(":id/activate")
  @ApiOperation({
    summary: "Activate workflow",
    description: "Activates a workflow to enable execution",
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Workflow UUID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Workflow activated successfully",
    type: Workflow,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Workflow not found",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Workflow cannot be activated",
  })
  async activateWorkflow(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Workflow> {
    const workflow = await this.workflowsService.activate(id, user);
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  @Post(":id/deactivate")
  @ApiOperation({
    summary: "Deactivate workflow",
    description: "Deactivates a workflow to prevent execution",
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Workflow UUID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Workflow deactivated successfully",
    type: Workflow,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Workflow not found",
  })
  async deactivateWorkflow(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Workflow> {
    const workflow = await this.workflowsService.deactivate(id, user);
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  @Post(":id/duplicate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Duplicate workflow",
    description: "Creates a copy of an existing workflow",
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Workflow UUID to duplicate",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name for the duplicated workflow",
          example: "Copy of Customer Onboarding Process",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Workflow duplicated successfully",
    type: Workflow,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Workflow not found",
  })
  async duplicateWorkflow(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { name?: string },
    @CurrentUser() user: AuthUser,
  ): Promise<Workflow> {
    const duplicatedWorkflow = await this.workflowsService.duplicate(
      id,
      user,
      body.name,
    );
    return duplicatedWorkflow;
  }

  @Post(':id/execute')
  @ApiOperation({
    summary: 'Execute workflow',
    description: 'Triggers an immediate execution of a workflow',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Workflow UUID to execute',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        inputData: {
          type: 'object',
          description: 'Optional input data for the workflow execution',
          example: { key: 'value' },
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow execution triggered successfully',
    type: Workflow,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workflow not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Workflow cannot be executed',
  })
  async executeWorkflow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { inputData?: Record<string, any> },
    @CurrentUser() user: AuthUser,
  ): Promise<any> {
    return this.workflowsService.triggerExecution(id, user, body.inputData);
  }
}
