// Titik masuk portal admin. Tanpa env Supabase → pesan galat (portal tak bisa jalan tanpa DB, beda dari web yang
// punya snapshot bawaan). Ada env → repo Supabase (sesi dipersist bawaan supabase-js) diteruskan ke <Portal/>.
import '@waris/web/gaya/token.css';
import '@waris/web/gaya/komponen.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { buatRepositoriSupabase } from '@waris/data';
import { Portal } from './Portal';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const kunci = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const akar = createRoot(document.getElementById('akar')!);
if (!url || !kunci) {
  akar.render(<StrictMode><p role="alert">env Supabase belum diatur</p></StrictMode>);
} else {
  const repo = buatRepositoriSupabase(createClient(url, kunci));
  akar.render(<StrictMode><Portal repo={repo} /></StrictMode>);
}
