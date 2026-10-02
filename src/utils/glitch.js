const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const TEAR = [
  { clipPath: 'inset(0 0 0 0)' },
  { clipPath: 'inset(25% 0 55% 0)', offset: 0.1 },
  { clipPath: 'inset(45% 0 30% 0)', offset: 0.2 },
  { clipPath: 'inset(15% 0 70% 0)', offset: 0.3 },
  { clipPath: 'inset(0 0 0 0)', offset: 0.4 },
  { clipPath: 'inset(0 0 0 0)' },
];

const SHAKE = [
  { transform: 'translate(0)' },
  { transform: 'translate(-2px, 1px)' },
  { transform: 'translate(2px, -1px)' },
  { transform: 'translate(-1px, 2px)' },
  { transform: 'translate(1px, -2px)' },
  { transform: 'translate(0)' },
];

export function tear() {
  if (reducedMotion.matches) return;
  document.querySelector('.window.focused')?.animate(TEAR, { duration: 150, easing: 'ease-out' });
}

export function shake(delay = 0) {
  if (reducedMotion.matches) return;
  document.getElementById('desktop')?.animate(SHAKE, { duration: 150, delay, easing: 'ease-out' });
}

export function glitch() {
  tear();
  shake(100);
}
