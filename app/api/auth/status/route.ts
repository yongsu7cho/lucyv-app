import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const accessToken = request.cookies.get('gcal_access_token')?.value;
  const refreshToken = request.cookies.get('gcal_refresh_token')?.value;
  const email = request.cookies.get('gcal_email')?.value;

  return NextResponse.json({
    connected: !!(accessToken || refreshToken),
    email: email ?? null,
    hasRefreshToken: !!refreshToken,
  });
}
