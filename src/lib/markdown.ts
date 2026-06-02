/* Markdown engine for the notes app.
   mdToHtml(src)   -> rendered preview HTML
   highlightMd(src) -> escaped + tokenized HTML for the source overlay
   Supports: headings, bold/italic/strike, inline code, fenced code, blockquotes,
   Obsidian callouts (> [!type] Title), task lists, ordered/unordered lists,
   [[wiki-links]] (+ |alias), #tags, [links](url), images, horizontal rules. */
import { iconSvg } from './icons';

// Private-use sentinel that brackets protected inline-code spans. A PUA char
// won't appear in normal markdown and (unlike NUL) isn't a control char, so it
// keeps the lint-checked regexes clean.
const SENT = '';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---- inline ---- */
function inline(text: string): string {
  // protect inline code
  const codes: string[] = [];
  text = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return SENT + (codes.length - 1) + SENT;
  });

  let s = esc(text);

  // images  ![alt](src)
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, src) => `<img class="md-img" src="${src}" alt="${alt}" />`);
  // links  [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    (_, t, u) => `<a class="md-link" href="${u}" target="_blank" rel="noreferrer">${t}</a>`);
  // wiki-links  [[target|alias]] / [[target]]
  s = s.replace(/\[\[([^\]]+)\]\]/g, (_, inner2) => {
    const [target, alias] = inner2.split('|');
    const label = (alias || target).trim();
    return `<a class="wikilink" data-target="${target.trim()}">${label}</a>`;
  });
  // bold then italic
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
  // strikethrough
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  // tags  #tag  (not inside words, not a bare #)
  s = s.replace(/(^|\s)(#[A-Za-z][\w/-]*)/g,
    (_, pre, tag) => `${pre}<span class="tag" data-tag="${tag.slice(1)}">${tag}</span>`);

  // restore code
  s = s.replace(new RegExp(SENT + '(\\d+)' + SENT, 'g'), (_, i) => `<code class="md-code">${esc(codes[+i])}</code>`);
  return s;
}

const CALLOUTS: Record<string, { icon: string; cls: string }> = {
  note: { icon: 'pencil', cls: 'c-note' },
  info: { icon: 'info', cls: 'c-info' },
  tip: { icon: 'flame', cls: 'c-tip' },
  hint: { icon: 'flame', cls: 'c-tip' },
  success: { icon: 'check', cls: 'c-tip' },
  question: { icon: 'help-circle', cls: 'c-info' },
  warning: { icon: 'alert-triangle', cls: 'c-warn' },
  caution: { icon: 'alert-triangle', cls: 'c-warn' },
  important: { icon: 'alert-circle', cls: 'c-imp' },
  quote: { icon: 'quote', cls: 'c-quote' },
  example: { icon: 'list', cls: 'c-info' },
};

interface ListItem { level: number; ordered: boolean; checked: boolean | null; text: string; }

/* ---- block ---- */
export function mdToHtml(src: string): string {
  const lines = (src || '').replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let i = 0;

  const isList = (l: string) => /^(\s*)([-*+]|\d+\.)\s+/.test(l);

  while (i < lines.length) {
    const line = lines[i];

    // blank
    if (/^\s*$/.test(line)) { i++; continue; }

    // fenced code
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || '';
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; // closing fence
      html += `<pre class="md-pre"><code class="lang-${lang}">${esc(buf.join('\n'))}</code></pre>`;
      continue;
    }

    // horizontal rule
    if (/^(\s*)(---+|\*\*\*+|___+)\s*$/.test(line)) { html += '<hr class="md-hr" />'; i++; continue; }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      html += `<h${lvl} class="md-h md-h${lvl}">${inline(h[2].trim())}</h${lvl}>`;
      i++;
      continue;
    }

    // blockquote / callout
    if (/^\s*>/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      const first = buf[0] || '';
      const co = first.match(/^\[!(\w+)\]([+-])?\s*(.*)$/);
      if (co) {
        const meta = CALLOUTS[co[1].toLowerCase()] || CALLOUTS.note;
        const title = (co[3] || co[1]).trim();
        const body = buf.slice(1).join('\n');
        html += `<div class="callout ${meta.cls}">`
          + `<div class="callout-head">${iconSvg(meta.icon, 17, 2)}<span>${inline(title)}</span></div>`
          + (body.trim() ? `<div class="callout-body">${mdToHtml(body)}</div>` : '')
          + `</div>`;
      } else {
        html += `<blockquote class="md-quote">${mdToHtml(buf.join('\n'))}</blockquote>`;
      }
      continue;
    }

    // lists (flat, indentation -> level)
    if (isList(line)) {
      const items: ListItem[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
        if (!m) break;
        const level = Math.floor(m[1].replace(/\t/g, '  ').length / 2);
        const ordered = /\d+\./.test(m[2]);
        let text = m[3];
        let checked: boolean | null = null;
        const task = text.match(/^\[([ xX])\]\s+(.*)$/);
        if (task) { checked = task[1].toLowerCase() === 'x'; text = task[2]; }
        items.push({ level, ordered, checked, text });
        i++;
      }
      html += '<ul class="md-list">';
      for (const it of items) {
        const pad = it.level * 22;
        if (it.checked !== null) {
          const raw = it.text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
          html += `<li class="md-task ${it.checked ? 'done' : ''}" style="margin-left:${pad}px" data-raw="${raw}" data-checked="${it.checked}">`
            + `<span class="md-chk">${it.checked ? iconSvg('check', 13, 3) : ''}</span>`
            + `<span class="md-task-t">${inline(it.text)}</span></li>`;
        } else {
          const bullet = it.ordered ? 'md-ol' : 'md-ul';
          html += `<li class="md-li ${bullet}" style="margin-left:${pad}px">${inline(it.text)}</li>`;
        }
      }
      html += '</ul>';
      continue;
    }

    // paragraph (gather consecutive plain lines)
    const para: string[] = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^\s*>/.test(lines[i])
      && !/^(#{1,6})\s/.test(lines[i]) && !/^```/.test(lines[i])
      && !isList(lines[i]) && !/^(\s*)(---+|\*\*\*+|___+)\s*$/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    html += `<p class="md-p">${inline(para.join('\n').replace(/\n/g, '<br/>'))}</p>`;
  }
  return html;
}

/* ---- source overlay highlighter (line-based, preserves exact text) ---- */
export function highlightMd(src: string): string {
  const lines = (src || '').split('\n');
  let inFence = false;
  const out = lines.map((raw) => {
    if (/^```/.test(raw)) { inFence = !inFence; return `<span class="t-fence">${esc(raw)}</span>`; }
    if (inFence) return `<span class="t-codeblock">${esc(raw)}</span>`;
    if (raw === '') return '';

    // heading
    const h = raw.match(/^(#{1,6})(\s+)(.*)$/);
    if (h) return `<span class="t-hmark">${h[1]}</span>${h[2]}<span class="t-heading t-h${h[1].length}">${inlineHL(h[3])}</span>`;
    // hr
    if (/^(---+|\*\*\*+|___+)\s*$/.test(raw)) return `<span class="t-punct">${esc(raw)}</span>`;
    // blockquote / callout
    const q = raw.match(/^(\s*>\s?)(.*)$/);
    if (q) {
      const co = q[2].match(/^(\[![\w]+\][+-]?)(.*)$/);
      if (co) return `<span class="t-quote">${esc(q[1])}</span><span class="t-callout">${esc(co[1])}</span>${inlineHL(co[2])}`;
      return `<span class="t-quote">${esc(q[1])}</span><span class="t-quote-body">${inlineHL(q[2])}</span>`;
    }
    // list
    const l = raw.match(/^(\s*)([-*+]|\d+\.)(\s+)(\[[ xX]\])?(\s*)(.*)$/);
    if (l) {
      const task = l[4] ? `<span class="t-task">${esc(l[4])}</span>${l[5]}` : '';
      return `${l[1]}<span class="t-bullet">${esc(l[2])}</span>${l[3]}${task}${inlineHL(l[6])}`;
    }
    return inlineHL(raw);
  });
  return out.join('\n');
}

function inlineHL(text: string): string {
  // escape, then wrap markers — must keep all original chars intact
  let s = esc(text);
  s = s.replace(/(`[^`]+`)/g, '<span class="t-code">$1</span>');
  s = s.replace(/(\[\[[^\]]+\]\])/g, '<span class="t-wiki">$1</span>');
  s = s.replace(/(\*\*[^*]+\*\*|__[^_]+__)/g, '<span class="t-bold">$1</span>');
  s = s.replace(/(^|[^*\w])(\*[^*\n]+\*)/g, '$1<span class="t-italic">$2</span>');
  s = s.replace(/(^|\s)(#[A-Za-z][\w/-]*)/g, '$1<span class="t-tag">$2</span>');
  s = s.replace(/(\[[^\]]+\]\([^)]+\))/g, '<span class="t-link">$1</span>');
  return s;
}
