# LeagueUp — Frontend

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind 4 ·
shadcn/ui (base-ui) · TanStack Query · React Hook Form + Zod.

> Next 16 differs from older versions (`proxy.ts` replaces middleware; session reads must
> sit behind `<Suspense>`). Read `node_modules/next/dist/docs/` before writing code; see `AGENTS.md`.

## Run locally

```bash
cp .env.example .env.local     # points at leagueup_be on :4000
npm install
npm run dev                    # http://localhost:3000
```

The backend (`../leagueup_be`) must be running: `docker compose up -d && npm run dev` there.

Verification gate: `npx tsc --noEmit && npm run lint && npm test && npm run build`.

Run on port 3000: the backend emails links to `FRONTEND_URL` (default `http://localhost:3000`)
and only allows `CORS_ORIGINS`. Read outgoing email in Mailpit at http://localhost:8125.

## Architecture

```
src/
  app/
    (marketing)/   public pages (home)
    (auth)/        login, signup: focused layout
    (app)/         signed-in pages (dashboard, account)
  components/
    ui/            shadcn primitives (generated; brand-tuned sizes)
    layout/        shell, header, footer, user menu
    navigation/    nav config + desktop and mobile bottom nav
    forms/ shared/ cross-feature building blocks
  features/<domain>/   api.ts, schemas.ts, types.ts, actions.ts, components/
  lib/api/         the single API client (envelope parsing, ApiError)
  lib/auth/        session cookie + getCurrentUser / requireUser
  proxy.ts         optimistic route gate
```

### Auth model

The backend issues a bearer JWT backed by a server-side session. Server actions call
`/auth/login|register`, then store the token in an **httpOnly `lu_session` cookie**, so
browser JS never sees it. Server components read the cookie and call the API with
`Authorization: Bearer`. `getCurrentUser()` verifies every request against `/auth/me`,
so a revoked session stops working immediately.

`proxy.ts` only checks that the cookie exists (a fast redirect). It is not a security
boundary: pages call `requireUser()`, and the backend authorizes everything.

### API conventions

- All calls go through `apiRequest()` in `src/lib/api/client.ts`. It throws `ApiError`
  with the backend's error `code`. Branch on `code`, never on `message`.
- Feature request/response types live in `features/<domain>/types.ts` and mirror the
  backend serializers.
- Endpoints the backend lacks are tracked in [`docs/backend-dependencies.md`](docs/backend-dependencies.md).
  Never call an endpoint that is not there.

### Find Games marketplace

Public pages call the API **from the browser** (the backend rate-limits per IP; proxying
through Next would make every visitor share one limit). Signed-in-only calls (join, cancel,
`myParticipation`) go through server actions in `features/games/actions.ts`, because the
session token is an httpOnly cookie.

| Route | What it does |
| --- | --- |
| `/games` | Find Games. Filters live in the URL (`features/games/filters.ts`) |
| `/turkey-bowl` | Same browser, fixed to the campaign in `src/config/campaigns.ts` |
| `/games/[slug]` | Details + join (guest form, or one tap when signed in) |
| `/list-your-game` | Listing form → "Check your email" with resend |
| `/games/verify#token=…` | Confirms the listing (one API call per token, StrictMode-safe) |
| `/games/[slug]/manage#token=…` | Organizer tools via `X-Manage-Token` |
| `/games/[slug]/participation/[id]#token=…` | Guest cancels via `X-Participation-Token` |

**Times:** games are on Eastern Time and the API has no timezone, so all display and form
input uses `America/New_York` (`lib/datetime/eastern-time.ts`), whatever the device zone.

**Emailed tokens:** `src/instrumentation-client.ts` moves `#token=…` into `sessionStorage`
and clears the hash before the app is interactive. Anything that reads the URL
(analytics, error reporting) must be initialised **after** that call.

**Temporary:** `features/email-capture/` is a self-contained signup used once on `/games`.
Delete the folder and its usage to remove it.

### Maps & locations

Google Maps runs in the browser only (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`;
see `.env.example`). The backend has no Google key. Without a key, every map feature hides itself
and manual address entry still works.

| Piece | Where |
| --- | --- |
| Loader (script added once, retryable, `gm_authFailure` aware) | `lib/maps/loader.ts`, `useMapsLibrary()` |
| Place → game fields, directions URL | `lib/maps/place-selection.ts` |
| `useUserLocation()`: one-shot, on click only, never stored | `hooks/use-user-location.ts` |
| `GoogleMap`, `GoogleMapMarker`, `GoogleMapPreview`, `GoogleMapDirectionsLink`, `GoogleMapLocationPicker` | `components/maps/` |
| `AddressAutocomplete` (Places New, session tokens), `PlacesSearch` (text/nearby sports places) | `components/locations/` |
| `VenueFinder`: fills the game form's location fields | `features/games/components/venue-finder.tsx` |

Google results are physical places, not LeagueUp venues: a park is not necessarily an available field,
and the UI says so. Game details geocode the stored address in the browser, because games don't store
coordinates yet (see `docs/backend-dependencies.md`).

### Brand

Tokens live in `src/app/globals.css`: navy `#071426` background, electric lime `#A6FF4D`
as `primary` (actions, active states, highlights only), Barlow Condensed for display
(`.font-display`), Inter for body text, `.field-lines` for the yard-line motif.
