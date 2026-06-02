/* User tweaks — editor font/size and theme — persisted to localStorage so they
   survive reloads. The theme is reflected onto <html data-theme> by the app. */
import { useCallback, useState } from 'react';

export interface Tweaks {
  theme: 'dark' | 'light';
  editorFont: 'mono' | 'sans';
  editorSize: number;
}

const KEY = 'mdnotes:tweaks';
const DEFAULTS: Tweaks = { theme: 'dark', editorFont: 'mono', editorSize: 14 };

export function useTweaks() {
  const [tweaks, setTweaks] = useState<Tweaks>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Tweaks>) };
    } catch { /* ignore */ }
    return DEFAULTS;
  });

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return [tweaks, setTweak] as const;
}
