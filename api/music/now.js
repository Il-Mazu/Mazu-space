import { json, lastfm, lastfmConfig, pickArt } from '../_lib/lastfm.js';

function toTrack(t) {
  return {
    title: t.name,
    artist: t.artist?.['#text'] || t.artist?.name || '',
    album: t.album?.['#text'] || '',
    art: pickArt(t.image),
    url: t.url,
    playedAt: t.date?.uts ? Number(t.date.uts) * 1000 : null,
  };
}

export async function GET() {
  const config = lastfmConfig();
  if (!config) return json({ error: 'not configured' }, 503, 'no-store');

  try {
    const data = await lastfm('user.getrecenttracks', { limit: '10' }, config);
    const list = [].concat(data.recenttracks?.track || []);
    const nowPlaying = list[0]?.['@attr']?.nowplaying === 'true';
    return json(
      {
        nowPlaying,
        recent: list.map(toTrack),
      },
      200,
      's-maxage=15, stale-while-revalidate=30',
    );
  } catch (err) {
    console.error(err);
    return json({ error: 'upstream' }, 502, 'no-store');
  }
}
