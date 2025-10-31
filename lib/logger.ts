/**
 * Logger Utility Module
 * Provides structured logging with levels, sanitization, and environment-based configuration
 */

import winston from 'winston';

// Determine log level based on environment
const getLogLevel = (): string => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.LOG_LEVEL || 'info';
  }
  return process.env.LOG_LEVEL || 'debug';
};

// Create sanitization function to remove sensitive data
const sanitizeData = (data: any): any => {
  if (typeof data === 'string') {
    // Remove potential sensitive patterns
    return data
      .replace(/password[=:]\s*[^\s&,}]+/gi, 'password=***')
      .replace(/token[=:]\s*[^\s&,}]+/gi, 'token=***')
      .replace(/api[_-]?key[=:]\s*[^\s&,}]+/gi, 'api_key=***')
      .replace(/secret[=:]\s*[^\s&,}]+/gi, 'secret=***')
      .replace(/authorization[=:]\s*[^\s&,}]+/gi, 'authorization=***');
  }
  
  if (data && typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item));
    }
    
    const sanitized: any = {};
    const sensitiveKeys = ['password', 'token', 'apiKey', 'api_key', 'secret', 'authorization', 'auth', 'access_token', 'refresh_token'];
    
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    
    return sanitized;
  }
  
  return data;
};

// Create logs directory if it doesn't exist (only in Node.js, not in tests)
if (typeof require !== 'undefined' && require.main && require.main.filename) {
  const fs = require('fs');
  const path = require('path');
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    try {
      fs.mkdirSync(logsDir, { recursive: true });
    } catch (err) {
      // Ignore errors creating logs directory (may fail in some environments)
    }
  }
}

// Create winston logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'dlwait' },
  transports: [
    // Only add file transports if not in test environment
    ...(process.env.NODE_ENV !== 'test' ? [
      // Write all logs with importance level of `error` or less to `error.log`
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Write all logs to `combined.log`
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ] : []),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }: any) => {
        const sanitizedMeta = Object.keys(meta).length ? JSON.stringify(sanitizeData(meta), null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${sanitizedMeta}`;
      })
    )
  }));
} else {
  // In production, only log errors to console
  logger.add(new winston.transports.Console({
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));
}

// Helper function to sanitize log data before logging
const sanitizeAndLog = (level: string, message: string, ...args: any[]) => {
  const sanitizedArgs = args.map(arg => sanitizeData(arg));
  logger.log(level, message, ...sanitizedArgs);
};

// Logger interface with sanitization
export const log = {
  debug: (message: string, ...args: any[]) => sanitizeAndLog('debug', message, ...args),
  info: (message: string, ...args: any[]) => sanitizeAndLog('info', message, ...args),
  warn: (message: string, ...args: any[]) => sanitizeAndLog('warn', message, ...args),
  error: (message: string, ...args: any[]) => sanitizeAndLog('error', message, ...args),
};

// Export winston logger for advanced usage
export default logger;
