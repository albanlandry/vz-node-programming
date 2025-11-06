# Node ID Mismatch in Graph Execution

## Error Summary

**Date**: December 2024  
**Severity**: High  
**Status**: Resolved

## Error Description

When executing saved graphs, nodes were being created with auto-generated UUIDs instead of using the IDs specified in the graph definition. This caused connection validation to fail because connections referenced nodes by their graph IDs (e.g., `math-add`, `logger-1`), but the executor contained nodes with different IDs (e.g., `de003f12-40bc-42c3-8163-3c72998e3328`).

### Error Messages

```
[WARN] Node ID mismatch: expected math-add, got de003f12-40bc-42c3-8163-3c72998e3328. Using expected ID.
[ERROR] Some nodes were not added to executor. Missing: math-add, math-multiply, string-upper, logger-1, logger-2
[ERROR] Failed to add connection: Target node math-add not found
```

### Affected Nodes

- `MathNode` (utility.math)
- `StringNode` (utility.string)
- `LoggerNode` (utility.logger)
- `ConditionalNode` (utility.conditional)
- `TransformNode` (utility.transform)
- `ArrayNode` (utility.array)
- `ObjectNode` (utility.object)
- `CalculatorNode` (oop.calculator)

### Working Nodes

- `ConstantNode` (utility.constant) - Already accepted config parameter

## Root Cause

The node class constructors did not accept configuration parameters, so when `NodeRegistry.create()` was called with a config containing an `id`, the constructor couldn't receive it. The `BaseNode` constructor then generated a new UUID as a fallback.

### Code Flow

1. `GraphExecutionEngine.buildExecutor()` calls `registry.create(graphNode.type, { id: graphNode.id, ... })`
2. `NodeRegistry.create()` calls `new nodeClass(config)`
3. Node constructor (e.g., `MathNode`) has signature `constructor()` - no parameters
4. `super()` is called without config, so `BaseNode` doesn't receive the `id`
5. `BaseNode` constructor uses `config.id ?? uuidv4()`, but `config` is undefined
6. New UUID is generated instead of using the provided ID

### Example of Problematic Code

```typescript
// ❌ Before - doesn't accept config
export class MathNode extends BaseNode {
  constructor() {
    super({
      name: 'Math',
      // ... hardcoded config
    });
  }
}
```

## Resolution

### Solution

Modified all node constructors to accept an optional `config?: Partial<NodeConfig>` parameter and pass it to `super()`. This allows the `id` and other configuration to be properly passed through to `BaseNode`.

### Code Changes

**Before:**
```typescript
export class MathNode extends BaseNode {
  constructor() {
    super({
      name: 'Math',
      description: 'Performs mathematical operations',
      inputs: [...],
      outputs: [...],
    });
  }
}
```

**After:**
```typescript
export class MathNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      name: 'Math',
      description: 'Performs mathematical operations',
      inputs: [...],
      outputs: [...],
      ...config, // Merge provided config (includes id)
    });
  }
}
```

### Files Modified

1. `src/nodes/utility/UtilityNodes.ts`
   - `ConditionalNode`
   - `MathNode`
   - `StringNode`
   - `TransformNode`
   - `ArrayNode`
   - `ObjectNode`
   - `LoggerNode`

2. `src/nodes/oop/ObjectOrientedNodes.ts`
   - `CalculatorNode`

3. `src/graph-management/GraphExecutionEngine.ts`
   - Added node ID verification and better error logging

## Verification

### Test Steps

1. Load a saved graph with multiple node types
2. Execute the graph
3. Verify all nodes are created with their graph IDs
4. Verify connections are successfully added
5. Verify execution completes without errors

### Expected Behavior

- All nodes should be created with IDs matching the graph definition
- No "Node ID mismatch" warnings
- All connections should be successfully added
- Graph execution should complete successfully

### Log Output (After Fix)

```
[DEBUG] Added node constant-1 (utility.constant) to executor
[DEBUG] Added node constant-2 (utility.constant) to executor
[DEBUG] Added node math-add (utility.math) to executor
[DEBUG] Added node math-multiply (utility.math) to executor
[DEBUG] Added node string-upper (utility.string) to executor
[DEBUG] Added node logger-1 (utility.logger) to executor
[DEBUG] Added node logger-2 (utility.logger) to executor
[DEBUG] Added connection conn-1: constant-1 -> math-add
[DEBUG] Added connection conn-2: constant-2 -> math-add
...
```

## Prevention

### Best Practices

1. **Always accept config in node constructors**: All node classes should accept `config?: Partial<NodeConfig>` to allow ID and other configuration to be passed.

2. **Use config merging pattern**: Merge provided config with defaults:
   ```typescript
   constructor(config?: Partial<NodeConfig>) {
     super({
       // Default values
       name: 'NodeName',
       ...config, // Override with provided config
     });
   }
   ```

3. **Test node creation with IDs**: When creating new node types, verify they accept and use provided IDs correctly.

4. **Add validation**: The `GraphExecutionEngine` now verifies all nodes are added with correct IDs before adding connections.

## Related Issues

- Graph execution failing with "Target node not found" errors
- Connections not being created during graph execution
- Node ID mismatches in execution logs

## References

- `src/core/BaseNode.ts` - Base node class with ID handling
- `src/registry/NodeRegistry.ts` - Node factory creation
- `src/graph-management/GraphExecutionEngine.ts` - Graph execution engine
- `src/nodes/utility/UtilityNodes.ts` - Utility node implementations

## Resolution Date

December 2024

## Implementation Status

✅ **RESOLVED** - All node constructors have been updated to accept and use the provided `id` from the graph definition.

### Changes Made

1. **Updated Node Constructors**:
   - `ConditionalNode` - Added `config?: Partial<NodeConfig>` parameter
   - `MathNode` - Added `config?: Partial<NodeConfig>` parameter
   - `StringNode` - Added `config?: Partial<NodeConfig>` parameter
   - `TransformNode` - Added `config?: Partial<NodeConfig>` parameter
   - `ArrayNode` - Added `config?: Partial<NodeConfig>` parameter
   - `ObjectNode` - Added `config?: Partial<NodeConfig>` parameter
   - `LoggerNode` - Added `config?: Partial<NodeConfig>` parameter
   - `CalculatorNode` - Added `config?: Partial<NodeConfig>` parameter

2. **Updated super() calls**: All constructors now spread `...config` to pass the ID and other configuration to `BaseNode`.

3. **Added imports**: Added `NodeConfig` import to `ObjectOrientedNodes.ts`.

### Testing

After the fix, graph execution should:
- Create all nodes with their graph-defined IDs
- Successfully add all connections
- Execute without "Target node not found" errors
- Complete execution successfully

### Verification Commands

```bash
# Build to verify no TypeScript errors
npm run build

# Test graph execution
# Navigate to /graphs/[id]/execute and execute a saved graph
# Check logs for successful node creation and connection addition
```

