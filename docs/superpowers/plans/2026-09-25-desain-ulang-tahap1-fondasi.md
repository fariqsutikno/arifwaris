# Desain ulang UI — Tahap 1: Fondasi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Pondasi desain ulang: file kasus versi 2, keadaan aplikasi dengan tujuan (Hitung/Belajar) dan validasi per langkah, kerangka wizard (header, stepper, pertanyaan utama, bar bawah), beranda dengan pertanyaan pembuka, dan tur singkat dengan sorotan gelap.

**Architecture:** Logika murni di `kasus.ts`, `keadaan.ts`, `wizard/validasi.ts`, `preferensi.ts` (dites tanpa DOM). UI wizard dipecah jadi kerangka (`layar/wizard/*`) yang membungkus isi langkah lama; isi langkah 2–5 dirombak di tahap 2–3, layar hasil di tahap 4. Teks UI baru ditaruh di `src/konten/`.

**Tech Stack:** Vite 5, React 18, TypeScript 5.5 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), Vitest 2 + jsdom + @testing-library/react (globals: true).

**Spec:** `docs/superpowers/specs/2026-09-25-desain-ulang-ui.md` (bagian Keputusan, Navigasi global, Beranda, Kerangka wizard, 1 · Pewaris, Tur singkat, Unit baru → Kasus v2).

## Global Constraints

- Penamaan Indonesia utuh (CLAUDE.md § Penamaan); handler `saat…`, boolean `adalah…/ada…/sedang…`; tiap file dibuka komentar alur.
- UI tidak menghitung bagian waris; tidak ada `number` di jalur uang.
- Tidak ada `window.confirm/alert`; konfirmasi dibuat di halaman.
- localStorage selalu dalam try/catch; aplikasi tetap jalan tanpa penyimpanan.
- Header tidak memuat tombol simpan. "Kok bisa gini?" dan "Ubah isian" tidak dipakai di layar baru.
- Jenis kelamin pewaris tidak punya pilihan bawaan; wajib dipilih.
- Target sentuh ≥ 44px; fokus keyboard terlihat; tanpa scroll horizontal < 720px.
- Semua test workspace (`pnpm test`) tetap hijau di akhir tiap task.

## Review Focus

1. **Lompat stepper ke langkah yang belum valid** (mis. klik "Ahli waris" saat harta masih 0) → ditolak, tetap di langkah valid terjauh. Test di Task 2.
2. **Ulangi dari awal saat ada kasus** → tidak langsung menghapus; tampil konfirmasi dengan pilihan simpan file dulu. Test di Task 3.
3. **File kasus versi 1 lama dibuka** → tetap terbaca dan jadi versi 2. Test di Task 1.
4. **Tur dibuka di layar tanpa elemen sasaran** (elemen tersembunyi) → langkah itu dilewati, tidak macet. Test di Task 4.
5. **localStorage melempar error** (mode privat) → tujuan & tanda tur tetap berfungsi di memori. Test di Task 2 dan 4.

---

### Task 1: Kasus versi 2

**Files:**
- Modify: `apps/web/src/kasus.ts`
- Test: `apps/web/src/__tests__/kasus.test.ts`

**Interfaces:**
- Produces:
  - `const KATEGORI_HARTA = ['tabungan','properti','kendaraan','emas','piutang','lainnya'] as const`, `type KategoriHarta`
  - `interface Kasus { versi: 2; graf; tirkah; satuanPembulatan: bigint; urutanWafat: IdOrang[]; rincianHarta?: Partial<Record<KategoriHarta, bigint>> }`
  - `kasusBaru` menghasilkan `versi: 2`; `dariJson` menerima versi 1 dan 2, selalu mengembalikan versi 2 yang sudah dirapikan.

- [x] **Step 1: Ubah dan tambah test** — di `kasus.test.ts`, ganti test "menolak versi lain" dan tambahkan:

```ts
  it('menolak versi lain', () => {
    const teks = keJson(kasusBaru('L')).replace('"versi":2', '"versi":9');
    expect(dariJson(teks)).toMatchObject({ berhasil: false });
  });

  it('file versi 1 tetap terbaca dan jadi versi 2', () => {
    const teks = keJson(kasusBaru('L')).replace('"versi":2', '"versi":1');
    const hasil = dariJson(teks);
    expect(hasil).toMatchObject({ berhasil: true, kasus: { versi: 2 } });
  });

  it('rincian harta ikut tersimpan', () => {
    const kasus = { ...kasusBaru('L'), rincianHarta: { tabungan: 5_000_000n, emas: 1n } };
    expect(dariJson(keJson(kasus))).toEqual({ berhasil: true, kasus });
  });

  it('menolak kategori harta yang tidak dikenal', () => {
    const teks = keJson({ ...kasusBaru('L'), rincianHarta: { tabungan: 1n } }).replace('"tabungan"', '"saham"');
    expect(dariJson(teks)).toMatchObject({ berhasil: false });
  });

  it('menolak pewaris atau orang ganda di urutan wafat', () => {
    let kasus = kasusBaru('L');
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
    const [idAnak] = hitungIsian(kasus.graf, 'PEWARIS').ANAK_LK!;
    expect(dariJson(keJson({ ...kasus, urutanWafat: ['PEWARIS'] }))).toMatchObject({ berhasil: false });
    expect(dariJson(keJson({ ...kasus, urutanWafat: [idAnak!, idAnak!] }))).toMatchObject({ berhasil: false });
  });

  it('orang penghubung di urutan wafat dirapikan saat file dibuka', () => {
    let kasus = kasusBaru('L');
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'CUCU_LK') };
    const idPenghubung = Object.values(kasus.graf.orang).find(orang => orang.penghubung)!.id;
    const hasil = dariJson(keJson({ ...kasus, urutanWafat: [idPenghubung] }));
    expect(hasil).toMatchObject({ berhasil: true, kasus: { urutanWafat: [] } });
  });
```

- [x] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web test kasus`
Expected: FAIL — "menolak versi lain" (masih versi 1), "versi 1 jadi 2", "rincian harta", "kategori", "pewaris/ganda", "penghubung dirapikan".

- [x] **Step 3: Implementasi** di `kasus.ts`:

Tambahkan di bawah `SATUAN_PEMBULATAN`:

```ts
// Rincian harta hanya alat bantu mengisi total; engine tetap menerima `tirkah.kotor`.
export const KATEGORI_HARTA = ['tabungan', 'properti', 'kendaraan', 'emas', 'piutang', 'lainnya'] as const;
export type KategoriHarta = typeof KATEGORI_HARTA[number];
```

Ubah `interface Kasus`:

```ts
export interface Kasus {
  versi: 2;
  graf: GrafKeluarga;
  tirkah: InputTirkah;
  satuanPembulatan: bigint;
  /** Kosong = bukan munasakhat. Urut waktu wafat, setelah pewaris. */
  urutanWafat: IdOrang[];
  /** Diisi bila pengguna memilih "Rinci per jenis" di langkah Harta. */
  rincianHarta?: Partial<Record<KategoriHarta, bigint>>;
}
```

Di `kasusBaru`, ganti `versi: 1,` dengan `versi: 2,`.

Ganti seluruh `bacaKasus`:

```ts
function bacaKasus(data: unknown): Kasus {
  const objek = wajibObjek(data, 'kasus');
  // Versi 1 = versi 2 tanpa rincian harta, jadi cukup dibaca dengan aturan yang sama.
  if (objek.versi !== 1 && objek.versi !== 2) throw new Error('Versi file tidak dikenal. Pakai file dari Arif Waris versi ini.');
  const graf = bacaGraf(objek.graf);
  const tirkahMentah = wajibObjek(objek.tirkah, 'tirkah');
  const tirkah: InputTirkah = {
    kotor: bacaUang(tirkahMentah.kotor, 'harta'),
    tajhiz: bacaUang(tirkahMentah.tajhiz, 'biaya jenazah'),
    hutang: bacaUang(tirkahMentah.hutang, 'hutang'),
    wasiat: bacaUang(tirkahMentah.wasiat, 'wasiat'),
  };
  const satuanPembulatan = bacaUang(objek.satuanPembulatan, 'satuan pembulatan');
  if (!SATUAN_PEMBULATAN.includes(satuanPembulatan as 1n)) throw new Error('Satuan pembulatan harus 1, 100, atau 1000.');
  const urutanWafat = bacaUrutanWafat(objek.urutanWafat, graf);
  const rincianHarta = objek.rincianHarta === undefined ? undefined : bacaRincianHarta(objek.rincianHarta);
  const kasus: Kasus = { versi: 2, graf, tirkah, satuanPembulatan, urutanWafat, ...(rincianHarta ? { rincianHarta } : {}) };
  return rapikanUrutanWafat(kasus);
}

function bacaUrutanWafat(nilai: unknown, graf: GrafKeluarga): IdOrang[] {
  const salah = new Error('Daftar yang wafat berisi orang yang tidak ada.');
  if (!Array.isArray(nilai) || !nilai.every(id => typeof id === 'string' && graf.orang[id])) throw salah;
  if (nilai.includes(graf.idPewaris)) throw new Error('Pewaris tidak boleh ada di daftar yang wafat sesudahnya.');
  if (new Set(nilai).size !== nilai.length) throw new Error('Ada orang yang tercatat wafat dua kali.');
  return nilai as IdOrang[];
}

function bacaRincianHarta(nilai: unknown): Partial<Record<KategoriHarta, bigint>> {
  const objek = wajibObjek(nilai, 'rincian harta');
  const rincian: Partial<Record<KategoriHarta, bigint>> = {};
  for (const [kategori, jumlah] of Object.entries(objek)) {
    if (!KATEGORI_HARTA.includes(kategori as KategoriHarta)) throw new Error(`Jenis harta "${kategori}" tidak dikenal.`);
    rincian[kategori as KategoriHarta] = bacaUang(jumlah, `harta ${kategori}`);
  }
  return rincian;
}
```

- [x] **Step 4: Jalankan test web + typecheck**

Run: `pnpm --filter @waris/web test && pnpm --filter @waris/web exec tsc --noEmit -p .`
Expected: PASS semua. Bila test lain memakai `versi: 1` literal, ubah ke `2`.

- [x] **Step 5: Commit**

```bash
git add apps/web/src/kasus.ts apps/web/src/__tests__/kasus.test.ts
git commit -m "web: file kasus versi 2 (rincian harta, migrasi v1, rapikan urutan wafat saat dibuka)"
```

---

### Task 2: Keadaan, tujuan, dan validasi langkah

**Files:**
- Create: `apps/web/src/preferensi.ts`, `apps/web/src/layar/wizard/validasi.ts`
- Modify: `apps/web/src/keadaan.ts`
- Test: `apps/web/src/__tests__/keadaan.test.ts` (tulis ulang), `apps/web/src/__tests__/validasi.test.ts`

**Interfaces:**
- Consumes: `Kasus`, `kasusBaru`, `rapikanUrutanWafat` (Task 1); `hitungIsian` dari `checklist.ts`; `bolehUbahJenisKelamin` dari engine.
- Produces:
  - `preferensi.ts`: `type Tujuan = 'hitung' | 'belajar'`; `bacaTujuan(): Tujuan | null`; `simpanTujuan(tujuan: Tujuan): void`; `sudahLihatTur(kunci: string): boolean`; `tandaiTurDilihat(kunci: string): void`.
  - `validasi.ts`: `LANGKAH_HASIL = 6`; `alasanBelumLengkap(kasus: Kasus | null, langkah: number): string | null`; `langkahTerjauh(kasus: Kasus | null): number` (1–5, atau 6 = hasil boleh dibuka).
  - `keadaan.ts`:
    - `interface KeadaanAplikasi { layar: Layar; langkah: number; kasus: Kasus | null; tujuan: Tujuan | null }`
    - `type Aksi = { jenis:'PILIH_TUJUAN'; tujuan: Tujuan } | { jenis:'MULAI' } | { jenis:'PILIH_PEWARIS'; jenisKelamin:'L'|'P' } | { jenis:'MUAT'; kasus: Kasus } | { jenis:'KE_LANGKAH'; langkah: number } | { jenis:'UBAH_KASUS'; ubah:(kasus: Kasus) => Kasus } | { jenis:'KE_LAYAR'; layar: Layar } | { jenis:'ULANGI' }`
    - `keadaanAwal(kasusTersimpan: Kasus | null, tujuan: Tujuan | null): KeadaanAplikasi`

- [x] **Step 1: Test validasi** — `src/__tests__/validasi.test.ts`:

```ts
import { expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { alasanBelumLengkap, langkahTerjauh, LANGKAH_HASIL } from '../layar/wizard/validasi';

const denganHarta = (kasus: Kasus, kotor: bigint): Kasus => ({ ...kasus, tirkah: { ...kasus.tirkah, kotor } });

it('langkah 1 butuh jenis kelamin (kasus belum ada)', () => {
  expect(alasanBelumLengkap(null, 1)).toMatch(/jenis kelamin/);
  expect(langkahTerjauh(null)).toBe(1);
});

it('harta harus lebih dari 0', () => {
  const kasus = kasusBaru('L');
  expect(alasanBelumLengkap(kasus, 2)).toMatch(/harta/i);
  expect(langkahTerjauh(kasus)).toBe(2);
  expect(alasanBelumLengkap(denganHarta(kasus, 1n), 2)).toBeNull();
});

it('minimal satu ahli waris sebelum lanjut dari langkah 4', () => {
  const kasus = denganHarta(kasusBaru('L'), 1_000_000n);
  expect(langkahTerjauh(kasus)).toBe(4);
  expect(alasanBelumLengkap(kasus, 4)).toMatch(/ahli waris/);
  const lengkap = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
  expect(langkahTerjauh(lengkap)).toBe(LANGKAH_HASIL);
});
```

- [x] **Step 2: Test keadaan** — ganti isi `src/__tests__/keadaan.test.ts`:

```ts
import { beforeEach, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { keadaanAwal, pengurangKeadaan } from '../keadaan';
import { bacaTujuan, simpanTujuan, sudahLihatTur, tandaiTurDilihat } from '../preferensi';

beforeEach(() => localStorage.clear());

const awal = keadaanAwal(null, null);

it('MULAI membuka wizard langkah 1 tanpa kasus (jenis kelamin belum dipilih)', () => {
  expect(pengurangKeadaan(awal, { jenis: 'MULAI' })).toMatchObject({ layar: 'wizard', langkah: 1, kasus: null });
});

it('PILIH_PEWARIS membuat kasus, lalu bisa mengganti jenis kelamin selama belum ada pasangan', () => {
  let keadaan = pengurangKeadaan(pengurangKeadaan(awal, { jenis: 'MULAI' }), { jenis: 'PILIH_PEWARIS', jenisKelamin: 'P' });
  expect(keadaan.kasus?.graf.orang.PEWARIS?.jenisKelamin).toBe('P');
  keadaan = pengurangKeadaan(keadaan, { jenis: 'PILIH_PEWARIS', jenisKelamin: 'L' });
  expect(keadaan.kasus?.graf.orang.PEWARIS?.jenisKelamin).toBe('L');
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ISTRI') }) });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'PILIH_PEWARIS', jenisKelamin: 'P' });
  expect(keadaan.kasus?.graf.orang.PEWARIS?.jenisKelamin).toBe('L');
});

it('KE_LANGKAH tidak bisa melompati langkah yang belum lengkap', () => {
  const keadaan = { ...awal, layar: 'wizard' as const, kasus: kasusBaru('L') };   // harta masih 0
  expect(pengurangKeadaan(keadaan, { jenis: 'KE_LANGKAH', langkah: 4 }).langkah).toBe(2);
});

it('KE_LAYAR hasil ditolak bila isian belum lengkap', () => {
  const keadaan = { ...awal, layar: 'wizard' as const, kasus: kasusBaru('L') };
  expect(pengurangKeadaan(keadaan, { jenis: 'KE_LAYAR', layar: 'hasil' }).layar).toBe('wizard');
});

it('ULANGI menghapus kasus dan kembali ke beranda, tujuan tetap', () => {
  const keadaan = { ...awal, layar: 'wizard' as const, kasus: kasusBaru('L'), tujuan: 'belajar' as const };
  expect(pengurangKeadaan(keadaan, { jenis: 'ULANGI' })).toMatchObject({ layar: 'beranda', kasus: null, tujuan: 'belajar' });
});

it('UBAH_KASUS selalu merapikan urutan wafat', () => {
  const keadaan = { ...awal, kasus: kasusBaru('L') };
  const hasil = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: kasus => ({ ...kasus, urutanWafat: ['TIDAK_ADA'] }) });
  expect(hasil.kasus?.urutanWafat).toEqual([]);
});

it('preferensi tersimpan, dan tetap jalan bila localStorage melempar error', () => {
  simpanTujuan('belajar');
  expect(bacaTujuan()).toBe('belajar');
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('penuh'); });
  const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('diblokir'); });
  tandaiTurDilihat('wizard');
  expect(sudahLihatTur('wizard')).toBe(true);   // jatuh ke memori
  simpanTujuan('hitung');
  expect(bacaTujuan()).toBe('hitung');
  setItem.mockRestore(); getItem.mockRestore();
});
```

- [x] **Step 3: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web test keadaan validasi`
Expected: FAIL — modul `preferensi` dan `layar/wizard/validasi` belum ada.

- [x] **Step 4: `src/preferensi.ts`**

```ts
// Preferensi per pengguna di perangkat ini: tujuan pemakaian dan tur yang sudah dilihat.
// Bukan bagian Kasus. Bila localStorage tidak bisa dipakai, nilai disimpan di memori selama sesi.

export type Tujuan = 'hitung' | 'belajar';

const KUNCI_TUJUAN = 'arif-waris:tujuan';
const AWALAN_TUR = 'arif-waris:tur:';
const cadangan = new Map<string, string>();

function baca(kunci: string): string | null {
  try {
    return localStorage.getItem(kunci) ?? cadangan.get(kunci) ?? null;
  } catch {
    return cadangan.get(kunci) ?? null;
  }
}

function simpan(kunci: string, nilai: string): void {
  cadangan.set(kunci, nilai);
  try {
    localStorage.setItem(kunci, nilai);
  } catch {
    // Mode privat / penyimpanan penuh: cukup di memori.
  }
}

export function bacaTujuan(): Tujuan | null {
  const nilai = baca(KUNCI_TUJUAN);
  return nilai === 'hitung' || nilai === 'belajar' ? nilai : null;
}

export const simpanTujuan = (tujuan: Tujuan): void => simpan(KUNCI_TUJUAN, tujuan);
export const sudahLihatTur = (kunci: string): boolean => baca(AWALAN_TUR + kunci) === '1';
export const tandaiTurDilihat = (kunci: string): void => simpan(AWALAN_TUR + kunci, '1');
```

- [x] **Step 5: `src/layar/wizard/validasi.ts`**

```ts
// Syarat lanjut tiap langkah wizard. Menerima Kasus (null = jenis kelamin belum dipilih);
// menyerahkan alasan dalam bahasa pengguna, dipakai bar bawah dan untuk membatasi lompatan stepper.

import { hitungIsian } from '../../checklist';
import type { Kasus } from '../../kasus';

export const LANGKAH_HASIL = 6;

export function alasanBelumLengkap(kasus: Kasus | null, langkah: number): string | null {
  if (!kasus) return 'Pilih dulu jenis kelamin almarhum.';
  if (langkah === 2 && kasus.tirkah.kotor <= 0n) return 'Isi total harta peninggalan dulu, harus lebih dari Rp 0.';
  if (langkah === 4 && !adaAhliWaris(kasus)) return 'Tambahkan minimal satu ahli waris.';
  return null;
}

/** Langkah terjauh yang boleh dibuka: langkah pertama yang belum lengkap, atau hasil bila semua lengkap. */
export function langkahTerjauh(kasus: Kasus | null): number {
  for (let langkah = 1; langkah < LANGKAH_HASIL; langkah++) {
    if (alasanBelumLengkap(kasus, langkah)) return langkah;
  }
  return LANGKAH_HASIL;
}

const adaAhliWaris = (kasus: Kasus): boolean =>
  Object.values(hitungIsian(kasus.graf, kasus.graf.idPewaris)).some(daftar => (daftar?.length ?? 0) > 0);
```

- [x] **Step 6: Tulis ulang `src/keadaan.ts`**

```ts
// Keadaan aplikasi: layar aktif, langkah wizard, Kasus, dan tujuan pemakaian. Satu reducer, tanpa library state.
// Semua perubahan kasus lewat UBAH_KASUS supaya urutan wafat selalu dirapikan di satu tempat;
// perpindahan langkah dibatasi validasi supaya stepper tidak bisa melompati isian yang belum lengkap.

import { bolehUbahJenisKelamin } from '@waris/engine';
import { kasusBaru, rapikanUrutanWafat, type Kasus } from './kasus';
import type { Tujuan } from './preferensi';
import { LANGKAH_HASIL, langkahTerjauh } from './layar/wizard/validasi';

export const TOTAL_LANGKAH = 5;
export type Layar = 'beranda' | 'wizard' | 'hasil' | 'belajar';

export interface KeadaanAplikasi { layar: Layar; langkah: number; kasus: Kasus | null; tujuan: Tujuan | null }

export type Aksi =
  | { jenis: 'PILIH_TUJUAN'; tujuan: Tujuan }
  | { jenis: 'MULAI' }
  | { jenis: 'PILIH_PEWARIS'; jenisKelamin: 'L' | 'P' }
  | { jenis: 'MUAT'; kasus: Kasus }
  | { jenis: 'KE_LANGKAH'; langkah: number }
  | { jenis: 'UBAH_KASUS'; ubah: (kasus: Kasus) => Kasus }
  | { jenis: 'KE_LAYAR'; layar: Layar }
  | { jenis: 'ULANGI' };

export const keadaanAwal = (kasusTersimpan: Kasus | null, tujuan: Tujuan | null): KeadaanAplikasi =>
  ({ layar: 'beranda', langkah: 1, kasus: kasusTersimpan, tujuan });

export function pengurangKeadaan(keadaan: KeadaanAplikasi, aksi: Aksi): KeadaanAplikasi {
  switch (aksi.jenis) {
    case 'PILIH_TUJUAN': return { ...keadaan, tujuan: aksi.tujuan };
    case 'MULAI': return { ...keadaan, layar: 'wizard', langkah: 1, kasus: null };
    case 'PILIH_PEWARIS': return { ...keadaan, kasus: pilihPewaris(keadaan.kasus, aksi.jenisKelamin) };
    case 'MUAT': return { ...keadaan, layar: 'hasil', langkah: TOTAL_LANGKAH, kasus: aksi.kasus };
    case 'KE_LANGKAH': {
      const batas = Math.min(TOTAL_LANGKAH, langkahTerjauh(keadaan.kasus));
      return { ...keadaan, layar: 'wizard', langkah: Math.min(batas, Math.max(1, aksi.langkah)) };
    }
    case 'UBAH_KASUS': return keadaan.kasus ? { ...keadaan, kasus: rapikanUrutanWafat(aksi.ubah(keadaan.kasus)) } : keadaan;
    case 'KE_LAYAR': {
      const bolehHasil = langkahTerjauh(keadaan.kasus) === LANGKAH_HASIL;
      if ((aksi.layar === 'hasil' || aksi.layar === 'belajar') && !bolehHasil) return keadaan;
      return { ...keadaan, layar: aksi.layar };
    }
    case 'ULANGI': return { ...keadaan, layar: 'beranda', langkah: 1, kasus: null };
  }
}

/** Kasus dibuat saat jenis kelamin pertama kali dipilih; sesudahnya hanya boleh diganti selama belum ada pasangan/anak. */
function pilihPewaris(kasus: Kasus | null, jenisKelamin: 'L' | 'P'): Kasus {
  if (!kasus) return kasusBaru(jenisKelamin);
  const { idPewaris } = kasus.graf;
  if (!bolehUbahJenisKelamin(kasus.graf, idPewaris)) return kasus;
  const pewaris = kasus.graf.orang[idPewaris]!;
  return { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [idPewaris]: { ...pewaris, jenisKelamin } } } };
}
```

- [x] **Step 7: Sesuaikan pemanggil lama supaya build tetap jalan.**
  - `Aplikasi.tsx`: `keadaanAwal(muatLokal())` → `keadaanAwal(muatLokal(), bacaTujuan())` (import `bacaTujuan` dari `./preferensi`).
  - `layar/Beranda.tsx`: `kirim({ jenis: 'MULAI', jenisKelamin: 'L' })` → `kirim({ jenis: 'MULAI' })`.
  - `layar/Wizard.tsx`: sementara, di awal fungsi `Wizard` tambahkan penjaga supaya langkah 1 tetap bisa dipakai saat `kasus` null (akan diganti Task 3):
    ```tsx
    if (!keadaan.kasus) {
      return (
        <main className="halaman tumpuk">
          <h1 className="judul-langkah">Almarhum laki-laki atau perempuan?</h1>
          <div className="chip-deret">
            <Pilihan saatKlik={() => kirim({ jenis: 'PILIH_PEWARIS', jenisKelamin: 'L' })}>Laki-laki</Pilihan>
            <Pilihan saatKlik={() => kirim({ jenis: 'PILIH_PEWARIS', jenisKelamin: 'P' })}>Perempuan</Pilihan>
          </div>
        </main>
      );
    }
    ```
  - `Aplikasi.tsx`: ubah pemilihan layar supaya `wizard` tampil walau `kasus` null:
    ```tsx
    {keadaan.layar === 'wizard' ? <Wizard keadaan={keadaan} kirim={kirim} />
      : keadaan.layar === 'beranda' || !kasus ? <Beranda kasusTersimpan={kasus} kirim={kirim} />
      : keadaan.layar === 'hasil' ? <Hasil kasus={kasus} kirim={kirim} />
      : <ModeBelajar kasus={kasus} kirim={kirim} />}
    ```
  - `__tests__/asap.test.tsx` alur penuh: setelah klik "Mulai hitung", klik "Laki-laki", lalu isi harta sebelum lanjut: tambahkan sebelum loop langkah
    ```tsx
    fireEvent.click(screen.getByText('Gas, langkah berikutnya'));
    fireEvent.change(screen.getByLabelText(/Total harta/), { target: { value: '24.000.000' } });
    fireEvent.click(screen.getByText('Gas, langkah berikutnya'));
    fireEvent.click(screen.getByText('Gas, langkah berikutnya'));
    ```
    dan hapus loop `for (let langkah = 1; langkah <= 3; ...)`.

- [x] **Step 8: Jalankan semua test + typecheck**

Run: `pnpm --filter @waris/web test && pnpm --filter @waris/web exec tsc --noEmit -p .`
Expected: PASS.

- [x] **Step 9: Commit**

```bash
git add apps/web/src
git commit -m "web: keadaan dengan tujuan & validasi langkah, preferensi lokal"
```

---

### Task 3: Kerangka wizard, header, beranda

**Files:**
- Create: `apps/web/src/konten/wizard.ts`, `apps/web/src/konten/umum.ts`, `apps/web/src/berkas.ts`,
  `apps/web/src/layar/wizard/Stepper.tsx`, `apps/web/src/layar/wizard/BarBawah.tsx`, `apps/web/src/layar/wizard/KerangkaLangkah.tsx`,
  `apps/web/src/layar/wizard/LangkahPewaris.tsx`, `apps/web/src/layar/Kepala.tsx`
- Modify: `apps/web/src/layar/Wizard.tsx`, `apps/web/src/layar/Beranda.tsx`, `apps/web/src/Aplikasi.tsx`,
  `apps/web/src/layar/Hasil.tsx` (tombol Simpan file), `apps/web/src/gaya/komponen.css`
- Test: `apps/web/src/__tests__/kerangka.test.tsx`, update `asap.test.tsx`

**Interfaces:**
- Consumes: `alasanBelumLengkap`, `langkahTerjauh`, `LANGKAH_HASIL` (Task 2); `Aksi`, `KeadaanAplikasi` (Task 2); `Tombol`, `Logo` dari `ui/komponen`.
- Produces:
  - `konten/wizard.ts`: `interface TeksLangkah { nama: string; pertanyaan: string; caption: string; perluCek?: boolean }`, `LANGKAH_WIZARD: TeksLangkah[]` (indeks 0 = langkah 1).
  - `konten/umum.ts`: `TAUTAN_LAPORAN`, `TEKS_BERANDA`.
  - `berkas.ts`: `unduhKasus(kasus: Kasus): void`.
  - `Kepala({ adaKasus, adaTur, saatKeBeranda, saatTur, saatUlangi })` — header dengan konfirmasi ulangi di halaman.
  - `Stepper({ langkahAktif, terjauh, saatPilih })`, `BarBawah({ langkah, alasan, saatKembali, saatLanjut })`,
    `KerangkaLangkah({ langkah, children, ringkasan? })`, `LangkahPewaris({ kasus, saatPilih, saatUbahNama })`.

- [x] **Step 1: Test kerangka** — `src/__tests__/kerangka.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { Aplikasi } from '../Aplikasi';

beforeEach(() => localStorage.clear());

const mulai = (tujuan: 'Hitung kasus' | 'Belajar' = 'Hitung kasus') => {
  render(<Aplikasi />);
  fireEvent.click(screen.getByRole('button', { name: new RegExp(tujuan) }));
};

it('beranda menanyakan tujuan lalu membuka langkah pewaris tanpa pilihan bawaan', () => {
  mulai();
  expect(screen.getByRole('heading', { name: /laki-laki atau perempuan/i })).toBeTruthy();
  expect(screen.getByRole('radio', { name: /Laki-laki/ }).getAttribute('aria-checked')).toBe('false');
  expect(screen.getByRole('radio', { name: /Perempuan/ }).getAttribute('aria-checked')).toBe('false');
});

it('tombol lanjut nonaktif dengan alasan tertulis', () => {
  mulai();
  const lanjut = screen.getByRole('button', { name: /Lanjut: Harta/ });
  expect(lanjut.hasAttribute('disabled')).toBe(true);
  expect(screen.getByText(/Pilih dulu jenis kelamin/)).toBeTruthy();
  fireEvent.click(screen.getByRole('radio', { name: /Perempuan/ }));
  expect(screen.getByRole('button', { name: /Lanjut: Harta/ }).hasAttribute('disabled')).toBe(false);
});

it('stepper tidak bisa membuka langkah yang belum boleh', () => {
  mulai();
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  const ahliWaris = screen.getByRole('button', { name: /Ahli waris/ });
  expect(ahliWaris.hasAttribute('disabled')).toBe(true);
});

it('ulangi dari awal meminta konfirmasi di halaman', () => {
  mulai();
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Ulangi dari awal' }));
  expect(screen.getByRole('alertdialog')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Simpan file dulu/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(screen.getByRole('heading', { name: /laki-laki atau perempuan/i })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ulangi dari awal' }));
  fireEvent.click(screen.getByRole('button', { name: /Hapus dan mulai baru/ }));
  expect(screen.getByText(/Mau pakai buat apa/)).toBeTruthy();
});

it('header tidak punya tombol simpan', () => {
  mulai();
  expect(screen.queryByRole('banner')?.textContent ?? '').not.toMatch(/Simpan file/);
});
```

Perbarui `asap.test.tsx` "alur penuh" supaya mengikuti label baru:

```tsx
it('alur penuh: beranda → wizard → hasil', () => {
  render(<Aplikasi />);
  fireEvent.click(screen.getByRole('button', { name: /Hitung kasus/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut: Harta/ }));
  fireEvent.change(screen.getByLabelText(/Total harta/), { target: { value: '24.000.000' } });
  fireEvent.click(screen.getByRole('button', { name: /Lanjut: Kewajiban/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut: Ahli waris/ }));
  fireEvent.click(screen.getByLabelText('Tambah Istri'));
  fireEvent.click(screen.getByLabelText('Tambah Anak laki-laki'));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut: Kondisi khusus/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lihat hasil/ }));
  expect(screen.getByText('Nah, ini pembagiannya')).toBeTruthy();
});

it('autosave: kasus muncul lagi setelah render ulang', () => {
  const { unmount } = render(<Aplikasi />);
  fireEvent.click(screen.getByRole('button', { name: /Hitung kasus/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  unmount();
  render(<Aplikasi />);
  expect(screen.getByRole('button', { name: /Lanjutkan kasus terakhir/ })).toBeTruthy();
});
```

- [x] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web test kerangka asap`
Expected: FAIL (tombol "Hitung kasus" belum ada).

- [x] **Step 3: Konten** — `src/konten/wizard.ts`:

```ts
// Teks kerangka wizard: nama langkah (stepper & tombol Lanjut), pertanyaan utama, dan caption penjelas.
// Diedit tim keilmuan/konten tanpa menyentuh logika. `perluCek` = belum diverifikasi tim keilmuan.

export interface TeksLangkah { nama: string; pertanyaan: string; caption: string; perluCek?: boolean }

export const LANGKAH_WIZARD: TeksLangkah[] = [
  { nama: 'Pewaris', pertanyaan: 'Almarhum laki-laki atau perempuan?',
    caption: 'Ini menentukan pasangan yang ditanya nanti (istri atau suami) dan besar bagiannya.' },
  { nama: 'Harta', pertanyaan: 'Berapa harta peninggalannya?',
    caption: 'Semua yang dimiliki almarhum saat wafat: uang, tanah, kendaraan, emas, juga piutang yang bisa ditagih.', perluCek: true },
  { nama: 'Kewajiban', pertanyaan: 'Ada kewajiban yang harus dibayar dulu?',
    caption: 'Sebelum dibagi, harta dipakai dulu untuk mengurus jenazah, melunasi hutang, lalu menunaikan wasiat.' },
  { nama: 'Ahli waris', pertanyaan: 'Siapa saja keluarga yang ditinggalkan?',
    caption: 'Masukkan semua kerabat yang masih hidup saat almarhum wafat. Nanti dihitung siapa yang dapat.' },
  { nama: 'Kondisi khusus', pertanyaan: 'Ada kondisi khusus?',
    caption: 'Opsional. Kebanyakan kasus nggak butuh ini.' },
];
```

`src/konten/umum.ts`:

```ts
// Teks umum di luar wizard.

/** Ganti dengan URL repo sungguhan saat dipublikasikan. */
export const TAUTAN_LAPORAN = 'https://github.com/NAMA-ORG/arif-waris/issues';

export const TEKS_BERANDA = {
  judul: 'Waris itu gampang, asal tahu urutannya.',
  janji: 'Masukin kasusnya, ikutin langkahnya. Tiap angka dijelasin, lengkap sama alasannya.',
  fakta: ['5 langkah, sekitar 3 menit', "Madzhab Syafi'i", 'Dihitung di perangkatmu, nggak dikirim ke mana-mana'],
  tanyaTujuan: 'Mau pakai buat apa?',
  tujuan: {
    hitung: { judul: 'Hitung kasus', keterangan: 'Ada keluarga yang meninggal dan mau tahu pembagiannya.' },
    belajar: { judul: 'Belajar', keterangan: 'Latihan faraidh. Jawaban disembunyikan dulu supaya bisa menebak.' },
  },
} as const;
```

- [x] **Step 4: `src/berkas.ts`** (dipindah dari `Aplikasi.tsx`):

```ts
// Simpan kasus sebagai file JSON di perangkat pengguna.

import { keJson, type Kasus } from './kasus';

export function unduhKasus(kasus: Kasus): void {
  const tautan = document.createElement('a');
  tautan.href = URL.createObjectURL(new Blob([keJson(kasus)], { type: 'application/json' }));
  tautan.download = 'kasus-waris.json';
  tautan.click();
  URL.revokeObjectURL(tautan.href);
}
```

- [x] **Step 5: `src/layar/Kepala.tsx`**

```tsx
// Header global: logo (ke beranda), menu utama, tur, dan "Ulangi dari awal" dengan konfirmasi di halaman.
// Tidak memuat tombol simpan (spec: Navigasi global).

import { useState } from 'react';
import { Logo, Tombol } from '../ui/komponen';

interface Props {
  adaKasus: boolean;
  adaTur: boolean;
  saatKeBeranda: () => void;
  saatTur: () => void;
  saatUlangi: () => void;
  saatSimpan: () => void;
}

export function Kepala({ adaKasus, adaTur, saatKeBeranda, saatTur, saatUlangi, saatSimpan }: Props) {
  const [sedangKonfirmasi, setSedangKonfirmasi] = useState(false);
  return (
    <>
      <header className="kepala" role="banner">
        <Logo saatKlik={saatKeBeranda} />
        <nav aria-label="Menu utama"><a href="#" aria-current="page" className="kepala-menu">Kalkulator</a></nav>
        <span className="pengisi" />
        {adaTur && <Tombol varian="secondary" kecil onClick={saatTur}>Tur singkat</Tombol>}
        {adaKasus && <Tombol varian="secondary" kecil onClick={() => setSedangKonfirmasi(true)}>Ulangi dari awal</Tombol>}
      </header>
      {sedangKonfirmasi && (
        <div className="konfirmasi" role="alertdialog" aria-labelledby="judul-konfirmasi" aria-describedby="isi-konfirmasi">
          <div className="konfirmasi-isi">
            <h2 id="judul-konfirmasi">Mulai kasus baru?</h2>
            <p id="isi-konfirmasi">Kasus yang sedang diisi akan dihapus dari perangkat ini. Mau simpan file-nya dulu?</p>
            <div className="chip-deret">
              <Tombol varian="secondary" onClick={saatSimpan}>Simpan file dulu</Tombol>
              <Tombol onClick={() => { setSedangKonfirmasi(false); saatUlangi(); }}>Hapus dan mulai baru</Tombol>
              <Tombol varian="ghost" onClick={() => setSedangKonfirmasi(false)}>Batal</Tombol>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [x] **Step 6: Kerangka wizard**

`src/layar/wizard/Stepper.tsx`:

```tsx
// Stepper: nama semua langkah + Hasil. Langkah yang sudah boleh dibuka bisa diklik; sisanya nonaktif.

import { LANGKAH_WIZARD } from '../../konten/wizard';
import { LANGKAH_HASIL } from './validasi';

interface Props { langkahAktif: number; terjauh: number; saatPilih: (langkah: number) => void }

export function Stepper({ langkahAktif, terjauh, saatPilih }: Props) {
  const daftar = [...LANGKAH_WIZARD.map(teks => teks.nama), 'Hasil'];
  return (
    <nav className="stepper" aria-label="Langkah isian">
      {daftar.map((nama, indeks) => {
        const langkah = indeks + 1;
        const adalahAktif = langkah === langkahAktif;
        const sudahLengkap = langkah < terjauh && !adalahAktif && langkah !== LANGKAH_HASIL;
        return (
          <button key={nama} type="button" className="stepper-item" disabled={langkah > terjauh}
            aria-current={adalahAktif ? 'step' : undefined} onClick={() => saatPilih(langkah)}>
            <b aria-hidden="true">{sudahLengkap ? '✓' : langkah === LANGKAH_HASIL ? '★' : langkah}</b>{nama}
          </button>
        );
      })}
    </nav>
  );
}
```

`src/layar/wizard/BarBawah.tsx`:

```tsx
// Bar bawah wizard: Kembali (kiri) dan "Lanjut: {langkah berikut}" (kanan). Bila isian wajib belum lengkap,
// tombol lanjut nonaktif dan alasannya tertulis di sampingnya.

import { LANGKAH_WIZARD } from '../../konten/wizard';
import { Tombol } from '../../ui/komponen';

interface Props { langkah: number; alasan: string | null; saatKembali: () => void; saatLanjut: () => void }

export function BarBawah({ langkah, alasan, saatKembali, saatLanjut }: Props) {
  const berikut = LANGKAH_WIZARD[langkah];   // indeks = langkah berikutnya
  return (
    <div className="bar-bawah">
      <div className="bar-bawah-isi">
        <Tombol varian="secondary" onClick={saatKembali}>Kembali</Tombol>
        <span className="pengisi" />
        {alasan && <span className="alasan" id="alasan-lanjut">{alasan}</span>}
        <Tombol onClick={saatLanjut} disabled={!!alasan} {...(alasan ? { 'aria-describedby': 'alasan-lanjut' } : {})}>
          {berikut ? `Lanjut: ${berikut.nama}` : 'Lihat hasil'}
        </Tombol>
      </div>
    </div>
  );
}
```

`src/layar/wizard/KerangkaLangkah.tsx`:

```tsx
// Kerangka satu langkah: pertanyaan utama (paling besar), caption penjelas, isi, dan ringkasan kasus di samping (desktop).

import type { ReactNode } from 'react';
import { LANGKAH_WIZARD } from '../../konten/wizard';

export function KerangkaLangkah({ langkah, children, ringkasan }: { langkah: number; children: ReactNode; ringkasan?: ReactNode }) {
  const teks = LANGKAH_WIZARD[langkah - 1]!;
  return (
    <div className="kerangka-langkah">
      <section className="kerangka-utama" aria-labelledby="pertanyaan-utama">
        <p className="label-langkah">Langkah {langkah} dari {LANGKAH_WIZARD.length}</p>
        <h1 id="pertanyaan-utama" className="pertanyaan-utama">{teks.pertanyaan}</h1>
        <p className="caption-langkah">{teks.caption}</p>
        <div className="tumpuk">{children}</div>
      </section>
      {ringkasan && <aside className="kerangka-samping" aria-label="Ringkasan kasus">{ringkasan}</aside>}
    </div>
  );
}
```

`src/layar/wizard/LangkahPewaris.tsx`:

```tsx
// Langkah 1: jenis kelamin almarhum sebagai pertanyaan utama (dua kartu berikon, tanpa pilihan bawaan);
// nama hanya isian kecil opsional.

import type { Kasus } from '../../kasus';

interface Props { kasus: Kasus | null; saatPilih: (jenisKelamin: 'L' | 'P') => void; saatUbahNama: (nama: string) => void }

export function LangkahPewaris({ kasus, saatPilih, saatUbahNama }: Props) {
  const pewaris = kasus?.graf.orang[kasus.graf.idPewaris];
  const pilihan: Array<['L' | 'P', string]> = [['L', 'Laki-laki'], ['P', 'Perempuan']];
  return (
    <>
      <div className="kartu-pilihan-deret" role="radiogroup" aria-labelledby="pertanyaan-utama">
        {pilihan.map(([jenisKelamin, label]) => (
          <button key={jenisKelamin} type="button" role="radio" aria-checked={pewaris?.jenisKelamin === jenisKelamin}
            className="kartu-pilihan" onClick={() => saatPilih(jenisKelamin)}>
            <IkonGender jenisKelamin={jenisKelamin} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {kasus && (
        <label className="isian isian-kecil">Nama almarhum <span className="opsional">(boleh dikosongkan)</span>
          <input value={pewaris?.nama ?? ''} onChange={event => saatUbahNama(event.target.value)} />
        </label>
      )}
    </>
  );
}

function IkonGender({ jenisKelamin }: { jenisKelamin: 'L' | 'P' }) {
  return (
    <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
      {jenisKelamin === 'L'
        ? <><circle cx="20" cy="28" r="12" /><path d="M29 19l11-11M30 8h10v10" /></>
        : <><circle cx="24" cy="18" r="12" /><path d="M24 30v14M17 38h14" /></>}
    </svg>
  );
}
```

- [x] **Step 7: `src/layar/Wizard.tsx`** — ganti fungsi `Wizard` (fungsi `LangkahHarta`, `LangkahKewajiban`, `IsianUang` tetap; hapus `LangkahPewaris` lama, `JUDUL_LANGKAH`, dan penjaga sementara dari Task 2):

```tsx
export function Wizard({ keadaan, kirim }: { keadaan: KeadaanAplikasi; kirim: (aksi: Aksi) => void }) {
  const { kasus, langkah } = keadaan;
  const ubah = (fungsiUbah: (kasus: Kasus) => Kasus) => kirim({ jenis: 'UBAH_KASUS', ubah: fungsiUbah });
  const alasan = alasanBelumLengkap(kasus, langkah);
  return (
    <main className="halaman halaman-wizard">
      <Stepper langkahAktif={langkah} terjauh={langkahTerjauh(kasus)}
        saatPilih={tujuan => kirim(tujuan === LANGKAH_HASIL ? { jenis: 'KE_LAYAR', layar: 'hasil' } : { jenis: 'KE_LANGKAH', langkah: tujuan })} />
      <KerangkaLangkah langkah={langkah}>
        {langkah === 1 && <LangkahPewaris kasus={kasus} saatPilih={jenisKelamin => kirim({ jenis: 'PILIH_PEWARIS', jenisKelamin })}
          saatUbahNama={nama => ubah(k => ubahNamaPewaris(k, nama))} />}
        {kasus && langkah === 2 && <LangkahHarta kasus={kasus} ubah={ubah} />}
        {kasus && langkah === 3 && <LangkahKewajiban kasus={kasus} ubah={ubah} />}
        {kasus && langkah === 4 && <LangkahAhliWaris graf={kasus.graf} idMayit={kasus.graf.idPewaris} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />}
        {kasus && langkah === 5 && <LangkahKondisi kasus={kasus} ubah={ubah} />}
      </KerangkaLangkah>
      <BarBawah langkah={langkah} alasan={alasan}
        saatKembali={() => kirim(langkah === 1 ? { jenis: 'KE_LAYAR', layar: 'beranda' } : { jenis: 'KE_LANGKAH', langkah: langkah - 1 })}
        saatLanjut={() => kirim(langkah === TOTAL_LANGKAH ? { jenis: 'KE_LAYAR', layar: 'hasil' } : { jenis: 'KE_LANGKAH', langkah: langkah + 1 })} />
    </main>
  );
}

function ubahNamaPewaris(kasus: Kasus, nama: string): Kasus {
  const { nama: _lama, ...tanpaNama } = kasus.graf.orang[kasus.graf.idPewaris]!;
  const pewaris = nama ? { ...tanpaNama, nama } : tanpaNama;
  return { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [kasus.graf.idPewaris]: pewaris } } };
}
```

Impor di atas file: `Stepper`, `BarBawah`, `KerangkaLangkah`, `LangkahPewaris` dari `./wizard/*`; `alasanBelumLengkap`, `langkahTerjauh`, `LANGKAH_HASIL` dari `./wizard/validasi`. Hapus impor `Stiker` dan `bolehUbahJenisKelamin` bila tak terpakai.
Di `IsianUang`, pastikan label mengandung "Total harta" (sudah: "Total harta peninggalan (Rp)").

- [x] **Step 8: `src/layar/Beranda.tsx`** — ganti isi komponen:

```tsx
// Beranda: janji singkat, pertanyaan pembuka (Hitung kasus / Belajar), lanjutkan kasus tersimpan, buka file.

import { useRef, useState } from 'react';
import { TEKS_BERANDA } from '../konten/umum';
import { dariJson, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import type { Tujuan } from '../preferensi';
import { Motif, Tombol } from '../ui/komponen';

export function Beranda({ kasusTersimpan, kirim }: { kasusTersimpan: Kasus | null; kirim: (aksi: Aksi) => void }) {
  const inputFile = useRef<HTMLInputElement>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const saatPilihFile = async (file: File | undefined) => {
    if (!file) return;
    const hasil = dariJson(await file.text());
    if (hasil.berhasil) kirim({ jenis: 'MUAT', kasus: hasil.kasus });
    else setPesan(`File-nya nggak bisa dibuka: ${hasil.pesan}`);
  };
  const saatPilihTujuan = (tujuan: Tujuan) => { kirim({ jenis: 'PILIH_TUJUAN', tujuan }); kirim({ jenis: 'MULAI' }); };
  return (
    <Motif>
      <main className="halaman tumpuk beranda">
        <h1 className="judul-beranda">{TEKS_BERANDA.judul}</h1>
        <p className="lead">{TEKS_BERANDA.janji}</p>
        <ul className="fakta-beranda">{TEKS_BERANDA.fakta.map(fakta => <li key={fakta}>{fakta}</li>)}</ul>
        <h2 className="tanya-tujuan">{TEKS_BERANDA.tanyaTujuan}</h2>
        <div className="kartu-pilihan-deret">
          {(['hitung', 'belajar'] as const).map(tujuan => (
            <button key={tujuan} type="button" className="kartu-pilihan kartu-tujuan" onClick={() => saatPilihTujuan(tujuan)}>
              <span>{TEKS_BERANDA.tujuan[tujuan].judul}</span>
              <small>{TEKS_BERANDA.tujuan[tujuan].keterangan}</small>
            </button>
          ))}
        </div>
        <div className="chip-deret">
          {kasusTersimpan && <Tombol varian="sun" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 1 })}>Lanjutkan kasus terakhir</Tombol>}
          <Tombol varian="secondary" onClick={() => inputFile.current?.click()}>Buka file</Tombol>
          <input ref={inputFile} type="file" accept="application/json,.json" hidden onChange={event => void saatPilihFile(event.target.files?.[0])} />
        </div>
        {pesan && <p className="isian-salah" role="alert">{pesan}</p>}
      </main>
    </Motif>
  );
}
```

Catatan: memilih tujuan saat sudah ada kasus tersimpan memulai kasus baru; ini sama dengan "Ulangi" dan boleh, karena kasus lama tetap bisa dibuka lewat "Lanjutkan kasus terakhir" sampai kasus baru mengisi jenis kelamin. (Autosave baru menimpa saat `kasus` tidak null.) Pastikan `simpanLokal` di `Aplikasi.tsx` hanya dipanggil bila `keadaan.kasus` tidak null **atau** aksi terakhir `ULANGI` — lihat Step 9.

- [x] **Step 9: `src/Aplikasi.tsx`**

```tsx
// Rangkaian aplikasi: reducer keadaan, autosave, header global, dan pemilihan layar.

import { useEffect, useReducer, useRef } from 'react';
import { unduhKasus } from './berkas';
import { muatLokal, simpanLokal } from './kasus';
import { keadaanAwal, pengurangKeadaan, type Aksi } from './keadaan';
import { bacaTujuan, simpanTujuan } from './preferensi';
import { Beranda } from './layar/Beranda';
import { Hasil } from './layar/Hasil';
import { Kepala } from './layar/Kepala';
import { ModeBelajar } from './layar/ModeBelajar';
import { Wizard } from './layar/Wizard';

export function Aplikasi() {
  const [keadaan, kirimAsli] = useReducer(pengurangKeadaan, null, () => keadaanAwal(muatLokal(), bacaTujuan()));
  // Kasus tersimpan hanya dihapus lewat ULANGI; MULAI (kasus null sementara) tidak menimpa simpanan lama.
  const hapusSimpanan = useRef(false);
  const kirim = (aksi: Aksi) => { if (aksi.jenis === 'ULANGI') hapusSimpanan.current = true; kirimAsli(aksi); };

  useEffect(() => {
    if (keadaan.kasus || hapusSimpanan.current) simpanLokal(keadaan.kasus);
    hapusSimpanan.current = false;
  }, [keadaan.kasus]);
  useEffect(() => { if (keadaan.tujuan) simpanTujuan(keadaan.tujuan); }, [keadaan.tujuan]);

  const { kasus, layar } = keadaan;
  return (
    <>
      <Kepala adaKasus={!!kasus && layar !== 'beranda'} adaTur={false}
        saatKeBeranda={() => kirim({ jenis: 'KE_LAYAR', layar: 'beranda' })} saatTur={() => {}}
        saatUlangi={() => kirim({ jenis: 'ULANGI' })} saatSimpan={() => kasus && unduhKasus(kasus)} />
      {layar === 'wizard' ? <Wizard keadaan={keadaan} kirim={kirim} />
        : layar === 'beranda' || !kasus ? <Beranda kasusTersimpan={muatLokalAtau(kasus)} kirim={kirim} />
        : layar === 'hasil' ? <Hasil kasus={kasus} kirim={kirim} />
        : <ModeBelajar kasus={kasus} kirim={kirim} />}
    </>
  );
}

/** Di beranda, tawarkan kasus yang sedang dikerjakan; bila belum ada, yang tersimpan di perangkat. */
const muatLokalAtau = (kasus: ReturnType<typeof muatLokal>) => kasus ?? muatLokal();
```

Karena "Lanjutkan kasus terakhir" di beranda mengirim `KE_LANGKAH` sementara `keadaan.kasus` bisa null (setelah MULAI lalu kembali ke beranda), ubah tombol itu di Beranda menjadi `kirim({ jenis: 'MUAT', kasus: kasusTersimpan })` lalu `kirim({ jenis: 'KE_LANGKAH', langkah: 1 })`.

Di `layar/Hasil.tsx`, pada `baris-tombol` hasil OK tambahkan tombol simpan (sebelum layar hasil dirombak di tahap 4):

```tsx
<Tombol varian="secondary" onClick={() => unduhKasus(kasus)}>Simpan file</Tombol>
```

dengan `import { unduhKasus } from '../berkas';`. Hapus `BilahNavigasi` dari impor `Aplikasi.tsx` (komponennya tetap ada di `ui/komponen.tsx`).

- [x] **Step 10: CSS** — tambahkan di akhir `src/gaya/komponen.css`:

```css
/* ─── Kerangka desain ulang (tahap 1) ─── */
.kepala{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:16px;padding:10px 20px;background:var(--surface-raised);border-bottom:var(--border-w) solid var(--outline)}
.kepala-menu{display:inline-flex;align-items:center;height:40px;padding:0 12px;border-radius:12px;color:var(--ink);text-decoration:none;font-weight:700;font-size:14px}
.kepala-menu[aria-current=page]{background:var(--sun);color:var(--on-fill)}
.pengisi{flex:1}
.konfirmasi{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:16px;background:rgba(17,19,34,.5)}
.konfirmasi-isi{max-width:440px;width:100%;background:var(--surface-raised);border:var(--border-w) solid var(--outline);border-radius:var(--radius-lg);box-shadow:var(--shadow-pop);padding:22px;display:flex;flex-direction:column;gap:12px}
.konfirmasi-isi h2{font-family:var(--font-display);margin:0;font-size:22px}
.konfirmasi-isi p{margin:0}
.halaman-wizard{padding-bottom:120px}
.stepper{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 8px}
.stepper-item{flex:none;display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 12px;border-radius:999px;border:var(--border-w) solid var(--outline);background:var(--surface-raised);color:var(--ink);font:700 13px/1 var(--font-sans);cursor:pointer}
.stepper-item b{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:6px;background:var(--surface-sunken);font-size:11px}
.stepper-item[aria-current=step]{background:var(--ink);color:var(--surface-raised)}
.stepper-item:disabled{opacity:.45;cursor:not-allowed}
.stepper-item:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.kerangka-langkah{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:24px;align-items:start;margin-top:12px}
.kerangka-langkah:not(:has(.kerangka-samping)){grid-template-columns:minmax(0,1fr)}
.kerangka-utama{display:flex;flex-direction:column;gap:10px;max-width:720px}
.label-langkah{margin:0;font:800 12px/1 var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)}
.pertanyaan-utama{margin:0;font-family:var(--font-display);font-weight:700;font-size:clamp(28px,4vw,38px);line-height:1.1;letter-spacing:-1px;text-wrap:balance}
.caption-langkah{margin:0 0 8px;color:var(--ink-muted);font-size:15px;line-height:1.55;max-width:60ch}
.kerangka-samping{position:sticky;top:84px;background:var(--surface-raised);border:var(--border-w) solid var(--outline);border-radius:var(--radius-md);padding:16px}
.bar-bawah{position:fixed;left:0;right:0;bottom:0;z-index:20;background:var(--surface-raised);border-top:var(--border-w) solid var(--outline);padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px))}
.bar-bawah-isi{max-width:960px;margin:0 auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.alasan{font-size:13px;font-weight:700;color:var(--ink-muted);max-width:280px;text-align:right}
.kartu-pilihan-deret{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
.kartu-pilihan{display:flex;flex-direction:column;align-items:flex-start;gap:10px;min-height:120px;padding:20px;border-radius:var(--radius-md);border:var(--border-w) solid var(--outline);background:var(--surface-raised);color:var(--ink);box-shadow:var(--shadow-pop);cursor:pointer;text-align:left;font:700 22px/1.2 var(--font-display);transition:transform .1s,box-shadow .1s}
.kartu-pilihan:active{transform:translate(4px,4px);box-shadow:none}
.kartu-pilihan[aria-checked=true]{background:var(--primary);color:var(--on-primary)}
.kartu-pilihan:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.kartu-pilihan small{font:500 14px/1.45 var(--font-sans);color:var(--ink-muted)}
.isian-kecil{max-width:360px;font-size:14px}
.isian-kecil input{height:44px;font-size:16px}
.opsional{font-weight:500;color:var(--ink-muted)}
.beranda{padding-top:56px}
.judul-beranda{font-family:var(--font-display);font-size:clamp(34px,6vw,56px);line-height:1.05;letter-spacing:-2px;margin:0;max-width:16ch}
.lead{font-size:18px;line-height:1.6;max-width:56ch;margin:0}
.fakta-beranda{display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:0;list-style:none}
.fakta-beranda li{padding:6px 12px;border-radius:999px;background:var(--surface-sunken);font-weight:700;font-size:13px}
.tanya-tujuan{font-family:var(--font-display);font-size:22px;margin:16px 0 0}
@media (max-width:900px){.kerangka-langkah{grid-template-columns:minmax(0,1fr)}.kerangka-samping{display:none}}
@media (max-width:560px){.kepala{padding:8px 16px;gap:10px}.kepala .aw-logo small{display:none}.alasan{text-align:left;max-width:none;order:-1;width:100%}}
```

- [x] **Step 11: Jalankan semua test + typecheck + build**

Run: `pnpm --filter @waris/web test && pnpm --filter @waris/web build`
Expected: PASS; build sukses. Test lama yang mencari teks "Mulai hitung" / "Lanjutin kasus terakhir" / "Gas, langkah berikutnya" diperbarui ke label baru (`Hitung kasus`, `Lanjutkan kasus terakhir`, `Lanjut: …`).

- [x] **Step 12: Cek manual**

Run: `pnpm --filter @waris/web dev`, buka `http://localhost:5173`: beranda → Belajar → kartu gender tanpa pilihan → lanjut nonaktif dengan alasan → pilih → stepper → Ulangi dari awal (konfirmasi). Cek lebar 375px: tanpa scroll ke samping.

- [x] **Step 13: Commit**

```bash
git add apps/web/src
git commit -m "web: kerangka wizard (stepper, pertanyaan utama, bar bawah), header, beranda dengan tujuan"
```

---

### Task 4: Tur singkat dengan sorotan gelap

**Files:**
- Create: `apps/web/src/tur/Tur.tsx`, `apps/web/src/konten/tur.ts`
- Modify: `apps/web/src/Aplikasi.tsx`, `apps/web/src/layar/wizard/*.tsx` (atribut `data-tur`), `apps/web/src/gaya/komponen.css`
- Test: `apps/web/src/__tests__/tur.test.tsx`

**Interfaces:**
- Consumes: `sudahLihatTur`, `tandaiTurDilihat` (Task 2); `Kepala` props `adaTur`, `saatTur` (Task 3).
- Produces:
  - `konten/tur.ts`: `interface LangkahTur { sasaran: string; judul: string; isi: string }` (sasaran = nilai atribut `data-tur`), `TUR: Partial<Record<Layar, LangkahTur[]>>`.
  - `Tur({ daftar, kunci, sedangBerjalan, saatSelesai })`: overlay; memanggil `tandaiTurDilihat(kunci)` saat selesai/dilewati.

- [x] **Step 1: Test** — `src/__tests__/tur.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Tur } from '../tur/Tur';
import { sudahLihatTur } from '../preferensi';

const DAFTAR = [
  { sasaran: 'satu', judul: 'Satu', isi: 'Isi satu' },
  { sasaran: 'hilang', judul: 'Hilang', isi: 'Tidak ada elemennya' },
  { sasaran: 'dua', judul: 'Dua', isi: 'Isi dua' },
];

const Halaman = ({ saatSelesai }: { saatSelesai: () => void }) => (
  <>
    <div data-tur="satu">A</div>
    <div data-tur="dua">B</div>
    <Tur daftar={DAFTAR} kunci="uji" sedangBerjalan saatSelesai={saatSelesai} />
  </>
);

it('berjalan per langkah, melewati sasaran yang tidak ada, lalu menandai sudah dilihat', () => {
  const saatSelesai = vi.fn();
  render(<Halaman saatSelesai={saatSelesai} />);
  expect(screen.getByRole('dialog', { name: 'Tur singkat' }).textContent).toMatch(/Satu/);
  fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
  expect(screen.getByRole('dialog', { name: 'Tur singkat' }).textContent).toMatch(/Dua/);
  expect(screen.getByRole('dialog', { name: 'Tur singkat' }).textContent).toMatch(/2 \/ 2/);
  fireEvent.click(screen.getByRole('button', { name: 'Selesai' }));
  expect(saatSelesai).toHaveBeenCalledOnce();
  expect(sudahLihatTur('uji')).toBe(true);
});

it('Esc dan klik area gelap menutup tur', () => {
  const saatSelesai = vi.fn();
  const { unmount } = render(<Halaman saatSelesai={saatSelesai} />);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(saatSelesai).toHaveBeenCalledTimes(1);
  unmount();
  render(<Halaman saatSelesai={saatSelesai} />);
  fireEvent.click(document.querySelector('.tur-tirai')!);
  expect(saatSelesai).toHaveBeenCalledTimes(2);
});
```

- [x] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web test tur`
Expected: FAIL (modul `../tur/Tur` belum ada).

- [x] **Step 3: `src/konten/tur.ts`**

```ts
// Isi tur singkat per layar. `sasaran` = nilai atribut data-tur pada elemen yang disorot.

import type { Layar } from '../keadaan';

export interface LangkahTur { sasaran: string; judul: string; isi: string }

export const TUR: Partial<Record<Layar, LangkahTur[]>> = {
  wizard: [
    { sasaran: 'stepper', judul: 'Lima langkah saja', isi: 'Ini peta langkahmu. Langkah yang sudah diisi bisa diklik untuk diubah.' },
    { sasaran: 'pertanyaan', judul: 'Satu pertanyaan sekali', isi: 'Jawab pertanyaan besar ini. Tulisan abu-abu di bawahnya menjelaskan kenapa ditanya.' },
    { sasaran: 'bar-bawah', judul: 'Maju dan mundur', isi: 'Kembali ke langkah sebelumnya, atau lanjut. Kalau masih ada yang kurang, alasannya tertulis di sini.' },
  ],
};
```

- [x] **Step 4: `src/tur/Tur.tsx`**

```tsx
// Tur singkat: menyorot satu elemen [data-tur] sekali, sisanya digelapkan. Lubang sorot digambar di level halaman
// (position: fixed) supaya tidak terjebak stacking context kartu sticky. Sasaran yang tidak terlihat dilewati.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { LangkahTur } from '../konten/tur';
import { tandaiTurDilihat } from '../preferensi';
import { Tombol } from '../ui/komponen';

interface Props { daftar: LangkahTur[]; kunci: string; sedangBerjalan: boolean; saatSelesai: () => void }

const JARAK_SOROT = 6;

export function Tur({ daftar, kunci, sedangBerjalan, saatSelesai }: Props) {
  const tersedia = useTersedia(daftar, sedangBerjalan);
  const [indeks, setIndeks] = useState(0);
  const [kotak, setKotak] = useState<DOMRect | null>(null);
  const popup = useRef<HTMLDivElement>(null);
  const langkahIni = tersedia[indeks];

  const selesai = useCallback(() => { tandaiTurDilihat(kunci); setIndeks(0); saatSelesai(); }, [kunci, saatSelesai]);

  useLayoutEffect(() => {
    if (!sedangBerjalan || !langkahIni) return;
    const elemen = document.querySelector(`[data-tur="${langkahIni.sasaran}"]`);
    elemen?.scrollIntoView?.({ block: 'center' });
    const ukur = () => setKotak(elemen?.getBoundingClientRect() ?? null);
    ukur();
    window.addEventListener('scroll', ukur, { passive: true });
    window.addEventListener('resize', ukur);
    popup.current?.querySelector<HTMLButtonElement>('[data-utama]')?.focus();
    return () => { window.removeEventListener('scroll', ukur); window.removeEventListener('resize', ukur); };
  }, [sedangBerjalan, langkahIni]);

  useEffect(() => {
    if (!sedangBerjalan) return;
    const saatTombol = (event: KeyboardEvent) => { if (event.key === 'Escape') selesai(); };
    document.addEventListener('keydown', saatTombol);
    return () => document.removeEventListener('keydown', saatTombol);
  }, [sedangBerjalan, selesai]);

  if (!sedangBerjalan || !langkahIni) return null;
  const adalahTerakhir = indeks === tersedia.length - 1;
  const posisiPopup = hitungPosisiPopup(kotak);

  return (
    <>
      <div className="tur-tirai" onClick={selesai} />
      {kotak && (
        <div className="tur-lubang" aria-hidden="true" style={{
          top: kotak.top - JARAK_SOROT, left: kotak.left - JARAK_SOROT,
          width: kotak.width + JARAK_SOROT * 2, height: kotak.height + JARAK_SOROT * 2,
        }} />
      )}
      <div ref={popup} className="tur-pop" role="dialog" aria-label="Tur singkat" style={posisiPopup}>
        <small>{indeks + 1} / {tersedia.length}</small>
        <h4>{langkahIni.judul}</h4>
        <p>{langkahIni.isi}</p>
        <div className="tur-aksi">
          <Tombol varian="ghost" kecil onClick={selesai}>Lewati</Tombol>
          <span className="pengisi" />
          <Tombol varian="sun" kecil data-utama onClick={() => (adalahTerakhir ? selesai() : setIndeks(indeks + 1))}>
            {adalahTerakhir ? 'Selesai' : 'Lanjut'}
          </Tombol>
        </div>
      </div>
    </>
  );
}

/** Hanya langkah yang elemennya ada dan terlihat di layar saat tur dimulai. */
function useTersedia(daftar: LangkahTur[], sedangBerjalan: boolean): LangkahTur[] {
  const [tersedia, setTersedia] = useState<LangkahTur[]>([]);
  useLayoutEffect(() => {
    if (!sedangBerjalan) return;
    setTersedia(daftar.filter(langkah => {
      const elemen = document.querySelector<HTMLElement>(`[data-tur="${langkah.sasaran}"]`);
      return !!elemen && !elemen.closest('[hidden]');
    }));
  }, [daftar, sedangBerjalan]);
  return tersedia;
}

function hitungPosisiPopup(kotak: DOMRect | null): { top: number; left: number } {
  if (!kotak) return { top: 80, left: 16 };
  const tinggiPopup = 180, lebarPopup = 320, jarak = 14;
  const muatDiBawah = kotak.bottom + jarak + tinggiPopup < window.innerHeight - 80;
  const top = muatDiBawah ? kotak.bottom + jarak : Math.max(16, kotak.top - tinggiPopup - jarak);
  const left = Math.max(16, Math.min(kotak.left, window.innerWidth - lebarPopup - 16));
  return { top, left };
}
```

`Tombol` meneruskan atribut `data-utama` karena menyebarkan `...sisa` ke `<button>`.

- [x] **Step 5: Pasang atribut sasaran**
  - `Stepper.tsx`: `<nav className="stepper" data-tur="stepper" …>`
  - `KerangkaLangkah.tsx`: `<h1 … data-tur="pertanyaan">`
  - `BarBawah.tsx`: `<div className="bar-bawah" data-tur="bar-bawah">`

- [x] **Step 6: Sambungkan di `Aplikasi.tsx`** — tambahkan state dan render:

```tsx
import { useState } from 'react';   // gabungkan dengan impor react yang ada
import { TUR } from './konten/tur';
import { sudahLihatTur } from './preferensi';
import { Tur } from './tur/Tur';

// di dalam Aplikasi, setelah deklarasi keadaan:
const daftarTur = TUR[layar] ?? [];
const [turBerjalan, setTurBerjalan] = useState(false);
// Otomatis sekali di kunjungan pertama tiap layar yang punya tur.
useEffect(() => {
  if (daftarTur.length > 0 && !sudahLihatTur(layar)) setTurBerjalan(true);
}, [layar]);
```

Ubah `Kepala`: `adaTur={daftarTur.length > 0}` dan `saatTur={() => setTurBerjalan(true)}`. Di akhir fragment tambahkan:

```tsx
<Tur daftar={daftarTur} kunci={layar} sedangBerjalan={turBerjalan} saatSelesai={() => setTurBerjalan(false)} />
```

(`const { kasus, layar } = keadaan;` harus dideklarasikan sebelum `daftarTur`.)

Test lama yang merender `<Aplikasi />` di wizard akan terhalang tur otomatis. Di `kerangka.test.tsx` dan `asap.test.tsx`, dalam `beforeEach` setelah `localStorage.clear()` tambahkan `localStorage.setItem('arif-waris:tur:wizard', '1');`.

- [x] **Step 7: CSS** — tambahkan di akhir `src/gaya/komponen.css`:

```css
/* ─── Tur singkat ─── */
.tur-tirai{position:fixed;inset:0;z-index:70}
.tur-lubang{position:fixed;z-index:71;pointer-events:none;border-radius:18px;outline:4px solid var(--pink);outline-offset:2px;box-shadow:0 0 0 100vmax rgba(10,12,28,.66);transition:top .2s,left .2s,width .2s,height .2s}
.tur-pop{position:fixed;z-index:72;width:min(320px,calc(100vw - 32px));background:var(--ink);color:var(--surface-raised);border-radius:16px;padding:14px 16px;box-shadow:var(--shadow-pop);font-size:14px}
.tur-pop h4{font-family:var(--font-display);font-size:17px;margin:2px 0 4px}
.tur-pop p{margin:0}
.tur-pop small{opacity:.75;font-weight:700}
.tur-aksi{display:flex;align-items:center;gap:8px;margin-top:12px}
.tur-pop .aw-btn-ghost{color:var(--surface-raised)}
@media (prefers-reduced-motion:reduce){.tur-lubang{transition:none}}
```

- [x] **Step 8: Jalankan semua test + build**

Run: `pnpm test && pnpm --filter @waris/web build`
Expected: seluruh workspace PASS; build sukses.

- [x] **Step 9: Cek manual** — `pnpm --filter @waris/web dev`: buka wizard pertama kali → tur jalan otomatis, sekeliling gelap, Esc menutup, "Tur singkat" di header mengulang. Reload → tur tidak otomatis lagi.

- [x] **Step 10: Commit**

```bash
git add apps/web/src
git commit -m "web: tur singkat dengan sorotan gelap, otomatis sekali per layar"
```

---

## Self-Review

- **Cakupan spec tahap 1:** Kasus v2 + migrasi + rapikan urutan wafat (T1); tujuan Hitung/Belajar disimpan sebagai preferensi (T2, T3); validasi harta > 0, ahli waris ≥ 1, jenis kelamin wajib (T2); navigasi global — header tanpa simpan, Ulangi dengan konfirmasi di halaman, stepper, bar bawah "Lanjut: …" dengan alasan (T3); beranda dengan pertanyaan pembuka (T3); tur dengan sorotan gelap, otomatis sekali, tombol header, Esc/klik gelap (T4); konten di `src/konten/` (T3, T4). Isi langkah 2–5 dan layar hasil sengaja belum dirombak (tahap 2–4); tur layar hasil ditambahkan di tahap 4.
- **Konsistensi nama:** `alasanBelumLengkap`, `langkahTerjauh`, `LANGKAH_HASIL` dipakai sama di T2/T3; `Tujuan` dari `preferensi.ts` di T2/T3; `Kepala` props `adaTur`/`saatTur` didefinisikan T3, dipakai T4; `data-tur` sasaran `stepper`/`pertanyaan`/`bar-bawah` sama di T4 Step 3 dan Step 5.
