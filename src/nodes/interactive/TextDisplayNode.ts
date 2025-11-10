/**
 * Text Display Node
 * 
 * Interactive node that displays formatted text to the user during execution
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
  UserInputRequest,
} from '../../types';

export interface TextDisplayNodeConfig {
  id?: string;
  title?: string;
  format?: 'plain' | 'markdown' | 'html' | 'json' | 'code';
  language?: string; // For code format
}

export class TextDisplayNode extends BaseNode implements IInteractiveNode {
  readonly isInteractive = true;
  readonly interactiveType = InteractiveNodeType.USER_INPUT;

  private title: string;
  private format: 'plain' | 'markdown' | 'html' | 'json' | 'code';
  private language: string;

  constructor(config: TextDisplayNodeConfig = {}) {
    const inputs: Port[] = [
      {
        id: 'text',
        name: 'Text',
        dataType: DataTypes.ANY,
        description: 'Text content to display (string, object, or any value)',
        required: true,
      },
      {
        id: 'title',
        name: 'Title',
        dataType: DataTypes.STRING,
        description: 'Optional title for the display',
      },
      {
        id: 'format',
        name: 'Format',
        dataType: DataTypes.STRING,
        description: 'Display format: plain, markdown, html, json, or code',
      },
      {
        id: 'language',
        name: 'Language',
        dataType: DataTypes.STRING,
        description: 'Language for code formatting (e.g., javascript, python, json)',
      },
    ];

    const outputs: Port[] = [
      {
        id: 'displayed',
        name: 'Displayed',
        dataType: DataTypes.BOOLEAN,
        description: 'Whether the text was displayed',
      },
    ];

    super({
      id: config.id,
      name: 'Display Text',
      description: 'Displays formatted text to the user during execution',
      inputs,
      outputs,
    });

    this.title = config.title || 'Text Display';
    this.format = config.format || 'plain';
    this.language = config.language || 'text';
  }

  /**
   * Format text based on format type
   */
  private formatText(text: unknown, format: string, language: string): string {
    if (text === null || text === undefined) {
      return 'null';
    }

    switch (format) {
      case 'json':
        try {
          return JSON.stringify(text, null, 2);
        } catch {
          return String(text);
        }
      
      case 'code':
        const codeText = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
        return `\`\`\`${language}\n${codeText}\n\`\`\``;
      
      case 'markdown':
        return typeof text === 'string' ? text : JSON.stringify(text, null, 2);
      
      case 'html':
        // For HTML, we'll display it as-is if it's a string, otherwise convert to JSON
        if (typeof text === 'string') {
          return text;
        }
        return JSON.stringify(text, null, 2);
      
      case 'plain':
      default:
        if (typeof text === 'string') {
          return text;
        }
        if (typeof text === 'object') {
          try {
            return JSON.stringify(text, null, 2);
          } catch {
            return String(text);
          }
        }
        return String(text);
    }
  }

  /**
   * Execute with interactive context
   */
  async executeInteractive(
    context: InteractiveExecutionContext,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Get text content from input
      const textInput = context.inputs.get('text');
      if (textInput === undefined || textInput === null) {
        throw new Error('Text input is required');
      }

      // Get optional parameters
      const title = (context.inputs.get('title') as string | undefined) || this.title;
      const format = (context.inputs.get('format') as string | undefined) || this.format;
      const language = (context.inputs.get('language') as string | undefined) || this.language;

      // Validate format
      const validFormats: Array<'plain' | 'markdown' | 'html' | 'json' | 'code'> = [
        'plain',
        'markdown',
        'html',
        'json',
        'code',
      ];
      const displayFormat = validFormats.includes(format as any)
        ? (format as 'plain' | 'markdown' | 'html' | 'json' | 'code')
        : this.format;

      // Format the text
      const formattedText = this.formatText(textInput, displayFormat, language);

      // Build content object with title and formatted text
      const content = {
        title,
        format: displayFormat,
        language: displayFormat === 'code' ? language : undefined,
        text: formattedText,
      };

      // Create a user input request with type 'confirm' to display the text
      const request: UserInputRequest = {
        type: 'confirm',
        prompt: title,
        content: content,
      };

      // Display text (execution will pause here until user confirms)
      await context.requestUserInput(request);

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
    const result = await this.executeInteractive(context as unknown as InteractiveExecutionContext);
    return result.outputs || new Map();
  }

  /**
   * Regular execute method (not used for interactive nodes)
   */
  async execute(context: any): Promise<ExecutionResult> {
    return this.executeInteractive(context as InteractiveExecutionContext);
  }
}

