/**
 * Variable Inspector
 * 
 * Inspects variables at any point during execution
 */

import { NodeId, PortId, ExecutionContext, ExecutionResult } from '../types';
import { VariableInspection, VariableSnapshot } from './types';

/**
 * Inspects and formats variables for debugging
 */
export class VariableInspector {
  /**
   * Inspect a variable value
   */
  public inspectVariable(value: any, name: string = 'value'): VariableInspection {
    const type = this.getType(value);
    const expandable = this.isExpandable(value);

    return {
      name,
      value: this.formatValue(value),
      type,
      expandable,
      children: expandable ? this.getChildren(value, name) : undefined,
    };
  }

  /**
   * Inspect all variables in an execution context
   */
  public inspectContext(context: ExecutionContext, nodeId: NodeId): VariableSnapshot {
    return {
      nodeId,
      executionId: context.executionId,
      timestamp: Date.now(),
      inputs: new Map(context.inputs),
      outputs: new Map(context.outputs),
      metadata: new Map(context.metadata),
    };
  }

  /**
   * Inspect inputs
   */
  public inspectInputs(inputs: Map<PortId, any>): VariableInspection[] {
    const result: VariableInspection[] = [];
    
    for (const [portId, value] of inputs.entries()) {
      result.push(this.inspectVariable(value, `inputs.${portId}`));
    }

    return result;
  }

  /**
   * Inspect outputs
   */
  public inspectOutputs(outputs: Map<PortId, any>): VariableInspection[] {
    const result: VariableInspection[] = [];
    
    for (const [portId, value] of outputs.entries()) {
      result.push(this.inspectVariable(value, `outputs.${portId}`));
    }

    return result;
  }

  /**
   * Inspect metadata
   */
  public inspectMetadata(metadata: Map<string, any>): VariableInspection[] {
    const result: VariableInspection[] = [];
    
    for (const [key, value] of metadata.entries()) {
      result.push(this.inspectVariable(value, `metadata.${key}`));
    }

    return result;
  }

  /**
   * Get type of a value
   */
  private getType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Map) return 'Map';
    if (value instanceof Set) return 'Set';
    if (value instanceof Date) return 'Date';
    if (value instanceof Promise) return 'Promise';
    return typeof value;
  }

  /**
   * Check if value is expandable (has children)
   */
  private isExpandable(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (value instanceof Map) return value.size > 0;
    if (value instanceof Set) return value.size > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return false;
  }

  /**
   * Get children of an expandable value
   */
  private getChildren(value: any, parentName: string): VariableInspection[] {
    const children: VariableInspection[] = [];

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        children.push(this.inspectVariable(item, `${parentName}[${index}]`));
      });
    } else if (value instanceof Map) {
      for (const [key, val] of value.entries()) {
        children.push(this.inspectVariable(val, `${parentName}.get('${key}')`));
      }
    } else if (value instanceof Set) {
      let index = 0;
      for (const item of value) {
        children.push(this.inspectVariable(item, `${parentName}[${index}]`));
        index++;
      }
    } else if (typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        children.push(this.inspectVariable(val, `${parentName}.${key}`));
      }
    }

    return children;
  }

  /**
   * Format a value for display
   */
  private formatValue(value: any): any {
    if (value === null) return null;
    if (value === undefined) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value;
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Map) return `Map(${value.size})`;
    if (value instanceof Set) return `Set(${value.size})`;
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        return '[Object]';
      }
    }
    return String(value);
  }
}

