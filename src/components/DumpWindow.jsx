import { useState, useEffect, useCallback, useRef } from 'react';
import Window from './Window';
import { images as imageList } from 'virtual:dump-images';

export function DumpContent({ focused, mobile, onFullScreenChange, onRegisterBack }) {
  const [currentIndex, setCurrentIndex] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showNav, setShowNav] = useState(true);
  const navTimer = useRef(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (imageList.length > 0) {
      setCurrentIndex(Math.floor(Math.random() * imageList.length));
    }
  }, []);

  // Notify parent of full-screen state
  useEffect(() => {
    onFullScreenChange?.(mobile && !showGrid);
  }, [mobile, showGrid, onFullScreenChange]);

  // Register system back handler when in image view
  useEffect(() => {
    if (!showGrid) {
      onRegisterBack?.(() => setShowGrid(true));
    } else {
      onRegisterBack?.(null);
    }
    return () => onRegisterBack?.(null);
  }, [showGrid, onRegisterBack]);

  // Desktop keyboard nav
  useEffect(() => {
    if (!focused || showGrid) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex(p => (p - 1 + imageList.length) % imageList.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex(p => (p + 1) % imageList.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [focused, showGrid, imageList.length]);

  // Auto-hide nav on mobile after 3s
  useEffect(() => {
    if (!mobile || showGrid) return;
    setShowNav(true);
    clearTimeout(navTimer.current);
    navTimer.current = setTimeout(() => setShowNav(false), 3000);
    return () => clearTimeout(navTimer.current);
  }, [mobile, showGrid, currentIndex]);

  const prev = useCallback(() => {
    setCurrentIndex(p => (p - 1 + imageList.length) % imageList.length);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex(p => (p + 1) % imageList.length);
  }, []);

  const goTo = useCallback((index) => {
    setCurrentIndex(index);
    setShowGrid(false);
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid(p => !p);
  }, []);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) prev();
    else if (dx < -50) next();
  }, [prev, next]);

  const handleImageTap = useCallback(() => {
    if (mobile) setShowNav(p => !p);
  }, [mobile]);

  if (currentIndex === null) return null;

  const gridClass = 'dump-grid' + (mobile ? ' dump-grid-mobile' : '');

  return (
    <>
      {showGrid ? (
        <div className={gridClass}>
          {imageList.map((src, i) => (
            <div
              key={i}
              className="dump-grid-item"
              onClick={() => goTo(i)}
            >
              <img src={src} alt={`dump ${i + 1}`} draggable={false} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={mobile ? 'dump-fullscreen' : 'dump-content'}
          onTouchStart={mobile ? handleTouchStart : undefined}
          onTouchEnd={mobile ? handleTouchEnd : undefined}
          onClick={handleImageTap}
        >
          <img
            src={imageList[currentIndex]}
            alt={`dump ${currentIndex + 1}`}
            className="gallery-img"
            draggable={false}
          />
        </div>
      )}
      <div
        className={'gallery-nav' + (mobile && !showGrid && !showNav ? ' gallery-nav-hidden' : '')}
        onClick={e => e.stopPropagation()}
      >
        <span className="gallery-btn" onClick={prev}>◀</span>
        <span className="gallery-counter">{currentIndex + 1}/{imageList.length}</span>
        <span className="gallery-btn" onClick={next}>▶</span>
        <span className="gallery-sep">|</span>
        <span className="gallery-btn" onClick={toggleGrid}>
          {showGrid ? 'View' : 'Grid'}
        </span>
      </div>
    </>
  );
}

export default function DumpWindow({
  id, x, y, width, height,
  visible, focused, zIndex,
  onFocus, onClose, onMinimize, onMove, onResize,
}) {
  return (
    <Window
      id={id} title="dump/ — BIN"
      x={x} y={y} width={width} height={height}
      visible={visible} focused={focused} zIndex={zIndex}
      onFocus={onFocus} onClose={onClose} onMinimize={onMinimize}
      onMove={onMove} onResize={onResize}
    >
      <DumpContent focused={focused} />
    </Window>
  );
}
