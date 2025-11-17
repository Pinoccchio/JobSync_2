import { NextRequest, NextResponse } from 'next/server';
import { formatLogBatch } from '@/lib/logger/server';
import type { LogMessage } from '@/lib/logger/types';

/**
 * POST /api/log
 * Receives batched logs from client and prints to terminal
 */
export async function POST(request: NextRequest) {
  try {
    const { logs } = await request.json() as { logs: LogMessage[] };

    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json(
        { error: 'Invalid logs format' },
        { status: 400 }
      );
    }

    // Format and print logs to terminal
    formatLogBatch(logs);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing logs:', error);
    return NextResponse.json(
      { error: 'Failed to process logs' },
      { status: 500 }
    );
  }
}
