# Parallel Execution Guide

## Overview

The VZ Programming system supports **automatic parallel execution** of independent nodes, significantly improving performance for workflows with no data dependencies.

## How It Works

### Execution Levels

The system analyzes your node graph and groups nodes into **execution levels**:

```
Level 0: Nodes with no dependencies (can all run in parallel)
Level 1: Nodes that depend on Level 0 (wait for Level 0, then run in parallel)
Level 2: Nodes that depend on Level 1 (wait for Level 1, then run in parallel)
...and so on
```

### Visual Example

```
Sequential Execution:           Parallel Execution:
─────────────────────          ─────────────────────

HTTP1 ────┐                    ┌── HTTP1 ──┐
          │                    │           │
HTTP2 ────┼──> Total: 1200ms   ├── HTTP2 ──┤──> Total: 400ms
          │                    │           │
HTTP3 ────┘                    └── HTTP3 ──┘
                               
(One at a time)                (All at once)
```

### With Dependencies

```
         Math1 (10×5)  ──┐
Level 0:                 ├──> Run in parallel
         Math2 (8+12)  ──┘

Level 1: Math3 (50+20)  ────> Waits for Level 0

         Transform    ──┐
Level 2:               ├──> Run in parallel
         Logger       ──┘
```

## API Usage

### Sequential Execution
```typescript
const results = await executor.execute(initialInputs);
```
- Executes nodes one after another
- Predictable order
- Easier debugging
- Lower memory usage

### Parallel Execution
```typescript
const results = await executor.executeParallel(initialInputs);
```
- Executes independent nodes simultaneously
- Maximum performance
- Automatic level grouping
- Respects dependencies

## Performance Comparison

### Real-World Results

| Scenario | Sequential | Parallel | Speedup |
|----------|-----------|----------|---------|
| 3 HTTP Requests | 1208ms | 411ms | **2.94x** |
| 3 Delay Operations | 1573ms | 499ms | **3.15x** |
| Independent Math Ops | 3ms | 1ms | **3x** |

### When Parallel Execution Shines

✅ **Best Use Cases:**
- Multiple HTTP/API calls
- Parallel data processing
- Independent computations
- I/O-bound operations

⚠️ **Less Benefit:**
- Single node
- Linear dependencies (A → B → C)
- CPU-intensive sequential tasks
- Very fast operations (<1ms)

## Examples

### Example 1: Multiple API Calls

```typescript
const executor = new NodeExecutor();

// Create 3 independent HTTP nodes
const fetchUser = new HttpRequestNode();
const fetchPosts = new HttpRequestNode();
const fetchComments = new HttpRequestNode();

executor.addNode(fetchUser);
executor.addNode(fetchPosts);
executor.addNode(fetchComments);

// Configure each to call different endpoints
// ...

// Parallel execution: All 3 calls happen simultaneously
const results = await executor.executeParallel(initialInputs);
// ~400ms instead of ~1200ms!
```

### Example 2: Data Pipeline with Mixed Parallelism

```typescript
// Level 0: Fetch data from 2 sources (parallel)
fetchAPI1 ──┐
            ├──> Both run simultaneously
fetchAPI2 ──┘

// Level 1: Process each dataset (parallel)
process1 ──┐
           ├──> Both run simultaneously
process2 ──┘

// Level 2: Combine results (sequential, waits for Level 1)
combineResults

// Level 3: Save and log (parallel)
saveToDb ──┐
           ├──> Both run simultaneously
logResults ──┘
```

### Example 3: Fallback Pattern

```typescript
// Try multiple endpoints in parallel, use first successful response
const primary = new HttpRequestNode();
const backup1 = new HttpRequestNode();
const backup2 = new HttpRequestNode();

// All execute simultaneously
// Use whichever responds first!
```

## Implementation Details

### Level Calculation Algorithm

```
For each node:
  If node has no dependencies:
    Level = 0
  Else:
    Level = max(dependency_levels) + 1
```

### Circular Dependency Detection

The system automatically detects circular dependencies:

```typescript
// This will throw an error:
A → B → C → A  // Circular!

Error: "Circular dependency detected involving node A"
```

### Error Handling in Parallel

- If any node fails, execution continues for other nodes in the same level
- Failed nodes are marked in results
- Dependent nodes in later levels may skip execution if inputs are missing
- Use `execution_failed` event to track failures

## Best Practices

### 1. Use Parallel for Independent I/O

```typescript
// ✅ Good: Independent HTTP calls
await executor.executeParallel(httpRequests);

// ❌ Not beneficial: Sequential pipeline
// A → B → C (no parallelism possible)
await executor.execute(pipeline);
```

### 2. Monitor Performance

```typescript
executor.on('execution_completed', (event) => {
  console.log(`${event.data.nodeId}: ${event.data.result.executionTime}ms`);
});

const start = Date.now();
await executor.executeParallel(inputs);
console.log(`Total: ${Date.now() - start}ms`);
```

### 3. Handle Errors Gracefully

```typescript
executor.on('execution_failed', (event) => {
  console.error(`Node failed: ${event.data.error.message}`);
  // Implement retry logic, fallbacks, etc.
});
```

### 4. Choose the Right Method

```typescript
// Development/Debugging: Use sequential
await executor.execute(inputs);

// Production/Performance: Use parallel
await executor.executeParallel(inputs);
```

## Advanced: Custom Parallelization

For advanced users who want more control:

```typescript
// Get execution levels
const levels = executor['buildExecutionLevels']();

// Execute each level with custom logic
for (const level of levels) {
  // Custom concurrent execution
  // Rate limiting, batching, etc.
}
```

## Troubleshooting

### Issue: Parallel execution is slow

**Check:**
- Are nodes actually independent?
- Use `execution_started` events to verify parallel execution
- Network/API rate limits might be serializing requests

### Issue: Unexpected execution order

**Remember:**
- Order within a level is non-deterministic
- Use dependencies to enforce order
- Consider using sequential execution for debugging

### Issue: Race conditions

**Solution:**
- Ensure nodes are truly independent
- Use proper state management
- Add explicit dependencies if needed

## Run Examples

```bash
# See parallel execution in action
npm run example:parallel

# Compare with sequential
npm run example:http
```

## Summary

Parallel execution provides:
- ✅ Automatic optimization
- ✅ 2-3x performance improvement
- ✅ Dependency-aware scheduling
- ✅ Simple API (just use `executeParallel()`)
- ✅ Safe error handling

**When in doubt, use `executeParallel()` for better performance!**
