import { defineConfig } from 'vitest/config';

// Logika murni Edge Function (supabase/functions/*/logika.ts) ikut dites di sini: tidak ada paket Deno di workspace.
export default defineConfig({
  test: { environment: 'node', dir: '..', include: ['scripts/**/*.test.ts', 'supabase/functions/**/*.test.ts'] },
});
