import { NextResponse } from 'next/server';
import { INITIAL_WORKS } from '@/lib/supabase/mock-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    count: INITIAL_WORKS.length,
    works: INITIAL_WORKS
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}
