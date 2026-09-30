// apps/web/src/main.tsx
// Titik masuk: pasang konten terbaru yang ada di perangkat (cache vs snapshot bawaan), baru impor <Aplikasi/> supaya
// konstanta tingkat-modul yang memakai t()/konten melihat data itu. Sinkron dengan server berjalan di latar dan hanya
// mengisi cache; perubahan tampil di muat berikutnya (tidak mengganti teks di tengah pemakaian). Bila ada versi baru,
// <PembaruanKonten/> menawarkan tautan muat ulang.
import './gaya/token.css';
import './gaya/komponen.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pilihAwal } from '@waris/data/snapshot';
import { bacaCache, simpanCache } from './konten/cache';
import { muatRepoSupabase, PERISTIWA_KONTEN_BARU, sinkronLatar } from './konten/sinkron';
import { pasangSnapshot, snapshotTerpasang } from './konten/sumber';
import { NAMA_APLIKASI } from './terjemah';

document.title = NAMA_APLIKASI;
pasangSnapshot(pilihAwal(snapshotTerpasang(), await bacaCache()));
const [{ Aplikasi }, { PenyediaPenjaga }] = await Promise.all([import('./Aplikasi'), import('./ui/Penjaga')]);
createRoot(document.getElementById('akar')!).render(<StrictMode><PenyediaPenjaga><Aplikasi /></PenyediaPenjaga></StrictMode>);
void sinkronLatar(snapshotTerpasang(), {
  url: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  kunci: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  daring: navigator.onLine,
  muatRepo: muatRepoSupabase,
  simpan: simpanCache,
}).then(adaBaru => { if (adaBaru) window.dispatchEvent(new Event(PERISTIWA_KONTEN_BARU)); });
