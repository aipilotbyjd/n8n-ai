import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { User, UserStatus } from "./entities/user.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AuthResponse } from "./dto/auth-response.dto";

@ApiTags("Authentication")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "User login",
    description: "Authenticates a user and returns access and refresh tokens",
  })
  @ApiBody({
    type: LoginDto,
    description: "Login credentials",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Login successful",
    type: AuthResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Invalid credentials",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid request data",
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "User registration",
    description: "Registers a new user account",
  })
  @ApiBody({
    type: RegisterDto,
    description: "Registration details",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "User registered successfully",
    type: AuthResponse,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "User already exists",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid registration data",
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh access token",
    description: "Generates a new access token using a valid refresh token",
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: "Refresh token",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Token refreshed successfully",
    type: AuthResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Invalid or expired refresh token",
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "User logout",
    description: "Invalidates the current access and refresh tokens",
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Logout successful",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async logout(@Request() req: any): Promise<void> {
    return this.authService.logout(req.user);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Forgot password",
    description: "Sends a password reset email to the user",
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: "Forgot password request",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Password reset email sent",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Password reset email sent" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return { message: "Password reset email sent" };
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reset password",
    description: "Resets user password using a valid reset token",
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: "Password reset data",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Password reset successful",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Password reset successful" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid or expired reset token",
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: "Password reset successful" };
  }

  @Get("me")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get current user profile",
    description: "Retrieves the profile of the currently authenticated user",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User profile retrieved successfully",
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async getProfile(@Request() req: any): Promise<User> {
    return this.authService.getProfile(req.user.id);
  }

  @Put("me")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Update user profile",
    description: "Updates the profile of the currently authenticated user",
  })
  @ApiBody({
    type: UpdateProfileDto,
    description: "Profile update data",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Profile updated successfully",
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid profile data",
  })
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Put("change-password")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Change password",
    description: "Changes the password for the currently authenticated user",
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: "Password change data",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Password changed successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Password changed successfully" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid current password",
  })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(req.user.id, changePasswordDto);
    return { message: "Password changed successfully" };
  }

  @Post("validate-token")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Validate access token",
    description: "Validates an access token and returns user information",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Access token to validate" },
      },
      required: ["token"],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Token is valid",
    schema: {
      type: "object",
      properties: {
        valid: { type: "boolean", example: true },
        user: { $ref: "#/components/schemas/User" },
        permissions: {
          type: "array",
          items: { type: "string" },
          example: ["read:workflows", "write:workflows"],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token is invalid or expired",
  })
  async validateToken(@Body() body: { token: string }): Promise<{
    valid: boolean;
    user: Partial<User>;
    permissions: string[];
  }> {
    return this.authService.validateToken(body.token);
  }

  @Get("permissions")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get user permissions",
    description:
      "Retrieves the permissions for the currently authenticated user",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User permissions retrieved successfully",
    schema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        tenantId: { type: "string" },
        roles: {
          type: "array",
          items: { type: "string" },
          example: ["user", "admin"],
        },
        permissions: {
          type: "array",
          items: { type: "string" },
          example: ["read:workflows", "write:workflows", "admin:users"],
        },
        effectivePermissions: {
          type: "object",
          properties: {
            workflows: {
              type: "object",
              properties: {
                read: { type: "boolean" },
                write: { type: "boolean" },
                delete: { type: "boolean" },
              },
            },
            executions: {
              type: "object",
              properties: {
                read: { type: "boolean" },
                start: { type: "boolean" },
                stop: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Authentication required",
  })
  async getUserPermissions(@Request() req: any): Promise<{
    userId: string;
    tenantId: string;
    roles: string[];
    permissions: string[];
    effectivePermissions: Record<string, Record<string, boolean>>; 
  }> {
    return this.authService.getUserPermissions(req.user.id);
  }
}
