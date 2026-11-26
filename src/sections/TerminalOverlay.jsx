import { useCallback, useEffect, useRef, useState } from 'react';
import { TERMINAL_CONFIG } from '../data/content.js';
import { jumpToSection, triggerGlitch } from '../state/sceneBus.js';
import { playClickHit, playGlitchBurst, playHoverTick, playKeystroke } from '../audio/AudioEngine.js';
import './TerminalOverlay.css';

const MATRIX_CHARS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

const SESSION_START = Date.now();

function buildFastfetch() {
  const os = navigator.platform || 'unknown';
  const ua = navigator.userAgent || 'unknown';
  const lang = navigator.language || 'unknown';
  const cores = navigator.hardwareConcurrency || '?';
  const res = `${window.screen.width}×${window.screen.height}`;
  const uptime = `${Math.floor((Date.now() - SESSION_START) / 1000)}s`;
  return [
    ['OS', os],
    ['Host', 'mazu-nave'],
    ['Kernel', ua.slice(0, 40)],
    ['Uptime', uptime],
    ['Shell', `cmd.exe v${TERMINAL_CONFIG.version}`],
    ['Resolution', res],
    ['Terminal', 'mazu-term'],
    ['CPU', `${cores} threads`],
    ['Locale', lang],
  ]
    .map(([k, v]) => `// ${k.padEnd(12)}${v}`)
    .join('\n');
}

export default function TerminalOverlay({ open, isMobile = false, forceInline = false, onOpen, onClose }) {
  const [entries, setEntries] = useState(() => [
    { tone: 'dim', text: TERMINAL_CONFIG.banner[0] },
    { tone: 'dim', text: TERMINAL_CONFIG.banner[1] },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [matrixActive, setMatrixActive] = useState(false);

  const screenRef = useRef(null);
  const inputRef = useRef(null);
  const matrixCanvasRef = useRef(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
    setMatrixActive(false);
    return undefined;
  }, [open]);

  useEffect(() => {
    if (screenRef.current) {
      screenRef.current.scrollTop = screenRef.current.scrollHeight;
    }
  }, [entries, input, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (matrixActive) {
        e.preventDefault();
        e.stopPropagation();
        setMatrixActive(false);
        setTimeout(() => inputRef.current?.focus(), 20);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, matrixActive, onClose]);

  useEffect(() => {
    if (!matrixActive || !open) return undefined;
    const canvas = matrixCanvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return undefined;
    const ctx = canvas.getContext('2d');
    const FONT_SIZE = 14;
    const palette = [
      { r: 255, g: 255, b: 255 },
      { r: 220, g: 220, b: 220 },
      { r: 180, g: 180, b: 180 },
      { r: 255, g: 51, b: 82 },
      { r: 255, g: 100, b: 112 },
    ];
    let drops = [];

    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (!w || !h || (canvas.width === w && canvas.height === h)) return;
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = '#040406';
      ctx.fillRect(0, 0, w, h);
      const cols = Math.floor(w / FONT_SIZE);
      const old = drops;
      drops = Array.from({ length: cols }, (_, i) => old[i] || {
        y: Math.random() * h,
        speed: 0.9 + Math.random() * 2.5,
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    };
    resize();

    let raf = 0;
    const draw = () => {
      resize();
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = 'rgba(4, 4, 6, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.textBaseline = 'top';

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const x = i * FONT_SIZE;
        const y = Math.floor(d.y);
        const c = d.color;
        ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
        ctx.fillText(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)], x, y);
        d.y += d.speed;
        if (d.y > h && Math.random() > 0.975) {
          d.y = -FONT_SIZE * (1 + Math.random() * 16);
          d.speed = 0.6 + Math.random() * 2.4;
          d.color = palette[Math.floor(Math.random() * palette.length)];
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [matrixActive, open]);

  const execute = useCallback((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();

    if (lower === 'clear') {
      setEntries([]);
      return;
    }

    if (lower === 'exit' || lower === 'quit') {
      onClose();
      return;
    }

    if (lower === 'cmatrix') {
      setMatrixActive(true);
      setEntries((prev) => [
        ...prev,
        { tone: 'sep', text: '──' },
        { tone: 'cmd', text: `C:\\> ${trimmed}` },
        { tone: 'err', text: '// cmatrix: press any key or tap to exit' },
      ]);
      return;
    }

    let response = '';
    let tone = 'text';
    const cmdBase = lower.split(' ')[0];

    if (cmdBase === 'echo') {
      response = raw.slice(5);
    } else if (lower === 'glitch') {
      response = '// glitching the matrix...';
      triggerGlitch(1.0);
      playGlitchBurst();
    } else if (lower === 'fastfetch') {
      response = buildFastfetch();
    } else if (lower === 'date') {
      response = `// ${new Date().toLocaleDateString('en-GB')}`;
    } else if (lower === 'sysinfo') {
      const up = Math.floor((Date.now() - SESSION_START) / 1000);
      response = `${TERMINAL_CONFIG.commands.sysinfo}\n// uptime: ${up}s`;
    } else if (TERMINAL_CONFIG.commands[lower]) {
      response = TERMINAL_CONFIG.commands[lower];
    } else if (TERMINAL_CONFIG.sectionAliases[lower]) {
      const targetId = TERMINAL_CONFIG.sectionAliases[lower];
      response = `// opening ${trimmed}...`;
      setTimeout(() => {
        onClose();
        jumpToSection(targetId);
      }, 180);
    } else {
      tone = 'err';
      response = `// '${trimmed}' not recognized. type 'help'`;
    }

    setEntries((prev) => [
      ...prev,
      { tone: 'sep', text: '──' },
      { tone: 'cmd', text: `C:\\> ${trimmed}` },
      { tone, text: response },
    ]);
  }, [onClose]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (matrixActive) return;
    setHistory((prev) => [...prev, input]);
    setHistIdx(-1);
    execute(input);
    setInput('');
  };

  const onInputKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(nextIdx);
      setInput(history[nextIdx]);
      playKeystroke();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx === -1) return;
      const nextIdx = histIdx + 1;
      if (nextIdx >= history.length) {
        setHistIdx(-1);
        setInput('');
      } else {
        setHistIdx(nextIdx);
        setInput(history[nextIdx]);
      }
      playKeystroke();
    } else if (e.key === 'Enter' || e.key === 'Backspace') {
      playKeystroke();
    }
  };

  if (!open) {
    if (!isMobile && !forceInline) {
      return (
        <article className="sr-only" aria-labelledby="term-heading-sr">
          <h2 id="term-heading-sr">cmd.exe</h2>
          <p>Click the 3D CRT monitor or activate below to open the confessional terminal.</p>
          <button type="button" onClick={onOpen}>open terminal</button>
        </article>
      );
    }

    return (
      <article className="term-diegetic" aria-labelledby="term-heading">
        <div className="term-diegetic-wash" aria-hidden="true" />
        <h2 id="term-heading" className="chapel-title term-diegetic-title">cmd.exe</h2>
        <button
          type="button"
          className="ink-trigger"
          onMouseEnter={playHoverTick}
          onClick={() => {
            playClickHit();
            onOpen?.();
          }}
        >
          <span className="ink-cross" aria-hidden="true">♰</span>
          <span>touch the CRT glass</span>
        </button>
      </article>
    );
  }

  return (
    <div
      className="term-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Mazu confessional CRT terminal"
      onClick={onClose}
    >
      <div className="term-crt-shell" onClick={(e) => e.stopPropagation()}>
        <div className="term-crt-bar">
          <span className="term-crt-label">
            <span className="ink-cross" aria-hidden="true">♰</span>
            <span>cmd.exe · mazu-term v{TERMINAL_CONFIG.version}</span>
          </span>
          <button
            type="button"
            className="ink-trigger term-crt-close"
            onMouseEnter={playHoverTick}
            onClick={() => {
              playClickHit();
              onClose();
            }}
          >
            <span>leave [esc]</span>
          </button>
        </div>

        <div
          ref={screenRef}
          className="term-crt-screen"
          role="log"
          aria-label="Terminal output"
          onClick={() => inputRef.current?.focus()}
        >
          {entries.map((item, i) => (
            <div key={i} className={`term-line term-line-${item.tone}`}>
              {item.text}
            </div>
          ))}

          {matrixActive && (
            <canvas
              ref={matrixCanvasRef}
              className="term-matrix-canvas"
              onClick={() => setMatrixActive(false)}
              aria-label="Digital rain active; click or press any key to exit"
            />
          )}

          <form className="term-prompt-form" onSubmit={onSubmit}>
            <span className="term-prompt-prefix" aria-hidden="true">C:\&gt;</span>
            <input
              ref={inputRef}
              type="text"
              className="term-prompt-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                playKeystroke();
              }}
              onKeyDown={onInputKeyDown}
              aria-label="Terminal command input"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
