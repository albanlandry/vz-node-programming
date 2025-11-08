/**
 * Sandbox Executor
 * 
 * Provides secure execution of user-provided expressions using VM2 sandboxing.
 * This prevents code injection and restricts access to Node.js APIs.
 */

import { VM } from 'vm2';
import { logger } from '../utils/Logger';

/**
 * Configuration for the sandbox executor
 */
export interface SandboxConfig {
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Maximum memory usage in MB (default: 64) */
  memoryLimit?: number;
  /** Allowed global objects */
  allowedGlobals?: string[];
  /** Custom context variables */
  context?: Record<string, unknown>;
}

/**
 * Default sandbox configuration
 */
const DEFAULT_CONFIG: Required<SandboxConfig> = {
  timeout: 5000,
  memoryLimit: 64,
  allowedGlobals: [
    'Math',
    'Number',
    'String',
    'Boolean',
    'Array',
    'Object',
    'Date',
    'JSON',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'RegExp',
  ],
  context: {},
};

/**
 * Sandbox executor for secure expression evaluation
 */
export class SandboxExecutor {
  private config: Required<SandboxConfig>;
  private vm: VM;

  constructor(config: SandboxConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Create VM with restricted access
    this.vm = new VM({
      timeout: this.config.timeout,
      sandbox: this.createSandbox(),
      eval: false, // Disable eval
      wasm: false, // Disable WebAssembly
    });
  }

  /**
   * Create a restricted sandbox environment
   */
  private createSandbox(): Record<string, unknown> {
    const sandbox: Record<string, unknown> = {
      ...this.config.context,
    };

    // Add allowed globals
    for (const globalName of this.config.allowedGlobals) {
      if (globalName in global) {
        sandbox[globalName] = (global as any)[globalName];
      }
    }

    return sandbox;
  }

  /**
   * Execute an expression in the sandbox
   * 
   * @param expression - The expression to execute
   * @param inputs - Input values for the expression
   * @returns The result of the expression
   * @throws Error if execution fails or times out
   */
  public execute(
    expression: string,
    inputs: Record<string, unknown> = {},
  ): unknown {
    try {
      // Create a safe wrapper function
      const code = `
        (function(inputs) {
          ${this.createSafeContext()}
          try {
            return ${expression};
          } catch (error) {
            throw new Error('Expression execution error: ' + error.message);
          }
        })
      `;

      // Compile and run in sandbox
      const fn = this.vm.run(code) as (inputs: Record<string, unknown>) => unknown;
      return fn(inputs);
    } catch (error) {
      logger.error('Sandbox execution error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Expression execution timeout');
        }
        if (error.message.includes('memory')) {
          throw new Error('Expression execution exceeded memory limit');
        }
        throw new Error(`Sandbox execution failed: ${error.message}`);
      }
      
      throw new Error('Unknown sandbox execution error');
    }
  }

  /**
   * Create safe context variables in the expression
   */
  private createSafeContext(): string {
    const contextVars = this.config.allowedGlobals
      .map(name => `const ${name} = ${name};`)
      .join('\n    ');
    
    return contextVars;
  }

  /**
   * Test if an expression can be executed safely
   * 
   * @param expression - The expression to test
   * @returns True if expression is safe to execute
   */
  public static isSafe(expression: string): boolean {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /new\s+Function/i,
      /require\s*\(/i,
      /import\s+/i,
      /process\./i,
      /global\./i,
      /\.constructor/i,
      /\.__proto__/i,
      /\.prototype/i,
      /setTimeout/i,
      /setInterval/i,
      /XMLHttpRequest/i,
      /fetch\s*\(/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(expression)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get sandbox statistics
   */
  public getStats(): {
    timeout: number;
    memoryLimit: number;
    allowedGlobals: string[];
  } {
    return {
      timeout: this.config.timeout,
      memoryLimit: this.config.memoryLimit,
      allowedGlobals: [...this.config.allowedGlobals],
    };
  }
}

