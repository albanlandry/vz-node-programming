# Graph Editor - User Guide

## Overview

A web-based graph UI system has been successfully implemented. You can visually create and manage nodes, ports, and connections.

## Key Features

### ✅ Implemented Features

1. **Nodes**
   - Drag and drop to move
   - Property configuration (ID, name, type, position)
   - Contains input/output ports

2. **Ports**
   - Color coding by type
   - Input/output distinction
   - Required port indicators

3. **Connections**
   - Create connections between ports
   - Type validation prevents invalid connections
   - Visualized with Bezier curves

4. **Pan & Zoom**
   - Zoom with mouse wheel
   - Pan with middle button or Ctrl+click
   - Viewport reset

5. **State Management (Zustand)**
   - Centralized state management
   - Reactive updates

6. **Persistence**
   - Save/load as JSON files
   - Preserves graph state

## Quick Start

### 1. Access Graph Editor

```
http://localhost:3000/graph-editor
```

Or click "Graph Editor" in the navigation menu

### 2. Create Nodes

1. Click "Add Node" button in the toolbar
2. Enter node name and type
3. Click "Add"
4. Node appears on the canvas

### 3. Move Nodes

- Click and drag the blue header of a node
- Position is automatically saved

### 4. Create Connections

1. Click and drag from an output port (right side, colored dot)
2. Drag to an input port (left side, colored dot)
3. Release mouse button to create connection
4. Connection is rejected if types are incompatible

### 5. Delete

- **Node**: Select a node and press Delete key or click ✕ button
- **Connection**: Double-click the connection line

### 6. Pan & Zoom

- **Zoom In**: Mouse wheel up
- **Zoom Out**: Mouse wheel down
- **Pan**: Middle mouse button or Ctrl+Left click drag
- **Reset**: Click "Reset View" button

### 7. Save/Load

- **Save**: Click "Save" button → Downloads `graph.json` file
- **Load**: Click "Load" button → Select JSON file → Graph is restored

## Type System

### Port Type Colors

- 🟢 **Green**: String
- 🔵 **Blue**: Number
- 🟣 **Purple**: Boolean
- 🟠 **Orange**: Object
- 🟣 **Pink**: Array
- ⚫ **Gray**: Other/Any

### Connection Rules

- **Same type**: ✅ Always connectable
- **Any type**: ✅ Connectable with all types
- **Number type**: ✅ Compatible with each other
- **Incompatible types**: ❌ Connection blocked

## Keyboard Shortcuts

- **Delete / Backspace**: Delete selected node
- **Escape**: Cancel connection creation
- **Ctrl + Left Click**: Pan mode

## Technology Stack

- **State Management**: Zustand
- **Drag and Drop**: react-draggable
- **Rendering**: React + SVG
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript

## File Structure

```
store/
└── graphStore.ts              # Zustand store

components/graph/
├── GraphCanvas.tsx            # Main canvas
├── GraphNode.tsx              # Node component
├── GraphPort.tsx              # Port component
├── GraphConnection.tsx        # Connection component
└── GraphToolbar.tsx           # Toolbar

app/graph-editor/
└── page.tsx                   # Editor page
```

## Examples

### Basic Graph Creation

1. Create 2 nodes
2. Connect output port of first node to input port of second node
3. Save graph

### Complex Graph

1. Create multiple nodes
2. Connect nodes according to type compatibility
3. Explore graph with Pan & Zoom
4. Save to load later

## Troubleshooting

### Connections Not Visible

- Check if ports are rendered correctly
- Check if types are compatible
- Check browser console for errors

### Cannot Drag Nodes

- Must drag the blue header of the node
- Check if other elements are overlapping the node

### Zoom Not Working

- Must use mouse wheel in canvas area
- May conflict with browser's default zoom behavior

## Next Steps

The graph editor is fully functional and ready to use!

Future improvements:
- Load nodes from registry
- Execute graphs directly from editor
- Edit node properties
- Execution visualization
