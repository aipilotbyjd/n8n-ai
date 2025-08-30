import { IsString, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  tenantId: string;

  @IsOptional()
  @IsString()
  invitationCode?: string;
}
