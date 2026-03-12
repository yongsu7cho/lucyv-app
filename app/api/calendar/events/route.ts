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
  try {
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
  } catch {
    return null;
  }
}

// Returns items on success, null on 401 (retry with refresh), [] on any other error
async function tryFetch(
  token: string,
  timeMin: string,
  timeMax: string
): Promise<{ items: unknown[]; debug: { calendarCount: number; calendarIds: string[]; totalEvents: number } } | null> {
  let calRes: Response;
  try {
    calRes = await fetchCalendars(token);
  } catch {
    return { items: [], debug: { calendarCount: 0, calendarIds: [], totalEvents: 0 } };
  }

  if (calRes.status === 401) return null;

  if (!calRes.ok) {
    // scope error, API disabled, quota exceeded, etc. → return empty instead of 502
    return { items: [], debug: { calendarCount: 0, calendarIds: [], totalEvents: 0 } };
  }

  let calData: { items?: { id: string; summary: string; backgroundColor?: string; primary?: boolean }[] };
  try {
    calData = await calRes.json();
  } catch {
    return { items: [], debug: { calendarCount: 0, calendarIds: [], totalEvents: 0 } };
  }

  const calendars = calData.items ?? [];
  if (calendars.length === 0) return { items: [], debug: { calendarCount: 0, calendarIds: [], totalEvents: 0 } };

  const allItems: unknown[] = [];
  for (const cal of calendars) {
    try {
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
    } catch {
      // skip this calendar on network error, continue with others
      continue;
    }
  }

  return {
    items: allItems,
    debug: {
      calendarCount: calendars.length,
      calendarIds: calendars.map(c => c.id),
      totalEvents: allItems.length,
    },
  };
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

  let result: { items: unknown[] } | null = null;
  let newAccessToken: string | null = null;

  // First attempt
  if (accessToken) {
    result = await tryFetch(accessToken, timeMin, timeMax);
  }

  // Token expired (401) — try refreshing
  if (!result && refreshToken) {
    newAccessToken = await refreshAccessToken(refreshToken);
    if (newAccessToken) {
      result = await tryFetch(newAccessToken, timeMin, timeMax);
    }
  }

  // If still null (refresh failed or no tokens), return empty
  if (!result) {
    return NextResponse.json({ error: 'token_expired', items: [] }, { status: 401 });
  }

  const response = NextResponse.json({ items: result.items, debug: result.debug });

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
