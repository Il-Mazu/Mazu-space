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

    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return data;
}
