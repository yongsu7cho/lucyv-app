import { NextRequest, NextResponse } from 'next/server';

const TOKEN = process.env.META_ACCESS_TOKEN!;
const ACCOUNTS: Record<string, string> = {
  innerpium: process.env.META_INNERPIUM_AD_ACCOUNT_ID!,
  aquarc: process.env.META_AQUARC_AD_ACCOUNT_ID!,
};

const PERIOD_PRESET: Record<string, string> = {
  today: 'today',
  yesterday: 'yesterday',
  '7d': 'last_7d',
  '30d': 'last_30d',
};

const CAMPAIGN_FIELDS = [
  'campaign_name', 'status', 'budget_remaining',
  'impressions', 'reach', 'clicks', 'ctr', 'cpm', 'frequency',
  'spend', 'actions', 'cost_per_action_type', 'objective',
].join(',');

const DAILY_FIELDS = 'date_start,impressions,clicks,spend';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCampaignInsights(accountId: string, datePreset: string): Promise<any[]> {
  const url = new URL(`https://graph.facebook.com/v20.0/${accountId}/insights`);
  url.searchParams.set('access_token', TOKEN);
  url.searchParams.set('fields', CAMPAIGN_FIELDS);
  url.searchParams.set('level', 'campaign');
  url.searchParams.set('date_preset', datePreset);
  url.searchParams.set('limit', '100');

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? `Meta API error ${res.status}`);
  }
  const data = await res.json();
  return data.data ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchDailyInsights(accountId: string, datePreset: string): Promise<any[]> {
  const url = new URL(`https://graph.facebook.com/v20.0/${accountId}/insights`);
  url.searchParams.set('access_token', TOKEN);
  url.searchParams.set('fields', DAILY_FIELDS);
  url.searchParams.set('level', 'account');
  url.searchParams.set('date_preset', datePreset);
  url.searchParams.set('time_increment', '1');
  url.searchParams.set('limit', '100');

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? `Meta API error ${res.status}`);
  }
  const data = await res.json();
  return data.data ?? [];
}

// Merge daily rows from two accounts by date
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeDailyRows(a: any[], b: any[]): any[] {
  const map = new Map<string, { impressions: number; clicks: number; spend: number }>();
  for (const row of [...a, ...b]) {
    const key = row.date_start as string;
    const existing = map.get(key) ?? { impressions: 0, clicks: 0, spend: 0 };
    map.set(key, {
      impressions: existing.impressions + Number(row.impressions ?? 0),
      clicks: existing.clicks + Number(row.clicks ?? 0),
      spend: existing.spend + Number(row.spend ?? 0),
    });
  }
  return Array.from(map.entries())
    .map(([date_start, v]) => ({ date_start, ...v }))
    .sort((a, b) => a.date_start.localeCompare(b.date_start));
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const brand = searchParams.get('brand') ?? 'all';
  const period = searchParams.get('period') ?? '7d';
  const datePreset = PERIOD_PRESET[period] ?? 'last_7d';

  if (!TOKEN) {
    return NextResponse.json({ error: 'META_ACCESS_TOKEN not configured' }, { status: 500 });
  }

  try {
    const accountIds: string[] =
      brand === 'all'
        ? Object.values(ACCOUNTS)
        : [ACCOUNTS[brand]].filter(Boolean);

    if (accountIds.length === 0) {
      return NextResponse.json({ error: 'Unknown brand' }, { status: 400 });
    }

    const [campaignResults, dailyResults] = await Promise.all([
      Promise.all(accountIds.map(id => fetchCampaignInsights(id, datePreset))),
      Promise.all(accountIds.map(id => fetchDailyInsights(id, datePreset))),
    ]);

    const campaigns = campaignResults.flat();
    const daily =
      dailyResults.length === 1
        ? (dailyResults[0] as object[]).map(r => r)
        : mergeDailyRows(dailyResults[0], dailyResults[1]);

    return NextResponse.json({ campaigns, daily });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
