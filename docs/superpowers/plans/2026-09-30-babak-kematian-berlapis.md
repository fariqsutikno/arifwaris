# Babak Kematian Berlapis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pengguna awam menyusun kasus munasakhat, janin, orang hilang, khuntsa, dan wafat bersamaan lewat pertanyaan keadaan tiap orang dan babak per almarhum; engine menerima data tepat; hasil bab 13 tampil versi minimal.

**Architecture:** `Kasus` v3 menyimpan fakta untuk engine (+ satu fakta UI). Semua jawaban dialog diubah jadi `Kasus` oleh fungsi murni di `keadaanOrang.ts`; urutan wafat berpasangan di `urutan.ts`. `jalankan.ts` memilih orkestrator engine (gharqa → taqdir → munasakhat → biasa). Wizard langkah 4 mendapat sub-langkah babak (`KeadaanAplikasi.babak`), layar `cerita` sebelum hasil, dan komponen hasil kasus khusus terpisah dari `HasilOkLayar`.

**Tech Stack:** TypeScript (exactOptionalPropertyTypes), React 18, Vitest + Testing Library, pnpm workspace (`@waris/web`, `@waris/engine`, `@waris/explain`).

**Spec:** `docs/superpowers/specs/2026-09-30-babak-kematian-berlapis-design.md` (riset: `docs/design/riset-ux-input-kematian-berlapis.md`).

## Global Constraints

- Nama variabel/fungsi/komentar bahasa Indonesia; istilah fikih transliterasi baku (CLAUDE.md).
- Semua teks tampil lewat `t('halaman.kunci')` dengan kunci literal; kunci baru ditambah ke `apps/web/src/snapshot.json` dengan `pnpm diksi:tambah <file.json>` (file JSON `[{ "kunci", "id" }]` di scratch, tidak di-commit). `diksi.test.ts` menolak teks literal di JSX dan kunci yang tidak ada.
- Tidak ada `number` di jalur hitung uang; uang = `bigint`.
- Madzhab tetap `'syafii'`.
- Aksi sekunder = tautan teks (`<button className="tautan">` atau `aw-btn-ghost`), tombol berbingkai hanya aksi utama.
- Ikon SVG, bukan emoji.
- Setiap cabang fikih di kode diberi rujukan `[Rxx-y]`.
- Kalimat UI ≤ 15 kata, pakai nama orang, tanpa istilah fikih sebagai label utama (riset 9.2).
- Jalankan tes web: `pnpm --filter @waris/web test -- <pola>`; typecheck: `pnpm --filter @waris/web exec tsc --noEmit`.
- Commit setelah tiap task (memori pengguna: langsung commit, hanya file sendiri).

## Review Focus

1. File impor lama (versi 1/2) dan file yang dirusak tangan (orang di dua daftar, anggota gharqa hidup) — harus dimigrasi atau ditolak dengan pesan, tidak membuat engine melempar. Tes di Task 1.
2. Mengubah Budi dari "wafat sesudah" ke "masih hidup" setelah keluarganya diisi — konfirmasi menyebut nama yang hilang; orang yang tetap kerabat pewaris (cucu) tidak ikut terhapus. Tes di Task 2 dan Task 7.
3. Orang yang wafat di babak 2 dibandingkan urutannya hanya dengan yang wafat sesudah almarhum babaknya, bukan dengan seluruh daftar. Tes di Task 3.
4. Kasus biasa tanpa kondisi khusus: tidak ada layar tambahan (babak 1 saja, tanpa layar cerita). Tes di Task 5.
5. `PERLU_INPUT` karena batas kemungkinan (> 256 dunia) tampil sebagai daftar orang, bukan pesan teknis. Tes di Task 10.

---

## File Structure

| File | Tanggung jawab |
|---|---|
| `apps/web/src/kasus.ts` (ubah) | `Kasus` v3, migrasi, `bacaKasus`, `rapikanKeadaan` |
| `apps/web/src/keadaanOrang.ts` (baru) | almarhum, babak asal, keadaan tampil, jawaban → `Kasus`, janin, dukungan |
| `apps/web/src/urutan.ts` (baru) | penyisipan berpasangan |
| `apps/web/src/jalankan.ts` (ubah) | dispatch orkestrator, `HasilTampil` baru |
| `apps/web/src/keadaan.ts` (ubah) | `babak`, aksi `KE_BABAK`, layar `cerita` |
| `apps/web/src/layar/wizard/validasi.ts` (ubah) | `alasanBabak`, validasi langkah 4 semua babak |
| `apps/web/src/layar/keadaan/DialogKeadaan.tsx` (baru) | dialog satu pertanyaan per layar + `LayarUrutan` |
| `apps/web/src/layar/keadaan/PertanyaanPenutup.tsx` (baru) | "Semua masih hidup?" + daftar keadaan |
| `apps/web/src/layar/keadaan/PertanyaanHamil.tsx` (baru) | pertanyaan hamil + `DialogJanin` |
| `apps/web/src/layar/LangkahBabak.tsx` (baru) | babak 2..n |
| `apps/web/src/layar/PeriksaCerita.tsx` (baru) | ringkasan kalimat + pilihan menunggu |
| `apps/web/src/hasil/HasilKasusKhusus.tsx` (baru) | hasil taqdir / gharqa / menunggu |
| `apps/web/src/layar/Wizard.tsx`, `LangkahKondisi.tsx`, `Hasil.tsx`, `Aplikasi.tsx`, `wizard/KerangkaLangkah.tsx`, `wizard/RingkasanSamping.tsx`, `riwayat.ts`, `layar/Penjelasan.tsx` (ubah) | integrasi |
| `apps/web/src/gaya/komponen.css` (ubah) | gaya dialog-langkah, daftar keadaan, kartu titipan |

---

### Task 1: `Kasus` v3, `rapikanKeadaan`, `bacaKasus`

**Files:**
- Modify: `apps/web/src/kasus.ts`
- Modify: `apps/web/src/keadaan.ts:6,38`
- Test: `apps/web/src/__tests__/kasus.test.ts`, `apps/web/src/__tests__/keadaan.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface GharqaKasus { anggota: IdOrang[]; keadaan: KeadaanGharqa; tirkah: Record<IdOrang, InputTirkah> }
  export interface Kasus { versi: 3; graf; tirkah; satuanPembulatan; rincianHarta?; urutanWafat: IdOrang[];
    dikandungSetelahWafat?: Record<IdOrang, IdOrang>; gharqa?: GharqaKasus; wafatSesudahDibagi?: IdOrang[];
    pilihanJanin?: 'tunggu' | 'hitungSekarang' }
  export function rapikanKeadaan(kasus: Kasus): Kasus
  ```
  `rapikanUrutanWafat` dihapus (semua pemanggil diganti `rapikanKeadaan`).

- [ ] **Step 1: Tes gagal** — tambah di `kasus.test.ts` (ganti import `rapikanUrutanWafat` → `rapikanKeadaan`, ganti `versi: 2` → `versi: 3` di ekspektasi):

```ts
import { tambahAhliWaris } from '../checklist';
import { dariJson, kasusBaru, keJson, rapikanKeadaan, type Kasus } from '../kasus';

const denganAnak = (): { kasus: Kasus; idAnak: string } => {
  const kasus = kasusBaru('L');
  const graf = tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK');
  return { kasus: { ...kasus, graf }, idAnak: Object.keys(graf.orang).find(id => id !== 'PEWARIS')! };
};
const ubahOrang = (kasus: Kasus, id: string, perubahan: object): Kasus =>
  ({ ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [id]: { ...kasus.graf.orang[id]!, ...perubahan } } } });

describe('Kasus v3', () => {
  it('kasusBaru versi 3 tanpa field opsional', () => {
    expect(kasusBaru('L')).toMatchObject({ versi: 3, urutanWafat: [] });
    expect(kasusBaru('L')).not.toHaveProperty('gharqa');
  });

  it('file versi 2 dimigrasi ke versi 3', () => {
    const { kasus } = denganAnak();
    const teks = keJson({ ...kasus, versi: 2 } as unknown as Kasus);
    expect(dariJson(teks)).toMatchObject({ berhasil: true, kasus: { versi: 3 } });
  });

  it('field baru bolak-balik lewat JSON', () => {
    const { kasus, idAnak } = denganAnak();
    const lengkap: Kasus = ubahOrang({
      ...kasus,
      gharqa: { anggota: ['PEWARIS', idAnak], keadaan: 'tidakDiketahui', tirkah: { [idAnak]: { kotor: 5n, tajhiz: 0n, hutang: 0n, wasiat: 0n } } },
    }, idAnak, { statusHidup: 'wafat' });
    const hasil = dariJson(keJson(lengkap));
    expect(hasil).toMatchObject({ berhasil: true });
    if (hasil.berhasil) expect(hasil.kasus.gharqa?.tirkah[idAnak]?.kotor).toBe(5n);
  });

  it('menolak file yang tidak konsisten', () => {
    const { kasus, idAnak } = denganAnak();
    // anggota gharqa masih hidup
    expect(dariJson(keJson({ ...kasus, gharqa: { anggota: ['PEWARIS', idAnak], keadaan: 'serentak', tirkah: {} } }))).toMatchObject({ berhasil: false });
    // orang di dua daftar
    expect(dariJson(keJson({ ...kasus, urutanWafat: [idAnak], wafatSesudahDibagi: [idAnak] }))).toMatchObject({ berhasil: false });
    // dikandungSetelahWafat menunjuk bukan almarhum
    expect(dariJson(keJson({ ...kasus, dikandungSetelahWafat: { [idAnak]: idAnak } }))).toMatchObject({ berhasil: false });
    // status hidup tak dikenal, khuntsa tak sah
    expect(dariJson(keJson(ubahOrang(kasus, idAnak, { statusHidup: 'zombie' })))).toMatchObject({ berhasil: false });
    expect(dariJson(keJson(ubahOrang(kasus, idAnak, { khuntsa: 'ya' })))).toMatchObject({ berhasil: false });
  });

  it('menerima status dalamKandungan, mafqud, dan khuntsa', () => {
    const { kasus, idAnak } = denganAnak();
    for (const perubahan of [{ statusHidup: 'mafqud' }, { statusHidup: 'dalamKandungan' }, { khuntsa: 'diharapkanJelas' }]) {
      expect(dariJson(keJson(ubahOrang(kasus, idAnak, perubahan)))).toMatchObject({ berhasil: true });
    }
  });
});

describe('rapikanKeadaan', () => {
  it('satu orang hanya di satu daftar; urutanWafat tanpa orang berstatus wafat', () => {
    const { kasus, idAnak } = denganAnak();
    expect(rapikanKeadaan({ ...kasus, urutanWafat: [idAnak], wafatSesudahDibagi: [idAnak] }).wafatSesudahDibagi).toBeUndefined();
    expect(rapikanKeadaan(ubahOrang({ ...kasus, urutanWafat: [idAnak] }, idAnak, { statusHidup: 'wafat' })).urutanWafat).toEqual([]);
  });

  it('gharqa hilang bila anggota < 2 atau pewaris bukan anggota', () => {
    const { kasus, idAnak } = denganAnak();
    const wafat = ubahOrang(kasus, idAnak, { statusHidup: 'wafat' });
    expect(rapikanKeadaan({ ...wafat, gharqa: { anggota: ['PEWARIS'], keadaan: 'serentak', tirkah: {} } }).gharqa).toBeUndefined();
    expect(rapikanKeadaan({ ...wafat, gharqa: { anggota: [idAnak, 'X'], keadaan: 'serentak', tirkah: {} } }).gharqa).toBeUndefined();
    expect(rapikanKeadaan({ ...wafat, gharqa: { anggota: ['PEWARIS', idAnak], keadaan: 'serentak', tirkah: {} } }).gharqa?.anggota).toEqual(['PEWARIS', idAnak]);
  });

  it('dikandungSetelahWafat dan pilihanJanin dibersihkan bila rujukannya hilang', () => {
    const { kasus, idAnak } = denganAnak();
    const rapi = rapikanKeadaan({ ...kasus, dikandungSetelahWafat: { [idAnak]: 'O99' }, pilihanJanin: 'tunggu' });
    expect(rapi.dikandungSetelahWafat).toBeUndefined();
    expect(rapi.pilihanJanin).toBeUndefined();
  });
});
```

Di `keadaan.test.ts` tidak ada perubahan perilaku (tes `urutanWafat: ['TIDAK_ADA']` → `[]` tetap berlaku lewat `rapikanKeadaan`).

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web test -- kasus`
Expected: FAIL (`rapikanKeadaan` tidak diekspor, `versi` 2).

- [ ] **Step 3: Implementasi di `kasus.ts`**

Ganti interface, `kasusBaru`, `rapikanUrutanWafat`, dan `bacaKasus`; tambah pembaca field baru. Kode inti:

```ts
import type { GrafKeluarga, IdOrang, InputTirkah, KeadaanGharqa, Orang, Pernikahan } from '@waris/engine';

const KEADAAN_GHARQA: KeadaanGharqa[] = ['serentak', 'terlupakan', 'berurutanTakDiketahui', 'tidakDiketahui'];
const STATUS_HIDUP: Orang['statusHidup'][] = ['hidup', 'wafat', 'tidakDiketahui', 'dalamKandungan', 'mafqud'];
const KHUNTSA: NonNullable<Orang['khuntsa']>[] = ['diharapkanJelas', 'tidakDiharapkanJelas'];

export interface GharqaKasus { anggota: IdOrang[]; keadaan: KeadaanGharqa; tirkah: Record<IdOrang, InputTirkah> }

export interface Kasus {
  versi: 3;
  graf: GrafKeluarga;
  tirkah: InputTirkah;
  satuanPembulatan: bigint;
  /** Wafat sesudah almarhum sebelumnya dan sebelum harta dibagi, urut waktu wafat (bab 12.7). */
  urutanWafat: IdOrang[];
  rincianHarta?: Partial<Record<KategoriHarta, bigint>>;
  /** Anak → almarhum yang wafat sebelum anak itu dikandung [R13-1]. */
  dikandungSetelahWafat?: Record<IdOrang, IdOrang>;
  /** Wafat bersamaan dengan pewaris (13d); pewaris selalu anggota, hartanya = `tirkah`. */
  gharqa?: GharqaKasus;
  /** Khusus UI (spec 2.2): wafat sesudah harta dibagi, engine melihat mereka hidup. */
  wafatSesudahDibagi?: IdOrang[];
  pilihanJanin?: 'tunggu' | 'hitungSekarang';
}
```

`kasusBaru` mengembalikan `versi: 3`.

```ts
/** Satu tempat merapikan keadaan setelah graf berubah (dipanggil di UBAH_KASUS dan saat memuat file). */
export function rapikanKeadaan(kasus: Kasus): Kasus {
  const { graf } = kasus;
  const pewaris = graf.idPewaris;
  const orangNyata = (id: IdOrang) => { const orang = graf.orang[id]; return orang && !orang.penghubung ? orang : undefined; };
  const urutanWafat = kasus.urutanWafat.filter(id => orangNyata(id)?.statusHidup === 'hidup');
  const diUrutan = new Set(urutanWafat);

  const anggota = (kasus.gharqa?.anggota ?? []).filter(id => id === pewaris || (orangNyata(id)?.statusHidup === 'wafat' && !diUrutan.has(id)));
  const gharqa: GharqaKasus | undefined = kasus.gharqa && anggota.length >= 2 && anggota.includes(pewaris)
    ? { anggota, keadaan: kasus.gharqa.keadaan,
        tirkah: Object.fromEntries(Object.entries(kasus.gharqa.tirkah).filter(([id]) => anggota.includes(id) && id !== pewaris)) }
    : undefined;

  const wafatSesudahDibagi = (kasus.wafatSesudahDibagi ?? []).filter(id => orangNyata(id)?.statusHidup === 'hidup' && !diUrutan.has(id));
  const almarhum = new Set([pewaris, ...urutanWafat]);
  const dikandung = Object.entries(kasus.dikandungSetelahWafat ?? {}).filter(([anak, mayit]) => orangNyata(anak) && almarhum.has(mayit));
  const adaJanin = Object.values(graf.orang).some(orang => orang.statusHidup === 'dalamKandungan');

  const { gharqa: _g, wafatSesudahDibagi: _w, dikandungSetelahWafat: _d, pilihanJanin: _p, ...inti } = kasus;
  return {
    ...inti,
    urutanWafat,
    ...(gharqa ? { gharqa } : {}),
    ...(wafatSesudahDibagi.length ? { wafatSesudahDibagi } : {}),
    ...(dikandung.length ? { dikandungSetelahWafat: Object.fromEntries(dikandung) } : {}),
    ...(adaJanin && kasus.pilihanJanin ? { pilihanJanin: kasus.pilihanJanin } : {}),
  };
}
```

`bacaKasus`: terima `versi` 1, 2, atau 3; baca field baru lalu periksa konsistensi **sebelum** `rapikanKeadaan` (file rusak ditolak, bukan dirapikan diam-diam):

```ts
function bacaKasus(data: unknown): Kasus {
  const objek = wajibObjek(data, 'kasus');
  // Versi 1/2 = versi 3 tanpa field keadaan, jadi dibaca dengan aturan yang sama.
  if (![1, 2, 3].includes(objek.versi as number)) throw new Error(t('hitung.versi_file_tidak_dikenal'));
  const graf = bacaGraf(objek.graf);
  /* … tirkah, satuanPembulatan, urutanWafat, rincianHarta seperti sekarang … */
  const gharqa = objek.gharqa === undefined ? undefined : bacaGharqa(objek.gharqa, graf);
  const wafatSesudahDibagi = objek.wafatSesudahDibagi === undefined ? undefined : bacaDaftarOrang(objek.wafatSesudahDibagi, graf);
  const dikandungSetelahWafat = objek.dikandungSetelahWafat === undefined ? undefined
    : bacaDikandung(objek.dikandungSetelahWafat, graf, [graf.idPewaris, ...urutanWafat]);
  const pilihanJanin = objek.pilihanJanin;
  if (pilihanJanin !== undefined && pilihanJanin !== 'tunggu' && pilihanJanin !== 'hitungSekarang') throw new Error(t('hitung.data_keadaan_rusak'));
  const semuaDaftar = [...urutanWafat, ...(gharqa?.anggota.filter(id => id !== graf.idPewaris) ?? []), ...(wafatSesudahDibagi ?? [])];
  if (new Set(semuaDaftar).size !== semuaDaftar.length) throw new Error(t('hitung.orang_tercatat_wafat_dua_kali'));
  const kasus: Kasus = {
    versi: 3, graf, tirkah, satuanPembulatan, urutanWafat,
    ...(rincianHarta ? { rincianHarta } : {}), ...(gharqa ? { gharqa } : {}),
    ...(wafatSesudahDibagi ? { wafatSesudahDibagi } : {}), ...(dikandungSetelahWafat ? { dikandungSetelahWafat } : {}),
    ...(pilihanJanin ? { pilihanJanin } : {}),
  };
  return rapikanKeadaan(kasus);
}

function bacaGharqa(nilai: unknown, graf: GrafKeluarga): GharqaKasus {
  const objek = wajibObjek(nilai, 'wafat bersamaan');
  const salah = new Error(t('hitung.data_keadaan_rusak'));
  const anggota = bacaDaftarOrang(objek.anggota, graf);
  if (!anggota.includes(graf.idPewaris) || anggota.length < 2) throw salah;
  if (anggota.some(id => id !== graf.idPewaris && graf.orang[id]!.statusHidup !== 'wafat')) throw salah;
  if (!KEADAAN_GHARQA.includes(objek.keadaan as KeadaanGharqa)) throw salah;
  const tirkahMentah = wajibObjek(objek.tirkah, 'harta wafat bersamaan');
  const tirkah: Record<IdOrang, InputTirkah> = {};
  for (const [id, isi] of Object.entries(tirkahMentah)) {
    if (!anggota.includes(id)) throw salah;
    const t0 = wajibObjek(isi, 'harta');
    tirkah[id] = { kotor: bacaUang(t0.kotor, 'harta'), tajhiz: bacaUang(t0.tajhiz, 'biaya jenazah'), hutang: bacaUang(t0.hutang, 'hutang'), wasiat: bacaUang(t0.wasiat, 'wasiat') };
  }
  return { anggota, keadaan: objek.keadaan as KeadaanGharqa, tirkah };
}

function bacaDaftarOrang(nilai: unknown, graf: GrafKeluarga): IdOrang[] {
  if (!Array.isArray(nilai) || !nilai.every(id => typeof id === 'string' && graf.orang[id])) throw new Error(t('hitung.daftar_wafat_berisi_orang_tidak_ada'));
  return nilai as IdOrang[];
}

function bacaDikandung(nilai: unknown, graf: GrafKeluarga, almarhum: IdOrang[]): Record<IdOrang, IdOrang> {
  const objek = wajibObjek(nilai, 'anak yang lahir belakangan');
  for (const [anak, mayit] of Object.entries(objek)) {
    if (!graf.orang[anak] || typeof mayit !== 'string' || !almarhum.includes(mayit)) throw new Error(t('hitung.data_keadaan_rusak'));
  }
  return objek as Record<IdOrang, IdOrang>;
}
```

`bacaOrang`: ganti daftar status dengan `STATUS_HIDUP`, dan tambah
`if (objek.khuntsa !== undefined && !KHUNTSA.includes(objek.khuntsa as never)) throw salah();`.

Di `keadaan.ts`: import dan panggil `rapikanKeadaan` menggantikan `rapikanUrutanWafat`.

Diksi baru (file `diksi-t1.json`): `[{"kunci":"hitung.data_keadaan_rusak","id":"Data keadaan orang di file ini rusak."}]` → `pnpm diksi:tambah <path>`.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @waris/web test -- kasus keadaan diksi`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/kasus.ts apps/web/src/keadaan.ts apps/web/src/snapshot.json apps/web/src/__tests__/kasus.test.ts
git commit -m "web: Kasus v3 (gharqa, janin, wafat sesudah dibagi) + rapikanKeadaan"
```

---

### Task 2: `keadaanOrang.ts` — almarhum, babak asal, jawaban → Kasus

**Files:**
- Create: `apps/web/src/keadaanOrang.ts`
- Test: `apps/web/src/__tests__/keadaanOrang.test.ts`

**Interfaces:**
- Consumes: `Kasus`, `rapikanKeadaan` (Task 1); `hapusAhliWaris` (`checklist.ts`); `turunkanPeran`, `KONFIGURASI_BAWAAN` (`@waris/engine`).
- Produces:
  ```ts
  export type KeadaanTampil = 'hidup' | 'wafatSebelum' | 'wafatSesudah' | 'wafatSesudahDibagi' | 'bersamaan' | 'hilang' | 'dalamKandungan' | 'khuntsa';
  export type JawabanKeadaan =
    | { jenis: 'hidup' }
    | { jenis: 'wafatSebelum' }
    | { jenis: 'wafatSesudah'; hartaSudahDibagi: boolean; posisi?: number }   // posisi = indeks di urutanWafat (dari urutan.ts)
    | { jenis: 'bersamaan'; keadaan: KeadaanGharqa; tirkah: InputTirkah }
    | { jenis: 'hilang' }
    | { jenis: 'khuntsa'; keadaan: 'diharapkanJelas' | 'tidakDiharapkanJelas' };
  export function daftarAlmarhum(kasus: Kasus): IdOrang[]
  export function babakAsal(kasus: Kasus, idOrang: IdOrang): IdOrang | undefined
  export function kerabatDari(kasus: Kasus, idMayit: IdOrang): IdOrang[]
  export function keadaanOrang(kasus: Kasus, idOrang: IdOrang): KeadaanTampil
  export function terapkanKeadaan(kasus: Kasus, idOrang: IdOrang, jawaban: JawabanKeadaan): Kasus
  export function orangTerputus(sebelum: Kasus, sesudah: Kasus): IdOrang[]
  export function alasanTidakDidukung(kasus: Kasus, idOrang: IdOrang, jawaban: JawabanKeadaan): string | null
  export function perluPeriksaCerita(kasus: Kasus): boolean
  ```

- [ ] **Step 1: Tes gagal**

```ts
import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import {
  alasanTidakDidukung, babakAsal, daftarAlmarhum, keadaanOrang, kerabatDari, orangTerputus, perluPeriksaCerita, terapkanKeadaan,
} from '../keadaanOrang';

const TANPA_HARTA = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };
/** Pak Ahmad (PEWARIS) + istri Siti + anak Budi + anak Rina. */
function keluargaAhmad() {
  let kasus = kasusBaru('L');
  for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_PR'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const cari = (jk: 'L' | 'P', pasangan: boolean) => Object.values(kasus.graf.orang)
    .find(o => o.id !== 'PEWARIS' && o.jenisKelamin === jk && (pasangan ? !o.idAyah : !!o.idAyah))!.id;
  return { kasus, siti: cari('P', true), budi: cari('L', false), rina: cari('P', false) };
}

describe('keadaanOrang', () => {
  it('bawaan: semua masih hidup, almarhum hanya pewaris, tanpa layar cerita', () => {
    const { kasus, budi } = keluargaAhmad();
    expect(keadaanOrang(kasus, budi)).toBe('hidup');
    expect(daftarAlmarhum(kasus)).toEqual(['PEWARIS']);
    expect(perluPeriksaCerita(kasus)).toBe(false);
  });

  it('S1: wafat sesudah, belum dibagi → urutanWafat; babak Budi berisi Siti (ibu) & Rina', () => {
    const { kasus, budi, siti, rina } = keluargaAhmad();
    const baru = terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
    expect(baru.urutanWafat).toEqual([budi]);
    expect(keadaanOrang(baru, budi)).toBe('wafatSesudah');
    expect(daftarAlmarhum(baru)).toEqual(['PEWARIS', budi]);
    expect(kerabatDari(baru, budi)).toEqual(expect.arrayContaining([siti, rina]));
    expect(babakAsal(baru, siti)).toBe('PEWARIS');
    expect(perluPeriksaCerita(baru)).toBe(true);
  });

  it('S5: wafat sebelum → statusHidup wafat, tidak di urutan', () => {
    const { kasus, budi } = keluargaAhmad();
    const baru = terapkanKeadaan(kasus, budi, { jenis: 'wafatSebelum' });
    expect(baru.graf.orang[budi]!.statusHidup).toBe('wafat');
    expect(baru.urutanWafat).toEqual([]);
    expect(keadaanOrang(baru, budi)).toBe('wafatSebelum');
  });

  it('S30: wafat sesudah harta dibagi → hanya catatan UI', () => {
    const { kasus, budi } = keluargaAhmad();
    const baru = terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: true });
    expect(baru.urutanWafat).toEqual([]);
    expect(baru.wafatSesudahDibagi).toEqual([budi]);
    expect(baru.graf.orang[budi]!.statusHidup).toBe('hidup');
    expect(keadaanOrang(baru, budi)).toBe('wafatSesudahDibagi');
  });

  it('bersamaan dengan pewaris → gharqa dengan harta Budi', () => {
    const { kasus, budi } = keluargaAhmad();
    const baru = terapkanKeadaan(kasus, budi, { jenis: 'bersamaan', keadaan: 'tidakDiketahui', tirkah: { ...TANPA_HARTA, kotor: 7n } });
    expect(baru.gharqa).toEqual({ anggota: ['PEWARIS', budi], keadaan: 'tidakDiketahui', tirkah: { [budi]: { ...TANPA_HARTA, kotor: 7n } } });
    expect(keadaanOrang(baru, budi)).toBe('bersamaan');
  });

  it('hilang dan khuntsa', () => {
    const { kasus, budi } = keluargaAhmad();
    expect(terapkanKeadaan(kasus, budi, { jenis: 'hilang' }).graf.orang[budi]!.statusHidup).toBe('mafqud');
    const k = terapkanKeadaan(kasus, budi, { jenis: 'khuntsa', keadaan: 'diharapkanJelas' });
    expect(k.graf.orang[budi]!.khuntsa).toBe('diharapkanJelas');
    expect(keadaanOrang(k, budi)).toBe('khuntsa');
  });

  it('kembali ke hidup menghapus keadaan lama', () => {
    const { kasus, budi } = keluargaAhmad();
    const hilang = terapkanKeadaan(kasus, budi, { jenis: 'hilang' });
    const hidup = terapkanKeadaan(hilang, budi, { jenis: 'hidup' });
    expect(hidup.graf.orang[budi]!.statusHidup).toBe('hidup');
    expect(keadaanOrang(hidup, budi)).toBe('hidup');
  });

  it('membatalkan Budi menghapus istri Budi, tapi cucu (tetap kerabat pewaris) tidak', () => {
    const { kasus, budi } = keluargaAhmad();
    let k = terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
    k = { ...k, graf: tambahAhliWaris(k.graf, budi, 'ISTRI') };
    k = { ...k, graf: tambahAhliWaris(k.graf, budi, 'ANAK_LK') };
    const dewi = Object.keys(k.graf.orang).find(id => !kasus.graf.orang[id] && k.graf.orang[id]!.jenisKelamin === 'P')!;
    const cucu = Object.keys(k.graf.orang).find(id => k.graf.orang[id]!.idAyah === budi)!;
    const batal = terapkanKeadaan(k, budi, { jenis: 'hidup' });
    expect(orangTerputus(k, batal)).toEqual([dewi]);
    expect(batal.graf.orang[dewi]).toBeUndefined();
    expect(batal.graf.orang[cucu]).toBeDefined();
  });

  it('menolak dengan jujur: bersamaan di babak 2 (S29) dan campuran gharqa + munasakhat (E2)', () => {
    const { kasus, budi, rina } = keluargaAhmad();
    const s1 = terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
    const dewiKasus = { ...s1, graf: tambahAhliWaris(s1.graf, budi, 'ISTRI') };
    const dewi = Object.keys(dewiKasus.graf.orang).find(id => !s1.graf.orang[id])!;
    const bersamaan = { jenis: 'bersamaan', keadaan: 'serentak', tirkah: TANPA_HARTA } as const;
    expect(alasanTidakDidukung(dewiKasus, dewi, bersamaan)).toBe('hitung.keadaan.belum_didukung');
    expect(alasanTidakDidukung(s1, rina, bersamaan)).toBe('hitung.keadaan.belum_didukung');
    const g = terapkanKeadaan(kasus, budi, bersamaan);
    expect(alasanTidakDidukung(g, rina, { jenis: 'wafatSesudah', hartaSudahDibagi: false })).toBe('hitung.keadaan.belum_didukung');
    expect(alasanTidakDidukung(kasus, rina, { jenis: 'wafatSesudah', hartaSudahDibagi: false })).toBeNull();
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web test -- keadaanOrang`
Expected: FAIL (modul tidak ada).

- [ ] **Step 3: Implementasi**

```ts
// Jawaban dialog keadaan → Kasus (spec 2.2). Menerima Kasus + satu jawaban tentang satu orang;
// menyerahkan Kasus baru yang sudah dirapikan. "Babak asal" tidak disimpan: diturunkan dari graf,
// yaitu almarhum pertama (pewaris, lalu urutan wafat) yang menjadikan orang itu kerabat.

import { KONFIGURASI_BAWAAN, turunkanPeran, type IdOrang, type InputTirkah, type KeadaanGharqa } from '@waris/engine';
import { hapusAhliWaris } from './checklist';
import { rapikanKeadaan, type Kasus } from './kasus';

export type KeadaanTampil = 'hidup' | 'wafatSebelum' | 'wafatSesudah' | 'wafatSesudahDibagi' | 'bersamaan' | 'hilang' | 'dalamKandungan' | 'khuntsa';
export type JawabanKeadaan =
  | { jenis: 'hidup' }
  | { jenis: 'wafatSebelum' }
  | { jenis: 'wafatSesudah'; hartaSudahDibagi: boolean; posisi?: number }
  | { jenis: 'bersamaan'; keadaan: KeadaanGharqa; tirkah: InputTirkah }
  | { jenis: 'hilang' }
  | { jenis: 'khuntsa'; keadaan: 'diharapkanJelas' | 'tidakDiharapkanJelas' };

export const daftarAlmarhum = (kasus: Kasus): IdOrang[] => [kasus.graf.idPewaris, ...kasus.urutanWafat];

/** Orang yang punya peran (ahli waris, mahjub, atau dzawil arham) bila `idMayit` pewarisnya. */
export function kerabatDari(kasus: Kasus, idMayit: IdOrang): IdOrang[] {
  const { daftarPeran } = turunkanPeran({ ...kasus.graf, idPewaris: idMayit }, KONFIGURASI_BAWAAN);
  return Object.keys(kasus.graf.orang).filter(id => id !== idMayit && !kasus.graf.orang[id]!.penghubung
    && daftarPeran[id] && daftarPeran[id]!.kunci !== 'BUKAN_AHLI_WARIS');
}

export function babakAsal(kasus: Kasus, idOrang: IdOrang): IdOrang | undefined {
  return daftarAlmarhum(kasus).find(idMayit => kerabatDari(kasus, idMayit).includes(idOrang));
}

export function keadaanOrang(kasus: Kasus, idOrang: IdOrang): KeadaanTampil {
  const orang = kasus.graf.orang[idOrang]!;
  if (kasus.urutanWafat.includes(idOrang)) return 'wafatSesudah';
  if (kasus.wafatSesudahDibagi?.includes(idOrang)) return 'wafatSesudahDibagi';
  if (kasus.gharqa?.anggota.includes(idOrang)) return 'bersamaan';
  if (orang.statusHidup === 'wafat') return 'wafatSebelum';
  if (orang.statusHidup === 'mafqud') return 'hilang';
  if (orang.statusHidup === 'dalamKandungan') return 'dalamKandungan';
  if (orang.khuntsa) return 'khuntsa';
  return 'hidup';
}

/** Terapkan satu jawaban. Keadaan lama orang itu dibersihkan dulu; orang yang tak lagi kerabat almarhum mana pun dihapus. */
export function terapkanKeadaan(kasus: Kasus, idOrang: IdOrang, jawaban: JawabanKeadaan): Kasus {
  const bersih = bersihkanKeadaan(kasus, idOrang);
  const ubah = (perubahan: Partial<Kasus['graf']['orang'][string]>): Kasus =>
    ({ ...bersih, graf: { ...bersih.graf, orang: { ...bersih.graf.orang, [idOrang]: { ...bersih.graf.orang[idOrang]!, ...perubahan } } } });
  let hasil: Kasus;
  switch (jawaban.jenis) {
    case 'hidup': hasil = bersih; break;
    case 'wafatSebelum': hasil = ubah({ statusHidup: 'wafat' }); break;   // bukan ahli waris almarhum babaknya (bab 12.7)
    case 'wafatSesudah':
      if (jawaban.hartaSudahDibagi) { hasil = { ...bersih, wafatSesudahDibagi: [...(bersih.wafatSesudahDibagi ?? []), idOrang] }; break; }
      {
        const urutan = [...bersih.urutanWafat];
        urutan.splice(jawaban.posisi ?? urutan.length, 0, idOrang);
        hasil = { ...bersih, urutanWafat: urutan };
      }
      break;
    case 'bersamaan': {
      // [R13-10] 13d: pewaris selalu anggota; harta anggota lain disimpan per orang.
      const lama = bersih.gharqa;
      const anggota = [...new Set([bersih.graf.idPewaris, ...(lama?.anggota ?? []), idOrang])];
      hasil = { ...ubah({ statusHidup: 'wafat' }), gharqa: { anggota, keadaan: jawaban.keadaan, tirkah: { ...(lama?.tirkah ?? {}), [idOrang]: jawaban.tirkah } } };
      break;
    }
    case 'hilang': hasil = ubah({ statusHidup: 'mafqud' }); break;        // [R13-6] hukum asal hidup, bagian ditahan
    case 'khuntsa': hasil = ubah({ khuntsa: jawaban.keadaan }); break;    // [K13c-1]
  }
  const rapi = rapikanKeadaan(hasil);
  return orangTerputus(kasus, rapi).reduce((k, id) => ({ ...k, graf: hapusAhliWaris(k.graf, id) }), rapi);
}

function bersihkanKeadaan(kasus: Kasus, idOrang: IdOrang): Kasus {
  const { khuntsa: _k, ...orang } = kasus.graf.orang[idOrang]!;
  const statusHidup = orang.statusHidup === 'dalamKandungan' ? orang.statusHidup : 'hidup';
  return rapikanKeadaan({
    ...kasus,
    graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [idOrang]: { ...orang, statusHidup } } },
    urutanWafat: kasus.urutanWafat.filter(id => id !== idOrang),
    ...(kasus.wafatSesudahDibagi ? { wafatSesudahDibagi: kasus.wafatSesudahDibagi.filter(id => id !== idOrang) } : {}),
    ...(kasus.gharqa ? { gharqa: { ...kasus.gharqa, anggota: kasus.gharqa.anggota.filter(id => id !== idOrang) } } : {}),
  });
}

/** Orang (bukan pewaris) yang tadinya kerabat salah satu almarhum dan sesudah perubahan tidak lagi. */
export function orangTerputus(sebelum: Kasus, sesudah: Kasus): IdOrang[] {
  const kerabatSesudah = new Set(daftarAlmarhum(sesudah).flatMap(idMayit => [idMayit, ...kerabatDari(sesudah, idMayit)]));
  const kerabatSebelum = new Set(daftarAlmarhum(sebelum).flatMap(idMayit => kerabatDari(sebelum, idMayit)));
  return [...kerabatSebelum].filter(id => sesudah.graf.orang[id] && !kerabatSesudah.has(id));
}

/** Kunci diksi pesan penolakan, atau null bila didukung engine (spec 1.7, celah E1/E2). */
export function alasanTidakDidukung(kasus: Kasus, idOrang: IdOrang, jawaban: JawabanKeadaan): string | null {
  const diBabakPewaris = babakAsal(kasus, idOrang) === kasus.graf.idPewaris;
  const adaUrutanLain = kasus.urutanWafat.some(id => id !== idOrang);
  const adaGharqaLain = (kasus.gharqa?.anggota ?? []).some(id => id !== idOrang && id !== kasus.graf.idPewaris);
  if (jawaban.jenis === 'bersamaan' && (!diBabakPewaris || adaUrutanLain)) return 'hitung.keadaan.belum_didukung';
  if (jawaban.jenis === 'wafatSesudah' && !jawaban.hartaSudahDibagi && adaGharqaLain) return 'hitung.keadaan.belum_didukung';
  return null;
}

export function perluPeriksaCerita(kasus: Kasus): boolean {
  return kasus.urutanWafat.length > 0 || !!kasus.gharqa || !!kasus.wafatSesudahDibagi?.length
    || Object.values(kasus.graf.orang).some(o => o.statusHidup === 'mafqud' || o.statusHidup === 'dalamKandungan' || !!o.khuntsa);
}
```

Catatan: pesan `'hitung.keadaan.belum_didukung'` dikembalikan sebagai kunci; komponen yang memanggil `t(...)` dengan literal kunci yang sama (lihat Task 6) supaya tes diksi tetap menangkapnya.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @waris/web test -- keadaanOrang`
Expected: PASS. Bila `kerabatDari` pada graf dengan node `mafqud`/`dalamKandungan` melempar dari `turunkanPeran`, cek `packages/engine/src/stages/derivasi.ts` — derivasi tidak membaca `statusHidup`, jadi seharusnya aman; jangan ubah engine di plan ini, laporkan bila gagal.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/keadaanOrang.ts apps/web/src/__tests__/keadaanOrang.test.ts
git commit -m "web: keadaanOrang — jawaban keadaan → Kasus, babak asal, penolakan jujur"
```

---

### Task 3: `urutan.ts` — penyisipan berpasangan

**Files:**
- Create: `apps/web/src/urutan.ts`
- Test: `apps/web/src/__tests__/urutan.test.ts`

**Interfaces:**
- Consumes: `Kasus`, `babakAsal` (Task 2).
- Produces:
  ```ts
  export interface Sisipan { calon: IdOrang[]; awal: number; bawah: number; atas: number }
  export function mulaiSisip(kasus: Kasus, idMayitBabak: IdOrang): Sisipan
  export function pembanding(sisipan: Sisipan): IdOrang | null
  export function jawabSisip(sisipan: Sisipan, orangBaruLebihDulu: boolean): Sisipan
  export const posisiAkhir = (sisipan: Sisipan): number => sisipan.awal + sisipan.bawah;
  ```

- [ ] **Step 1: Tes gagal**

```ts
import { describe, expect, it } from 'vitest';
import { kasusBaru, type Kasus } from '../kasus';
import { jawabSisip, mulaiSisip, pembanding, posisiAkhir, type Sisipan } from '../urutan';

const dengan = (urutanWafat: string[]): Kasus => ({ ...kasusBaru('L'), urutanWafat });
function jumlahPertanyaan(sisipan: Sisipan, targetIndeks: number): { banyak: number; posisi: number } {
  let banyak = 0;
  while (pembanding(sisipan)) {
    const indeksPembanding = sisipan.calon.indexOf(pembanding(sisipan)!);
    sisipan = jawabSisip(sisipan, targetIndeks <= indeksPembanding);
    banyak++;
  }
  return { banyak, posisi: posisiAkhir(sisipan) };
}

describe('urutan berpasangan', () => {
  it('tanpa almarhum lain: tanpa pertanyaan', () => {
    expect(pembanding(mulaiSisip(dengan([]), 'PEWARIS'))).toBeNull();
  });
  it('2 orang = 1 pertanyaan, 3 ≤ 2, 4 ≤ 3, 5 ≤ 3 (lebih hemat dari batas spec 1/3/5)', () => {
    for (const [ada, maks] of [[1, 1], [2, 2], [3, 2], [4, 3]] as const) {
      const calon = Array.from({ length: ada }, (_, i) => `A${i}`);
      for (let target = 0; target <= ada; target++) {
        const { banyak, posisi } = jumlahPertanyaan(mulaiSisip(dengan(calon), 'PEWARIS'), target);
        expect(posisi).toBe(target);
        expect(banyak).toBeLessThanOrEqual(maks);
      }
    }
  });
  it('orang babak Budi hanya dibanding dengan yang wafat sesudah Budi', () => {
    const sisipan = mulaiSisip(dengan(['A', 'BUDI', 'C']), 'BUDI');
    expect(sisipan.calon).toEqual(['C']);
    expect(posisiAkhir(jawabSisip(sisipan, true))).toBe(2);
    expect(posisiAkhir(jawabSisip(sisipan, false))).toBe(3);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/web test -- urutan` → FAIL.

- [ ] **Step 3: Implementasi**

```ts
// Urutan wafat lewat pertanyaan berpasangan "Siapa yang wafat lebih dulu: A atau B?" (riset 7.3 L4).
// Orang baru hanya dibanding dengan yang wafat sesudah almarhum babaknya; pencarian biner, jadi n orang ≈ log₂(n+1) pertanyaan.

import type { IdOrang } from '@waris/engine';
import type { Kasus } from './kasus';

export interface Sisipan { calon: IdOrang[]; awal: number; bawah: number; atas: number }

export function mulaiSisip(kasus: Kasus, idMayitBabak: IdOrang): Sisipan {
  const awal = idMayitBabak === kasus.graf.idPewaris ? 0 : kasus.urutanWafat.indexOf(idMayitBabak) + 1;
  const calon = kasus.urutanWafat.slice(awal);
  return { calon, awal, bawah: 0, atas: calon.length };
}

export const pembanding = (sisipan: Sisipan): IdOrang | null =>
  sisipan.bawah >= sisipan.atas ? null : sisipan.calon[Math.floor((sisipan.bawah + sisipan.atas) / 2)]!;

export function jawabSisip(sisipan: Sisipan, orangBaruLebihDulu: boolean): Sisipan {
  const tengah = Math.floor((sisipan.bawah + sisipan.atas) / 2);
  return orangBaruLebihDulu ? { ...sisipan, atas: tengah } : { ...sisipan, bawah: tengah + 1 };
}

export const posisiAkhir = (sisipan: Sisipan): number => sisipan.awal + sisipan.bawah;
```

- [ ] **Step 4: Jalankan tes** — PASS.
- [ ] **Step 5: Commit** — `git add apps/web/src/urutan.ts apps/web/src/__tests__/urutan.test.ts && git commit -m "web: urutan wafat lewat pertanyaan berpasangan"`

---

### Task 4: `jalankan.ts` — dispatch orkestrator

**Files:**
- Modify: `apps/web/src/jalankan.ts`
- Modify: `apps/web/src/hasil/ringkasan.ts` (fungsi `ringkas` hanya menerima jenis biasa/munasakhat — tambah guard), `apps/web/src/layar/Penjelasan.tsx` (`daftarBabDari` → taqdir/gharqa)
- Test: `apps/web/src/__tests__/jalankan.test.ts` (baru)

**Interfaces:**
- Consumes: `Kasus` v3 (Task 1).
- Produces:
  ```ts
  export type HasilTampil =
    | { jenis: 'biasa'; hasil: HasilEngine }
    | { jenis: 'munasakhat'; hasil: HasilMunasakhat }
    | { jenis: 'taqdir'; hasil: HasilTaqdir }
    | { jenis: 'gharqa'; hasil: HasilGharqa }
    | { jenis: 'menunggu' }
    | { jenis: 'galat'; pesan: string };
  export const adaBelumPasti = (kasus: Kasus): boolean
  ```

- [ ] **Step 1: Tes gagal**

```ts
import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { jalankan } from '../jalankan';
import { terapkanKeadaan } from '../keadaanOrang';

function dasar() {
  let kasus: Kasus = { ...kasusBaru('L'), tirkah: { kotor: 1_200_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  for (const kunci of ['ISTRI', 'ANAK_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
  return { kasus, anak };
}

describe('jalankan memilih orkestrator', () => {
  it('biasa', () => expect(jalankan(dasar().kasus).jenis).toBe('biasa'));
  it('munasakhat', () => {
    const { kasus, anak } = dasar();
    const k = terapkanKeadaan(kasus, anak, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
    expect(jalankan({ ...k, graf: tambahAhliWaris(k.graf, anak, 'ANAK_PR') }).jenis).toBe('munasakhat');
  });
  it('taqdir untuk orang hilang', () => {
    const { kasus, anak } = dasar();
    const hasil = jalankan(terapkanKeadaan(kasus, anak, { jenis: 'hilang' }));
    expect(hasil.jenis).toBe('taqdir');
    if (hasil.jenis === 'taqdir') expect(hasil.hasil.status).toBe('OK');
  });
  it('gharqa mendahului semua', () => {
    const { kasus, anak } = dasar();
    const k = terapkanKeadaan(kasus, anak, { jenis: 'bersamaan', keadaan: 'serentak', tirkah: { kotor: 10n, tajhiz: 0n, hutang: 0n, wasiat: 0n } });
    expect(jalankan(k).jenis).toBe('gharqa');
  });
  it('menunggu bila ada janin dan pengguna memilih tunggu', () => {
    const { kasus } = dasar();
    const janin = { id: 'J', jenisKelamin: 'L' as const, idAyah: 'PEWARIS', statusHidup: 'dalamKandungan' as const, agama: 'islam' as const };
    const k: Kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, J: janin } }, pilihanJanin: 'tunggu' };
    expect(jalankan(k).jenis).toBe('menunggu');
    expect(jalankan({ ...k, pilihanJanin: 'hitungSekarang' }).jenis).toBe('taqdir');
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/web test -- jalankan` → FAIL.

- [ ] **Step 3: Implementasi**

```ts
// Menerima Kasus, memanggil orkestrator engine yang tepat, menyerahkan HasilTampil ke layar (spec 2.5).
// Urutan: wafat bersamaan (13d) → ada yang belum pasti (13a–c) → munasakhat (12) → biasa + dzawil arham (14).
// Exception dari engine = pelanggaran invarian; ditampilkan sebagai galat, bukan hasil setengah jadi.

import {
  hitungDzawilArham, hitungGharqa, hitungMunasakhat, hitungTaqdir, KONFIGURASI_BAWAAN,
  type HasilEngine, type HasilGharqa, type HasilMunasakhat, type HasilTaqdir, type InputEngine,
} from '@waris/engine';
import type { Kasus } from './kasus';

/* VERSI_KB, HasilOk, HasilMunasakhatOk, keInputEngine: tetap */

export type HasilTampil =
  | { jenis: 'biasa'; hasil: HasilEngine }
  | { jenis: 'munasakhat'; hasil: HasilMunasakhat }
  | { jenis: 'taqdir'; hasil: HasilTaqdir }
  | { jenis: 'gharqa'; hasil: HasilGharqa }
  | { jenis: 'menunggu' }
  | { jenis: 'galat'; pesan: string };

export const adaBelumPasti = (kasus: Kasus): boolean =>
  Object.values(kasus.graf.orang).some(o => o.statusHidup === 'dalamKandungan' || o.statusHidup === 'mafqud' || !!o.khuntsa);
const adaJanin = (kasus: Kasus): boolean => Object.values(kasus.graf.orang).some(o => o.statusHidup === 'dalamKandungan');

export function jalankan(kasus: Kasus): HasilTampil {
  try {
    const dasar = keInputEngine(kasus);
    const lanjutan = { urutanWafat: kasus.urutanWafat, ...(kasus.dikandungSetelahWafat ? { dikandungSetelahWafat: kasus.dikandungSetelahWafat } : {}) };
    if (kasus.gharqa) {
      const { anggota, keadaan, tirkah } = kasus.gharqa;
      return { jenis: 'gharqa', hasil: hitungGharqa({ dasar, anggota, keadaan, tirkah: { ...tirkah, [kasus.graf.idPewaris]: kasus.tirkah } }) };
    }
    if (adaBelumPasti(kasus)) {
      // [R13-17] menunggu kelahiran lebih utama; pengguna yang memilih.
      if (kasus.pilihanJanin === 'tunggu' && adaJanin(kasus)) return { jenis: 'menunggu' };
      return { jenis: 'taqdir', hasil: hitungTaqdir(dasar, lanjutan) };
    }
    if (kasus.urutanWafat.length > 0) return { jenis: 'munasakhat', hasil: hitungMunasakhat({ dasar, ...lanjutan }) };
    return { jenis: 'biasa', hasil: hitungDzawilArham(dasar) };
  } catch (galat) {
    return { jenis: 'galat', pesan: galat instanceof Error ? galat.message : String(galat) };
  }
}
```

Perbaiki pemakai `HasilTampil` supaya typecheck lulus:
- `layar/Penjelasan.tsx` `daftarBabDari`: tambah cabang
  ```ts
  if (tampil.jenis === 'taqdir' && tampil.hasil.status === 'OK') {
    return jelaskanTaqdir(tampil.hasil, kasus.graf, { kamus: kamusNarasi }).daftarBagian
      .flatMap(bagian => bagian.daftarBab.map(bab => ({ judulBagian: bagian.judul, bab })));
  }
  if (tampil.jenis === 'gharqa' && (tampil.hasil.status === 'OK' || tampil.hasil.status === 'MAUQUF') && kasus.gharqa) {
    return jelaskanGharqa(tampil.hasil, kasus.graf, kasus.gharqa.keadaan, { kamus: kamusNarasi }).daftarBagian
      .flatMap(bagian => bagian.daftarBab.map(bab => ({ judulBagian: bagian.judul, bab })));
  }
  ```
- `hasil/ringkasan.ts` dan `layar/Hasil.tsx`: `Hasil` akan meneruskan jenis baru ke `HasilKasusKhusus` (Task 10), jadi `ringkas` cukup dipanggil untuk `biasa`/`munasakhat`. Sementara Task 10 belum ada, di `Hasil` tambahkan di awal: `if (tampil.jenis === 'taqdir' || tampil.jenis === 'gharqa' || tampil.jenis === 'menunggu') return null;` dengan komentar `// diganti HasilKasusKhusus di Task 10`. Jalankan typecheck untuk menemukan `switch`/narrowing lain.

- [ ] **Step 4: Jalankan tes + typecheck**

Run: `pnpm --filter @waris/web test -- jalankan integrasi && pnpm --filter @waris/web exec tsc --noEmit`
Expected: PASS, tanpa galat tipe.

- [ ] **Step 5: Commit** — `git commit -am "web: jalankan memilih gharqa/taqdir/munasakhat/biasa + jenis menunggu"` (tambahkan `jalankan.test.ts` dengan `git add`).

---

### Task 5: Wizard — babak di keadaan, validasi, layar `cerita`

**Files:**
- Modify: `apps/web/src/keadaan.ts`, `apps/web/src/layar/wizard/validasi.ts`, `apps/web/src/layar/Wizard.tsx`, `apps/web/src/layar/wizard/KerangkaLangkah.tsx`, `apps/web/src/Aplikasi.tsx`
- Test: `apps/web/src/__tests__/keadaan.test.ts`, `apps/web/src/__tests__/validasi.test.ts`

**Interfaces:**
- Consumes: `daftarAlmarhum`, `kerabatDari`, `perluPeriksaCerita` (Task 2).
- Produces:
  ```ts
  // keadaan.ts
  export type Layar = 'awal' | 'wizard' | 'cerita' | 'hasil' | 'belajar';
  export interface KeadaanAplikasi { layar; langkah: number; babak: number; kasus; tujuan }
  // Aksi tambahan: { jenis: 'KE_BABAK'; babak: number }
  // validasi.ts
  export function alasanBabak(kasus: Kasus, babak: number): string | null
  // KerangkaLangkah: prop baru `subjudul?: string`
  ```
  Setiap pemakai `keadaanAwal`/`KeadaanAplikasi` literal ditambah `babak: 0`.

- [ ] **Step 1: Tes gagal** (tambah ke `keadaan.test.ts` dan `validasi.test.ts`)

```ts
// keadaan.test.ts
import { terapkanKeadaan } from '../keadaanOrang';
it('babak: KE_BABAK dibatasi jumlah almarhum; kembali dari langkah 5 ke babak terakhir', () => {
  let keadaan = pengurangKeadaan(keadaanAwal(null, null), { jenis: 'MULAI' });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'PILIH_PEWARIS', jenisKelamin: 'L' });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, tirkah: { ...k.tirkah, kotor: 10n }, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') }) });
  const anak = Object.values(keadaan.kasus!.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => terapkanKeadaan(k, anak, { jenis: 'wafatSesudah', hartaSudahDibagi: false }) });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'KE_LANGKAH', langkah: 4 });
  expect(pengurangKeadaan(keadaan, { jenis: 'KE_BABAK', babak: 5 }).babak).toBe(1);
  keadaan = { ...keadaan, langkah: 5 };
  expect(pengurangKeadaan(keadaan, { jenis: 'KE_LANGKAH', langkah: 4 })).toMatchObject({ langkah: 4, babak: 1 });
});
it('layar cerita hanya bila semua langkah lengkap', () => {
  expect(pengurangKeadaan(keadaanAwal(null, null), { jenis: 'KE_LAYAR', layar: 'cerita' }).layar).toBe('awal');
});

// validasi.test.ts
import { alasanBabak } from '../layar/wizard/validasi';
it('babak almarhum tanpa kerabat belum lengkap', () => {
  let kasus = { ...kasusBaru('L'), tirkah: { kotor: 10n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
  const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
  kasus = { ...kasus, urutanWafat: [anak] };
  expect(alasanBabak(kasus, 0)).toBeNull();                 // pewaris punya anak
  expect(alasanBabak(kasus, 1)).not.toBeNull();             // anak belum punya kerabat selain yang wafat
  expect(alasanBelumLengkap(kasus, 4)).not.toBeNull();
});
```

(Catatan: anak laki-laki itu punya "ayah" = pewaris yang sudah wafat lebih dulu; `kerabatDari` memuatnya karena berperan AYAH. `alasanBabak` harus mengecualikan almarhum sebelumnya — lihat implementasi.)

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/web test -- keadaan validasi` → FAIL.

- [ ] **Step 3: Implementasi**

`validasi.ts`:

```ts
import { daftarAlmarhum, kerabatDari } from '../../keadaanOrang';

/** Babak k lengkap bila almarhumnya punya ≥ 1 kerabat yang masih hidup saat ia wafat (bukan almarhum sebelumnya). */
export function alasanBabak(kasus: Kasus, babak: number): string | null {
  const almarhum = daftarAlmarhum(kasus);
  const idMayit = almarhum[babak];
  if (!idMayit) return null;
  const sebelumnya = new Set(almarhum.slice(0, babak));
  const ada = kerabatDari(kasus, idMayit).some(id => !sebelumnya.has(id) && kasus.graf.orang[id]!.statusHidup !== 'wafat');
  return ada ? null : t('hitung.babak.tambahkan_keluarga_almarhum');
}
```

Di `alasanBelumLengkap`, ganti cabang langkah 4:

```ts
if (langkah === 4) {
  if (!adaAhliWaris(kasus)) return t('hitung.tambahkan_minimal_satu_ahli_waris');
  for (let babak = 1; babak < daftarAlmarhum(kasus).length; babak++) {
    const alasan = alasanBabak(kasus, babak);
    if (alasan) return alasan;
  }
}
```

`keadaan.ts`:

```ts
export type Layar = 'awal' | 'wizard' | 'cerita' | 'hasil' | 'belajar';
export interface KeadaanAplikasi { layar: Layar; langkah: number; babak: number; kasus: Kasus | null; tujuan: Tujuan | null }
// Aksi: | { jenis: 'KE_BABAK'; babak: number }

export const keadaanAwal = (kasusTersimpan: Kasus | null, tujuan: Tujuan | null): KeadaanAplikasi =>
  ({ layar: 'awal', langkah: 1, babak: 0, kasus: kasusTersimpan, tujuan });

const babakTerakhir = (kasus: Kasus | null): number => (kasus ? daftarAlmarhum(kasus).length - 1 : 0);

// di pengurangKeadaan:
case 'MULAI': return { ...keadaan, layar: 'wizard', langkah: 1, babak: 0, kasus: null };
case 'KE_LANGKAH': {
  const batas = Math.min(TOTAL_LANGKAH, langkahTerjauh(keadaan.kasus));
  const langkah = Math.min(batas, Math.max(1, aksi.langkah));
  // Mundur dari langkah 5 ke langkah 4 = babak terakhir; selain itu mulai dari babak pewaris.
  const babak = langkah === 4 && keadaan.langkah === 5 ? babakTerakhir(keadaan.kasus) : 0;
  return { ...keadaan, layar: 'wizard', langkah, babak };
}
case 'KE_BABAK': return { ...keadaan, babak: Math.min(babakTerakhir(keadaan.kasus), Math.max(0, aksi.babak)) };
case 'UBAH_KASUS': {
  if (!keadaan.kasus) return keadaan;
  const kasus = rapikanKeadaan(aksi.ubah(keadaan.kasus));
  return { ...keadaan, kasus, babak: Math.min(keadaan.babak, babakTerakhir(kasus)) };
}
case 'KE_LAYAR': {
  const bolehHasil = langkahTerjauh(keadaan.kasus) === LANGKAH_HASIL;
  if ((aksi.layar === 'hasil' || aksi.layar === 'belajar' || aksi.layar === 'cerita') && !bolehHasil) return keadaan;
  return { ...keadaan, layar: aksi.layar };
}
case 'MUAT': return { ...keadaan, layar: 'hasil', langkah: TOTAL_LANGKAH, babak: 0, kasus: aksi.kasus };
case 'ULANGI': return { ...keadaan, layar: 'awal', langkah: 1, babak: 0, kasus: null };
```

`KerangkaLangkah`: tambah prop `subjudul?: string | undefined`; bila ada, tampilkan di bawah label langkah: `<p className="subjudul-babak">{subjudul}</p>`.

`Wizard.tsx`: babak & navigasi:

```tsx
const { kasus, langkah, babak } = keadaan;
const almarhum = kasus ? daftarAlmarhum(kasus) : [];
const alasan = langkah === 4 && kasus ? (babak === 0 && alasanBelumLengkapPewaris(kasus)) || alasanBabak(kasus, babak) : alasanBelumLengkap(kasus, langkah);
```
di mana `alasanBelumLengkapPewaris = (k) => adaAhliWaris(k) ? null : t('hitung.tambahkan_minimal_satu_ahli_waris')` — ekspor `adaAhliWaris` dari `validasi.ts` supaya tidak ditulis ulang.

```tsx
const subjudul = langkah === 4 && babak > 0 && kasus
  ? t('hitung.babak.subjudul', { nomor: babak + 1, total: almarhum.length, nama: namaSingkat(kasus, almarhum[babak]!) })
  : undefined;
const saatLanjut = () => {
  if (langkah === 4 && babak < almarhum.length - 1) return kirim({ jenis: 'KE_BABAK', babak: babak + 1 });
  if (langkah === TOTAL_LANGKAH) return kirim({ jenis: 'KE_LAYAR', layar: kasus && perluPeriksaCerita(kasus) ? 'cerita' : 'hasil' });
  kirim({ jenis: 'KE_LANGKAH', langkah: langkah + 1 });
};
const saatKembali = () => {
  if (langkah === 4 && babak > 0) return kirim({ jenis: 'KE_BABAK', babak: babak - 1 });
  kirim(langkah === 1 ? { jenis: 'KE_LAYAR', layar: 'awal' } : { jenis: 'KE_LANGKAH', langkah: langkah - 1 });
};
```

Isi langkah 4 (sementara, dilengkapi Task 7–9): `babak === 0 ? <LangkahAhliWaris …/> : null`.

`namaSingkat(kasus, id)` di `keadaanOrang.ts` (tambahkan di task ini):

```ts
import { labelOrangChecklist } from './layar/LangkahAhliWaris';
/** Nama untuk kalimat: nama isian, atau label hubungan dari babak asalnya ("Anak laki-laki"). */
export const namaSingkat = (kasus: Kasus, idOrang: IdOrang): string =>
  kasus.graf.orang[idOrang]!.nama ?? labelOrangChecklist(kasus.graf, babakAsal(kasus, idOrang) ?? kasus.graf.idPewaris, idOrang);
```

Bila import dari `layar/` ke modul murni terasa terbalik, pindahkan `labelOrangChecklist` ke `checklist.ts` dan ekspor ulang dari `LangkahAhliWaris.tsx` (isinya tidak memakai React).

`Aplikasi.tsx`: layar `cerita` merender `<PeriksaCerita …/>` (Task 11); sementara render `<Hasil …/>` supaya alur tidak putus, dengan komentar `// diganti PeriksaCerita di Task 11`.

Diksi (`diksi-t5.json`):
```json
[
 {"kunci":"hitung.babak.subjudul","id":"Babak {nomor} dari {total} · {nama}"},
 {"kunci":"hitung.babak.tambahkan_keluarga_almarhum","id":"Tambahkan dulu keluarga yang ditinggalkan almarhum di babak ini."}
]
```

- [ ] **Step 4: Jalankan** — `pnpm --filter @waris/web test -- keadaan validasi langkah kerangka diksi && pnpm --filter @waris/web exec tsc --noEmit` → PASS. Tes lama yang membuat `KeadaanAplikasi` literal ditambah `babak: 0`.

- [ ] **Step 5: Commit** — `git commit -am "web: sub-langkah babak di wizard, validasi per babak, layar cerita"`.

---

### Task 6: `DialogKeadaan` — satu pertanyaan per layar

**Files:**
- Create: `apps/web/src/layar/keadaan/DialogKeadaan.tsx`
- Modify: `apps/web/src/gaya/komponen.css`
- Test: `apps/web/src/__tests__/dialogKeadaan.test.tsx`

**Interfaces:**
- Consumes: `terapkanKeadaan`, `alasanTidakDidukung`, `babakAsal`, `namaSingkat`, `JawabanKeadaan` (Task 2); `mulaiSisip`, `pembanding`, `jawabSisip`, `posisiAkhir` (Task 3); `IsianUang` (`layar/wizard/IsianUang.tsx`).
- Produces:
  ```tsx
  export function DialogKeadaan(props: { kasus: Kasus; idOrang: IdOrang; saatSelesai: (kasusBaru: Kasus) => void; saatBatal: () => void }): JSX.Element
  export function LayarUrutan(props: { kasus: Kasus; idOrang: IdOrang; idMayitBabak: IdOrang; saatSelesai: (posisi: number) => void; saatTidakTahu: () => void }): JSX.Element
  export const KHUNTSA_MUNGKIN: KunciAhliWaris[]
  ```
  Dialog **tidak** mengubah `Kasus` sampai layar terakhir; `saatSelesai` menerima `Kasus` hasil `terapkanKeadaan`. Tutup di tengah = tidak ada perubahan.

- [ ] **Step 1: Tes gagal**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { DialogKeadaan } from '../layar/keadaan/DialogKeadaan';

function keluarga(jumlahAnak = 1) {
  let kasus: Kasus = kasusBaru('L');
  for (let i = 0; i < jumlahAnak; i++) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
  const anak = Object.values(kasus.graf.orang).filter(o => o.idAyah === 'PEWARIS').map(o => o.id);
  return { kasus, anak };
}
const pilih = (nama: RegExp) => fireEvent.click(screen.getByRole('radio', { name: nama }));
const lanjut = () => fireEvent.click(screen.getByRole('button', { name: /Lanjut|Simpan/ }));

describe('DialogKeadaan', () => {
  it('S1: sudah wafat → sesudah → belum dibagi → tersimpan di urutan', () => {
    const { kasus, anak } = keluarga();
    const selesai = vi.fn();
    render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut();
    pilih(/Sesudah/); lanjut();
    expect(screen.getByText(/sudah dihitung bagian masing-masing/)).toBeTruthy();
    pilih(/Belum dibagi/); lanjut();
    expect(selesai.mock.calls[0]![0].urutanWafat).toEqual([anak[0]]);
  });

  it('S5 dan S30', () => {
    const { kasus, anak } = keluarga();
    const selesai = vi.fn();
    const { unmount } = render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Sebelum/); lanjut();
    expect(selesai.mock.calls[0]![0].graf.orang[anak[0]!].statusHidup).toBe('wafat');
    unmount();
    render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Sesudah/); lanjut(); pilih(/Sudah dibagi/); lanjut();
    expect(selesai.mock.calls[1]![0].wafatSesudahDibagi).toEqual([anak[0]]);
  });

  it('dua almarhum: menanyakan siapa lebih dulu', () => {
    const { kasus, anak } = keluarga(2);
    const selesai = vi.fn();
    const pertama = { ...kasus, urutanWafat: [anak[0]!] };
    render(<DialogKeadaan kasus={pertama} idOrang={anak[1]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Sesudah/); lanjut(); pilih(/Belum dibagi/); lanjut();
    expect(screen.getByText(/Siapa yang wafat lebih dulu/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole('radio')[0]!);   // pilihan pertama = orang baru ini
    lanjut();
    expect(selesai.mock.calls[0]![0].urutanWafat).toEqual([anak[1], anak[0]]);
  });

  it('bersamaan: dua pertanyaan lalu harta', () => {
    const { kasus, anak } = keluarga();
    const selesai = vi.fn();
    render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Bersamaan/); lanjut();
    pilih(/Tidak pasti/); lanjut();
    pilih(/Tidak pernah ada yang tahu/); lanjut();
    lanjut();   // harta boleh kosong
    expect(selesai.mock.calls[0]![0].gharqa).toMatchObject({ keadaan: 'tidakDiketahui' });
  });

  it('menolak bersamaan bila sudah ada urutan wafat lain', () => {
    const { kasus, anak } = keluarga(2);
    const selesai = vi.fn();
    render(<DialogKeadaan kasus={{ ...kasus, urutanWafat: [anak[0]!] }} idOrang={anak[1]!} saatSelesai={selesai} saatBatal={() => {}} />);
    pilih(/Sudah wafat/); lanjut(); pilih(/Bersamaan/); lanjut();
    expect(screen.getByText(/belum bisa dihitung otomatis/)).toBeTruthy();
    expect(selesai).not.toHaveBeenCalled();
  });

  it('keadaan lain: khuntsa hanya untuk hubungan yang mungkin', () => {
    const { kasus, anak } = keluarga();
    render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={() => {}} saatBatal={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Keadaan lain/ }));
    expect(screen.getByRole('radio', { name: /Kelaminnya belum bisa ditentukan/ })).toBeTruthy();
  });

  it('batal tidak mengubah apa pun', () => {
    const { kasus, anak } = keluarga();
    const batal = vi.fn(); const selesai = vi.fn();
    render(<DialogKeadaan kasus={kasus} idOrang={anak[0]!} saatSelesai={selesai} saatBatal={batal} />);
    pilih(/Sudah wafat/); lanjut();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(batal).toHaveBeenCalled(); expect(selesai).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/web test -- dialogKeadaan` → FAIL.

- [ ] **Step 3: Implementasi**

Mesin layar sebagai union supaya tiap layar punya satu pertanyaan:

```tsx
// Dialog keadaan satu orang (spec 1.1): satu pertanyaan per layar, jawaban baru diterapkan di layar terakhir.
// Menerima Kasus + orang; menyerahkan Kasus baru lewat saatSelesai. Keadaan yang belum didukung engine ditolak di sini.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { IdOrang, InputTirkah, KeadaanGharqa, KunciAhliWaris } from '@waris/engine';
import { KONFIGURASI_BAWAAN, turunkanPeran } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { alasanTidakDidukung, babakAsal, namaSingkat, terapkanKeadaan, type JawabanKeadaan } from '../../keadaanOrang';
import { jawabSisip, mulaiSisip, pembanding, posisiAkhir, type Sisipan } from '../../urutan';
import { Tombol } from '../../ui/komponen';
import { IsianUang } from '../wizard/IsianUang';
import { t } from '../../terjemah';

// [R13-9] khuntsa hanya di jihah bunuwwah, ukhuwwah, 'umumah (13c.1): bukan orang tua atau pasangan.
export const KHUNTSA_MUNGKIN: KunciAhliWaris[] = ['ANAK_LK', 'ANAK_PR', 'CUCU_LK', 'CUCU_PR', 'SAUDARA_KANDUNG', 'SAUDARI_KANDUNG',
  'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU', 'KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK',
  'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'];
const TANPA_HARTA: InputTirkah = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

type Layar =
  | { jenis: 'keadaan'; lain: boolean }
  | { jenis: 'waktu' }
  | { jenis: 'dibagi' }
  | { jenis: 'urutan'; sisipan: Sisipan }
  | { jenis: 'putusan' }
  | { jenis: 'serentak' }
  | { jenis: 'pernahTahu' }
  | { jenis: 'harta'; keadaan: KeadaanGharqa }
  | { jenis: 'baligh' }
  | { jenis: 'ditolak' };

export function DialogKeadaan({ kasus, idOrang, saatSelesai, saatBatal }: {
  kasus: Kasus; idOrang: IdOrang; saatSelesai: (kasusBaru: Kasus) => void; saatBatal: () => void;
}) {
  const id = useId();
  const nama = namaSingkat(kasus, idOrang);
  const idMayit = babakAsal(kasus, idOrang) ?? kasus.graf.idPewaris;
  const mayit = namaSingkat(kasus, idMayit);
  const pewaris = namaSingkat(kasus, kasus.graf.idPewaris);
  const [layar, setLayar] = useState<Layar>({ jenis: 'keadaan', lain: false });
  const [pilihan, setPilihan] = useState<string | null>(null);
  const [hartaSendiri, setHartaSendiri] = useState(0n);
  const [riwayat, setRiwayat] = useState<Layar[]>([]);
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => { wadah.current?.querySelector<HTMLElement>('[role=radio]')?.focus(); }, [layar]);

  const ke = (berikut: Layar) => { setRiwayat([...riwayat, layar]); setLayar(berikut); setPilihan(null); };
  const selesai = (jawaban: JawabanKeadaan) => {
    if (alasanTidakDidukung(kasus, idOrang, jawaban)) return ke({ jenis: 'ditolak' });
    saatSelesai(terapkanKeadaan(kasus, idOrang, jawaban));
  };
  const kunciOrang = turunkanPeran({ ...kasus.graf, idPewaris: idMayit }, KONFIGURASI_BAWAAN).daftarPeran[idOrang]?.kunci;
  const bolehKhuntsa = !!kunciOrang && KHUNTSA_MUNGKIN.includes(kunciOrang as KunciAhliWaris);

  const lanjut = () => {
    switch (layar.jenis) {
      case 'keadaan':
        if (pilihan === 'hidup') return selesai({ jenis: 'hidup' });
        if (pilihan === 'wafat') return ke({ jenis: 'waktu' });
        if (pilihan === 'hilang') return ke({ jenis: 'putusan' });
        if (pilihan === 'khuntsa') return ke({ jenis: 'baligh' });
        return;
      case 'waktu':
        if (pilihan === 'sebelum') return selesai({ jenis: 'wafatSebelum' });
        if (pilihan === 'sesudah') return ke({ jenis: 'dibagi' });
        if (pilihan === 'bersamaan') {
          return alasanTidakDidukung(kasus, idOrang, { jenis: 'bersamaan', keadaan: 'serentak', tirkah: TANPA_HARTA })
            ? ke({ jenis: 'ditolak' }) : ke({ jenis: 'serentak' });
        }
        return;
      case 'dibagi': {
        if (pilihan === 'sudah') return selesai({ jenis: 'wafatSesudah', hartaSudahDibagi: true });
        if (alasanTidakDidukung(kasus, idOrang, { jenis: 'wafatSesudah', hartaSudahDibagi: false })) return ke({ jenis: 'ditolak' });
        const tanpaDiri = { ...kasus, urutanWafat: kasus.urutanWafat.filter(lain => lain !== idOrang) };
        const sisipan = mulaiSisip(tanpaDiri, idMayit);
        return pembanding(sisipan) ? ke({ jenis: 'urutan', sisipan }) : selesai({ jenis: 'wafatSesudah', hartaSudahDibagi: false, posisi: posisiAkhir(sisipan) });
      }
      case 'urutan': {
        if (pilihan === 'tidakTahu') return ke({ jenis: 'ditolak' });   // bersamaan antar-almarhum lanjutan: E1
        const berikut = jawabSisip(layar.sisipan, pilihan === 'diri');
        return pembanding(berikut) ? ke({ jenis: 'urutan', sisipan: berikut })
          : selesai({ jenis: 'wafatSesudah', hartaSudahDibagi: false, posisi: posisiAkhir(berikut) });
      }
      case 'putusan':
        if (pilihan === 'belum') return selesai({ jenis: 'hilang' });   // [R13-6]
        if (pilihan === 'sudah') return ke({ jenis: 'waktu' });           // [R13-18] butir 3: seperti wafat
        if (pilihan === 'takTahuKapan') return ke({ jenis: 'serentak' }); // [R13-18] butir 5: gharqa
        return;
      case 'serentak':
        if (pilihan === 'ya') return ke({ jenis: 'harta', keadaan: 'serentak' });
        if (pilihan === 'tidak') return ke({ jenis: 'pernahTahu' });
        return;
      case 'pernahTahu':
        // [K13d-1] keadaan 4 dan 5 sama di semua madzhab → satu pilihan 'tidakDiketahui'.
        if (pilihan === 'lupa') return ke({ jenis: 'harta', keadaan: 'terlupakan' });
        if (pilihan === 'tidakPernah') return ke({ jenis: 'harta', keadaan: 'tidakDiketahui' });
        if (pilihan === 'tahu') return ke({ jenis: 'waktu' });
        return;
      case 'harta':
        return selesai({ jenis: 'bersamaan', keadaan: layar.keadaan, tirkah: { ...TANPA_HARTA, kotor: hartaSendiri } });
      case 'baligh':
        if (pilihan === 'belum') return selesai({ jenis: 'khuntsa', keadaan: 'diharapkanJelas' });
        if (pilihan === 'sudah') return selesai({ jenis: 'khuntsa', keadaan: 'tidakDiharapkanJelas' });
        return;
      case 'ditolak': return saatBatal();
    }
  };
  const kembali = () => { const lalu = riwayat.at(-1); if (!lalu) return saatBatal(); setRiwayat(riwayat.slice(0, -1)); setLayar(lalu); setPilihan(null); };

  const opsi = (daftar: Array<[string, string, string?]>) => (
    <div className="pilihan-dialog" role="radiogroup" aria-labelledby={`${id}-tanya`}>
      {daftar.map(([nilai, label, keterangan]) => (
        <button key={nilai} type="button" role="radio" aria-checked={pilihan === nilai} className="opsi-dialog" onClick={() => setPilihan(nilai)}>
          <span>{label}</span>{keterangan && <small>{keterangan}</small>}
        </button>
      ))}
    </div>
  );

  let isi: { tanya: string; keterangan?: string; badan: ReactNode };
  switch (layar.jenis) {
    case 'keadaan':
      isi = { tanya: t('hitung.keadaan.tanya', { nama }), badan: <>
        {opsi([
          ['hidup', t('hitung.keadaan.masih_hidup')], ['wafat', t('hitung.keadaan.sudah_wafat')], ['hilang', t('hitung.keadaan.hilang')],
          ...(layar.lain && bolehKhuntsa ? [['khuntsa', t('hitung.keadaan.kelamin_belum_jelas'), t('hitung.keadaan.kelamin_belum_jelas_ket')] as [string, string, string]] : []),
        ])}
        {!layar.lain && <button type="button" className="tautan" onClick={() => setLayar({ jenis: 'keadaan', lain: true })}>{t('hitung.keadaan.keadaan_lain')}</button>}
      </> };
      break;
    case 'waktu':
      isi = { tanya: t('hitung.keadaan.sebelum_atau_sesudah', { nama, mayit }), keterangan: t('hitung.keadaan.kenapa_waktu', { mayit }), badan:
        opsi([['sebelum', t('hitung.keadaan.sebelum', { mayit })], ['sesudah', t('hitung.keadaan.sesudah', { mayit })], ['bersamaan', t('hitung.keadaan.bersamaan_atau_tidak_tahu')]]) };
      break;
    case 'dibagi':
      isi = { tanya: t('hitung.keadaan.harta_sudah_dibagi', { nama, pewaris }), keterangan: t('hitung.keadaan.arti_dibagi'), badan:
        opsi([['belum', t('hitung.keadaan.belum_dibagi')], ['sudah', t('hitung.keadaan.sudah_dibagi')]]) };
      break;
    case 'urutan': {
      const lain = namaSingkat(kasus, pembanding(layar.sisipan)!);
      isi = { tanya: t('hitung.keadaan.siapa_lebih_dulu'), badan: opsi([['diri', nama], ['lain', lain], ['tidakTahu', t('hitung.keadaan.bersamaan_atau_tidak_tahu')]]) };
      break;
    }
    case 'putusan':
      isi = { tanya: t('hitung.hilang.ada_putusan', { nama }), badan: opsi([
        ['belum', t('hitung.hilang.belum_ada')], ['sudah', t('hitung.hilang.sudah_ada')], ['takTahuKapan', t('hitung.hilang.pasti_wafat_tak_tahu_kapan')]]) };
      break;
    case 'serentak':
      isi = { tanya: t('hitung.bersamaan.pasti_bersamaan', { nama, mayit }), keterangan: t('hitung.bersamaan.contoh'), badan:
        opsi([['ya', t('hitung.bersamaan.ya_pasti')], ['tidak', t('hitung.bersamaan.tidak_pasti')]]) };
      break;
    case 'pernahTahu':
      isi = { tanya: t('hitung.bersamaan.pernah_tahu'), badan: opsi([
        ['lupa', t('hitung.bersamaan.pernah_tahu_lupa')], ['tidakPernah', t('hitung.bersamaan.tidak_pernah_tahu')], ['tahu', t('hitung.bersamaan.sekarang_tahu')]]) };
      break;
    case 'harta':
      isi = { tanya: t('hitung.bersamaan.harta_sendiri', { nama }), keterangan: t('hitung.bersamaan.harta_sendiri_ket'), badan:
        <IsianUang id={`${id}-harta`} label={t('hitung.bersamaan.harta_label', { nama })} nilai={hartaSendiri} saatUbah={setHartaSendiri} /> };
      break;
    case 'baligh':
      isi = { tanya: t('hitung.keadaan.sudah_baligh', { nama }), keterangan: t('hitung.keadaan.baligh_ket'), badan:
        opsi([['belum', t('hitung.keadaan.belum_baligh'), t('hitung.keadaan.belum_baligh_ket')], ['sudah', t('hitung.keadaan.sudah_baligh_tetap'), t('hitung.keadaan.sudah_baligh_tetap_ket')]]) };
      break;
    case 'ditolak':
      isi = { tanya: t('hitung.keadaan.belum_didukung'), badan: <p>{t('hitung.keadaan.belum_didukung_ket')}</p> };
      break;
  }
  const bisaLanjut = layar.jenis === 'harta' || layar.jenis === 'ditolak' || pilihan !== null;
  return (
    <div className="konfirmasi" role="dialog" aria-modal="true" aria-labelledby={`${id}-tanya`} ref={wadah}
      onKeyDown={event => { if (event.key === 'Escape') saatBatal(); }}>
      <div className="konfirmasi-isi dialog-langkah">
        <p className="label-langkah">{nama}</p>
        <h2 id={`${id}-tanya`}>{isi.tanya}</h2>
        {isi.keterangan && <p className="keterangan">{isi.keterangan}</p>}
        {isi.badan}
        <div className="aksi-konfirmasi">
          <button type="button" className="tautan" onClick={kembali}>{riwayat.length ? t('umum.kembali_2') : t('umum.batal')}</button>
          <Tombol disabled={!bisaLanjut} onClick={lanjut}>{layar.jenis === 'ditolak' ? t('umum.tutup') : t('umum.lanjut')}</Tombol>
        </div>
      </div>
    </div>
  );
}
```

Periksa kunci `umum.kembali_2`, `umum.batal`, `umum.tutup`, `umum.lanjut` di snapshot (`grep '"umum.' apps/web/src/snapshot.json`); yang belum ada ikut ditambahkan di diksi task ini. Label tombol di tes memakai `/Lanjut|Simpan/`; pastikan teks `umum.lanjut` = "Lanjut".

CSS (tambah di `komponen.css`, pakai token yang ada):

```css
/* ─── Dialog keadaan orang ─── */
.dialog-langkah{display:flex;flex-direction:column;gap:12px;max-width:480px}
.dialog-langkah h2{font:700 24px/1.2 var(--font-display);margin:0;text-wrap:balance}
.pilihan-dialog{display:flex;flex-direction:column;gap:8px}
.opsi-dialog{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px 14px;border:var(--border-w) solid var(--outline);border-radius:var(--radius-md);background:var(--surface-raised);color:var(--ink);font:700 16px/1.3 var(--font-sans);text-align:start;cursor:pointer}
.opsi-dialog small{font-weight:500;font-size:13px;color:var(--ink-muted)}
.opsi-dialog[aria-checked=true]{background:var(--primary);color:var(--on-primary);box-shadow:var(--shadow-pop-sm)}
.opsi-dialog[aria-checked=true] small{color:var(--on-primary)}
.opsi-dialog:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.tautan{background:none;border:0;padding:0;color:var(--primary);font:700 14px var(--font-sans);text-decoration:underline;text-underline-offset:3px;cursor:pointer;align-self:flex-start}
```
(Cek dulu apakah `.tautan` sudah ada: `grep -n "^\.tautan" apps/web/src/gaya/komponen.css`; jika ada, jangan duplikat.)

Diksi (`diksi-t6.json`, kalimat mengikuti riset 7.3–7.8):
```json
[
 {"kunci":"hitung.keadaan.tanya","id":"Bagaimana keadaan {nama} sekarang?"},
 {"kunci":"hitung.keadaan.masih_hidup","id":"Masih hidup"},
 {"kunci":"hitung.keadaan.sudah_wafat","id":"Sudah wafat"},
 {"kunci":"hitung.keadaan.hilang","id":"Hilang, tidak ada kabar"},
 {"kunci":"hitung.keadaan.keadaan_lain","id":"Keadaan lain ›"},
 {"kunci":"hitung.keadaan.kelamin_belum_jelas","id":"Kelaminnya belum bisa ditentukan"},
 {"kunci":"hitung.keadaan.kelamin_belum_jelas_ket","id":"Pilih ini hanya bila dokter atau hakim belum bisa memastikan."},
 {"kunci":"hitung.keadaan.sebelum_atau_sesudah","id":"{nama} wafat sebelum atau sesudah {mayit}?"},
 {"kunci":"hitung.keadaan.kenapa_waktu","id":"Orang yang wafat lebih dulu dari {mayit} tidak mendapat warisan darinya."},
 {"kunci":"hitung.keadaan.sebelum","id":"Sebelum {mayit}"},
 {"kunci":"hitung.keadaan.sesudah","id":"Sesudah {mayit}"},
 {"kunci":"hitung.keadaan.bersamaan_atau_tidak_tahu","id":"Bersamaan, atau tidak tahu siapa yang duluan"},
 {"kunci":"hitung.keadaan.harta_sudah_dibagi","id":"Waktu {nama} wafat, apakah harta {pewaris} sudah dibagi?"},
 {"kunci":"hitung.keadaan.arti_dibagi","id":"Sudah dibagi artinya: sudah dihitung bagian masing-masing dan sudah diserahkan. Rumah yang ditempati bersama belum termasuk dibagi."},
 {"kunci":"hitung.keadaan.belum_dibagi","id":"Belum dibagi"},
 {"kunci":"hitung.keadaan.sudah_dibagi","id":"Sudah dibagi"},
 {"kunci":"hitung.keadaan.siapa_lebih_dulu","id":"Siapa yang wafat lebih dulu?"},
 {"kunci":"hitung.keadaan.sudah_baligh","id":"{nama} sudah dewasa (baligh)?"},
 {"kunci":"hitung.keadaan.baligh_ket","id":"Kalau sudah jelas laki-laki atau perempuan, pilih yang jelas itu di daftar."},
 {"kunci":"hitung.keadaan.belum_baligh","id":"Belum"},
 {"kunci":"hitung.keadaan.belum_baligh_ket","id":"Masih mungkin menjadi jelas"},
 {"kunci":"hitung.keadaan.sudah_baligh_tetap","id":"Sudah, dan tetap belum jelas"},
 {"kunci":"hitung.keadaan.sudah_baligh_tetap_ket","id":"Atau wafat saat masih kecil"},
 {"kunci":"hitung.keadaan.belum_didukung","id":"Keadaan ini belum bisa dihitung otomatis"},
 {"kunci":"hitung.keadaan.belum_didukung_ket","id":"Tanyakan ke ahli faraidh. Jawaban ini tidak disimpan."},
 {"kunci":"hitung.hilang.ada_putusan","id":"Sudah ada putusan pengadilan bahwa {nama} dianggap wafat?"},
 {"kunci":"hitung.hilang.belum_ada","id":"Belum ada"},
 {"kunci":"hitung.hilang.sudah_ada","id":"Sudah ada"},
 {"kunci":"hitung.hilang.pasti_wafat_tak_tahu_kapan","id":"Ternyata sudah pasti wafat, tapi tidak tahu kapan"},
 {"kunci":"hitung.bersamaan.pasti_bersamaan","id":"Apakah {nama} dan {mayit} pasti wafat di saat yang sama persis?"},
 {"kunci":"hitung.bersamaan.contoh","id":"Contoh: dalam satu kecelakaan, dan keduanya meninggal di tempat."},
 {"kunci":"hitung.bersamaan.ya_pasti","id":"Ya, pasti bersamaan"},
 {"kunci":"hitung.bersamaan.tidak_pasti","id":"Tidak pasti"},
 {"kunci":"hitung.bersamaan.pernah_tahu","id":"Dulu, pernah ada yang tahu siapa yang wafat terakhir?"},
 {"kunci":"hitung.bersamaan.pernah_tahu_lupa","id":"Pernah tahu, tapi sekarang lupa"},
 {"kunci":"hitung.bersamaan.tidak_pernah_tahu","id":"Tidak pernah ada yang tahu"},
 {"kunci":"hitung.bersamaan.sekarang_tahu","id":"Sekarang tahu siapa yang terakhir"},
 {"kunci":"hitung.bersamaan.harta_sendiri","id":"{nama} juga punya harta sendiri?"},
 {"kunci":"hitung.bersamaan.harta_sendiri_ket","id":"Karena wafat bersamaan, harta masing-masing dibagi sendiri-sendiri. Boleh dikosongkan."},
 {"kunci":"hitung.bersamaan.harta_label","id":"Harta {nama}"}
]
```

- [ ] **Step 4: Jalankan** — `pnpm --filter @waris/web test -- dialogKeadaan diksi` → PASS.
- [ ] **Step 5: Commit** — `git add apps/web/src/layar/keadaan/DialogKeadaan.tsx apps/web/src/__tests__/dialogKeadaan.test.tsx apps/web/src/gaya/komponen.css apps/web/src/snapshot.json && git commit -m "web: dialog keadaan orang (wafat, hilang, bersamaan, khuntsa, urutan)"`

---

### Task 7: Pertanyaan penutup di babak 1 + bersihkan `LangkahKondisi`

**Files:**
- Create: `apps/web/src/layar/keadaan/PertanyaanPenutup.tsx`
- Modify: `apps/web/src/layar/Wizard.tsx`, `apps/web/src/layar/LangkahKondisi.tsx`, `apps/web/src/layar/wizard/RingkasanSamping.tsx:15`, `apps/web/src/riwayat.ts:72`, `apps/web/src/konten/wizard.ts` (caption langkah 4)
- Test: `apps/web/src/__tests__/pertanyaanPenutup.test.tsx`, `apps/web/src/__tests__/kondisi.test.tsx`

**Interfaces:**
- Consumes: `DialogKeadaan` (Task 6); `keadaanOrang`, `kerabatDari`, `babakAsal`, `orangTerputus`, `terapkanKeadaan`, `namaSingkat` (Task 2); `DialogKonfirmasi` (`ui/Dialog.tsx`).
- Produces: `export function PertanyaanPenutup(props: { kasus: Kasus; idMayit: IdOrang; ubah: (f: (k: Kasus) => Kasus) => void }): JSX.Element`

- [ ] **Step 1: Tes gagal**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { terapkanKeadaan } from '../keadaanOrang';
import { PertanyaanPenutup } from '../layar/keadaan/PertanyaanPenutup';

let terakhir: Kasus;
function Uji({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <PertanyaanPenutup kasus={kasus} idMayit={kasus.graf.idPewaris} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} />;
}
const denganAnak = () => { const k = kasusBaru('L'); return { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') }; };

it('bawaan "Ya, masih hidup semua"; daftar keadaan tersembunyi', () => {
  render(<Uji awal={denganAnak()} />);
  expect(screen.getByRole('radio', { name: /masih hidup semua/ }).getAttribute('aria-checked')).toBe('true');
  expect(screen.queryByText(/Ketuk orangnya/)).toBeNull();
});

it('"Ada yang wafat" → ketuk orang → dialog → keadaan tampil di daftar', () => {
  render(<Uji awal={denganAnak()} />);
  fireEvent.click(screen.getByRole('radio', { name: /Ada yang sudah wafat atau hilang/ }));
  fireEvent.click(screen.getByRole('button', { name: /Anak laki-laki/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Hilang/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Belum ada/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  expect(Object.values(terakhir.graf.orang).some(o => o.statusHidup === 'mafqud')).toBe(true);
  expect(screen.getByText(/hilang/i)).toBeTruthy();
});

it('kembali ke "Ya" dengan keluarga babak lain meminta konfirmasi yang menyebut namanya', () => {
  let kasus = denganAnak();
  const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
  kasus = terapkanKeadaan(kasus, anak, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, anak, 'ISTRI') };
  const istri = Object.keys(kasus.graf.orang).find(id => kasus.graf.orang[id]!.jenisKelamin === 'P')!;
  kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [istri]: { ...kasus.graf.orang[istri]!, nama: 'Dewi' } } } };
  render(<Uji awal={kasus} />);
  fireEvent.click(screen.getByRole('radio', { name: /masih hidup semua/ }));
  expect(screen.getByRole('alertdialog').textContent).toMatch(/Dewi/);
  fireEvent.click(screen.getByRole('button', { name: /Ya, hapus/ }));
  expect(terakhir.urutanWafat).toEqual([]);
  expect(terakhir.graf.orang[istri]).toBeUndefined();
});
```

`kondisi.test.tsx`: hapus ekspektasi `queryByLabelText(/wafat sebelum harta dibagi/)`, dan tes lama yang mengisi `urutanWafat` di `LangkahKondisi` diganti: memilih "Tidak ada" **tidak** lagi mengosongkan `urutanWafat` (munasakhat bukan urusan langkah 5).

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/web test -- pertanyaanPenutup kondisi` → FAIL.

- [ ] **Step 3: Implementasi**

```tsx
// Pertanyaan penutup tiap babak (spec 1.1): "Semua orang di atas masih hidup?" bawaan Ya.
// "Ada" membuka daftar orang babak ini beserta keadaannya; ketuk orang → DialogKeadaan.
// Kembali ke "Ya" mengembalikan semua ke hidup, dengan konfirmasi bila ada keluarga babak lain yang ikut terhapus.

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { babakAsal, keadaanOrang, kerabatDari, namaSingkat, orangTerputus, terapkanKeadaan, type KeadaanTampil } from '../../keadaanOrang';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { DialogKeadaan } from './DialogKeadaan';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; idMayit: IdOrang; ubah: (f: (k: Kasus) => Kasus) => void }

const TEKS_KEADAAN: Record<KeadaanTampil, string> = {
  hidup: 'hitung.penutup.status_hidup', wafatSebelum: 'hitung.penutup.status_wafat_sebelum', wafatSesudah: 'hitung.penutup.status_wafat_sesudah',
  wafatSesudahDibagi: 'hitung.penutup.status_wafat_sesudah_dibagi', bersamaan: 'hitung.penutup.status_bersamaan', hilang: 'hitung.penutup.status_hilang',
  dalamKandungan: 'hitung.penutup.status_dalam_kandungan', khuntsa: 'hitung.penutup.status_khuntsa',
};

export function PertanyaanPenutup({ kasus, idMayit, ubah }: Props) {
  const orangBabak = kerabatDari(kasus, idMayit)
    .filter(id => babakAsal(kasus, id) === idMayit && kasus.graf.orang[id]!.statusHidup !== 'dalamKandungan');
  const adaTerisi = orangBabak.some(id => keadaanOrang(kasus, id) !== 'hidup');
  const [ada, setAda] = useState(adaTerisi);
  const [dialog, setDialog] = useState<IdOrang | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<{ kasusBaru: Kasus; nama: string[] } | null>(null);
  const mayit = namaSingkat(kasus, idMayit);

  const semuaHidup = (k: Kasus) => orangBabak.reduce((kini, id) => (keadaanOrang(kini, id) === 'hidup' ? kini : terapkanKeadaan(kini, id, { jenis: 'hidup' })), k);
  const pilihSemuaHidup = () => {
    const kasusBaru = semuaHidup(kasus);
    const terhapus = orangTerputus(kasus, kasusBaru);
    if (terhapus.length === 0) { setAda(false); ubah(semuaHidup); return; }
    setKonfirmasi({ kasusBaru, nama: terhapus.map(id => namaSingkat(kasus, id)) });
  };
  const status = (id: IdOrang) => {
    const keadaan = keadaanOrang(kasus, id);
    return keadaan === 'wafatSebelum' || keadaan === 'wafatSesudah' ? t(keadaan === 'wafatSebelum' ? 'hitung.penutup.status_wafat_sebelum' : 'hitung.penutup.status_wafat_sesudah', { mayit })
      : t(TEKS_KEADAAN[keadaan]);
  };

  return (
    <section className="penutup-babak" aria-labelledby={`penutup-${idMayit}`}>
      <h3 id={`penutup-${idMayit}`} className="judul-bagian-kecil">{t('hitung.penutup.tanya')}</h3>
      <div className="kartu-pilihan-deret ringkas" role="radiogroup" aria-labelledby={`penutup-${idMayit}`}>
        <button type="button" role="radio" aria-checked={!ada} className="kartu-pilihan kecil" onClick={pilihSemuaHidup}>
          <span>{t('hitung.penutup.ya_semua_hidup')}</span>
        </button>
        <button type="button" role="radio" aria-checked={ada} className="kartu-pilihan kecil" onClick={() => setAda(true)}>
          <span>{t('hitung.penutup.ada_yang_wafat')}</span>
        </button>
      </div>
      {ada && (
        <>
          <p className="keterangan">{t('hitung.penutup.ketuk_orangnya')}</p>
          <ul className="daftar-keadaan">
            {orangBabak.map(id => (
              <li key={id}>
                <button type="button" className="baris-keadaan" onClick={() => setDialog(id)}>
                  <b>{namaSingkat(kasus, id)}</b><span className={`lencana-keadaan ${keadaanOrang(kasus, id)}`}>{status(id)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {dialog && <DialogKeadaan kasus={kasus} idOrang={dialog} saatBatal={() => setDialog(null)}
        saatSelesai={kasusBaru => { setDialog(null); ubah(() => kasusBaru); }} />}
      {konfirmasi && (
        <DialogKonfirmasi judul={t('hitung.penutup.hapus_judul')} labelLanjut={t('hitung.penutup.ya_hapus')}
          saatBatal={() => setKonfirmasi(null)} saatLanjut={() => { setAda(false); ubah(() => konfirmasi.kasusBaru); setKonfirmasi(null); }}>
          <p>{t('hitung.penutup.hapus_isi', { daftar: konfirmasi.nama.join(', ') })}</p>
        </DialogKonfirmasi>
      )}
    </section>
  );
}
```

Catatan: `ubah(() => konfirmasi.kasusBaru)` memakai hasil yang dihitung dari `kasus` saat itu; karena dialog modal, `kasus` tidak berubah di antaranya.

Di `Wizard.tsx` langkah 4 babak 0:

```tsx
{kasus && langkah === 4 && babak === 0 && <>
  <p className="keterangan">{t('hitung.penutup.masukkan_yang_wafat', { mayit: namaSingkat(kasus, kasus.graf.idPewaris) })}</p>
  <LangkahAhliWaris graf={kasus.graf} idMayit={kasus.graf.idPewaris} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />
  <PertanyaanPenutup kasus={kasus} idMayit={kasus.graf.idPewaris} ubah={ubah} />
</>}
```

`LangkahKondisi.tsx`: hapus `TAMPILKAN_MUNASAKHAT`, `PanelMunasakhat`, import `LangkahAhliWaris`, dan `urutanWafat: []` di `pilihTidakAda`; `adaTerisi` hanya dari agama/pembunuhan; perbarui komentar pembuka (munasakhat pindah ke babak langkah 4).

`RingkasanSamping.tsx:15` dan `riwayat.ts:72`: pakai `perluPeriksaCerita(kasus)` sebagai penanda "ada kondisi khusus" (munasakhat, janin, hilang, bersamaan), ganti teks `hitung.ada_yang_wafat_sebelum_pembagian` dengan kunci baru `hitung.penutup.ada_kondisi_khusus` bila bukan munasakhat saja — sederhananya: `perluPeriksaCerita(kasus) ? t('hitung.penutup.ada_kondisi_khusus') : ''`.

CSS:
```css
.penutup-babak{display:flex;flex-direction:column;gap:10px;margin-top:8px}
.daftar-keadaan{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.baris-keadaan{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px;border:var(--border-w) solid var(--outline);border-radius:var(--radius-md);background:var(--surface-raised);color:var(--ink);font:500 15px var(--font-sans);cursor:pointer;text-align:start}
.baris-keadaan:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.lencana-keadaan{flex:none;border-radius:999px;padding:2px 10px;font:700 12px/1.5 var(--font-sans);background:var(--surface-sunken)}
.lencana-keadaan:not(.hidup){background:var(--sun);color:var(--on-fill)}
```

Diksi (`diksi-t7.json`):
```json
[
 {"kunci":"hitung.penutup.tanya","id":"Semua orang di atas masih hidup?"},
 {"kunci":"hitung.penutup.ya_semua_hidup","id":"Ya, masih hidup semua"},
 {"kunci":"hitung.penutup.ada_yang_wafat","id":"Ada yang sudah wafat atau hilang"},
 {"kunci":"hitung.penutup.ketuk_orangnya","id":"Ketuk orangnya untuk mengubah keadaannya."},
 {"kunci":"hitung.penutup.masukkan_yang_wafat","id":"Masukkan juga keluarga yang sudah wafat sesudah {mayit}. Nanti kita tanyakan."},
 {"kunci":"hitung.penutup.status_hidup","id":"masih hidup"},
 {"kunci":"hitung.penutup.status_wafat_sebelum","id":"wafat sebelum {mayit}"},
 {"kunci":"hitung.penutup.status_wafat_sesudah","id":"wafat sesudah {mayit}"},
 {"kunci":"hitung.penutup.status_wafat_sesudah_dibagi","id":"wafat sesudah harta dibagi"},
 {"kunci":"hitung.penutup.status_bersamaan","id":"wafat bersamaan"},
 {"kunci":"hitung.penutup.status_hilang","id":"hilang"},
 {"kunci":"hitung.penutup.status_dalam_kandungan","id":"belum lahir"},
 {"kunci":"hitung.penutup.status_khuntsa","id":"kelamin belum jelas"},
 {"kunci":"hitung.penutup.hapus_judul","id":"Keluarga yang sudah diisi ikut terhapus"},
 {"kunci":"hitung.penutup.hapus_isi","id":"Orang ini akan dihapus karena tidak lagi berhubungan dengan almarhum mana pun: {daftar}."},
 {"kunci":"hitung.penutup.ya_hapus","id":"Ya, hapus"},
 {"kunci":"hitung.penutup.ada_kondisi_khusus","id":"Ada kondisi khusus"}
]
```
(Kunci `status_wafat_sebelum`/`status_wafat_sesudah` dipakai dengan literal di `status()` supaya tes diksi menangkapnya; entri `TEKS_KEADAAN` yang tidak dipakai lewat `t(literal)` harus tetap tertangkap — pastikan setiap kunci di `TEKS_KEADAAN` juga muncul sebagai `t('…')` literal, misalnya ganti map dengan `switch` yang memanggil `t('hitung.penutup.status_hilang')` dst., karena tes diksi hanya membaca `t('literal')`.)

- [ ] **Step 4: Jalankan** — `pnpm --filter @waris/web test -- pertanyaanPenutup kondisi langkah diksi asap` → PASS.
- [ ] **Step 5: Commit** — `git commit -am "web: pertanyaan penutup babak pewaris; munasakhat keluar dari langkah 5"` (+ `git add` file baru).

---

### Task 8: `LangkahBabak` — babak 2..n

**Files:**
- Create: `apps/web/src/layar/LangkahBabak.tsx`
- Modify: `apps/web/src/layar/Wizard.tsx`, `apps/web/src/keadaanOrang.ts` (tambah `aturDikandung`), `apps/web/src/gaya/komponen.css`
- Test: `apps/web/src/__tests__/langkahBabak.test.tsx`, tambah kasus di `keadaanOrang.test.ts`

**Interfaces:**
- Consumes: `kerabatDari`, `babakAsal`, `daftarAlmarhum`, `namaSingkat` (Task 2); `PertanyaanPenutup` (Task 7); `LangkahAhliWaris`, `labelOrangChecklist`; `PohonDasar` (`hasil/Pohon.tsx`).
- Produces:
  ```tsx
  export function LangkahBabak(props: { kasus: Kasus; babak: number; ubah: (f: (k: Kasus) => Kasus) => void }): JSX.Element
  // keadaanOrang.ts
  export function aturDikandung(kasus: Kasus, idAnak: IdOrang, idMayit: IdOrang | null): Kasus   // null = sudah ada sebelum semua almarhum
  export function calonPasangan(kasus: Kasus, idMayit: IdOrang): IdOrang[]
  export function nikahkan(kasus: Kasus, idMayit: IdOrang, idPasangan: IdOrang): Kasus
  ```

Sebutan dari sisi X memakai `labelOrangChecklist(graf, X, id)` — label hubungan relatif ke `idMayit` yang sudah ada.

"Dari orang yang sudah ada" di v1 **hanya menampilkan** kerabat X yang berasal dari babak sebelumnya, dengan tanda terkunci (keterangan "hubungan keluarga dari babak sebelumnya"). Hubungan darah sudah tersirat di graf (Siti = ibu Budi karena `idIbu`), jadi tidak ada centang yang perlu disimpan. Hubungan buatan babak ini dihapus lewat tombol − di `LangkahAhliWaris`. Pasangan dari orang yang sudah ada (S11, spec 1.2 butir 4) dipilih lewat `<select>` "Pasangannya orang yang sudah ada?" yang memanggil `nikahkan`.

- [ ] **Step 1: Tes gagal**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { aturDikandung, terapkanKeadaan } from '../keadaanOrang';
import { LangkahBabak } from '../layar/LangkahBabak';

let terakhir: Kasus;
function Uji({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <LangkahBabak kasus={kasus} babak={1} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} />;
}
function kasusBudi() {
  let kasus = kasusBaru('L');
  for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_PR'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const namai = (id: string, nama: string) => { kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [id]: { ...kasus.graf.orang[id]!, nama } } } }; };
  const siti = Object.values(kasus.graf.orang).find(o => o.jenisKelamin === 'P' && !o.idAyah)!.id;
  const budi = Object.values(kasus.graf.orang).find(o => o.jenisKelamin === 'L' && o.idAyah)!.id;
  const rina = Object.values(kasus.graf.orang).find(o => o.jenisKelamin === 'P' && o.idAyah)!.id;
  namai('PEWARIS', 'Pak Ahmad'); namai(siti, 'Siti'); namai(budi, 'Budi'); namai(rina, 'Rina');
  return { kasus: terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: false }), budi, siti };
}

describe('LangkahBabak', () => {
  it('membuka dengan sudut pandang Budi dan menyebut Siti sebagai ibu', () => {
    render(<Uji awal={kasusBudi().kasus} />);
    expect(screen.getByText(/Sekarang kita lihat dari sisi Budi/)).toBeTruthy();
    expect(screen.getByText(/Siti/).closest('li')!.textContent).toMatch(/[Ii]bu/);
  });
  it('menambah istri Budi lewat daftar yang sama', () => {
    render(<Uji awal={kasusBudi().kasus} />);
    fireEvent.click(screen.getByRole('button', { name: /Tambah Istri/ }));
    expect(Object.values(terakhir.graf.pernikahan).some(n => n.idSuami === kasusBudi().budi && n.idIstri !== kasusBudi().siti)).toBe(true);
  });
});

it('aturDikandung: anak Budi dikandung sesudah Pak Ahmad wafat (S13)', () => {
  const { kasus, budi } = kasusBudi();
  const k = { ...kasus, graf: tambahAhliWaris(kasus.graf, budi, 'ANAK_LK') };
  const anak = Object.values(k.graf.orang).find(o => o.idAyah === budi)!.id;
  expect(aturDikandung(k, anak, 'PEWARIS').dikandungSetelahWafat).toEqual({ [anak]: 'PEWARIS' });
  expect(aturDikandung(aturDikandung(k, anak, 'PEWARIS'), anak, null).dikandungSetelahWafat).toBeUndefined();
});

it('S11: saudari wafat setelah dinikahi suami pewaris (contoh kitab)', () => {
  let kasus = kasusBaru('P');
  for (const kunci of ['SUAMI', 'SAUDARI_KANDUNG'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const suami = kasus.graf.pernikahan[0]!.idSuami;
  const saudari = Object.values(kasus.graf.orang).find(o => o.jenisKelamin === 'P' && o.id !== 'PEWARIS' && !o.penghubung)!.id;
  kasus = terapkanKeadaan(kasus, saudari, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
  expect(calonPasangan(kasus, saudari)).toContain(suami);
  const nikah = nikahkan(kasus, saudari, suami);
  expect(nikah.graf.pernikahan).toContainEqual({ idSuami: suami, idIstri: saudari, status: 'utuh' });
  expect(kerabatDari(nikah, saudari)).toContain(suami);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — FAIL.

- [ ] **Step 3: Implementasi**

`keadaanOrang.ts`:
```ts
/** [R13-1] Anak yang baru dikandung sesudah `idMayit` wafat bukan ahli warisnya; null = sudah ada sebelum semua almarhum. */
export function aturDikandung(kasus: Kasus, idAnak: IdOrang, idMayit: IdOrang | null): Kasus {
  const { [idAnak]: _lama, ...sisa } = kasus.dikandungSetelahWafat ?? {};
  const baru = idMayit ? { ...sisa, [idAnak]: idMayit } : sisa;
  return rapikanKeadaan({ ...kasus, dikandungSetelahWafat: baru });
}

/** Lawan jenis yang hidup saat `idMayit` wafat dan belum menjadi pasangannya (S11). Pewaris & almarhum sebelumnya dikecualikan. */
export function calonPasangan(kasus: Kasus, idMayit: IdOrang): IdOrang[] {
  const mayit = kasus.graf.orang[idMayit]!;
  const almarhum = new Set(daftarAlmarhum(kasus));
  const sudah = new Set(kasus.graf.pernikahan.flatMap(n => (n.idSuami === idMayit ? [n.idIstri] : n.idIstri === idMayit ? [n.idSuami] : [])));
  return Object.values(kasus.graf.orang)
    .filter(o => o.jenisKelamin !== mayit.jenisKelamin && !o.penghubung && o.statusHidup === 'hidup' && !almarhum.has(o.id) && !sudah.has(o.id))
    .map(o => o.id);
}

/** Pernikahan utuh yang terjadi sebelum `idMayit` wafat; status dinilai saat salah satunya wafat (memori mode lanjutan). */
export function nikahkan(kasus: Kasus, idMayit: IdOrang, idPasangan: IdOrang): Kasus {
  const [idSuami, idIstri] = kasus.graf.orang[idMayit]!.jenisKelamin === 'L' ? [idMayit, idPasangan] : [idPasangan, idMayit];
  return rapikanKeadaan({ ...kasus, graf: { ...kasus.graf, pernikahan: [...kasus.graf.pernikahan, { idSuami, idIstri, status: 'utuh' }] } });
}
```

`LangkahBabak.tsx`:
```tsx
// Babak 2..n (spec 1.2): satu almarhum lanjutan, dilihat dari sisinya. Menerima Kasus + nomor babak;
// menyerahkan perubahan graf (keluarga baru), keadaan orang (pertanyaan penutup), dan anak yang lahir belakangan.

import type { IdOrang } from '@waris/engine';
import { PohonDasar } from '../hasil/Pohon';
import type { Kasus } from '../kasus';
import { aturDikandung, babakAsal, calonPasangan, daftarAlmarhum, kerabatDari, namaSingkat, nikahkan } from '../keadaanOrang';
import { LangkahAhliWaris, labelOrangChecklist } from './LangkahAhliWaris';
import { PertanyaanPenutup } from './keadaan/PertanyaanPenutup';
import { t } from '../terjemah';

interface Props { kasus: Kasus; babak: number; ubah: (f: (k: Kasus) => Kasus) => void }

export function LangkahBabak({ kasus, babak, ubah }: Props) {
  const almarhum = daftarAlmarhum(kasus);
  const idMayit = almarhum[babak]!;
  const sebelumnya = almarhum.slice(0, babak);
  const nama = namaSingkat(kasus, idMayit);
  const namaSebelum = namaSingkat(kasus, almarhum[babak - 1]!);
  const pewaris = namaSingkat(kasus, kasus.graf.idPewaris);
  const kerabat = kerabatDari(kasus, idMayit);
  const dariBabakLalu = kerabat.filter(id => babakAsal(kasus, id) !== idMayit);
  // Anak X yang juga kerabat almarhum sebelumnya: tanyakan kapan dikandung [R13-1].
  const anakMayit = Object.values(kasus.graf.orang).filter(o => (o.idAyah === idMayit || o.idIbu === idMayit) && !o.penghubung).map(o => o.id);
  const sebutan = (id: IdOrang) => labelOrangChecklist(kasus.graf, idMayit, id);

  return (
    <div className="tumpuk">
      <div className="kartu tumpuk-rapat">
        <p>{t('hitung.babak.pembuka', { nama, sebelum: namaSebelum })}</p>
        <p><b>{t('hitung.babak.sudut_pandang', { nama })}</b></p>
        <p className="keterangan">{t('hitung.babak.harta_sendiri', { nama, pewaris })}</p>
      </div>
      <div className="pohon-kecil">
        <PohonDasar graf={{ ...kasus.graf, idPewaris: idMayit }} isiNode={id => ({
          kelas: id === idMayit ? 'pewaris' : sebelumnya.includes(id) ? 'penghubung' : 'ahli-waris',
          peran: id === idMayit ? t('hitung.babak.babak_ini') : sebutan(id),
          nama: kasus.graf.orang[id]!.nama ?? '',
        })} />
      </div>
      {dariBabakLalu.length > 0 && (
        <section className="kelompok-kerabat">
          <h3 className="judul-bagian-kecil">{t('hitung.babak.dari_yang_sudah_ada')}</h3>
          <ul className="daftar-keadaan">
            {dariBabakLalu.map(id => (
              <li key={id} className={sebelumnya.includes(id) ? 'baris-kerabat nonaktif' : 'baris-kerabat'}>
                <b>{namaSingkat(kasus, id)}</b>
                <span>{sebelumnya.includes(id)
                  ? t('hitung.babak.sudah_wafat_lebih_dulu', { nama })
                  : t('hitung.babak.bagi_nama', { nama, sebutan: sebutan(id) })}</span>
              </li>
            ))}
          </ul>
          <p className="keterangan">{t('hitung.babak.dari_babak_sebelumnya')}</p>
        </section>
      )}
      <LangkahAhliWaris graf={kasus.graf} idMayit={idMayit} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />
      {calonPasangan(kasus, idMayit).length > 0 && (
        <label className="isian isian-kecil">
          <span>{t('hitung.babak.pasangan_dari_yang_ada', { nama })}</span>
          <select value="" onChange={e => { if (e.target.value) ubah(k => nikahkan(k, idMayit, e.target.value)); }}>
            <option value="">{t('hitung.babak.pasangan_tidak')}</option>
            {calonPasangan(kasus, idMayit).map(id => <option key={id} value={id}>{namaSingkat(kasus, id)}</option>)}
          </select>
        </label>
      )}
      {anakMayit.length > 0 && (
        <section className="kelompok-kerabat">
          <h3 className="judul-bagian-kecil">{t('hitung.babak.anak_lahir_belakangan')}</h3>
          {anakMayit.map(idAnak => (
            <label key={idAnak} className="isian isian-kecil">
              <span>{t('hitung.babak.anak_sudah_ada_kapan', { anak: namaSingkat(kasus, idAnak) })}</span>
              <select value={kasus.dikandungSetelahWafat?.[idAnak] ?? ''} onChange={e => ubah(k => aturDikandung(k, idAnak, e.target.value || null))}>
                <option value="">{t('hitung.babak.sudah_ada_sebelum', { mayit: pewaris })}</option>
                {sebelumnya.map(id => <option key={id} value={id}>{t('hitung.babak.dikandung_sesudah', { mayit: namaSingkat(kasus, id) })}</option>)}
              </select>
            </label>
          ))}
        </section>
      )}
      <PertanyaanPenutup kasus={kasus} idMayit={idMayit} ubah={ubah} />
    </div>
  );
}
```

Wizard: `{kasus && langkah === 4 && babak > 0 && <LangkahBabak kasus={kasus} babak={babak} ubah={ubah} />}` dan `KerangkaLangkah subjudul={subjudul}`.

CSS: `.pohon-kecil{overflow-x:auto;max-height:320px}` `.baris-kerabat{display:flex;justify-content:space-between;gap:8px;padding:8px 12px;border:var(--border-w) solid var(--divider);border-radius:var(--radius-md)}` `.baris-kerabat.nonaktif{opacity:.55;border-style:dashed}` `.subjudul-babak{margin:0;font:800 13px var(--font-sans);display:inline-flex;align-self:flex-start;padding:3px 10px;border:var(--border-w) solid var(--outline);border-radius:999px;background:var(--sun);color:var(--on-fill)}`.

Diksi (`diksi-t8.json`):
```json
[
 {"kunci":"hitung.babak.pembuka","id":"{nama} wafat sesudah {sebelum}, sebelum hartanya dibagi. Jadi bagian {nama} diteruskan kepada keluarga {nama}."},
 {"kunci":"hitung.babak.sudut_pandang","id":"Sekarang kita lihat dari sisi {nama}."},
 {"kunci":"hitung.babak.harta_sendiri","id":"Yang dibagi hanya harta {pewaris}. Harta milik {nama} sendiri diurus terpisah."},
 {"kunci":"hitung.babak.babak_ini","id":"babak ini"},
 {"kunci":"hitung.babak.dari_yang_sudah_ada","id":"Dari orang yang sudah ada"},
 {"kunci":"hitung.babak.bagi_nama","id":"bagi {nama}: {sebutan}"},
 {"kunci":"hitung.babak.sudah_wafat_lebih_dulu","id":"sudah wafat lebih dulu dari {nama}"},
 {"kunci":"hitung.babak.dari_babak_sebelumnya","id":"Hubungan keluarga ini dari babak sebelumnya. Ubah di babak itu bila keliru."},
 {"kunci":"hitung.babak.anak_lahir_belakangan","id":"Kapan anak ini dikandung?"},
 {"kunci":"hitung.babak.anak_sudah_ada_kapan","id":"{anak} sudah ada (lahir atau dalam kandungan)…"},
 {"kunci":"hitung.babak.sudah_ada_sebelum","id":"sebelum {mayit} wafat"},
 {"kunci":"hitung.babak.dikandung_sesudah","id":"baru dikandung sesudah {mayit} wafat"},
 {"kunci":"hitung.babak.pasangan_dari_yang_ada","id":"Pasangan {nama} orang yang sudah ada di daftar?"},
 {"kunci":"hitung.babak.pasangan_tidak","id":"Tidak"}
]
```

- [ ] **Step 4: Jalankan** — `pnpm --filter @waris/web test -- langkahBabak keadaanOrang diksi` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "web: babak 2..n (sudut pandang almarhum, keluarga, anak lahir belakangan)"` (+ `git add`).

---

### Task 9: Pertanyaan hamil + `DialogJanin`

**Files:**
- Create: `apps/web/src/layar/keadaan/PertanyaanHamil.tsx`
- Modify: `apps/web/src/keadaanOrang.ts` (tambah `calonIbuJanin`, `tambahJanin`, `janinLahir`), `apps/web/src/layar/Wizard.tsx`, `apps/web/src/layar/LangkahBabak.tsx`
- Test: `apps/web/src/__tests__/janin.test.tsx`, tambah di `keadaanOrang.test.ts`

**Interfaces:**
- Consumes: Task 2, Task 6 (`LayarUrutan` tidak dipakai — lahir-lalu-wafat memakai `DialogKeadaan` pada bayi setelah lahir).
- Produces:
  ```ts
  export function calonIbuJanin(kasus: Kasus, idMayit: IdOrang): Array<{ idIbu: IdOrang; idAyahSah?: IdOrang }>
  export function tambahJanin(kasus: Kasus, idIbu: IdOrang, idAyah?: IdOrang): Kasus
  export type KelahiranJanin = { jenis: 'belum' } | { jenis: 'hidup'; anak: Array<'L' | 'P'> } | { jenis: 'lahirLaluWafat'; jenisKelamin: 'L' | 'P' } | { jenis: 'tanpaKehidupan' };
  export function janinLahir(kasus: Kasus, idJanin: IdOrang, kelahiran: KelahiranJanin): { kasus: Kasus; idBayiWafat?: IdOrang }
  export function PertanyaanHamil(props: { kasus: Kasus; idMayit: IdOrang; ubah: (f: (k: Kasus) => Kasus) => void }): JSX.Element
  ```

- [ ] **Step 1: Tes gagal**

```ts
// keadaanOrang.test.ts
import { calonIbuJanin, janinLahir, tambahJanin } from '../keadaanOrang';
it('janin: calon ibu hanya yang janinnya bisa mewarisi; lahir hidup/tanpa kehidupan', () => {
  const { kasus, siti } = keluargaAhmad();
  expect(calonIbuJanin(kasus, 'PEWARIS').map(c => c.idIbu)).toContain(siti);           // istri pewaris
  const k = tambahJanin(kasus, siti, 'PEWARIS');
  const janin = Object.values(k.graf.orang).find(o => o.statusHidup === 'dalamKandungan')!;
  expect(janin).toMatchObject({ idIbu: siti, idAyah: 'PEWARIS' });
  const kembar = janinLahir(k, janin.id, { jenis: 'hidup', anak: ['L', 'P'] }).kasus;
  expect(Object.values(kembar.graf.orang).filter(o => o.idIbu === siti && o.idAyah === 'PEWARIS' && o.statusHidup === 'hidup').length).toBeGreaterThanOrEqual(2);
  expect(janinLahir(k, janin.id, { jenis: 'tanpaKehidupan' }).kasus.graf.orang[janin.id]).toBeUndefined();   // [R13-2]
  const { kasus: w, idBayiWafat } = janinLahir(k, janin.id, { jenis: 'lahirLaluWafat', jenisKelamin: 'P' });
  expect(w.graf.orang[idBayiWafat!]).toMatchObject({ statusHidup: 'hidup', jenisKelamin: 'P' });
});
```

```tsx
// janin.test.tsx
it('Ada yang hamil → pilih ibu → dari suami → belum lahir → node janin', () => {
  /* Uji pembungkus seperti Task 7 dengan <PertanyaanHamil kasus idMayit="PEWARIS" ubah/> pada keluargaAhmad() */
  fireEvent.click(screen.getByRole('radio', { name: /^Ada$/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Istri/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getAllByRole('radio')[0]!);   // suaminya di data
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Belum lahir/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  expect(Object.values(terakhir.graf.orang).some(o => o.statusHidup === 'dalamKandungan')).toBe(true);
  expect(screen.getByRole('radio', { name: /^Ada$/ }).getAttribute('aria-checked')).toBe('true');
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — FAIL.

- [ ] **Step 3: Implementasi**

`keadaanOrang.ts`:
```ts
import { tambahOrangBaru } from './checklist';   // ekspor helper tambahOrang yang sudah ada di checklist.ts sebagai tambahOrangBaru

/** [R13-1] 13a.1: perempuan yang janinnya — dari suaminya di data, atau dari suami lain — punya peran ahli waris bagi `idMayit`. */
export function calonIbuJanin(kasus: Kasus, idMayit: IdOrang): Array<{ idIbu: IdOrang; idAyahSah?: IdOrang }> {
  const { graf } = kasus;
  const perempuan = Object.values(graf.orang).filter(o => o.jenisKelamin === 'P' && !o.penghubung && o.statusHidup === 'hidup' && o.id !== idMayit);
  const mewarisi = (idIbu: IdOrang, idAyah?: IdOrang) => {
    const uji = tambahOrangBaru(graf, { jenisKelamin: 'L', idIbu, ...(idAyah ? { idAyah } : {}) });
    const kunci = turunkanPeran({ ...uji.graf, idPewaris: idMayit }, KONFIGURASI_BAWAAN).daftarPeran[uji.idOrang]?.kunci;
    return !!kunci && kunci !== 'BUKAN_AHLI_WARIS' && kunci !== 'DZAWIL_ARHAM';
  };
  return perempuan.flatMap(ibu => {
    const suami = graf.pernikahan.find(n => n.idIstri === ibu.id && n.status !== 'talakBain')?.idSuami;
    if (suami && mewarisi(ibu.id, suami)) return [{ idIbu: ibu.id, idAyahSah: suami }];
    return mewarisi(ibu.id) ? [{ idIbu: ibu.id }] : [];
  });
}

/** Satu node mewakili seluruh janin (types.ts); jenis kelamin hanya pengisi, taqdir menentukan. [R13-3] */
export const tambahJanin = (kasus: Kasus, idIbu: IdOrang, idAyah?: IdOrang): Kasus => {
  const { graf } = tambahOrangBaru(kasus.graf, { jenisKelamin: 'L', idIbu, ...(idAyah ? { idAyah } : {}), statusHidup: 'dalamKandungan' });
  return rapikanKeadaan({ ...kasus, graf });
};

export function janinLahir(kasus: Kasus, idJanin: IdOrang, kelahiran: KelahiranJanin): { kasus: Kasus; idBayiWafat?: IdOrang } {
  const janin = kasus.graf.orang[idJanin]!;
  const induk = { ...(janin.idAyah ? { idAyah: janin.idAyah } : {}), ...(janin.idIbu ? { idIbu: janin.idIbu } : {}) };
  const tanpaJanin = { ...kasus, graf: hapusAhliWaris(kasus.graf, idJanin) };
  switch (kelahiran.jenis) {
    case 'belum': return { kasus };
    case 'tanpaKehidupan': return { kasus: rapikanKeadaan(tanpaJanin) };   // [R13-2] syarat istihlal tidak terpenuhi
    case 'hidup': {
      const graf = kelahiran.anak.reduce((g, jenisKelamin) => tambahOrangBaru(g, { jenisKelamin, ...induk }).graf, tanpaJanin.graf);
      return { kasus: rapikanKeadaan({ ...tanpaJanin, graf }) };
    }
    case 'lahirLaluWafat': {
      const bayi = tambahOrangBaru(tanpaJanin.graf, { jenisKelamin: kelahiran.jenisKelamin, ...induk });
      return { kasus: rapikanKeadaan({ ...tanpaJanin, graf: bayi.graf }), idBayiWafat: bayi.idOrang };
    }
  }
}
```

Di `checklist.ts`: `export const tambahOrangBaru = tambahOrang;` (fungsi `tambahOrang` sudah ada, tidak diubah).

`PertanyaanHamil.tsx` (inti; pola layar sama dengan `DialogKeadaan`):

```tsx
// Pertanyaan hamil di akhir tiap babak (spec 1.1, 1.3): bawaan "Tidak ada". "Ada" → dialog janin
// siapa → dari siapa → sudah lahir? Janin tersimpan sebagai satu node dalamKandungan per ibu [R13-3].

type LayarJanin = { jenis: 'siapa' } | { jenis: 'dariSiapa'; idIbu: IdOrang }
  | { jenis: 'lahir'; idJanin: IdOrang } | { jenis: 'jenisKelamin'; idJanin: IdOrang; wafat: boolean; anak: Array<'L' | 'P'> };

export function PertanyaanHamil({ kasus, idMayit, ubah }: Props) {
  const calon = calonIbuJanin(kasus, idMayit);
  const janinBabak = Object.values(kasus.graf.orang)
    .filter(o => o.statusHidup === 'dalamKandungan' && calon.some(c => c.idIbu === o.idIbu)).map(o => o.id);
  const [ada, setAda] = useState(janinBabak.length > 0);
  const [layar, setLayar] = useState<LayarJanin | null>(null);
  const [pilihan, setPilihan] = useState<string | null>(null);
  const [bayiWafat, setBayiWafat] = useState<IdOrang | null>(null);
  const mayit = namaSingkat(kasus, idMayit);

  const lanjut = () => {
    if (!layar || pilihan === null && layar.jenis !== 'jenisKelamin') return;
    switch (layar.jenis) {
      case 'siapa': return setLayar({ jenis: 'dariSiapa', idIbu: pilihan! });
      case 'dariSiapa': {
        const idAyah = pilihan === 'lain' ? undefined : pilihan!;
        let idJanin = '';
        ubah(k => { const baru = tambahJanin(k, layar.idIbu, idAyah); idJanin = Object.keys(baru.graf.orang).find(id => !k.graf.orang[id])!; return baru; });
        return setLayar({ jenis: 'lahir', idJanin });
      }
      case 'lahir':
        if (pilihan === 'belum') { setLayar(null); return; }
        if (pilihan === 'tanpaKehidupan') { ubah(k => janinLahir(k, layar.idJanin, { jenis: 'tanpaKehidupan' }).kasus); setLayar(null); return; }
        return setLayar({ jenis: 'jenisKelamin', idJanin: layar.idJanin, wafat: pilihan === 'lahirLaluWafat', anak: [] });
      case 'jenisKelamin': {
        const anak = pilihan ? [...layar.anak, pilihan as 'L' | 'P'] : layar.anak;
        if (anak.length === 0) return;
        if (layar.wafat) {
          let id: IdOrang | undefined;
          ubah(k => { const hasil = janinLahir(k, layar.idJanin, { jenis: 'lahirLaluWafat', jenisKelamin: anak[0]! }); id = hasil.idBayiWafat; return hasil.kasus; });
          setLayar(null); if (id) setBayiWafat(id); return;
        }
        ubah(k => janinLahir(k, layar.idJanin, { jenis: 'hidup', anak }).kasus);
        return setLayar(null);
      }
    }
  };
  /* render: radiogroup Tidak ada/Ada (Tidak ada + janinBabak → DialogKonfirmasi hitung.janin.hapus_*, lalu hapusAhliWaris tiap janin);
     baris tiap janin: t('hitung.janin.baris', { ibu }) + tautan Ubah (setLayar({ jenis: 'lahir', idJanin })) dan Hapus;
     tautan "Tambah" (setLayar({ jenis: 'siapa' })) saat ada = true;
     dialog: kerangka sama dengan DialogKeadaan (role="dialog", h2 pertanyaan, opsi-dialog, tautan Kembali/Batal, Tombol Lanjut);
       siapa: opsi dari `calon` (namaSingkat idIbu), keterangan t('hitung.janin.siapa_ket', { mayit });
       dariSiapa: opsi [idAyahSah → namaSingkat] (bila ada) + ['lain', t('hitung.janin.suami_lain')];
       lahir: belum / lahirHidup / lahirLaluWafat / tanpaKehidupan dengan keterangan dari diksi;
       jenisKelamin: L / P + tautan t('hitung.janin.tambah_kembar') yang memindahkan pilihan ke layar.anak dan mengosongkan pilihan (hanya bila !wafat);
     bayiWafat: <DialogKeadaan kasus idOrang={bayiWafat} …/> supaya bayi masuk urutan wafat lewat jalur yang sama. */
}
```

Radio "Tidak ada / Ada" (bawaan dari ada-tidaknya janin yang ibunya calon di babak ini). "Ada" membuka `DialogJanin` internal (pola layar sama dengan `DialogKeadaan`: `siapa` → `dariSiapa` → `lahir` → (`jenisKelamin` untuk hidup/lahirLaluWafat, dengan pilihan "Kembar?" berupa tautan menambah satu bayi lagi)). Setelah `lahirLaluWafat`, buka `DialogKeadaan` untuk `idBayiWafat` dengan layar awal langsung ke "waktu" — sederhananya panggil `DialogKeadaan` biasa; pengguna memilih "Sudah wafat → Sesudah → Belum dibagi" (tidak ada jalan pintas di v1). Janin yang sudah ada tampil sebagai baris "Janin [ibu] · belum lahir" dengan tautan **Ubah** (membuka layar `lahir`) dan **Hapus**. "Tidak ada" dengan janin terisi → hapus janin babak ini lewat `DialogKonfirmasi`.

Pasang `<PertanyaanHamil kasus idMayit ubah />` di akhir babak 1 (Wizard) dan di `LangkahBabak` setelah `PertanyaanPenutup`.

Diksi (`diksi-t9.json`):
```json
[
 {"kunci":"hitung.janin.tanya","id":"Waktu {mayit} wafat, apakah ada yang sedang hamil di keluarga ini?"},
 {"kunci":"hitung.janin.tanya_ket","id":"Janin bisa ikut mendapat warisan."},
 {"kunci":"hitung.janin.tidak_ada","id":"Tidak ada"},
 {"kunci":"hitung.janin.ada","id":"Ada"},
 {"kunci":"hitung.janin.siapa","id":"Siapa yang sedang hamil?"},
 {"kunci":"hitung.janin.siapa_ket","id":"Hanya orang yang janinnya bisa mewarisi {mayit}."},
 {"kunci":"hitung.janin.dari_siapa","id":"Janin {ibu} dari siapa?"},
 {"kunci":"hitung.janin.suami_lain","id":"Suami lain"},
 {"kunci":"hitung.janin.sudah_lahir","id":"Bayinya sudah lahir?"},
 {"kunci":"hitung.janin.belum_lahir","id":"Belum lahir"},
 {"kunci":"hitung.janin.lahir_hidup","id":"Sudah lahir, masih hidup"},
 {"kunci":"hitung.janin.lahir_lalu_wafat","id":"Sudah lahir, lalu wafat"},
 {"kunci":"hitung.janin.lahir_lalu_wafat_ket","id":"Bayi ikut mewarisi, lalu bagiannya diteruskan"},
 {"kunci":"hitung.janin.tanpa_kehidupan","id":"Lahir tanpa tanda kehidupan"},
 {"kunci":"hitung.janin.tanpa_kehidupan_ket","id":"Tidak ikut mewarisi"},
 {"kunci":"hitung.janin.jenis_kelamin","id":"Bayinya laki-laki atau perempuan?"},
 {"kunci":"hitung.janin.laki_laki","id":"Laki-laki"},
 {"kunci":"hitung.janin.perempuan","id":"Perempuan"},
 {"kunci":"hitung.janin.tambah_kembar","id":"Kembar? Tambah satu bayi lagi"},
 {"kunci":"hitung.janin.baris","id":"Janin {ibu} · belum lahir"},
 {"kunci":"hitung.janin.hapus_judul","id":"Hapus data janin?"},
 {"kunci":"hitung.janin.hapus_isi","id":"Data janin di babak ini akan dihapus."}
]
```

- [ ] **Step 4: Jalankan** — `pnpm --filter @waris/web test -- janin keadaanOrang diksi` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "web: pertanyaan hamil dan dialog janin per babak"` (+ `git add`).

---

### Task 10: Hasil kasus khusus (taqdir, gharqa, menunggu) + batas kemungkinan

**Files:**
- Create: `apps/web/src/hasil/HasilKasusKhusus.tsx`
- Modify: `apps/web/src/layar/Hasil.tsx`, `apps/web/src/gaya/komponen.css`
- Test: `apps/web/src/__tests__/hasilKasusKhusus.test.tsx`

**Interfaces:**
- Consumes: `jalankan`, `HasilTampil` (Task 4); `daftarBabDari`, `Baris` (`layar/Penjelasan.tsx`); `Lipat`; `formatRupiah`; `pecahanTeks`, `persenTeks` (`hasil/ringkasan.ts`); `namaSingkat` (Task 2); `simpanKasus` (`tersimpan.ts`).
- Produces: `export function HasilKasusKhusus(props: { kasus: Kasus; tampil: Extract<HasilTampil, { jenis: 'taqdir' | 'gharqa' | 'menunggu' }>; kirim: (a: Aksi) => void; idSesi: string }): JSX.Element`

- [ ] **Step 1: Tes gagal**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { jalankan } from '../jalankan';
import { terapkanKeadaan } from '../keadaanOrang';
import { Hasil } from '../layar/Hasil';

function dengan(ubah: (k: Kasus, anak: string) => Kasus): Kasus {
  let kasus: Kasus = { ...kasusBaru('L'), tirkah: { kotor: 1_200_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  return ubah(kasus, Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id);
}

describe('hasil kasus khusus', () => {
  it('taqdir (hilang): pembagian sekarang + amplop titipan + kalau terbukti', () => {
    const kasus = dengan((k, anak) => terapkanKeadaan(k, anak, { jenis: 'hilang' }));
    render(<Hasil kasus={kasus} idSesi="s" tujuan="hitung" kirim={() => {}} />);
    expect(screen.getByText(/Amplop titipan/)).toBeTruthy();
    expect(screen.getByText(/menunggu kabar/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Kalau terbukti/ }));
    expect(screen.getAllByText(/masih hidup|sudah wafat/).length).toBeGreaterThan(0);
  });
  it('gharqa: dua kartu harta dan kalimat tidak saling mewarisi', () => {
    const kasus = dengan((k, anak) => terapkanKeadaan(k, anak, { jenis: 'bersamaan', keadaan: 'serentak', tirkah: { kotor: 300_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } }));
    render(<Hasil kasus={kasus} idSesi="s" tujuan="hitung" kirim={() => {}} />);
    expect(screen.getByText(/tidak saling mewarisi/)).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: /^Harta / }).length).toBe(2);
  });
  it('menunggu: kartu + tautan hitung sekarang mengubah pilihanJanin', () => {
    const kirim = vi.fn();
    const kasus = dengan(k => ({ ...k, pilihanJanin: 'tunggu', graf: { ...k.graf, orang: { ...k.graf.orang,
      J: { id: 'J', jenisKelamin: 'L', idAyah: 'PEWARIS', statusHidup: 'dalamKandungan', agama: 'islam' } } } }));
    expect(jalankan(kasus).jenis).toBe('menunggu');
    render(<Hasil kasus={kasus} idSesi="s" tujuan="hitung" kirim={kirim} />);
    fireEvent.click(screen.getByRole('button', { name: /Hitung sekarang saja/ }));
    const aksi = kirim.mock.calls[0]![0];
    expect(aksi.jenis).toBe('UBAH_KASUS');
    expect(aksi.ubah(kasus).pilihanJanin).toBe('hitungSekarang');
  });
  it('PERLU_INPUT batas kemungkinan: daftar orang, bukan pesan teknis', () => {
    // 9 orang hilang → 2⁹ = 512 > 256
    const kasus = dengan(k => {
      let hasil = k;
      for (let i = 0; i < 9; i++) hasil = { ...hasil, graf: tambahAhliWaris(hasil.graf, 'PEWARIS', 'ANAK_PR') };
      for (const o of Object.values(hasil.graf.orang).filter(o => o.idAyah === 'PEWARIS')) hasil = terapkanKeadaan(hasil, o.id, { jenis: 'hilang' });
      return hasil;
    });
    render(<Hasil kasus={kasus} idSesi="s" tujuan="hitung" kirim={() => {}} />);
    expect(screen.getByText(/Terlalu banyak yang belum pasti/)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Pastikan/ }).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — FAIL.

- [ ] **Step 3: Implementasi**

`Hasil.tsx`: setelah `const tampil = useMemo(...)`:
```tsx
if (tampil.jenis === 'taqdir' || tampil.jenis === 'gharqa' || tampil.jenis === 'menunggu') {
  return <HasilKasusKhusus kasus={kasus} tampil={tampil} kirim={kirim} idSesi={idSesi} />;
}
```
(hapus penanda sementara dari Task 4).

`HasilKasusKhusus.tsx` inti:

```tsx
// Hasil versi minimal bab 13 (spec 3): taqdir (janin/hilang/khuntsa), gharqa, dan menunggu kelahiran.
// Semua angka dari engine; pecahan/persen hanya penyajian (ringkasan.ts). Tanpa tabel faraidh per dunia (di luar cakupan).

export function HasilKasusKhusus({ kasus, tampil, kirim, idSesi }: Props) {
  const ubahData = <Tombol varian="secondary" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 4 })}>{t('hitung.ubah_data')}</Tombol>;
  if (tampil.jenis === 'menunggu') return <Menunggu kasus={kasus} kirim={kirim} idSesi={idSesi} ubahData={ubahData} />;
  const hasil = tampil.hasil;
  if (hasil.status === 'PERLU_INPUT') return <PerluInput kasus={kasus} pertanyaan={hasil.pertanyaan} kirim={kirim} />;
  if (hasil.status === 'TIDAK_DIDUKUNG' || hasil.status === 'MAUQUF_SEMUA') return <Pesan judul={t('hitung.kasus_ini_belum_bisa_dihitung_di')} isi={hasil.alasan} ubahData={ubahData} />;
  const daftarBab = daftarBabDari(kasus, tampil);
  return (
    <main className="halaman tumpuk hasil-khusus">
      {tampil.jenis === 'taqdir' && hasil.status === 'OK' && <Taqdir kasus={kasus} hasil={hasil} />}
      {tampil.jenis === 'gharqa' && <Gharqa kasus={kasus} hasil={hasil as Extract<HasilGharqa, { status: 'OK' | 'MAUQUF' }>} />}
      {daftarBab.length > 0 && (
        <Lipat judul={t('hasil.titipan.langkah_perhitungan')}>
          {daftarBab.map(({ judulBagian, bab }, i) => (
            <section key={i}>{judulBagian && <h3>{judulBagian}</h3>}<h4>{bab.judul}</h4>
              <ul>{bab.daftarBaris.map((baris, j) => <li key={j}><Baris baris={baris} /></li>)}</ul></section>
          ))}
        </Lipat>
      )}
      {ubahData}
    </main>
  );
}
```

Periksa bentuk `BabPenjelasan` (`packages/explain/src/narasi.ts`) untuk nama field judul/baris sebelum menulis — pakai nama yang ada, jangan menebak.

`Taqdir`:
- **Pembagian sekarang**: `Object.entries(hasil.nominal)` diurutkan menurun, tiap baris `namaSingkat(kasus, id)` + `formatRupiah`. Orang ahli waris dengan `diberikan[id] ?? 0n === 0n` ditulis di bawah dengan alasan dari jejak: cari `LangkahJejak` `jenis === 'TAQDIR_PEMBERIAN' && idOrang === id`; `alasan === 'ditahan'` → statusHidup `dalamKandungan` ? `t('hasil.titipan.menunggu_bayi')` : `mafqud` ? `t('hasil.titipan.menunggu_kabar')` : `t('hasil.titipan.menunggu_kepastian')`; `alasan === 'kelasD'` → `t('hasil.titipan.menunggu_bayi')` (mitra ashabah janin [R13-15]).
- **KartuTitipan**: `<section className="kartu kartu-titipan"><h2><IkonAmplop/>{t('hasil.titipan.judul')} <small>{t('hasil.titipan.istilah')}</small></h2><p className="angka-besar">{formatRupiah(hasil.nominalMauquf)}</p><p>{t('hasil.titipan.alasan')}</p><p className="keterangan">{t('hasil.titipan.setelah_jelas')}</p></section>` — tampil hanya bila `hasil.mauquf > 0n`.
- **Kalau terbukti…**: `<Lipat judul={t('hasil.titipan.kalau_terbukti')}>`; per `dunia` judul `Object.entries(dunia.taqdir).map(([id, nilai]) => `${namaSingkat(kasus,id)}: ${teksTaqdir(nilai)}`).join(' · ')` dengan `teksTaqdir` → `t('hasil.titipan.taqdir_mati' | …)`; isi `Object.entries(dunia.saham)` tanpa kunci `sisaKeluar:` → `namaSingkat` + `pecahanTeks(saham, hasil.jamiah, 'sederhana')` + `persenTeks(saham, hasil.jamiah)`. Cek tanda tangan `pecahanTeks` di `ringkasan.ts:63` (parameter ketiga = `BentukPecahan`).
- **Pohon**: `PohonDasar` dengan `isiNode` memberi peran `t('hitung.penutup.status_dalam_kandungan')` / `t('hitung.penutup.status_hilang')` untuk node belum pasti.

`Gharqa`:
- Kalimat `t('hasil.titipan.gharqa_pembuka')`.
- `status === 'OK'`: `hasil.harta.map(harta => <section className="kartu"><h2>{t('hasil.titipan.harta_nama', { nama: namaSingkat(kasus, harta.mayit) })}</h2>{daftar nominal harta.nominal tanpa kunci sisaKeluar}{harta.mauquf > 0n && <KartuTitipan nominal={harta.nominalMauquf} />}{harta.mauqufSemua && <p>{harta.mauqufSemua.alasan}</p>}</section>)`.
- `status === 'MAUQUF'`: kartu `t('hasil.titipan.gharqa_ditahan')` + `<Lipat judul={t('hasil.titipan.skenario')}>` tiap `skenario` dengan judul `t('hasil.titipan.kalau_duluan', { nama: namaSingkat(kasus, skenario.urutan[0]!) })` dan isi kartu harta seperti di atas.

`Menunggu`: `useEffect(() => simpanKasus(idSesi, kasus), [idSesi, kasus])`; kartu `t('hasil.titipan.menunggu_judul')` + `t('hasil.titipan.menunggu_isi')` + `<button className="tautan" onClick={() => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, pilihanJanin: 'hitungSekarang' }) })}>{t('hasil.titipan.hitung_sekarang_saja')}</button>`.

`PerluInput`: bila ada `pertanyaan.some(p => /Terlalu banyak kemungkinan/.test(p.alasan))` — lebih kokoh: cek `pertanyaan.length > 1 && pertanyaan.every(p => p.isian === 'statusHidup')` — judul `t('hasil.titipan.terlalu_banyak')`, isi `t('hasil.titipan.terlalu_banyak_ket')`, daftar `namaSingkat` + tautan **Pastikan** → `kirim({ jenis: 'KE_LANGKAH', langkah: 4 })`. Selain itu daftar `alasan` seperti layar lama.

CSS:
```css
.kartu-titipan{border-style:dashed}
.kartu-titipan h2{display:flex;align-items:center;gap:8px;font:700 20px var(--font-display);margin:0}
.kartu-titipan small{font:500 12px var(--font-sans);color:var(--ink-muted)}
.hasil-khusus{max-width:760px}
```

Diksi (`diksi-t10.json`):
```json
[
 {"kunci":"hasil.titipan.judul","id":"Amplop titipan"},
 {"kunci":"hasil.titipan.istilah","id":"mauquf"},
 {"kunci":"hasil.titipan.alasan","id":"Bagian ini disimpan dulu sampai keadaannya jelas."},
 {"kunci":"hasil.titipan.setelah_jelas","id":"Setelah bayi lahir atau ada kabar, buka kasus ini lagi dan ubah jawabannya."},
 {"kunci":"hasil.titipan.pembagian_sekarang","id":"Pembagian sekarang"},
 {"kunci":"hasil.titipan.menunggu_bayi","id":"menunggu bayi lahir"},
 {"kunci":"hasil.titipan.menunggu_kabar","id":"menunggu kabar"},
 {"kunci":"hasil.titipan.menunggu_kepastian","id":"menunggu kepastian"},
 {"kunci":"hasil.titipan.kalau_terbukti","id":"Kalau terbukti…"},
 {"kunci":"hasil.titipan.taqdir_mati","id":"sudah wafat"},
 {"kunci":"hasil.titipan.taqdir_hidup","id":"masih hidup"},
 {"kunci":"hasil.titipan.taqdir_lk","id":"1 laki-laki"},
 {"kunci":"hasil.titipan.taqdir_pr","id":"1 perempuan"},
 {"kunci":"hasil.titipan.taqdir_dua_lk","id":"2 laki-laki"},
 {"kunci":"hasil.titipan.taqdir_dua_pr","id":"2 perempuan"},
 {"kunci":"hasil.titipan.taqdir_lk_pr","id":"1 laki-laki dan 1 perempuan"},
 {"kunci":"hasil.titipan.langkah_perhitungan","id":"Pelajari langkah perhitungan"},
 {"kunci":"hasil.titipan.gharqa_pembuka","id":"Mereka tidak saling mewarisi. Harta masing-masing dibagi kepada keluarganya yang masih hidup."},
 {"kunci":"hasil.titipan.harta_nama","id":"Harta {nama}"},
 {"kunci":"hasil.titipan.gharqa_ditahan","id":"Harta ditahan sampai ada yang ingat, atau keluarga bersepakat."},
 {"kunci":"hasil.titipan.skenario","id":"Lihat tiap kemungkinan"},
 {"kunci":"hasil.titipan.kalau_duluan","id":"Kalau {nama} wafat lebih dulu"},
 {"kunci":"hasil.titipan.menunggu_judul","id":"Kasus disimpan"},
 {"kunci":"hasil.titipan.menunggu_isi","id":"Hitung lagi setelah bayi lahir. Pembagian cukup sekali dan tidak ada yang ditahan."},
 {"kunci":"hasil.titipan.hitung_sekarang_saja","id":"Hitung sekarang saja"},
 {"kunci":"hasil.titipan.terlalu_banyak","id":"Terlalu banyak yang belum pasti"},
 {"kunci":"hasil.titipan.terlalu_banyak_ket","id":"Kemungkinannya terlalu banyak untuk dihitung. Coba pastikan keadaan sebagian orang dulu."},
 {"kunci":"hasil.titipan.pastikan","id":"Pastikan"}
]
```
(`khuntsa` di "Kalau terbukti": nilai `lk`/`pr` sudah tercakup `taqdir_lk`/`taqdir_pr`; untuk khuntsa tampil "1 laki-laki" terasa janggal — `teksTaqdir(nilai, jenisSumber)` memakai `t('hasil.titipan.taqdir_khuntsa_lk')`/`_pr` = "laki-laki"/"perempuan" bila orangnya berfield `khuntsa`; tambahkan dua kunci itu.)

- [ ] **Step 4: Jalankan** — `pnpm --filter @waris/web test -- hasilKasusKhusus hasil diksi && pnpm --filter @waris/web exec tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "web: hasil minimal taqdir/gharqa/menunggu + layar batas kemungkinan"` (+ `git add`).

---

### Task 11: Periksa cerita + layar pilihan menunggu

**Files:**
- Create: `apps/web/src/layar/PeriksaCerita.tsx`
- Modify: `apps/web/src/Aplikasi.tsx`
- Test: `apps/web/src/__tests__/periksaCerita.test.tsx`

**Interfaces:**
- Consumes: `daftarAlmarhum`, `kerabatDari`, `babakAsal`, `keadaanOrang`, `namaSingkat` (Task 2); `labelOrangChecklist`; `Aksi` (`keadaan.ts`).
- Produces: `export function PeriksaCerita(props: { kasus: Kasus; kirim: (a: Aksi) => void }): JSX.Element`; `export function kalimatBabak(kasus: Kasus, idMayit: IdOrang): string` (murni, dites).

- [ ] **Step 1: Tes gagal**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { kalimatBabak, PeriksaCerita } from '../layar/PeriksaCerita';
/* kasusBudi() seperti Task 8, dengan Budi punya istri Dewi */

it('kalimat babak memakai nama dan sebutan dari sisi almarhum', () => {
  const { kasus, budi } = kasusBudiDenganDewi();
  expect(kalimatBabak(kasus, 'PEWARIS')).toMatch(/Pak Ahmad wafat\. Ia meninggalkan .*Siti.*Budi.*Rina/);
  expect(kalimatBabak(kasus, budi)).toMatch(/Lalu Budi wafat\. Ia meninggalkan .*ibu \(Siti\).*istri \(Dewi\)/);
});

it('tautan ubah membawa ke babak itu; tanpa janin langsung ke hasil', () => {
  const kirim = vi.fn();
  const { kasus } = kasusBudiDenganDewi();
  render(<PeriksaCerita kasus={kasus} kirim={kirim} />);
  fireEvent.click(screen.getAllByRole('button', { name: /ubah/ })[1]!);
  expect(kirim).toHaveBeenCalledWith({ jenis: 'KE_LANGKAH', langkah: 4 });
  expect(kirim).toHaveBeenCalledWith({ jenis: 'KE_BABAK', babak: 1 });
  fireEvent.click(screen.getByRole('button', { name: /Lihat hasil/ }));
  expect(kirim).toHaveBeenCalledWith({ jenis: 'KE_LAYAR', layar: 'hasil' });
});

it('ada janin belum lahir: layar pilihan menunggu sebelum hasil', () => {
  const kirim = vi.fn();
  const { kasus } = kasusBudiDenganDewi();
  const denganJanin = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang,
    J: { id: 'J', jenisKelamin: 'L' as const, idAyah: 'PEWARIS', statusHidup: 'dalamKandungan' as const, agama: 'islam' as const } } } };
  render(<PeriksaCerita kasus={denganJanin} kirim={kirim} />);
  fireEvent.click(screen.getByRole('button', { name: /Lihat hasil/ }));
  expect(screen.getByText(/Mau menunggu dulu/)).toBeTruthy();
  fireEvent.click(screen.getByRole('radio', { name: /Tunggu lahir dulu/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  const ubah = kirim.mock.calls.find(([a]) => a.jenis === 'UBAH_KASUS')![0].ubah;
  expect(ubah(denganJanin).pilihanJanin).toBe('tunggu');
  expect(kirim).toHaveBeenCalledWith({ jenis: 'KE_LAYAR', layar: 'hasil' });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — FAIL.

- [ ] **Step 3: Implementasi**

```tsx
// Periksa cerita (spec 1.5): ringkasan kalimat per babak sebelum hasil, dengan tautan "ubah" ke babaknya.
// Bila ada janin belum lahir, layar pilihan menunggu (spec 1.6, [R13-17]) muncul sebelum hasil.

export function kalimatBabak(kasus: Kasus, idMayit: IdOrang): string {
  const almarhum = daftarAlmarhum(kasus);
  const indeks = almarhum.indexOf(idMayit);
  const sebelumnya = new Set(almarhum.slice(0, indeks));
  const ditinggalkan = kerabatDari(kasus, idMayit)
    .filter(id => !sebelumnya.has(id) && kasus.graf.orang[id]!.statusHidup !== 'wafat')
    .map(id => {
      const sebutan = labelOrangChecklist(kasus.graf, idMayit, id).replace(/\s*\(.*\)$/, '').toLowerCase();
      const nama = kasus.graf.orang[id]!.nama;
      return nama ? `${sebutan} (${nama})` : sebutan;
    });
  const kunci = indeks === 0 ? 'hitung.cerita.babak_pertama' : 'hitung.cerita.babak_lanjut';
  return indeks === 0
    ? t('hitung.cerita.babak_pertama', { nama: namaSingkat(kasus, idMayit), daftar: gabungDaftar(ditinggalkan) })
    : t('hitung.cerita.babak_lanjut', { nama: namaSingkat(kasus, idMayit), daftar: gabungDaftar(ditinggalkan) });
}

const gabungDaftar = (daftar: string[]): string =>
  daftar.length <= 1 ? daftar.join('') : `${daftar.slice(0, -1).join(', ')} ${t('hitung.cerita.dan')} ${daftar.at(-1)}`;
```
(Hapus variabel `kunci` yang tidak terpakai — contoh di atas menegaskan kedua literal `t(...)` supaya tes diksi menemukannya.)

Komponen: tahap `'cerita' | 'menunggu'`. Tahap cerita: judul `t('hitung.cerita.judul')`, satu `<p>` per almarhum dengan label `t('hitung.cerita.label_babak', { nomor })`, kalimat, dan tombol-tautan `t('hitung.cerita.ubah')` → `kirim({ jenis: 'KE_LANGKAH', langkah: 4 }); kirim({ jenis: 'KE_BABAK', babak: i })`. Tambahan baris untuk `wafatSesudahDibagi` (`t('hitung.cerita.sesudah_dibagi', { nama })`), gharqa (`t('hitung.cerita.bersamaan', { daftar })`), janin (`t('hitung.janin.baris', { ibu })`), hilang (`t('hitung.cerita.hilang', { nama })`). Penutup: `t('hitung.cerita.harta_dibagi', { pewaris, jumlah: formatRupiah(kasus.tirkah.kotor) })` + bila ada almarhum lanjutan `t('hitung.cerita.harta_sendiri_tidak', { daftar })`. Tombol utama `t('hitung.lihat_hasil')`: bila ada janin (`statusHidup === 'dalamKandungan'`) dan `!kasus.pilihanJanin` → tahap `'menunggu'`, selain itu `kirim({ jenis: 'KE_LAYAR', layar: 'hasil' })`. Tahap menunggu: dua `role="radio"` (`hitung.cerita.tunggu`, `hitung.cerita.hitung_sekarang`) + tombol `umum.lanjut` → `kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, pilihanJanin }) })` lalu `kirim({ jenis: 'KE_LAYAR', layar: 'hasil' })`. Tautan `umum.kembali_2` → `kirim({ jenis: 'KE_LANGKAH', langkah: 5 })`.

`Aplikasi.tsx`: ganti penanda sementara Task 5 dengan `keadaan.layar === 'cerita' && keadaan.kasus ? <PeriksaCerita kasus={keadaan.kasus} kirim={kirim} />`.

Diksi (`diksi-t11.json`):
```json
[
 {"kunci":"hitung.cerita.judul","id":"Coba baca ceritanya. Sudah benar?"},
 {"kunci":"hitung.cerita.label_babak","id":"Babak {nomor}"},
 {"kunci":"hitung.cerita.babak_pertama","id":"{nama} wafat. Ia meninggalkan {daftar}. Hartanya belum dibagi."},
 {"kunci":"hitung.cerita.babak_lanjut","id":"Lalu {nama} wafat. Ia meninggalkan {daftar}."},
 {"kunci":"hitung.cerita.dan","id":"dan"},
 {"kunci":"hitung.cerita.ubah","id":"ubah"},
 {"kunci":"hitung.cerita.sesudah_dibagi","id":"{nama} wafat sesudah harta dibagi, jadi dihitung seperti masih hidup."},
 {"kunci":"hitung.cerita.bersamaan","id":"{daftar} wafat dalam kejadian yang sama."},
 {"kunci":"hitung.cerita.hilang","id":"{nama} hilang dan belum ada kabar."},
 {"kunci":"hitung.cerita.harta_dibagi","id":"Harta yang dibagi: harta {pewaris}, {jumlah}."},
 {"kunci":"hitung.cerita.harta_sendiri_tidak","id":"Harta milik {daftar} sendiri tidak ikut dihitung di sini."},
 {"kunci":"hitung.cerita.menunggu_tanya","id":"Bayi belum lahir. Mau menunggu dulu?"},
 {"kunci":"hitung.cerita.menunggu_ket","id":"Menunggu kelahiran lebih baik: pembagian cukup sekali dan tidak ada bagian yang ditahan."},
 {"kunci":"hitung.cerita.tunggu","id":"Tunggu lahir dulu"},
 {"kunci":"hitung.cerita.tunggu_ket","id":"Kasus disimpan. Hitung lagi setelah bayi lahir."},
 {"kunci":"hitung.cerita.hitung_sekarang","id":"Hitung sekarang"},
 {"kunci":"hitung.cerita.hitung_sekarang_ket","id":"Bagian yang belum pasti disimpan dulu sampai bayi lahir."}
]
```

- [ ] **Step 4: Jalankan** — `pnpm --filter @waris/web test -- periksaCerita asap diksi` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "web: layar periksa cerita + pilihan menunggu kelahiran"` (+ `git add`).

---

### Task 12: Integrasi UI → engine + regresi penuh

**Files:**
- Modify: `apps/web/src/__tests__/integrasi.test.ts`
- Test only.

**Interfaces:**
- Consumes: semua task; fixture `packages/engine/src/__tests__/fixtures/{munasakhat,taqdir,gharqa}.ts`.

- [ ] **Step 1: Tes** — tambah `describe('kasus bab 13 lewat jawaban UI')`. Susun tiap kasus **hanya** dengan helper UI (`tambahAhliWaris`, `terapkanKeadaan`, `tambahJanin`) lalu bandingkan dengan fixture, per pecahan saham ÷ jami'ah (graf UI punya id berbeda; bandingkan per kunci ahli waris seperti `sahamPerKunci` yang sudah ada).

```ts
describe('kasus bab 13 lewat jawaban UI', () => {
  it('H1 [SYF]: ibu hamil dari ayah mayit, saudara lk kandung → saudara 0, mauquf 60/72', () => {
    let kasus = kasusBaru('L');
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'IBU') };
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'SAUDARA_KANDUNG') };
    const ibu = kasus.graf.orang['PEWARIS']!.idIbu!;
    const ayah = kasus.graf.orang['PEWARIS']!.idAyah!;   // penghubung wafat
    kasus = tambahJanin(kasus, ibu, ayah);
    const hasil = jalankan(kasus);
    if (hasil.jenis !== 'taqdir' || hasil.hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    const { jamiah, mauquf, diberikan } = hasil.hasil;
    expect(mauquf * 72n).toBe(60n * jamiah);
    expect(diberikan[ibu]! * 72n).toBe(12n * jamiah);
  });

  it('F1: ibu, saudara lk sebapak hadir, saudara lk sebapak hilang → mauquf 5/12', () => {
    let kasus = kasusBaru('L');
    for (const kunci of ['IBU', 'SAUDARA_SEBAPAK', 'SAUDARA_SEBAPAK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
    const hilang = Object.values(kasus.graf.orang).filter(o => o.jenisKelamin === 'L' && o.id !== 'PEWARIS' && !o.penghubung).at(-1)!.id;
    kasus = terapkanKeadaan(kasus, hilang, { jenis: 'hilang' });
    const hasil = jalankan(kasus);
    if (hasil.jenis !== 'taqdir' || hasil.hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    expect(hasil.hasil.mauquf * 12n).toBe(5n * hasil.hasil.jamiah);
  });

  it('X1: ayah, 2 anak pr, cucu (anak dari anak lk) khuntsa → mauquf 1/6', () => {
    let kasus = kasusBaru('L');
    for (const kunci of ['AYAH', 'ANAK_PR', 'ANAK_PR', 'CUCU_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
    const cucu = Object.values(kasus.graf.orang).find(o => o.idAyah && kasus.graf.orang[o.idAyah]?.penghubung)!.id;
    kasus = terapkanKeadaan(kasus, cucu, { jenis: 'khuntsa', keadaan: 'diharapkanJelas' });
    const hasil = jalankan(kasus);
    if (hasil.jenis !== 'taqdir' || hasil.hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    expect(hasil.hasil.mauquf * 6n).toBe(1n * hasil.hasil.jamiah);
  });

  it('gharqa [SYF] serentak: dua harta terpisah, tidak saling mewarisi', () => {
    let kasus = { ...kasusBaru('L'), tirkah: { kotor: 600n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
    for (const kunci of ['ISTRI', 'ANAK_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
    const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    kasus = terapkanKeadaan(kasus, anak, { jenis: 'bersamaan', keadaan: 'serentak', tirkah: { kotor: 300n, tajhiz: 0n, hutang: 0n, wasiat: 0n } });
    const hasil = jalankan(kasus);
    if (hasil.jenis !== 'gharqa' || hasil.hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    expect(hasil.hasil.metode).toBe('terpisah');
    const hartaAyah = hasil.hasil.harta.find(h => h.mayit === 'PEWARIS')!;
    expect(hartaAyah.saham[anak]).toBeUndefined();   // anak tidak mewarisi ayah [R13-10]
  });

  it('M1 lewat terapkanKeadaan sama dengan fixture', () => {
    /* ulangi tes M1 yang sudah ada, tapi urutanWafat diisi lewat terapkanKeadaan(…, { jenis: 'wafatSesudah', hartaSudahDibagi: false }) */
  });
});
```

Tes M1 terakhir: salin badan tes M1 yang sudah ada di file (baris 30–50) dan ganti baris `urutanWafat: [idSuami!]` dengan `terapkanKeadaan(kasusSebelum, idSuami!, { jenis: 'wafatSesudah', hartaSudahDibagi: false })` sebelum menambah anak suami. Jangan tinggalkan komentar placeholder.

Bila helper checklist untuk X1 membuat cucu lewat anak lk penghubung (bukan `CUCU_LK` langsung), sesuaikan pencarian `cucu` dengan `labelOrangChecklist` — cek dulu dengan `console.log(kasus.graf)` sekali, lalu hapus log.

- [ ] **Step 2: Jalankan** — `pnpm --filter @waris/web test -- integrasi` → PASS. Bila angka tidak cocok dengan fixture, periksa susunan graf UI dulu (penghubung ayah/ibu), bukan engine.

- [ ] **Step 3: Regresi penuh**

Run: `pnpm test && pnpm typecheck`
Expected: semua paket hijau. Perbaiki tes lama yang memakai `versi: 2` (`sinkron.test.ts` memakai `versi` konten, bukan Kasus — jangan diubah), `KeadaanAplikasi` tanpa `babak`, atau `LangkahKondisi` munasakhat.

- [ ] **Step 4: Verifikasi di browser** — jalankan dev server lewat `preview_start` (`apps/web`), susun S1, S17, S27 di HP (375px): tanpa geser horizontal, dialog terbaca, stepper menunjukkan "Babak 2 dari 2". Ambil screenshot untuk pengguna.

- [ ] **Step 5: Commit** — `git commit -am "web: tes integrasi bab 13 lewat jawaban UI"`.

---

## Self-Review (dicatat)

- **Cakupan spec:** 1.1 → T6, T7; 1.2 → T8; 1.3 → T9 (butir 4 di luar cakupan sesuai spec); 1.4 → T7; 1.5–1.6 → T11; 1.7 → T2, T6; 2.1–2.4 → T1, T2; 2.5 → T4; 3 → T10; 4 → T5 (validasi), T10 (galat), semua task (diksi); 6 → tiap task + T12.
- **Penyederhanaan terhadap spec 1.2 butir 3:** hubungan dari babak lalu ditampilkan terkunci (sesuai spec); hubungan buatan babak ini dihapus lewat tombol − di `LangkahAhliWaris`, bukan centang. S11 (pasangan dari orang yang sudah ada) → `calonPasangan`/`nikahkan` di Task 8.
- **Konsistensi nama:** `terapkanKeadaan`, `rapikanKeadaan`, `babakAsal`, `kerabatDari`, `namaSingkat`, `mulaiSisip`/`pembanding`/`jawabSisip`/`posisiAkhir`, `KeadaanAplikasi.babak`, `KE_BABAK`, layar `cerita` dipakai sama di semua task.
