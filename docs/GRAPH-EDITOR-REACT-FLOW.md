# Graph Editor - React Flow Migration

## Overview

The Graph Editor has been successfully migrated to use the React Flow library.

## Changes

### Previous (Custom Implementation)
- Custom Canvas component
- Node dragging using react-draggable
- Direct connection rendering with SVG
- Manual Pan/Zoom implementation

### Current (React Flow)
- React Flow library usage
- Built-in drag and drop
- Automatic connection rendering
- Built-in Pan/Zoom/Controls
- MiniMap support
- Background grid

## Key Features

### ✅ Maintained Features

1. **Type-Validated Connections**
   - Connection validation based on port types
   - Block incompatible connections
   - Color coding by type

2. **Zustand State Management**
   - Maintained existing store structure
   - Fully synchronized with React Flow

3. **Save/Load**
   - Save/load as JSON files
   - Preserves graph state

4. **Node Creation/Deletion**
   - Add nodes from toolbar
   - Delete nodes with Delete key

### 🆕 Added Features

1. **MiniMap**
   - Full graph preview
   - Navigation support

2. **Controls**
   - Zoom in/out buttons
   - Fit View button
   - Fullscreen toggle

3. **Background**
   - Grid background
   - Visual guides

4. **Snap to Grid**
   - Node alignment
   - Clean layout

## Technology Stack

- **React Flow**: Graph editor library
- **Zustand**: State management
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling

## File Structure

```
components/graph/
├── ReactFlowCanvas.tsx    # React Flow main canvas
├── ReactFlowNode.tsx      # Custom node component
├── GraphToolbar.tsx       # Toolbar (maintained from previous version)
└── (Previous custom components are maintained but not used)
```

## Usage

### Basic Usage

1. **Add Node**
   - Click "Add Node" in toolbar
   - Enter node name and type

2. **Move Node**
   - Drag node to move
   - Automatically snaps to grid

3. **Create Connection**
   - Drag from output port to input port
   - Type validation automatically performed

4. **Pan & Zoom**
   - Zoom with mouse wheel
   - Pan by dragging
   - Use Controls panel

5. **MiniMap**
   - MiniMap in bottom left
   - Click for quick navigation

## React Flow Advantages

1. **Performance**
   - Optimized rendering
   - Support for large-scale graphs

2. **Features**
   - Rich built-in features
   - Extensible plugins

3. **Maintenance**
   - Proven library
   - Active community

4. **Accessibility**
   - Keyboard navigation
   - Screen reader support

## Customization

### Node Styles

Modify custom node styles in `ReactFlowNode.tsx`:

```typescript
// Change port colors
const getTypeColor = (typeName: string): string => {
  // Custom color logic
};
```

### Connection Styles

Modify edge styles in `ReactFlowCanvas.tsx`:

```typescript
const reactFlowEdges = useMemo<Edge[]>(() => {
  return storeConnections.map((conn) => ({
    // ...
    style: { stroke: '#3B82F6', strokeWidth: 2 },
    type: 'smoothstep', // or 'default', 'straight'
  }));
}, [storeConnections]);
```

## Migration Notes

### Existing Code Compatibility

- Maintained existing Zustand store structure
- Compatible with existing saved graph files
- No API changes

### Removed Features

- Custom Canvas implementation (replaced with React Flow)
- Manual port position calculation (handled automatically by React Flow)
- Custom connection rendering (using React Flow edges)

### Enhanced Features

- Smoother animations
- Better performance
- More built-in features

## Troubleshooting

### Connections Not Created

- Check if ports are properly rendered as Handles
- Check type compatibility
- Check browser console

### Nodes Not Visible

- Check if 'custom' type is registered in `nodeTypes`
- Check if wrapped with ReactFlowProvider

### Viewport Not Saved

- Check if `handleMove` callback is working properly
- Check Zustand store updates

## Next Steps

1. **Node Templates**: Load nodes from registry
2. **Execution Visualization**: Animation during graph execution
3. **Grouping**: Node grouping functionality
4. **Real-time Collaboration**: WebSocket integration

## References

- [React Flow Official Documentation](https://reactflow.dev/)
- [React Flow Examples](https://reactflow.dev/examples/)
- [React Flow API Reference](https://reactflow.dev/api-reference/)


