/**
 * Unit Tests for InputConfigPanel Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import InputConfigPanel from '../../components/graph/InputConfigPanel';
import { useGraphStore } from '../../store/graphStore';
import { DataTypes } from '../../src/types';

// Mock the store
jest.mock('../../store/graphStore', () => ({
  useGraphStore: jest.fn(),
}));

describe('InputConfigPanel', () => {
  const mockNodes = [
    {
      id: 'node-1',
      name: 'Test Node',
      type: 'test',
      position: { x: 0, y: 0 },
      inputs: [
        {
          id: 'input-1',
          name: 'Input 1',
          dataType: DataTypes.STRING,
          required: true,
        },
        {
          id: 'input-2',
          name: 'Input 2',
          dataType: DataTypes.NUMBER,
          required: true,
        },
      ],
      outputs: [],
    },
  ];

  const mockConnections: any[] = [];
  const mockInputConfig = {};
  const mockInputTemplates: any[] = [];

  const mockStore = {
    nodes: mockNodes,
    connections: mockConnections,
    inputConfig: mockInputConfig,
    inputTemplates: mockInputTemplates,
    setInputValue: jest.fn(),
    clearInputConfig: jest.fn(),
    saveInputTemplate: jest.fn(),
    loadInputTemplate: jest.fn(),
    deleteInputTemplate: jest.fn(),
  };

  beforeEach(() => {
    (useGraphStore as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(<InputConfigPanel isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByText('Input Configuration')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(<InputConfigPanel isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('Input Configuration')).toBeInTheDocument();
  });

  it('should display nodes requiring inputs', () => {
    render(<InputConfigPanel isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('should handle input value changes', () => {
    render(<InputConfigPanel isOpen={true} onClose={jest.fn()} />);
    
    // Expand node
    const expandButton = screen.getByText(/Test Node/);
    fireEvent.click(expandButton);

    // Find input field and change value
    const input = screen.getByPlaceholderText(/Enter Input 1/);
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(mockStore.setInputValue).toHaveBeenCalledWith('node-1', 'input-1', 'new value');
  });

  it('should handle template save', () => {
    render(<InputConfigPanel isOpen={true} onClose={jest.fn()} />);
    
    // Click save template button
    const saveButton = screen.getByText('Save Template');
    fireEvent.click(saveButton);

    // Enter template name and save
    const input = screen.getByPlaceholderText('Template name...');
    fireEvent.change(input, { target: { value: 'My Template' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockStore.saveInputTemplate).toHaveBeenCalledWith('My Template');
  });
});

