import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { target: 'es2022' },  // top-level await di main.tsx
  test: { environment: 'jsdom', globals: true },  // globals: Testing Library membersihkan DOM antar test
});
