// Renders an image as a CSS background over a branded gradient, so a missing photo still looks intentional.
const ALLOWED = /^(https:\/\/images\.unsplash\.com\/|https:\/\/cdn\.gamma\.app\/|\/)[A-Za-z0-9\-._~/?&=%]*$/;

export function cssImage(src) {
  return src && ALLOWED.test(src) ? `url("${src}")` : 'none';
}

// mobileSrc: optional portrait image used on phones instead of cropping a wide one.
export default function Media({ src, mobileSrc, className = '', label, warm, children, style }) {
  return (
    <div
      className={`media ${warm ? 'media--warm' : ''} ${className}`}
      style={{ '--img': cssImage(src), ...(mobileSrc && { '--img-m': cssImage(mobileSrc) }), ...style }}
      data-mobile-img={mobileSrc ? '' : undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
}
