# PawMates (Expo / React Native)

A clickable, mock-data-only implementation of a PawMates design handoff —
a dog-walking marketplace connecting owners with walkers, built from a
Claude Design prototype (Spanish-language UI, "Industry" design system).

No backend: everything is in-memory (React Context), matching the scope
of the original design prototype.

## Screens

1. **Onboarding** — pet profile (size, temperament, vaccines).
2. **Home** — walker discovery, list or map view.
3. **Walker profile** — bio, verification badges, reviews.
4. **Booking** — recurring walk scheduling (days/time/duration).
5. **Checkout** — price breakdown, tip, payment method.
6. **Live walk** — GPS route mock, quick contact, walk log.
7. **Dashboard** — walker mode: earnings, weekly stats, incoming requests.

Tap the avatar on Home to switch into walker mode (Dashboard); tap "Modo
dueño" on Dashboard to switch back — mirrors the owner/walker mode switch
described in the design doc.

## Design system

All colors, fonts, spacing, radii and shadows come from one file,
`src/theme/tokens.ts`: coral on warm cream, mint for done/verified, sun
for time/attention, rose for cancelled, grape for messages; Barlow for
headlines and Figtree for body text.

## Run it

```
npm install
npx expo start     # then scan the QR with Expo Go (iOS/Android) — no simulator needed
```

Or with a simulator / browser installed:

```
npm run ios        # requires Xcode
npm run android     # requires Android Studio
npm run web         # runs in any browser
```

## Tests

```
npm run typecheck    # the app and the end-to-end tests
npm test             # unit tests (Jest, src/**/__tests__)
npm run check:shared # the lists shared with pawmates-backend still match
npm run test:e2e     # end-to-end, see below
```

`npm run test:e2e` opens the real app in a real browser against the real
backend, on a throwaway database: an owner signs up, books a walk that the
business accepts, a business waits for approval, a live walk is followed
from the owner's phone, and the login lockout kicks in. It expects
`pawmates-backend` next to this repo (or `PAWMATES_BACKEND_DIR`), builds
and starts both on their own, and needs Playwright's Chromium
(`npx playwright install chromium`, or `PW_CHROMIUM_PATH` pointing at an
installed one).

GitHub runs all of this on every push, in both repos.

## Live web preview

Every push to `main` rebuilds the web export and redeploys it to the
`gh-pages` branch via `.github/workflows/deploy-pages.yml`. With GitHub
Pages set to "Deploy from a branch → gh-pages / (root)" in the repo
settings, that's published at:

https://monrodolfo2020.github.io/pawmates/
