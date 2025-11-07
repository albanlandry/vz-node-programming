/**
 * Unit Tests for ImageDisplayNode
 */

import { ImageDisplayNode } from '../../../src/nodes/interactive/ImageDisplayNode';
import { InteractiveNodeType, DataTypes } from '../../../src/types';
import type { InteractiveExecutionContext } from '../../../src/core/InteractiveExecutionContext';

describe('ImageDisplayNode', () => {
  let node: ImageDisplayNode;
  let mockContext: InteractiveExecutionContext;

  beforeEach(() => {
    node = new ImageDisplayNode({
      id: 'test-node',
      defaultFormat: 'png',
      defaultAlt: 'Test image',
    });

    // Create mock context
    mockContext = {
      executionId: 'exec-1',
      inputs: new Map(),
      outputs: new Map(),
      metadata: new Map(),
      displayImage: jest.fn(),
      requestUserInput: jest.fn(),
      updateStreamingData: jest.fn(),
      renderCustomUI: jest.fn(),
    } as unknown as InteractiveExecutionContext;
  });

  describe('Node Properties', () => {
    it('should have isInteractive set to true', () => {
      expect(node.isInteractive).toBe(true);
    });

    it('should have interactiveType set to IMAGE_DISPLAY', () => {
      expect(node.interactiveType).toBe(InteractiveNodeType.IMAGE_DISPLAY);
    });

    it('should have correct name', () => {
      expect(node.name).toBe('Image Display');
    });

    it('should have correct input ports', () => {
      const inputs = node.inputs;
      expect(inputs.length).toBeGreaterThan(0);
      expect(inputs.find((p) => p.id === 'url')).toBeDefined();
      expect(inputs.find((p) => p.id === 'base64')).toBeDefined();
      expect(inputs.find((p) => p.id === 'format')).toBeDefined();
    });

    it('should have displayed output port', () => {
      const outputs = node.outputs;
      expect(outputs).toHaveLength(1);
      expect(outputs[0].id).toBe('displayed');
      expect(outputs[0].dataType).toBe(DataTypes.BOOLEAN);
    });
  });

  describe('executeInteractive - URL Image', () => {
    it('should display image from URL', async () => {
      mockContext.inputs.set('url', 'https://example.com/image.png');
      mockContext.inputs.set('format', 'png');
      mockContext.inputs.set('alt', 'Test image');

      const result = await node.executeInteractive(mockContext);

      expect(mockContext.displayImage).toHaveBeenCalledWith({
        url: 'https://example.com/image.png',
        format: 'png',
        alt: 'Test image',
      });
      expect(result.success).toBe(true);
      expect(result.outputs?.get('displayed')).toBe(true);
    });

    it('should use default format when format not provided', async () => {
      mockContext.inputs.set('url', 'https://example.com/image.png');

      const result = await node.executeInteractive(mockContext);

      expect(mockContext.displayImage).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'png', // default format
        }),
      );
      expect(result.success).toBe(true);
    });

    it('should use default alt when alt not provided', async () => {
      mockContext.inputs.set('url', 'https://example.com/image.png');

      const result = await node.executeInteractive(mockContext);

      expect(mockContext.displayImage).toHaveBeenCalledWith(
        expect.objectContaining({
          alt: 'Test image', // default alt
        }),
      );
      expect(result.success).toBe(true);
    });

    it('should include width and height when provided', async () => {
      mockContext.inputs.set('url', 'https://example.com/image.png');
      mockContext.inputs.set('width', 800);
      mockContext.inputs.set('height', 600);

      const result = await node.executeInteractive(mockContext);

      expect(mockContext.displayImage).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 800,
          height: 600,
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('executeInteractive - Base64 Image', () => {
    it('should display image from base64', async () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      mockContext.inputs.set('base64', base64Data);
      mockContext.inputs.set('format', 'png');

      const result = await node.executeInteractive(mockContext);

      expect(mockContext.displayImage).toHaveBeenCalledWith({
        base64: base64Data,
        format: 'png',
        alt: 'Test image',
      });
      expect(result.success).toBe(true);
      expect(result.outputs?.get('displayed')).toBe(true);
    });
  });

  describe('executeInteractive - Format Validation', () => {
    it('should validate and use valid format', async () => {
      mockContext.inputs.set('url', 'https://example.com/image.jpg');
      mockContext.inputs.set('format', 'jpg');

      const result = await node.executeInteractive(mockContext);

      expect(mockContext.displayImage).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'jpg',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('should fallback to default format for invalid format', async () => {
      mockContext.inputs.set('url', 'https://example.com/image.xyz');
      mockContext.inputs.set('format', 'invalid-format');

      const result = await node.executeInteractive(mockContext);

      expect(mockContext.displayImage).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'png', // default format
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('executeInteractive - Error Handling', () => {
    it('should return error when neither URL nor base64 provided', async () => {
      const result = await node.executeInteractive(mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Either URL or base64');
      expect(mockContext.displayImage).not.toHaveBeenCalled();
    });

    it('should handle displayImage errors gracefully', async () => {
      mockContext.inputs.set('url', 'https://example.com/image.png');
      (mockContext.displayImage as jest.Mock).mockImplementation(() => {
        throw new Error('Display failed');
      });

      const result = await node.executeInteractive(mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Display failed');
    });
  });

  describe('executeInternal method', () => {
    it('should call executeInteractive as fallback', async () => {
      mockContext.inputs.set('url', 'https://example.com/image.png');
      const executeSpy = jest.spyOn(node, 'executeInteractive').mockResolvedValue({
        success: true,
        outputs: new Map([['displayed', true]]),
        executionTime: 10,
      });

      await node['executeInternal'](mockContext as any);

      expect(executeSpy).toHaveBeenCalled();
    });
  });

  describe('Execution Time', () => {
    it('should measure execution time', async () => {
      mockContext.inputs.set('url', 'https://example.com/image.png');

      const result = await node.executeInteractive(mockContext);

      expect(result.executionTime).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
});

