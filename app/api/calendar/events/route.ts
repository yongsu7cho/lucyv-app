import { NextRequest, NextResponse } from 'next/server';

const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';

async function fetchCalendars(accessToken: string) {
  const res = await fetch(`${CALENDAR_BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res;
}

async function fetchEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });
  return fetch(
    `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  return data.access_token ?? null;
}

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get('gcal_access_token')?.value;
  const refreshToken = request.cookies.get('gcal_refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeMin =
    searchParams.get('timeMin') ??
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const timeMax =
    searchParams.get('timeMax') ??
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Helper: try fetching events, return null on 401 (for token refresh), throw on other errors
  const tryFetch = async (
    token: string
  ): Promise<{ items: unknown[] } | null> => {
    const calRes = await fetchCalendars(token);
    if (calRes.status === 401) return null;

    const calData = await calRes.json();

    // Calendar API disabled or other API-level error
    if (!calRes.ok) {
      const msg = calData?.error?.message ?? `Calendar API error ${calRes.status}`;
      throw new Error(msg);
    }

    const calendars: { id: string; summary: string; backgroundColor?: string; primary?: boolean }[] =
      calData.items ?? [];

    if (calendars.length === 0) {
      return { items: [] };
    }

    // Fetch events from all calendars
    const allItems: unknown[] = [];
    for (const cal of calendars) {
      const evRes = await fetchEvents(token, cal.id, timeMin, timeMax);
      if (evRes.status === 401) return null;
      if (!evRes.ok) continue;
      const evData = await evRes.json();
      const items = (evData.items ?? []).map((ev: Record<string, unknown>) => ({
        ...ev,
        calendarId: cal.id,
        calendarColor: cal.backgroundColor,
        calendarSummary: cal.summary,
        isPrimary: cal.primary ?? false,
      }));
      allItems.push(...items);
    }

    return { items: allItems };
  };

  // First attempt
  let result: { items: unknown[] } | null = null;
  let newAccessToken: string | null = null;

  try {
    result = accessToken ? await tryFetch(accessToken) : null;

    // Token expired (401) — try refreshing
    if (!result && refreshToken) {
      newAccessToken = await refreshAccessToken(refreshToken);
      if (newAccessToken) {
        result = await tryFetch(newAccessToken);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: 'calendar_api_error', message }, { status: 502 });
  }

  if (!result) {
    return NextResponse.json({ error: 'token_expired' }, { status: 401 });
  }

  const response = NextResponse.json(result);

  // Persist refreshed access token
  if (newAccessToken) {
    response.cookies.set('gcal_access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/',
    });
  }

  return response;
}
