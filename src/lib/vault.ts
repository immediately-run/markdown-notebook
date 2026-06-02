/* Vault model + helpers. A vault is a set of markdown files addressed by their
   filesystem path (e.g. "Projects/Aurora/Roadmap.md"), plus the folders that
   contain them. Wiki-links and tabs resolve by base name (the file name without
   its .md extension), mirroring Obsidian. Base names are unique within a vault. */

export interface VaultFile { path: string; body: string; }

export type VaultNode =
  | { type: 'folder'; name: string; path: string; children: VaultNode[] }
  | { type: 'file'; name: string; path: string };

export interface VaultIndexEntry { name: string; path: string; base: string; }

export const baseName = (name: string): string => name.replace(/\.md$/i, '').replace(/^.*\//, '');
export const dirOf = (path: string): string => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
export const joinPath = (dir: string, name: string): string => (dir ? dir + '/' + name : name);

/* Build a nested folder/file tree from a flat list of file paths plus any
   explicitly-created (possibly empty) folder paths. Folders sort before files,
   then alphabetically — stable and filesystem-like. */
export function buildTree(files: VaultFile[], folders: string[] = []): VaultNode[] {
  const root: VaultNode[] = [];
  const folderMap = new Map<string, VaultNode[]>(); // folder path -> children array
  folderMap.set('', root);

  const ensureFolder = (path: string): VaultNode[] => {
    if (folderMap.has(path)) return folderMap.get(path)!;
    const parent = ensureFolder(dirOf(path));
    const name = path.slice(path.lastIndexOf('/') + 1);
    const node: VaultNode = { type: 'folder', name, path, children: [] };
    parent.push(node);
    folderMap.set(path, node.children);
    return node.children;
  };

  for (const f of folders) if (f) ensureFolder(f);
  for (const f of files) {
    const parent = ensureFolder(dirOf(f.path));
    const name = f.path.slice(f.path.lastIndexOf('/') + 1);
    parent.push({ type: 'file', name, path: f.path });
  }

  const sort = (nodes: VaultNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) if (n.type === 'folder') sort(n.children);
  };
  sort(root);
  return root;
}

/* base name -> { name, path } for wiki-link / quick-switch resolution. */
export function buildIndex(files: VaultFile[]): Record<string, VaultIndexEntry> {
  const out: Record<string, VaultIndexEntry> = {};
  for (const f of files) {
    const name = f.path.slice(f.path.lastIndexOf('/') + 1);
    out[baseName(name)] = { name, path: f.path, base: baseName(name) };
  }
  return out;
}

/* Collect #tags across the vault -> tag -> base names that use it. */
export function buildTags(files: VaultFile[]): Record<string, string[]> {
  const m: Record<string, string[]> = {};
  for (const f of files) {
    const base = baseName(f.path);
    const found = new Set<string>();
    (f.body.match(/(^|\s)#([A-Za-z][\w/-]*)/g) || []).forEach((x) => found.add(x.trim().slice(1)));
    found.forEach((tag) => { (m[tag] = m[tag] || []).push(base); });
  }
  return m;
}
