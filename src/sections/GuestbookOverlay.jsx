import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MESSAGE_MAX, NAME_MAX } from '../guestbook/useGuestbook.js';
import { jumpToSection, sceneBus } from '../state/sceneBus.js';
import { playCandleLit, playClickHit, playHoverTick, playLightboxTone } from '../audio/AudioEngine.js';
import './Guestbook.css';

function ago(ms) {
  const mins = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

// Focusing or hovering an entry lights its candle in the nave.
const focusProps = (id) => ({
  onMouseEnter: () => {
    sceneBus.guestFocus = id;
  },
  onMouseLeave: () => {
    sceneBus.guestFocus = null;
  },
  onFocus: () => {
    sceneBus.guestFocus = id;
  },
  onBlur: () => {
    sceneBus.guestFocus = null;
  },
});

function Entry({ e }) {
  return (
    <li tabIndex={0} {...focusProps(e.id)}>
      <span className="gb-name">{e.name}</span>
      <span className="gb-when">{ago(e.createdAt)}</span>
      <span className="gb-msg">{e.message}</span>
    </li>
  );
}

function SignForm({ sign, onDone }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => nameRef.current?.focus({ preventScroll: true }), []);

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const res = await sign({ name, message, website });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    playCandleLit();
    onDone();
  };

  return (
    <form className="gb-form" onSubmit={submit}>
      <label className="gb-field">
        <span>name</span>
        <input
          ref={nameRef}
          value={name}
          maxLength={NAME_MAX}
          onChange={(e) => setName(e.target.value)}
          autoComplete="nickname"
          required
        />
      </label>
      <label className="gb-field">
        <span>
          a few words <em>{MESSAGE_MAX - message.length}</em>
        </span>
        <textarea
          value={message}
          maxLength={MESSAGE_MAX}
          rows={2}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </label>
      {/* honeypot: hidden from people, irresistible to form bots */}
      <label className="gb-trap" aria-hidden="true">
        website
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </label>
      <p className="gb-error" role="alert">{error}</p>
      <div className="gb-actions">
        <button type="submit" className="ink-trigger" disabled={busy} onMouseEnter={playHoverTick}>
          <span className="ink-cross" aria-hidden="true">♰</span>
          {busy ? 'lighting...' : 'light it'}
        </button>
        <button type="button" className="gb-cancel" onClick={onDone}>
          never mind
        </button>
      </div>
      <p className="gb-note">
        no links, kept to {MESSAGE_MAX} characters. <a href="/privacy.html#sito">what is stored</a>
      </p>
    </form>
  );
}

function AllMarks({ entries, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const back = document.activeElement;
    playLightboxTone(true);
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      playLightboxTone(false);
      sceneBus.guestFocus = null;
      back?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  // portalled: the chapel text has a transform, which would trap position: fixed
  return createPortal(
    <div className="manuscript manuscript--right gb-all" role="dialog" aria-modal="true" aria-labelledby="gb-all-title">
      <div className="manuscript-page">
        <h2 id="gb-all-title" className="manuscript-title">
          <span className="manuscript-rubric" aria-hidden="true">E</span>
          <span className="sr-only">E</span>
          very mark
        </h2>
        <ol className="gb-list gb-list--all">
          {entries.map((e) => (
            <Entry key={e.id} e={e} />
          ))}
        </ol>
        <div className="manuscript-foot">
          <span className="manuscript-folio">{entries.length} candles</span>
          <button ref={closeRef} type="button" className="ink-trigger manuscript-close" onClick={onClose}>
            <span className="ink-cross" aria-hidden="true">♰</span>
            back to the nave
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function GuestbookOverlay({ guestbook, shown }) {
  const { entries, configured, sign } = guestbook;
  const [writing, setWriting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  return (
    <article
      className={`chapel-text gb-text ui-depth-plane beat${shown ? '' : ' beat--off'}`}
      aria-labelledby="gb-heading"
      onFocus={(e) => {
        if (shown) return;
        e.stopPropagation();
        jumpToSection({ id: 'exit', beat: 0 });
      }}
    >
      <div className="chapel-scrim" aria-hidden="true" />
      <h2 id="gb-heading" className="chapel-title">guestbook</h2>

      {configured === false ? (
        <p className="chapel-copy">the candles aren't lit yet. come back soon.</p>
      ) : (
        <>
          <p className="chapel-copy gb-count">
            {entries.length === 0 ? 'no candles yet. be the first.' : `${entries.length} ${entries.length === 1 ? 'candle' : 'candles'} burning · hover one to read it`}
          </p>

          {entries.length > 0 && (
            <ol className="gb-list" aria-label="Latest marks">
              {entries.slice(0, 3).map((e) => (
                <Entry key={e.id} e={e} />
              ))}
            </ol>
          )}

          {writing ? (
            <SignForm sign={sign} onDone={() => setWriting(false)} />
          ) : (
            <div className="gb-actions">
              <button
                type="button"
                className="ink-trigger"
                disabled={!configured}
                onMouseEnter={playHoverTick}
                onClick={() => {
                  playClickHit();
                  setWriting(true);
                }}
              >
                <span className="ink-cross" aria-hidden="true">♰</span>
                light a candle
              </button>
              {entries.length > 3 && (
                <button type="button" className="gb-cancel" onClick={() => setShowAll(true)}>
                  read every mark ({entries.length})
                </button>
              )}
            </div>
          )}
        </>
      )}
      {showAll && <AllMarks entries={entries} onClose={() => setShowAll(false)} />}
    </article>
  );
}
