import { useEffect, useRef } from 'react';

export default function Notification({ message }) {
  const prevMsg = useRef(null);

  useEffect(() => {
    prevMsg.current = message;
  }, [message]);

  return (
    <div id="notif" className={message ? 'visible' : ''}>
      {message || '// function not implemented'}
    </div>
  );
}
