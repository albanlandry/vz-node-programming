/**
 * Simple HTTP Request Example
 * 
 * This is a minimal example showing how to:
 * 1. Make an asynchronous HTTP GET request
 * 2. Transform the response data
 * 3. Display the results
 */

import { NodeExecutor, HttpRequestNode, TransformNode, LoggerNode } from '../src/index';

async function simpleHttpExample() {
  console.log('🌐 Simple Async HTTP Request Example\n');
  
  // Step 1: Create the executor
  const executor = new NodeExecutor();
  
  // Step 2: Create nodes
  const httpNode = new HttpRequestNode();      // Makes HTTP requests
  const transformNode = new TransformNode();   // Transforms data
  const loggerNode = new LoggerNode();         // Logs output
  
  // Step 3: Add nodes to the executor
  executor.addNode(httpNode);
  executor.addNode(transformNode);
  executor.addNode(loggerNode);
  
  // Step 4: Connect the nodes (create a pipeline)
  // HTTP data → Transform → Logger
  executor.addConnection({
    id: 'http-to-transform',
    fromNode: httpNode.id,
    fromPort: 'data',
    toNode: transformNode.id,
    toPort: 'data'
  });
  
  executor.addConnection({
    id: 'transform-to-logger',
    fromNode: transformNode.id,
    fromPort: 'result',
    toNode: loggerNode.id,
    toPort: 'message'
  });
  
  // Step 5: Configure the nodes with inputs
  const initialInputs = new Map();
  
  // Configure HTTP node: GET request to a public API
  const httpInputs = new Map();
  httpInputs.set('url', 'https://jsonplaceholder.typicode.com/users/1');
  httpInputs.set('method', 'GET');
  initialInputs.set(httpNode.id, httpInputs);
  
  // Configure Transform node: Format the response nicely
  const transformInputs = new Map();
  transformInputs.set('transformer', (user: any) => {
    return `
📧 User Information Retrieved:
   
   👤 Name:     ${user.name}
   📧 Email:    ${user.email}
   🏢 Company:  ${user.company?.name}
   🌐 Website:  ${user.website}
   📍 City:     ${user.address?.city}
    `;
  });
  initialInputs.set(transformNode.id, transformInputs);
  
  // Configure Logger node: Set log level
  const loggerInputs = new Map();
  loggerInputs.set('level', 'info');
  loggerInputs.set('data', { source: 'JSONPlaceholder API' });
  initialInputs.set(loggerNode.id, loggerInputs);
  
  // Step 6: Execute the workflow
  console.log('⏳ Making HTTP request...\n');
  const startTime = Date.now();
  
  try {
    const results = await executor.execute(initialInputs);
    const endTime = Date.now();
    
    // Display results
    console.log('\n' + '─'.repeat(60));
    console.log(`✓ Request completed in ${endTime - startTime}ms`);
    
    const httpResult = results.get(httpNode.id);
    if (httpResult?.success) {
      console.log(`✓ HTTP Status: ${httpResult.outputs?.get('status')}`);
      console.log(`✓ All nodes executed successfully!`);
    }
    console.log('─'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  }
}

// Run the example
simpleHttpExample();
