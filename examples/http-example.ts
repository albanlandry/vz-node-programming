import { 
  NodeExecutor, 
  HttpRequestNode, 
  LoggerNode,
  ConditionalNode,
  TransformNode,
  Connection
} from '../src/index';

/**
 * Example: Asynchronous HTTP Request with Result Display
 * 
 * This example demonstrates:
 * - Making async HTTP requests
 * - Processing JSON responses
 * - Conditional logic based on status codes
 * - Transforming and displaying results
 */

async function httpRequestExample() {
  console.log('\n=== Asynchronous HTTP Request Example ===\n');

  const executor = new NodeExecutor();

  // Create nodes
  const httpNode = new HttpRequestNode();
  const transformNode = new TransformNode();
  const logger = new LoggerNode();

  // Add nodes to executor
  executor.addNode(httpNode);
  executor.addNode(transformNode);
  executor.addNode(logger);

  // Create connections
  const connections: Connection[] = [
    {
      id: 'conn1',
      fromNode: httpNode.id,
      fromPort: 'data',
      toNode: transformNode.id,
      toPort: 'data'
    },
    {
      id: 'conn2',
      fromNode: transformNode.id,
      fromPort: 'result',
      toNode: logger.id,
      toPort: 'message'
    }
  ];

  connections.forEach(conn => executor.addConnection(conn));

  // Set up initial inputs
  const initialInputs = new Map();

  // HTTP Node: Make a request to JSONPlaceholder API
  const httpInputs = new Map();
  httpInputs.set('url', 'https://jsonplaceholder.typicode.com/posts/1');
  httpInputs.set('method', 'GET');
  httpInputs.set('headers', {
    'Accept': 'application/json'
  });
  initialInputs.set(httpNode.id, httpInputs);

  // Transform Node: Format the response data
  const transformInputs = new Map();
  transformInputs.set('transformer', (data: any) => {
    if (!data) return 'No data received';
    
    return `
╔════════════════════════════════════════════════════════════╗
║                    HTTP Response Data                      ║
╠════════════════════════════════════════════════════════════╣
║ Post ID:    ${data.id || 'N/A'}
║ User ID:    ${data.userId || 'N/A'}
║ Title:      ${data.title || 'N/A'}
║ 
║ Body:
║ ${(data.body || 'N/A').substring(0, 50)}...
╚════════════════════════════════════════════════════════════╝
    `;
  });
  initialInputs.set(transformNode.id, transformInputs);

  // Logger: Display formatted results
  const loggerInputs = new Map();
  loggerInputs.set('level', 'info');
  loggerInputs.set('data', { 
    source: 'JSONPlaceholder API',
    endpoint: '/posts/1'
  });
  initialInputs.set(logger.id, loggerInputs);

  // Listen to execution events
  executor.on('execution_started', (event) => {
    const nodeName = executor.getNodes().find(n => n.id === event.data.nodeId)?.name;
    console.log(`⏳ Starting: ${nodeName}`);
  });

  executor.on('execution_completed', (event) => {
    const nodeName = executor.getNodes().find(n => n.id === event.data.nodeId)?.name;
    console.log(`✓ Completed: ${nodeName} (${event.data.result.executionTime}ms)`);
  });

  executor.on('execution_failed', (event) => {
    console.error(`✗ Failed: ${event.data.nodeId}`, event.data.error);
  });

  // Execute the workflow
  console.log('🚀 Starting HTTP request workflow...\n');
  const startTime = Date.now();
  
  try {
    const results = await executor.execute(initialInputs);
    const endTime = Date.now();

    console.log('\n' + '='.repeat(64));
    console.log('📊 Execution Summary');
    console.log('='.repeat(64));
    console.log(`Total execution time: ${endTime - startTime}ms`);
    console.log(`Nodes executed: ${results.size}`);
    console.log(`Success: ${Array.from(results.values()).filter(r => r.success).length}/${results.size}`);
    
    // Display detailed results
    const httpResult = results.get(httpNode.id);
    if (httpResult?.success) {
      const status = httpResult.outputs?.get('status');
      const data = httpResult.outputs?.get('data');
      
      console.log('\n📡 HTTP Response Details:');
      console.log(`   Status Code: ${status}`);
      console.log(`   Response Type: ${typeof data}`);
      console.log(`   Has Data: ${data ? 'Yes' : 'No'}`);
    }

    console.log('\n' + '='.repeat(64) + '\n');
    
  } catch (error) {
    console.error('❌ Workflow failed:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Example: Multiple HTTP Requests in Parallel
 * Demonstrates parallel async execution using multiple HTTP nodes
 */
async function parallelHttpRequestsExample() {
  console.log('\n=== Parallel HTTP Requests Example ===\n');

  const executor = new NodeExecutor();

  // Create three HTTP nodes for parallel requests
  const httpNode1 = new HttpRequestNode();
  const httpNode2 = new HttpRequestNode();
  const httpNode3 = new HttpRequestNode();
  const logger = new LoggerNode();

  executor.addNode(httpNode1);
  executor.addNode(httpNode2);
  executor.addNode(httpNode3);
  executor.addNode(logger);

  // Set up inputs for parallel requests
  const initialInputs = new Map();

  // Request 1: Get post 1
  const http1Inputs = new Map();
  http1Inputs.set('url', 'https://jsonplaceholder.typicode.com/posts/1');
  http1Inputs.set('method', 'GET');
  initialInputs.set(httpNode1.id, http1Inputs);

  // Request 2: Get post 2
  const http2Inputs = new Map();
  http2Inputs.set('url', 'https://jsonplaceholder.typicode.com/posts/2');
  http2Inputs.set('method', 'GET');
  initialInputs.set(httpNode2.id, http2Inputs);

  // Request 3: Get post 3
  const http3Inputs = new Map();
  http3Inputs.set('url', 'https://jsonplaceholder.typicode.com/posts/3');
  http3Inputs.set('method', 'GET');
  initialInputs.set(httpNode3.id, http3Inputs);

  // Logger for summary
  const loggerInputs = new Map();
  loggerInputs.set('level', 'info');
  loggerInputs.set('message', 'Parallel HTTP requests completed');
  loggerInputs.set('data', { operation: 'parallel_http_requests' });
  initialInputs.set(logger.id, loggerInputs);

  console.log('🚀 Starting 3 parallel HTTP requests...\n');
  const startTime = Date.now();

  try {
    const results = await executor.execute(initialInputs);
    const endTime = Date.now();

    console.log('\n' + '='.repeat(64));
    console.log('📊 Parallel Execution Summary');
    console.log('='.repeat(64));
    console.log(`Total execution time: ${endTime - startTime}ms`);
    console.log(`Requests completed: 3`);

    // Display each result
    [httpNode1, httpNode2, httpNode3].forEach((node, index) => {
      const result = results.get(node.id);
      if (result?.success) {
        const data = result.outputs?.get('data');
        const status = result.outputs?.get('status');
        console.log(`\n📄 Request ${index + 1}:`);
        console.log(`   Status: ${status}`);
        console.log(`   Title: ${data?.title || 'N/A'}`);
        console.log(`   Execution Time: ${result.executionTime}ms`);
      }
    });

    console.log('\n' + '='.repeat(64) + '\n');

  } catch (error) {
    console.error('❌ Workflow failed:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Example: POST Request with Data
 * Demonstrates making a POST request with a body
 */
async function httpPostExample() {
  console.log('\n=== HTTP POST Request Example ===\n');

  const executor = new NodeExecutor();

  const httpNode = new HttpRequestNode();
  const transformNode = new TransformNode();
  const logger = new LoggerNode();

  executor.addNode(httpNode);
  executor.addNode(transformNode);
  executor.addNode(logger);

  // Connect nodes
  executor.addConnection({
    id: 'conn1',
    fromNode: httpNode.id,
    fromPort: 'data',
    toNode: transformNode.id,
    toPort: 'data'
  });

  executor.addConnection({
    id: 'conn2',
    fromNode: transformNode.id,
    fromPort: 'result',
    toNode: logger.id,
    toPort: 'message'
  });

  const initialInputs = new Map();

  // HTTP POST request
  const httpInputs = new Map();
  httpInputs.set('url', 'https://jsonplaceholder.typicode.com/posts');
  httpInputs.set('method', 'POST');
  httpInputs.set('body', {
    title: 'My New Post',
    body: 'This is the content of my post created via the node system',
    userId: 1
  });
  initialInputs.set(httpNode.id, httpInputs);

  // Transform the response
  const transformInputs = new Map();
  transformInputs.set('transformer', (data: any) => {
    return `
✓ POST Request Successful!

Created Post:
  ID: ${data?.id || 'N/A'}
  Title: ${data?.title || 'N/A'}
  User ID: ${data?.userId || 'N/A'}
    `;
  });
  initialInputs.set(transformNode.id, transformInputs);

  // Logger
  const loggerInputs = new Map();
  loggerInputs.set('level', 'info');
  loggerInputs.set('data', { method: 'POST', endpoint: '/posts' });
  initialInputs.set(logger.id, loggerInputs);

  console.log('🚀 Creating new post via HTTP POST...\n');

  try {
    const results = await executor.execute(initialInputs);
    
    const httpResult = results.get(httpNode.id);
    if (httpResult?.success) {
      console.log('\n✓ POST request completed successfully!');
      console.log(`Status: ${httpResult.outputs?.get('status')}`);
    }

  } catch (error) {
    console.error('❌ POST request failed:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Run all HTTP examples
 */
async function runAllHttpExamples() {
  try {
    await httpRequestExample();
    await parallelHttpRequestsExample();
    await httpPostExample();
    
    console.log('\n✓ All HTTP examples completed successfully!\n');
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run if executed directly
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  runAllHttpExamples();
}

export {
  httpRequestExample,
  parallelHttpRequestsExample,
  httpPostExample,
  runAllHttpExamples
};
