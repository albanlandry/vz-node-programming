/**
 * Error Handling Examples
 * 
 * Demonstrates:
 * - Retry policies with exponential backoff
 * - Circuit breaker pattern
 * - Fallback execution paths
 * - Error boundary nodes
 * - Dead letter queue
 */

import {
  NodeExecutor,
  ErrorHandlingNode,
  ErrorBoundaryNode,
  FallbackNode,
  RetryPolicy,
  RetryPolicies,
  CircuitBreaker,
  CircuitBreakerRegistry,
  CircuitState,
  DeadLetterQueue,
  ExecutionContext,
  DataTypes,
  PortId,
  NodeConfig
} from '../src/index';

/**
 * Test node that fails intermittently
 */
class UnreliableNode extends ErrorHandlingNode {
  private attemptCount = 0;
  private readonly failUntil: number;

  constructor(config: Partial<NodeConfig> & { failUntil?: number } = {}) {
    const { failUntil, ...nodeConfig } = config;
    super({
      ...nodeConfig,
      name: nodeConfig.name || 'Unreliable Service',
      description: 'Simulates an unreliable service that fails intermittently',
      inputs: [
        { id: 'data', name: 'Data', dataType: DataTypes.STRING, required: true }
      ],
      outputs: [
        { id: 'result', name: 'Result', dataType: DataTypes.STRING }
      ]
    });
    this.failUntil = failUntil || 2;
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    this.attemptCount++;
    const outputs = new Map<PortId, any>();
    const data = this.getInput<string>(context, 'data');

    if (this.attemptCount < this.failUntil) {
      throw new Error(`Service temporarily unavailable (attempt ${this.attemptCount})`);
    }

    this.setOutput(outputs, 'result', `Processed: ${data}`);
    return outputs;
  }

  resetAttempts(): void {
    this.attemptCount = 0;
  }
}

/**
 * Example 1: Retry Policy with Exponential Backoff
 */
async function retryPolicyExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         Retry Policy with Exponential Backoff           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Create node that fails twice then succeeds
  const unreliableNode = new UnreliableNode({ 
    failUntil: 3,
    name: 'Flaky API'
  });

  // Configure with Standard retry policy (3 attempts)
  unreliableNode.updateErrorConfig({
    retryPolicy: RetryPolicies.Standard
  });

  const executor = new NodeExecutor();
  executor.addNode(unreliableNode);

  // Prepare inputs
  const inputs = new Map();
  const nodeInputs = new Map<PortId, any>();
  nodeInputs.set('data', 'Test Data');
  inputs.set(unreliableNode.id, nodeInputs);

  console.log('🔄 Executing with retry policy...\n');
  const startTime = Date.now();

  try {
    const results = await executor.execute(inputs);
    const result = results.get(unreliableNode.id);
    
    if (result?.success) {
      console.log(`\n✅ Success after retries!`);
      console.log(`   Result: ${result.outputs?.get('result')}`);
      console.log(`   Total time: ${Date.now() - startTime}ms`);
    }
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

/**
 * Example 2: Circuit Breaker Pattern
 */
async function circuitBreakerExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              Circuit Breaker Pattern                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Create node that always fails
  const failingNode = new UnreliableNode({ 
    failUntil: 999,
    name: 'Broken Service'
  });

  // Create circuit breaker (open after 3 failures)
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 5000, // 5 seconds
    onStateChange: (oldState, newState) => {
      console.log(`\n🔌 Circuit state changed: ${oldState} → ${newState}`);
    }
  }, { nodeName: failingNode.name });

  failingNode.updateErrorConfig({
    circuitBreaker,
    retryPolicy: RetryPolicies.None // No retries, just circuit breaker
  });

  const executor = new NodeExecutor();
  executor.addNode(failingNode);

  const inputs = new Map();
  const nodeInputs = new Map<PortId, any>();
  nodeInputs.set('data', 'Test');
  inputs.set(failingNode.id, nodeInputs);

  console.log('Testing circuit breaker...\n');

  // Attempt multiple executions
  for (let i = 1; i <= 6; i++) {
    console.log(`Attempt ${i}:`);
    failingNode.resetAttempts();
    
    try {
      await executor.execute(inputs);
      console.log('  ✓ Success');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.log(`  ✗ ${err.message}`);
    }

    const stats = circuitBreaker.getStats();
    console.log(`  Circuit: ${stats.state}, Failures: ${stats.failures}\n`);

    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Final Circuit Breaker Stats:');
  const finalStats = circuitBreaker.getStats();
  console.log(`   State: ${finalStats.state}`);
  console.log(`   Failures: ${finalStats.failures}`);
}

/**
 * Example 3: Fallback Execution Paths
 */
async function fallbackExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           Fallback Execution Paths                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Create unreliable primary node
  const primaryNode = new UnreliableNode({ 
    failUntil: 999,
    name: 'Primary Service'
  });

  // Configure with fallback function
  primaryNode.updateErrorConfig({
    retryPolicy: RetryPolicies.Quick,
    fallbackFn: async (error, context) => {
      console.log(`   🔄 Fallback activated: ${error.message}`);
      const outputs = new Map<PortId, any>();
      outputs.set('result', 'Fallback result: Using cached data');
      return outputs;
    }
  });

  const executor = new NodeExecutor();
  executor.addNode(primaryNode);

  const inputs = new Map();
  const nodeInputs = new Map<PortId, any>();
  nodeInputs.set('data', 'Important Data');
  inputs.set(primaryNode.id, nodeInputs);

  console.log('🔄 Executing with fallback...\n');

  try {
    const results = await executor.execute(inputs);
    const result = results.get(primaryNode.id);
    
    if (result?.success) {
      console.log(`\n✅ Result: ${result.outputs?.get('result')}`);
    }
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

/**
 * Example 4: Error Boundary Nodes
 */
async function errorBoundaryExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              Error Boundary Nodes                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Create failing node
  const failingNode = new UnreliableNode({ 
    failUntil: 999,
    name: 'Failing Node'
  });
  failingNode.updateErrorConfig({ retryPolicy: RetryPolicies.None });

  // Create error boundary
  const errorBoundary = new ErrorBoundaryNode({
    name: 'Error Catcher'
  });

  // Create fallback node
  const fallbackNode = new FallbackNode({
    name: 'Fallback Handler'
  });

  const executor = new NodeExecutor();
  executor.addNode(failingNode);
  executor.addNode(errorBoundary);
  executor.addNode(fallbackNode);

  // Connect: failing → boundary → fallback
  executor.addConnection({
    id: 'conn1',
    fromNode: failingNode.id,
    fromPort: 'result',
    toNode: errorBoundary.id,
    toPort: 'value'
  });

  executor.addConnection({
    id: 'conn2',
    fromNode: errorBoundary.id,
    fromPort: 'result',
    toNode: fallbackNode.id,
    toPort: 'primary'
  });

  // Prepare inputs
  const inputs = new Map();
  
  const failingInputs = new Map<PortId, any>();
  failingInputs.set('data', 'Test');
  inputs.set(failingNode.id, failingInputs);

  const boundaryInputs = new Map<PortId, any>();
  boundaryInputs.set('defaultValue', 'Default safe value');
  inputs.set(errorBoundary.id, boundaryInputs);

  const fallbackInputs = new Map<PortId, any>();
  fallbackInputs.set('fallback', 'Emergency fallback');
  inputs.set(fallbackNode.id, fallbackInputs);

  console.log('🛡️  Testing error boundary...\n');

  try {
    const results = await executor.execute(inputs);
    
    const boundaryResult = results.get(errorBoundary.id);
    const fallbackResult = results.get(fallbackNode.id);
    
    console.log('\n📊 Results:');
    console.log(`   Error Boundary:`);
    console.log(`     Has Error: ${boundaryResult?.outputs?.get('hasError')}`);
    console.log(`     Result: ${boundaryResult?.outputs?.get('result')}`);
    console.log(`   Fallback:`);
    console.log(`     Used Fallback: ${fallbackResult?.outputs?.get('usedFallback')}`);
    console.log(`     Final Result: ${fallbackResult?.outputs?.get('result')}`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

/**
 * Example 5: Dead Letter Queue
 */
async function deadLetterQueueExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              Dead Letter Queue                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const dlq = DeadLetterQueue.getInstance();
  dlq.clear(); // Clear previous entries

  // Create multiple failing nodes
  const nodes = [
    new UnreliableNode({ failUntil: 999, name: 'Service A' }),
    new UnreliableNode({ failUntil: 999, name: 'Service B' }),
    new UnreliableNode({ failUntil: 999, name: 'Service C' })
  ];

  // Enable DLQ for all nodes
  nodes.forEach(node => {
    node.updateErrorConfig({
      enableDLQ: true,
      retryPolicy: RetryPolicies.Quick
    });
  });

  const executor = new NodeExecutor();
  nodes.forEach(node => executor.addNode(node));

  console.log('💀 Executing failing nodes with DLQ enabled...\n');

  // Execute each node (they will all fail)
  for (const node of nodes) {
    const inputs = new Map();
    const nodeInputs = new Map<PortId, any>();
    nodeInputs.set('data', `Data for ${node.name}`);
    inputs.set(node.id, nodeInputs);

    try {
      await executor.execute(inputs);
    } catch (error) {
      // Expected to fail
    }
  }

  // Check DLQ
  console.log('\n📊 Dead Letter Queue Statistics:');
  const stats = dlq.getStats();
  console.log(`   Total Entries: ${stats.total}`);
  console.log(`   Unprocessed: ${stats.unprocessed}`);
  console.log(`   By Node:`);
  stats.byNode.forEach((count, nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    console.log(`     ${node?.name || nodeId}: ${count} failures`);
  });

  // Show entries
  console.log('\n📋 DLQ Entries:');
  dlq.getAll().forEach((entry, index) => {
    console.log(`   ${index + 1}. ${entry.nodeName}`);
    console.log(`      Error: ${entry.error.message}`);
    console.log(`      Timestamp: ${entry.timestamp.toISOString()}`);
    console.log(`      Retry Attempts: ${entry.retryAttempts}`);
  });

  // Export DLQ
  console.log('\n💾 DLQ can be exported for analysis:');
  const exported = dlq.export();
  console.log(`   Exported ${JSON.parse(exported).length} entries`);
}

/**
 * Example 6: Combined Error Handling
 */
async function combinedExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       Combined Error Handling (All Features)            ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const dlq = DeadLetterQueue.getInstance();
  
  // Create node with all error handling features
  const resilientNode = new UnreliableNode({ 
    failUntil: 2, // Succeeds on 2nd attempt
    name: 'Resilient Service'
  });

  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 10000
  }, { nodeName: resilientNode.name });

  resilientNode.updateErrorConfig({
    retryPolicy: new RetryPolicy({
      maxAttempts: 3,
      initialDelay: 500,
      onRetry: (error, attempt, delay) => {
        console.log(`   ⚠️  Retry ${attempt}/3 in ${delay}ms: ${error.message}`);
      }
    }),
    circuitBreaker,
    enableDLQ: true,
    fallbackFn: async (error) => {
      console.log(`   🔄 Fallback: ${error.message}`);
      const outputs = new Map<PortId, any>();
      outputs.set('result', 'Fallback: Returning cached result');
      return outputs;
    }
  });

  const executor = new NodeExecutor();
  executor.addNode(resilientNode);

  const inputs = new Map();
  const nodeInputs = new Map<PortId, any>();
  nodeInputs.set('data', 'Critical Data');
  inputs.set(resilientNode.id, nodeInputs);

  console.log('🚀 Executing with full error handling stack...\n');

  try {
    const results = await executor.execute(inputs);
    const result = results.get(resilientNode.id);
    
    console.log('\n✅ Execution completed!');
    console.log(`   Result: ${result?.outputs?.get('result')}`);
    console.log(`   Execution time: ${result?.executionTime}ms`);
    
    console.log('\n📊 Circuit Breaker Status:');
    const cbStats = circuitBreaker.getStats();
    console.log(`   State: ${cbStats.state}`);
    console.log(`   Failures: ${cbStats.failures}`);
    
    console.log('\n💀 DLQ Status:');
    const dlqStats = dlq.getStats();
    console.log(`   Total Entries: ${dlqStats.total}`);
    console.log(`   Unprocessed: ${dlqStats.unprocessed}`);
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

/**
 * Run all error handling examples
 */
async function runAllErrorHandlingExamples() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('           ERROR HANDLING EXAMPLES                          ');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    await retryPolicyExample();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await circuitBreakerExample();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await fallbackExample();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await errorBoundaryExample();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await deadLetterQueueExample();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await combinedExample();
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ All error handling examples completed successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Example suite failed:', error);
  }
}

// Run if executed directly
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  runAllErrorHandlingExamples();
}

export {
  retryPolicyExample,
  circuitBreakerExample,
  fallbackExample,
  errorBoundaryExample,
  deadLetterQueueExample,
  combinedExample,
  runAllErrorHandlingExamples
};
