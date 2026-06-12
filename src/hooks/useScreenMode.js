import { useState, useEffect } from 'react';

export default function useScreenMode() {
  const [mode, setMode] = useState(() =>
    window.innerWidth >= 768 ? 'desktop' : 'mobile'
  );

  useEffect(() => {
    const check = () => {
      setMode(window.innerWidth >= 768 ? 'desktop' : 'mobile');
    };
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return mode;
}
