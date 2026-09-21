import { useEffect, useRef, useState } from 'react';
import { imageKey, imageSrcSet, imageUrl } from '../utils/images';
import HouseIcon from './illustrations/HouseIcon';

/**
 * A responsive property photo that never leaves a broken image on screen.
 *
 * - `src` is a local image key ("properties/sinza-family-house"), a full URL, or an API
 *   image object ({ url, thumbUrl }); see utils/images.js.
 * - Cards pass size="sm" to get the 640px variant; galleries and heroes use the default.
 * - Shows a shimmer until the photo has loaded, then fades it in.
 * - If the photo fails, or there is no photo at all, shows a tidy house placeholder.
 * Size the wrapper with className (e.g. "aspect-[4/3]"); the image fills it.
 */
export default function PropertyImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  eager = false,
  size = 'lg',
}) {
  const key = imageKey(src);
  const [status, setStatus] = useState('loading');
  const imgRef = useRef(null);

  // Runs when the source changes. A cached image can finish loading before React attaches
  // onLoad, so check `complete`; otherwise (re)start in the loading state.
  useEffect(() => {
    if (!key) return;
    const img = imgRef.current;
    if (img?.complete) {
      setStatus(img.naturalWidth > 0 ? 'loaded' : 'error');
    } else {
      setStatus('loading');
    }
  }, [key]);

  // Full-bleed backgrounds pass their own `absolute`; `relative` would override it.
  const position = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className) ? '' : 'relative';
  const failed = !key || status === 'error';

  return (
    <div className={`${position} overflow-hidden bg-stone-200 dark:bg-stone-800 ${className}`}>
      {!failed && status === 'loading' && <div className="skeleton absolute inset-0 rounded-none" />}

      {failed ? (
        <div
          role="img"
          aria-label={alt ? `${alt} (photo unavailable)` : 'Photo unavailable'}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-brand-50 to-stone-100 px-2 text-center text-brand-700/60 dark:from-stone-800 dark:to-stone-900 dark:text-stone-500"
        >
          <HouseIcon className="h-10 w-10 sm:h-12 sm:w-12" />
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Photo coming soon</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={imageUrl(src, size)}
          srcSet={imageSrcSet(src)}
          sizes={imageSrcSet(src) ? sizes : undefined}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
        />
      )}
    </div>
  );
}
