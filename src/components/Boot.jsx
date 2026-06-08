import { useEffect, useState, useRef } from 'react';

const bootMsgs = [
  { text: '[ BIOS ] BOIA-BIOS v1.0a',         delay: 350 },
  { text: '[ BIOS ] POST: OK',                     delay: 200 },
  { text: '[ BIOS ] Si va: a letto',               delay: 300 },
  { text: '[ BIOS ] loading kernel...',            delay: 350 },
  { text: '[ SYS  ] mazu/OS v0.2.0',                delay: 200 },
  { text: '[ SYS  ] Per: forza',                   delay: 200 },
  { text: '[ NET  ] interface: loopback only',     delay: 300 },
  { text: '[ SYS  ] entering desktop...',          delay: 600 },
];

const ascii = `   /'\\_/\\\`                                                                              
  /\\      \\     __     ____    __  __             ____  _____      __      ___     __   
 \\ \\ \\__\\ \\  /'__\`\\  /\\_ ,\`\\ /\\ \\/\\ \\  _______  /',__\\/\\ '__\`\\  /'__\`\\   /'___\\ /'__\`\\ 
  \\ \\ \\_/\\ \\/\\ \\L\\.\\_\\/_/  /_\\ \\ \\_\\ \\/\\______\\/\\__, \`\\ \\ \\L\\ \\/\\ \\L\\.\\_/\\ \\__//\\  __/ 
   \\ \\_\\\\ \\_\\/\\__/.\\_\\ /\\____\\\\ \\____\\/\\______\\/\\____/\\ \\ ,__/\\ \\__/.\\_\\/\\____\\ \\____\\
    \\/_/ \\/_/\\/__/\\/_/ \\/____/ \\/___/           \\/___/  \\ \\ \\/  \\/__/\\/_/\\/____/\\/____/
                                                           \\ \\_\\                         
                                                            \\/_/                         `;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export default function Boot({ onComplete }) {
  const [statusLines, setStatusLines] = useState([]);
  const [showCursor, setShowCursor] = useState(true);
  const [hidden, setHidden] = useState(false);
  const doneRef = useRef(false);
  const lineCounter = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatusLines([]);
      lineCounter.current = 0;

      // Phase 1 — power-on
      await sleep(700);

      // Phase 2 — memory test
      setShowCursor(false);
      for (let mem = 0; mem <= 65536; mem += 1024) {
        if (cancelled) return;
        const lineIdx = lineCounter.current;
        setStatusLines(prev => {
          const next = [...prev];
          next[lineIdx] = { text: `[ BIOS ] memory: ${String(mem).padStart(5, '0')}KB`, done: true };
          return next;
        });
        await sleep(4);
      }
      {
        const lineIdx = lineCounter.current;
        setStatusLines(prev => {
          const next = [...prev];
          next[lineIdx] = { text: '[ BIOS ] memory: 65536KB OK', done: true };
          return next;
        });
      }
      await sleep(350);
      setShowCursor(true);

      // Phase 3 — typewriter messages
      for (const msg of bootMsgs) {
        if (cancelled) return;
        lineCounter.current++;
        const lineIdx = lineCounter.current;
        let typed = '';
        for (let c = 0; c < msg.text.length; c++) {
          if (cancelled) return;
          typed += msg.text[c];
          setStatusLines(prev => {
            const next = [...prev];
            next[lineIdx] = { text: typed, done: false };
            return next;
          });
          await sleep(10 + Math.random() * 8);
        }
        setStatusLines(prev => {
          const next = [...prev];
          next[lineIdx] = { text: msg.text, done: true };
          return next;
        });
        await sleep(msg.delay);
      }

      // Phase 4 — loading bar
      setShowCursor(false);
      lineCounter.current++;
      const loadIdx = lineCounter.current;
      for (let pct = 0; pct <= 100; pct += 2) {
        if (cancelled) return;
        const blocks = Math.floor(pct / 5);
        const bar = '#'.repeat(blocks) + '.'.repeat(20 - blocks);
        setStatusLines(prev => {
          const next = [...prev];
          next[loadIdx] = { text: `[ SYS  ] [${bar}] ${String(pct).padStart(3)}%`, done: true };
          return next;
        });
        await sleep(25);
      }
      setStatusLines(prev => {
        const next = [...prev];
        next[loadIdx] = { text: '[ SYS  ] [####################] 100%', done: true };
        return next;
      });
      await sleep(600);

      // Phase 5 — fade out
      await sleep(200);
      if (!cancelled) {
        setHidden(true);
        await sleep(600);
        if (onComplete && !doneRef.current) {
          doneRef.current = true;
          onComplete();
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div id="boot" className={hidden ? 'hidden' : ''}>
      <div id="boot-terminal">
        <pre className="ascii-art">{ascii}</pre>
        <div className="boot-status">
          {statusLines.map((line, i) => (
            <div key={i}>{line.text}</div>
          ))}
        </div>
        {showCursor && <span className="boot-cursor">_</span>}
      </div>
    </div>
  );
}
