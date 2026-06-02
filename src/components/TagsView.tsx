/* Tags view: every #tag in the vault, expandable to the notes that use it. */
import { useState } from 'react';

interface TagsViewProps {
  tags: Record<string, string[]>;
  openFile: (base: string) => void;
}

export default function TagsView({ tags, openFile }: TagsViewProps) {
  const [open, setOpen] = useState<string | null>(null);
  const entries = Object.entries(tags).sort((a, b) => b[1].length - a[1].length);
  return (
    <>
      <div className="side-head">Tags</div>
      <div className="tagview">
        {entries.map(([tag, notes]) => (
          <div key={tag}>
            <div className="tag-row" onClick={() => setOpen((o) => (o === tag ? null : tag))}>
              <span className="hash">#</span>
              <span style={{ flex: 1 }}>{tag}</span>
              <span className="cnt">{notes.length}</span>
            </div>
            {open === tag && (
              <div className="tag-note">
                {notes.map((n) => <a key={n} onClick={() => openFile(n)}>{n}</a>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
