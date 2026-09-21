import { useRef, useState } from 'react';
import { deleteImage, reorderImages, saveImageAlt, uploadImages } from '../../api/account';
import { describeApiError } from '../../api/errors';
import { FormError } from '../../components/Field';
import PropertyImage from '../../components/PropertyImage';

const MAX_MB = 5;
const MAX_PHOTOS = 12;
const ACCEPT = 'image/jpeg,image/png,image/webp';

/**
 * Add, remove, reorder and describe a listing's photos. The first photo is the cover shown on
 * search results. Photos are re-encoded on the server (which also removes hidden location data).
 */
export default function PhotoManager({ slug, images, onChange, error: serverError }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleFiles(event) {
    const files = [...event.target.files];
    event.target.value = '';
    if (!files.length) return;

    const tooBig = files.find((f) => f.size > MAX_MB * 1024 * 1024);
    const wrongType = files.find((f) => !ACCEPT.split(',').includes(f.type));
    if (wrongType) return setError(`“${wrongType.name}” isn’t a JPG, PNG or WebP photo.`);
    if (tooBig) return setError(`“${tooBig.name}” is larger than ${MAX_MB} MB. Choose a smaller photo.`);
    if (images.length + files.length > MAX_PHOTOS) return setError(`You can add up to ${MAX_PHOTOS} photos.`);

    setBusy(true);
    setError(null);
    try {
      const added = await uploadImages(slug, files);
      onChange([...images, ...added]);
    } catch (err) {
      const { message, fields } = describeApiError(err, "We couldn't upload those photos. Please try again.");
      setError(Object.values(fields)[0] ?? message);
    } finally {
      setBusy(false);
    }
  }

  async function makeCover(image) {
    const order = [image, ...images.filter((i) => i.id !== image.id)];
    setBusy(true);
    setError(null);
    try {
      await reorderImages(slug, order.map((i) => i.id));
      onChange(order.map((i, position) => ({ ...i, position })));
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(image) {
    setBusy(true);
    setError(null);
    try {
      await deleteImage(slug, image.id);
      onChange(images.filter((i) => i.id !== image.id));
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveAlt(image, alt) {
    if (alt === image.alt) return;
    try {
      await saveImageAlt(slug, image.id, alt);
      onChange(images.map((i) => (i.id === image.id ? { ...i, alt } : i)));
    } catch (err) {
      setError(describeApiError(err).message);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {images.length} of {MAX_PHOTOS} photos. The first photo is the cover. JPG, PNG or WebP, up to {MAX_MB} MB each.
        </p>
        <button type="button" className="btn" disabled={busy || images.length >= MAX_PHOTOS} onClick={() => input.current?.click()}>
          {busy ? 'Working…' : 'Add photos'}
        </button>
        <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={handleFiles} aria-label="Choose photos to upload" />
      </div>

      <div className="mt-3 space-y-2">
        <FormError>{error || serverError}</FormError>
      </div>

      {images.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
          No photos yet. Homes with clear photos of each room get far more enquiries.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="relative">
                <PropertyImage src={image} alt={image.alt || `Photo ${index + 1}`} size="sm" sizes="(min-width: 1024px) 20vw, 50vw" className="aspect-[4/3] w-full" />
                {index === 0 && <span className="badge badge-brand absolute left-2 top-2">Cover</span>}
              </div>
              <div className="space-y-2 p-3">
                <label className="sr-only" htmlFor={`alt-${image.id}`}>
                  Describe photo {index + 1}
                </label>
                <input
                  id={`alt-${image.id}`}
                  className="field-input"
                  placeholder="Describe this photo (optional)"
                  defaultValue={image.alt}
                  maxLength={200}
                  onBlur={(e) => saveAlt(image, e.target.value.trim())}
                />
                <div className="flex gap-2">
                  {index > 0 && (
                    <button type="button" className="btn flex-1" disabled={busy} onClick={() => makeCover(image)}>
                      Make cover
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost flex-1 text-rose-700 dark:text-rose-400" disabled={busy} onClick={() => remove(image)}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
