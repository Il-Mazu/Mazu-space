import { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { ABOUT, SITE } from '../data/content.js';
import { GAMES } from '../data/games.js';
import { images } from 'virtual:dump-images';
import { naveFloorY } from '../scenes/GothicNave.jsx';
import { jumpToSection, sceneBus, subscribeSection } from '../state/sceneBus.js';
import { playClickHit, playHoverTick } from '../audio/AudioEngine.js';
import './DiegeticStageUI.css';

const GAMES_TOTAL = GAMES.length;
const FAVORITES_COUNT = GAMES.filter((g) => g.category === 'favorites').length;
const PLAYING_COUNT = GAMES.filter((g) => g.category === 'playing').length;

export default function DiegeticStageUI({
  isMobile,
  entered,
  cryptOpen,
  terminalOpen,
  lightboxOpen,
  portalRef,
  onOpenLightbox,
  onOpenCrypt,
  onOpenTerminal,
}) {
  const [activeSec, setActiveSec] = useState(sceneBus.activeSection);

  useEffect(() => subscribeSection(setActiveSec), []);

  if (!entered || isMobile) return null;

  const overlayBusy = cryptOpen || terminalOpen || lightboxOpen;

  const showHero = activeSec <= 1;
  const heroActive = activeSec === 0 && !overlayBusy;

  const showAbout = activeSec <= 2;
  const aboutActive = activeSec === 1 && !overlayBusy;

  const showDump = activeSec >= 3 && activeSec <= 5;
  const dumpActive = activeSec === 4 && !overlayBusy;

  const showGames = activeSec >= 4 && activeSec <= 6;
  const gamesActive = activeSec === 5 && !overlayBusy;

  const showTerm = activeSec >= 5;
  const termActive = activeSec === 6 && !overlayBusy;

  const gamesY = naveFloorY(-108) + 2.2;

  return (
    <>
      {showHero && (
        <Html
          portal={portalRef}
          transform
          center
          distanceFactor={5.2}
          position={[-2.65, 1.68, 0.45]}
          rotation={[0, 0.28, 0]}
          zIndexRange={[12, 2]}
        >
          <div className={`diegetic-stage-block ${heroActive ? 'is-active' : 'is-inactive'}`}>
            <div className="dieg-panel dieg-panel--right-rim">
              <h1 className="dieg-hero-title">{SITE.title}</h1>
              <p className="dieg-sub">code, art &amp; noise · digital reliquary</p>
              <button
                type="button"
                className="ink-trigger dieg-cta"
                onMouseEnter={playHoverTick}
                onClick={() => {
                  playClickHit();
                  jumpToSection(1);
                }}
              >
                <span className="ink-cross" aria-hidden="true">♰</span>
                <span>descend</span>
              </button>
              <div className="dieg-motto">{SITE.motto}</div>
            </div>
          </div>
        </Html>
      )}

      {showAbout && (
        <Html
          portal={portalRef}
          transform
          center
          distanceFactor={3.85}
          position={[-2.62, 1.02, -20.0]}
          rotation={[0, 0.30, 0]}
          zIndexRange={[12, 2]}
        >
          <div className={`diegetic-stage-block ${aboutActive ? 'is-active' : 'is-inactive'}`}>
            <div className="dieg-panel dieg-panel--right-rim dieg-about">
              <h2 className="dieg-title">whoami</h2>
              <div className="dieg-prompt">{ABOUT.prompt}</div>
              <div className="dieg-greeting">
                <p className="c-bone">{ABOUT.greeting[0]}</p>
                <p>{ABOUT.greeting[1]}</p>
                <p>{ABOUT.greeting[2]}</p>
              </div>
              <dl className="dieg-facts">
                {ABOUT.facts.map((item) => (
                  <div key={item.key} className="dieg-fact-row">
                    <dt>
                      <span className="ink-cross" aria-hidden="true">♰</span>
                      <span>{item.key}</span>
                    </dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="dieg-motto-display">{ABOUT.motto}</div>
            </div>
          </div>
        </Html>
      )}

      {showDump && (
        <Html
          portal={portalRef}
          transform
          center
          distanceFactor={3.15}
          position={[3.05, -0.92, -84.2]}
          rotation={[0, -0.28, 0]}
          zIndexRange={[12, 2]}
        >
          <div className={`diegetic-stage-block ${dumpActive ? 'is-active' : 'is-inactive'}`}>
            <div className="dieg-panel dieg-panel--left-rim dieg-dump">
              <h2 className="dieg-title">dump/</h2>
              <p className="dieg-sub">
                {images.length} stained glass shards · touch any fragment
              </p>
              <div className="dieg-shard-row" role="list" aria-label="Stained glass index">
                {images.map((img, i) => (
                  <button
                    key={img.src}
                    type="button"
                    className="ink-trigger dieg-shard-num"
                    onMouseEnter={playHoverTick}
                    onClick={() => {
                      playClickHit();
                      onOpenLightbox?.(i);
                    }}
                    aria-label={`Open shard ${i + 1}: ${img.label}`}
                    title={img.label}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>
              <div className="dieg-hint">← / → · esc</div>
            </div>
          </div>
        </Html>
      )}

      {showGames && (
        <Html
          portal={portalRef}
          transform
          center
          distanceFactor={3.65}
          position={[-2.42, gamesY, -105.6]}
          rotation={[0, 0.30, 0]}
          zIndexRange={[12, 2]}
        >
          <div className={`diegetic-stage-block ${gamesActive ? 'is-active' : 'is-inactive'}`}>
            <div className="dieg-panel dieg-panel--right-rim">
              <h2 className="dieg-title">the crypt</h2>
              <p className="dieg-sub">
                {GAMES_TOTAL} relics · {FAVORITES_COUNT} favored · {PLAYING_COUNT} active
              </p>
              <button
                type="button"
                className="ink-trigger"
                onMouseEnter={playHoverTick}
                onClick={() => {
                  playClickHit();
                  onOpenCrypt?.();
                }}
              >
                <span className="ink-cross" aria-hidden="true">♰</span>
                <span>open the crypt ({GAMES_TOTAL})</span>
              </button>
              <div className="dieg-hint">or touch any floating relic</div>
            </div>
          </div>
        </Html>
      )}

      {showTerm && (
        <Html
          portal={portalRef}
          transform
          center
          distanceFactor={3.9}
          position={[2.05, -2.52, -129.0]}
          rotation={[0, -0.26, 0]}
          zIndexRange={[12, 2]}
        >
          <div className={`diegetic-stage-block ${termActive ? 'is-active' : 'is-inactive'}`}>
            <div className="dieg-panel dieg-panel--left-rim dieg-term">
              <h2 className="dieg-term-title">cmd.exe</h2>
              <button
                type="button"
                className="ink-trigger"
                onMouseEnter={playHoverTick}
                onClick={() => {
                  playClickHit();
                  onOpenTerminal?.();
                }}
              >
                <span className="ink-cross" aria-hidden="true">♰</span>
                <span>touch the glass</span>
              </button>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
