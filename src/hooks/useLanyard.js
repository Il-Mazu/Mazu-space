import { useState, useEffect } from 'react';

const USER_ID = '864941785666813992';

export default function useLanyard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://api.lanyard.rest/v1/users/${USER_ID}`
        );
        const json = await res.json();
        if (!cancelled) setData(json.data);
      } catch {
        if (!cancelled) setData(null);
      }
    };

    // Poll only while the tab is visible; refresh as soon as it comes back.
    const tick = () => { if (!document.hidden) fetchData(); };
    fetchData();
    const interval = setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  return data;
}
