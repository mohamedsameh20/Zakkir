# Zakkir Android

This directory contains the Android-only mobile client for Zakkir.

## Development

Install dependencies inside `mobile/`, then start Expo:

```bash
npm install
npm run start
```

Use Expo Go or an Android emulator. The first milestone intentionally excludes iOS, desktop window controls, and desktop window settings.

## Current Scope

- The same renderer, themes, icon, fonts, Azkar data, and settings UI as the desktop app
- Bundled Azkar data shared from the repository root
- Local settings persistence
- Prayer times from the AlAdhan API
- Android WebView shell with mobile-safe full-screen layout

Next milestones will add Android location permissions, scheduled local notifications, offline prayer caching, and a proper city search screen.
