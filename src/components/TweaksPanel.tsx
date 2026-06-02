/* Floating Tweaks panel: editor font (mono/sans) + size, and light/dark theme.
   Opened from the activity bar; values persist via the useTweaks hook. */
import type { Tweaks } from '../hooks/useTweaks';
import Icon from './Icon';

interface TweaksPanelProps {
  open: boolean;
  onClose: () => void;
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
}

const FONTS = ['mono', 'sans'] as const;
const THEMES = ['dark', 'light'] as const;

export default function TweaksPanel({ open, onClose, tweaks, setTweak }: TweaksPanelProps) {
  if (!open) return null;
  return (
    <div className="tweaks">
      <div className="tweaks-hd">
        <b>Tweaks</b>
        <button onClick={onClose} aria-label="Close tweaks"><Icon name="x" size={16} /></button>
      </div>
      <div className="tweaks-body">
        <div className="tweak-row">
          <div className="tweak-lbl"><span>Editor font</span></div>
          <div className="seg">
            {FONTS.map((f) => (
              <button key={f} className={tweaks.editorFont === f ? 'on' : ''} onClick={() => setTweak('editorFont', f)}>{f}</button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <div className="tweak-lbl"><span>Font size</span><span className="val">{tweaks.editorSize}px</span></div>
          <input
            type="range"
            min={12}
            max={20}
            value={tweaks.editorSize}
            onChange={(e) => setTweak('editorSize', Number(e.target.value))}
          />
        </div>
        <div className="tweak-row">
          <div className="tweak-lbl"><span>Theme</span></div>
          <div className="seg">
            {THEMES.map((m) => (
              <button key={m} className={tweaks.theme === m ? 'on' : ''} onClick={() => setTweak('theme', m)}>{m}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
