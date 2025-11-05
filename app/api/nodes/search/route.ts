import { NextRequest, NextResponse } from 'next/server';
import { NodeRegistry, registerBuiltInNodes } from '../../../../src/index';

/**
 * Route Handler for GET /api/nodes/search
 * Searches nodes with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    // Register built-in nodes if not already registered
    const registry = NodeRegistry.getInstance();
    
    if (registry.getAllTypes().length === 0) {
      registerBuiltInNodes();
    }

    let results = registry.getAllNodes();

    // Filter by category
    if (category) {
      results = results.filter(node => node.category === category);
    }

    // Filter by tag
    if (tag) {
      results = results.filter(node => node.tags.includes(tag));
    }

    // Search by keyword
    if (q) {
      results = registry.search(q);
      
      // Apply category/tag filters if provided
      if (category) {
        results = results.filter(node => node.category === category);
      }
      if (tag) {
        results = results.filter(node => node.tags.includes(tag));
      }
    }

    return NextResponse.json({
      results,
      count: results.length,
      query: { q, category, tag },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching nodes:', error);
    return NextResponse.json(
      {
        error: 'Failed to search nodes',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

