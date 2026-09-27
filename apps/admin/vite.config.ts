import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { target: 'es2022' },  // top-level await di main.tsx
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/__tests__/siapkan.ts'] },  // globals: Testing Library membersihkan DOM antar test
});
