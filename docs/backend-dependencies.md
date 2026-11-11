# Backend dependencies

What the frontend brief needs that `leagueup_be` does not provide yet. Audited 2026-11-10
against `leagueup_be` commit `7a1015e` plus its uncommitted working tree.

**Rule:** the frontend never calls an endpoint listed here until it exists. No mock data
is wired in yet. If a screen needs a placeholder, it goes in `src/mocks/`, behind an
explicit flag, and is never mixed into real API responses.

## What exists today (`/api/v1`)

| Endpoint | Auth | Used by frontend |
| --- | --- | --- |
| `POST /auth/register` | — | Signup (server action) |
| `POST /auth/login` | — | Login (server action) |
| `POST /auth/logout` | Bearer | Logout (server action) |
| `GET /auth/me` | Bearer | Session check (`getCurrentUser`) |
| `GET /games`, `GET /games/:slug` | optional Bearer | Find Games, Turkey Bowl, details (browser); `myParticipation` (server, Bearer) |
| `POST /games`, `/games/verify`, `/games/:id/resend-link` | — | List your game, confirm page, resend forms |
| `POST /games/:id/join` | — / Bearer | Guest join (browser), signed-in join (server action) |
| `PATCH/DELETE /games/:id`, participants routes | `X-Manage-Token` / `X-Participation-Token` / Bearer | Manage page, guest request page, signed-in cancel |
| `POST /email-captures` | — | Temporary signup on `/games` |

The backend emails links to these frontend routes, all served now (the token is in the URL
fragment, so it never reaches a server log):

- `/games/verify#token=…`
- `/games/:slug/manage#token=…`
- `/games/:slug/participation/:participantId#token=…`

## The structural gap

`leagueup_be/CLAUDE.md` states the league domain (organizations, leagues, seasons,
divisions, teams, players, invitations, standings, statistics) was **deliberately removed**
and must not be reintroduced unless specifically requested. The frontend brief is built
around that domain. It needs a product decision before either side builds it.

## Missing endpoints, by brief section

### Auth (brief §5B)
- `POST /auth/forgot-password` `{ email }` → always `{ accepted: true }` (no account enumeration). Emails `/reset-password#token=…`.
- `POST /auth/reset-password` `{ token, password }` → `{ reset: true }`. Revokes all sessions.

### Profile (brief §5C)
`User` has only name and email. Needs a profile model or columns:
- `GET /me/profile`, `PATCH /me/profile`: `username` (unique), `location`, `bio`, `primarySport`, `sportsInterests[]`, `preferredPositions[]`, `experienceLevel?`
- `POST /me/profile/photo`: needs a storage decision (S3/R2 + signed upload).
- `GET /players/:username`: public profile.

### Find Games marketplace: gaps found while building it
- **Guest request status:** a guest can cancel from their link but cannot read their request's status (no endpoint), so the page shows none.
- **No "my games" list** (`GET /me/games`), so signed-in players only see a request on that game's page.
- **Same email, guest then signed in:** `myParticipation` matches by email, but cancelling as a member requires `participant.userId` to match. A request made as a guest and later viewed while signed in with the same email shows as pending, but the member cancel is refused; that player must use the emailed guest link.

### Maps & venues (Google Maps brief, §7–10): frontend-only for now
The frontend has maps, autocomplete and place search, but stores locations in the existing flat game
fields. Not built, pending these backend contracts:
- **Coordinates on games:** `latitude`, `longitude`, `placeId` (nullable) on `Game`, accepted by `POST /games`
  and `PATCH /games/:id`. The form already has them from Google; today they are dropped, and game details
  re-geocode the address on every visit (Geocoding API cost).
- **Venues:** `GET/POST/PATCH/DELETE /venues`, `{ id, name, fieldName?, notes?, address, city, state, postalCode,
  latitude, longitude, placeId? }`, plus `venueId` on games. **Open question:** who may create, edit or reuse
  a venue, given that organizers have no accounts (only emailed manage links).
- **Nearby discovery:** `GET /games/nearby?lat&lng&radiusMiles=5|10|25|50` (or `lat/lng/radius` on `GET /games`),
  returning distance per game. Needs coordinates stored first. Unlocks list/map views and distance filters.
- **Leagues and teams nearby:** blocked on the league domain decision below.

### My Sports dashboard (brief §5K)
- `GET /me/games`: games the user requested/joined (data exists: `GameParticipant.userId`).
- `GET /me/teams`, `GET /me/leagues`: blocked on the league domain.

### League domain (brief §5D–J): blocked on the product decision
Leagues, seasons, teams, rosters, invitations, league schedules, scores, configurable
standings, commissioner/manager dashboards. Each read response should carry a
`permissions` object (e.g. `{ canEdit, canManageRoster, canRecordScores }`) computed
server-side from scoped roles, so the UI shows actions without a global `User.role`.
