import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';

// Versi engine bermakna (S6): commit terakhir yang mengubah engine atau math. Versi paket 0.0.1 tidak pernah naik.
function versiEngine(): string {
  try {
    return execSync('git log -1 --format=%h -- :/packages/engine :/packages/math', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || 'tak-diketahui';
  } catch {
    return 'tak-diketahui';
  }
}

export default defineConfig({
  plugins: [react()],
  define: { __VERSI_ENGINE__: JSON.stringify(versiEngine()) },
  build: { target: 'es2022' },  // top-level await di main.tsx
  test: { environment: 'jsdom', globals: true, env: { VITE_SAMARKAN_MEREK: '' } },  // tes selalu mode merek normal; mode samaran diuji di merek.test.ts  // globals: Testing Library membersihkan DOM antar test
});
