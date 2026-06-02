# Markdown Notes

A simplified, Obsidian-inspired markdown notetaking app that runs entirely in the
browser on [immediately.run](https://immediately.run) — no server, no build step
at runtime. Each note is a plain `.md` file with normal filesystem semantics
(nest them in folders), edited in a syntax-highlighted **source** pane with a
**live preview** beside it.

## Try it instantly

Try this app on [immediately.run](https://immediately.run/present/github/immediately-run/markdown-notebook/main/files/src/App.tsx)

## What it does

- **Side-by-side editor** — markdown source on the left, live-rendered preview on
  the right, with a draggable divider.
- **Three layouts** (top bar): **Split**, **Stacked** (source over preview), and
  **Focus** (⌘E — hides the sidebar for a centered reading column).
- **Vault sidebar** — nested folders, a recursive file tree, new note / new
  folder, and a **Tags** view that lists every `#tag` and the notes using it.
- **Markdown** — headings, bold/italic/strike, lists, **task checkboxes** (toggle
  in the preview and it writes back to the source), blockquotes, Obsidian-style
  **callouts** (`> [!tip] Title`), fenced code, links, images, and `#tags`.
- **[[Wiki-links]]** between notes (with `|aliases`); broken links are dimmed.
- **Quick switch** (⌘O) — a command palette to jump to any note.
- **Tweaks** — editor font (mono ↔ sans) and size, plus a light/dark theme
  toggle. Preferences persist across reloads.

## Persistence

Edits are saved as real `.md` files under a `vault/` directory using the
sandbox's shared filesystem (`import('fs')` → `fs.promises`), so changes survive
reloads with normal filesystem semantics. Where that filesystem isn't available
(local `vite dev`/`preview`), it transparently falls back to `localStorage`, so
the app still works end-to-end. See `src/lib/storage.ts`.

## How it's organized

immediately.run renders the **default export of `src/App.tsx`** — that's the
entry point, not `main.tsx`.

```
src/
  App.tsx               # ROOT: default export + global CSS imports; owns app state
  index.css             # fonts, design tokens (dark + light), base resets
  App.css               # layout + component styles
  components/           # one default-exported component per file
    TopBar · ActivityBar · FileTree · TagsView ·
    SourceEditor · Preview · QuickSwitch · TweaksPanel · Icon
  hooks/
    useVault.ts          # loads the vault, tracks bodies, debounced persistence
    useTweaks.ts         # font/size/theme, persisted to localStorage
  lib/
    markdown.ts          # markdown → HTML + the source-overlay highlighter
    vault.ts             # vault model, tree/index/tag builders
    storage.ts           # fs.promises persistence with a localStorage fallback
    icons.ts             # shared Lucide-style SVG path set
  data/
    sampleVault.ts       # seed notes written to disk on first run
```

## Develop

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev      # local dev server
npm run build    # tsc -b && vite build — must pass with no type errors
npm run lint     # eslint — enforces the React Fast Refresh / HMR rule
npm run preview  # serve the production build
```

See [`CLAUDE.md`](./CLAUDE.md) for the rules that keep the app working on
immediately.run (global CSS imported from `App.tsx`, component files exporting
only components, pulling design tokens from `index.css`, etc.).
