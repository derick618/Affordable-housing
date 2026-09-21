<?php

namespace App\Marketplace;

use GdImage;
use Illuminate\Http\UploadedFile;
use RuntimeException;

/**
 * Turns an uploaded photo into the two files the marketplace serves: a full-size JPEG and a
 * card-size one. Re-encoding through GD drops everything that is not pixels, including EXIF
 * (GPS position, camera serial number), which is why uploads are never stored as received.
 */
class ImageProcessor
{
    public function available(): bool
    {
        return extension_loaded('gd') && function_exists('imagejpeg');
    }

    /**
     * @return array{full: string, thumb: string, width: int, height: int}
     *
     * @throws RuntimeException when the file cannot be read as an image (the message is safe to show)
     */
    public function process(UploadedFile $file): array
    {
        $path = $file->getRealPath();
        $binary = $path ? @file_get_contents($path) : false;
        $info = $binary === false ? false : @getimagesizefromstring($binary);

        if (! $info || ! in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            throw new RuntimeException('This file is not a JPG, PNG or WebP image.');
        }

        [$width, $height] = $info;
        $this->assertFitsInMemory($width, $height);

        $source = @imagecreatefromstring($binary);
        unset($binary);

        if (! $source instanceof GdImage) {
            throw new RuntimeException('This image could not be read. Try saving it again as a JPG.');
        }

        $source = $this->applyExifOrientation($source, $path, $info[2]);
        $width = imagesx($source);
        $height = imagesy($source);

        $full = $this->encode($source, (int) config('marketplace.images.full_width'), 82);
        $thumb = $this->encode($source, (int) config('marketplace.images.thumb_width'), 78);

        return ['full' => $full['data'], 'thumb' => $thumb['data'], 'width' => $full['width'], 'height' => $full['height']];
    }

    /**
     * GD needs roughly 5 bytes per pixel to decode and resize. Refuse an image that would
     * exhaust memory rather than crash the request.
     */
    private function assertFitsInMemory(int $width, int $height): void
    {
        $limit = $this->memoryLimitBytes();

        if ($limit > 0 && ($width * $height * 5) + memory_get_usage() > $limit) {
            throw new RuntimeException('This image is too large to process. Resize it and try again.');
        }
    }

    private function memoryLimitBytes(): int
    {
        $value = trim((string) ini_get('memory_limit'));

        if ($value === '' || $value === '-1') {
            return 0;
        }

        $number = (int) $value;

        return match (strtolower(substr($value, -1))) {
            'g' => $number * 1024 ** 3,
            'm' => $number * 1024 ** 2,
            'k' => $number * 1024,
            default => $number,
        };
    }

    /** Phones store "rotate me" in EXIF instead of rotating the pixels. Bake it in before EXIF is dropped. */
    private function applyExifOrientation(GdImage $image, ?string $path, int $type): GdImage
    {
        if ($type !== IMAGETYPE_JPEG || ! $path || ! function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($path);
        $angle = match ((int) ($exif['Orientation'] ?? 1)) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        if ($angle === 0) {
            return $image;
        }

        $rotated = imagerotate($image, $angle, 0);

        return $rotated instanceof GdImage ? $rotated : $image;
    }

    /**
     * @return array{data: string, width: int, height: int}
     */
    private function encode(GdImage $source, int $maxWidth, int $quality): array
    {
        $width = imagesx($source);
        $height = imagesy($source);

        // Never enlarge; only shrink.
        $targetWidth = min($width, $maxWidth);
        $targetHeight = (int) round($height * ($targetWidth / $width));

        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
        // JPEG has no transparency: flatten PNG/WebP onto white instead of black.
        imagefill($canvas, 0, 0, imagecolorallocate($canvas, 255, 255, 255));
        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        ob_start();
        imagejpeg($canvas, null, $quality);
        $data = (string) ob_get_clean();

        return ['data' => $data, 'width' => $targetWidth, 'height' => $targetHeight];
    }
}
