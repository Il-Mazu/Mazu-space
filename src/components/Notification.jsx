export default function Notification({ message }) {
  // The live region stays mounted so screen readers announce each new message.
  return (
    <div id="notif" role="status">
      {message && <div className="notif-box" key={message}>{message}</div>}
    </div>
  );
}
