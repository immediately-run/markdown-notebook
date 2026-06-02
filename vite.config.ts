import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import { devFs } from '@immediately-run/dev-fs'

// MDX must run before @vitejs/plugin-react so the JSX it emits is handled by
// React's transform (Fast Refresh included). immediately.run processes .mdx
// natively; this wiring keeps the local `vite dev`/`build` in sync.
//
// devFs() (@immediately-run/dev-fs) makes `import('fs')` work during local
// `vite dev` by bridging the sandbox's async filesystem to the real disk — so
// storage.ts persists the vault as real .md files locally instead of falling
// back to localStorage. Dev-only; absent from the build. The vault dir is
// ignored so note writes don't trigger HMR reloads.
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devFs({ ignore: ['**/vault/**'] }),
    { enforce: 'pre', ...mdx() },
    react(),
  ],
  build: {
    // In the production build `fs` must stay external (not bundled for the
    // browser): the immediately.run sandbox provides it at runtime, and
    // storage.ts falls back to localStorage where it's absent.
    rollupOptions: { external: ['fs', 'fs/promises'] },
  },
})
