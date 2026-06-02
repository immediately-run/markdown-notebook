/* ⌘O quick-switch palette: filter over note names, arrow-key + Enter to jump,
   Esc to close. Mounted only while open, so its state starts fresh each time. */
import { useEffect, useRef, useState } from 'react';
import type { VaultIndexEntry } from '../lib/vault';
import Icon from './Icon';

interface QuickSwitchProps {
  index: Record<string, VaultIndexEntry>;
  onClose: () => void;
  openFile: (base: string) => void;
}

export default function QuickSwitch({ index, onClose, openFile }: QuickSwitchProps) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input on open (DOM sync — no state changes here).
  useEffect(() => { inputRef.current?.focus(); }, []);

  const names = Object.keys(index);
  const matches = names.filter((n) => n.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  const pick = (i: number) => { const n = matches[i]; if (n) { openFile(n); onClose(); } };

  return (
    <div className="qs-overlay" onClick={onClose}>
      <div className="qs" onClick={(e) => e.stopPropagation()}>
        <div className="qs-input">
          <Icon name="search" size={17} style={{ color: 'var(--ink-3)' }} />
          <input
            ref={inputRef}
            value={q}
            placeholder="Jump to a note…"
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); pick(active); }
              else if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(matches.length - 1, a + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            }}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="qs-list">
          {matches.length === 0 && <div className="qs-empty">No notes match “{q}”.</div>}
          {matches.map((n, i) => (
            <div key={n} className={`qs-item ${i === active ? 'active' : ''}`}
              onMouseEnter={() => setActive(i)} onClick={() => pick(i)}>
              <Icon name="file-text" size={15} style={{ opacity: 0.7 }} />
              <span>{n}</span>
              <span className="qs-path">{index[n].path}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
