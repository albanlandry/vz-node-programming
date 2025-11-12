/**
 * API Route Handler for UI Definitions
 * 
 * Handles GET operations for specific UI definitions
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../../../../src/utils/Logger';

const STORAGE_KEY = 'vz-ui-builder-definitions';

/**
 * GET /api/ui-definitions/[id]
 * Get a specific UI definition by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'UI Definition ID is required' },
        { status: 400 },
      );
    }

    // Try to load from localStorage file (for server-side access)
    // UI definitions are stored in browser localStorage, but we can try to access
    // a server-side cache or file if available
    try {
      // Check if there's a server-side storage file
      const storagePath = join(process.cwd(), 'data', 'ui-definitions', `${id}.json`);
      if (existsSync(storagePath)) {
        const definition = JSON.parse(readFileSync(storagePath, 'utf-8'));
        return NextResponse.json({
          definition,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (fileError) {
      logger.debug('UI definition file not found, will need client-side access');
    }

    // If not found in file, return error (client should use store directly)
    return NextResponse.json(
      { error: 'UI definition not found. UI definitions are stored client-side.' },
      { status: 404 },
    );
  } catch (error) {
    logger.error('Error fetching UI definition:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch UI definition',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

