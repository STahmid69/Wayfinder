# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server (choose platform in terminal)
npx expo start

# Platform-specific
npx expo start --web
expo run:ios
expo run:android

# Lint
npm run lint
```

There is no test suite configured.

## Architecture Overview

**The Wayfinder** is a convoy road-trip app (React Native + Expo Router) where a group of cars tracks each other in real time, communicates via Push-to-Talk, and coordinates stops via chat/votes/ledger.

### App Flow

```
onboarding (set name + color) → lobby (create/join convoy code) → (tabs)
```

`app/_layout.tsx` drives this via `ConvoyContext`: if `myName` is unset → `/onboarding`; if `convoyId` is unset → `/lobby`; otherwise → `/(tabs)`.

### Three Context Providers

Providers are nested: `AuthProvider > ConvoyProvider > NavigationProvider`.

**`ConvoyContext`** (`contexts/ConvoyContext.tsx`) is the core of the app. It manages all live convoy state:
- Connects to a Supabase **Realtime channel** (`convoy:<code>`) when `convoyId` is set.
- Uses **Presence** (tracked via `channel.track()`) to broadcast each member's GPS position, speed, driver status, and PTT state to all members automatically.
- Uses **Broadcast** events (`chat`, `vote_new`, `vote_cast`, `ledger`, `ptt`, `hazard`, `sos`) for all other real-time messaging. State is in-memory and ephemeral — not persisted to the database.
- Identity and convoy membership are persisted via `AsyncStorage` (native) and `localStorage` (web).
- Past trip summaries are stored locally in `AsyncStorage` under `wayfinder_past_convoys`.

**`NavigationContext`** (`contexts/NavigationContext.tsx`) handles turn-by-turn navigation:
- Fetches routes from **OpenRouteService** (`EXPO_PUBLIC_ORS_API_KEY`).
- Tracks off-route deviation (>80m threshold) and auto-reroutes with a 10s cooldown.
- Decodes ORS polylines (Google Polyline Algorithm) and computes step progress from GPS updates.

### Platform-Specific Files

The codebase uses Expo's platform extension pattern (`.web.tsx` / `.web.ts`) to swap implementations:

| File | Native | Web |
|------|--------|-----|
| `components/NativeMap` | WebView wrapping Leaflet JS (no API key needed) | `react-leaflet` component |
| `components/VoiceEngine` | Agora RTC (`react-native-agora`) | No-op stub |
| `lib/agora` | `react-native-agora` | Mock object |
| `hooks/use-color-scheme` | `useColorScheme` from RN | Web-adapted version |

**Important:** `react-native-maps` is only loaded on native via a conditional `require()` in `app/(tabs)/index.tsx`. The web fallback renders a placeholder. `NativeMap.tsx` (the WebView/Leaflet approach) is the actual map used on iOS/Android — it communicates with the Leaflet JS inside the WebView via `postMessage`.

### Styling

All styling uses **twrnc** (`lib/tailwind.ts`). Import `tw` from there, not from `twrnc` directly. Call `useDeviceContext(tw)` in root layout components for dark mode reactivity.

Design system ("Rugged Editorial"):
- **Dark:** bg `#121212`, surface `#1C1C1E`, accent `#FF6A00`
- **Light:** bg `#FAFAFA`, surface `white`, accent `#FF6A00`
- Text: `uppercase tracking-widest font-bold/black` is the house style for labels and headers.

### Required Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_ORS_API_KEY=        # OpenRouteService, for turn-by-turn routing
```

### Supabase Setup

The `database_schema.sql` file contains the full schema. The app primarily uses Supabase **Realtime channels** (Presence + Broadcast) rather than direct DB queries — convoy data is not persisted to the DB during a live session.

### PTT / Voice

Agora is the PTT backend (`lib/agora.ts`). `VoiceEngine.tsx` (native) integrates `react-native-agora`; `VoiceEngine.web.tsx` is a no-op. The `setTalking()` action in `ConvoyContext` broadcasts PTT state so other members can see who is transmitting without needing Agora connected.
