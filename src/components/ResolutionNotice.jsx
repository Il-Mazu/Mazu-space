import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mazu_res_notice_dismissed';

export default function ResolutionNotice() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch { return false; }
  });

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => {
      const el = document.getElementById('resolution-notice');
      if (el) el.classList.add('res-notice-visible');
    }, 2000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(STORAGE_KEY, 'true'); } catch {}
  };

  if (dismissed) return null;

  return (
    <div id="resolution-notice" className="res-notice">
      <span className="res-notice-text">
        This site is optimized for desktop viewing. For the best experience, open on a larger screen.
      </span>
      <button className="res-notice-close" onClick={dismiss}>×</button>
    </div>
  );
}
