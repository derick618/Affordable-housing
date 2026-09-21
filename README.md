# Affordable Housing

Affordable housing platform for Tanzania: a public marketplace where people can search and contact owners of affordable homes, plus an application and allocation system for housing programmes.

## Structure

- `backend/` — Laravel API (PHP)
- `frontend/` — React app (Vite)

## User Roles

- **Applicant/Resident** — applies for housing, tracks application status, views assigned unit
- **Housing Officer/Admin** — reviews applications, manages eligibility, allocates units
- **Super Admin** — manages system config, users, housing projects/inventory
- **Monitoring/Auditor** — read-only oversight, reports, compliance tracking

## Public marketplace (frontend)

Open to everyone, no login needed:

- `/` — homepage: hero search, popular locations, featured and recent homes, how it works, safety tips
- `/properties` — search and filter (location, price, type, bedrooms, availability); filters live in the URL
- `/properties/:id` — gallery, price, amenities, owner contact, report listing, similar homes
- `/saved` — homes saved with the heart button (stored in the browser)

Signed-in pages (`/dashboard`, `/housing-projects`, `/applications`, `/allocations`, `/users`) are unchanged.

### Demo data and photos

By default the frontend uses the 12 built-in demo listings in `frontend/src/data/properties.js`.
Set `VITE_USE_API=true` in `frontend/.env.local` to read the same listings from the Laravel API instead
(see `frontend/README.md`). Every page reads listings through `frontend/src/api/properties.js`, so the
components do not know which source is in use. Photos live in `frontend/public/images/` (see `CREDITS.md`
there); drop in a JPEG with the same file name to replace one. Set `VITE_DEMO_MODE=false` once real
listings are live to hide the "demonstration data" notices.

### Accounts, landlord listings and moderation (API mode only)

With `VITE_USE_API=true` a signed-in user also gets:

- **Saved homes in their account** — the heart buttons sync to `/api/favorites`. Homes saved in the browser
  before signing in are merged into the account, and the browser copy is cleared on sign-out.
- **Report a listing** — `POST /api/properties/{slug}/reports` (5 per hour per visitor). Staff read and
  resolve reports at `/api/listing-reports`.
- **List your home** (`/landlord`) — any login can create a landlord profile (this does not change
  `users.role`), add homes as drafts, upload photos, and submit them for review. Listings only go public
  after a housing officer or super admin approves them (`/api/moderation/properties`, `/approve`, `/reject`);
  those roles also verify owners (`/api/moderation/owners/{id}/verify`). Auditors can look but not decide.
  There is no staff screen for this yet; use the API.
- **Contact the owner** — renters leave their name, phone and a message (`POST /api/properties/{slug}/inquiries`,
  8 per hour per visitor). The owner sees them under `/landlord?tab=messages`. The owner's own phone number
  is never returned by any public endpoint.
- **My budget** (`/my-budget`) — a saved monthly budget marks affordable homes with "Within your budget"
  while browsing. It never filters or ranks anything.

Setup for these features:

```
cd backend
php artisan migrate
```

**Photo uploads need PHP's GD extension.** In XAMPP, remove the `;` before `extension=gd` in `php.ini` and
restart. Without it uploads answer `503` and the rest of the site keeps working. Uploaded photos are
re-encoded as JPEG (which strips EXIF/GPS data) and stored under `backend/public/marketplace/` (git-ignored).
Set `MARKETPLACE_IMAGE_DISK` to another filesystem disk (for example `s3`) to keep photos elsewhere; hosts
with a temporary filesystem need this. The backend `.env` needs `APP_URL` set to the URL the API is served
from, because photo URLs are built from it. Locations are data, not something landlords can add: they can
only choose from the places in the `locations` table.

## MVP Features

- Application & eligibility review
- Unit/inventory management
- Allocation workflow
- Monitoring & reporting dashboard

## Development

### Backend (Laravel)

```
cd backend
composer install
php artisan serve
```

### Frontend (React)

```
cd frontend
npm install
npm run dev
```
