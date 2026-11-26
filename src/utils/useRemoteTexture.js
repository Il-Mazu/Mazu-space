import { useEffect, useState } from 'react';
import * as THREE from 'three';

// Loads a cross-origin image as a texture; null until loaded or when url is falsy.
export default function useRemoteTexture(url) {
  const [tex, setTex] = useState(null);

  useEffect(() => {
    if (!url) {
      setTex(null);
      return undefined;
    }
    let cancelled = false;
    let loaded = null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        if (cancelled) {
          t.dispose();
          return;
        }
        loaded = t;
        setTex(t);
      },
      undefined,
      () => !cancelled && setTex(null),
    );
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [url]);

  return tex;
}
