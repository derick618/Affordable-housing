# Affordable Housing: React frontend

Vite + React 19 + Tailwind CSS. It contains the public marketplace (home, search, property
details, saved homes) and the signed-in allocation app (dashboard, projects, applications).

## Running it

```
npm install
npm run dev        # http://localhost:5173
npm run build
npm test           # unit tests for the API layer (Node's built-in test runner)
```

## Marketplace data source

The marketplace reads properties through one seam, `src/api/properties.js`. Which
implementation it uses is controlled by an environment variable (copy `.env.example` to
`.env.local` to change it):

| `VITE_USE_API` | Marketplace data |
|---|---|
| `false` or unset (default) | The 12 built-in demo listings in `src/data/properties.js`. **No backend needed.** |
| `true` | The Laravel API at `VITE_API_URL` (`GET /api/properties`, `/api/properties/{slug}`, `/api/properties/{slug}/similar`, `/api/locations`). |

To try the API mode locally:

```
# 1. Backend (from ./backend): migrate, then load the 12 demo listings
php artisan migrate
php artisan db:seed --class=DemoMarketplaceSeeder
php artisan serve                      # http://127.0.0.1:8000

# 2. Frontend (from ./frontend): in .env.local
VITE_USE_API=true
VITE_API_URL=http://127.0.0.1:8000
npm run dev
```

The backend's `FRONTEND_URL` must match the address the frontend runs on (CORS), and demo
photos are served by the frontend itself from `public/images/`.

How it fits together:

- `src/api/propertiesLocal.js` and `src/api/propertiesRemote.js` implement the same functions.
- `src/api/propertyMapper.js` maps Laravel's snake_case JSON onto the camelCase shape the
  components already use, so components never see API field names.
- `src/api/propertyQuery.js` turns the UI's filters into Laravel query parameters.
- Saved homes still live in the browser (`localStorage`) in both modes.
- The API intentionally does not return owner phone/WhatsApp numbers yet, so the contact dialog
  says contact details are not available yet in API mode.

## Vite template notes
This project started from a template that provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
