// Pixel icons from the shared sprite in public/icons.svg; they inherit currentColor.
export default function Icon({ name, className = '' }) {
  return (
    <svg className={'icon ' + className} aria-hidden="true" focusable="false">
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
