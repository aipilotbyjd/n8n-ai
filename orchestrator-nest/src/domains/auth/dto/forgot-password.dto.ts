import { IsString, IsOptional } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}
