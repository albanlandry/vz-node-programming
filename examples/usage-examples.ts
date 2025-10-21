import { 
  NodeExecutor, 
  MapNode, 
  FilterNode, 
  CalculatorNode, 
  DelayNode, 
  ConditionalNode,
  MathNode,
  LoggerNode,
  Connection
} from '../src/index';

/**
 * Example 1: Functional Programming Pipeline
 * Demonstrates functional programming with map, filter, and reduce operations
 */
async function functionalProgrammingExample() {
  console.log('\n=== Functional Programming Example ===');
  
  const executor = new NodeExecutor();
  
  // Create nodes
  const mapNode = new MapNode();
  const filterNode = new FilterNode();
  const loggerNode = new LoggerNode();
  
  // Add nodes to executor
  executor.addNode(mapNode);
  executor.addNode(filterNode);
  executor.addNode(loggerNode);
  
  // Create connections
  const connection1: Connection = {
    id: 'conn1',
    fromNode: mapNode.id,
    fromPort: 'result',
    toNode: filterNode.id,
    toPort: 'array'
  };
  
  const connection2: Connection = {
    id: 'conn2',
    fromNode: filterNode.id,
    fromPort: 'result',
    toNode: loggerNode.id,
    toPort: 'message'
  };
  
  executor.addConnection(connection1);
  executor.addConnection(connection2);
  
  // Set up initial inputs
  const initialInputs = new Map();
  const mapInputs = new Map();
  mapInputs.set('array', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  mapInputs.set('function', (x: number) => x * x); // Square each number
  initialInputs.set(mapNode.id, mapInputs);
  
  const filterInputs = new Map();
  filterInputs.set('predicate', (x: number) => x > 25); // Filter squares > 25
  initialInputs.set(filterNode.id, filterInputs);
  
  const loggerInputs = new Map();
  loggerInputs.set('level', 'info');
  loggerInputs.set('data', { operation: 'functional_pipeline' });
  initialInputs.set(loggerNode.id, loggerInputs);
  
  // Execute the pipeline
  const results = await executor.execute(initialInputs);
  
  console.log('Results:', results);
  console.log('Final filtered squares:', results.get(filterNode.id)?.outputs?.get('result'));
}

/**
 * Example 2: Object-Oriented Programming with State
 * Demonstrates OOP with stateful calculator operations
 */
async function objectOrientedExample() {
  console.log('\n=== Object-Oriented Programming Example ===');
  
  const executor = new NodeExecutor();
  
  // Create calculator node
  const calculator = new CalculatorNode();
  executor.addNode(calculator);
  
  // Perform a series of calculations
  const operations = [
    { operation: 'add', value: 10 },
    { operation: 'multiply', value: 2 },
    { operation: 'subtract', value: 5 },
    { operation: 'divide', value: 3 }
  ];
  
  for (const op of operations) {
    const initialInputs = new Map();
    const inputs = new Map();
    inputs.set('operation', op.operation);
    inputs.set('value', op.value);
    initialInputs.set(calculator.id, inputs);
    
    const results = await executor.execute(initialInputs);
    const result = results.get(calculator.id)?.outputs?.get('result');
    const state = results.get(calculator.id)?.outputs?.get('state');
    
    console.log(`${op.operation}(${op.value}): result=${result}, state=`, state);
  }
}

/**
 * Example 3: Async Programming with Delays and HTTP
 * Demonstrates async operations with delays and error handling
 */
async function asyncProgrammingExample() {
  console.log('\n=== Async Programming Example ===');
  
  const executor = new NodeExecutor();
  
  // Create nodes
  const delayNode = new DelayNode();
  const conditionalNode = new ConditionalNode();
  const loggerNode = new LoggerNode();
  
  executor.addNode(delayNode);
  executor.addNode(conditionalNode);
  executor.addNode(loggerNode);
  
  // Create connections
  const connection1: Connection = {
    id: 'conn1',
    fromNode: delayNode.id,
    fromPort: 'result',
    toNode: conditionalNode.id,
    toPort: 'condition'
  };
  
  const connection2: Connection = {
    id: 'conn2',
    fromNode: conditionalNode.id,
    fromPort: 'result',
    toNode: loggerNode.id,
    toPort: 'message'
  };
  
  executor.addConnection(connection1);
  executor.addConnection(connection2);
  
  // Set up initial inputs
  const initialInputs = new Map();
  
  const delayInputs = new Map();
  delayInputs.set('value', true);
  delayInputs.set('delay', 1000); // 1 second delay
  initialInputs.set(delayNode.id, delayInputs);
  
  const conditionalInputs = new Map();
  conditionalInputs.set('trueValue', 'Delay completed successfully!');
  conditionalInputs.set('falseValue', 'Delay failed!');
  initialInputs.set(conditionalNode.id, conditionalInputs);
  
  const loggerInputs = new Map();
  loggerInputs.set('level', 'info');
  loggerInputs.set('data', { async_operation: 'delay_test' });
  initialInputs.set(loggerNode.id, loggerInputs);
  
  console.log('Starting async delay operation...');
  const startTime = Date.now();
  
  const results = await executor.execute(initialInputs);
  
  const endTime = Date.now();
  console.log(`Async operation completed in ${endTime - startTime}ms`);
  console.log('Results:', results);
}

/**
 * Example 4: Mixed Paradigm Complex Workflow
 * Demonstrates mixing functional, OOP, and async paradigms
 */
async function mixedParadigmExample() {
  console.log('\n=== Mixed Paradigm Example ===');
  
  const executor = new NodeExecutor();
  
  // Create nodes from different paradigms
  const mathNode1 = new MathNode();
  const mathNode2 = new MathNode();
  const loggerNode1 = new LoggerNode();
  const loggerNode2 = new LoggerNode();
  
  executor.addNode(mathNode1);
  executor.addNode(mathNode2);
  executor.addNode(loggerNode1);
  executor.addNode(loggerNode2);
  
  // Create a workflow where nodes execute in sequence
  const connections: Connection[] = [
    {
      id: 'conn1',
      fromNode: mathNode1.id,
      fromPort: 'result',
      toNode: mathNode2.id,
      toPort: 'a'
    },
    {
      id: 'conn2',
      fromNode: mathNode1.id,
      fromPort: 'result',
      toNode: loggerNode1.id,
      toPort: 'message'
    },
    {
      id: 'conn3',
      fromNode: mathNode2.id,
      fromPort: 'result',
      toNode: loggerNode2.id,
      toPort: 'message'
    }
  ];
  
  connections.forEach(conn => executor.addConnection(conn));
  
  // Set up initial inputs
  const initialInputs = new Map();
  
  // Math 1: Calculate 5 * 5
  const math1Inputs = new Map();
  math1Inputs.set('operation', 'multiply');
  math1Inputs.set('a', 5);
  math1Inputs.set('b', 5);
  initialInputs.set(mathNode1.id, math1Inputs);
  
  // Math 2: Subtract 20 from result of Math 1
  const math2Inputs = new Map();
  math2Inputs.set('operation', 'subtract');
  math2Inputs.set('b', 20);
  initialInputs.set(mathNode2.id, math2Inputs);
  
  // Logger 1: Log the first calculation
  const logger1Inputs = new Map();
  logger1Inputs.set('level', 'info');
  logger1Inputs.set('data', { step: 'Math 1: 5 * 5' });
  initialInputs.set(loggerNode1.id, logger1Inputs);
  
  // Logger 2: Log the second calculation
  const logger2Inputs = new Map();
  logger2Inputs.set('level', 'info');
  logger2Inputs.set('data', { step: 'Math 2: result - 20' });
  initialInputs.set(loggerNode2.id, logger2Inputs);
  
  console.log('Executing mixed paradigm workflow...');
  const results = await executor.execute(initialInputs);
  
  console.log('Workflow completed!');
  console.log('Math 1 result:', results.get(mathNode1.id)?.outputs?.get('result'));
  console.log('Math 2 result:', results.get(mathNode2.id)?.outputs?.get('result'));
}

/**
 * Example 5: Error Handling and Recovery
 * Demonstrates error propagation and handling
 */
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');
  
  const executor = new NodeExecutor();
  
  // Create nodes
  const mathNode = new MathNode();
  const conditionalNode = new ConditionalNode();
  const loggerNode = new LoggerNode();
  
  executor.addNode(mathNode);
  executor.addNode(conditionalNode);
  executor.addNode(loggerNode);
  
  // Set up error handling
  executor.on('execution_failed', (event) => {
    console.log('Execution failed:', event.data);
  });
  
  try {
    // Try to divide by zero (this will cause an error)
    const initialInputs = new Map();
    const inputs = new Map();
    inputs.set('operation', 'divide');
    inputs.set('a', 10);
    inputs.set('b', 0); // This will cause division by zero error
    initialInputs.set(mathNode.id, inputs);
    
    const results = await executor.execute(initialInputs);
    console.log('Results:', results);
  } catch (error) {
    console.log('Caught error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await functionalProgrammingExample();
    await objectOrientedExample();
    await asyncProgrammingExample();
    await mixedParadigmExample();
    await errorHandlingExample();
    
    console.log('\n=== All Examples Completed Successfully! ===');
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run examples if this file is executed directly
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  runAllExamples();
}

export {
  functionalProgrammingExample,
  objectOrientedExample,
  asyncProgrammingExample,
  mixedParadigmExample,
  errorHandlingExample,
  runAllExamples
};