// Live provider: Discord's Spotify activity as relayed by Lanyard.
// Returns a playing track with start/end timestamps, or null.
export function liveFromLanyard(lanyard) {
  const s = lanyard?.listening_to_spotify ? lanyard.spotify : null;
  if (!s?.song) return null;
  return {
    source: 'lanyard',
    title: s.song,
    // Lanyard joins multiple artists with "; "
    artist: (s.artist || '').split('; ').join(', '),
    album: s.album || '',
    art: s.album_art_url || null,
    url: s.track_id ? `https://open.spotify.com/track/${s.track_id}` : null,
    startedAt: s.timestamps?.start ?? null,
    endsAt: s.timestamps?.end ?? null,
  };
}
