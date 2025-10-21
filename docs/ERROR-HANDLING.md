## AI Model: Claude Sonnet 4.5

# Error Handling Guide

## Overview

The VZ Programming system provides a comprehensive error handling framework with enterprise-grade resilience patterns. This guide covers all error handling features including retry policies, circuit breakers, fallback execution paths, error boundaries, and dead letter queues.

## Features

- ✅ **Retry Policies** - Exponential backoff with jitter
- ✅ **Circuit Breaker** - Prevent cascading failures  
- ✅ **Fallback Paths** - Alternative execution strategies
- ✅ **Error Boundaries** - Catch and contain errors
- ✅ **Dead Letter Queue** - Track and analyze failures

---

## Retry Policies

Automatically retry failed operations with exponential backoff.

### Basic Usage

```typescript
import { RetryPolicy, RetryPolicies, ErrorHandlingNode } from './src/index';

// Use predefined policy
const node = new ErrorHandlingNode(config, {
  retryPolicy: RetryPolicies.Standard
});

// Or create custom policy
const customRetry = new RetryPolicy({
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  useJitter: true
});
```

### Predefined Policies

```typescript
// No retry - fail immediately
RetryPolicies.None

// Quick retry - 3 attempts, short delays
RetryPolicies.Quick
// Config: { maxAttempts: 3, initialDelay: 500, maxDelay: 2000 }

// Standard retry - balanced approach
RetryPolicies.Standard
// Config: { maxAttempts: 3, initialDelay: 1000, maxDelay: 30000 }

// Aggressive retry - many attempts
RetryPolicies.Aggressive
// Config: { maxAttempts: 5, initialDelay: 2000, maxDelay: 60000 }

// Network retry - optimized for network failures
RetryPolicies.Network
// Config: { maxAttempts: 4, initialDelay: 1000, retryCondition: networkErrors }
```

### Custom Retry Configuration

```typescript
const customPolicy = new RetryPolicy({
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  useJitter: true,
  
  // Custom retry condition
  retryCondition: (error: Error, attempt: number) => {
    // Don't retry validation errors
    if (error.name === 'ValidationError') return false;
    // Don't retry after 2 attempts for auth errors
    if (error.name === 'AuthError' && attempt > 2) return false;
    return true;
  },
  
  // Callback on each retry
  onRetry: (error: Error, attempt: number, delay: number) => {
    console.log(`Retry ${attempt} in ${delay}ms: ${error.message}`);
  }
});
```

### Exponential Backoff

The retry delay grows exponentially with jitter:

```
Attempt 1: 1000ms (±250ms jitter)
Attempt 2: 2000ms (±500ms jitter)
Attempt 3: 4000ms (±1000ms jitter)
```

Formula: `delay = min(initialDelay * multiplier^attempt, maxDelay) ± jitter`

### API Reference

```typescript
interface RetryConfig {
  maxAttempts: number;           // Maximum retry attempts
  initialDelay: number;          // Initial delay (ms)
  maxDelay: number;              // Maximum delay (ms)
  backoffMultiplier: number;     // Exponential multiplier
  useJitter: boolean;            // Add randomization
  retryCondition?: (error, attempt) => boolean;
  onRetry?: (error, attempt, delay) => void;
}

class RetryPolicy {
  execute<T>(fn: () => Promise<T>): Promise<T>;
  getConfig(): Readonly<RetryConfig>;
  updateConfig(config: Partial<RetryConfig>): void;
}
```

---

## Circuit Breaker

Prevent cascading failures by opening the circuit after repeated failures.

### How It Works

```
CLOSED → OPEN → HALF_OPEN → CLOSED
  ↑                           ↓
  └───────────────────────────┘
```

**States:**
- **CLOSED** - Normal operation, requests flow through
- **OPEN** - Too many failures, reject requests immediately
- **HALF_OPEN** - Testing if service recovered, allow limited requests

### Basic Usage

```typescript
import { CircuitBreaker, ErrorHandlingNode } from './src/index';

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes
  resetTimeout: 60000,      // Wait 60s before half-open
  failureWindow: 10000      // Count failures in 10s window
});

const node = new ErrorHandlingNode(config, {
  circuitBreaker
});
```

### Configuration

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;     // Failures to trigger OPEN
  successThreshold: number;     // Successes to return to CLOSED
  resetTimeout: number;         // Wait before HALF_OPEN (ms)
  failureWindow: number;        // Failure counting window (ms)
  
  onStateChange?: (oldState, newState) => void;
  onOpen?: (failures: number) => void;
  onClose?: () => void;
}
```

### State Management

```typescript
const breaker = new CircuitBreaker(config);

// Get current state
const state = breaker.getState(); // CLOSED | OPEN | HALF_OPEN

// Get statistics
const stats = breaker.getStats();
// { state, failures, successes, nextAttemptTime }

// Manual control
breaker.reset();  // Force CLOSED
breaker.open();   // Force OPEN
```

### Circuit Breaker Registry

Manage multiple circuit breakers:

```typescript
import { CircuitBreakerRegistry } from './src/index';

const registry = CircuitBreakerRegistry.getInstance();

// Get or create breaker for a node
const breaker = registry.getOrCreate(
  nodeId,
  { failureThreshold: 3 },
  nodeName
);

// Get all statistics
const allStats = registry.getAllStats();

// Reset all breakers
registry.resetAll();
```

### Example: Protecting an API

```typescript
const apiNode = new ErrorHandlingNode(config, {
  circuitBreaker: new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 30000,
    onOpen: (failures) => {
      console.log(`API circuit opened after ${failures} failures`);
      // Alert monitoring system
    }
  })
});
```

---

## Fallback Execution Paths

Provide alternative execution strategies when primary operations fail.

### Function-based Fallback

```typescript
const node = new ErrorHandlingNode(config, {
  retryPolicy: RetryPolicies.Standard,
  fallbackFn: async (error, context) => {
    console.log(`Fallback triggered: ${error.message}`);
    
    // Return cached data
    const cached = await cache.get(context.executionId);
    
    const outputs = new Map();
    outputs.set('result', cached || 'default value');
    return outputs;
  }
});
```

### Fallback Node

Use the built-in `FallbackNode`:

```typescript
import { FallbackNode } from './src/index';

const fallback = new FallbackNode();

// Connect primary source
executor.addConnection({
  fromNode: primaryNode.id,
  fromPort: 'result',
  toNode: fallback.id,
  toPort: 'primary'
});

// Provide fallback value
const inputs = new Map();
const fallbackInputs = new Map();
fallbackInputs.set('fallback', 'Safe default value');
inputs.set(fallback.id, fallbackInputs);
```

**Outputs:**
- `result` - Primary value or fallback
- `usedFallback` - Boolean indicating which was used

### Multi-level Fallback

```typescript
// Primary → Fallback 1 → Fallback 2 → Default

const primary = new ErrorHandlingNode(config, {
  fallbackFn: async () => {
    // Try cache
    return getCachedData();
  }
});

const fallback1 = new FallbackNode();
const fallback2 = new FallbackNode();

// Chain fallbacks
executor.addConnection({ from: primary, to: fallback1, port: 'primary' });
executor.addConnection({ from: fallback1, to: fallback2, port: 'primary' });
```

---

## Error Boundaries

Catch and contain errors from upstream nodes.

### ErrorBoundaryNode

```typescript
import { ErrorBoundaryNode } from './src/index';

const errorBoundary = new ErrorBoundaryNode({
  name: 'API Error Handler'
});

// Connect potentially failing node
executor.addConnection({
  fromNode: unreliableNode.id,
  fromPort: 'result',
  toNode: errorBoundary.id,
  toPort: 'value'
});

// Provide default value
const inputs = new Map();
const boundaryInputs = new Map();
boundaryInputs.set('defaultValue', 'Safe fallback');
inputs.set(errorBoundary.id, boundaryInputs);
```

### Outputs

The error boundary provides three outputs:

```typescript
{
  result: any,           // Value or default
  hasError: boolean,     // Whether error occurred
  error: {              // Error details (if any)
    message: string,
    name: string,
    stack: string
  }
}
```

### Example: Error Recovery Pipeline

```typescript
// Failing Node → Error Boundary → Fallback → Logger

const failing = new UnreliableNode();
const boundary = new ErrorBoundaryNode();
const fallback = new FallbackNode();
const logger = new LoggerNode();

executor.addNode(failing);
executor.addNode(boundary);
executor.addNode(fallback);
executor.addNode(logger);

// Chain connections
executor.addConnection({ from: failing, to: boundary });
executor.addConnection({ from: boundary, to: fallback });
executor.addConnection({ from: fallback, to: logger });
```

---

## Dead Letter Queue

Track and analyze failed executions for debugging and monitoring.

### Basic Usage

```typescript
import { DeadLetterQueue } from './src/index';

const dlq = DeadLetterQueue.getInstance();

// Enable DLQ for a node
const node = new ErrorHandlingNode(config, {
  enableDLQ: true
});

// After execution, check DLQ
const stats = dlq.getStats();
console.log(`Total failures: ${stats.total}`);
console.log(`Unprocessed: ${stats.unprocessed}`);
```

### Querying the DLQ

```typescript
const dlq = DeadLetterQueue.getInstance();

// Get all entries
const all = dlq.getAll();

// Get unprocessed entries
const unprocessed = dlq.getUnprocessed();

// Get entries for specific node
const nodeFailures = dlq.getByNode(nodeId);

// Get entries for specific execution
const executionFailures = dlq.getByExecution(executionId);

// Get specific entry
const entry = dlq.get(entryId);
```

### Entry Structure

```typescript
interface DeadLetterEntry {
  id: string;
  executionId: string;
  nodeId: string;
  nodeName: string;
  error: Error;
  context: ExecutionContext;
  result: ExecutionResult;
  timestamp: Date;
  retryAttempts: number;
  metadata?: Record<string, any>;
  processed: boolean;
}
```

### Processing Failures

```typescript
const dlq = DeadLetterQueue.getInstance();

// Get unprocessed failures
const failures = dlq.getUnprocessed();

for (const entry of failures) {
  console.log(`Processing failure: ${entry.nodeName}`);
  console.log(`  Error: ${entry.error.message}`);
  console.log(`  Attempts: ${entry.retryAttempts}`);
  
  // Analyze, log, or retry
  await handleFailure(entry);
  
  // Mark as processed
  dlq.markProcessed(entry.id);
}
```

### Statistics

```typescript
const stats = dlq.getStats();

console.log(`Total: ${stats.total}`);
console.log(`Unprocessed: ${stats.unprocessed}`);
console.log(`Oldest: ${stats.oldestEntry}`);
console.log(`Newest: ${stats.newestEntry}`);

// Failures by node
stats.byNode.forEach((count, nodeId) => {
  console.log(`Node ${nodeId}: ${count} failures`);
});
```

### Export & Analysis

```typescript
// Export to JSON
const json = dlq.export();
fs.writeFileSync('failures.json', json);

// Load from persistence
const dlq = DeadLetterQueue.getInstance({
  persistenceHandler: {
    save: async (entry) => {
      await db.save('dlq', entry);
    },
    load: async () => {
      return await db.loadAll('dlq');
    }
  }
});

await dlq.load();
```

### Configuration

```typescript
const dlq = DeadLetterQueue.getInstance({
  maxEntries: 1000,               // Max entries to keep
  retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  onEntryAdded: (entry) => {
    // Send to monitoring system
    monitoring.trackFailure(entry);
  }
});
```

---

## Combined Error Handling

Use all features together for maximum resilience:

```typescript
import {
  ErrorHandlingNode,
  RetryPolicies,
  CircuitBreaker,
  DeadLetterQueue
} from './src/index';

const resilientNode = new ErrorHandlingNode(config, {
  // Retry with exponential backoff
  retryPolicy: new RetryPolicy({
    maxAttempts: 3,
    initialDelay: 1000,
    onRetry: (error, attempt, delay) => {
      console.log(`Retry ${attempt} in ${delay}ms`);
    }
  }),
  
  // Circuit breaker protection
  circuitBreaker: new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000,
    onOpen: (failures) => {
      alerting.sendAlert(`Circuit opened: ${failures} failures`);
    }
  }),
  
  // Fallback strategy
  fallbackFn: async (error, context) => {
    return await cache.get(context.executionId);
  },
  
  // Track failures in DLQ
  enableDLQ: true
});
```

### Execution Flow

```
┌─────────────────┐
│  Execute Node   │
└────────┬────────┘
         │
         ├──[Circuit Breaker]──► OPEN? → Reject
         │                       CLOSED → Continue
         │
         ├──[Retry Policy]─────► Attempt 1, 2, 3...
         │
         ├──[Success]──────────► Return result
         │
         ├──[Failure]
         │   ├──[Fallback]─────► Try fallback
         │   ├──[DLQ]───────────► Record failure
         │   └──[Error]────────► Throw error
         │
         └──[Error Boundary]───► Catch & contain
```

---

## Best Practices

### 1. Choose Appropriate Retry Policies

```typescript
// Network calls - aggressive retry
apiNode.updateErrorConfig({
  retryPolicy: RetryPolicies.Network
});

// Database operations - standard retry
dbNode.updateErrorConfig({
  retryPolicy: RetryPolicies.Standard
});

// Validation - no retry
validationNode.updateErrorConfig({
  retryPolicy: RetryPolicies.None
});
```

### 2. Set Realistic Circuit Breaker Thresholds

```typescript
// High-traffic service - higher threshold
new CircuitBreaker({
  failureThreshold: 10,
  failureWindow: 60000  // 1 minute
});

// Critical service - lower threshold
new CircuitBreaker({
  failureThreshold: 3,
  failureWindow: 10000  // 10 seconds
});
```

### 3. Layer Defenses

```typescript
// Layer 1: Retry
// Layer 2: Circuit breaker
// Layer 3: Fallback
// Layer 4: Error boundary
// Layer 5: DLQ

const node = new ErrorHandlingNode(config, {
  retryPolicy: RetryPolicies.Standard,
  circuitBreaker: new CircuitBreaker(config),
  fallbackFn: getCachedData,
  enableDLQ: true
});
```

### 4. Monitor and Alert

```typescript
const dlq = DeadLetterQueue.getInstance({
  onEntryAdded: (entry) => {
    // Critical errors
    if (entry.retryAttempts >= 3) {
      alerting.critical(`Node ${entry.nodeName} failing repeatedly`);
    }
    
    // Log to monitoring
    monitoring.trackError(entry);
  }
});

const breaker = new CircuitBreaker({
  onOpen: () => {
    alerting.warning('Circuit opened - service degraded');
  },
  onClose: () => {
    alerting.info('Circuit closed - service recovered');
  }
});
```

### 5. Graceful Degradation

```typescript
// Prefer returning partial results over complete failure
fallbackFn: async (error, context) => {
  // Try cache
  const cached = await cache.get(key);
  if (cached) return cached;
  
  // Try alternative service
  try {
    return await backupService.get(key);
  } catch {
    // Return minimal safe response
    return getDefaultValue();
  }
}
```

---

## Examples

### Example 1: Resilient API Call

```typescript
const apiNode = new ErrorHandlingNode({
  name: 'Weather API',
  inputs: [{ id: 'city', name: 'City', dataType: DataTypes.STRING }],
  outputs: [{ id: 'weather', name: 'Weather', dataType: DataTypes.OBJECT }]
}, {
  retryPolicy: RetryPolicies.Network,
  circuitBreaker: new CircuitBreaker({ failureThreshold: 3 }),
  fallbackFn: async () => {
    const outputs = new Map();
    outputs.set('weather', { temp: 72, condition: 'Cached' });
    return outputs;
  },
  enableDLQ: true
});
```

### Example 2: Database with Retry

```typescript
const dbNode = new ErrorHandlingNode({
  name: 'User Database',
  inputs: [{ id: 'userId', name: 'User ID', dataType: DataTypes.STRING }],
  outputs: [{ id: 'user', name: 'User', dataType: DataTypes.OBJECT }]
}, {
  retryPolicy: new RetryPolicy({
    maxAttempts: 5,
    initialDelay: 2000,
    retryCondition: (error) => {
      // Retry on connection errors
      return error.message.includes('ECONNREFUSED');
    }
  }),
  enableDLQ: true
});
```

### Example 3: Error Recovery Pipeline

```typescript
// Unreliable → Retry → Circuit Breaker → Error Boundary → Fallback

const unreliable = new ErrorHandlingNode(config, {
  retryPolicy: RetryPolicies.Standard,
  circuitBreaker: new CircuitBreaker({ failureThreshold: 5 })
});

const boundary = new ErrorBoundaryNode();
const fallback = new FallbackNode();

executor.addNode(unreliable);
executor.addNode(boundary);
executor.addNode(fallback);

executor.addConnection({ from: unreliable, to: boundary, port: 'value' });
executor.addConnection({ from: boundary, to: fallback, port: 'primary' });
```

---

## API Reference

### ErrorHandlingNode

```typescript
class ErrorHandlingNode extends BaseNode {
  constructor(
    config: NodeConfig,
    errorConfig?: ErrorHandlingConfig
  );
  
  updateErrorConfig(config: Partial<ErrorHandlingConfig>): void;
  getErrorConfig(): Readonly<ErrorHandlingConfig>;
}

interface ErrorHandlingConfig {
  retryPolicy?: RetryPolicy;
  circuitBreaker?: CircuitBreaker;
  enableDLQ?: boolean;
  fallbackFn?: (error: Error, context: ExecutionContext) => Promise<Map<PortId, any>>;
  suppressErrors?: boolean;
}
```

### RetryPolicy

```typescript
class RetryPolicy {
  constructor(config?: Partial<RetryConfig>);
  execute<T>(fn: () => Promise<T>, context?: { nodeId, nodeName }): Promise<T>;
  getConfig(): Readonly<RetryConfig>;
  updateConfig(config: Partial<RetryConfig>): void;
}
```

### CircuitBreaker

```typescript
class CircuitBreaker {
  constructor(config?: Partial<CircuitBreakerConfig>, context?: { nodeId, nodeName });
  execute<T>(fn: () => Promise<T>): Promise<T>;
  getState(): CircuitState;
  getStats(): { state, failures, successes, nextAttemptTime };
  reset(): void;
  open(): void;
}
```

### DeadLetterQueue

```typescript
class DeadLetterQueue {
  static getInstance(config?: Partial<DLQConfig>): DeadLetterQueue;
  
  add(params: AddEntryParams): Promise<DeadLetterEntry>;
  get(id: string): DeadLetterEntry | undefined;
  getAll(): DeadLetterEntry[];
  getUnprocessed(): DeadLetterEntry[];
  getByNode(nodeId: NodeId): DeadLetterEntry[];
  getByExecution(executionId: ExecutionId): DeadLetterEntry[];
  
  markProcessed(id: string): boolean;
  remove(id: string): boolean;
  clear(): void;
  
  getStats(): DLQStats;
  export(): string;
}
```

---

## Troubleshooting

### Retry Not Working

```typescript
// Check retry configuration
const config = retryPolicy.getConfig();
console.log('Max attempts:', config.maxAttempts);

// Add retry callback to debug
retryPolicy.updateConfig({
  onRetry: (error, attempt, delay) => {
    console.log(`Retry ${attempt}: ${error.message} in ${delay}ms`);
  }
});
```

### Circuit Breaker Always Open

```typescript
// Check stats
const stats = breaker.getStats();
console.log('State:', stats.state);
console.log('Failures:', stats.failures);

// Reset if needed
breaker.reset();

// Or adjust thresholds
breaker = new CircuitBreaker({
  failureThreshold: 10,  // Higher threshold
  failureWindow: 60000   // Longer window
});
```

### DLQ Not Recording

```typescript
// Ensure DLQ is enabled
node.updateErrorConfig({ enableDLQ: true });

// Check DLQ stats
const stats = dlq.getStats();
console.log('Total entries:', stats.total);

// Add callback to verify
const dlq = DeadLetterQueue.getInstance({
  onEntryAdded: (entry) => {
    console.log('Entry added:', entry.id);
  }
});
```

---

## See Also

- [Quick Start Guide](../QUICKSTART.md)
- [Node Registry](./NODE-REGISTRY.md)
- [Parallel Execution](../PARALLEL-EXECUTION.md)
- [Examples](../examples/error-handling-example.ts)
