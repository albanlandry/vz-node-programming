/**
 * Example: Node Lifecycle Hooks
 * 
 * Demonstrates how to use lifecycle hooks in custom nodes:
 * - onInitialize: One-time resource initialization
 * - onBeforeExecute: Pre-execution setup
 * - onAfterExecute: Post-execution cleanup
 * - onError: Error handling
 * - onCleanup: Final resource cleanup
 * - Resource registration and management
 */

import { BaseNode, DataTypes, ExecutionContext, NodeError, NodeLifecycleHooks } from '../src';

/**
 * Example: Database Connection Node with Lifecycle Hooks
 * 
 * This node demonstrates:
 * - Opening database connection in onInitialize
 * - Preparing query in onBeforeExecute
 * - Logging results in onAfterExecute
 * - Handling errors in onError
 * - Closing connection in onCleanup
 */
class DatabaseQueryNode extends BaseNode {
  private connection: any = null;
  private queryCount: number = 0;

  constructor() {
    super({
      name: 'Database Query',
      description: 'Executes a database query with connection management',
      inputs: [
        {
          id: 'query',
          name: 'SQL Query',
          dataType: DataTypes.STRING,
          required: true,
        },
      ],
      outputs: [
        {
          id: 'result',
          name: 'Query Result',
          dataType: DataTypes.OBJECT,
        },
      ],
      lifecycleHooks: {
        // Initialize database connection once
        onInitialize: async () => {
          console.log('🔌 Initializing database connection...');
          // Simulate connection setup
          this.connection = {
            connected: true,
            host: 'localhost',
            database: 'mydb',
          };
          console.log('✅ Database connection established');
        },

        // Prepare query before execution
        onBeforeExecute: async (context: ExecutionContext) => {
          const query = context.inputs.get('query') as string;
          console.log(`📝 Preparing query: ${query.substring(0, 50)}...`);
          
          // Validate query
          if (!query || query.trim().length === 0) {
            throw new Error('Query cannot be empty');
          }

          // Check connection
          if (!this.connection?.connected) {
            throw new Error('Database connection not available');
          }
        },

        // Log results after execution
        onAfterExecute: async (context: ExecutionContext, result) => {
          this.queryCount++;
          console.log(`✅ Query executed successfully (Total: ${this.queryCount})`);
          console.log(`⏱️  Execution time: ${result.executionTime}ms`);
        },

        // Handle errors
        onError: async (context: ExecutionContext, error: NodeError) => {
          console.error(`❌ Query execution failed: ${error.message}`);
          // Could implement retry logic, logging, etc.
        },

        // Cleanup connection
        onCleanup: async () => {
          console.log('🔌 Closing database connection...');
          if (this.connection) {
            this.connection.connected = false;
            this.connection = null;
          }
          console.log('✅ Database connection closed');
        },
      },
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<string, unknown>> {
    const query = context.inputs.get('query') as string;
    const outputs = new Map<string, unknown>();

    // Simulate query execution
    const result = {
      rows: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ],
      count: 2,
    };

    outputs.set('result', result);
    return outputs;
  }
}

/**
 * Example: File Processing Node with Resource Management
 * 
 * This node demonstrates:
 * - Opening file handles in onBeforeExecute
 * - Registering resources for automatic cleanup
 * - Cleaning up resources in onAfterExecute
 */
class FileProcessorNode extends BaseNode {
  constructor() {
    super({
      name: 'File Processor',
      description: 'Processes files with automatic resource cleanup',
      inputs: [
        {
          id: 'filePath',
          name: 'File Path',
          dataType: DataTypes.STRING,
          required: true,
        },
      ],
      outputs: [
        {
          id: 'content',
          name: 'File Content',
          dataType: DataTypes.STRING,
        },
      ],
      lifecycleHooks: {
        onBeforeExecute: async (context: ExecutionContext) => {
          const filePath = context.inputs.get('filePath') as string;
          console.log(`📂 Opening file: ${filePath}`);

          // Simulate opening file handle
          const fileHandle = {
            path: filePath,
            opened: true,
            cleanup: () => {
              console.log(`🔒 Closing file handle: ${filePath}`);
              fileHandle.opened = false;
            },
          };

          // Register resource for automatic cleanup
          this.registerResource(fileHandle);
        },

        onAfterExecute: async () => {
          // Resources are automatically cleaned up
          console.log('✅ File processing completed');
        },
      },
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<string, unknown>> {
    const filePath = context.inputs.get('filePath') as string;
    const outputs = new Map<string, unknown>();

    // Simulate file reading
    const content = `Content of ${filePath}`;
    outputs.set('content', content);

    return outputs;
  }
}

/**
 * Example: HTTP Client Node with Retry Logic
 * 
 * This node demonstrates:
 * - Setting up HTTP client in onInitialize
 * - Preparing request in onBeforeExecute
 * - Retry logic in onError
 * - Cleanup in onCleanup
 */
class HttpClientNode extends BaseNode {
  private client: any = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {
    super({
      name: 'HTTP Client',
      description: 'Makes HTTP requests with retry logic',
      inputs: [
        {
          id: 'url',
          name: 'URL',
          dataType: DataTypes.STRING,
          required: true,
        },
      ],
      outputs: [
        {
          id: 'response',
          name: 'HTTP Response',
          dataType: DataTypes.OBJECT,
        },
      ],
      lifecycleHooks: {
        onInitialize: async () => {
          console.log('🌐 Initializing HTTP client...');
          this.client = {
            initialized: true,
            userAgent: 'MyApp/1.0',
          };
          console.log('✅ HTTP client ready');
        },

        onBeforeExecute: async (context: ExecutionContext) => {
          const url = context.inputs.get('url') as string;
          console.log(`📡 Preparing request to: ${url}`);
          
          // Reset retry count for new request
          this.retryCount = 0;
        },

        onError: async (context: ExecutionContext, error: NodeError) => {
          this.retryCount++;
          console.log(`⚠️  Request failed (attempt ${this.retryCount}/${this.maxRetries}): ${error.message}`);

          if (this.retryCount < this.maxRetries) {
            console.log('🔄 Retrying request...');
            // In a real implementation, you might re-execute here
          } else {
            console.log('❌ Max retries reached');
          }
        },

        onCleanup: async () => {
          console.log('🌐 Closing HTTP client...');
          if (this.client) {
            this.client.initialized = false;
            this.client = null;
          }
          console.log('✅ HTTP client closed');
        },
      },
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<string, unknown>> {
    const url = context.inputs.get('url') as string;
    const outputs = new Map<string, unknown>();

    // Simulate HTTP request
    const response = {
      status: 200,
      data: { message: 'Success' },
      url,
    };

    outputs.set('response', response);
    return outputs;
  }
}

/**
 * Example usage
 */
async function main() {
  console.log('=== Database Query Node Example ===\n');
  const dbNode = new DatabaseQueryNode();
  
  const dbContext: ExecutionContext = {
    executionId: 'exec-1',
    inputs: new Map([['query', 'SELECT * FROM users']]),
    outputs: new Map(),
    metadata: new Map(),
  };

  const dbResult = await dbNode.execute(dbContext);
  console.log('Result:', dbResult.success ? 'Success' : 'Failed');
  
  // Cleanup
  await dbNode.cleanup();
  console.log('\n');

  console.log('=== File Processor Node Example ===\n');
  const fileNode = new FileProcessorNode();
  
  const fileContext: ExecutionContext = {
    executionId: 'exec-2',
    inputs: new Map([['filePath', '/path/to/file.txt']]),
    outputs: new Map(),
    metadata: new Map(),
  };

  const fileResult = await fileNode.execute(fileContext);
  console.log('Result:', fileResult.success ? 'Success' : 'Failed');
  
  // Resources are automatically cleaned up
  await fileNode.cleanup();
  console.log('\n');

  console.log('=== HTTP Client Node Example ===\n');
  const httpNode = new HttpClientNode();
  
  const httpContext: ExecutionContext = {
    executionId: 'exec-3',
    inputs: new Map([['url', 'https://api.example.com/data']]),
    outputs: new Map(),
    metadata: new Map(),
  };

  const httpResult = await httpNode.execute(httpContext);
  console.log('Result:', httpResult.success ? 'Success' : 'Failed');
  
  await httpNode.cleanup();
}

// Run example if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseQueryNode, FileProcessorNode, HttpClientNode };

