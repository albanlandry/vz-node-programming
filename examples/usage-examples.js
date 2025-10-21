"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionalProgrammingExample = functionalProgrammingExample;
exports.objectOrientedExample = objectOrientedExample;
exports.asyncProgrammingExample = asyncProgrammingExample;
exports.mixedParadigmExample = mixedParadigmExample;
exports.errorHandlingExample = errorHandlingExample;
exports.runAllExamples = runAllExamples;
const index_1 = require("../src/index");
/**
 * Example 1: Functional Programming Pipeline
 * Demonstrates functional programming with map, filter, and reduce operations
 */
async function functionalProgrammingExample() {
    console.log('\n=== Functional Programming Example ===');
    const executor = new index_1.NodeExecutor();
    // Create nodes
    const mapNode = new index_1.MapNode();
    const filterNode = new index_1.FilterNode();
    const loggerNode = new index_1.LoggerNode();
    // Add nodes to executor
    executor.addNode(mapNode);
    executor.addNode(filterNode);
    executor.addNode(loggerNode);
    // Create connections
    const connection1 = {
        id: 'conn1',
        fromNode: mapNode.id,
        fromPort: 'result',
        toNode: filterNode.id,
        toPort: 'array'
    };
    const connection2 = {
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
    mapInputs.set('function', (x) => x * x); // Square each number
    initialInputs.set(mapNode.id, mapInputs);
    const filterInputs = new Map();
    filterInputs.set('predicate', (x) => x > 25); // Filter squares > 25
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
    const executor = new index_1.NodeExecutor();
    // Create calculator node
    const calculator = new index_1.CalculatorNode();
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
    const executor = new index_1.NodeExecutor();
    // Create nodes
    const delayNode = new index_1.DelayNode();
    const conditionalNode = new index_1.ConditionalNode();
    const loggerNode = new index_1.LoggerNode();
    executor.addNode(delayNode);
    executor.addNode(conditionalNode);
    executor.addNode(loggerNode);
    // Create connections
    const connection1 = {
        id: 'conn1',
        fromNode: delayNode.id,
        fromPort: 'result',
        toNode: conditionalNode.id,
        toPort: 'condition'
    };
    const connection2 = {
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
    const executor = new index_1.NodeExecutor();
    // Create nodes from different paradigms
    const mapNode = new index_1.MapNode();
    const calculator = new index_1.CalculatorNode();
    const mathNode = new index_1.MathNode();
    const conditionalNode = new index_1.ConditionalNode();
    const loggerNode = new index_1.LoggerNode();
    executor.addNode(mapNode);
    executor.addNode(calculator);
    executor.addNode(mathNode);
    executor.addNode(conditionalNode);
    executor.addNode(loggerNode);
    // Create a complex workflow
    const connections = [
        {
            id: 'conn1',
            fromNode: mapNode.id,
            fromPort: 'result',
            toNode: calculator.id,
            toPort: 'value'
        },
        {
            id: 'conn2',
            fromNode: calculator.id,
            fromPort: 'result',
            toNode: mathNode.id,
            toPort: 'a'
        },
        {
            id: 'conn3',
            fromNode: mathNode.id,
            fromPort: 'result',
            toNode: conditionalNode.id,
            toPort: 'condition'
        },
        {
            id: 'conn4',
            fromNode: conditionalNode.id,
            fromPort: 'result',
            toNode: loggerNode.id,
            toPort: 'message'
        }
    ];
    connections.forEach(conn => executor.addConnection(conn));
    // Set up initial inputs
    const initialInputs = new Map();
    // Functional: Map numbers to their squares
    const mapInputs = new Map();
    mapInputs.set('array', [1, 2, 3, 4, 5]);
    mapInputs.set('function', (x) => x * x);
    initialInputs.set(mapNode.id, mapInputs);
    // OOP: Add 10 to the first result
    const calculatorInputs = new Map();
    calculatorInputs.set('operation', 'add');
    calculatorInputs.set('value', 10);
    initialInputs.set(calculator.id, calculatorInputs);
    // Math: Check if result is greater than 20
    const mathInputs = new Map();
    mathInputs.set('operation', 'subtract');
    mathInputs.set('b', 20);
    initialInputs.set(mathNode.id, mathInputs);
    // Conditional: Choose message based on result
    const conditionalInputs = new Map();
    conditionalInputs.set('trueValue', 'Result is greater than 20!');
    conditionalInputs.set('falseValue', 'Result is 20 or less.');
    initialInputs.set(conditionalNode.id, conditionalInputs);
    // Logger: Log the final result
    const loggerInputs = new Map();
    loggerInputs.set('level', 'info');
    loggerInputs.set('data', { workflow: 'mixed_paradigm' });
    initialInputs.set(loggerNode.id, loggerInputs);
    console.log('Executing mixed paradigm workflow...');
    const results = await executor.execute(initialInputs);
    console.log('Workflow completed!');
    console.log('Final result:', results.get(loggerNode.id)?.outputs?.get('logged'));
}
/**
 * Example 5: Error Handling and Recovery
 * Demonstrates error propagation and handling
 */
async function errorHandlingExample() {
    console.log('\n=== Error Handling Example ===');
    const executor = new index_1.NodeExecutor();
    // Create nodes
    const mathNode = new index_1.MathNode();
    const conditionalNode = new index_1.ConditionalNode();
    const loggerNode = new index_1.LoggerNode();
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
    }
    catch (error) {
        console.log('Caught error:', error.message);
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
    }
    catch (error) {
        console.error('Example failed:', error);
    }
}
// Run examples if this file is executed directly
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
    runAllExamples();
}
//# sourceMappingURL=usage-examples.js.map