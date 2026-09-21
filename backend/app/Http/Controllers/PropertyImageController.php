<?php

namespace App\Http\Controllers;

use App\Http\Requests\UploadPropertyImagesRequest;
use App\Http\Resources\PropertyImageResource;
use App\Marketplace\ImageProcessor;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Photos of a landlord's own listing. Position 0 is the cover image shown on cards.
 */
class PropertyImageController extends Controller
{
    public function store(UploadPropertyImagesRequest $request, Property $landlordProperty, ImageProcessor $processor): JsonResponse
    {
        Gate::authorize('manage', $landlordProperty);

        if (! $processor->available()) {
            return response()->json(['message' => 'Photo uploads are not available on this server right now.'], 503);
        }

        $files = $request->file('images');
        $max = (int) config('marketplace.images.max_per_listing');

        if ($landlordProperty->images()->count() + count($files) > $max) {
            throw ValidationException::withMessages(['images' => ["A listing can have up to {$max} photos."]]);
        }

        $diskName = config('marketplace.images.disk');
        $disk = Storage::disk($diskName);
        $written = [];
        $created = [];

        try {
            DB::transaction(function () use ($files, $processor, $landlordProperty, $request, $diskName, $disk, &$written, &$created) {
                $position = $landlordProperty->images()->max('position');
                $position = $position === null ? 0 : $position + 1;

                foreach ($files as $index => $file) {
                    try {
                        $processed = $processor->process($file);
                    } catch (RuntimeException $e) {
                        throw ValidationException::withMessages(["images.{$index}" => [$e->getMessage()]]);
                    }

                    $base = "properties/{$landlordProperty->id}/".Str::uuid();
                    $disk->put("{$base}.jpg", $processed['full'], 'public');
                    $written[] = "{$base}.jpg";
                    $disk->put("{$base}-sm.jpg", $processed['thumb'], 'public');
                    $written[] = "{$base}-sm.jpg";

                    $created[] = $landlordProperty->images()->create([
                        'disk' => $diskName,
                        'path' => "{$base}.jpg",
                        'position' => $position++,
                        'width' => $processed['width'],
                        'height' => $processed['height'],
                        'mime' => 'image/jpeg',
                        'size_bytes' => strlen($processed['full']),
                        'uploaded_by' => $request->user()->id,
                    ]);
                }
            });
        } catch (\Throwable $e) {
            // Do not leave files behind for rows that were rolled back.
            $disk->delete($written);

            throw $e;
        }

        return PropertyImageResource::collection(collect($created))->response()->setStatusCode(201);
    }

    /** Change the description read out to screen-reader users. */
    public function update(Request $request, Property $landlordProperty, PropertyImage $image)
    {
        Gate::authorize('manage', $landlordProperty);
        $this->ensureBelongs($image, $landlordProperty);

        $data = $request->validate(['alt_text' => ['nullable', 'string', 'max:200']]);
        $image->update(['alt_text' => filled($data['alt_text'] ?? null) ? trim($data['alt_text']) : null]);

        return new PropertyImageResource($image);
    }

    public function destroy(Property $landlordProperty, PropertyImage $image): Response
    {
        Gate::authorize('manage', $landlordProperty);
        $this->ensureBelongs($image, $landlordProperty);

        $disk = Storage::disk($image->disk);
        $paths = [$image->path, preg_replace('/(\.[A-Za-z0-9]+)$/', '-sm$1', $image->path)];

        $image->delete();
        $disk->delete($paths);

        return response()->noContent();
    }

    /**
     * Set the order of all photos at once. `ids` must be exactly this listing's photo ids;
     * the first one becomes the cover.
     */
    public function reorder(Request $request, Property $landlordProperty)
    {
        Gate::authorize('manage', $landlordProperty);

        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct'],
        ]);

        $existing = $landlordProperty->images()->pluck('id')->all();

        if (count($data['ids']) !== count($existing) || array_diff($data['ids'], $existing)) {
            throw ValidationException::withMessages(['ids' => ['List every photo of this listing exactly once.']]);
        }

        DB::transaction(function () use ($data, $landlordProperty) {
            foreach (array_values($data['ids']) as $position => $id) {
                $landlordProperty->images()->whereKey($id)->update(['position' => $position]);
            }
        });

        return PropertyImageResource::collection($landlordProperty->images()->get());
    }

    /** An image id from another listing must look like it does not exist. */
    private function ensureBelongs(PropertyImage $image, Property $property): void
    {
        abort_if($image->property_id !== $property->id, 404, 'Not found.');
    }
}
