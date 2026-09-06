import { NextResponse } from 'next/server';
import { INITIAL_NEWS } from '@/lib/supabase/mock-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    count: INITIAL_NEWS.length,
    news: INITIAL_NEWS
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}
