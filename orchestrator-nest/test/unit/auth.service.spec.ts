import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/domains/auth/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/domains/auth/entities/user.entity';
import { TenantService } from '../../src/domains/tenants/tenants.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: any;
  let tenantService: any;
  let jwtService: any;
  let configService: any;

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    tenantService = {
      findOne: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
    };
    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: TenantService,
          useValue: tenantService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return tokens and user on successful login', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        tenantId: 'tenant-id',
        status: User.UserStatus.ACTIVE,
      };
      usersRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);
      jwtService.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');
      configService.get.mockReturnValue('7d');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
        tenantId: 'tenant-id',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.login({
        email: 'test@example.com',
        password: 'wrongpassword',
        tenantId: 'tenant-id',
      })).rejects.toThrow(UnauthorizedException);
    });
  });
});
