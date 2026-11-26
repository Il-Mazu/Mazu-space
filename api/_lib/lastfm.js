// Server-only Last.fm client. The API key never reaches the browser.
const API = 'https://ws.audioscrobbler.com/2.0/';

// Last.fm serves this grey star for tracks it has no art for.
const PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f';

export const PERIODS = ['7day', '1month', 'overall'];

export function lastfmConfig() {
  const key = process.env.LASTFM_API_KEY;
  const user = process.env.LASTFM_USER;
  return key && user ? { key, user } : null;
}

export async function lastfm(method, params, { key, user }) {
  const qs = new URLSearchParams({ method, user, api_key: key, format: 'json', ...params });
  const res = await fetch(`${API}?${qs}`, { signal: AbortSignal.timeout(8000) });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`last.fm ${method}: ${json.message || res.status}`);
  return json;
}

export function pickArt(images) {
  const list = Array.isArray(images) ? images : [];
  const best = list.find((i) => i.size === 'extralarge') || list[list.length - 1];
  const url = best?.['#text'] || '';
  return url && !url.includes(PLACEHOLDER_HASH) ? url : null;
}

export function json(body, status, cache) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });
}
