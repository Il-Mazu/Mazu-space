import { useMemo } from 'react';

const dumpModules = import.meta.glob('/assets/Dump/*.jpeg', { eager: true, query: '?url' });
const dumpCount = Object.keys(dumpModules).length;

function formatRemote(url) {
  if (!url) return 'github.com';
  let clean = url.replace(/^git@/, '').replace(/^https?:\/\//, '');
  clean = clean.replace(/\.git$/, '').replace(':', '/');
  return clean;
}

export default function HomeWindow({ commits, remote, buildDate, blogCount, tracksCount }) {
  const repoUrl = useMemo(() => formatRemote(remote), [remote]);

  return (
    <>
      <pre className="ascii-art" style={{ textAlign: 'center', marginBottom: 20 }}>
{`╭────── · · ♰ · · ──────╮
│  C:\\mazu-space> home   │
╰────── · · ♰ · · ──────╯`}
      </pre>

      <div className="home-dashboard">
        <div className="home-panel">
          <div className="home-panel-title c-dim">── content ──</div>
          <div className="home-stat"><span className="c-red">♰</span> blog:  <span className="c-accent2">{blogCount}</span></div>
          <div className="home-stat"><span className="c-red">♰</span> music: <span className="c-accent2">{tracksCount}</span></div>
          <div className="home-stat"><span className="c-red">♰</span> dump:  <span className="c-accent2">{dumpCount}</span></div>
        </div>

        <div className="home-panel">
          <div className="home-panel-title c-dim">── commits ──</div>
          {commits.length === 0 ? (
            <div className="home-stat c-dim">no commits</div>
          ) : (
            commits.map((c, i) => (
              <div key={i} className="home-stat home-commit" title={c.message}>
                <span className="c-accent2">{c.hash}</span>
                <span className="c-dim"> {c.message}</span>
              </div>
            ))
          )}
          <div className="home-stat" style={{ marginTop: 10 }}>
            <span className="c-dim">build:</span> <span className="c-accent2">{buildDate || '--'}</span>
          </div>
        </div>

        <div className="home-panel">
          <div className="home-panel-title c-dim">── links ──</div>
          <a href={`https://${repoUrl}`} target="_blank" rel="noopener noreferrer" className="link-item" style={{ color: 'inherit', textDecoration: 'none' }}>
            <span className="c-red">&gt;</span>
            <span>github</span>
          </a>
          <a href="https://www.instagram.com/ilmazu_?igsh=djYzMG9paXM5MTk0" target="_blank" rel="noopener noreferrer" className="link-item" style={{ color: 'inherit', textDecoration: 'none' }}>
            <span className="c-red">&gt;</span>
            <span>instagram</span>
          </a>
          <a href="https://open.spotify.com/user/tudoxdeeiu9fvtotla7tl1scj?si=badddd480e8c479c" target="_blank" rel="noopener noreferrer" className="link-item" style={{ color: 'inherit', textDecoration: 'none' }}>
            <span className="c-red">&gt;</span>
            <span>spotify</span>
          </a>
        </div>
      </div>

      <span className="cursor" />
    </>
  );
}
