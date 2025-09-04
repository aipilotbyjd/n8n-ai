import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Workflow } from "../../workflows/entities/workflow.entity";

export enum ExecutionStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  ERROR = "error",
  CANCELLED = "cancelled",
  TIMEOUT = "timeout",
}

export enum ExecutionMode {
  MANUAL = "manual",
  TRIGGER = "trigger",
  WEBHOOK = "webhook",
  SCHEDULED = "scheduled",
  RETRY = "retry",
}

@Entity("executions")
@Index(["workflowId", "status"])
@Index(["tenantId", "startedAt"])
@Index(["status", "startedAt"])
export class Execution {
  @ApiProperty({
    description: "Unique execution ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "Workflow ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @Column({ type: "uuid" })
  @Index()
  workflowId: string;

  @ApiProperty({
    description: "Tenant ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @Column({ type: "uuid" })
  @Index()
  tenantId: string;

  @ApiProperty({
    description: "User who started the execution",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @ApiProperty({
    description: "Execution status",
    enum: ExecutionStatus,
    example: ExecutionStatus.SUCCESS,
  })
  @Column({
    type: "enum",
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  @Index()
  status: ExecutionStatus;

  @ApiProperty({
    description: "Execution mode",
    enum: ExecutionMode,
    example: ExecutionMode.MANUAL,
  })
  @Column({
    type: "enum",
    enum: ExecutionMode,
    default: ExecutionMode.MANUAL,
  })
  mode: ExecutionMode;

  @ApiPropertyOptional({
    description: "Input data for the execution",
    type: "object",
    additionalProperties: true,
  })
  @Column({ type: "jsonb", nullable: true })
  inputData?: any;

  @ApiPropertyOptional({
    description: "Execution output data",
    type: "object",
    additionalProperties: true,
  })
  @Column({ type: "jsonb", nullable: true })
  outputData?: any;

  @ApiPropertyOptional({
    description: "Error information if execution failed",
    type: "object",
    additionalProperties: true,
  })
  @Column({ type: "jsonb", nullable: true })
  error?: any;

  @ApiPropertyOptional({
    description: "Execution metadata and configuration",
    type: "object",
    additionalProperties: true,
  })
  @Column({ type: "jsonb", nullable: true })
  metadata?: any;

  @ApiProperty({
    description: "When execution started",
    example: "2024-01-15T10:30:00Z",
  })
  @Column({ type: "timestamp with time zone", nullable: true })
  startedAt?: Date;

  @ApiProperty({
    description: "When execution finished",
    example: "2024-01-15T10:35:00Z",
  })
  @Column({ type: "timestamp with time zone", nullable: true })
  finishedAt?: Date;

  @ApiProperty({
    description: "Execution duration in milliseconds",
    example: 5000,
  })
  @Column({ type: "integer", nullable: true })
  duration?: number;

  @ApiProperty({
    description: "When execution was created",
    example: "2024-01-15T10:30:00Z",
  })
  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @ApiProperty({
    description: "When execution was last updated",
    example: "2024-01-15T10:30:00Z",
  })
  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Workflow, (workflow) => workflow.executions)
  @JoinColumn({ name: "workflowId" })
  workflow: Workflow;
}