/**
 * Parallel Execution Example
 * 
 * Demonstrates the difference between sequential and parallel execution
 * Shows how independent nodes can run concurrently for better performance
 */

import { 
  NodeExecutor, 
  HttpRequestNode,
  DelayNode,
  MathNode,
  LoggerNode,
  TransformNode,
  Connection
} from '../src/index';

/**
 * Example 1: Sequential vs Parallel HTTP Requests
 * Shows performance improvement with parallel execution
 */
async function sequentialVsParallelExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║      Sequential vs Parallel Execution Comparison        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Sequential Execution
  console.log('📌 Sequential Execution (one after another):\n');
  const seqExecutor = new NodeExecutor();
  
  const seqHttp1 = new HttpRequestNode();
  const seqHttp2 = new HttpRequestNode();
  const seqHttp3 = new HttpRequestNode();
  
  seqExecutor.addNode(seqHttp1);
  seqExecutor.addNode(seqHttp2);
  seqExecutor.addNode(seqHttp3);
  
  const seqInputs = new Map();
  
  const seq1Inputs = new Map();
  seq1Inputs.set('url', 'https://jsonplaceholder.typicode.com/posts/1');
  seq1Inputs.set('method', 'GET');
  seqInputs.set(seqHttp1.id, seq1Inputs);
  
  const seq2Inputs = new Map();
  seq2Inputs.set('url', 'https://jsonplaceholder.typicode.com/posts/2');
  seq2Inputs.set('method', 'GET');
  seqInputs.set(seqHttp2.id, seq2Inputs);
  
  const seq3Inputs = new Map();
  seq3Inputs.set('url', 'https://jsonplaceholder.typicode.com/posts/3');
  seq3Inputs.set('method', 'GET');
  seqInputs.set(seqHttp3.id, seq3Inputs);
  
  const seqStart = Date.now();
  await seqExecutor.execute(seqInputs);
  const seqTime = Date.now() - seqStart;
  
  console.log(`   ⏱️  Sequential execution time: ${seqTime}ms`);
  console.log(`   📊 3 requests executed one after another\n`);

  // Parallel Execution
  console.log('📌 Parallel Execution (all at once):\n');
  const parExecutor = new NodeExecutor();
  
  const parHttp1 = new HttpRequestNode();
  const parHttp2 = new HttpRequestNode();
  const parHttp3 = new HttpRequestNode();
  
  parExecutor.addNode(parHttp1);
  parExecutor.addNode(parHttp2);
  parExecutor.addNode(parHttp3);
  
  const parInputs = new Map();
  
  const par1Inputs = new Map();
  par1Inputs.set('url', 'https://jsonplaceholder.typicode.com/posts/1');
  par1Inputs.set('method', 'GET');
  parInputs.set(parHttp1.id, par1Inputs);
  
  const par2Inputs = new Map();
  par2Inputs.set('url', 'https://jsonplaceholder.typicode.com/posts/2');
  par2Inputs.set('method', 'GET');
  parInputs.set(parHttp2.id, par2Inputs);
  
  const par3Inputs = new Map();
  par3Inputs.set('url', 'https://jsonplaceholder.typicode.com/posts/3');
  par3Inputs.set('method', 'GET');
  parInputs.set(parHttp3.id, par3Inputs);
  
  const parStart = Date.now();
  await parExecutor.executeParallel(parInputs);
  const parTime = Date.now() - parStart;
  
  console.log(`   ⏱️  Parallel execution time: ${parTime}ms`);
  console.log(`   📊 3 requests executed simultaneously\n`);

  // Results comparison
  console.log('═'.repeat(60));
  console.log('📊 Performance Comparison:');
  console.log('═'.repeat(60));
  console.log(`Sequential: ${seqTime}ms`);
  console.log(`Parallel:   ${parTime}ms`);
  console.log(`Speedup:    ${(seqTime / parTime).toFixed(2)}x faster`);
  console.log(`Saved:      ${seqTime - parTime}ms`);
  console.log('═'.repeat(60) + '\n');
}

/**
 * Example 2: Mixed Dependencies
 * Shows how parallel execution works with dependencies
 */
async function mixedDependenciesExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║        Parallel Execution with Dependencies             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const executor = new NodeExecutor();
  
  // Level 0: Two independent math operations (can run in parallel)
  const math1 = new MathNode();
  const math2 = new MathNode();
  
  // Level 1: Combine results (depends on both math1 and math2)
  const math3 = new MathNode();
  
  // Level 2: Final transformation
  const transform = new TransformNode();
  const logger = new LoggerNode();
  
  executor.addNode(math1);
  executor.addNode(math2);
  executor.addNode(math3);
  executor.addNode(transform);
  executor.addNode(logger);
  
  // Create connections to establish dependencies
  executor.addConnection({
    id: 'conn1',
    fromNode: math1.id,
    fromPort: 'result',
    toNode: math3.id,
    toPort: 'a'
  });
  
  executor.addConnection({
    id: 'conn2',
    fromNode: math2.id,
    fromPort: 'result',
    toNode: math3.id,
    toPort: 'b'
  });
  
  executor.addConnection({
    id: 'conn3',
    fromNode: math3.id,
    fromPort: 'result',
    toNode: transform.id,
    toPort: 'data'
  });
  
  executor.addConnection({
    id: 'conn4',
    fromNode: transform.id,
    fromPort: 'result',
    toNode: logger.id,
    toPort: 'message'
  });
  
  const initialInputs = new Map();
  
  // Math1: 10 * 5 = 50
  const math1Inputs = new Map();
  math1Inputs.set('operation', 'multiply');
  math1Inputs.set('a', 10);
  math1Inputs.set('b', 5);
  initialInputs.set(math1.id, math1Inputs);
  
  // Math2: 8 + 12 = 20
  const math2Inputs = new Map();
  math2Inputs.set('operation', 'add');
  math2Inputs.set('a', 8);
  math2Inputs.set('b', 12);
  initialInputs.set(math2.id, math2Inputs);
  
  // Math3: result1 + result2 (will be 50 + 20 = 70)
  const math3Inputs = new Map();
  math3Inputs.set('operation', 'add');
  initialInputs.set(math3.id, math3Inputs);
  
  // Transform: Format the result
  const transformInputs = new Map();
  transformInputs.set('transformer', (value: number) => {
    return `
╔═══════════════════════════════════════╗
║     Parallel Computation Result       ║
╠═══════════════════════════════════════╣
║                                       ║
║  Math1 (10 × 5) = 50    ║ Level 0   ║
║  Math2 (8 + 12) = 20    ║ Level 0   ║
║  ────────────────────────────────     ║
║  Math3 (50 + 20) = ${value}    ║ Level 1   ║
║                                       ║
║  ✓ Level 0 nodes ran in parallel!    ║
║                                       ║
╚═══════════════════════════════════════╝
    `;
  });
  initialInputs.set(transform.id, transformInputs);
  
  // Logger
  const loggerInputs = new Map();
  loggerInputs.set('level', 'info');
  loggerInputs.set('data', { 
    execution: 'parallel',
    levels: 3
  });
  initialInputs.set(logger.id, loggerInputs);
  
  console.log('🚀 Executing workflow with parallel optimization...\n');
  console.log('Execution Plan:');
  console.log('  Level 0: Math1 and Math2 (parallel) ⚡');
  console.log('  Level 1: Math3 (waits for Level 0) ⏸️');
  console.log('  Level 2: Transform and Logger (parallel) ⚡\n');
  
  const startTime = Date.now();
  
  // Track execution events
  let level0Complete = false;
  let level1Complete = false;
  
  executor.on('execution_completed', (event) => {
    const nodeName = executor.getNodes().find(n => n.id === event.data.nodeId)?.name;
    const time = event.data.result.executionTime;
    
    if (nodeName === 'Math' && !level0Complete) {
      console.log(`  ✓ Level 0 node completed: ${nodeName} (${time}ms)`);
    } else if (nodeName === 'Math' && level0Complete && !level1Complete) {
      console.log(`  ✓ Level 1 node completed: ${nodeName} (${time}ms)`);
      level1Complete = true;
    }
    
    if (nodeName === 'Math') {
      const results = executor.getExecutionResults();
      const completedMath = Array.from(results.entries()).filter(
        ([id, _]) => executor.getNodes().find(n => n.id === id)?.name === 'Math'
      ).length;
      
      if (completedMath === 2 && !level0Complete) {
        console.log(`  📊 Level 0 complete! (Both nodes finished)\n`);
        level0Complete = true;
      }
    }
  });
  
  const results = await executor.executeParallel(initialInputs);
  const totalTime = Date.now() - startTime;
  
  console.log(`\n⏱️  Total execution time: ${totalTime}ms\n`);
}

/**
 * Example 3: Delay Nodes - Visualizing Parallel Execution
 */
async function delayNodesExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         Delay Nodes: Sequential vs Parallel             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Sequential delays
  console.log('📌 Sequential: 3 delays of 500ms each\n');
  const seqExecutor = new NodeExecutor();
  
  const seqDelay1 = new DelayNode();
  const seqDelay2 = new DelayNode();
  const seqDelay3 = new DelayNode();
  
  seqExecutor.addNode(seqDelay1);
  seqExecutor.addNode(seqDelay2);
  seqExecutor.addNode(seqDelay3);
  
  const seqInputs = new Map();
  
  const seqD1 = new Map();
  seqD1.set('value', 'Task 1');
  seqD1.set('delay', 500);
  seqInputs.set(seqDelay1.id, seqD1);
  
  const seqD2 = new Map();
  seqD2.set('value', 'Task 2');
  seqD2.set('delay', 500);
  seqInputs.set(seqDelay2.id, seqD2);
  
  const seqD3 = new Map();
  seqD3.set('value', 'Task 3');
  seqD3.set('delay', 500);
  seqInputs.set(seqDelay3.id, seqD3);
  
  const seqStart = Date.now();
  await seqExecutor.execute(seqInputs);
  const seqTime = Date.now() - seqStart;
  
  console.log(`   Expected: ~1500ms (500 + 500 + 500)`);
  console.log(`   Actual:   ${seqTime}ms\n`);

  // Parallel delays
  console.log('📌 Parallel: 3 delays of 500ms each (simultaneously)\n');
  const parExecutor = new NodeExecutor();
  
  const parDelay1 = new DelayNode();
  const parDelay2 = new DelayNode();
  const parDelay3 = new DelayNode();
  
  parExecutor.addNode(parDelay1);
  parExecutor.addNode(parDelay2);
  parExecutor.addNode(parDelay3);
  
  const parInputs = new Map();
  
  const parD1 = new Map();
  parD1.set('value', 'Task 1');
  parD1.set('delay', 500);
  parInputs.set(parDelay1.id, parD1);
  
  const parD2 = new Map();
  parD2.set('value', 'Task 2');
  parD2.set('delay', 500);
  parInputs.set(parDelay2.id, parD2);
  
  const parD3 = new Map();
  parD3.set('value', 'Task 3');
  parD3.set('delay', 500);
  parInputs.set(parDelay3.id, parD3);
  
  const parStart = Date.now();
  await parExecutor.executeParallel(parInputs);
  const parTime = Date.now() - parStart;
  
  console.log(`   Expected: ~500ms (all run together)`);
  console.log(`   Actual:   ${parTime}ms\n`);

  console.log('═'.repeat(60));
  console.log(`Sequential took: ${seqTime}ms`);
  console.log(`Parallel took:   ${parTime}ms`);
  console.log(`Speedup:         ${(seqTime / parTime).toFixed(2)}x`);
  console.log('═'.repeat(60) + '\n');
}

/**
 * Run all parallel execution examples
 */
async function runAllParallelExamples() {
  try {
    await sequentialVsParallelExample();
    await mixedDependenciesExample();
    await delayNodesExample();
    
    console.log('\n✅ All parallel execution examples completed!\n');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Run if executed directly
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  runAllParallelExamples();
}

export {
  sequentialVsParallelExample,
  mixedDependenciesExample,
  delayNodesExample,
  runAllParallelExamples
};
