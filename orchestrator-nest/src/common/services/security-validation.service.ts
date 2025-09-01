import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as validator from 'validator';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 security score
}

@Injectable()
export class SecurityValidationService {
  private readonly logger = new Logger(SecurityValidationService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate JWT secret strength
   */
  validateJwtSecret(secret: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100,
    };

    if (!secret) {
      result.errors.push('JWT secret is required');
      result.isValid = false;
      result.score = 0;
      return result;
    }

    if (secret.length < 32) {
      result.errors.push('JWT secret must be at least 32 characters long');
      result.isValid = false;
      result.score -= 40;
    }

    if (secret.length < 64) {
      result.warnings.push('JWT secret should be at least 64 characters for optimal security');
      result.score -= 10;
    }

    // Check for common weak secrets
    const weakSecrets = [
      'secret',
      'password',
      'default-secret',
      'supersecretjwtkey',
      'your-super-secret-jwt-key',
      '123456',
      'qwerty',
    ];

    if (weakSecrets.some(weak => secret.toLowerCase().includes(weak.toLowerCase()))) {
      result.errors.push('JWT secret appears to be a common/weak secret');
      result.isValid = false;
      result.score -= 50;
    }

    // Check entropy
    const entropy = this.calculateEntropy(secret);
    if (entropy < 3.0) {
      result.warnings.push('JWT secret has low entropy, consider using more random characters');
      result.score -= 15;
    }

    // Check character diversity
    const hasLower = /[a-z]/.test(secret);
    const hasUpper = /[A-Z]/.test(secret);
    const hasNumbers = /\d/.test(secret);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(secret);

    const diversity = [hasLower, hasUpper, hasNumbers, hasSpecial].filter(Boolean).length;
    if (diversity < 3) {
      result.warnings.push('JWT secret should include uppercase, lowercase, numbers, and special characters');
      result.score -= 10;
    }

    return result;
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100,
    };

    if (!password) {
      result.errors.push('Password is required');
      result.isValid = false;
      result.score = 0;
      return result;
    }

    if (password.length < 8) {
      result.errors.push('Password must be at least 8 characters long');
      result.isValid = false;
      result.score -= 30;
    }

    if (password.length < 12) {
      result.warnings.push('Password should be at least 12 characters for better security');
      result.score -= 10;
    }

    // Character requirements
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLower || !hasUpper || !hasNumbers || !hasSpecial) {
      result.errors.push('Password must contain uppercase, lowercase, numbers, and special characters');
      result.isValid = false;
      result.score -= 25;
    }

    // Common password checks
    const commonPatterns = [
      /(.)\1{2,}/, // Repeated characters
      /123456|654321|abcdef|qwerty/i, // Common sequences
      /password|admin|user|login/i, // Common words
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        result.warnings.push('Password contains common patterns');
        result.score -= 15;
        break;
      }
    }

    // Entropy check
    const entropy = this.calculateEntropy(password);
    if (entropy < 3.5) {
      result.warnings.push('Password has low entropy');
      result.score -= 10;
    }

    return result;
  }

  /**
   * Validate email format and security
   */
  validateEmail(email: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100,
    };

    if (!email) {
      result.errors.push('Email is required');
      result.isValid = false;
      result.score = 0;
      return result;
    }

    if (!validator.isEmail(email)) {
      result.errors.push('Invalid email format');
      result.isValid = false;
      result.score -= 50;
    }

    // Check for suspicious patterns
    if (email.includes('..') || email.includes('++')) {
      result.warnings.push('Email contains suspicious patterns');
      result.score -= 10;
    }

    // Check domain
    const domain = email.split('@')[1];
    if (domain) {
      // Check for disposable email domains (basic check)
      const disposableDomains = [
        '10minutemail.com',
        'tempmail.org',
        'guerrillamail.com',
        'mailinator.com',
      ];

      if (disposableDomains.includes(domain.toLowerCase())) {
        result.warnings.push('Email appears to be from a disposable email service');
        result.score -= 20;
      }
    }

    return result;
  }

  /**
   * Validate input for injection attacks
   */
  validateInput(input: string, type: 'sql' | 'xss' | 'general' = 'general'): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100,
    };

    if (!input) {
      return result; // Empty input is valid
    }

    // SQL Injection patterns
    if (type === 'sql' || type === 'general') {
      const sqlPatterns = [
        /('|(\\')|(;)|(\\;)|(--)|(\s)|(\/\*)|(\\\/\*))/i,
        /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
        /(\bor\b|\band\b).*[=<>]/i,
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(input)) {
          result.errors.push('Input contains potential SQL injection patterns');
          result.isValid = false;
          result.score -= 40;
          break;
        }
      }
    }

    // XSS patterns
    if (type === 'xss' || type === 'general') {
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /vbscript:/gi,
      ];

      for (const pattern of xssPatterns) {
        if (pattern.test(input)) {
          result.errors.push('Input contains potential XSS patterns');
          result.isValid = false;
          result.score -= 40;
          break;
        }
      }
    }

    // Command injection patterns
    const commandPatterns = [
      /[;&|`$(){}[\]]/,
      /(rm|del|format|shutdown|reboot)/i,
    ];

    for (const pattern of commandPatterns) {
      if (pattern.test(input)) {
        result.warnings.push('Input contains potential command injection characters');
        result.score -= 20;
        break;
      }
    }

    // Path traversal
    if (input.includes('../') || input.includes('..\\')) {
      result.errors.push('Input contains path traversal patterns');
      result.isValid = false;
      result.score -= 30;
    }

    return result;
  }

  /**
   * Validate API key format and strength
   */
  validateApiKey(apiKey: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100,
    };

    if (!apiKey) {
      result.errors.push('API key is required');
      result.isValid = false;
      result.score = 0;
      return result;
    }

    if (apiKey.length < 32) {
      result.errors.push('API key must be at least 32 characters long');
      result.isValid = false;
      result.score -= 40;
    }

    // Check if it's base64 or hex encoded
    const isBase64 = validator.isBase64(apiKey);
    const isHex = /^[0-9a-fA-F]+$/.test(apiKey);

    if (!isBase64 && !isHex) {
      result.warnings.push('API key should be base64 or hex encoded for consistency');
      result.score -= 10;
    }

    // Check entropy
    const entropy = this.calculateEntropy(apiKey);
    if (entropy < 4.0) {
      result.warnings.push('API key has low entropy');
      result.score -= 15;
    }

    return result;
  }

  /**
   * Validate CORS origins
   */
  validateCorsOrigins(origins: string[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100,
    };

    if (!origins || origins.length === 0) {
      result.errors.push('CORS origins must be specified');
      result.isValid = false;
      result.score = 0;
      return result;
    }

    // Check for wildcard in production
    if (origins.includes('*')) {
      const isProduction = this.configService.get('NODE_ENV') === 'production';
      if (isProduction) {
        result.errors.push('Wildcard (*) CORS origin is not allowed in production');
        result.isValid = false;
        result.score -= 50;
      } else {
        result.warnings.push('Wildcard (*) CORS origin should not be used in production');
        result.score -= 20;
      }
    }

    // Validate each origin
    for (const origin of origins) {
      if (origin === '*') continue;

      try {
        new URL(origin);
      } catch {
        result.errors.push(`Invalid CORS origin format: ${origin}`);
        result.isValid = false;
        result.score -= 10;
      }
    }

    return result;
  }

  /**
   * Calculate Shannon entropy of a string
   */
  private calculateEntropy(str: string): number {
    const len = str.length;
    const frequencies = new Map<string, number>();

    // Count character frequencies
    for (const char of str) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }

    // Calculate entropy
    let entropy = 0;
    for (const count of frequencies.values()) {
      const probability = count / len;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * Generate secure random string
   */
  generateSecureSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  /**
   * Generate secure API key
   */
  generateApiKey(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(32).toString('base64url');
    return `ak_${timestamp}_${randomBytes}`;
  }

  /**
   * Comprehensive security validation for configuration
   */
  validateConfiguration(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100,
    };

    // Validate JWT secret
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtValidation = this.validateJwtSecret(jwtSecret);
    result.errors.push(...jwtValidation.errors);
    result.warnings.push(...jwtValidation.warnings);
    result.score = Math.min(result.score, jwtValidation.score);
    result.isValid = result.isValid && jwtValidation.isValid;

    // Validate CORS origins
    const corsOrigins = this.configService.get<string>('CORS_ORIGINS', '').split(',');
    const corsValidation = this.validateCorsOrigins(corsOrigins);
    result.errors.push(...corsValidation.errors);
    result.warnings.push(...corsValidation.warnings);
    result.score = Math.min(result.score, corsValidation.score);
    result.isValid = result.isValid && corsValidation.isValid;

    // Check for development settings in production
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'production') {
      const developmentSettings = [
        { key: 'ENABLE_DEBUG', name: 'Debug mode' },
        { key: 'DISABLE_AUTH', name: 'Authentication disabled' },
        { key: 'SKIP_VALIDATION', name: 'Validation skipped' },
      ];

      for (const setting of developmentSettings) {
        if (this.configService.get<boolean>(setting.key)) {
          result.errors.push(`${setting.name} should not be enabled in production`);
          result.isValid = false;
          result.score -= 30;
        }
      }
    }

    return result;
  }
}
