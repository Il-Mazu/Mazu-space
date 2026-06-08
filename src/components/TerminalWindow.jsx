import { useState, useRef, useEffect, useCallback } from 'react';

const termCmds = {
  help:    '// available: help, about, ls, date, clear, echo [text], glitch, sysinfo',
  about:   '// mazu-space — my little corner of the internet.',
  ls:      'about.txt\nblog.txt\nplayer.exe\ndump/\nlinks.ini',
  sysinfo: `// mazu-space OS v0.2.0\n// arch: x86\n// mem: 64MB\n// net: loopback\n// uptime: unknown`,
};

export default function TerminalWindow({ onGlitch }) {
  const [lines, setLines] = useState([
    { html: '<span class="c-dim">mazu-space OS [v0.2.0]</span>' },
    { html: '<span class="c-dim">© 2025 mazu</span>' },
    { html: '<br/>' },
    { html: '<span class="c-accent">C:\\&gt;</span> ping vibes' },
    { html: '<span class="c-dim">Pinging vibe.net...</span>' },
    { html: '<span class="c-green">Reply: TTL=∞  ms=0</span>' },
    { html: '<span class="c-green">Reply: TTL=∞  ms=0</span>' },
    { html: '<br/>' },
  ]);
  const [input, setInput] = useState('');
  const outputRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Enter') return;
    const cmd = input.trim().toLowerCase();
    setInput('');

    if (cmd === '') return;

    if (cmd === 'clear') {
      setLines([]);
      return;
    }

    const cmdBase = cmd.split(' ')[0];
    let response = '';

    if (cmdBase === 'echo') {
      response = cmd.slice(5);
    } else if (cmd === 'glitch') {
      response = '// glitching the matrix...';
      if (onGlitch) setTimeout(onGlitch, 50);
    } else if (termCmds[cmd]) {
      if (cmd === 'date') {
        response = '// ' + new Date().toLocaleDateString('en-GB');
      } else {
        response = termCmds[cmd];
      }
    } else {
      response = `<span class="c-red">// '${cmd}' not recognized. type 'help'</span>`;
    }

    setLines(prev => [
      ...prev,
      { html: `<span class="c-dim">──</span>` },
      { html: `<span class="c-accent">C:\\&gt;</span> ${cmd}` },
      { html: response.replace(/\n/g, '<br/>') + '<br/>' },
    ]);
  }, [input, onGlitch]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <>
      <div
        id="terminal-output"
        ref={outputRef}
        className="win-content"
        style={{ fontSize: 15, lineHeight: 1.8, height: 220, overflowY: 'auto', padding: '8px 12px' }}
      >
        {lines.map((line, i) => (
          <span key={i} dangerouslySetInnerHTML={{ __html: line.html }} />
        ))}
        <span className="c-accent">C:\&gt;</span> <span className="cursor"></span>
      </div>
      <div style={{ borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center' }}>
        <span className="c-accent" style={{ padding: '4px 8px', fontFamily: "'VT323',monospace", fontSize: 16, flexShrink: 0 }}>
          C:\&gt;
        </span>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: "'VT323',monospace",
            fontSize: 16, padding: '4px 4px 4px 0',
          }}
          placeholder="type here..."
        />
      </div>
    </>
  );
}
