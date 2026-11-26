// History provider: scrobbles through our own /api/music routes.
// A 503 means the server has no Last.fm credentials; callers treat that as "no history".
async function get(path) {
  const res = await fetch(path);
  if (res.status === 503) return null;
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

export const lastfmHistory = {
  async now() {
    const data = await get('/api/music/now');
    if (!data) return null;
    return {
      nowPlaying: data.nowPlaying,
      recent: data.recent.map((t) => ({ ...t, source: 'lastfm' })),
    };
  },
  stats(period) {
    return get(`/api/music/stats?period=${encodeURIComponent(period)}`);
  },
};
