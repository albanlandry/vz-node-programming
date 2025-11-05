/**
 * Logger Example
 * 
 * Demonstrates:
 * - Different log levels
 * - Console logger
 * - JSON logger
 * - Silent logger
 * - Child loggers with prefixes
 * - Environment variable configuration
 */

import {
  logger,
  LogLevel,
  ConsoleLogger,
  JsonLogger,
  SilentLogger,
  createChildLogger
} from '../src/utils/Logger';

/**
 * Example 1: Basic Logging
 */
function basicLoggingExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              Basic Logging Example                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  logger.debug('This is a debug message');
  logger.info('This is an info message');
  logger.warn('This is a warning message');
  logger.error('This is an error message');
  console.log('');
}

/**
 * Example 2: Log Levels
 */
function logLevelsExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              Log Levels Example                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const testLogger = new ConsoleLogger(LogLevel.WARN);
  
  console.log('Logger set to WARN level:');
  testLogger.debug('Debug message (should not appear)');
  testLogger.info('Info message (should not appear)');
  testLogger.warn('Warning message (should appear)');
  testLogger.error('Error message (should appear)');
  console.log('');
}

/**
 * Example 3: JSON Logger
 */
function jsonLoggerExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              JSON Logger Example                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const jsonLogger = new JsonLogger(LogLevel.INFO, true);
  
  console.log('JSON formatted logs:');
  jsonLogger.info('User logged in', { userId: '123', timestamp: new Date().toISOString() });
  jsonLogger.warn('Rate limit approaching', { current: 90, limit: 100 });
  jsonLogger.error('Database connection failed', { host: 'db.example.com', port: 5432 });
  console.log('');
}

/**
 * Example 4: Silent Logger
 */
function silentLoggerExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              Silent Logger Example                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const silentLogger = new SilentLogger();
  
  console.log('Silent logger (nothing should appear):');
  silentLogger.debug('Debug (silent)');
  silentLogger.info('Info (silent)');
  silentLogger.warn('Warning (silent)');
  silentLogger.error('Error (silent)');
  console.log('✓ Silent logger discards all logs\n');
}

/**
 * Example 5: Child Loggers
 */
function childLoggerExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              Child Logger Example                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const nodeLogger = createChildLogger('NodeExecutor');
  const registryLogger = createChildLogger('NodeRegistry');
  const errorLogger = createChildLogger('ErrorHandler');
  
  nodeLogger.info('Starting execution');
  registryLogger.info('Registering nodes');
  errorLogger.warn('Retry attempt failed');
  nodeLogger.info('Execution completed');
  console.log('');
}

/**
 * Example 6: Dynamic Log Level
 */
function dynamicLogLevelExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           Dynamic Log Level Example                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const testLogger = new ConsoleLogger();
  
  console.log('Current level:', LogLevel[testLogger.getLevel()]);
  console.log('Testing all levels:');
  testLogger.debug('Debug');
  testLogger.info('Info');
  testLogger.warn('Warn');
  testLogger.error('Error');
  
  console.log('\nChanging to DEBUG level:');
  testLogger.setLevel(LogLevel.DEBUG);
  console.log('Current level:', LogLevel[testLogger.getLevel()]);
  testLogger.debug('Debug (now visible)');
  testLogger.info('Info (still visible)');
  console.log('');
}

/**
 * Example 7: Environment Configuration
 */
function environmentConfigExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║          Environment Configuration Example              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('Environment variables for logger configuration:');
  console.log('  LOG_LEVEL: DEBUG | INFO | WARN | ERROR | NONE');
  console.log('  LOG_FORMAT: console | json | silent');
  console.log('  LOG_INCLUDE_STACK: true | false (for JSON format)');
  console.log('\nCurrent configuration:');
  console.log(`  LOG_LEVEL=${process.env.LOG_LEVEL || 'INFO (default)'}`);
  console.log(`  LOG_FORMAT=${process.env.LOG_FORMAT || 'console (default)'}`);
  console.log(`  LOG_INCLUDE_STACK=${process.env.LOG_INCLUDE_STACK || 'false (default)'}`);
  console.log('\nTo test JSON logger:');
  console.log('  LOG_FORMAT=json npm run example:logger');
  console.log('\nTo test silent logger:');
  console.log('  LOG_FORMAT=silent npm run example:logger');
  console.log('\nTo set log level:');
  console.log('  LOG_LEVEL=DEBUG npm run example:logger');
  console.log('');
}

/**
 * Run all logger examples
 */
function runAllLoggerExamples() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    LOGGER EXAMPLES                         ');
  console.log('═══════════════════════════════════════════════════════════');

  basicLoggingExample();
  logLevelsExample();
  jsonLoggerExample();
  silentLoggerExample();
  childLoggerExample();
  dynamicLogLevelExample();
  environmentConfigExample();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ All logger examples completed successfully!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run if executed directly
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  runAllLoggerExamples();
}

export {
  basicLoggingExample,
  logLevelsExample,
  jsonLoggerExample,
  silentLoggerExample,
  childLoggerExample,
  dynamicLogLevelExample,
  environmentConfigExample,
  runAllLoggerExamples
};

