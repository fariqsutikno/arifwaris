// apps/web/src/main.tsx
// Titik masuk: pasang konten terbaru yang ada di perangkat (cache vs snapshot bawaan), baru impor <Aplikasi/> supaya
// konstanta tingkat-modul yang memakai t()/konten melihat data itu. Sinkron dengan server berjalan di latar dan hanya
// mengisi cache; perubahan tampil di muat berikutnya (tidak mengganti teks di tengah pemakaian). Bila ada versi baru,
// <PembaruanKonten/> menawarkan tautan muat ulang.
import './gaya/font.css';
import './gaya/token.css';
import './gaya/komponen.css';
import './gaya/beranda.css';
import './gaya/aplikasi.css';
import './gaya/belajar.css';
import './gaya/materi.css';
import './gaya/lab.css';
import './gaya/rujukan.css';
import './gaya/latihan.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pilihAwal, type Snapshot } from '@waris/data/snapshot';
import { bacaCache, simpanCache } from './konten/cache';
import { modulBerubah, muatRepoSupabase, PERISTIWA_KONTEN_BARU, sinkronLatar } from './konten/sinkron';
import { pasangSnapshot, snapshotTerpasang } from './konten/sumber';
import { NAMA_APLIKASI } from './terjemah';
import { daftarkanServiceWorker } from './notifikasi/perangkat';
import { BatasGalat } from './ui/BatasGalat';

document.title = NAMA_APLIKASI;
daftarkanServiceWorker();
pasangSnapshot(pilihAwal(snapshotTerpasang(), await bacaCache()));
const [{ Aplikasi }, { PenyediaPenjaga }] = await Promise.all([import('./Aplikasi'), import('./ui/Penjaga')]);
createRoot(document.getElementById('akar')!).render(<StrictMode><BatasGalat><PenyediaPenjaga><Aplikasi /></PenyediaPenjaga></BatasGalat></StrictMode>);
const snapshotLama = snapshotTerpasang();
let snapshotBaru: Snapshot | null = null;
void sinkronLatar(snapshotLama, {
  url: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  kunci: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  daring: navigator.onLine,
  muatRepo: muatRepoSupabase,
  simpan: async snapshot => { snapshotBaru = snapshot; await simpanCache(snapshot); },
}).then(adaBaru => {
  if (adaBaru) window.dispatchEvent(new CustomEvent(PERISTIWA_KONTEN_BARU, { detail: { modul: snapshotBaru ? modulBerubah(snapshotLama, snapshotBaru) : [] } }));
});
