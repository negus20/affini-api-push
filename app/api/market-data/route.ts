// app/api/market-data/route.ts
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const runtime = 'edge'; // or 'nodejs', either is fine

const SNAPSHOT_KEY = 'affini:market_latest';

export async function GET() {
  try {
    const snapshot = await kv.get(SNAPSHOT_KEY);

    if (!snapshot) {
      return NextResponse.json(
        {
          status: 'no_data_yet',
          message:
            'No market snapshot has been posted to this runtime instance since the last deploy.',
        },
        { status: 404 },
      );
    }

    // kv.get auto-deserializes JSON objects
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error('Error reading from KV', err);
    return NextResponse.json(
      { status: 'error', message: 'Failed to read market snapshot from storage.' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Very light validation: must at least have vehicles array
    if (!body || typeof body !== 'object' || !Array.isArray((body as any).vehicles)) {
      return NextResponse.json(
        { status: 'bad_request', message: 'Invalid snapshot payload.' },
        { status: 400 },
      );
    }

    const snapshot = {
      ...body,
      stored_at: new Date().toISOString(),
    };

    // Store / overwrite the latest snapshot in KV
    await kv.set(SNAPSHOT_KEY, snapshot);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error writing to KV', err);
    return NextResponse.json(
      { status: 'error', message: 'Failed to store market snapshot.' },
      { status: 500 },
    );
  }
}
