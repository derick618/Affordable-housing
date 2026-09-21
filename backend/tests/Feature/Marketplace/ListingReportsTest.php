<?php

namespace Tests\Feature\Marketplace;

use App\Models\ListingReport;
use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\Sanctum;

class ListingReportsTest extends MarketplaceTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('listing-reports');
    }

    public function test_a_visitor_can_report_a_published_listing_without_signing_in(): void
    {
        $property = $this->property();

        $response = $this->postJson("/api/properties/{$property->slug}/reports", [
            'reason' => 'scam',
            'details' => 'Asked me to send a deposit before viewing.',
            'contact' => '+255700000001',
        ])->assertCreated();

        $this->assertDatabaseHas('listing_reports', [
            'property_id' => $property->id,
            'user_id' => null,
            'reason' => 'scam',
            'status' => 'open',
            'contact' => '+255700000001',
        ]);

        // Nothing about the stored report (ids, hashes, contact) comes back to the reporter.
        $this->assertSame(['message'], array_keys($response->json()));
    }

    public function test_details_and_contact_are_optional(): void
    {
        $property = $this->property();

        $this->postJson("/api/properties/{$property->slug}/reports", ['reason' => 'already_rented'])->assertCreated();

        $report = ListingReport::first();
        $this->assertNull($report->details);
        $this->assertNull($report->contact);
    }

    public function test_a_signed_in_report_is_linked_to_the_user(): void
    {
        $user = User::factory()->create(['role' => 'applicant']);
        Sanctum::actingAs($user);
        $property = $this->property();

        $this->postJson("/api/properties/{$property->slug}/reports", ['reason' => 'wrong_details'])->assertCreated();

        $this->assertSame($user->id, ListingReport::first()->user_id);
    }

    public function test_reason_is_required_and_must_be_known(): void
    {
        $property = $this->property();

        $this->postJson("/api/properties/{$property->slug}/reports", [])
            ->assertUnprocessable()->assertJsonValidationErrors('reason');
        $this->postJson("/api/properties/{$property->slug}/reports", ['reason' => 'because'])
            ->assertUnprocessable()->assertJsonValidationErrors('reason');
        $this->postJson("/api/properties/{$property->slug}/reports", ['reason' => 'scam', 'details' => str_repeat('a', 1001)])
            ->assertUnprocessable()->assertJsonValidationErrors('details');

        $this->assertDatabaseCount('listing_reports', 0);
    }

    public function test_unpublished_or_unknown_listings_cannot_be_reported(): void
    {
        $draft = $this->property(['publication_status' => 'draft']);

        $this->postJson("/api/properties/{$draft->slug}/reports", ['reason' => 'scam'])->assertNotFound();
        $this->postJson('/api/properties/nothing-here/reports', ['reason' => 'scam'])->assertNotFound();
    }

    public function test_repeating_the_same_report_within_a_day_is_stored_once(): void
    {
        $property = $this->property();

        $this->postJson("/api/properties/{$property->slug}/reports", ['reason' => 'scam'])->assertCreated();
        $this->postJson("/api/properties/{$property->slug}/reports", ['reason' => 'scam'])->assertCreated();
        $this->assertDatabaseCount('listing_reports', 1);

        // A different reason is a different report.
        $this->postJson("/api/properties/{$property->slug}/reports", ['reason' => 'other'])->assertCreated();
        $this->assertDatabaseCount('listing_reports', 2);

        // After a day the same reason can be filed again.
        $this->travel(25)->hours();
        RateLimiter::clear('listing-reports');
        $this->postJson("/api/properties/{$property->slug}/reports", ['reason' => 'scam'])->assertCreated();
        $this->assertDatabaseCount('listing_reports', 3);
    }

    public function test_reporting_is_rate_limited_per_visitor(): void
    {
        $listings = collect(range(1, 6))->map(fn () => $this->property());

        foreach ($listings->take(5) as $property) {
            $this->postJson("/api/properties/{$property->slug}/reports", ['reason' => 'scam'])->assertCreated();
        }

        $this->postJson("/api/properties/{$listings->last()->slug}/reports", ['reason' => 'scam'])
            ->assertStatus(429);
    }

    public function test_the_raw_ip_address_is_not_stored(): void
    {
        $property = $this->property();

        $this->postJson("/api/properties/{$property->slug}/reports", ['reason' => 'scam'])->assertCreated();

        $hash = ListingReport::first()->reporter_hash;
        $this->assertSame(64, strlen($hash));
        $this->assertStringNotContainsString('127.0.0.1', $hash);
    }

    // ------------------------------------------------------------------ staff

    public function test_staff_can_list_reports_with_details(): void
    {
        $property = $this->property(['title' => 'Suspicious flat']);
        ListingReport::factory()->create(['property_id' => $property->id, 'details' => 'Fake photos', 'contact' => '0700']);
        Sanctum::actingAs(User::factory()->create(['role' => 'housing_officer']));

        $this->getJson('/api/listing-reports')
            ->assertOk()
            ->assertJsonPath('data.0.reason', 'scam')
            ->assertJsonPath('data.0.details', 'Fake photos')
            ->assertJsonPath('data.0.contact', '0700')
            ->assertJsonPath('data.0.property.title', 'Suspicious flat')
            ->assertJsonPath('data.0.status', 'open')
            ->assertJsonMissingPath('data.0.reporter_hash');
    }

    public function test_reports_can_be_filtered_by_status_and_listing(): void
    {
        $a = $this->property();
        $b = $this->property();
        ListingReport::factory()->create(['property_id' => $a->id]);
        ListingReport::factory()->create(['property_id' => $b->id, 'status' => 'resolved']);
        Sanctum::actingAs(User::factory()->create(['role' => 'auditor']));

        $this->getJson('/api/listing-reports?status=open')->assertJsonCount(1, 'data');
        $this->getJson("/api/listing-reports?property={$b->slug}")->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'resolved');
        $this->getJson('/api/listing-reports?status=bogus')->assertUnprocessable();
    }

    public function test_applicants_and_guests_cannot_read_reports(): void
    {
        ListingReport::factory()->create();

        $this->getJson('/api/listing-reports')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create(['role' => 'applicant']));
        $this->getJson('/api/listing-reports')->assertForbidden();
    }

    public function test_officers_can_resolve_a_report_and_it_records_who_and_when(): void
    {
        $report = ListingReport::factory()->create();
        $officer = User::factory()->create(['role' => 'housing_officer']);
        Sanctum::actingAs($officer);

        $this->patchJson("/api/listing-reports/{$report->id}", ['status' => 'resolved', 'staff_note' => 'Owner confirmed.'])
            ->assertOk()
            ->assertJsonPath('data.status', 'resolved')
            ->assertJsonPath('data.staff_note', 'Owner confirmed.')
            ->assertJsonPath('data.handled_by', $officer->name);

        $this->assertNotNull($report->fresh()->handled_at);
    }

    public function test_auditors_cannot_change_a_report(): void
    {
        $report = ListingReport::factory()->create();
        Sanctum::actingAs(User::factory()->create(['role' => 'auditor']));

        $this->patchJson("/api/listing-reports/{$report->id}", ['status' => 'resolved'])->assertForbidden();

        $this->assertSame('open', $report->fresh()->status->value);
    }

    public function test_updating_validates_the_status(): void
    {
        $report = ListingReport::factory()->create();
        Sanctum::actingAs(User::factory()->create(['role' => 'super_admin']));

        $this->patchJson("/api/listing-reports/{$report->id}", ['status' => 'exploded'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->patchJson('/api/listing-reports/999999', ['status' => 'resolved'])->assertNotFound();
    }
}
