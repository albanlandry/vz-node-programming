# Test Graph for Live Execution

## Overview

This document describes the test graph created for testing the live execution feature in the Graph Editor.

## Graph File

**Location**: `data/graphs/test-live-execution.json`

**Name**: "Live Execution Test Graph"

## Graph Structure

### Nodes

The test graph contains 8 nodes:

1. **Constant Node 1** (`constant-1`)
   - Type: `utility.constant`
   - Position: (100, 100)
   - Properties: `type: "number"`, `value: "42"`
   - Output: Number value 42

2. **Constant Node 2** (`constant-2`)
   - Type: `utility.constant`
   - Position: (100, 250)
   - Properties: `type: "number"`, `value: "8"`
   - Output: Number value 8

3. **Constant Node 3** (`constant-3`)
   - Type: `utility.constant`
   - Position: (100, 400)
   - Properties: `type: "string"`, `value: "Hello, World!"`
   - Output: String value "Hello, World!"

4. **Math Add Node** (`math-add`)
   - Type: `utility.math`
   - Position: (350, 100)
   - Properties: `operation: "add"`
   - Inputs: Receives values from `constant-1` (A) and `constant-2` (B)
   - Output: 42 + 8 = 50

5. **Math Multiply Node** (`math-multiply`)
   - Type: `utility.math`
   - Position: (350, 250)
   - Properties: `operation: "multiply"`
   - Inputs: Receives values from `constant-1` (A) and `constant-2` (B)
   - Output: 42 × 8 = 336

6. **String Uppercase Node** (`string-upper`)
   - Type: `utility.string`
   - Position: (350, 400)
   - Properties: `operation: "toUpperCase"`
   - Inputs: Receives value from `constant-3`
   - Output: "HELLO, WORLD!"

7. **Logger Node 1** (`logger-1`)
   - Type: `utility.logger`
   - Position: (600, 150)
   - Properties: `level: "info"`
   - Inputs: Receives result from `math-add`
   - Output: Logs the number 50

8. **Logger Node 2** (`logger-2`)
   - Type: `utility.logger`
   - Position: (600, 400)
   - Properties: `level: "info"`
   - Inputs: Receives result from `string-upper`
   - Output: Logs the string "HELLO, WORLD!"

### Connections

The graph has 7 connections:

1. `constant-1.result` → `math-add.a` (42)
2. `constant-2.result` → `math-add.b` (8)
3. `constant-1.result` → `math-multiply.a` (42)
4. `constant-2.result` → `math-multiply.b` (8)
5. `constant-3.result` → `string-upper.input` ("Hello, World!")
6. `math-add.result` → `logger-1.data` (50)
7. `string-upper.result` → `logger-2.data` ("HELLO, WORLD!")

## Execution Flow

### Sequential Execution

When executed in sequential mode, the execution order is:

1. **Level 0** (No dependencies):
   - `constant-1` → outputs 42
   - `constant-2` → outputs 8
   - `constant-3` → outputs "Hello, World!"

2. **Level 1** (Depends on Level 0):
   - `math-add` → receives 42 and 8, outputs 50
   - `math-multiply` → receives 42 and 8, outputs 336
   - `string-upper` → receives "Hello, World!", outputs "HELLO, WORLD!"

3. **Level 2** (Depends on Level 1):
   - `logger-1` → receives 50, logs it
   - `logger-2` → receives "HELLO, WORLD!", logs it

### Parallel Execution

When executed in parallel mode:
- All nodes in Level 0 execute simultaneously
- All nodes in Level 1 execute simultaneously (after Level 0 completes)
- All nodes in Level 2 execute simultaneously (after Level 1 completes)

## Expected Results

### Node Execution Results

| Node ID | Status | Output | Execution Time |
|---------|--------|--------|----------------|
| `constant-1` | ✅ Completed | 42 | ~1ms |
| `constant-2` | ✅ Completed | 8 | ~1ms |
| `constant-3` | ✅ Completed | "Hello, World!" | ~1ms |
| `math-add` | ✅ Completed | 50 | ~1ms |
| `math-multiply` | ✅ Completed | 336 | ~1ms |
| `string-upper` | ✅ Completed | "HELLO, WORLD!" | ~1ms |
| `logger-1` | ✅ Completed | true (logged) | ~1ms |
| `logger-2` | ✅ Completed | true (logged) | ~1ms |

### Console Output

When executed, the Logger nodes will output:
```
[INFO] 50
[INFO] HELLO, WORLD!
```

## Testing Scenarios

### 1. Basic Execution Test
- Load the graph
- Click "Play" button
- Verify all nodes show "completed" status
- Verify Results Panel shows all outputs correctly

### 2. Sequential vs Parallel Test
- Execute in Sequential mode
- Note execution order in Results Panel
- Execute in Parallel mode
- Verify Level 0 nodes execute simultaneously
- Verify execution time is similar or faster

### 3. Visual State Test
- Execute the graph
- Verify node borders change color:
  - Blue when queued
  - Yellow when executing
  - Green when completed
- Verify status badges appear on nodes

### 4. Results Panel Test
- Execute the graph
- Verify Results Panel appears
- Expand each node result
- Verify output values are correct
- Verify execution times are displayed

### 5. Constant Node Configuration Test
- Double-click `constant-1` to open details panel
- Change value from "42" to "100"
- Execute graph
- Verify `math-add` now outputs 108 (100 + 8)
- Verify `math-multiply` now outputs 800 (100 × 8)

### 6. Error Handling Test
- Modify `constant-1` to have invalid value (e.g., "abc" for number type)
- Execute graph
- Verify `constant-1` shows failed status
- Verify error message in Results Panel
- Verify dependent nodes (`math-add`, `math-multiply`) may also fail

## Loading the Test Graph

### Method 1: Via Graph Editor UI
1. Open Graph Editor
2. Click "Load" button in Graph Toolbar
3. Select "Load from Backend"
4. If saved, select "Live Execution Test Graph"
5. If not saved, use Method 2

### Method 2: Direct File Load
1. Open Graph Editor
2. Click "Load" button in Graph Toolbar
3. Select "Load from File"
4. Navigate to `data/graphs/test-live-execution.json`
5. Select and load the file

### Method 3: Save First (Recommended)
1. Load the JSON file using Method 2
2. Click "Save" button
3. Enter name: "Live Execution Test Graph"
4. Save the graph
5. Now it will appear in "Load from Backend" list

## Modifications for Testing

### Test Case 1: Simple Addition
- Keep only `constant-1`, `constant-2`, `math-add`, and `logger-1`
- Remove other nodes and connections
- Expected: Logger outputs 50

### Test Case 2: String Operations Only
- Keep only `constant-3`, `string-upper`, and `logger-2`
- Remove other nodes and connections
- Expected: Logger outputs "HELLO, WORLD!"

### Test Case 3: Multiple Math Operations
- Add more Constant nodes with different values
- Add more Math nodes with different operations
- Connect them in various ways
- Expected: All operations execute correctly

### Test Case 4: Error Scenario
- Change `constant-1` value to invalid number (e.g., "not-a-number")
- Execute graph
- Expected: Error shown in Results Panel

## Notes

- The graph is designed to be simple enough to understand but complex enough to test various execution scenarios
- All nodes use built-in node types (no custom nodes required)
- The graph demonstrates both data flow and parallel execution capabilities
- Constant nodes are output-only and configured via properties
- Logger nodes provide visible output for verification

## Future Enhancements

Consider adding:
- Conditional node to test branching logic
- Array/Object nodes to test complex data types
- Error boundary nodes to test error handling
- Custom nodes to test custom node execution

