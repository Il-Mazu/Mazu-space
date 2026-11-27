import { useSyncExternalStore } from 'react';

// Portrait tablets get the phone layout too: the desktop one puts the text
// beside the scene, and there is no room beside it in portrait.
const desktop = window.matchMedia('(min-width: 768px) and (min-aspect-ratio: 4/5)');
const subscribe = (cb) => {
  desktop.addEventListener('change', cb);
  return () => desktop.removeEventListener('change', cb);
};

export default function useScreenMode() {
  return useSyncExternalStore(subscribe, () => (desktop.matches ? 'desktop' : 'mobile'));
}
