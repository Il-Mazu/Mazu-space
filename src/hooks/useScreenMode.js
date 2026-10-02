import { useSyncExternalStore } from 'react';

const desktop = window.matchMedia('(min-width: 768px)');
const subscribe = (cb) => {
  desktop.addEventListener('change', cb);
  return () => desktop.removeEventListener('change', cb);
};

export default function useScreenMode() {
  return useSyncExternalStore(subscribe, () => (desktop.matches ? 'desktop' : 'mobile'));
}
