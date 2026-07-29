# PawMates (Expo / React Native)

A clickable, mock-data-only implementation of the PawMates design handoff
(see `../README.md`, `../chats/chat1.md`, `../project/PawMates.dc.html`) —
a dog-walking marketplace connecting owners with walkers.

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

Visual tokens (`src/theme/tokens.ts`) mirror
`../project/_ds/industry-.../styles.css` 1:1 — steel-blue accent, Barlow
Condensed headings over Barlow body text, square-cornered "blueprint" cards
with corner registration marks (`src/components/CornerMarks.tsx`), no
rounded corners except where the source system uses none.

## Run it

```
npm install
npm run ios      # or npm run android
npm run web       # quick preview in a browser (no simulator needed)
```
