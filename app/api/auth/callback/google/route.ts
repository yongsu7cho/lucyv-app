import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  // NEXT_PUBLIC_GOOGLE_CLIENT_ID is the same value, accessible both client & server
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/?error=missing_credentials`);
  }

  const redirectUri = `${origin}/api/auth/callback/google`;

  // Exchange authorization code for tokens
  let tokens: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    tokens = await tokenRes.json();
  } catch {
    return NextResponse.redirect(`${origin}/?error=token_exchange_failed`);
  }

  if (!tokens.access_token) {
    return NextResponse.redirect(`${origin}/?error=no_access_token`);
  }

  // Fetch user email
  let email = '';
  try {
    const profileRes = await fetch(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const profile = await profileRes.json();
    email = profile.email || '';
  } catch {
    // email is optional, continue without it
  }

  // Redirect to app with success param
  const response = NextResponse.redirect(`${origin}/?gcal=connected`);

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOpts = { httpOnly: true, secure: isProduction, path: '/' };

  response.cookies.set('gcal_access_token', tokens.access_token, {
    ...cookieOpts,
    maxAge: tokens.expires_in ?? 3600,
  });

  if (tokens.refresh_token) {
    response.cookies.set('gcal_refresh_token', tokens.refresh_token, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  if (email) {
    // Not httpOnly so the client can read it
    response.cookies.set('gcal_email', email, {
      secure: isProduction,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
