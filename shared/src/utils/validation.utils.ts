import { z } from 'zod';
import { ValidationError } from '../types/errors.types';

// Common Validation Schemas
export const UUIDSchema = z.string().uuid('Invalid UUID format');
export const EmailSchema = z.string().email('Invalid email format');
export const PasswordSchema = z.string().min(8, 'Password must be at least 8 characters').regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
);
export const URLSchema = z.string().url('Invalid URL format');
export const DateStringSchema = z.string().datetime('Invalid date format');
export const PositiveNumberSchema = z.number().positive('Must be a positive number');
export const NonNegativeNumberSchema = z.number().nonnegative('Must be a non-negative number');

// Validation Functions
export const validateUUID = (value: string): boolean => {
  try {
    UUIDSchema.parse(value);
    return true;
  } catch {
    return false;
  }
};

export const validateEmail = (email: string): boolean => {
  try {
    EmailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: string): boolean => {
  try {
    PasswordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
};

export const validateURL = (url: string): boolean => {
  try {
    URLSchema.parse(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDateString = (dateString: string): boolean => {
  try {
    DateStringSchema.parse(dateString);
    return true;
  } catch {
    return false;
  }
};

// Schema Validation with Error Handling
export const validateSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      throw new ValidationError(
        `Validation failed${context ? ` for ${context}` : ''}`,
        { errors: details },
        { correlationId: generateCorrelationId() }
      );
    }
    throw error;
  }
};

export const validateSchemaSafe = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data);
  return result;
};

// Input Sanitization
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizeURL = (url: string): string => {
  let sanitized = url.trim();
  if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
    sanitized = `https://${sanitized}`;
  }
  return sanitized;
};

export const sanitizeObject = <T extends Record<string, unknown>>(
  obj: T,
  stringFields: (keyof T)[]
): T => {
  const sanitized = { ...obj };
  
  for (const field of stringFields) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeString(sanitized[field] as string) as T[keyof T];
    }
  }
  
  return sanitized;
};

// Type Guards
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const isUUID = (value: unknown): value is string => {
  return isString(value) && validateUUID(value);
};

export const isEmail = (value: unknown): value is string => {
  return isString(value) && validateEmail(value);
};

export const isURL = (value: unknown): value is string => {
  return isString(value) && validateURL(value);
};

// Conditional Validation
export const validateConditional = <T>(
  condition: boolean,
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T | undefined => {
  if (!condition) {
    return undefined;
  }
  return validateSchema(schema, data, context);
};

export const validateRequired = <T>(
  value: unknown,
  schema: z.ZodSchema<T>,
  fieldName: string
): T => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
  return validateSchema(schema, value, fieldName);
};

// Array Validation
export const validateArray = <T>(
  schema: z.ZodSchema<T>,
  data: unknown[],
  context?: string
): T[] => {
  return data.map((item, index) => 
    validateSchema(schema, item, `${context || 'item'}[${index}]`)
  );
};

export const validateUniqueArray = <T>(
  schema: z.ZodSchema<T>,
  data: unknown[],
  context?: string
): T[] => {
  const validated = validateArray(schema, data, context);
  const unique = [...new Set(validated.map(item => JSON.stringify(item)))];
  return unique.map(item => JSON.parse(item));
};

// Object Validation
export const validateObjectKeys = <T extends Record<string, unknown>>(
  obj: T,
  allowedKeys: (keyof T)[]
): T => {
  const validated: Partial<T> = {};
  
  for (const key of allowedKeys) {
    if (key in obj) {
      validated[key] = obj[key];
    }
  }
  
  return validated as T;
};

export const validateRequiredFields = <T extends Record<string, unknown>>(
  obj: T,
  requiredFields: (keyof T)[]
): T => {
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      throw new ValidationError(`Field '${String(field)}' is required`);
    }
  }
  return obj;
};

// Custom Validators
export const createCustomValidator = <T>(
  validator: (value: T) => boolean,
  errorMessage: string
) => {
  return (value: T): T => {
    if (!validator(value)) {
      throw new ValidationError(errorMessage);
    }
    return value;
  };
};

export const createRegexValidator = (
  pattern: RegExp,
  errorMessage: string
) => {
  return (value: string): string => {
    if (!pattern.test(value)) {
      throw new ValidationError(errorMessage);
    }
    return value;
  };
};

// Validation Helpers
export const generateCorrelationId = (): string => {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatValidationErrors = (errors: z.ZodError): string[] => {
  return errors.errors.map(error => 
    `${error.path.join('.')}: ${error.message}`
  );
};

export const hasValidationErrors = (errors: z.ZodError): boolean => {
  return errors.errors.length > 0;
};

// Workflow-specific Validation
export const validateWorkflowName = (name: string): string => {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Workflow name is required');
  }
  
  if (name.length > 100) {
    throw new ValidationError('Workflow name must be less than 100 characters');
  }
  
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    throw new ValidationError('Workflow name contains invalid characters');
  }
  
  return name.trim();
};

export const validateNodeType = (type: string): string => {
  if (!type || type.trim().length === 0) {
    throw new ValidationError('Node type is required');
  }
  
  if (!/^[a-zA-Z0-9._-]+$/.test(type)) {
    throw new ValidationError('Node type contains invalid characters');
  }
  
  return type.trim();
};

export const validateConnection = (
  sourceNodeId: string,
  targetNodeId: string,
  sourceOutput: string,
  targetInput: string
): void => {
  if (!validateUUID(sourceNodeId)) {
    throw new ValidationError('Invalid source node ID');
  }
  
  if (!validateUUID(targetNodeId)) {
    throw new ValidationError('Invalid target node ID');
  }
  
  if (sourceNodeId === targetNodeId) {
    throw new ValidationError('Source and target nodes cannot be the same');
  }
  
  if (!sourceOutput || sourceOutput.trim().length === 0) {
    throw new ValidationError('Source output is required');
  }
  
  if (!targetInput || targetInput.trim().length === 0) {
    throw new ValidationError('Target input is required');
  }
};

// Export commonly used schemas
export const CommonSchemas = {
  UUID: UUIDSchema,
  Email: EmailSchema,
  Password: PasswordSchema,
  URL: URLSchema,
  DateString: DateStringSchema,
  PositiveNumber: PositiveNumberSchema,
  NonNegativeNumber: NonNegativeNumberSchema,
} as const;