/**
 * Initialize Test Graph Script
 * 
 * Saves the test graph to the graph storage so it appears in the graphs list.
 * This script can be run manually or called during application startup.
 */

import { GraphManager } from '../src/graph-management';
import { readFileSync } from 'fs';
import { join } from 'path';

const TEST_GRAPH_PATH = join(process.cwd(), 'data', 'graphs', 'test-live-execution.json');

/**
 * Initialize test graph in storage
 */
export async function initializeTestGraph(): Promise<void> {
  try {
    const manager = new GraphManager();
    
    // Check if test graph already exists
    const graphs = await manager.listGraphs();
    const testGraphExists = graphs.some(g => g.id === 'test-live-execution-001');
    
    if (testGraphExists) {
      console.log('Test graph already exists in storage');
      return;
    }

    // Load test graph file
    const graphData = JSON.parse(readFileSync(TEST_GRAPH_PATH, 'utf-8'));
    
    // Save using GraphManager (this will add it to the index)
    await manager.createGraph(
      graphData.data,
      {
        name: graphData.metadata.name,
        description: graphData.metadata.description,
        author: graphData.metadata.author,
        tags: graphData.metadata.tags,
      }
    );

    console.log('Test graph initialized successfully');
  } catch (error) {
    console.error('Failed to initialize test graph:', error);
    // Don't throw - this is optional initialization
  }
}

// Run if called directly
if (require.main === module) {
  initializeTestGraph()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

