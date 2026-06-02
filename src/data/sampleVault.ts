/* Seed vault written to disk on first run. Plain .md content per note; wiki-links
   resolve by the file's base name. Nested folders mirror normal filesystem
   semantics. No components here — just data (keeps the Fast Refresh rule happy). */
import type { VaultFile } from '../lib/vault';

const README = `# Welcome to your vault

Every note here is a plain **markdown file** on disk — nothing proprietary. Drop them into folders, link them together with \`[[wiki-links]]\`, and write in the **source** pane while the **preview** updates live beside it.

> [!tip] How it works
> Type in the editor on the left. The preview on the right re-renders as you go. Click any [[Aurora Overview|wiki-link]] to jump to another note.

## Start here
- [[Aurora Overview]] — the project I'm building
- [[Reading list]] — articles and books queued up
- [[Markdown cheatsheet]] — every syntax this preview supports

## This week
- [x] Reorganize the vault into folders
- [x] Write the [[Aurora Overview]]
- [ ] Flesh out the [[Roadmap]]
- [ ] Reply to #design feedback from [[Standup notes]]

#meta #start`;

const OVERVIEW = `# Aurora Overview

Aurora is a small tool for **turning long voice memos into structured notes**. Record a thought, get back a clean outline with action items pulled out.

> [!note] One-line pitch
> Talk for two minutes, get a tidy note you'd actually keep.

## Why
I take voice memos constantly and never revisit them. The transcript is a wall of text; the *ideas* are buried. Aurora does the extraction so the memo becomes useful. #idea

## How it fits together
1. Capture — record or drop an audio file
2. Transcribe — on-device, no upload
3. Structure — headings, bullets, and a **tasks** section
4. File — save straight into a markdown vault like this one

See the [[Roadmap]] for what's shipping when, and [[Standup notes]] for the latest decisions.

## Open questions
- [ ] How long can a memo be before structuring gets unreliable? #todo
- [ ] Do we keep the raw transcript, or just the structured note?
- [x] Pick a name → **Aurora** #design

#project #aurora`;

const ROADMAP = `# Roadmap

Where [[Aurora Overview|Aurora]] is headed. Dates are soft.

## Now — capture & transcribe
- [x] Microphone capture
- [x] On-device transcription
- [ ] Drag-and-drop audio files #todo

## Next — structure
- [ ] Outline extraction
- [ ] Pull action items into a **Tasks** block
- [ ] Detect topics and suggest #tags

> [!warning] Risk
> Structuring quality depends entirely on transcript accuracy. Bad audio in, messy notes out. We need a confidence indicator before this ships.

## Later — the vault
- [ ] Save notes as plain \`.md\`
- [ ] Two-way [[wiki-links]] between memos
- [ ] Daily note that collects the day's captures

Back to [[Aurora Overview]].

#project #aurora #roadmap`;

const STANDUP = `# Standup notes

## 2026-05-29 #meeting
Present: me, Priya, Sam.

> [!important] Decision
> Transcription stays **on-device**. No audio leaves the machine — it's the whole privacy story. Revisit only if quality is unacceptable.

- [x] Agreed on the name [[Aurora Overview|Aurora]]
- [ ] Priya: prototype the outline extractor by Tuesday #todo
- [ ] Sam: spike a confidence score for transcripts #todo
- [ ] Me: update the [[Roadmap]]

## 2026-05-22 #meeting
- Talked through the #design language — leaning calm, type-forward.
- ~~Considered a mobile-first build~~ → desktop first, it's a writing tool.

#aurora`;

const READING = `# Reading list

Things to read, watch, or revisit. Tag with #reading when queued, check off when done.

## Articles
- [ ] *The Whole-Brain Note* — on atomic notes #reading
- [x] *Local-first software* — read it twice, holds up #reading
- [ ] *Designing calm software* #reading #design

## Books
- [ ] *Thinking in Systems* — Meadows
- [x] *The Pragmatic Programmer*

## Watch later
- [ ] Talk: "Plain text as a platform"

> [!quote]
> "We shape our tools, and thereafter our tools shape us."

Related: [[Aurora Overview]] is partly inspired by this list never shrinking.

#reading`;

const DAILY_29 = `# 2026-05-29

## Log
- Morning: [[Standup notes|standup]], wrote up the decision on on-device transcription.
- Afternoon: sketched the live-preview layout. Source left, preview right — felt right immediately.

## Captured ideas
- A note's *backlinks* matter as much as its content. #idea
- What if the preview could fold long sections? #idea

## Tomorrow
- [ ] Start the [[Roadmap]] "Next" section #todo
- [ ] Read one thing off the [[Reading list]] #reading

#daily`;

const DAILY_28 = `# 2026-05-28

## Log
- Set up this vault. Moved everything out of one giant file into [[Aurora Overview]], [[Roadmap]], and per-day notes.
- Felt good. Folders + links beat one endless document.

## Captured ideas
- The hardest part of notes isn't writing them, it's *finding* them later. Links help. #idea

## Tomorrow
- [x] Reorganize into folders
- [ ] Write the overview

#daily`;

const CHEATSHEET = `# Markdown cheatsheet

Everything this preview renders.

## Text
**Bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

## Headings
Use \`#\` through \`######\` for levels one to six.

## Lists
- A bullet
  - A nested bullet
- Another bullet

1. First
2. Second

## Tasks
- [x] A finished task
- [ ] An unfinished task

## Links
- External: [immediately.run](https://immediately.run)
- Internal: [[Aurora Overview]] or with an alias [[Roadmap|the plan]]

## Tags
Inline #tags become clickable — open the **Tags** view in the sidebar.

## Quotes & callouts
> A plain blockquote.

> [!note] Note
> Callouts come in flavors: note, tip, info, warning, important, quote.

> [!tip] Tip
> Start a callout with \`> [!type] Title\`.

## Divider
---

That's the whole syntax. #reference`;

const SHORTCUTS = `# Shortcuts

A few that matter.

- **New note** — \`Ctrl N\`
- **Quick switch** — \`Ctrl O\`
- **Toggle preview** — \`Ctrl E\`

#reference`;

const INBOX = `# Inbox

Quick captures to sort later. Nothing here is organized — that's the point.

- Idea: a "random note" button for rediscovery #idea
- Ask Sam about the confidence score → see [[Standup notes]]
- [ ] Move these into real notes #todo

#inbox`;

export const SAMPLE_FILES: VaultFile[] = [
  { path: 'Projects/Aurora/Aurora Overview.md', body: OVERVIEW },
  { path: 'Projects/Aurora/Roadmap.md', body: ROADMAP },
  { path: 'Projects/Aurora/Standup notes.md', body: STANDUP },
  { path: 'Projects/Reading list.md', body: READING },
  { path: 'Daily/2026-05-29.md', body: DAILY_29 },
  { path: 'Daily/2026-05-28.md', body: DAILY_28 },
  { path: 'Reference/Markdown cheatsheet.md', body: CHEATSHEET },
  { path: 'Reference/Shortcuts.md', body: SHORTCUTS },
  { path: 'README.md', body: README },
  { path: 'Inbox.md', body: INBOX },
];

export const SAMPLE_FOLDERS: string[] = ['Projects', 'Projects/Aurora', 'Daily', 'Reference'];
