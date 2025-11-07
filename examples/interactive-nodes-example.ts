/**
 * Example: Interactive Nodes Usage
 * 
 * Demonstrates how to create and use interactive nodes in graphs
 */

import { GraphExecutionEngine } from '../src/graph-management';
import { UserInputNode } from '../src/nodes/interactive/UserInputNode';
import { ImageDisplayNode } from '../src/nodes/interactive/ImageDisplayNode';
import { ConstantNode } from '../src/nodes/utility/UtilityNodes';
import { LoggerNode } from '../src/nodes/utility/UtilityNodes';
import type { GraphDefinition } from '../src/graph-management/types';

/**
 * Example 1: Simple User Input Flow
 * 
 * A graph that requests user input and logs it
 */
export async function example1_SimpleUserInput() {
  console.log('=== Example 1: Simple User Input Flow ===\n');

  const userInputNode = new UserInputNode({
    id: 'user-input-1',
    inputType: 'prompt',
    prompt: 'Enter your name:',
  });

  const loggerNode = new LoggerNode({
    id: 'logger-1',
  });

  const graph: GraphDefinition = {
    metadata: {
      name: 'Simple User Input Example',
      description: 'Requests user input and logs it',
      tags: ['interactive', 'example'],
    },
    data: {
      nodes: [
        {
          id: 'user-input-1',
          name: 'User Input',
          type: 'user-input',
          position: { x: 100, y: 100 },
        },
        {
          id: 'logger-1',
          name: 'Logger',
          type: 'logger',
          position: { x: 300, y: 100 },
        },
      ],
      connections: [
        {
          id: 'conn-1',
          fromNode: 'user-input-1',
          fromPort: 'value',
          toNode: 'logger-1',
          toPort: 'message',
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  };

  const engine = new GraphExecutionEngine();
  const executor = await engine.buildExecutor(graph);

  // Note: In a real scenario, you would provide user input via the API
  // For this example, we'll simulate it
  console.log('Graph created with user input node');
  console.log('When executed, it will request user input');
  console.log('User input will be logged by the logger node\n');
}

/**
 * Example 2: Form Input with Validation
 * 
 * A graph that requests form input with validation
 */
export async function example2_FormInput() {
  console.log('=== Example 2: Form Input with Validation ===\n');

  const userInputNode = new UserInputNode({
    id: 'user-input-1',
    inputType: 'form',
    formSchema: {
      title: 'User Registration',
      description: 'Please fill in your information',
      fields: [
        {
          id: 'name',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your full name',
          validation: [
            { type: 'required', message: 'Name is required' },
            { type: 'min', value: 2, message: 'Name must be at least 2 characters' },
          ],
        },
        {
          id: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          placeholder: 'Enter your email',
          validation: [
            { type: 'required', message: 'Email is required' },
            {
              type: 'pattern',
              value: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
              message: 'Invalid email format',
            },
          ],
        },
        {
          id: 'age',
          label: 'Age',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Age is required' },
            { type: 'min', value: 18, message: 'Must be at least 18 years old' },
            { type: 'max', value: 120, message: 'Invalid age' },
          ],
        },
      ],
    },
  });

  const graph: GraphDefinition = {
    metadata: {
      name: 'Form Input Example',
      description: 'Requests form input with validation',
      tags: ['interactive', 'form', 'validation'],
    },
    data: {
      nodes: [
        {
          id: 'user-input-1',
          name: 'User Input',
          type: 'user-input',
          position: { x: 100, y: 100 },
        },
      ],
      connections: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  };

  console.log('Graph created with form input node');
  console.log('Form includes: name, email, age with validation\n');
}

/**
 * Example 3: Image Display
 * 
 * A graph that displays an image
 */
export async function example3_ImageDisplay() {
  console.log('=== Example 3: Image Display ===\n');

  const constantNode = new ConstantNode({
    id: 'constant-1',
    properties: {
      type: 'string',
      value: 'https://example.com/image.png',
    },
  });

  const imageDisplayNode = new ImageDisplayNode({
    id: 'image-display-1',
    defaultFormat: 'png',
    defaultAlt: 'Example image',
  });

  const graph: GraphDefinition = {
    metadata: {
      name: 'Image Display Example',
      description: 'Displays an image from URL',
      tags: ['interactive', 'image'],
    },
    data: {
      nodes: [
        {
          id: 'constant-1',
          name: 'Constant',
          type: 'constant',
          position: { x: 100, y: 100 },
        },
        {
          id: 'image-display-1',
          name: 'Image Display',
          type: 'image-display',
          position: { x: 300, y: 100 },
        },
      ],
      connections: [
        {
          id: 'conn-1',
          fromNode: 'constant-1',
          fromPort: 'result',
          toNode: 'image-display-1',
          toPort: 'url',
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  };

  console.log('Graph created with image display node');
  console.log('Constant node provides image URL');
  console.log('Image will be displayed when graph executes\n');
}

/**
 * Example 4: Mixed Interactive and Regular Nodes
 * 
 * A graph that combines interactive and regular nodes
 */
export async function example4_MixedNodes() {
  console.log('=== Example 4: Mixed Interactive and Regular Nodes ===\n');

  const userInputNode = new UserInputNode({
    id: 'user-input-1',
    inputType: 'prompt',
    prompt: 'Enter a number:',
  });

  const constantNode = new ConstantNode({
    id: 'constant-1',
    properties: {
      type: 'number',
      value: '10',
    },
  });

  const loggerNode = new LoggerNode({
    id: 'logger-1',
  });

  const graph: GraphDefinition = {
    metadata: {
      name: 'Mixed Nodes Example',
      description: 'Combines interactive and regular nodes',
      tags: ['interactive', 'mixed'],
    },
    data: {
      nodes: [
        {
          id: 'user-input-1',
          name: 'User Input',
          type: 'user-input',
          position: { x: 100, y: 100 },
        },
        {
          id: 'constant-1',
          name: 'Constant',
          type: 'constant',
          position: { x: 100, y: 200 },
        },
        {
          id: 'logger-1',
          name: 'Logger',
          type: 'logger',
          position: { x: 300, y: 150 },
        },
      ],
      connections: [
        {
          id: 'conn-1',
          fromNode: 'user-input-1',
          fromPort: 'value',
          toNode: 'logger-1',
          toPort: 'message',
        },
        {
          id: 'conn-2',
          fromNode: 'constant-1',
          fromPort: 'result',
          toNode: 'logger-1',
          toPort: 'data',
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  };

  console.log('Graph created with mixed nodes');
  console.log('Includes: user input, constant, and logger nodes\n');
}

/**
 * Example 5: Multiple Interactive Nodes in Sequence
 * 
 * A graph with multiple interactive nodes
 */
export async function example5_MultipleInteractive() {
  console.log('=== Example 5: Multiple Interactive Nodes ===\n');

  const userInput1 = new UserInputNode({
    id: 'user-input-1',
    inputType: 'prompt',
    prompt: 'Enter first value:',
  });

  const userInput2 = new UserInputNode({
    id: 'user-input-2',
    inputType: 'prompt',
    prompt: 'Enter second value:',
  });

  const imageDisplay = new ImageDisplayNode({
    id: 'image-display-1',
  });

  const loggerNode = new LoggerNode({
    id: 'logger-1',
  });

  const graph: GraphDefinition = {
    metadata: {
      name: 'Multiple Interactive Nodes Example',
      description: 'Demonstrates multiple interactive nodes',
      tags: ['interactive', 'multiple'],
    },
    data: {
      nodes: [
        {
          id: 'user-input-1',
          name: 'User Input 1',
          type: 'user-input',
          position: { x: 100, y: 100 },
        },
        {
          id: 'user-input-2',
          name: 'User Input 2',
          type: 'user-input',
          position: { x: 100, y: 200 },
        },
        {
          id: 'image-display-1',
          name: 'Image Display',
          type: 'image-display',
          position: { x: 300, y: 100 },
        },
        {
          id: 'logger-1',
          name: 'Logger',
          type: 'logger',
          position: { x: 300, y: 200 },
        },
      ],
      connections: [
        {
          id: 'conn-1',
          fromNode: 'user-input-1',
          fromPort: 'value',
          toNode: 'logger-1',
          toPort: 'message',
        },
        {
          id: 'conn-2',
          fromNode: 'user-input-2',
          fromPort: 'value',
          toNode: 'logger-1',
          toPort: 'data',
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  };

  console.log('Graph created with multiple interactive nodes');
  console.log('Includes: 2 user input nodes, 1 image display node, 1 logger node\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  await example1_SimpleUserInput();
  await example2_FormInput();
  await example3_ImageDisplay();
  await example4_MixedNodes();
  await example5_MultipleInteractive();
  console.log('All examples completed!');
}

// Export for use in tests or other modules
export {
  example1_SimpleUserInput,
  example2_FormInput,
  example3_ImageDisplay,
  example4_MixedNodes,
  example5_MultipleInteractive,
};

