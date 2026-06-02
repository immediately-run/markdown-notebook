/* Left activity bar: switch the sidebar between Files / Tags / Search, create a
   new note, and open Tweaks (settings). */
import Icon from './Icon';

export type SidebarView = 'files' | 'tags';

interface ActivityBarProps {
  view: SidebarView;
  setView: (v: SidebarView) => void;
  onSearch: () => void;
  onNew: () => void;
  onSettings: () => void;
}

const ITEMS: [string, string][] = [
  ['files', 'files'],
  ['tags', 'hash'],
];

export default function ActivityBar({ view, setView, onSearch, onNew, onSettings }: ActivityBarProps) {
  return (
    <div className="activity">
      {ITEMS.map(([id, icon]) => (
        <button key={id} className={`item ${view === id ? 'on' : ''}`} onClick={() => setView(id as SidebarView)} title={id}>
          <Icon name={icon} size={20} />
        </button>
      ))}
      <button className="item" onClick={onSearch} title="search">
        <Icon name="search" size={20} />
      </button>
      <button className="item" onClick={onNew} title="New note"><Icon name="plus" size={20} /></button>
      <div className="grow" />
      <button className="item" onClick={onSettings} title="Tweaks"><Icon name="settings" size={20} /></button>
    </div>
  );
}
