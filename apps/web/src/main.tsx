// apps/web/src/main.tsx
// Titik masuk: pasang konten terbaru yang ada di perangkat (cache vs snapshot bawaan), baru impor <Aplikasi/> supaya
// konstanta tingkat-modul yang memakai t()/konten melihat data itu. Sinkron dengan server berjalan di latar dan hanya
// mengisi cache; perubahan tampil di muat berikutnya (tidak mengganti teks di tengah pemakaian).
import './gaya/token.css';
import './gaya/komponen.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pilihAwal, sinkronkan, type Snapshot } from '@waris/data/snapshot';
import { bacaCache, simpanCache } from './konten/cache';
import { pasangSnapshot, snapshotTerpasang } from './konten/sumber';

pasangSnapshot(pilihAwal(snapshotTerpasang(), await bacaCache()));
const [{ Aplikasi }, { PenyediaPenjaga }] = await Promise.all([import('./Aplikasi'), import('./ui/Penjaga')]);
createRoot(document.getElementById('akar')!).render(<StrictMode><PenyediaPenjaga><Aplikasi /></PenyediaPenjaga></StrictMode>);
void sinkronLatar(snapshotTerpasang());

async function sinkronLatar(lokal: Snapshot): Promise<void> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const kunci = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !kunci || !navigator.onLine) return;
  const [{ createClient }, { buatRepositoriSupabase }] = await Promise.all([import('@supabase/supabase-js'), import('@waris/data')]);
  const baru = await sinkronkan(buatRepositoriSupabase(createClient(url, kunci, { auth: { persistSession: false } })), lokal);
  if (baru) await simpanCache(baru);
}
