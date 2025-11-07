/**
 * Streaming Data Node
 * 
 * Example interactive node that streams data updates during execution
 */

import { BaseNode } from '../../core/BaseNode';
import {
  DataTypes,
  InteractiveNodeType,
  NodeError,
} from '../../types';
import type {
  IInteractiveNode,
  InteractiveExecutionContext,
  ExecutionContext,
  ExecutionResult,
  Port,
} from '../../types';

export interface StreamingDataNodeConfig {
  id?: string;
  interval?: number; // Update interval in milliseconds
  maxUpdates?: number; // Maximum number of updates
  dataGenerator?: () => unknown; // Function to generate data
}

export class StreamingDataNode extends BaseNode implements IInteractiveNode {
  readonly isInteractive = true;
  readonly interactiveType = InteractiveNodeType.STREAMING;

  private interval: number;
  private maxUpdates: number;
  private dataGenerator: () => unknown;

  constructor(config: StreamingDataNodeConfig = {}) {
    const inputs: Port[] = [
      {
        id: 'interval',
        name: 'Interval',
        dataType: DataTypes.NUMBER,
        description: 'Update interval in milliseconds',
      },
      {
        id: 'maxUpdates',
        name: 'Max Updates',
        dataType: DataTypes.NUMBER,
        description: 'Maximum number of updates',
      },
    ];

    const outputs: Port[] = [
      {
        id: 'updates',
        name: 'Updates',
        dataType: DataTypes.NUMBER,
        description: 'Number of updates sent',
      },
      {
        id: 'lastData',
        name: 'Last Data',
        dataType: DataTypes.ANY,
        description: 'Last data value sent',
      },
    ];

    super({
      id: config.id,
      name: 'Streaming Data',
      description: 'Streams data updates during execution',
      inputs,
      outputs,
    });

    this.interval = config.interval || 1000;
    this.maxUpdates = config.maxUpdates || 10;
    this.dataGenerator = config.dataGenerator || (() => ({
      value: Math.random(),
      timestamp: Date.now(),
    }));
  }

  /**
   * Execute with interactive context
   */
  async executeInteractive(
    context: InteractiveExecutionContext,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Get configuration from inputs or use defaults
      const interval = (context.inputs.get('interval') as number) || this.interval;
      const maxUpdates = (context.inputs.get('maxUpdates') as number) || this.maxUpdates;

      let updateCount = 0;
      const lastData: unknown[] = [];

      // Stream data updates
      await new Promise<void>((resolve, reject) => {
        const intervalId = setInterval(() => {
          try {
            const data = this.dataGenerator();
            context.updateStreamingData(data);
            lastData.push(data);
            updateCount++;

            if (updateCount >= maxUpdates) {
              clearInterval(intervalId);
              resolve();
            }
          } catch (error) {
            clearInterval(intervalId);
            reject(error);
          }
        }, interval);

        // Safety timeout: stop after 5 minutes (or 10 seconds in test environment)
        const timeoutDuration = process.env.NODE_ENV === 'test' 
          ? 10 * 1000 
          : 5 * 60 * 1000;
        setTimeout(() => {
          clearInterval(intervalId);
          resolve();
        }, timeoutDuration);
      });

      // Set outputs
      const outputs = new Map<string, unknown>();
      outputs.set('updates', updateCount);
      outputs.set('lastData', lastData[lastData.length - 1] || null);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        outputs,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: new NodeError(
          error instanceof Error ? error.message : String(error),
          this.id,
        ),
        executionTime,
      };
    }
  }

  /**
   * Required by BaseNode - delegates to executeInteractive
   */
  protected async executeInternal(context: ExecutionContext): Promise<Map<string, unknown>> {
    // For interactive nodes, this should not be called directly
    // The executor will call executeInteractive instead
    // But we provide a fallback that converts ExecutionContext to InteractiveExecutionContext
    const result = await this.executeInteractive(context as unknown as InteractiveExecutionContext);
    return result.outputs || new Map();
  }

  /**
   * Regular execute method (not used for interactive nodes)
   */
  async execute(context: any): Promise<ExecutionResult> {
    // This should not be called for interactive nodes
    // But we provide a fallback
    return this.executeInteractive(context as InteractiveExecutionContext);
  }
}

