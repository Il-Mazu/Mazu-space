import { useEffect, useState } from 'react';

// Canvas text doesn't wait for webfonts: drawing before they load silently
// falls back to the system monospace. Textures that draw text wait for this.
export const MONO = "'Departure Mono', ui-monospace, monospace";
export const DISPLAY = "'UnifrakturMaguntia', Georgia, serif";

let ready = false;
const fontsLoaded =
  typeof document === 'undefined' || !document.fonts
    ? Promise.resolve()
    : Promise.all([
        document.fonts.load(`16px ${MONO}`),
        document.fonts.load(`16px ${DISPLAY}`),
      ])
        .catch(() => {})
        .then(() => {
          ready = true;
        });

export function useFontsReady() {
  const [isReady, setReady] = useState(ready);
  useEffect(() => {
    if (ready) return undefined;
    let alive = true;
    fontsLoaded.then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  return isReady;
}
