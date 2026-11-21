// Membangun bundel penilai untuk edge function `catat-percobaan`: `pnpm fungsi:bundel`, jalankan sebelum `supabase functions deploy`.
// Versi engine = commit terakhir yang mengubah engine/math (sama dengan build web), ditanam sebagai VERSI_ENGINE.
import { execSync } from 'node:child_process';
import { build } from 'esbuild';

const versiEngine = (() => {
  try {
    return execSync('git log -1 --format=%h -- :/packages/engine :/packages/math', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || 'tak-diketahui';
  } catch { return 'tak-diketahui'; }
})();

await build({
  entryPoints: ['supabase/functions/catat-percobaan/masuk.ts'],
  outfile: 'supabase/functions/catat-percobaan/penilai.js',
  bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', minify: true,
  banner: { js: `export const VERSI_ENGINE=${JSON.stringify(versiEngine)};` },
});
console.log(`penilai.js dibangun (engine ${versiEngine})`);
