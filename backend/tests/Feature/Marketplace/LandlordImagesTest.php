<?php

namespace Tests\Feature\Marketplace;

use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class LandlordImagesTest extends LandlordTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! extension_loaded('gd')) {
            $this->markTestSkipped('The GD extension is required for photo upload tests (run: php -d extension=gd artisan test).');
        }

        Storage::fake('marketplace');
    }

    private function draft(): Property
    {
        $user = $this->landlord();

        return $this->property(['owner_id' => $user->owner->id, 'publication_status' => 'draft', 'published_at' => null]);
    }

    private function photo(string $name = 'a.jpg', int $w = 1600, int $h = 1000): UploadedFile
    {
        return UploadedFile::fake()->image($name, $w, $h);
    }

    public function test_uploading_stores_a_full_size_and_a_thumbnail_and_returns_urls(): void
    {
        $property = $this->draft();

        $response = $this->postJson("/api/landlord/properties/{$property->slug}/images", [
            'images' => [$this->photo('one.jpg'), $this->photo('two.png')],
        ])->assertCreated()->assertJsonCount(2, 'data');

        $response->assertJsonPath('data.0.position', 0)->assertJsonPath('data.1.position', 1);

        $image = PropertyImage::orderBy('id')->first();
        $this->assertSame('marketplace', $image->disk);
        $this->assertMatchesRegularExpression('#^properties/'.$property->id.'/[0-9a-f-]{36}\.jpg$#', $image->path);

        Storage::disk('marketplace')->assertExists($image->path);
        Storage::disk('marketplace')->assertExists(str_replace('.jpg', '-sm.jpg', $image->path));

        $this->assertStringEndsWith($image->path, $response->json('data.0.url'));
        $this->assertStringEndsWith(str_replace('.jpg', '-sm.jpg', $image->path), $response->json('data.0.thumb_url'));
    }

    public function test_images_are_resized_and_reencoded_as_jpeg(): void
    {
        $property = $this->draft();

        $this->postJson("/api/landlord/properties/{$property->slug}/images", [
            'images' => [$this->photo('big.png', 3000, 2000)],
        ])->assertCreated();

        $image = PropertyImage::first();
        $this->assertSame(1200, $image->width);
        $this->assertSame(800, $image->height);
        $this->assertSame('image/jpeg', $image->mime);

        $disk = Storage::disk('marketplace');
        [$fullWidth] = getimagesizefromstring($disk->get($image->path));
        [$thumbWidth, , $thumbType] = getimagesizefromstring($disk->get(str_replace('.jpg', '-sm.jpg', $image->path)));
        $this->assertSame(1200, $fullWidth);
        $this->assertSame(640, $thumbWidth);
        $this->assertSame(IMAGETYPE_JPEG, $thumbType);
    }

    public function test_small_photos_are_not_enlarged(): void
    {
        $property = $this->draft();

        $this->postJson("/api/landlord/properties/{$property->slug}/images", [
            'images' => [$this->photo('small.jpg', 900, 600)],
        ])->assertCreated();

        $this->assertSame(900, PropertyImage::first()->width);
    }

    public function test_exif_metadata_such_as_gps_does_not_survive(): void
    {
        $property = $this->draft();
        $marker = 'GPSLatitudeRef-should-not-survive';

        // A JPEG with an APP1/Exif segment carrying a recognisable string.
        $jpeg = $this->photo('gps.jpg')->get();
        $exif = "Exif\0\0".$marker;
        $segment = "\xFF\xE1".pack('n', strlen($exif) + 2).$exif;
        $withExif = substr($jpeg, 0, 2).$segment.substr($jpeg, 2);
        $path = tempnam(sys_get_temp_dir(), 'exif').'.jpg';
        file_put_contents($path, $withExif);
        $this->assertStringContainsString($marker, file_get_contents($path));

        $this->postJson("/api/landlord/properties/{$property->slug}/images", [
            'images' => [new UploadedFile($path, 'gps.jpg', 'image/jpeg', null, true)],
        ])->assertCreated();

        $stored = Storage::disk('marketplace')->get(PropertyImage::first()->path);
        $this->assertStringNotContainsString($marker, $stored);
    }

    public function test_a_disguised_non_image_is_rejected(): void
    {
        $property = $this->draft();
        $fake = UploadedFile::fake()->createWithContent('shell.jpg', '<?php echo 1; ?>');

        $this->postJson("/api/landlord/properties/{$property->slug}/images", ['images' => [$fake]])
            ->assertUnprocessable();

        $this->assertDatabaseCount('property_images', 0);
        $this->assertSame([], Storage::disk('marketplace')->allFiles());
    }

    public function test_type_size_and_dimension_limits(): void
    {
        $property = $this->draft();
        $url = "/api/landlord/properties/{$property->slug}/images";

        $this->postJson($url, ['images' => [UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')]])
            ->assertUnprocessable()->assertJsonValidationErrors('images.0');
        $this->postJson($url, ['images' => [$this->photo('tiny.jpg', 200, 150)]])
            ->assertUnprocessable()->assertJsonValidationErrors('images.0');
        $this->postJson($url, ['images' => [UploadedFile::fake()->image('huge.jpg', 1600, 1000)->size(6000)]])
            ->assertUnprocessable()->assertJsonValidationErrors('images.0');
        $this->postJson($url, ['images' => []])->assertUnprocessable()->assertJsonValidationErrors('images');
        $this->postJson($url, [])->assertUnprocessable()->assertJsonValidationErrors('images');
    }

    public function test_a_listing_has_a_maximum_number_of_photos(): void
    {
        config(['marketplace.images.max_per_listing' => 2]);
        $property = $this->draft();
        $url = "/api/landlord/properties/{$property->slug}/images";

        $this->postJson($url, ['images' => [$this->photo('1.jpg'), $this->photo('2.jpg')]])->assertCreated();
        $this->postJson($url, ['images' => [$this->photo('3.jpg')]])
            ->assertUnprocessable()->assertJsonValidationErrors('images');

        $this->assertSame(2, $property->images()->count());
    }

    public function test_only_the_owner_can_upload_or_change_photos(): void
    {
        $theirs = $this->property(['publication_status' => 'draft']);
        $image = PropertyImage::factory()->create(['property_id' => $theirs->id]);
        $this->landlord();

        $this->postJson("/api/landlord/properties/{$theirs->slug}/images", ['images' => [$this->photo()]])->assertNotFound();
        $this->patchJson("/api/landlord/properties/{$theirs->slug}/images/{$image->id}", ['alt_text' => 'x'])->assertNotFound();
        $this->deleteJson("/api/landlord/properties/{$theirs->slug}/images/{$image->id}")->assertNotFound();
        $this->putJson("/api/landlord/properties/{$theirs->slug}/images/order", ['ids' => [$image->id]])->assertNotFound();

        $this->assertDatabaseCount('property_images', 1);
    }

    public function test_an_image_id_from_another_listing_cannot_be_used(): void
    {
        $mine = $this->draft();
        $other = $this->property();
        $foreign = PropertyImage::factory()->create(['property_id' => $other->id]);

        $this->deleteJson("/api/landlord/properties/{$mine->slug}/images/{$foreign->id}")->assertNotFound();
        $this->patchJson("/api/landlord/properties/{$mine->slug}/images/{$foreign->id}", ['alt_text' => 'x'])->assertNotFound();

        $this->assertDatabaseHas('property_images', ['id' => $foreign->id]);
    }

    public function test_deleting_a_photo_removes_its_files(): void
    {
        $property = $this->draft();
        $this->postJson("/api/landlord/properties/{$property->slug}/images", ['images' => [$this->photo()]])->assertCreated();
        $image = PropertyImage::first();

        $this->deleteJson("/api/landlord/properties/{$property->slug}/images/{$image->id}")->assertNoContent();

        $this->assertDatabaseCount('property_images', 0);
        Storage::disk('marketplace')->assertMissing($image->path);
        Storage::disk('marketplace')->assertMissing(str_replace('.jpg', '-sm.jpg', $image->path));
    }

    public function test_alt_text_can_be_set_and_cleared(): void
    {
        $property = $this->draft();
        $image = PropertyImage::factory()->create(['property_id' => $property->id]);
        $url = "/api/landlord/properties/{$property->slug}/images/{$image->id}";

        $this->patchJson($url, ['alt_text' => '  Living room  '])->assertOk()->assertJsonPath('data.alt_text', 'Living room');
        $this->patchJson($url, ['alt_text' => ''])->assertOk()->assertJsonPath('data.alt_text', null);
    }

    public function test_reordering_changes_the_cover(): void
    {
        $property = $this->draft();
        $a = PropertyImage::factory()->position(0)->create(['property_id' => $property->id]);
        $b = PropertyImage::factory()->position(1)->create(['property_id' => $property->id]);
        $c = PropertyImage::factory()->position(2)->create(['property_id' => $property->id]);

        $this->putJson("/api/landlord/properties/{$property->slug}/images/order", ['ids' => [$c->id, $a->id, $b->id]])
            ->assertOk()
            ->assertJsonPath('data.0.id', $c->id);

        $this->assertSame($c->id, $property->fresh()->coverImage->id);
        $this->assertSame([$c->id, $a->id, $b->id], $property->images()->pluck('id')->all());
    }

    public function test_reordering_must_list_every_photo_exactly_once(): void
    {
        $property = $this->draft();
        $a = PropertyImage::factory()->create(['property_id' => $property->id]);
        PropertyImage::factory()->position(1)->create(['property_id' => $property->id]);
        $foreign = PropertyImage::factory()->create();

        $url = "/api/landlord/properties/{$property->slug}/images/order";
        $this->putJson($url, ['ids' => [$a->id]])->assertUnprocessable();
        $this->putJson($url, ['ids' => [$a->id, $foreign->id]])->assertUnprocessable();
        $this->putJson($url, ['ids' => [$a->id, $a->id]])->assertUnprocessable();
    }

    public function test_uploaded_photos_appear_on_the_public_listing_once_published(): void
    {
        $user = $this->landlord();
        $property = $this->property(['owner_id' => $user->owner->id]);
        $this->postJson("/api/landlord/properties/{$property->slug}/images", ['images' => [$this->photo()]])->assertCreated();

        $public = $this->getJson("/api/properties/{$property->slug}")->assertOk();

        // (Storage::fake swaps the disk's URL prefix, so only the path below it is asserted.)
        $this->assertStringContainsString('/properties/'.$property->id.'/', $public->json('data.images.0.url'));
        $this->assertStringEndsWith('-sm.jpg', $public->json('data.images.0.thumb_url'));
        $this->assertStringEndsWith('-sm.jpg', $this->getJson('/api/properties')->json('data.0.cover_image.thumb_url'));
    }
}
