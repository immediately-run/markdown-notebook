/* Top bar: brand, breadcrumb, quick-switch button, layout switcher, theme toggle. */
import logoMark from '../assets/logo-mark.png';
import type { Tweaks } from '../hooks/useTweaks';
import Icon from './Icon';

export type Layout = 'split' | 'stack' | 'focus';

const LAYOUTS: [Layout, string, string][] = [
  ['split', 'columns-2', 'Split'],
  ['stack', 'rows-2', 'Stacked'],
  ['focus', 'pilcrow', 'Focus'],
];

interface TopBarProps {
  current: string | null;
  layout: Layout;
  setLayout: (l: Layout) => void;
  theme: Tweaks['theme'];
  toggleTheme: () => void;
  onSearch: () => void;
}

// immediately.run runs the app inside an iframe and overlays its own topnav
// pulldown tab in the top-right corner, which would obscure the menu bar. When
// hosted, reserve empty space there. We can't use `import.meta.env.DEV` for this
// — the in-browser transpiler doesn't treat files as modules, so `import.meta`
// throws "Cannot use 'import.meta' outside a module". Detect the iframe instead;
// plain `vite dev` runs at the top level.
function isHosted(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin access to window.top throws — that only happens when framed.
    return true;
  }
}

export default function TopBar({ current, layout, setLayout, theme, toggleTheme, onSearch }: TopBarProps) {
  return (
    <div className={isHosted() ? 'topbar hosted' : 'topbar'}>
      <div className="brand">
        <img className="mark" src={logoMark} alt="" />
        notebook
      </div>
      <div className="crumb">
        <span>My Vault</span>
        <span className="sep">/</span>
        <span className="cur">{current || '—'}</span>
      </div>
      <div className="spacer" />
      <div className="right">
        <button className="searchbtn" onClick={onSearch}>
          <Icon name="search" size={14} /> <span>Quick switch</span> <span className="kbd">⌘O</span>
        </button>
        <div className="layswitch">
          {LAYOUTS.map(([id, icon, label]) => (
            <button key={id} className={layout === id ? 'on' : ''} onClick={() => setLayout(id)} title={label}>
              <Icon name={icon} size={14} /> {label}
            </button>
          ))}
        </div>
        <button className="icon-toggle" onClick={toggleTheme} title="Toggle theme">
          <Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} />
        </button>
        <div className="avatar">N</div>
      </div>
    </div>
  );
}
