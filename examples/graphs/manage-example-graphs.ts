/**
 * Example Graph Management Script
 * 
 * This script demonstrates how to create, update, and delete example graphs.
 * It uses the GraphManager to manage graphs (which internally uses GraphStorage).
 */

import { GraphManager } from '../../src/graph-management/GraphManager';
import { GraphStorage } from '../../src/graph-management/GraphStorage';
import { GraphDefinition } from '../../src/graph-management/types';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Load a graph from JSON file
 */
function loadGraphFromFile(filePath: string): GraphDefinition {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as GraphDefinition;
}

/**
 * Create example graphs
 */
async function createExampleGraphs(): Promise<void> {
  const manager = new GraphManager();
  const storage = new GraphStorage();

  // Get the directory where graphs are stored (same as test graph)
  const graphsDir = join(process.cwd(), 'data', 'graphs');
  
  const graphFiles = [
    'interactive-nodes-graph.json',
    'download-image-graph.json',
    'download-transform-save-graph.json',
    'load-file-display-graph.json',
  ];

  console.log('Creating example graphs...\n');

  for (const file of graphFiles) {
    try {
      const graphPath = join(graphsDir, file);
      if (!existsSync(graphPath)) {
        console.error(`❌ Graph file not found: ${graphPath}`);
        continue;
      }
      const graph = loadGraphFromFile(graphPath);
      
      // Check if graph already exists
      const graphs = await manager.listGraphs();
      const graphExists = graphs.some(g => g.id === graph.id);
      
      if (graphExists) {
        console.log(`⏭️  Graph already exists: ${graph.metadata.name} (${graph.id})`);
        continue;
      }

      // Update timestamps if needed
      const now = new Date().toISOString();
      if (!graph.metadata.createdAt) {
        graph.metadata.createdAt = now;
      }
      if (!graph.metadata.updatedAt) {
        graph.metadata.updatedAt = now;
      }

      // Update node and connection counts
      graph.metadata.nodeCount = graph.data.nodes.length;
      graph.metadata.connectionCount = graph.data.connections.length;

      // Save directly using GraphStorage to preserve the ID (like test graph)
      await storage.save(graph);

      console.log(`✅ Created graph: ${graph.metadata.name} (${graph.id})`);
    } catch (error) {
      console.error(`❌ Failed to create graph from ${file}:`, error);
    }
  }

  console.log('\n✅ All example graphs created!');
}

/**
 * Update an example graph
 */
async function updateExampleGraph(
  graphId: string,
  updates: {
    name?: string;
    description?: string;
    nodes?: GraphDefinition['data']['nodes'];
    connections?: GraphDefinition['data']['connections'];
    viewport?: GraphDefinition['data']['viewport'];
  },
): Promise<void> {
  const manager = new GraphManager();

  try {
    // Separate data and metadata updates
    const dataUpdates = updates.nodes || updates.connections || updates.viewport
      ? {
          nodes: updates.nodes,
          connections: updates.connections,
          viewport: updates.viewport,
        }
      : undefined;

    const metadataUpdates = updates.name || updates.description
      ? {
          name: updates.name,
          description: updates.description,
        }
      : undefined;

    await manager.updateGraph(graphId, dataUpdates, metadataUpdates);
    console.log(`✅ Updated graph: ${graphId}`);
  } catch (error) {
    console.error(`❌ Failed to update graph ${graphId}:`, error);
    throw error;
  }
}

/**
 * Delete an example graph
 */
async function deleteExampleGraph(graphId: string): Promise<void> {
  const manager = new GraphManager();

  try {
    await manager.deleteGraph(graphId);
    console.log(`✅ Deleted graph: ${graphId}`);
  } catch (error) {
    console.error(`❌ Failed to delete graph ${graphId}:`, error);
    throw error;
  }
}

/**
 * List all example graphs
 */
async function listExampleGraphs(): Promise<void> {
  const manager = new GraphManager();

  try {
    const graphs = await manager.listGraphs();
    
    console.log('\n📊 Example Graphs:\n');
    
    if (graphs.length === 0) {
      console.log('No graphs found.');
      return;
    }

    graphs.forEach((graph) => {
      console.log(`  📄 ${graph.name} (${graph.id})`);
      if (graph.description) {
        console.log(`     ${graph.description}`);
      }
      console.log(`     Nodes: ${graph.nodeCount}, Connections: ${graph.connectionCount}`);
      if (graph.tags && graph.tags.length > 0) {
        console.log(`     Tags: ${graph.tags.join(', ')}`);
      }
      console.log(`     Created: ${graph.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to list graphs:', error);
  }
}

/**
 * Get a specific graph
 */
async function getGraph(graphId: string): Promise<GraphDefinition | null> {
  const manager = new GraphManager();

  try {
    const graph = await manager.getGraph(graphId);
    return graph;
  } catch (error) {
    console.error(`❌ Failed to get graph ${graphId}:`, error);
    return null;
  }
}

/**
 * Main function - demonstrates CRUD operations
 */
async function main() {
  const command = process.argv[2];
  const graphId = process.argv[3];

  switch (command) {
    case 'create':
      await createExampleGraphs();
      break;

    case 'list':
      await listExampleGraphs();
      break;

    case 'get':
      if (!graphId) {
        console.error('Usage: npm run manage-graphs get <graph-id>');
        process.exit(1);
      }
      const graph = await getGraph(graphId);
      if (graph) {
        console.log('\n📄 Graph Details:');
        console.log(JSON.stringify(graph, null, 2));
      }
      break;

    case 'update':
      if (!graphId) {
        console.error('Usage: npm run manage-graphs update <graph-id>');
        process.exit(1);
      }
      // Example update: change description
      await updateExampleGraph(graphId, {
        description: 'Updated description',
        // You can also update nodes, connections, viewport here
      });
      break;

    case 'delete':
      if (!graphId) {
        console.error('Usage: npm run manage-graphs delete <graph-id>');
        process.exit(1);
      }
      await deleteExampleGraph(graphId);
      break;

    default:
      console.log(`
Example Graph Management Script

Usage:
  npm run manage-graphs <command> [graph-id]

Commands:
  create              Create all example graphs from JSON files
  list                List all graphs
  get <graph-id>      Get a specific graph
  update <graph-id>   Update a graph
  delete <graph-id>   Delete a graph

Examples:
  npm run manage-graphs create
  npm run manage-graphs list
  npm run manage-graphs get graph-interactive-nodes
  npm run manage-graphs update graph-interactive-nodes
  npm run manage-graphs delete graph-interactive-nodes
      `);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  createExampleGraphs,
  updateExampleGraph,
  deleteExampleGraph,
  listExampleGraphs,
  getGraph,
};

