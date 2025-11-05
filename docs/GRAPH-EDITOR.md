# Graph Editor - Web-Based Graph UI System

## Overview

A complete web-based graph editor system for creating and managing node graphs with visual drag-and-drop, type-safe connections, and persistent state management.

## Features

### ✅ Core Functionality

1. **Nodes**
   - Draggable nodes with configurable properties
   - Visual representation with input/output ports
   - Node selection and deletion
   - Position persistence

2. **Ports**
   - Input and output ports on nodes
   - Type-based coloring (string, number, boolean, etc.)
   - Required port indicators
   - Port connection validation

3. **Connections**
   - Visual connections between ports
   - Bezier curve rendering
   - Type checking to prevent invalid connections
   - Connection selection and deletion
   - Interactive connection creation (drag from output to input)

4. **Pan and Zoom**
   - Mouse wheel zooming
   - Middle mouse button or Ctrl+Left click for panning
   - Viewport state management
   - Reset view functionality

5. **State Management (Zustand)**
   - Centralized graph state
   - Reactive updates
   - Type-safe state access

6. **Persistence**
   - Save graph to JSON file
   - Load graph from JSON file
   - Preserves nodes, connections, and viewport

## Architecture

### Store Structure (`store/graphStore.ts`)

```typescript
interface GraphState {
  nodes: GraphNode[];
  connections: GraphConnection[];
  viewport: Viewport;
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  connectionStart: { nodeId: string; portId: string } | null;
  
  // Actions for nodes, ports, connections, viewport, etc.
}
```

### Component Structure

```
components/graph/
├── GraphCanvas.tsx      # Main canvas with pan/zoom
├── GraphNode.tsx         # Draggable node component
├── GraphPort.tsx         # Port visualization
├── GraphConnection.tsx   # Connection line rendering
└── GraphToolbar.tsx     # Toolbar with controls
```

## Usage

### Accessing the Graph Editor

Navigate to `/graph-editor` in the application.

### Creating Nodes

1. Click "Add Node" button in the toolbar
2. Enter node name and type
3. Node appears on canvas with default input/output ports

### Moving Nodes

- Click and drag the node header to move it
- Node position is automatically saved

### Creating Connections

1. Click and hold on an output port (right side)
2. Drag to an input port (left side) of another node
3. Release to create connection
4. Connection is validated for type compatibility

### Deleting Nodes/Connections

- **Nodes**: Select node and press Delete/Backspace, or click the ✕ button
- **Connections**: Double-click a connection to delete it

### Pan and Zoom

- **Zoom**: Scroll mouse wheel
- **Pan**: Middle mouse button or Ctrl+Left click and drag
- **Reset View**: Click "Reset View" button

### Saving and Loading

- **Save**: Click "Save" button to download graph as JSON
- **Load**: Click "Load" button to import a saved graph

## Type Checking

Connections are validated based on port types:

- **Same types**: Can always connect
- **Any type**: Can connect to any type
- **Compatible types**: Number types can connect to each other
- **Invalid types**: Connection is rejected

### Type Colors

- 🟢 **Green**: String
- 🔵 **Blue**: Number
- 🟣 **Purple**: Boolean
- 🟠 **Orange**: Object
- 🟣 **Pink**: Array
- ⚫ **Gray**: Other/Any

## Graph Data Format

Saved graphs use the following JSON format:

```json
{
  "nodes": [
    {
      "id": "node-123",
      "name": "My Node",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "inputs": [...],
      "outputs": [...],
      "properties": {}
    }
  ],
  "connections": [
    {
      "id": "conn-123",
      "fromNode": "node-1",
      "fromPort": "output-1",
      "toNode": "node-2",
      "toPort": "input-1"
    }
  ],
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  }
}
```

## Keyboard Shortcuts

- **Delete/Backspace**: Delete selected node
- **Escape**: Cancel connection creation
- **Ctrl+Click**: Pan mode

## Technical Details

### Port Position Calculation

Ports are positioned using DOM queries to find their actual rendered positions. This ensures connections are drawn accurately even when nodes are moved.

### Connection Rendering

Connections use SVG Bezier curves for smooth rendering:
- Control points are calculated based on distance between ports
- Arrow markers indicate direction (output → input)
- Selected connections are highlighted in red

### Viewport Transform

The viewport uses CSS transforms for performance:
- Nodes: `transform: translate(x, y) scale(zoom)`
- Connections: SVG `transform` attribute
- Both layers stay synchronized

### State Updates

Zustand store provides reactive updates:
- All components automatically re-render on state changes
- No prop drilling needed
- Efficient updates with minimal re-renders

## Performance Considerations

- **Large Graphs**: Canvas uses efficient rendering with absolute positioning
- **Zoom**: Transform-based zooming for smooth performance
- **Connections**: SVG rendering for scalable vector graphics
- **Updates**: Zustand minimizes unnecessary re-renders

## Future Enhancements

- [ ] Node templates from registry
- [ ] Port editing UI
- [ ] Node property editor
- [ ] Undo/redo functionality
- [ ] Graph execution from editor
- [ ] Minimap for navigation
- [ ] Connection snapping
- [ ] Multi-select nodes
- [ ] Copy/paste nodes
- [ ] Graph validation and error highlighting

## Integration with Node System

The graph editor can be integrated with the node execution system:

1. Load nodes from registry into editor
2. Create connections between nodes
3. Export graph definition
4. Execute using NodeExecutor

This creates a complete visual programming interface!

