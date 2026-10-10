// Renders an image as a CSS background over a branded gradient, so a missing photo still looks intentional.
const ALLOWED = /^(https:\/\/images\.unsplash\.com\/|\/)[A-Za-z0-9\-._~/?&=%]*$/;

export function cssImage(src) {
  return src && ALLOWED.test(src) ? `url("${src}")` : 'none';
}

export default function Media({ src, className = '', label, warm, children, style }) {
  return (
    <div
      className={`media ${warm ? 'media--warm' : ''} ${className}`}
      style={{ '--img': cssImage(src), ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
}
