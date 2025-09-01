import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required for security');
  }
  
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }

  return {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || jwtSecret + '_refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
});
