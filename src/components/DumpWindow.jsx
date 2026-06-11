import { useState, useEffect, useCallback } from 'react';
import Window from './Window';
import { images as imageList } from 'virtual:dump-images';

export default function DumpWindow({
  id, x, y, width, height,
  visible, focused, zIndex,
  onFocus, onClose, onMinimize, onMove, onResize,
}) {
  const [currentIndex, setCurrentIndex] = useState(null);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    if (imageList.length > 0) {
      setCurrentIndex(Math.floor(Math.random() * imageList.length));
    }
  }, []);

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

  if (currentIndex === null) return null;

  return (
    <Window
      id={id} title="dump/ — BIN"
      x={x} y={y} width={width} height={height}
      visible={visible} focused={focused} zIndex={zIndex}
      onFocus={onFocus} onClose={onClose} onMinimize={onMinimize}
      onMove={onMove} onResize={onResize}
    >
      {showGrid ? (
        <div className="dump-grid">
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
        <div className="dump-content">
          <img
            src={imageList[currentIndex]}
            alt={`dump ${currentIndex + 1}`}
            className="gallery-img"
            draggable={false}
          />
        </div>
      )}
      <div className="gallery-nav">
        <span className="gallery-btn" onClick={prev}>◀</span>
        <span className="gallery-counter">{currentIndex + 1}/{imageList.length}</span>
        <span className="gallery-btn" onClick={next}>▶</span>
        <span className="gallery-sep">|</span>
        <span className="gallery-btn" onClick={() => setShowGrid(p => !p)}>
          {showGrid ? 'View' : 'Grid'}
        </span>
      </div>
    </Window>
  );
}
