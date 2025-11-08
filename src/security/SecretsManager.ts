/**
 * Secrets Manager
 * 
 * Provides secure storage and retrieval of sensitive information like API keys,
 * passwords, and tokens. Uses environment variables and encrypted storage.
 */

import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from '../utils/Logger';

/**
 * Secret entry
 */
export interface SecretEntry {
  id: string;
  key: string;
  value: string;
  encrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Secrets manager configuration
 */
export interface SecretsManagerConfig {
  /** Storage directory for secrets */
  storageDir?: string;
  /** Encryption key (should be from environment variable) */
  encryptionKey?: string;
  /** Whether to use encryption */
  useEncryption?: boolean;
}

/**
 * Secrets Manager
 * Manages secure storage and retrieval of secrets
 */
export class SecretsManager {
  private config: Required<SecretsManagerConfig>;
  private secrets: Map<string, SecretEntry> = new Map();
  private encryptionKey: Buffer | null = null;

  constructor(config: SecretsManagerConfig = {}) {
    this.config = {
      storageDir: config.storageDir || join(process.cwd(), '.secrets'),
      encryptionKey: config.encryptionKey || process.env.SECRETS_ENCRYPTION_KEY || '',
      useEncryption: config.useEncryption ?? true,
    };

    if (this.config.useEncryption && this.config.encryptionKey) {
      // Create encryption key from provided key
      this.encryptionKey = createHash('sha256')
        .update(this.config.encryptionKey)
        .digest()
        .slice(0, 32);
    }
  }

  /**
   * Get a secret value
   * 
   * @param key - Secret key
   * @returns Secret value or undefined if not found
   */
  public async get(key: string): Promise<string | undefined> {
    // First check environment variables
    const envValue = process.env[key];
    if (envValue) {
      return envValue;
    }

    // Check stored secrets
    const entry = this.secrets.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.encrypted && this.encryptionKey) {
      return this.decrypt(entry.value);
    }

    return entry.value;
  }

  /**
   * Set a secret value
   * 
   * @param key - Secret key
   * @param value - Secret value
   * @param metadata - Optional metadata
   */
  public async set(
    key: string,
    value: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const now = new Date();
    const existing = this.secrets.get(key);

    let encryptedValue = value;
    let encrypted = false;

    if (this.config.useEncryption && this.encryptionKey) {
      encryptedValue = this.encrypt(value);
      encrypted = true;
    }

    const entry: SecretEntry = {
      id: existing?.id || this.generateId(),
      key,
      value: encryptedValue,
      encrypted,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      metadata: metadata || existing?.metadata,
    };

    this.secrets.set(key, entry);
    await this.persist();
  }

  /**
   * Delete a secret
   * 
   * @param key - Secret key
   */
  public async delete(key: string): Promise<void> {
    this.secrets.delete(key);
    await this.persist();
  }

  /**
   * List all secret keys
   * 
   * @returns Array of secret keys
   */
  public list(): string[] {
    return Array.from(this.secrets.keys());
  }

  /**
   * Check if a secret exists
   * 
   * @param key - Secret key
   * @returns True if secret exists
   */
  public has(key: string): boolean {
    // Check environment variables first
    if (process.env[key]) {
      return true;
    }

    return this.secrets.has(key);
  }

  /**
   * Get secret metadata
   * 
   * @param key - Secret key
   * @returns Secret metadata or undefined
   */
  public getMetadata(key: string): Record<string, unknown> | undefined {
    const entry = this.secrets.get(key);
    return entry?.metadata;
  }

  /**
   * Encrypt a value
   */
  private encrypt(value: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt a value
   */
  private decrypt(encryptedValue: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    const [ivHex, encrypted] = encryptedValue.split(':');
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted value format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Persist secrets to disk
   */
  private async persist(): Promise<void> {
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.config.storageDir, { recursive: true });

      // Write secrets to file
      const secretsFile = join(this.config.storageDir, 'secrets.json');
      const data = Array.from(this.secrets.values());
      await fs.writeFile(secretsFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      logger.error('Failed to persist secrets:', error);
      throw error;
    }
  }

  /**
   * Load secrets from disk
   */
  public async load(): Promise<void> {
    try {
      const secretsFile = join(this.config.storageDir, 'secrets.json');
      
      try {
        const data = await fs.readFile(secretsFile, 'utf8');
        const entries: SecretEntry[] = JSON.parse(data);

        for (const entry of entries) {
          // Convert date strings back to Date objects
          entry.createdAt = new Date(entry.createdAt);
          entry.updatedAt = new Date(entry.updatedAt);
          this.secrets.set(entry.key, entry);
        }

        logger.info(`Loaded ${entries.length} secrets from storage`);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist yet, that's okay
          logger.debug('Secrets file does not exist, starting with empty store');
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error('Failed to load secrets:', error);
      throw error;
    }
  }

  /**
   * Clear all secrets (use with caution)
   */
  public async clear(): Promise<void> {
    this.secrets.clear();
    await this.persist();
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalSecrets: number;
    encryptedSecrets: number;
    useEncryption: boolean;
  } {
    let encryptedCount = 0;
    for (const entry of this.secrets.values()) {
      if (entry.encrypted) {
        encryptedCount++;
      }
    }

    return {
      totalSecrets: this.secrets.size,
      encryptedSecrets: encryptedCount,
      useEncryption: this.config.useEncryption,
    };
  }
}

/**
 * Singleton instance
 */
export const secretsManager = new SecretsManager();

// Load secrets on initialization
secretsManager.load().catch(error => {
  logger.error('Failed to load secrets on initialization:', error);
});

