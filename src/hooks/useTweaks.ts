/* User tweaks — editor font/size and theme — persisted via the fs-backed
   storage layer so they survive reloads (localStorage is inaccessible inside the
   immediately.run iframe). The theme is reflected onto <html data-theme> by the
   app. Because fs is async, tweaks start at defaults and hydrate on mount. */
import { useCallback, useEffect, useState } from 'react';
import { loadTweaks, saveTweaks } from '../lib/storage';

export interface Tweaks {
  theme: 'dark' | 'light';
  editorFont: 'mono' | 'sans';
  editorSize: number;
}

const DEFAULTS: Tweaks = { theme: 'dark', editorFont: 'mono', editorSize: 14 };

export function useTweaks() {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULTS);

  // fs is async, so tweaks start at defaults and hydrate on mount. setTweak only
  // fires on user interaction, which happens after this resolves.
  useEffect(() => {
    let alive = true;
    loadTweaks<Partial<Tweaks>>().then((saved) => {
      if (alive && saved) setTweaks((prev) => ({ ...prev, ...saved }));
    });
    return () => { alive = false; };
  }, []);

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((prev) => {
      const next = { ...prev, [key]: value };
      void saveTweaks(next);
      return next;
    });
  }, []);

  return [tweaks, setTweak] as const;
}
