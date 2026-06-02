// Root component — immediately.run renders the default export of THIS file.
// Global CSS is imported here (not in main.tsx) because immediately.run's runtime
// never loads main.tsx; anything the rendered tree needs must be reachable here.
import './index.css';
import './App.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import ActivityBar from './components/ActivityBar';
import type { SidebarView } from './components/ActivityBar';
import FileTree from './components/FileTree';
import Icon from './components/Icon';
import Preview from './components/Preview';
import QuickSwitch from './components/QuickSwitch';
import SourceEditor from './components/SourceEditor';
import TagsView from './components/TagsView';
import TopBar from './components/TopBar';
import type { Layout } from './components/TopBar';
import TweaksPanel from './components/TweaksPanel';
import { useTweaks } from './hooks/useTweaks';
import { useVault } from './hooks/useVault';
import { baseName, buildIndex, buildTags, buildTree } from './lib/vault';
import type { VaultFile } from './lib/vault';

function App() {
  const [tweaks, setTweak] = useTweaks();
  const { files, folders, loading, dirty, setBody, newFile, newFolder } = useVault();

  const [current, setCurrent] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [layout, setLayout] = useState<Layout>('split');
  const [view, setView] = useState<SidebarView>('files');
  const [qs, setQs] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [split, setSplit] = useState(50);
  const panesRef = useRef<HTMLDivElement>(null);

  const byBase = useMemo(() => {
    const m: Record<string, VaultFile> = {};
    for (const f of files) m[baseName(f.path)] = f;
    return m;
  }, [files]);
  const tree = useMemo(() => buildTree(files, folders), [files, folders]);
  const index = useMemo(() => buildIndex(files), [files]);
  const tags = useMemo(() => buildTags(files), [files]);

  // Once the vault has loaded, open a sensible first note. This is the
  // documented "adjust state while rendering" pattern, guarded so it runs once.
  if (!seeded && !loading) {
    const first = index['README'] ? 'README' : Object.keys(index)[0] ?? null;
    setCurrent(first);
    setTabs(first ? [first] : []);
    setSeeded(true);
  }

  const openFile = (base: string) => {
    if (!byBase[base]) return;
    setCurrent(base);
    setTabs((tb) => (tb.includes(base) ? tb : [...tb, base]));
  };

  const closeTab = (base: string) => setTabs((tb) => {
    const next = tb.filter((n) => n !== base);
    setCurrent((cur) => (cur === base ? (next[next.length - 1] ?? null) : cur));
    return next;
  });

  const onNewFile = () => { const base = newFile(); openFile(base); };

  const toggleTask = (raw: string, wasChecked: boolean) => {
    if (!current) return;
    const decoded = raw.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
    const body = byBase[current]?.body ?? '';
    const lines = body.split('\n');
    const from = wasChecked ? '[x]' : '[ ]';
    const to = wasChecked ? '[ ]' : '[x]';
    const escaped = decoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (let i = 0; i < lines.length; i++) {
      const re = new RegExp('^(\\s*[-*+]\\s+)\\[[ xX]\\](\\s+)' + escaped + '\\s*$');
      if (re.test(lines[i]) && lines[i].includes(from)) {
        lines[i] = lines[i].replace(/\[[ xX]\]/, to);
        break;
      }
    }
    setBody(current, lines.join('\n'));
  };

  // theme reflected onto <html>
  useEffect(() => { document.documentElement.dataset.theme = tweaks.theme; }, [tweaks.theme]);

  // keyboard: ⌘O quick switch, ⌘E focus toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') { e.preventDefault(); setQs(true); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault(); setLayout((l) => (l === 'focus' ? 'split' : 'focus'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // divider drag
  const startDrag = (e: ReactMouseEvent) => {
    e.preventDefault();
    const move = (ev: MouseEvent) => {
      const r = panesRef.current?.getBoundingClientRect();
      if (!r) return;
      let pct = layout === 'stack'
        ? ((ev.clientY - r.top) / r.height) * 100
        : ((ev.clientX - r.left) / r.width) * 100;
      pct = Math.max(22, Math.min(78, pct));
      setSplit(pct);
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const src = current ? (byBase[current]?.body ?? '') : '';
  const isFocus = layout === 'focus';
  const wordCount = src.split(/\s+/).filter(Boolean).length;

  return (
    <div className={`app lay-${layout}`}>
      <TopBar
        current={current}
        layout={layout}
        setLayout={setLayout}
        theme={tweaks.theme}
        toggleTheme={() => setTweak('theme', tweaks.theme === 'light' ? 'dark' : 'light')}
        onSearch={() => setQs(true)}
      />
      <div className="main">
        <ActivityBar
          view={view}
          setView={setView}
          onSearch={() => setQs(true)}
          onNew={onNewFile}
          onSettings={() => setTweaksOpen((o) => !o)}
        />
        <div className="sidebar">
          {view === 'tags'
            ? <TagsView tags={tags} openFile={openFile} />
            : <FileTree nodes={tree} current={current} openFile={openFile} dirty={dirty} onNewFile={onNewFile} onNewFolder={newFolder} />}
        </div>
        <div className="workspace">
          <div className="tabs">
            {tabs.map((name) => (
              <div key={name} className={`tab ${current === name ? 'on' : ''}`} onClick={() => setCurrent(name)}>
                <Icon name="file-text" size={13} style={{ opacity: 0.6 }} />
                {name}
                <span className={`x ${dirty.has(name) ? 'dirty' : ''}`}
                  onClick={(e) => { e.stopPropagation(); closeTab(name); }}>
                  {dirty.has(name)
                    ? <Icon name="circle" size={8} strokeWidth={5} />
                    : <Icon name="x" size={13} />}
                </span>
              </div>
            ))}
          </div>
          {current ? (
            <div className={`panes ${layout === 'stack' ? 'stack' : ''}`} ref={panesRef}>
              <div className="pane source" style={isFocus ? undefined : { flex: split }}>
                <div className="pane-head">
                  <Icon name="pencil-line" size={13} /> Source
                  <span style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--sans)' }}>
                    {wordCount} words
                  </span>
                </div>
                <SourceEditor value={src} onChange={(v) => { if (current) setBody(current, v); }} font={tweaks.editorFont} size={tweaks.editorSize} />
              </div>
              <div className="divider" onMouseDown={startDrag} />
              <div className="pane preview" style={isFocus ? undefined : { flex: 100 - split }}>
                <div className="pane-head">
                  <Icon name="book-open" size={13} /> Preview
                </div>
                <Preview src={src} index={index} openFile={openFile} openTag={() => setView('tags')} onToggleTask={toggleTask} focus={isFocus} />
              </div>
            </div>
          ) : (
            <div className="empty">
              <div>
                <div className="big">{loading ? 'Loading vault…' : 'No note open'}</div>
                {!loading && 'Pick a note from the sidebar, or press ⌘O.'}
              </div>
            </div>
          )}
        </div>
      </div>

      {qs && <QuickSwitch index={index} onClose={() => setQs(false)} openFile={openFile} />}
      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

export default App;
