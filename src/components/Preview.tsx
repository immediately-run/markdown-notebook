/* Live preview: renders the markdown to HTML and wires interactive bits —
   wiki-links navigate, #tags open the tags view, checkboxes toggle in source.
   Broken wiki-links (no matching note) are dimmed. */
import { useEffect, useMemo, useRef } from 'react';
import type { MouseEvent } from 'react';
import { mdToHtml } from '../lib/markdown';
import type { VaultIndexEntry } from '../lib/vault';

interface PreviewProps {
  src: string;
  index: Record<string, VaultIndexEntry>;
  openFile: (base: string) => void;
  openTag: (tag: string) => void;
  onToggleTask: (raw: string, wasChecked: boolean) => void;
  focus: boolean;
}

export default function Preview({ src, index, openFile, openTag, onToggleTask, focus }: PreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const html = useMemo(() => mdToHtml(src), [src]);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.querySelectorAll<HTMLAnchorElement>('.wikilink').forEach((a) => {
      const t = (a.dataset.target || '').trim();
      if (!index[t]) a.classList.add('broken');
    });
  }, [html, index]);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const wl = target.closest<HTMLElement>('.wikilink');
    if (wl && !wl.classList.contains('broken')) { openFile((wl.dataset.target || '').trim()); return; }
    const tg = target.closest<HTMLElement>('.tag');
    if (tg) { openTag(tg.dataset.tag || ''); return; }
    const chk = target.closest<HTMLElement>('.md-chk');
    if (chk) {
      const li = chk.closest<HTMLElement>('.md-task');
      if (li) onToggleTask(li.dataset.raw || '', li.dataset.checked === 'true');
    }
  };

  return (
    <div className="preview-scroll" ref={ref} onClick={onClick}>
      <div className={`reading ${focus ? 'serif' : ''}`} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
