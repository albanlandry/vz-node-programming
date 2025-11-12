/**
 * Global Executor Store
 *
 * Provides a centralized store for active graph executors across all graph API routes.
 * In production, this should be replaced with Redis or a similar distributed cache.
 *
 * IMPORTANT: This module uses a singleton pattern to ensure the Map is shared
 * across all API routes in Next.js. The module is cached by Node.js, so all
 * imports will reference the same Map instance.
 */

import type { NodeExecutor } from '../../../../src/core/NodeExecutor';
import { logger } from '../../../../src/utils/Logger';

/**
 * Store active executors by executionId
 * Key: executionId (string)
 * Value: NodeExecutor instance
 *
 * This Map is shared across all API routes using Node.js global object
 * to ensure singleton behavior even if modules are reloaded.
 */
const STORE_KEY = '__vz_executorStore';

interface GlobalWithStore {
  [key: string]: Map<string, NodeExecutor> | undefined;
}

function getStore(): Map<string, NodeExecutor> {
  const globalObj = globalThis as unknown as GlobalWithStore;
  let store = globalObj[STORE_KEY];
  if (!store) {
    store = new Map<string, NodeExecutor>();
    globalObj[STORE_KEY] = store;
    logger.debug('ExecutorStore: Initialized new global Map instance');
  }
  return store;
}

/**
 * Register an executor for an execution
 * @param executionId - Unique execution identifier
 * @param executor - NodeExecutor instance
 */
export function registerExecutor(executionId: string, executor: NodeExecutor): void {
  if (!executionId) {
    logger.warn('Attempted to register executor with empty executionId');
    return;
  }

  const store = getStore();
  store.set(executionId, executor);
  logger.info(
    `Registered executor for executionId: ${executionId}, total active: ${store.size}`,
  );
  logger.debug(`All executionIds: ${Array.from(store.keys()).join(', ')}`);
}

/**
 * Unregister an executor
 * @param executionId - Execution identifier to unregister
 */
export function unregisterExecutor(executionId: string): void {
  if (!executionId) {
    logger.warn('Attempted to unregister executor with empty executionId');
    return;
  }

  const store = getStore();
  const removed = store.delete(executionId);
  if (removed) {
    logger.debug(`Unregistered executor for executionId: ${executionId}, remaining: ${store.size}`);
  } else {
    logger.warn(`Attempted to unregister non-existent executor: ${executionId}`);
  }
}

/**
 * Get an executor by executionId
 * @param executionId - Execution identifier
 * @returns NodeExecutor instance or undefined if not found
 */
export function getExecutor(executionId: string): NodeExecutor | undefined {
  const store = getStore();
  const executor = store.get(executionId);
  logger.debug(
    `getExecutor(${executionId}): ${executor ? 'found' : 'not found'}, total active: ${store.size}, map keys: ${Array.from(store.keys()).join(', ')}`,
  );
  return executor;
}

/**
 * Get all active executors map
 * @returns Map of executionId to NodeExecutor
 */
export function getActiveExecutors(): Map<string, NodeExecutor> {
  const store = getStore();
  logger.debug(
    `getActiveExecutors(): returning map with ${store.size} entries, keys: ${Array.from(store.keys()).join(', ')}`,
  );
  return store;
}

/**
 * Check if an executor exists for the given executionId
 * @param executionId - Execution identifier
 * @returns true if executor exists, false otherwise
 */
export function hasExecutor(executionId: string): boolean {
  const store = getStore();
  return store.has(executionId);
}

/**
 * Get the number of active executors
 * @returns Number of active executors
 */
export function getActiveExecutorCount(): number {
  const store = getStore();
  return store.size;
}

/**
 * Clear all executors (useful for testing or cleanup)
 */
export function clearAllExecutors(): void {
  const store = getStore();
  const count = store.size;
  store.clear();
  logger.info(`Cleared all executors (${count} removed)`);
}

/**
 * Get all execution IDs
 * @returns Array of execution IDs
 */
export function getAllExecutionIds(): string[] {
  const store = getStore();
  return Array.from(store.keys());
}

