/* Source-overlay editor: a transparent <textarea> sits exactly over a syntax-
   highlighted <pre>, so you type real markdown but see it tokenized. */
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Tweaks } from '../hooks/useTweaks';
import { highlightMd } from '../lib/markdown';

interface SourceEditorProps {
  value: string;
  onChange: (v: string) => void;
  font: Tweaks['editorFont'];
  size: number;
}

export default function SourceEditor({ value, onChange, font, size }: SourceEditorProps) {
  const hl = useMemo(() => highlightMd(value) + '\n', [value]);
  const fam = font === 'sans' ? 'var(--sans)' : 'var(--mono)';
  const vars = { '--ed-font': fam, '--ed-size': size + 'px' } as CSSProperties;
  return (
    <div className="src-area" style={vars}>
      <pre className="src-hl" aria-hidden="true" dangerouslySetInnerHTML={{ __html: hl }} />
      <textarea
        className="src-input"
        value={value}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
