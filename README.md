# Affordable Housing

Web application for affordable housing allocation, management, and monitoring in Dar es Salaam.

## Structure

- `backend/` — Laravel API (PHP)
- `frontend/` — React app (Vite)

## User Roles

- **Applicant/Resident** — applies for housing, tracks application status, views assigned unit
- **Housing Officer/Admin** — reviews applications, manages eligibility, allocates units
- **Super Admin** — manages system config, users, housing projects/inventory
- **Monitoring/Auditor** — read-only oversight, reports, compliance tracking

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
