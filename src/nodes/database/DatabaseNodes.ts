/**
 * Database Nodes
 * 
 * Basic database operation nodes (SQL query execution)
 * Note: Full database drivers should be installed separately
 */

import { BaseNode } from '../../core/BaseNode';
import { DataTypes, ExecutionContext, PortId, NodeError } from '../../types';
import { logger } from '../../utils/Logger';

/**
 * SQL Query Node (Generic)
 * Executes SQL queries (requires database driver)
 */
export class SqlQueryNode extends BaseNode {
  constructor() {
    super({
      name: 'SQL Query',
      description: 'Executes a SQL query (requires database connection)',
      inputs: [
        {
          id: 'connectionString',
          name: 'Connection String',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Database connection string',
        },
        {
          id: 'query',
          name: 'Query',
          dataType: DataTypes.STRING,
          required: true,
          description: 'SQL query to execute',
        },
        {
          id: 'parameters',
          name: 'Parameters',
          dataType: DataTypes.ARRAY,
          required: false,
          description: 'Query parameters',
        },
      ],
      outputs: [
        {
          id: 'results',
          name: 'Results',
          dataType: DataTypes.ARRAY,
          description: 'Query results',
        },
        {
          id: 'rowCount',
          name: 'Row Count',
          dataType: DataTypes.NUMBER,
          description: 'Number of rows affected/returned',
        },
        {
          id: 'success',
          name: 'Success',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether the query succeeded',
        },
      ],
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const connectionString = this.getInput<string>(context, 'connectionString');
    const query = this.getInput<string>(context, 'query');
    const parameters = this.getInput<unknown[]>(context, 'parameters');

    if (!connectionString) {
      throw new NodeError('Connection string is required', this.id, 'connectionString');
    }

    if (!query) {
      throw new NodeError('Query is required', this.id, 'query');
    }

    // Security: Prevent SQL injection by validating query
    if (this.containsDangerousSql(query)) {
      throw new NodeError('Query contains potentially dangerous SQL', this.id, 'query');
    }

    // Note: This is a placeholder implementation
    // In production, you would use actual database drivers (pg, mysql2, etc.)
    logger.warn('SQL Query Node: Database driver not implemented. This is a placeholder.');

    outputs.set('results', []);
    outputs.set('rowCount', 0);
    outputs.set('success', false);

    return outputs;
  }

  /**
   * Check for dangerous SQL patterns
   */
  private containsDangerousSql(query: string): boolean {
    const dangerousPatterns = [
      /DROP\s+TABLE/i,
      /DROP\s+DATABASE/i,
      /TRUNCATE/i,
      /DELETE\s+FROM/i,
      /UPDATE\s+.*\s+SET/i,
      /ALTER\s+TABLE/i,
      /CREATE\s+TABLE/i,
      /EXEC\s*\(/i,
      /EXECUTE\s*\(/i,
    ];

    return dangerousPatterns.some(pattern => pattern.test(query));
  }
}

/**
 * Database Connection Test Node
 * Tests database connection
 */
export class DatabaseConnectionTestNode extends BaseNode {
  constructor() {
    super({
      name: 'Database Connection Test',
      description: 'Tests a database connection',
      inputs: [
        {
          id: 'connectionString',
          name: 'Connection String',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Database connection string',
        },
      ],
      outputs: [
        {
          id: 'connected',
          name: 'Connected',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether the connection succeeded',
        },
        {
          id: 'message',
          name: 'Message',
          dataType: DataTypes.STRING,
          description: 'Connection status message',
        },
      ],
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const connectionString = this.getInput<string>(context, 'connectionString');

    if (!connectionString) {
      throw new NodeError('Connection string is required', this.id, 'connectionString');
    }

    // Note: This is a placeholder implementation
    logger.warn('Database Connection Test Node: Database driver not implemented. This is a placeholder.');

    outputs.set('connected', false);
    outputs.set('message', 'Database driver not implemented');

    return outputs;
  }
}

