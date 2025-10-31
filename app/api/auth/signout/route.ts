import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Clear session cookies
  const response = NextResponse.json({ success: true });

  response.cookies.delete('wos-session');
  response.cookies.delete('wos-refresh-token');

  return response;
}

