/**
 * File System Nodes
 * 
 * Nodes for file and directory operations
 */

import { BaseNode } from '../../core/BaseNode';
import { DataTypes, ExecutionContext, PortId, NodeError, NodeConfig } from '../../types';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { logger } from '../../utils/Logger';

/**
 * Read File Node
 * Reads content from a file
 */
export class ReadFileNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      id: config?.id,
      name: config?.name || 'Read File',
      description: config?.description || 'Reads content from a file',
      inputs: [
        {
          id: 'path',
          name: 'File Path',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Path to the file to read',
        },
        {
          id: 'encoding',
          name: 'Encoding',
          dataType: DataTypes.STRING,
          required: false,
          description: 'File encoding (default: utf8)',
        },
      ],
      outputs: [
        {
          id: 'content',
          name: 'Content',
          dataType: DataTypes.STRING,
          description: 'File content',
        },
        {
          id: 'size',
          name: 'Size',
          dataType: DataTypes.NUMBER,
          description: 'File size in bytes',
        },
      ],
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const filePath = this.getInput<string>(context, 'path');
    const encoding = (this.getInput<string>(context, 'encoding') || 'utf8') as BufferEncoding;

    if (!filePath) {
      throw new NodeError('File path is required', this.id, 'path');
    }

    // Security: Prevent directory traversal
    const safePath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');

    try {
      const content = await fs.readFile(safePath, encoding);
      const stats = await fs.stat(safePath);

      outputs.set('content', content);
      outputs.set('size', stats.size);
    } catch (error) {
      logger.error(`Failed to read file ${filePath}:`, error);
      throw new NodeError(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
        this.id,
        'path',
        error instanceof Error ? error : undefined,
      );
    }

    return outputs;
  }
}

/**
 * Write File Node
 * Writes content to a file
 */
export class WriteFileNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      id: config?.id,
      name: config?.name || 'Write File',
      description: config?.description || 'Writes content to a file',
      inputs: [
        {
          id: 'path',
          name: 'File Path',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Path to the file to write',
        },
        {
          id: 'content',
          name: 'Content',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Content to write',
        },
        {
          id: 'encoding',
          name: 'Encoding',
          dataType: DataTypes.STRING,
          required: false,
          description: 'File encoding (default: utf8)',
        },
        {
          id: 'createDir',
          name: 'Create Directory',
          dataType: DataTypes.BOOLEAN,
          required: false,
          description: 'Create parent directory if it does not exist (default: true)',
        },
        {
          id: 'mode',
          name: 'Write Mode',
          dataType: DataTypes.STRING,
          required: false,
          description: 'Write mode: w (write/overwrite), a (append), a+ (append/read), w+ (write/read), r+ (read/write). Default: w',
        },
      ],
      outputs: [
        {
          id: 'success',
          name: 'Success',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether the write was successful',
        },
        {
          id: 'bytesWritten',
          name: 'Bytes Written',
          dataType: DataTypes.NUMBER,
          description: 'Number of bytes written',
        },
      ],
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const filePath = this.getInput<string>(context, 'path');
    const content = this.getInput<string>(context, 'content');
    const encoding = (this.getInput<string>(context, 'encoding') || 'utf8') as BufferEncoding;
    const createDir = this.getInput<boolean>(context, 'createDir') ?? true; // Default to true
    const mode = (this.getInput<string>(context, 'mode') || 'w').toLowerCase();

    if (!filePath) {
      throw new NodeError('File path is required', this.id, 'path');
    }

    if (content === undefined) {
      throw new NodeError('Content is required', this.id, 'content');
    }

    // Security: Prevent directory traversal
    const safePath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');

    try {
      // Create directory if needed (default behavior)
      if (createDir) {
        const dir = dirname(safePath);
        await fs.mkdir(dir, { recursive: true });
      }

      // Map mode strings to Node.js file flags
      const modeFlags: Record<string, string> = {
        'w': 'w',      // Write (overwrite), create if not exists
        'a': 'a',      // Append, create if not exists
        'a+': 'a+',    // Append and read, create if not exists
        'w+': 'w+',    // Write and read, create if not exists, truncate if exists
        'r+': 'r+',    // Read and write, file must exist
        'x': 'x',      // Exclusive write, fail if exists
        'x+': 'x+',    // Exclusive read/write, fail if exists
      };

      const flag = modeFlags[mode];
      if (!flag) {
        throw new Error(`Invalid write mode: ${mode}. Supported modes: w, a, a+, w+, r+, x, x+`);
      }

      // Handle different write modes
      if (mode === 'a' || mode === 'a+') {
        // Append mode - append to end of file
        await fs.appendFile(safePath, content, encoding);
      } else if (mode === 'r+') {
        // Read/write mode - file must exist, write at the beginning
        const fileHandle = await fs.open(safePath, flag);
        try {
          // Write string at position 0
          await fileHandle.write(content, 0, encoding);
          // Truncate to the written size
          const bytesWritten = Buffer.byteLength(content, encoding);
          await fileHandle.truncate(bytesWritten);
        } finally {
          await fileHandle.close();
        }
      } else {
        // Write modes (w, w+, x, x+)
        // Use writeFile with flag option
        await fs.writeFile(safePath, content, { encoding, flag: flag as any });
      }

      const bytesWritten = Buffer.byteLength(content, encoding);

      outputs.set('success', true);
      outputs.set('bytesWritten', bytesWritten);
    } catch (error) {
      logger.error(`Failed to write file ${filePath}:`, error);
      throw new NodeError(
        `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
        this.id,
        'path',
        error instanceof Error ? error : undefined,
      );
    }

    return outputs;
  }
}

/**
 * List Directory Node
 * Lists files and directories in a path
 */
export class ListDirectoryNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      id: config?.id,
      name: config?.name || 'List Directory',
      description: config?.description || 'Lists files and directories in a path',
      inputs: [
        {
          id: 'path',
          name: 'Directory Path',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Path to the directory',
        },
      ],
      outputs: [
        {
          id: 'files',
          name: 'Files',
          dataType: DataTypes.ARRAY,
          description: 'Array of file names',
        },
        {
          id: 'directories',
          name: 'Directories',
          dataType: DataTypes.ARRAY,
          description: 'Array of directory names',
        },
        {
          id: 'items',
          name: 'Items',
          dataType: DataTypes.ARRAY,
          description: 'Array of all items with metadata',
        },
      ],
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const dirPath = this.getInput<string>(context, 'path');

    if (!dirPath) {
      throw new NodeError('Directory path is required', this.id, 'path');
    }

    // Security: Prevent directory traversal
    const safePath = dirPath.replace(/\.\./g, '').replace(/^\/+/, '');

    try {
      const entries = await fs.readdir(safePath, { withFileTypes: true });
      const files: string[] = [];
      const directories: string[] = [];
      const items: Array<{ name: string; type: string; path: string }> = [];

      for (const entry of entries) {
        const fullPath = join(safePath, entry.name);
        if (entry.isFile()) {
          files.push(entry.name);
          items.push({ name: entry.name, type: 'file', path: fullPath });
        } else if (entry.isDirectory()) {
          directories.push(entry.name);
          items.push({ name: entry.name, type: 'directory', path: fullPath });
        }
      }

      outputs.set('files', files);
      outputs.set('directories', directories);
      outputs.set('items', items);
    } catch (error) {
      logger.error(`Failed to list directory ${dirPath}:`, error);
      throw new NodeError(
        `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`,
        this.id,
        'path',
        error instanceof Error ? error : undefined,
      );
    }

    return outputs;
  }
}

/**
 * File Exists Node
 * Checks if a file or directory exists
 */
export class FileExistsNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      id: config?.id,
      name: config?.name || 'File Exists',
      description: config?.description || 'Checks if a file or directory exists',
      inputs: [
        {
          id: 'path',
          name: 'Path',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Path to check',
        },
      ],
      outputs: [
        {
          id: 'exists',
          name: 'Exists',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether the path exists',
        },
        {
          id: 'isFile',
          name: 'Is File',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether the path is a file',
        },
        {
          id: 'isDirectory',
          name: 'Is Directory',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether the path is a directory',
        },
      ],
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const path = this.getInput<string>(context, 'path');

    if (!path) {
      throw new NodeError('Path is required', this.id, 'path');
    }

    // Security: Prevent directory traversal
    const safePath = path.replace(/\.\./g, '').replace(/^\/+/, '');

    try {
      const stats = await fs.stat(safePath);
      outputs.set('exists', true);
      outputs.set('isFile', stats.isFile());
      outputs.set('isDirectory', stats.isDirectory());
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        outputs.set('exists', false);
        outputs.set('isFile', false);
        outputs.set('isDirectory', false);
      } else {
        logger.error(`Failed to check file existence ${path}:`, error);
        throw new NodeError(
          `Failed to check file existence: ${error instanceof Error ? error.message : String(error)}`,
          this.id,
          'path',
          error instanceof Error ? error : undefined,
        );
      }
    }

    return outputs;
  }
}

