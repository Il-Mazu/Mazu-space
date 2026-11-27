import { useCallback, useEffect, useState } from 'react';

export const NAME_MAX = 24;
export const MESSAGE_MAX = 140;

// Entries newest first, as the API returns them. `configured` is false when
// the server has no Redis or salt yet (503), and the form stays hidden.
export default function useGuestbook() {
  const [entries, setEntries] = useState([]);
  const [configured, setConfigured] = useState(null);
  const [justLit, setJustLit] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/guestbook')
      .then(async (res) => {
        if (!alive) return;
        const isJson = res.headers.get('content-type')?.includes('json');
        if (!res.ok || !isJson) {
          setConfigured(false);
          return;
        }
        setEntries((await res.json()).entries);
        setConfigured(true);
      })
      .catch(() => alive && setConfigured(false));
    return () => {
      alive = false;
    };
  }, []);

  const sign = useCallback(async ({ name, message, website }) => {
    let res;
    try {
      res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, message, website }),
      });
    } catch {
      return { error: 'the nave is unreachable, try again' };
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { error: body.error || 'something went wrong' };
    if (body.entry) {
      setEntries((list) => [body.entry, ...list].slice(0, 100));
      setJustLit(body.entry.id);
    }
    return { ok: true };
  }, []);

  return { entries, configured, justLit, sign };
}
