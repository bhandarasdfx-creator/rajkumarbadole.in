import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let clientPayload: any = null;
    try {
      clientPayload = await req.json();
    } catch {
      clientPayload = null;
    }

    const wpBaseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://rajkumarbadole.in';
    const webhookUrl = `${wpBaseUrl.replace(/\/$/, '')}/wp-json/rb-newsroom/v1/sync`;

    // Call WordPress WebHook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RajkumarBadoleNewsroom/1.0 (Vercel)'
      },
      body: clientPayload ? JSON.stringify(clientPayload) : JSON.stringify({ trigger: 'newsroom_app' }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        message: `WordPress WebHook ने त्रुटी दिली (Status: ${response.status}). WordPress प्लगइन सक्रिय असल्याची खात्री करा.`,
        error: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      message: 'rajkumarbadole.in सह सिंक यशस्वी झाले!',
      imported: result.imported || {},
      wpResponse: result,
      synced_at: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `सिंक्रोनायझेशन अयशस्वी: ${error.message}`
    }, { status: 500 });
  }
}

export async function GET() {
  return POST(new Request('http://localhost', { method: 'POST' }));
}
