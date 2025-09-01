import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './dto/auth-response.dto';
import { TenantService } from '../tenants/tenants.service';
import { 
  RefreshTokenDto, 
  ForgotPasswordDto, 
  ResetPasswordDto, 
  UpdateProfileDto, 
  ChangePasswordDto 
} from './dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private tenantService: TenantService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.log(`Attempting to log in user: ${loginDto.email}`);
    // TODO: Implement actual login logic (password validation, JWT generation)
    const user = await this.usersRepository.findOne({ where: { email: loginDto.email, tenantId: loginDto.tenantId } });
    if (!user || !(await bcrypt.compare(loginDto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // TODO: Generate JWT tokens
    const payload = { email: user.email, sub: user.id, tenantId: user.tenantId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: user,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    this.logger.log(`Attempting to register user: ${registerDto.email}`);

    const { email, password, tenantId, ...rest } = registerDto;

    // Validate tenant exists (assuming tenant service has findById method)
    try {
      await this.tenantService.findById(tenantId);
    } catch (error) {
      throw new BadRequestException('Invalid tenant ID');
    }

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({ where: { email, tenantId } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists in this tenant');
    }

    // Hash password with configurable rounds for security
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = this.usersRepository.create({
      email,
      passwordHash,
      tenantId,
      status: UserStatus.ACTIVE,
      roles: ['user'], // Default role
      permissions: [], // Default permissions
      ...rest,
    });

    const savedUser = await this.usersRepository.save(user);

    // Generate JWT tokens
    const payload = { email: savedUser.email, sub: savedUser.id, tenantId: savedUser.tenantId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: savedUser,
    };
  }

  // TODO: Implement other auth methods (refreshToken, logout, forgotPassword, resetPassword, etc.)

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      return null;
    }
    return user;
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    this.logger.log('Attempting to refresh token');
    
    try {
      const decoded = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret') || this.configService.get<string>('jwt.secret'),
      });

      const user = await this.validateUser(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token - user not found');
      }

      // Generate new tokens
      const payload = { email: user.email, sub: user.id, tenantId: user.tenantId };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { 
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') 
      });

      // Update last login time
      user.lastLoginAt = new Date();
      await this.usersRepository.save(user);

      return {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
        user,
      };
    } catch (error) {
      this.logger.error('Refresh token validation failed', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    this.logger.log(`Logging out user: ${userId}`);
    // TODO: Implement logout logic (invalidate tokens)
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    this.logger.log(`Forgot password request for: ${forgotPasswordDto.email}`);
    // TODO: Implement forgot password logic (send email with reset token)
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    this.logger.log(`Resetting password for token: ${resetPasswordDto.token}`);
    // TODO: Implement reset password logic (validate token, update password)
  }

  async getProfile(userId: string): Promise<User> {
    this.logger.log(`Getting profile for user: ${userId}`);
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    this.logger.log(`Updating profile for user: ${userId}`);
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, updateProfileDto);
    return this.usersRepository.save(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    this.logger.log(`Changing password for user: ${userId}`);
    
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    // Update password
    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date();
    
    await this.usersRepository.save(user);
    
    this.logger.log(`Password changed successfully for user: ${userId}`);
  }

  async validateToken(token: string): Promise<{ valid: boolean; user: Partial<User>; permissions: string[]; }> {
    this.logger.log(`Validating token: ${token}`);
    // TODO: Implement token validation logic
    throw new UnauthorizedException('Invalid token');
  }

  async getUserPermissions(userId: string): Promise<{ userId: string; tenantId: string; roles: string[]; permissions: string[]; effectivePermissions: Record<string, Record<string, boolean>>; }> {
    this.logger.log(`Getting permissions for user: ${userId}`);
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // TODO: Implement effective permissions logic
    return { userId: user.id, tenantId: user.tenantId, roles: user.roles, permissions: user.permissions, effectivePermissions: {} };
  }
}