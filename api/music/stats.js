import { PERIODS, json, lastfm, lastfmConfig } from '../_lib/lastfm.js';

export async function GET(request) {
  const config = lastfmConfig();
  if (!config) return json({ error: 'not configured' }, 503, 'no-store');

  const requested = new URL(request.url).searchParams.get('period');
  const period = PERIODS.includes(requested) ? requested : '7day';

  try {
    const [tracks, artists, info] = await Promise.all([
      lastfm('user.gettoptracks', { period, limit: '8' }, config),
      lastfm('user.gettopartists', { period, limit: '5' }, config),
      lastfm('user.getinfo', {}, config),
    ]);
    return json(
      {
        period,
        scrobbles: Number(info.user?.playcount || 0),
        topTracks: [].concat(tracks.toptracks?.track || []).map((t) => ({
          title: t.name,
          artist: t.artist?.name || '',
          plays: Number(t.playcount || 0),
          url: t.url,
        })),
        topArtists: [].concat(artists.topartists?.artist || []).map((a) => ({
          name: a.name,
          plays: Number(a.playcount || 0),
          url: a.url,
        })),
      },
      200,
      's-maxage=3600, stale-while-revalidate=600',
    );
  } catch (err) {
    console.error(err);
    return json({ error: 'upstream' }, 502, 'no-store');
  }
}
