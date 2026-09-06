import { NextResponse } from 'next/server';
import {
  INITIAL_NEWS,
  INITIAL_WORKS,
  INITIAL_INITIATIVES,
  INITIAL_EVENTS,
  INITIAL_VIDEOS,
  INITIAL_GALLERY
} from '@/lib/supabase/mock-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    site: 'rajkumarbadole.in',
    title: 'राजकुमार बडोले - अधिकृत डेटा फीड',
    generated_at: new Date().toISOString(),
    data: {
      latest_news: INITIAL_NEWS.filter(n => n.status === 'published'),
      development_works: INITIAL_WORKS,
      initiatives: INITIAL_INITIATIVES,
      events: INITIAL_EVENTS,
      videos: INITIAL_VIDEOS,
      gallery: INITIAL_GALLERY
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}
