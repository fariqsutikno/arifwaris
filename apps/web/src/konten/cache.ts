// apps/web/src/konten/cache.ts
// Cache snapshot konten di IndexedDB (localStorage terlalu kecil untuk materi). Satu kunci, satu nilai. Semua kegagalan
// (mode privat, kuota, API tidak ada) = null / diam, web jatuh ke snapshot bawaan.
import type { Snapshot } from '@waris/data/snapshot';

const NAMA_DB = 'arif-waris-konten';
const TOKO = 'snapshot';
const KUNCI = 'terakhir';

/** Boot menunggu fungsi ini; IndexedDB yang macet (open terblokir) tidak boleh menahan aplikasi lebih dari ini. */
const BATAS_TUNGGU_MS = 1500;

export async function bacaCache(): Promise<Snapshot | null> {
  const batas = new Promise<null>(selesai => setTimeout(() => selesai(null), BATAS_TUNGGU_MS));
  return Promise.race([batas, pakaiDb(db => permintaan<Snapshot | undefined>(db.transaction(TOKO).objectStore(TOKO).get(KUNCI)))
    .then(nilai => nilai ?? null).catch(() => null)]);
}

export async function simpanCache(snapshot: Snapshot): Promise<void> {
  try {
    await pakaiDb(db => permintaan(db.transaction(TOKO, 'readwrite').objectStore(TOKO).put(snapshot, KUNCI)));
  } catch {
    // Tanpa cache: muat berikutnya memakai snapshot bawaan lalu sinkron lagi.
  }
}

/** Koneksi ditutup setelah dipakai, supaya tidak menahan upgrade/hapus database dari tab lain. */
async function pakaiDb<T>(kerja: (db: IDBDatabase) => Promise<T>): Promise<T> {
  const db = await buka();
  try {
    return await kerja(db);
  } finally {
    db.close();
  }
}

function buka(): Promise<IDBDatabase> {
  const minta = indexedDB.open(NAMA_DB, 1);
  minta.onupgradeneeded = () => minta.result.createObjectStore(TOKO);
  return permintaan(minta);
}

function permintaan<T>(minta: IDBRequest<T>): Promise<T> {
  return new Promise((selesai, gagal) => {
    minta.onsuccess = () => selesai(minta.result);
    minta.onerror = () => gagal(minta.error);
  });
}
