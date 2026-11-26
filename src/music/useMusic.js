import { useEffect, useMemo, useState } from 'react';
import { liveFromLanyard } from './providers/lanyard.js';
import { lastfmHistory } from './providers/lastfm.js';

const NOW_POLL_MS = 15_000;

export function spotifySearchUrl(track) {
  return `https://open.spotify.com/search/${encodeURIComponent(`${track.artist} ${track.title}`)}`;
}

export function trackUrl(track) {
  return track.source === 'lanyard' && track.url ? track.url : spotifySearchUrl(track);
}

const sameTrack = (a, b) =>
  a && b && a.title.toLowerCase() === b.title.toLowerCase() && a.artist.toLowerCase().startsWith(b.artist.toLowerCase().split(',')[0]);

// One merged view of what I'm listening to: Lanyard for live playback with
// progress, the history provider for "now playing" without progress, the last
// heard track and the top charts.
export default function useMusic(lanyard, history = lastfmHistory) {
  const [recent, setRecent] = useState(null);
  const [period, setPeriod] = useState('7day');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      if (document.hidden) return;
      history.now().then((d) => alive && setRecent(d)).catch(() => {});
    };
    load();
    const id = setInterval(load, NOW_POLL_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', load);
    };
  }, [history]);

  useEffect(() => {
    let alive = true;
    history.stats(period).then((d) => alive && setStats(d)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [history, period]);

  return useMemo(() => {
    const live = liveFromLanyard(lanyard);
    const latest = recent?.recent?.[0] || null;
    let now = live;
    if (!now && recent?.nowPlaying && latest) now = latest;
    if (now && !now.art && sameTrack(latest, now) && latest.art) now = { ...now, art: latest.art };

    const lastHeard = now ? null : recent?.recent?.find((t) => t.playedAt) || null;

    return {
      now,
      listening: Boolean(now),
      lastHeard,
      stats,
      period,
      setPeriod,
      hasHistory: Boolean(recent || stats),
    };
  }, [lanyard, recent, stats, period]);
}
