import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WebhookMethod, AuthType } from "../entities/webhook.entity";

export class CreateWebhookDto {
  @ApiProperty({
    description: "ID of the workflow this webhook triggers",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  workflowId: string;

  @ApiProperty({
    description: "Human-readable name for the webhook",
    example: "Order Processing Webhook",
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: "Description of the webhook purpose",
    example: "Processes incoming order notifications from payment gateway",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "HTTP methods this webhook accepts",
    enum: WebhookMethod,
    example: WebhookMethod.POST,
  })
  @IsOptional()
  @IsEnum(WebhookMethod)
  method?: WebhookMethod;

  @ApiPropertyOptional({
    description: "Authentication type for the webhook",
    enum: AuthType,
    example: AuthType.SIGNATURE,
  })
  @IsOptional()
  @IsEnum(AuthType)
  authenticationType?: AuthType;

  @ApiPropertyOptional({
    description: "Authentication configuration data",
    type: "object",
    additionalProperties: true,
    example: {
      headerName: "X-API-Key",
      headerValue: "secret-key-value",
    },
  })
  @IsOptional()
  @IsObject()
  authenticationData?: any;

  @ApiPropertyOptional({
    description: "Rate limit per minute",
    example: 60,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  rateLimitPerMinute?: number;

  @ApiPropertyOptional({
    description: "Webhook timeout in milliseconds",
    example: 30000,
    minimum: 1000,
    maximum: 300000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(300000)
  timeoutMs?: number;

  @ApiPropertyOptional({
    description: "Additional webhook configuration",
    type: "object",
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  configuration?: any;
}
