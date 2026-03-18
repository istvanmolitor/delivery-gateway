# Csomagautomata-kereső (React + TypeScript)

Ez a projekt egy térképes pickup point választó komponens implementációja a megadott publikus GraphQL API-val.

## Indítás

1. `npm install`
2. `npm run dev`
3. Böngésző: `http://localhost:3000`

`localhost:3000` azért fix, mert az API CORS/referrer oldalon ez van engedélyezve.

## Build

- `npm run build`
- `npm run preview`

## Használt technológiák és indoklás

- `Vite + React + TypeScript`: gyors fejlesztés, szigorú típusosság.
- `react-leaflet + OpenStreetMap`: ingyenes, kulcs nélküli térkép.
- `react-leaflet-markercluster`: nagy marker mennyiségnél használható marad a UI.
- Kliens oldali GraphQL fetch (`fetch`): kis függőség, egyszerű hibakezelés.

## Teljesítmény és skálázás (10k+)

- Nem töltjük le a teljes világadatot egyszerre.
- Lekérés mindig aktuális térkép bounds alapján történik (`filters.boundingBox`).
- Paginált betöltés batch-ekben (`first + page`), aborttal újratöltéskor.
- Debounce map mozgatás után, hogy ne induljon túl sok request.
- Marker klaszterezés a DOM terhelés csökkentésére.
- Render cap: egyszerre legfeljebb 5000 pont jelenik meg.

## Funkciók

- Marker alapú pickup point megjelenítés térképen.
- Város/cím keresés (geokódolás), map ugrás a találatra.
- Marker kattintásra info panel:
  - név
  - cím
  - típus
  - nyitvatartás
- `Kiválasztom` gomb: kiválasztott csomagpont `id` mentése komponens állapotba.
- Betöltési és hibaállapotok:
  - GraphQL hibák
  - térkép csempe betöltési hiba
