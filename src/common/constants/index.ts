// Application constants
export const APP_CONFIG = {
  DEFAULT_PORT: 3000,
  DEFAULT_PAGE_SIZE: 5,
  MAX_PAGE_SIZE: 100,
  DEFAULT_SYNC_CRON: '0 * * * *',
  DEFAULT_HTTP_TIMEOUT: 15000,
  DEFAULT_HTTP_RETRIES: 3,
} as const;

// Logging constants
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  LOG: 'log',
  DEBUG: 'debug',
  VERBOSE: 'verbose',
} as const;

export const LOG_OPERATIONS = {
  BUSINESS: 'business',
  DATABASE: 'database',
  API: 'api',
  SECURITY: 'security',
  AUTH: 'auth',
  CACHE: 'cache',
  PERFORMANCE: 'performance',
  VALIDATION: 'validation',
} as const;

// Security constants
export const SECURITY_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Cache operations
export const CACHE_OPERATIONS = {
  HIT: 'hit',
  MISS: 'miss',
  SET: 'set',
  DELETE: 'delete',
} as const;

// Database constants
export const DB_CONFIG = {
  DEFAULT_PORT: 5432,
  DEFAULT_POOL_MAX: 10,
  CONNECTION_TIMEOUT: 10000,
  IDLE_TIMEOUT: 10000,
  MAX_QUERY_EXECUTION_TIME: 2000,
} as const;

// Contentful constants
export const CONTENTFUL_CONFIG = {
  DEFAULT_ENVIRONMENT: 'master',
  DEFAULT_CONTENT_TYPE: 'product',
  DEFAULT_BASE_URL: 'https://cdn.contentful.com',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_UUID: 'Invalid UUID parameter.',
  PRODUCT_NOT_FOUND: 'Product not found.',
  UNAUTHORIZED: 'Unauthorized access.',
  FORBIDDEN: 'Access forbidden.',
  INTERNAL_ERROR: 'Internal server error.',
  VALIDATION_FAILED: 'Validation failed.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Product created successfully.',
  PRODUCT_UPDATED: 'Product updated successfully.',
  PRODUCT_DELETED: 'Product deleted successfully.',
  LOGIN_SUCCESS: 'Login successful.',
  SYNC_COMPLETED: 'Synchronization completed successfully.',
} as const;
