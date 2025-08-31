import { IsString, IsOptional, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SubscriptionType {
  WORKFLOW = 'workflow',
  EXECUTION = 'execution',
  LOGS = 'logs',
  METRICS = 'metrics',
  TENANT_ACTIVITY = 'tenant_activity',
}

export class SubscriptionFiltersDto {
  @IsOptional()
  @IsString({ each: true })
  eventTypes?: string[];

  @IsOptional()
  @IsString()
  logLevel?: string;

  @IsOptional()
  @IsString()
  stepId?: string;
}

export class SubscriptionRequestDto {
  @IsEnum(SubscriptionType)
  type: SubscriptionType;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SubscriptionFiltersDto)
  filters?: SubscriptionFiltersDto;
}

export class UnsubscribeRequestDto {
  @IsString()
  subscriptionKey: string;
}

export class StatusRequestDto {
  @IsOptional()
  @IsString()
  executionId?: string;

  @IsOptional()
  @IsString()
  workflowId?: string;
}

export class WebSocketMessageDto {
  @IsString()
  type: string;

  @IsObject()
  payload: any;

  @IsString()
  timestamp: string;

  @IsOptional()
  @IsString()
  messageId?: string;
}

export class PingMessageDto {
  @IsOptional()
  @IsString()
  timestamp?: string;
}