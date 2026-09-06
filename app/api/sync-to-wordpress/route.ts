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
    
    // Check if WordPress returned success
    if (result.success === false) {
      return NextResponse.json({
        success: false,
        message: result.message || 'WordPress वर डेटा सेव्ह करता आला नाही.',
        error: result
      }, { status: 400 });
    }

    const imported = result.imported || {};
    const total = result.total_imported ?? Object.values(imported).reduce((acc: number, val: any) => acc + (typeof val === 'number' ? val : 0), 0);

    let friendlyMessage = result.message;
    if (!friendlyMessage) {
      friendlyMessage = total > 0
        ? `✓ ${total} नोंदी rajkumarbadole.in वर थेट सिंक झाल्या!`
        : 'सिंक पूर्ण झाले.';
    }

    return NextResponse.json({
      success: true,
      message: friendlyMessage,
      imported,
      total_imported: total,
      wp_id: result.wp_id,
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
