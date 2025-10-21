import { NodeId, ExecutionId, ExecutionContext, ExecutionResult } from '../types';

/**
 * Dead letter entry
 */
export interface DeadLetterEntry {
  /** Unique entry ID */
  id: string;
  /** Execution ID */
  executionId: ExecutionId;
  /** Node ID that failed */
  nodeId: NodeId;
  /** Node name */
  nodeName: string;
  /** Error that occurred */
  error: Error;
  /** Execution context at time of failure */
  context: ExecutionContext;
  /** Execution result (partial) */
  result: ExecutionResult;
  /** Timestamp of failure */
  timestamp: Date;
  /** Number of retry attempts */
  retryAttempts: number;
  /** Custom metadata */
  metadata?: Record<string, any>;
  /** Whether the entry has been processed */
  processed: boolean;
}

/**
 * Dead letter queue configuration
 */
export interface DLQConfig {
  /** Maximum number of entries to keep */
  maxEntries: number;
  /** Auto-cleanup entries older than this (ms) */
  retentionPeriod: number;
  /** Called when a new entry is added */
  onEntryAdded?: (entry: DeadLetterEntry) => void;
  /** Persistence handler */
  persistenceHandler?: {
    save: (entry: DeadLetterEntry) => Promise<void>;
    load: () => Promise<DeadLetterEntry[]>;
  };
}

/**
 * Default DLQ configuration
 */
export const DEFAULT_DLQ_CONFIG: DLQConfig = {
  maxEntries: 1000,
  retentionPeriod: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Dead Letter Queue for failed node executions
 */
export class DeadLetterQueue {
  private static instance: DeadLetterQueue;
  private config: DLQConfig;
  private entries: Map<string, DeadLetterEntry> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  private constructor(config: Partial<DLQConfig> = {}) {
    this.config = { ...DEFAULT_DLQ_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<DLQConfig>): DeadLetterQueue {
    if (!DeadLetterQueue.instance) {
      DeadLetterQueue.instance = new DeadLetterQueue(config);
    }
    return DeadLetterQueue.instance;
  }

  /**
   * Add a failed execution to the DLQ
   */
  async add(params: {
    executionId: ExecutionId;
    nodeId: NodeId;
    nodeName: string;
    error: Error;
    context: ExecutionContext;
    result: ExecutionResult;
    retryAttempts?: number;
    metadata?: Record<string, any>;
  }): Promise<DeadLetterEntry> {
    const entry: DeadLetterEntry = {
      id: this.generateId(),
      executionId: params.executionId,
      nodeId: params.nodeId,
      nodeName: params.nodeName,
      error: params.error,
      context: params.context,
      result: params.result,
      timestamp: new Date(),
      retryAttempts: params.retryAttempts || 0,
      metadata: params.metadata,
      processed: false
    };

    // Add to queue
    this.entries.set(entry.id, entry);

    // Enforce max entries
    if (this.entries.size > this.config.maxEntries) {
      this.removeOldest();
    }

    // Persist if handler provided
    if (this.config.persistenceHandler) {
      await this.config.persistenceHandler.save(entry);
    }

    // Call callback
    if (this.config.onEntryAdded) {
      this.config.onEntryAdded(entry);
    }

    console.error(
      `💀 Dead Letter Queue: Added entry ${entry.id} for ${params.nodeName} ` +
      `(Error: ${params.error.message})`
    );

    return entry;
  }

  /**
   * Get an entry by ID
   */
  get(id: string): DeadLetterEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Get all entries
   */
  getAll(): DeadLetterEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get unprocessed entries
   */
  getUnprocessed(): DeadLetterEntry[] {
    return this.getAll().filter(e => !e.processed);
  }

  /**
   * Get entries for a specific node
   */
  getByNode(nodeId: NodeId): DeadLetterEntry[] {
    return this.getAll().filter(e => e.nodeId === nodeId);
  }

  /**
   * Get entries for a specific execution
   */
  getByExecution(executionId: ExecutionId): DeadLetterEntry[] {
    return this.getAll().filter(e => e.executionId === executionId);
  }

  /**
   * Mark an entry as processed
   */
  markProcessed(id: string): boolean {
    const entry = this.entries.get(id);
    if (entry) {
      entry.processed = true;
      return true;
    }
    return false;
  }

  /**
   * Remove an entry
   */
  remove(id: string): boolean {
    return this.entries.delete(id);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    unprocessed: number;
    byNode: Map<NodeId, number>;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const all = this.getAll();
    const byNode = new Map<NodeId, number>();

    all.forEach(entry => {
      byNode.set(entry.nodeId, (byNode.get(entry.nodeId) || 0) + 1);
    });

    const timestamps = all.map(e => e.timestamp.getTime());

    return {
      total: all.length,
      unprocessed: this.getUnprocessed().length,
      byNode,
      oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : undefined,
      newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined
    };
  }

  /**
   * Export entries as JSON
   */
  export(): string {
    const entries = this.getAll().map(entry => ({
      ...entry,
      error: {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack
      },
      timestamp: entry.timestamp.toISOString()
    }));

    return JSON.stringify(entries, null, 2);
  }

  /**
   * Load entries from persistence
   */
  async load(): Promise<void> {
    if (this.config.persistenceHandler) {
      const entries = await this.config.persistenceHandler.load();
      entries.forEach(entry => {
        this.entries.set(entry.id, entry);
      });
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `dlq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Remove oldest entries to maintain max size
   */
  private removeOldest(): void {
    const entries = this.getAll().sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    const toRemove = entries.length - this.config.maxEntries;
    for (let i = 0; i < toRemove; i++) {
      this.entries.delete(entries[i].id);
    }
  }

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.config.retentionPeriod;

    let removed = 0;
    this.entries.forEach((entry, id) => {
      if (entry.timestamp.getTime() < cutoff) {
        this.entries.delete(id);
        removed++;
      }
    });

    if (removed > 0) {
      console.log(`🧹 DLQ cleanup: Removed ${removed} old entries`);
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
