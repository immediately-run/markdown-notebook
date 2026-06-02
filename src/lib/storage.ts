/* Persistence for the vault. On immediately.run, app code can `import('fs')` to
   reach the sandbox's shared filesystem (rooted at the project root, backed by
   the parent window over ZenFS) — async `fs.promises.*` only. We write each note
   as a real .md file under `vault/`, so edits survive reloads with normal
   filesystem semantics.

   Under local `vite dev`, the @immediately-run/dev-fs plugin resolves this
   `import('fs')` to a bridge backed by the real local disk, so the fs backend is
   used locally too. In a production build `fs` is external (provided by the
   sandbox); where it's genuinely unavailable (e.g. `vite preview`), the import
   throws and we fall back to localStorage so the app still works end-to-end. */
import type { VaultFile } from './vault';
import { dirOf } from './vault';
import { SAMPLE_FILES, SAMPLE_FOLDERS } from '../data/sampleVault';

const ROOT = 'vault';
const LS_KEY = 'mdnotes:vault';

export type Backend = 'fs' | 'local' | 'memory';
export interface VaultSnapshot { files: VaultFile[]; folders: string[]; backend: Backend; }

interface FsLike {
  readFile(path: string, enc: string): Promise<string>;
  writeFile(path: string, data: string): Promise<void>;
  mkdir(path: string, opts?: { recursive?: boolean }): Promise<unknown>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<{ isDirectory(): boolean }>;
}

let fsCache: FsLike | null | undefined;

async function getFs(): Promise<FsLike | null> {
  if (fsCache !== undefined) return fsCache;
  fsCache = null;
  try {
    // Resolved by vite + @immediately-run/dev-fs under `vite dev`; external (the
    // sandbox's shared fs) in the production build; throws where fs is genuinely
    // absent (e.g. `vite preview`), where we fall back to localStorage.
    const mod = (await import('fs')) as unknown as Record<string, unknown> & { default?: Record<string, unknown> };
    const cand = (mod.promises ?? mod.default?.promises ?? mod.default ?? mod) as FsLike;
    if (cand && typeof cand.readFile === 'function' && typeof cand.writeFile === 'function') {
      fsCache = cand;
    }
  } catch {
    /* fs unavailable — fall back to localStorage */
  }
  return fsCache;
}

const abs = (rel: string) => (rel ? ROOT + '/' + rel : ROOT);

async function ensureDir(fs: FsLike, relDir: string) {
  await fs.mkdir(abs(relDir), { recursive: true });
}

async function writeFileFs(fs: FsLike, path: string, body: string) {
  const d = dirOf(path);
  if (d) await ensureDir(fs, d);
  await fs.writeFile(abs(path), body);
}

async function walkFs(fs: FsLike, rel: string, files: VaultFile[], folders: string[]) {
  const names = await fs.readdir(abs(rel));
  for (const name of names) {
    const childRel = rel ? rel + '/' + name : name;
    let isDir = false;
    try { isDir = (await fs.stat(abs(childRel))).isDirectory(); } catch { continue; }
    if (isDir) {
      folders.push(childRel);
      await walkFs(fs, childRel, files, folders);
    } else if (/\.md$/i.test(name)) {
      try { files.push({ path: childRel, body: await fs.readFile(abs(childRel), 'utf8') }); } catch { /* skip */ }
    }
  }
}

async function seedFs(fs: FsLike) {
  await fs.mkdir(abs(''), { recursive: true });
  for (const f of SAMPLE_FOLDERS) await ensureDir(fs, f);
  for (const f of SAMPLE_FILES) await writeFileFs(fs, f.path, f.body);
}

/* ----- localStorage backend ----- */
function readLocal(): { files: VaultFile[]; folders: string[] } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { files: Record<string, string>; folders: string[] };
    const files = Object.entries(parsed.files || {}).map(([path, body]) => ({ path, body }));
    return { files, folders: parsed.folders || [] };
  } catch { return null; }
}

function writeLocal(files: VaultFile[], folders: string[]) {
  try {
    const fileMap: Record<string, string> = {};
    for (const f of files) fileMap[f.path] = f.body;
    localStorage.setItem(LS_KEY, JSON.stringify({ files: fileMap, folders }));
  } catch { /* quota / unavailable — best effort */ }
}

/* ----- public API ----- */
export async function loadVault(): Promise<VaultSnapshot> {
  const fs = await getFs();
  if (fs) {
    try {
      let names: string[] = [];
      try { names = await fs.readdir(abs('')); } catch { names = []; }
      if (names.length === 0) await seedFs(fs);
      const files: VaultFile[] = [];
      const folders: string[] = [];
      await walkFs(fs, '', files, folders);
      if (files.length === 0) { await seedFs(fs); await walkFs(fs, '', files, folders); }
      return { files, folders, backend: 'fs' };
    } catch {
      /* fall through to local */
    }
  }
  const local = readLocal();
  if (local) return { ...local, backend: 'local' };
  // first run without fs: seed localStorage from the sample vault
  if (typeof localStorage !== 'undefined') {
    writeLocal(SAMPLE_FILES, SAMPLE_FOLDERS);
    return { files: SAMPLE_FILES.map((f) => ({ ...f })), folders: [...SAMPLE_FOLDERS], backend: 'local' };
  }
  return { files: SAMPLE_FILES.map((f) => ({ ...f })), folders: [...SAMPLE_FOLDERS], backend: 'memory' };
}

/* Persist a single note. `all`/`folders` are the current full state, used to keep
   the localStorage snapshot coherent when fs isn't the backend. */
export async function saveNote(path: string, body: string, all: VaultFile[], folders: string[]): Promise<void> {
  const fs = await getFs();
  if (fs) { try { await writeFileFs(fs, path, body); return; } catch { /* fall back */ } }
  writeLocal(all, folders);
}

export async function createNote(path: string, body: string, all: VaultFile[], folders: string[]): Promise<void> {
  const fs = await getFs();
  if (fs) { try { await writeFileFs(fs, path, body); return; } catch { /* fall back */ } }
  writeLocal(all, folders);
}

export async function createFolder(path: string, all: VaultFile[], folders: string[]): Promise<void> {
  const fs = await getFs();
  if (fs) { try { await ensureDir(fs, path); return; } catch { /* fall back */ } }
  writeLocal(all, folders);
}
