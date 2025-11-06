# Missing Required Inputs - Properties Not Used as Default Values

## Error Summary

**Date**: December 2024  
**Severity**: High  
**Status**: Resolved

## Error Description

When executing graphs, nodes with properties (like `operation`, `level`) were failing with "Required input missing" errors, even though these values were stored in the node's `properties`. The properties were being set on the node but not used as default input values when inputs weren't connected.

### Error Messages

```
[ERROR] Node math-add execution error: NodeError: Required input 'Operation' (operation) is missing
[ERROR] Node string-upper execution error: NodeError: Required input 'Operation' (operation) is missing
[ERROR] Node logger-1 execution error: NodeError: Required input 'Data' (data) is missing
```

### Affected Nodes

- `MathNode` - Requires `operation` property (e.g., "add", "multiply")
- `StringNode` - Requires `operation` property (e.g., "toUpperCase", "toLowerCase")
- `LoggerNode` - Requires `level` property (e.g., "info", "warn")
- Any node that uses properties as default input values

### Example Graph Node

```json
{
  "id": "math-add",
  "type": "utility.math",
  "properties": {
    "operation": "add"
  }
}
```

The `operation` property should be used as the default value for the `operation` input port when no connection provides it.

## Root Cause

The `NodeExecutor.gatherNodeInputs()` method only gathered inputs from:
1. Initial inputs provided in the execution request
2. Connected nodes' outputs

It did not check node properties to use as default values for unconnected required inputs.

### Code Flow

1. Node is created with properties: `{ operation: "add" }`
2. Properties are stored in `node.properties` Map
3. `NodeExecutor.executeNode()` calls `gatherNodeInputs()`
4. `gatherNodeInputs()` only checks connections and initial inputs
5. If `operation` input has no connection, it's missing
6. `validateInputs()` throws error: "Required input 'Operation' is missing"
7. Execution fails

### Problematic Code

```typescript
// ❌ Before - doesn't check properties
private gatherNodeInputs(
  nodeId: NodeId,
  initialInputs: Map<NodeId, Map<PortId, unknown>>,
): Map<PortId, unknown> {
  const inputs = new Map<PortId, unknown>();
  
  // Add initial inputs
  // Gather from connections
  // ❌ Missing: Check node properties for defaults
  
  return inputs;
}
```

## Resolution

### Solution

Modified `NodeExecutor.gatherNodeInputs()` to use node properties as default values for inputs that:
1. Are not provided via connections
2. Are not provided in initial inputs
3. Have a matching property name

### Code Changes

**File**: `src/core/NodeExecutor.ts`

**Before:**
```typescript
private gatherNodeInputs(
  nodeId: NodeId,
  initialInputs: Map<NodeId, Map<PortId, unknown>>,
): Map<PortId, unknown> {
  const inputs = new Map<PortId, unknown>();
  const node = this.nodes.get(nodeId);

  if (!node) {
    return inputs;
  }

  // Add initial inputs if provided
  const nodeInitialInputs = initialInputs.get(nodeId);
  if (nodeInitialInputs) {
    nodeInitialInputs.forEach((value, portId) => {
      inputs.set(portId, value);
    });
  }

  // Gather inputs from connected nodes
  const incomingConnections = Array.from(this.connections.values())
    .filter(conn => conn.toNode === nodeId);

  for (const connection of incomingConnections) {
    const sourceResult = this.executionResults.get(connection.fromNode);
    if (sourceResult && sourceResult.success && sourceResult.outputs) {
      const value = sourceResult.outputs.get(connection.fromPort);
      if (value !== undefined) {
        inputs.set(connection.toPort, value);
      }
    }
  }

  return inputs;
}
```

**After:**
```typescript
private gatherNodeInputs(
  nodeId: NodeId,
  initialInputs: Map<NodeId, Map<PortId, unknown>>,
): Map<PortId, unknown> {
  const inputs = new Map<PortId, unknown>();
  const node = this.nodes.get(nodeId);

  if (!node) {
    return inputs;
  }

  // Add initial inputs if provided
  const nodeInitialInputs = initialInputs.get(nodeId);
  if (nodeInitialInputs) {
    nodeInitialInputs.forEach((value, portId) => {
      inputs.set(portId, value);
    });
  }

  // Gather inputs from connected nodes
  const incomingConnections = Array.from(this.connections.values())
    .filter(conn => conn.toNode === nodeId);

  for (const connection of incomingConnections) {
    const sourceResult = this.executionResults.get(connection.fromNode);
    if (sourceResult && sourceResult.success && sourceResult.outputs) {
      const value = sourceResult.outputs.get(connection.fromPort);
      if (value !== undefined) {
        inputs.set(connection.toPort, value);
      }
    }
  }

  // Use node properties as default values for unconnected inputs
  // Only use properties if the input is not already set (from connection or initial input)
  if ('getProperty' in node && typeof node.getProperty === 'function') {
    for (const inputPort of node.inputs) {
      // Skip if input already has a value
      if (inputs.has(inputPort.id)) {
        continue;
      }

      // Check if there's a property with the same name as the input port
      const propertyValue = node.getProperty(inputPort.id);
      if (propertyValue !== undefined) {
        inputs.set(inputPort.id, propertyValue);
      }
    }
  }

  return inputs;
}
```

## Implementation Details

### Property Priority

Input values are resolved in this order (highest to lowest priority):
1. **Initial inputs** - Explicitly provided in execution request
2. **Connected outputs** - Values from connected nodes
3. **Node properties** - Default values from node properties (new)

### Property Matching

Properties are matched to input ports by:
- Property key name matching input port ID
- Example: Property `operation` matches input port `operation`

### Type Safety

The code checks if the node has a `getProperty` method before using it, ensuring compatibility with all node types.

## Verification

### Test Steps

1. Create a graph with nodes that have properties (e.g., Math node with `operation: "add"`)
2. Don't connect the property-based input ports
3. Execute the graph
4. Verify nodes execute successfully using property values as defaults

### Expected Behavior

- Nodes should use properties as default input values
- No "Required input missing" errors for properties
- Graph execution should complete successfully
- Connected inputs should still override property defaults

### Example

**Graph Node:**
```json
{
  "id": "math-add",
  "type": "utility.math",
  "properties": {
    "operation": "add"
  }
}
```

**Execution:**
- `operation` input is not connected
- Property `operation: "add"` is used as default
- Node executes successfully with `operation = "add"`

## Prevention

### Best Practices

1. **Document property usage**: When creating nodes that use properties as defaults, document which properties map to which inputs.

2. **Property naming**: Use the same names for properties and input port IDs to enable automatic matching.

3. **Test property defaults**: When testing nodes, verify that properties work as default values when inputs aren't connected.

4. **Consider making properties explicit**: For clarity, consider making property-based inputs optional or providing clear documentation.

## Related Issues

- Graph execution failing with "Required input missing" errors
- Properties not being used during execution
- Nodes requiring manual input connection even when properties are set

## References

- `src/core/NodeExecutor.ts` - Input gathering logic
- `src/core/BaseNode.ts` - Node property management
- `src/graph-management/GraphExecutionEngine.ts` - Graph execution engine
- `data/graphs/test-live-execution.json` - Test graph with property-based nodes

## Resolution Date

December 2024

## Implementation Status

✅ **RESOLVED** - Node properties are now used as default input values when inputs are not connected.

### Changes Made

1. **Updated `NodeExecutor.gatherNodeInputs()`**:
   - Added logic to check node properties for default input values
   - Properties are used only if input is not already set (from connection or initial input)
   - Properties are matched to input ports by name (property key = input port ID)

2. **Updated `GraphExecutionEngine.buildExecutor()`**:
   - Explicitly extracts `properties` from graph node definition
   - Sets properties on node instance using `setProperty()` method
   - Ensures properties are available for use as default inputs

### Implementation Details

**File**: `src/core/NodeExecutor.ts`
- Modified `gatherNodeInputs()` to check node properties after gathering from connections
- Uses type-safe property access with runtime checks

**File**: `src/graph-management/GraphExecutionEngine.ts`
- Extracts `properties` separately from graph node
- Sets properties on node after creation using `setProperty()` method
- Logs property setting for debugging

### Testing

After the fix, graph execution should:
- Use node properties as default values for unconnected required inputs
- Allow nodes like Math, String, Logger to work with property-based configuration
- Still allow connections to override property defaults
- Complete execution successfully for graphs with property-based nodes

### Example

**Graph Node:**
```json
{
  "id": "math-add",
  "type": "utility.math",
  "properties": {
    "operation": "add"
  }
}
```

**Execution Flow:**
1. Node created with `operation: "add"` property
2. Property set on node via `setProperty("operation", "add")`
3. `gatherNodeInputs()` checks for `operation` input
4. No connection provides `operation` input
5. Property `operation: "add"` is used as default
6. Node executes successfully with `operation = "add"`

