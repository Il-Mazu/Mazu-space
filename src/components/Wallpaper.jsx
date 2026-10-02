import './Wallpaper.css';

export const WALLPAPERS = [
  { id: 'eye', label: 'eye' },
  { id: 'eye-still', label: 'eye (still)' },
  { id: 'grid', label: 'grid' },
  { id: 'void', label: 'void' },
];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export default function Wallpaper({ id }) {
  const still = id === 'eye-still' || (id === 'eye' && reducedMotion.matches);
  return (
    <div className={'wallpaper wallpaper-' + id} aria-hidden="true">
      {still
        ? <img src="/wallpapers/eye.webp" alt="" draggable={false} />
        : id === 'eye' && <video src="/wallpapers/eye.mp4" poster="/wallpapers/eye.webp" autoPlay muted loop playsInline />}
    </div>
  );
}
