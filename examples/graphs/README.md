# Example Graphs

The example graphs are stored in `data/graphs/` (same location as the "Live Execution Test Graph") and are automatically loaded by the API when the graphs list is accessed.

## Available Graphs

### 1. Interactive Nodes Example (`interactive-nodes-graph.json`)
- **Description**: Demonstrates interactive nodes - user input and image display
- **Nodes**: UserInputNode, ConstantNode, ImageDisplayNode
- **Use Case**: Shows how to request user input and display images during execution

### 2. Download and Display Image (`download-image-graph.json`)
- **Description**: Downloads an image from the internet and displays it
- **Nodes**: ConstantNode, HttpRequestNode, ImageDisplayNode
- **Use Case**: Fetch an image from a URL and display it to the user

### 3. Download, Transform, and Save (`download-transform-save-graph.json`)
- **Description**: Downloads a text file, transforms it, and saves it locally
- **Nodes**: ConstantNode, HttpRequestNode, TransformNode, WriteFileNode
- **Use Case**: Process remote text files and save transformed results

### 4. Load File and Display (`load-file-display-graph.json`)
- **Description**: Loads a stored file and displays its content to the user
- **Nodes**: ConstantNode, ReadFileNode, UserInputNode
- **Use Case**: Read local files and present their content to users

## Managing Graphs

All graphs can be created, updated, and deleted using the management script.

### Creating All Example Graphs

The example graphs are stored in `data/graphs/` and are automatically loaded when you access the graphs API. However, you can also manually initialize them:

First, build the project:
```bash
npm run build
```

Then create the graphs:
```bash
npm run manage-graphs create
```

This will load all example graphs from `data/graphs/` and save them to the graph storage (preserving their IDs, just like the test graph).

### Listing All Graphs

```bash
npm run manage-graphs list
```

### Getting a Specific Graph

```bash
npm run manage-graphs get <graph-id>
```

Example:
```bash
npm run manage-graphs get graph-interactive-nodes
```

### Updating a Graph

```bash
npm run manage-graphs update <graph-id>
```

You can modify the `updateExampleGraph` function in `manage-example-graphs.ts` to customize what gets updated.

### Deleting a Graph

```bash
npm run manage-graphs delete <graph-id>
```

Example:
```bash
npm run manage-graphs delete graph-interactive-nodes
```

## Graph Location

All example graphs are stored in `data/graphs/` directory, the same location as the "Live Execution Test Graph". They are automatically loaded by the API when you access the graphs list endpoint (`/api/graphs`).

## Graph Structure

Each graph JSON file follows this structure:

```json
{
  "id": "unique-graph-id",
  "metadata": {
    "id": "unique-graph-id",
    "name": "Graph Name",
    "description": "Graph description",
    "author": "Author name",
    "version": "1.0.0",
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "tags": ["tag1", "tag2"],
    "nodeCount": 3,
    "connectionCount": 2
  },
  "data": {
    "nodes": [...],
    "connections": [...],
    "viewport": {
      "x": 0,
      "y": 0,
      "zoom": 1
    }
  }
}
```

## Creating Custom Graphs

To create your own graph:

1. Create a JSON file following the structure above
2. Define your nodes with positions, inputs, outputs, and properties
3. Define connections between nodes
4. Use the management script to create it:

```typescript
import { GraphStorage } from '../../src/graph-management/GraphStorage';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load graph from JSON file
const graphPath = join(process.cwd(), 'data', 'graphs', 'my-graph.json');
const graphData = JSON.parse(readFileSync(graphPath, 'utf-8'));

// Save using GraphStorage to preserve the ID (same as test graph)
const storage = new GraphStorage();
await storage.save(graphData);
```

## Graph IDs

The example graphs use these IDs (stored in `data/graphs/`):
- `graph-interactive-nodes` - Interactive Nodes Example (`interactive-nodes-graph.json`)
- `graph-download-image` - Download and Display Image (`download-image-graph.json`)
- `graph-download-transform-save` - Download, Transform, and Save (`download-transform-save-graph.json`)
- `graph-load-file-display` - Load File and Display (`load-file-display-graph.json`)

These graphs are automatically initialized when you access the graphs API, just like the "Live Execution Test Graph" (`test-live-execution-001`).

## Notes

- All graphs are stored in `data/graphs/` directory (same as test graph)
- Graphs are automatically loaded by the API when accessing `/api/graphs`
- Graphs preserve their IDs when saved (using `GraphStorage.save()` directly)
- Graphs can be updated by modifying the JSON files in `data/graphs/` and re-running the management script
- Graphs can be deleted individually using the management script
- The management script uses `GraphStorage.save()` to preserve graph IDs (same approach as test graph)

