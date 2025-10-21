/**
 * Node Registry and Graph Serialization Example
 * 
 * Demonstrates:
 * - Node registry and discovery
 * - Creating nodes by type
 * - Graph export/import (JSON/YAML)
 * - Node metadata and categorization
 */

import {
  NodeRegistry,
  registerBuiltInNodes,
  createNode,
  NodeExecutor,
  GraphSerializer,
  MathNode,
  LoggerNode
} from '../src/index';

/**
 * Example 1: Node Registry Discovery
 */
async function registryDiscoveryExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           Node Registry Discovery Example               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const registry = NodeRegistry.getInstance();

  // Get statistics
  const stats = registry.getStats();
  console.log('📊 Registry Statistics:');
  console.log(`   Total Nodes: ${stats.totalNodes}`);
  console.log(`   Categories: ${stats.categories}`);
  console.log(`   Tags: ${stats.tags}`);
  console.log(`   Deprecated: ${stats.deprecated}\n`);

  // List all categories
  console.log('📁 Available Categories:');
  registry.getCategories().forEach(cat => {
    const nodes = registry.getByCategory(cat);
    console.log(`   ${cat}: ${nodes.length} nodes`);
  });
  console.log('');

  // Browse nodes by category
  console.log('🔍 Nodes in "Functional" category:');
  const functionalNodes = registry.getByCategory('Functional');
  functionalNodes.forEach(node => {
    console.log(`   ${node.icon || '•'} ${node.displayName} (${node.type})`);
    console.log(`      ${node.description}`);
  });
  console.log('');

  // Search for nodes
  console.log('🔎 Search results for "http":');
  const searchResults = registry.search('http');
  searchResults.forEach(node => {
    console.log(`   ${node.icon || '•'} ${node.displayName}`);
    console.log(`      Category: ${node.category}`);
    console.log(`      Tags: ${node.tags.join(', ')}`);
  });
  console.log('');

  // Get nodes by tag
  console.log('🏷️  Nodes tagged with "async":');
  const asyncNodes = registry.getByTag('async');
  asyncNodes.forEach(node => {
    console.log(`   ${node.icon || '•'} ${node.displayName} - ${node.description}`);
  });
  console.log('');
}

/**
 * Example 2: Creating Nodes from Registry
 */
async function createNodesExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║          Creating Nodes from Registry Example           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Create nodes using the registry
  console.log('🏗️  Creating nodes from registry...\n');

  const mathNode = createNode('utility.math', {
    name: 'Custom Math Node'
  });
  console.log(`✓ Created ${mathNode.name} (ID: ${mathNode.id})`);

  const httpNode = createNode('async.http-request');
  console.log(`✓ Created ${httpNode.name} (ID: ${httpNode.id})`);

  const mapNode = createNode('functional.map');
  console.log(`✓ Created ${mapNode.name} (ID: ${mapNode.id})`);

  console.log('\n📝 Node details:');
  const registry = NodeRegistry.getInstance();
  const metadata = registry.getMetadata('utility.math');
  if (metadata) {
    console.log(`   Type: ${metadata.type}`);
    console.log(`   Category: ${metadata.category}`);
    console.log(`   Version: ${metadata.version}`);
    console.log(`   Inputs: ${metadata.inputs.length}`);
    console.log(`   Outputs: ${metadata.outputs.length}`);
    console.log(`   Tags: ${metadata.tags.join(', ')}`);
  }
  console.log('');
}

/**
 * Example 3: Graph Serialization (Export/Import)
 */
async function graphSerializationExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         Graph Serialization (Export/Import)             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Create a workflow
  const executor = new NodeExecutor();
  
  const math1 = createNode('utility.math');
  const math2 = createNode('utility.math');
  const logger = createNode('utility.logger');

  executor.addNode(math1);
  executor.addNode(math2);
  executor.addNode(logger);

  executor.addConnection({
    id: 'conn1',
    fromNode: math1.id,
    fromPort: 'result',
    toNode: math2.id,
    toPort: 'a'
  });

  executor.addConnection({
    id: 'conn2',
    fromNode: math2.id,
    fromPort: 'result',
    toNode: logger.id,
    toPort: 'message'
  });

  console.log('📊 Created workflow:');
  console.log(`   Nodes: ${executor.getNodes().length}`);
  console.log(`   Connections: ${executor.getConnections().length}\n`);

  // Serialize to JSON
  const serializer = new GraphSerializer();
  const graphDef = serializer.serializeExecutor(executor, {
    name: 'Math Pipeline',
    description: 'A simple math calculation pipeline',
    author: 'VZ Programming'
  });

  const json = serializer.toJSON(graphDef, true);
  console.log('📄 Exported to JSON:');
  console.log(json.substring(0, 500) + '...\n');

  // Export to YAML
  const yaml = serializer.toYAML(graphDef);
  console.log('📄 Exported to YAML:');
  console.log(yaml.substring(0, 400) + '...\n');

  // Import back from JSON
  console.log('📥 Importing from JSON...');
  const imported = serializer.fromJSON(json);
  console.log(`✓ Imported graph: "${imported.name}"`);
  console.log(`   Nodes: ${imported.nodes.length}`);
  console.log(`   Connections: ${imported.connections.length}`);
  console.log(`   Created: ${imported.created}\n`);

  // Recreate executor from definition
  const newExecutor = serializer.deserializeToExecutor(imported);
  console.log('🔄 Recreated executor from definition:');
  console.log(`   Nodes: ${newExecutor.getNodes().length}`);
  console.log(`   Connections: ${newExecutor.getConnections().length}`);
  console.log('');
}

/**
 * Example 4: Node Metadata and Documentation
 */
async function nodeMetadataExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           Node Metadata and Documentation               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  const registry = NodeRegistry.getInstance();

  // Display detailed node information
  const httpMetadata = registry.getMetadata('async.http-request');
  if (httpMetadata) {
    console.log(`${httpMetadata.icon} ${httpMetadata.displayName}`);
    console.log('═'.repeat(60));
    console.log(`Type: ${httpMetadata.type}`);
    console.log(`Category: ${httpMetadata.category}`);
    console.log(`Version: ${httpMetadata.version}`);
    console.log(`Author: ${httpMetadata.author}`);
    console.log(`\nDescription:\n${httpMetadata.description}`);
    
    console.log(`\n📥 Inputs (${httpMetadata.inputs.length}):`);
    httpMetadata.inputs.forEach(input => {
      const required = input.required ? '(required)' : '(optional)';
      console.log(`   • ${input.name} ${required}`);
      console.log(`     Type: ${input.dataType.name}`);
      console.log(`     ${input.description}`);
    });

    console.log(`\n📤 Outputs (${httpMetadata.outputs.length}):`);
    httpMetadata.outputs.forEach(output => {
      console.log(`   • ${output.name}`);
      console.log(`     Type: ${output.dataType.name}`);
      console.log(`     ${output.description}`);
    });

    console.log(`\n🏷️  Tags: ${httpMetadata.tags.join(', ')}`);
    
    if (httpMetadata.examples && httpMetadata.examples.length > 0) {
      console.log(`\n💡 Examples:`);
      httpMetadata.examples.forEach(ex => {
        console.log(`   • ${ex}`);
      });
    }
  }
  console.log('');
}

/**
 * Example 5: Export Registry Catalog
 */
async function exportCatalogExample() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              Export Registry Catalog                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  const registry = NodeRegistry.getInstance();

  // Export full catalog
  const catalog = registry.exportMetadata();
  console.log('📚 Exported node catalog:');
  
  const catalogObj = JSON.parse(catalog);
  console.log(`   Version: ${catalogObj.version}`);
  console.log(`   Timestamp: ${catalogObj.timestamp}`);
  console.log(`   Total Nodes: ${catalogObj.nodes.length}`);
  console.log(`   Categories: ${catalogObj.categories.length}`);
  console.log(`   Tags: ${catalogObj.tags.length}`);
  
  console.log('\n📊 Nodes by category:');
  const byCategory = new Map<string, number>();
  catalogObj.nodes.forEach((node: any) => {
    byCategory.set(node.category, (byCategory.get(node.category) || 0) + 1);
  });
  
  byCategory.forEach((count, category) => {
    console.log(`   ${category}: ${count} nodes`);
  });
  
  console.log('\n💾 Catalog can be saved to file for documentation or API reference');
  console.log('');
}

/**
 * Run all registry examples
 */
async function runAllRegistryExamples() {
  try {
    // Register built-in nodes once at the start
    registerBuiltInNodes();
    
    await registryDiscoveryExample();
    await createNodesExample();
    await graphSerializationExample();
    await nodeMetadataExample();
    await exportCatalogExample();
    
    console.log('\n✅ All registry examples completed successfully!\n');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Run if executed directly
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  runAllRegistryExamples();
}

export {
  registryDiscoveryExample,
  createNodesExample,
  graphSerializationExample,
  nodeMetadataExample,
  exportCatalogExample,
  runAllRegistryExamples
};
