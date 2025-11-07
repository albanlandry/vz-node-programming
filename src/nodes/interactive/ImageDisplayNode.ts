/**
 * Image Display Node
 * 
 * Example interactive node that displays images during execution
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
  ImageData,
} from '../../types';

export interface ImageDisplayNodeConfig {
  id?: string;
  defaultFormat?: 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp' | 'svg';
  defaultAlt?: string;
}

export class ImageDisplayNode extends BaseNode implements IInteractiveNode {
  readonly isInteractive = true;
  readonly interactiveType = InteractiveNodeType.IMAGE_DISPLAY;

  private defaultFormat: 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp' | 'svg';
  private defaultAlt: string;

  constructor(config: ImageDisplayNodeConfig = {}) {
    const inputs: Port[] = [
      {
        id: 'url',
        name: 'URL',
        dataType: DataTypes.STRING,
        description: 'Image URL',
      },
      {
        id: 'base64',
        name: 'Base64',
        dataType: DataTypes.STRING,
        description: 'Base64 encoded image data',
      },
      {
        id: 'format',
        name: 'Format',
        dataType: DataTypes.STRING,
        description: 'Image format (png, jpg, etc.)',
      },
      {
        id: 'alt',
        name: 'Alt Text',
        dataType: DataTypes.STRING,
        description: 'Alternative text for the image',
      },
      {
        id: 'width',
        name: 'Width',
        dataType: DataTypes.NUMBER,
        description: 'Image width in pixels',
      },
      {
        id: 'height',
        name: 'Height',
        dataType: DataTypes.NUMBER,
        description: 'Image height in pixels',
      },
    ];

    const outputs: Port[] = [
      {
        id: 'displayed',
        name: 'Displayed',
        dataType: DataTypes.BOOLEAN,
        description: 'Whether the image was displayed',
      },
    ];

    super({
      id: config.id,
      name: 'Image Display',
      description: 'Displays an image during execution',
      inputs,
      outputs,
    });

    this.defaultFormat = config.defaultFormat || 'png';
    this.defaultAlt = config.defaultAlt || 'Displayed image';
  }

  /**
   * Execute with interactive context
   */
  async executeInteractive(
    context: InteractiveExecutionContext,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Get image data from inputs
      const url = context.inputs.get('url') as string | undefined;
      const base64 = context.inputs.get('base64') as string | undefined;
      const format = (context.inputs.get('format') as string | undefined) || this.defaultFormat;
      const alt = (context.inputs.get('alt') as string | undefined) || this.defaultAlt;
      const width = context.inputs.get('width') as number | undefined;
      const height = context.inputs.get('height') as number | undefined;

      // Validate format
      const validFormats: Array<'png' | 'jpg' | 'jpeg' | 'gif' | 'webp' | 'svg'> = [
        'png',
        'jpg',
        'jpeg',
        'gif',
        'webp',
        'svg',
      ];
      const imageFormat = validFormats.includes(format as any)
        ? (format as 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp' | 'svg')
        : this.defaultFormat;

      // Build image data
      const imageData: ImageData = {
        format: imageFormat,
        alt,
      };

      if (url) {
        imageData.url = url;
      } else if (base64) {
        imageData.base64 = base64;
      } else {
        throw new Error('Either URL or base64 image data must be provided');
      }

      if (width !== undefined) {
        imageData.width = width;
      }
      if (height !== undefined) {
        imageData.height = height;
      }

      // Display image
      context.displayImage(imageData);

      // Set output
      const outputs = new Map<string, unknown>();
      outputs.set('displayed', true);

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

