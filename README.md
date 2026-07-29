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

Visual tokens (`src/theme/tokens.ts`) mirror the source Industry design
system 1:1 — steel-blue accent, Barlow Condensed headings over Barlow body
text, square-cornered "blueprint" cards with corner registration marks
(`src/components/CornerMarks.tsx`), no rounded corners except where the
source system uses none.

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
