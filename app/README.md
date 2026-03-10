# Viral Studio — Next.js App

Dashboard UI for the Viral Studio pipeline (12-col grid layout, Tailwind).

## Layout

- **Header** (64px): Logo, Trends, Create, Library, Analytics, Profile
- **Sidebar** (240px): Dashboard, Trend Radar, Idea Generator, Scripts, Scene Builder, Video Studio, Mass Factory, Library, Analytics, Settings
- **Main**: Video Generator card, Script Editor (Notion-style), Video Preview (9:16)
- **Right panel**: AI agent toggles, Analytics placeholder

## Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Backend

Point the app at your Viral Studio API (e.g. Railway) via `NEXT_PUBLIC_API_URL` and optional `NEXT_PUBLIC_API_KEY` when you add API calls.
