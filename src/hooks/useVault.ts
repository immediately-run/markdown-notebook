/* Owns the vault: loads it from disk, tracks per-note bodies, and persists edits
   (debounced) via the storage layer. Identifies notes by base name in the UI
   (unique within a vault) while persisting by full filesystem path. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Backend } from '../lib/storage';
import { createFolder as persistNewFolder, createNote as persistNewNote, loadVault, saveNote } from '../lib/storage';
import type { VaultFile } from '../lib/vault';
import { baseName } from '../lib/vault';

const SAVE_DELAY = 450;

export interface Vault {
  files: VaultFile[];
  folders: string[];
  backend: Backend;
  loading: boolean;
  dirty: Set<string>;
  setBody: (base: string, body: string) => void;
  newFile: () => string;
  newFolder: () => void;
}

export function useVault(): Vault {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [backend, setBackend] = useState<Backend>('memory');
  const [loading, setLoading] = useState(true);
  // Last-persisted body per path; a note is "dirty" when its body differs.
  const [saved, setSaved] = useState<Record<string, string>>({});

  // Latest files/folders for use inside debounced timers and event handlers,
  // refreshed after each commit (never read or written during render).
  const filesRef = useRef<VaultFile[]>([]);
  const foldersRef = useRef<string[]>([]);
  useEffect(() => { filesRef.current = files; foldersRef.current = folders; }, [files, folders]);

  useEffect(() => {
    let alive = true;
    loadVault().then((snap) => {
      if (!alive) return;
      const s: Record<string, string> = {};
      for (const f of snap.files) s[f.path] = f.body;
      setSaved(s);
      setFiles(snap.files);
      setFolders(snap.folders);
      setBackend(snap.backend);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const schedulePersist = useCallback((path: string) => {
    clearTimeout(timers.current[path]);
    timers.current[path] = setTimeout(() => {
      const entry = filesRef.current.find((f) => f.path === path);
      if (!entry) return;
      const body = entry.body;
      saveNote(path, body, filesRef.current, foldersRef.current).then(() => {
        setSaved((prev) => ({ ...prev, [path]: body }));
      });
    }, SAVE_DELAY);
  }, []);

  const setBody = useCallback((base: string, body: string) => {
    const entry = filesRef.current.find((f) => baseName(f.path) === base);
    const path = entry?.path;
    if (!path) return;
    setFiles((cur) => cur.map((f) => (f.path === path ? { ...f, body } : f)));
    schedulePersist(path);
  }, [schedulePersist]);

  const newFile = useCallback((): string => {
    const taken = new Set(filesRef.current.map((f) => baseName(f.path)));
    let n = 'Untitled', i = 1;
    while (taken.has(n)) n = 'Untitled ' + ++i;
    const path = n + '.md';
    const body = '# ' + n + '\n\n';
    const next = [...filesRef.current, { path, body }];
    setFiles(next);
    setSaved((prev) => ({ ...prev, [path]: body }));
    persistNewNote(path, body, next, foldersRef.current);
    return n;
  }, []);

  const newFolder = useCallback(() => {
    let n = 'New folder', i = 1;
    while (foldersRef.current.includes(n)) n = 'New folder ' + ++i;
    const next = [...foldersRef.current, n];
    setFolders(next);
    persistNewFolder(n, filesRef.current, next);
  }, []);

  const dirty = useMemo(() => {
    const s = new Set<string>();
    for (const f of files) if (f.body !== saved[f.path]) s.add(baseName(f.path));
    return s;
  }, [files, saved]);

  return { files, folders, backend, loading, dirty, setBody, newFile, newFolder };
}
