# Logging System

## Overview

The VZ Programming system uses a centralized logging abstraction that provides configurable logging with multiple formats and log levels. All production code uses the logger abstraction instead of direct console calls.

## Features

- ✅ **Multiple Log Levels** - DEBUG, INFO, WARN, ERROR, NONE
- ✅ **Multiple Formats** - Console, JSON, Silent
- ✅ **Environment Configuration** - Configure via environment variables
- ✅ **Child Loggers** - Create context-specific loggers with prefixes
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Testable** - Easy to mock or replace in tests

## Quick Start

```typescript
import { logger } from './src/index';

// Basic logging
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');

// With data
logger.info('User logged in', { userId: '123' });
logger.error('Operation failed', { error: error.message });
```

## Log Levels

Log levels are ordered from most verbose to least verbose:

```typescript
enum LogLevel {
  DEBUG = 0,  // Most verbose - development debugging
  INFO = 1,   // General information
  WARN = 2,   // Warnings
  ERROR = 3,  // Errors only
  NONE = 4    // No logging
}
```

### Default Behavior

- **Development** (NODE_ENV !== 'production'): DEBUG level
- **Production** (NODE_ENV === 'production'): INFO level

## Logger Implementations

### ConsoleLogger (Default)

Standard console output with level prefixes:

```typescript
import { ConsoleLogger, LogLevel } from './src/index';

const logger = new ConsoleLogger(LogLevel.INFO);

logger.info('Message');  // [INFO] Message
logger.warn('Warning');  // [WARN] Warning
logger.error('Error');   // [ERROR] Error
```

### JsonLogger

Structured JSON output for log aggregation systems:

```typescript
import { JsonLogger, LogLevel } from './src/index';

const logger = new JsonLogger(LogLevel.INFO, true); // includeStack = true

logger.info('User logged in', { userId: '123' });
// Output: {"timestamp":"2025-10-21T10:00:00.000Z","level":"INFO","message":"User logged in","userId":"123"}

logger.error('Database error', { host: 'db.example.com' });
// Output: {"timestamp":"2025-10-21T10:00:00.000Z","level":"ERROR","message":"Database error","host":"db.example.com","stack":"..."}
```

### SilentLogger

Discards all logs (useful for testing):

```typescript
import { SilentLogger } from './src/index';

const logger = new SilentLogger();
logger.info('This will not appear'); // No output
```

## Environment Configuration

Configure the logger via environment variables:

```bash
# Set log level
export LOG_LEVEL=DEBUG

# Set logger format
export LOG_FORMAT=json

# Include stack traces in JSON logs
export LOG_INCLUDE_STACK=true
```

### Environment Variables

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `LOG_LEVEL` | DEBUG, INFO, WARN, ERROR, NONE | INFO (prod), DEBUG (dev) | Minimum log level to output |
| `LOG_FORMAT` | console, json, silent | console | Logger format |
| `LOG_INCLUDE_STACK` | true, false | false | Include stack traces in JSON logs |

### Examples

```bash
# Development with verbose logging
LOG_LEVEL=DEBUG npm run dev

# Production with JSON logs
LOG_LEVEL=INFO LOG_FORMAT=json npm start

# Silent mode (no logs)
LOG_FORMAT=silent npm test
```

## Child Loggers

Create context-specific loggers with prefixes:

```typescript
import { createChildLogger } from './src/index';

const nodeLogger = createChildLogger('NodeExecutor');
const registryLogger = createChildLogger('NodeRegistry');

nodeLogger.info('Starting execution');
// [INFO] [NodeExecutor] Starting execution

registryLogger.info('Registering nodes');
// [INFO] [NodeRegistry] Registering nodes
```

## Dynamic Configuration

Change log level at runtime:

```typescript
import { logger, LogLevel } from './src/index';

// Get current level
const currentLevel = logger.getLevel();
console.log(`Current level: ${LogLevel[currentLevel]}`);

// Change level
logger.setLevel(LogLevel.DEBUG);

// Check if level is enabled
if (logger.isEnabled(LogLevel.DEBUG)) {
  logger.debug('This will now appear');
}
```

## API Reference

### Logger Interface

```typescript
interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  getLevel(): LogLevel;
  setLevel(level: LogLevel): void;
  isEnabled(level: LogLevel): boolean;
}
```

### Default Logger Instance

```typescript
import { logger } from './src/index';

// Use the default logger (configured via environment)
logger.info('Message');
```

### Creating Custom Loggers

```typescript
import { ConsoleLogger, JsonLogger, SilentLogger, LogLevel } from './src/index';

// Console logger with custom level
const consoleLogger = new ConsoleLogger(LogLevel.WARN);

// JSON logger with stack traces
const jsonLogger = new JsonLogger(LogLevel.INFO, true);

// Silent logger
const silentLogger = new SilentLogger();
```

## Usage in Code

All production code uses the logger:

```typescript
import { logger } from '../utils/Logger';

// Instead of console.log
logger.info('Operation completed');

// Instead of console.warn
logger.warn('Deprecated feature used');

// Instead of console.error
logger.error('Operation failed', error);

// Instead of console.debug
logger.debug('Detailed debug information');
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// DEBUG - Detailed information for debugging
logger.debug('Processing item', { itemId, step: 'validation' });

// INFO - General information about execution
logger.info('User logged in', { userId });

// WARN - Warning conditions
logger.warn('Rate limit approaching', { current: 90, limit: 100 });

// ERROR - Error conditions
logger.error('Database connection failed', { error: error.message });
```

### 2. Include Context

```typescript
// Good - includes context
logger.error('Node execution failed', {
  nodeId: node.id,
  nodeName: node.name,
  error: error.message,
  executionId: context.executionId
});

// Bad - no context
logger.error('Node execution failed');
```

### 3. Use Child Loggers for Components

```typescript
// In NodeExecutor
import { createChildLogger } from '../utils/Logger';

const logger = createChildLogger('NodeExecutor');

// All logs from NodeExecutor will have [NodeExecutor] prefix
logger.info('Starting execution'); // [INFO] [NodeExecutor] Starting execution
```

### 4. Structured Data in JSON Mode

```typescript
// When using JSON logger, pass objects as second argument
logger.info('Operation completed', {
  operation: 'data-processing',
  duration: 1234,
  itemsProcessed: 100,
  success: true
});
```

## Testing

### Mock Logger for Tests

```typescript
import { Logger } from './src/utils/Logger';

const mockLogger: Logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  getLevel: () => LogLevel.DEBUG,
  setLevel: jest.fn(),
  isEnabled: () => true
};

// Use in tests
```

### Silent Logger for Tests

```typescript
import { SilentLogger } from './src/utils/Logger';

const logger = new SilentLogger();
// No logs will appear during tests
```

## Migration from Console

All console calls have been replaced:

```typescript
// Before
console.log('Message');
console.warn('Warning');
console.error('Error');

// After
import { logger } from '../utils/Logger';

logger.info('Message');
logger.warn('Warning');
logger.error('Error');
```

## Examples

See `examples/logger-example.ts` for comprehensive examples:

```bash
npm run example:logger
```

## See Also

- [README](../README.md) - Main documentation
- [Error Handling](./ERROR-HANDLING.md) - Error handling guide
- [Improvements](../IMPROVEMENTS.md) - Improvement suggestions

