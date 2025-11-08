/**
 * Example: Enhanced Debugging System
 * 
 * Demonstrates:
 * - Variable inspection
 * - Watch expressions
 * - Breakpoints (including conditional)
 * - Time-travel debugging
 * - Execution history
 */

import {
  NodeExecutor,
  ConstantNode,
  MathNode,
  TransformNode,
  DataTypes,
  ExecutionContext,
} from '../src';
import {
  Debugger,
  BreakpointType,
  DebugEventType,
} from '../src/debugging';

/**
 * Example demonstrating enhanced debugging features
 */
async function main() {
  console.log('=== Enhanced Debugging Example ===\n');

  // Create executor
  const executor = new NodeExecutor();

  // Create nodes
  const constantNode = new ConstantNode({
    name: 'Constant',
    properties: {
      type: 'number',
      value: '10',
    },
  });

  const mathNode = new MathNode({
    name: 'Math',
  });

  const transformNode = new TransformNode({
    name: 'Transform',
  });

  // Add nodes to executor
  executor.addNode(constantNode);
  executor.addNode(mathNode);
  executor.addNode(transformNode);

  // Create connections
  executor.addConnection({
    id: 'conn-1',
    fromNode: constantNode.id,
    fromPort: 'output',
    toNode: mathNode.id,
    toPort: 'a',
  });

  executor.addConnection({
    id: 'conn-2',
    fromNode: mathNode.id,
    fromPort: 'result',
    toNode: transformNode.id,
    toPort: 'input',
  });

  // Create debugger
  const dbg = new Debugger({
    enabled: true,
    createSnapshots: true,
    evaluateWatches: true,
    breakOnError: true,
  });

  // Add breakpoint before math node execution
  dbg.addBreakpoint({
    id: 'bp-1',
    nodeId: mathNode.id,
    type: BreakpointType.BEFORE_EXECUTE,
    enabled: true,
  });

  // Add conditional breakpoint on transform node
  dbg.addBreakpoint({
    id: 'bp-2',
    nodeId: transformNode.id,
    type: BreakpointType.BEFORE_EXECUTE,
    enabled: true,
    condition: 'inputs.get("input") > 50',
  });

  // Add watch expressions
  dbg.addWatchExpression({
    id: 'watch-1',
    expression: 'inputs.get("a")',
    label: 'Math input A',
    breakOnChange: false,
  });

  dbg.addWatchExpression({
    id: 'watch-2',
    expression: 'outputs.get("result")',
    label: 'Math result',
    breakOnChange: true,
  });

  // Listen to debug events
  dbg.on('debugEvent', (event) => {
    console.log(`[Debug Event] ${event.type}:`, event.data);
  });

  // Wrap executor's executeNode to integrate debugging
  const originalExecute = executor['executeNode'].bind(executor);
  executor['executeNode'] = async function(
    nodeId: string,
    executionId: string,
    initialInputs: Map<string, Map<string, unknown>>,
    nodeTimeout?: number,
  ) {
    // Get node
    const node = this['nodes'].get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Create execution context
    const context: ExecutionContext = {
      executionId,
      inputs: new Map(),
      outputs: new Map(),
      metadata: new Map(),
    };

    // Check breakpoint before execution
      const shouldBreak = await dbg.checkBreakpointBefore(nodeId, context);
      if (shouldBreak) {
        console.log(`⏸️  Execution paused at breakpoint on node ${nodeId}`);
        await dbg.waitForResume();
      }

    // Execute node (simplified - in real implementation, this would be more complex)
    try {
      // In a real scenario, we'd call the actual execute method
      // For this example, we'll just demonstrate the debugging flow
      console.log(`▶️  Executing node ${nodeId}`);

      // Evaluate watch expressions
      await dbg.evaluateWatches(context);

      // Check breakpoint after execution
      const result = {
        success: true,
        outputs: new Map(),
        executionTime: 10,
      };
      
      const shouldBreakAfter = await dbg.checkBreakpointAfter(nodeId, context, result);
      if (shouldBreakAfter) {
        console.log(`⏸️  Execution paused at breakpoint after node ${nodeId}`);
        await dbg.waitForResume();
      }
    } catch (error) {
      // Check breakpoint on error
      await dbg.checkBreakpointOnError(nodeId, context, error as any);
      throw error;
    }
  };

  // Execute graph
  console.log('Starting execution with debugging enabled...\n');

  try {
    await executor.execute(new Map(), {
      timeout: 5000,
    });

    console.log('\n✅ Execution completed');

    // Display execution history
    const history = dbg.getHistory();
    console.log(`\n📊 Execution History: ${history.length} entries`);

    // Display snapshots
    const snapshots = dbg.getSnapshotsForExecution('exec-1');
    console.log(`📸 Snapshots: ${snapshots.length} snapshots`);

    // Demonstrate time-travel debugging
    if (snapshots.length > 0) {
      console.log('\n🕐 Time-Travel Debugging:');
      console.log(`Current step: ${snapshots[0].stepNumber}`);
      
      // Step forward
      const next = dbg.stepForward();
      if (next) {
        console.log(`Stepped forward to step: ${next.stepNumber}`);
      }

      // Step backward
      const prev = dbg.stepBackward();
      if (prev) {
        console.log(`Stepped backward to step: ${prev.stepNumber}`);
      }
    }

    // Display watch expression results
    const watches = dbg.getWatchExpressions();
    console.log(`\n👀 Watch Expressions: ${watches.length} watches`);
    watches.forEach(watch => {
      console.log(`  - ${watch.label || watch.expression}: ${watch.lastValue}`);
    });

  } catch (error) {
    console.error('❌ Execution failed:', error);
  }
}

// Run example if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };

