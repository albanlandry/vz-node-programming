/**
 * Log levels from most verbose to least verbose
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Logger interface for abstracting logging functionality
 */
export interface Logger {
  /**
   * Log a debug message (most verbose)
   */
  debug(message: string, ...args: any[]): void;
  
  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void;
  
  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void;
  
  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void;
  
  /**
   * Get current log level
   */
  getLevel(): LogLevel;
  
  /**
   * Set log level
   */
  setLevel(level: LogLevel): void;
  
  /**
   * Check if a log level is enabled
   */
  isEnabled(level: LogLevel): boolean;
}

/**
 * Console logger implementation
 * Outputs logs to the console with appropriate methods
 */
export class ConsoleLogger implements Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.isEnabled(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.isEnabled(LogLevel.INFO)) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.isEnabled(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.isEnabled(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  getLevel(): LogLevel {
    return this.level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  isEnabled(level: LogLevel): boolean {
    return level >= this.level;
  }
}

/**
 * Silent logger that discards all logs
 * Useful for testing or production environments where logging is disabled
 */
export class SilentLogger implements Logger {
  debug(_message: string, ..._args: any[]): void {}
  info(_message: string, ..._args: any[]): void {}
  warn(_message: string, ..._args: any[]): void {}
  error(_message: string, ..._args: any[]): void {}
  getLevel(): LogLevel { return LogLevel.NONE; }
  setLevel(_level: LogLevel): void {}
  isEnabled(_level: LogLevel): boolean { return false; }
}

/**
 * JSON logger that outputs structured JSON logs
 * Useful for production environments with log aggregation systems
 */
export class JsonLogger implements Logger {
  private level: LogLevel;
  private includeStack: boolean;

  constructor(level: LogLevel = LogLevel.INFO, includeStack: boolean = false) {
    this.level = level;
    this.includeStack = includeStack;
  }

  private log(level: string, message: string, ...args: any[]): void {
    if (!this.isEnabled(LogLevel[level as keyof typeof LogLevel] as LogLevel)) {
      return;
    }

    const logEntry: any = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...this.extractArgs(args)
    };

    if (this.includeStack && level === 'ERROR') {
      logEntry.stack = new Error().stack;
    }

    console.log(JSON.stringify(logEntry));
  }

  private extractArgs(args: any[]): Record<string, any> {
    if (args.length === 0) return {};
    
    // If single object argument, merge its properties
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
      return args[0];
    }
    
    // Otherwise, create a data field with the args
    return { data: args };
  }

  debug(message: string, ...args: any[]): void {
    this.log('DEBUG', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('INFO', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('WARN', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('ERROR', message, ...args);
  }

  getLevel(): LogLevel {
    return this.level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  isEnabled(level: LogLevel): boolean {
    return level >= this.level;
  }
}

/**
 * Get log level from environment variable or string
 */
function getLogLevelFromEnv(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  
  if (envLevel && envLevel in LogLevel) {
    return LogLevel[envLevel as keyof typeof LogLevel] as LogLevel;
  }
  
  // Default to INFO in production, DEBUG in development
  return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
}

/**
 * Get logger format from environment variable
 */
function getLoggerFormat(): 'console' | 'json' | 'silent' {
  const format = process.env.LOG_FORMAT?.toLowerCase();
  
  if (format === 'json') return 'json';
  if (format === 'silent') return 'silent';
  return 'console';
}

/**
 * Create logger instance based on environment configuration
 */
function createLogger(): Logger {
  const level = getLogLevelFromEnv();
  const format = getLoggerFormat();
  
  switch (format) {
    case 'json':
      return new JsonLogger(level, process.env.LOG_INCLUDE_STACK === 'true');
    case 'silent':
      return new SilentLogger();
    case 'console':
    default:
      return new ConsoleLogger(level);
  }
}

/**
 * Default logger instance
 * Configure via environment variables:
 * - LOG_LEVEL: DEBUG | INFO | WARN | ERROR | NONE
 * - LOG_FORMAT: console | json | silent
 * - LOG_INCLUDE_STACK: true | false (for JSON format)
 */
export const logger: Logger = createLogger();

/**
 * Create a child logger with a prefix
 * Useful for creating context-specific loggers
 */
export function createChildLogger(prefix: string): Logger {
  const parentLogger = logger;
  
  return {
    debug: (message: string, ...args: any[]) => 
      parentLogger.debug(`[${prefix}] ${message}`, ...args),
    info: (message: string, ...args: any[]) => 
      parentLogger.info(`[${prefix}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => 
      parentLogger.warn(`[${prefix}] ${message}`, ...args),
    error: (message: string, ...args: any[]) => 
      parentLogger.error(`[${prefix}] ${message}`, ...args),
    getLevel: () => parentLogger.getLevel(),
    setLevel: (level: LogLevel) => parentLogger.setLevel(level),
    isEnabled: (level: LogLevel) => parentLogger.isEnabled(level)
  };
}

