import { NextRequest } from 'next/server';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Set up SSE headers
  const response = new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });

  // Send initial connection message
  writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

  // Set up interval to send updates (in production, this would be triggered by new data)
  const interval = setInterval(() => {
    writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'heartbeat', 
      timestamp: new Date().toISOString() 
    })}\n\n`));
  }, 30000);

  // Clean up on connection close
  request.signal.addEventListener('abort', () => {
    clearInterval(interval);
    writer.close();
  });

  return response;
}