import { useState } from 'react';
import PropertyImage from './PropertyImage';
import { imageKey } from '../utils/images';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

/** Main photo with prev/next controls and a thumbnail strip. Works with touch and keyboard. */
export default function Gallery({ images, title }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const go = (delta) => setIndex((i) => (i + delta + count) % count);

  return (
    <div>
      <div className="group relative overflow-hidden rounded-2xl shadow-sm">
        <PropertyImage
          key={imageKey(images[index])}
          src={images[index]}
          alt={`${title}, photo ${index + 1} of ${count}`}
          eager={index === 0}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="aspect-[4/3] sm:aspect-[16/10]"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute top-1/2 left-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-stone-800 shadow-md transition hover:bg-white active:scale-95"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute top-1/2 right-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-stone-800 shadow-md transition hover:bg-white active:scale-95"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-stone-900/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {images.map((image, i) => (
            <li key={`${i}-${imageKey(image)}`}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={`block w-full overflow-hidden rounded-xl ring-2 ring-offset-2 transition dark:ring-offset-stone-950 ${
                  i === index ? 'ring-brand-700 dark:ring-brand-400' : 'ring-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <PropertyImage src={image} alt="" size="sm" sizes="20vw" className="aspect-[4/3]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
