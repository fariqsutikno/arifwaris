# Kanvas Silsilah · Rencana 1: Fondasi Data dan Logika — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyiapkan data dan logika murni untuk kanvas silsilah: fixture engine, `Kasus` v4 dan migrasinya, penurunan dari tahun dan peristiwa, uji hipotetis, daftar bagian, antrean urutan wafat, dan invarian pohon. Belum ada layar baru di rencana ini.

**Architecture:** Semua unit baru di `apps/web/src` adalah fungsi murni yang menerima `Kasus` dan mengembalikan data atau `Kasus` baru. Keputusan fikih ("perlu ditanya?") hanya diambil dengan **memanggil engine** (`hitungMunasakhat` / `hitungDzawilArham`) pada graf hipotetis. UI tidak memuat aturan hajb. Engine tidak diubah, hanya ditambah fixture.

**Tech Stack:** TypeScript, pnpm workspace, Vitest, `@waris/engine`.

**Spec:** `docs/superpowers/specs/2026-10-16-kanvas-silsilah-design.md` (bagian 8, 9, 10, 11, 12 langkah 1–4)

## Global Constraints

- Nama variabel, fungsi, tipe, dan komentar dalam bahasa Indonesia. Istilah fikih memakai transliterasi glosarium `docs/kb/15_glosarium.md` (CLAUDE.md).
- `docs/kb/00–17` satu-satunya sumber hukum. Setiap cabang kode yang berasal dari keputusan fikih diberi anotasi `[Rxx-y]`.
- Tidak boleh ada `number` di jalur hitung. Tahun (`TanggalKira`) hanya ada di UI dan tidak pernah dikirim ke engine.
- Fungsi murni: tanpa I/O, `Date`, atau `Math.random`.
- Nama baru: `Kasus.jenisKasus: 'latihan' | 'nyata'` (bukan `tujuan`, yang sudah dipakai state app) dan `antreanUrutan.ts` (`antrean.ts` sudah dipakai modul akun).
- Rencana ini tidak membuat kalimat tampilan baru. Galat validasi memakai kunci diksi yang sudah ada `hitung.data_keadaan_rusak`.
- Commit sesudah tiap tugas, hanya berkas yang disentuh tugas itu. Akhiri pesan dengan `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Perintah tes: web `pnpm --filter @waris/web exec vitest run <berkas>`, engine `pnpm --filter @waris/engine exec vitest run <berkas>`, semua `pnpm test`, tipe `pnpm typecheck`.

## Review Focus

1. **Kasus v3 yang tersimpan** (localStorage, riwayat, berkas `.json`, tautan bagikan lama) harus tetap terbuka sebagai v4 tanpa galat, dan input engine-nya tidak berubah. Diuji di Tugas 2, langkah 1 ("migrasi v3 berurutan wafat").
2. **Penerima tautan bagikan** tidak boleh menerima `saya` milik pemilik. Diuji di Tugas 2, langkah 1 ("keJsonDibagikan membuang saya").
3. **Kasus yang memuat orang belum pasti** (belum tahu, hilang, janin, khuntsa): uji hipotetis harus tetap menanyakan, bukan diam-diam melewati. Diuji di Tugas 4, langkah 1 ("orang belum pasti → tetap ditanya").
4. **Berkas impor dengan tahun bukan bilangan bulat**, atau bulan 13: harus ditolak di batas kepercayaan. Diuji di Tugas 2, langkah 1 ("menolak TanggalKira rusak").
5. **Menghapus orang** yang dirujuk oleh `waktu`, `peristiwa`, `urutanDijawab`, `belumPasti`, `kelompokDijawab`, atau `saya`: rujukan itu harus ikut bersih tanpa galat. Diuji di Tugas 2, langkah 1 ("rapikanKeadaan membersihkan rujukan orang yang dihapus").

---

## Peta berkas

| Berkas | Tugas | Tanggung jawab |
|---|---|---|
| `packages/engine/src/__tests__/kanvasSilsilah.test.ts` (baru) | 1 | Fixture A/A2/B/B' dicocokkan ke KB |
| `apps/web/src/kasus.ts` | 2 | `Kasus` v4, migrasi, `bacaKasus`, `rapikanKeadaan`, `keJsonDibagikan` |
| `apps/web/src/Aplikasi.tsx`, `apps/web/src/layar/DialogBagikan.tsx` | 2 | Memakai `keJsonDibagikan` |
| `apps/web/src/silsilah.ts` (baru) | 3 | `bandingTanggal`, `waktuRelatif`, `urutkanMenurutTahun`, `terapkanPeristiwa`, `turunkanDariWaktu` |
| `apps/web/src/keadaan.ts` | 3 | `UBAH_KASUS` memanggil `turunkanDariWaktu` |
| `apps/web/src/__tests__/fixtures/kanvas.ts` (baru) | 4 | Pembangun graf contoh untuk tes web |
| `apps/web/src/ujiHipotetis.ts` (baru) | 4 | `menerima`, `posisiPerluDitanya`, `urutanBerpengaruh` |
| `apps/web/src/kelompok.ts` (baru) | 5 | `daftarBagian`, `anggotaBagian`, `bagianLengkap` |
| `apps/web/src/antreanUrutan.ts` (baru) | 6 | `orangUrutanBelumPasti`, `pertanyaanUrutanBerikut`, `selesaikanUrutan`, `tundaUrutan` |
| `apps/web/src/hasil/tataLetak.ts` | 7 | Pasangan menempel di semua baris |

---

### Task 1: Fixture engine kanvas silsilah

**Files:**
- Create: `packages/engine/src/__tests__/kanvasSilsilah.test.ts`

**Interfaces:**
- Consumes: `hitungMunasakhat` (`packages/engine/src/munasakhat.ts`), `hitung` (`packages/engine/src/pipeline.ts`), `input`, `p` (`packages/engine/src/__tests__/fixtures/bab16.ts`)
- Produces: tidak ada (hanya tes regresi). Angka di sini menjadi acuan contoh di mockup dan rencana berikutnya.

- [ ] **Step 1: Cocokkan angka ke KB sebelum menulis tes**

Baca `docs/kb/12_munasakhat.md` 12.1 [R12-1], `docs/kb/06_hajb.md` [R06-4], dan `docs/kb/08_jadd_wal_ikhwah.md` [R08-1], [R08-3], [R08-5]. Angka yang diharapkan (hitung tangan):
- **A** (Mbah Karto → Mbah Sumi → Budi; Slamet wafat lebih dulu, anaknya Joko):
  - tahap 1: istri 1/8, Budi:Rina 2:1 → 7/12, 7/24;
  - tahap 2: Sumi → Budi 2/3, Rina 1/3;
  - tahap 3: Budi → Dewi 1/8, Andi:Sari 2:1.
  - Akhir: **Rina 1/3, Dewi 1/12, Andi 7/18, Sari 7/36**. Joko 0 karena terhalang Budi [R06-3].
- **A2** (sama, tapi Budi wafat sebelum Sumi):
  - Budi → Sumi 1/6, Dewi 1/8, Andi:Sari 2:1;
  - Sumi → Rina 1/2, Andi:Sari sebagai cucu 2:1.
  - Akhir: **Rina 29/72, Dewi 7/96, Andi 151/432, Sari 151/864**.
- **B** (Budi tak menikah; ayah wafat lebih dulu; ibu; Andi, Rina kandung): **ibu 1/6, Andi 5/9, Rina 5/18**.
- **B'** (B + kakek hidup): kakek mengambil yang terbaik dari tiga, yaitu muqasamah 2/5 × 5/6 = 1/3 [R08-3]. Rina bukan fardh [R08-5]. Hasil: **ibu 1/6, kakek 1/3, Andi 1/3, Rina 1/6**.

Bila KB berbeda dari angka di atas, berhenti dan laporkan. Jangan ubah tes supaya lolos.

- [ ] **Step 2: Tulis tes**

```ts
// Fixture spec kanvas silsilah (spec 11.1): contoh turun-temurun dan kakak tak menikah, dicocokkan ke KB.
// A/A2 menunjukkan bahwa urutan wafat mengubah hasil (dasar uji "urutan berpengaruh"); B' menguji kakek bersama saudara.
import { describe, expect, test } from 'vitest';
import { hitungMunasakhat } from '../munasakhat.js';
import { hitung } from '../pipeline.js';
import type { GrafKeluarga, HasilEngine } from '../types.js';
import { input, p } from './fixtures/bab16.js';

const fpb = (a: bigint, b: bigint): bigint => (b === 0n ? a : fpb(b, a % b));
function sebagaiPecahan(saham: Record<string, bigint>): Record<string, string> {
  const total = Object.values(saham).reduce((a, b) => a + b, 0n);
  return Object.fromEntries(Object.entries(saham).filter(([, s]) => s > 0n).map(([id, s]) => {
    const g = fpb(s, total);
    return [id, `${s / g}/${total / g}`];
  }));
}
function sahamBiasa(hasil: HasilEngine): Record<string, bigint> {
  if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
  const saham: Record<string, bigint> = {};
  for (const baris of hasil.tabel.baris) for (const [id, isi] of Object.entries(baris.perOrang)) saham[id] = (saham[id] ?? 0n) + isi.saham;
  return saham;
}

// Mbah Karto (K) + istri Sumi (S) + anak Slamet (SL, wafat lebih dulu, anaknya Joko J) + Budi (B) + Rina (R);
// ayah Karto (AK) wafat lebih dulu; Budi beristri Dewi (D), anak Andi (A) dan Sari (SR).
const grafKarto: GrafKeluarga = {
  idPewaris: 'K',
  orang: {
    K: p('K', 'L', { statusHidup: 'wafat', idAyah: 'AK' }),
    AK: p('AK', 'L', { statusHidup: 'wafat' }),
    S: p('S', 'P'),
    SL: p('SL', 'L', { statusHidup: 'wafat', idAyah: 'K', idIbu: 'S' }),
    J: p('J', 'L', { idAyah: 'SL' }),
    B: p('B', 'L', { idAyah: 'K', idIbu: 'S' }),
    R: p('R', 'P', { idAyah: 'K', idIbu: 'S' }),
    D: p('D', 'P'),
    A: p('A', 'L', { idAyah: 'B', idIbu: 'D' }),
    SR: p('SR', 'P', { idAyah: 'B', idIbu: 'D' }),
  },
  pernikahan: [{ idSuami: 'K', idIstri: 'S', status: 'utuh' }, { idSuami: 'B', idIstri: 'D', status: 'utuh' }],
};

// Budi (BU) tak menikah; ayah AY wafat lebih dulu; ibu IB; saudara kandung Andi (AN) dan Rina (RI).
const grafBudi = (kakekHidup: boolean): GrafKeluarga => ({
  idPewaris: 'BU',
  orang: {
    BU: p('BU', 'L', { statusHidup: 'wafat', idAyah: 'AY', idIbu: 'IB' }),
    AY: p('AY', 'L', { statusHidup: 'wafat', ...(kakekHidup ? { idAyah: 'KK' } : {}) }),
    IB: p('IB', 'P'),
    AN: p('AN', 'L', { idAyah: 'AY', idIbu: 'IB' }),
    RI: p('RI', 'P', { idAyah: 'AY', idIbu: 'IB' }),
    ...(kakekHidup ? { KK: p('KK', 'L') } : {}),
  },
  pernikahan: [{ idSuami: 'AY', idIstri: 'IB', status: 'utuh' }],
});

describe('kanvas silsilah — fixture spec 11.1', () => {
  test('A: turun-temurun, Sumi wafat sebelum Budi [R12-1]; Joko terhalang Budi', () => {
    const hasil = hitungMunasakhat({ dasar: input(grafKarto), urutanWafat: ['S', 'B'] });
    if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    expect(sebagaiPecahan(hasil.saham)).toEqual({ R: '1/3', D: '1/12', A: '7/18', SR: '7/36' });
    expect(hasil.sisaKeluar).toEqual([]);
  });

  test('A2: urutan dibalik (Budi sebelum Sumi) mengubah hasil', () => {
    const hasil = hitungMunasakhat({ dasar: input(grafKarto), urutanWafat: ['B', 'S'] });
    if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    expect(sebagaiPecahan(hasil.saham)).toEqual({ R: '29/72', D: '7/96', A: '151/432', SR: '151/864' });
  });

  test('B: kakak tak menikah, ibu + saudara kandung', () => {
    expect(sebagaiPecahan(sahamBiasa(hitung(input(grafBudi(false)))))).toEqual({ IB: '1/6', AN: '5/9', RI: '5/18' });
  });

  test("B': kakek bersama saudara dan ibu → muqasamah 1/3 [R08-1] [R08-3] [R08-5]", () => {
    expect(sebagaiPecahan(sahamBiasa(hitung(input(grafBudi(true)))))).toEqual({ IB: '1/6', KK: '1/3', AN: '1/3', RI: '1/6' });
  });
});
```

- [ ] **Step 3: Jalankan tes**

Run: `pnpm --filter @waris/engine exec vitest run src/__tests__/kanvasSilsilah.test.ts`
Expected: 4 PASS. Engine sudah lengkap untuk kasus ini. Bila ada yang FAIL, bandingkan lagi dengan KB (Step 1). Bila KB yang benar, laporkan sebagai bug engine dan jangan ubah angkanya.

- [ ] **Step 4: Commit**

```bash
git add packages/engine/src/__tests__/kanvasSilsilah.test.ts
git commit -m "test(engine): fixture kanvas silsilah A/A2 (turun-temurun, urutan berpengaruh), B/B' (kakek bersama saudara) dicocokkan ke KB"
```

---

### Task 2: `Kasus` v4, migrasi v3 → v4, dan bagikan tanpa `saya`

**Files:**
- Modify: `apps/web/src/kasus.ts`
- Modify: `apps/web/src/Aplikasi.tsx:90` (`JSON.parse(keJson(kasusTerbaru))` → `keJsonDibagikan`)
- Modify: `apps/web/src/layar/DialogBagikan.tsx:84` (`JSON.parse(keJson(kasus))` → `keJsonDibagikan`)
- Test: `apps/web/src/__tests__/kasus.test.ts`

**Interfaces:**
- Consumes: tipe engine `GrafKeluarga`, `IdOrang`.
- Produces (dipakai Tugas 3–6 dan rencana 2–4):
  ```ts
  export const JENIS_KASUS = ['latihan', 'nyata'] as const; export type JenisKasus = typeof JENIS_KASUS[number];
  export const PINTU = ['baru', 'lama', 'sudah', 'tidakTahu'] as const; export type Pintu = typeof PINTU[number];
  export const KELOMPOK = ['pasangan', 'anak', 'orangTua', 'kakekNenek', 'saudara', 'jauh', 'anakBersama', 'halLain'] as const;
  export type Kelompok = typeof KELOMPOK[number];
  export interface TanggalKira { tahun: number; bulan?: number; hari?: number; kiraKira: boolean }
  export type Peristiwa =
    | { jenis: 'lahir'; idOrang: IdOrang; sesudahWafat: IdOrang }
    | { jenis: 'nikah' | 'cerai'; idOrang: IdOrang; idPasangan: IdOrang; sesudahWafat: IdOrang };
  export type HalBelumPasti =
    | { jenis: 'urutan'; a: IdOrang; b: IdOrang; bersamaan: boolean }
    | { jenis: 'lahir'; anak: IdOrang; almarhum: IdOrang };
  // Kasus.versi: 4; tambahan: jenisKasus, pintu?, kelompokDijawab?, belumDiisi?, saya?, waktu?, peristiwa?, urutanDijawab?, belumPasti?
  export function kasusBaru(jenisKelaminPewaris: 'L' | 'P', jenisKasus?: JenisKasus): Kasus;   // bawaan 'nyata'
  export const keJsonDibagikan: (kasus: Kasus) => string;
  ```

- [ ] **Step 1: Tulis tes yang gagal**

Ganti tiga tes lama di `kasus.test.ts`:
- `'menolak versi lain'`: `'"versi":3'` → `'"versi":4'`;
- `'file versi 1 tetap terbaca dan jadi versi 3'` diganti namanya jadi `'… jadi versi 4'`, dengan `'"versi":3'` → `'"versi":4'` dan `{ versi: 3 }` → `{ versi: 4 }`.

Lalu tambahkan di akhir berkas:

```ts
import { keJsonDibagikan } from '../kasus';

describe('kasus v4 (spec kanvas silsilah 9.1–9.2)', () => {
  const dasar = () => {
    let kasus = kasusBaru('L');
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ISTRI') };
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
    const isian = hitungIsian(kasus.graf, 'PEWARIS');
    return { kasus, istri: isian.ISTRI![0]!, anak: isian.ANAK_LK![0]! };
  };

  it('kasusBaru: versi 4, bawaan nyata, bisa latihan', () => {
    expect(kasusBaru('L')).toMatchObject({ versi: 4, jenisKasus: 'nyata' });
    expect(kasusBaru('P', 'latihan').jenisKasus).toBe('latihan');
  });

  it('round-trip semua field baru', () => {
    const { kasus, istri, anak } = dasar();
    const penuh = {
      ...kasus, urutanWafat: [anak], pintu: 'lama' as const, saya: istri,
      kelompokDijawab: { PEWARIS: ['pasangan', 'anak'] as const }, belumDiisi: [istri],
      waktu: { [anak]: { wafat: { tahun: 1998, kiraKira: false } } },
      peristiwa: [{ jenis: 'cerai' as const, idOrang: 'PEWARIS', idPasangan: istri, sesudahWafat: 'PEWARIS' }],
      urutanDijawab: [anak],
    };
    const hasil = dariJson(keJson(penuh as unknown as Kasus));
    expect(hasil).toMatchObject({ berhasil: true, kasus: { pintu: 'lama', saya: istri, belumDiisi: [istri], urutanDijawab: [anak] } });
  });

  it('migrasi v3 berurutan wafat: nyata, pintu lama, semua kelompok almarhum dianggap dijawab', () => {
    const { kasus, anak } = dasar();
    const teks = keJson({ ...kasus, urutanWafat: [anak] }).replace('"versi":4', '"versi":3').replace(/,"jenisKasus":"nyata"/, '');
    const hasil = dariJson(teks);
    if (!hasil.berhasil) throw new Error(hasil.pesan);
    expect(hasil.kasus).toMatchObject({ versi: 4, jenisKasus: 'nyata', pintu: 'lama', urutanWafat: [anak] });
    expect(hasil.kasus.kelompokDijawab?.PEWARIS).toContain('halLain');
    expect(hasil.kasus.kelompokDijawab?.[anak]).toContain('anak');
  });

  it('migrasi v3 tanpa urutan wafat: pintu baru', () => {
    const teks = keJson(kasusBaru('L')).replace('"versi":4', '"versi":3').replace(/,"jenisKasus":"nyata"/, '');
    expect(dariJson(teks)).toMatchObject({ berhasil: true, kasus: { pintu: 'baru' } });
  });

  it('menolak TanggalKira rusak', () => {
    const { kasus, anak } = dasar();
    for (const wafat of [{ tahun: 1998.5, kiraKira: false }, { tahun: 1998, bulan: 13, kiraKira: false }, { tahun: 1998 }]) {
      const teks = keJson({ ...kasus, waktu: { [anak]: { wafat } } } as unknown as Kasus);
      expect(dariJson(teks)).toMatchObject({ berhasil: false });
    }
  });

  it('menolak peristiwa ke orang yang tidak ada, dan jenisKasus tak dikenal', () => {
    const { kasus } = dasar();
    expect(dariJson(keJson({ ...kasus, peristiwa: [{ jenis: 'lahir', idOrang: 'HANTU', sesudahWafat: 'PEWARIS' }] } as Kasus))).toMatchObject({ berhasil: false });
    expect(dariJson(keJson(kasus).replace('"jenisKasus":"nyata"', '"jenisKasus":"lain"'))).toMatchObject({ berhasil: false });
  });

  it('rapikanKeadaan membersihkan rujukan orang yang dihapus', () => {
    const { kasus, istri, anak } = dasar();
    const isi: Kasus = {
      ...kasus, urutanWafat: [anak], saya: istri, belumDiisi: [istri], urutanDijawab: [anak],
      kelompokDijawab: { [istri]: ['anak'] }, waktu: { [istri]: { wafat: { tahun: 1990, kiraKira: true } } },
      peristiwa: [{ jenis: 'lahir', idOrang: istri, sesudahWafat: 'PEWARIS' }],
      belumPasti: [{ jenis: 'lahir', anak: istri, almarhum: 'PEWARIS' }],
    };
    const { [istri]: _hapus, ...sisaOrang } = isi.graf.orang;
    const rapi = rapikanKeadaan({ ...isi, graf: { ...isi.graf, orang: sisaOrang, pernikahan: [] } });
    expect(rapi.saya).toBeUndefined();
    expect(rapi.belumDiisi).toBeUndefined();
    expect(rapi.kelompokDijawab).toEqual({});
    expect(rapi.waktu).toEqual({});
    expect(rapi.peristiwa).toBeUndefined();
    expect(rapi.belumPasti).toBeUndefined();
    expect(rapi.urutanDijawab).toEqual([anak]);
  });

  it('urutanDijawab hanya berisi orang di urutan wafat', () => {
    const { kasus, anak } = dasar();
    expect(rapikanKeadaan({ ...kasus, urutanDijawab: [anak] }).urutanDijawab).toBeUndefined();
  });

  it('keJsonDibagikan membuang saya; saya null (mengisi untuk orang lain) juga tidak ikut', () => {
    const { kasus, istri } = dasar();
    expect(JSON.parse(keJsonDibagikan({ ...kasus, saya: istri }))).not.toHaveProperty('saya');
    expect(JSON.parse(keJsonDibagikan({ ...kasus, saya: null }))).not.toHaveProperty('saya');
    expect(dariJson(keJsonDibagikan({ ...kasus, saya: istri }))).toMatchObject({ berhasil: true });
  });

  it('saya: null tersimpan apa adanya', () => {
    const { kasus } = dasar();
    expect(dariJson(keJson({ ...kasus, saya: null }))).toMatchObject({ berhasil: true, kasus: { saya: null } });
  });
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/kasus.test.ts`
Expected: FAIL (`keJsonDibagikan` tidak diekspor; `versi` masih 3).

- [ ] **Step 3: Implementasi di `kasus.ts`**

1. Di bawah `KHUNTSA`, tambahkan konstanta dan tipe:

```ts
export const JENIS_KASUS = ['latihan', 'nyata'] as const;
export type JenisKasus = typeof JENIS_KASUS[number];
/** Jawaban pertanyaan pintu "hartanya sudah dibagi?" (spec kanvas 4); kosong = belum dijawab, tanpa bawaan. */
export const PINTU = ['baru', 'lama', 'sudah', 'tidakTahu'] as const;
export type Pintu = typeof PINTU[number];
export const KELOMPOK = ['pasangan', 'anak', 'orangTua', 'kakekNenek', 'saudara', 'jauh', 'anakBersama', 'halLain'] as const;
export type Kelompok = typeof KELOMPOK[number];
/** Presisi bebas: tahun saja sampai tanggal lengkap. Khusus UI; tidak pernah dikirim ke engine. */
export interface TanggalKira { tahun: number; bulan?: number; hari?: number; kiraKira: boolean }
export type Peristiwa =
  | { jenis: 'lahir'; idOrang: IdOrang; sesudahWafat: IdOrang }
  | { jenis: 'nikah' | 'cerai'; idOrang: IdOrang; idPasangan: IdOrang; sesudahWafat: IdOrang };
export type HalBelumPasti =
  | { jenis: 'urutan'; a: IdOrang; b: IdOrang; bersamaan: boolean }
  | { jenis: 'lahir'; anak: IdOrang; almarhum: IdOrang };
```

2. Ubah `interface Kasus`: `versi: 3` → `versi: 4`, lalu tambahkan sesudah `nama?: string;`:

```ts
  /** Pintu masuk Lab (spec kanvas 3): latihan soal atau kasus keluarga nyata. */
  jenisKasus: JenisKasus;
  pintu?: Pintu;
  /** Bagian yang sudah dijawab per orang ("Tidak" juga jawaban). Khusus UI. */
  kelompokDijawab?: Record<IdOrang, Kelompok[]>;
  /** Baris hasil penghitung yang keadaannya belum dipilih. Khusus UI. */
  belumDiisi?: IdOrang[];
  /** Jangkar diri; undefined = belum dijawab, null = mengisi untuk orang lain. Tidak ikut dibagikan. */
  saya?: IdOrang | null;
  waktu?: Record<IdOrang, { wafat?: TanggalKira; lahir?: TanggalKira }>;
  peristiwa?: Peristiwa[];
  /** Orang di urutanWafat yang posisinya sudah dipastikan (berpasangan/diatur). Khusus UI. */
  urutanDijawab?: IdOrang[];
  belumPasti?: HalBelumPasti[];
```

3. `kasusBaru`:

```ts
export function kasusBaru(jenisKelaminPewaris: 'L' | 'P', jenisKasus: JenisKasus = 'nyata'): Kasus {
  return {
    versi: 4,
    jenisKasus,
    graf: { ... tetap ... },
    tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n },
    satuanPembulatan: 1n,
    urutanWafat: [],
  };
}
```

4. Sesudah `keJson`:

```ts
/** Untuk dibagikan: jangkar diri (`saya`) tidak ikut, supaya penerima tidak melihat "ayahmu" (spec kanvas 5.8). */
export function keJsonDibagikan(kasus: Kasus): string {
  const { saya: _saya, ...tanpaSaya } = kasus;
  return keJson(tanpaSaya as Kasus);
}
```

5. Ganti seluruh isi `rapikanKeadaan` dengan versi yang juga membersihkan field v4:

```ts
export function rapikanKeadaan(kasus: Kasus): Kasus {
  const { graf } = kasus;
  const pewaris = graf.idPewaris;
  const ada = (id: IdOrang) => !!graf.orang[id];
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

  // Field v4 (spec kanvas 9.1): rujukan ke orang yang sudah tidak ada dibuang.
  const saringKunci = <T>(isi: Record<IdOrang, T> | undefined) => isi && Object.fromEntries(Object.entries(isi).filter(([id]) => ada(id)));
  const kelompokDijawab = saringKunci(kasus.kelompokDijawab);
  const waktu = saringKunci(kasus.waktu);
  const belumDiisi = (kasus.belumDiisi ?? []).filter(ada);
  const saya = kasus.saya === null ? null : kasus.saya !== undefined && ada(kasus.saya) ? kasus.saya : undefined;
  const peristiwa = (kasus.peristiwa ?? []).filter(e => ada(e.idOrang) && almarhum.has(e.sesudahWafat) && (e.jenis === 'lahir' || ada(e.idPasangan)));
  const urutanDijawab = (kasus.urutanDijawab ?? []).filter(id => diUrutan.has(id));
  const belumPasti = (kasus.belumPasti ?? []).filter(h => (h.jenis === 'urutan' ? diUrutan.has(h.a) && diUrutan.has(h.b) : ada(h.anak) && almarhum.has(h.almarhum)));

  const {
    gharqa: _g, wafatSesudahDibagi: _w, dikandungSetelahWafat: _d, pilihanJanin: _p,
    kelompokDijawab: _kd, waktu: _wk, belumDiisi: _bd, saya: _s, peristiwa: _pe, urutanDijawab: _ud, belumPasti: _bp, ...inti
  } = kasus;
  return {
    ...inti,
    urutanWafat,
    ...(gharqa ? { gharqa } : {}),
    ...(wafatSesudahDibagi.length ? { wafatSesudahDibagi } : {}),
    ...(dikandung.length ? { dikandungSetelahWafat: Object.fromEntries(dikandung) } : {}),
    ...(adaJanin && kasus.pilihanJanin ? { pilihanJanin: kasus.pilihanJanin } : {}),
    ...(kelompokDijawab ? { kelompokDijawab } : {}),
    ...(waktu ? { waktu } : {}),
    ...(belumDiisi.length ? { belumDiisi } : {}),
    ...(saya !== undefined ? { saya } : {}),
    ...(peristiwa.length ? { peristiwa } : {}),
    ...(urutanDijawab.length ? { urutanDijawab } : {}),
    ...(belumPasti.length ? { belumPasti } : {}),
  };
}
```

6. Di `bacaKasus`: terima versi 1–4 (`if (![1, 2, 3, 4].includes(objek.versi as number))`). Sesudah `pilihanJanin` dibaca, tambahkan:

```ts
  const tambahanV4 = objek.versi === 4 ? bacaTambahanV4(objek, graf) : migrasiKeV4(graf, urutanWafat);
```

Ubah literal `kasus` di akhir `bacaKasus` menjadi `versi: 4, ...tambahanV4,` (sisanya tetap). Lalu tambahkan fungsi berikut di bawah `bacaKasus`:

```ts
/** Kasus v1–v3 (alur Babak): checklist lama menanyakan semua peran, jadi semua kelompok tiap almarhum dianggap dijawab. */
function migrasiKeV4(graf: GrafKeluarga, urutanWafat: IdOrang[]): Pick<Kasus, 'jenisKasus' | 'pintu' | 'kelompokDijawab'> {
  return {
    jenisKasus: 'nyata',
    pintu: urutanWafat.length ? 'lama' : 'baru',
    kelompokDijawab: Object.fromEntries([graf.idPewaris, ...urutanWafat].map(id => [id, [...KELOMPOK]])),
  };
}

function bacaTambahanV4(objek: Record<string, unknown>, graf: GrafKeluarga): Partial<Kasus> & { jenisKasus: JenisKasus } {
  const salah = () => new Error(t('hitung.data_keadaan_rusak'));
  const adaDiGraf = (id: unknown): id is IdOrang => typeof id === 'string' && !!graf.orang[id];
  if (!JENIS_KASUS.includes(objek.jenisKasus as JenisKasus)) throw salah();
  const hasil: Partial<Kasus> & { jenisKasus: JenisKasus } = { jenisKasus: objek.jenisKasus as JenisKasus };
  if (objek.pintu !== undefined) {
    if (!PINTU.includes(objek.pintu as Pintu)) throw salah();
    hasil.pintu = objek.pintu as Pintu;
  }
  if (objek.kelompokDijawab !== undefined) {
    const isi = wajibObjek(objek.kelompokDijawab, 'kelompok dijawab');
    for (const [id, daftar] of Object.entries(isi)) {
      if (!adaDiGraf(id) || !Array.isArray(daftar) || !daftar.every(k => KELOMPOK.includes(k as Kelompok))) throw salah();
    }
    hasil.kelompokDijawab = isi as Record<IdOrang, Kelompok[]>;
  }
  if (objek.belumDiisi !== undefined) hasil.belumDiisi = bacaDaftarOrang(objek.belumDiisi, graf);
  if (objek.urutanDijawab !== undefined) hasil.urutanDijawab = bacaDaftarOrang(objek.urutanDijawab, graf);
  if (objek.saya !== undefined) {
    if (objek.saya !== null && !adaDiGraf(objek.saya)) throw salah();
    hasil.saya = objek.saya as IdOrang | null;
  }
  if (objek.waktu !== undefined) {
    const isi = wajibObjek(objek.waktu, 'waktu');
    const waktu: NonNullable<Kasus['waktu']> = {};
    for (const [id, mentah] of Object.entries(isi)) {
      if (!adaDiGraf(id)) throw salah();
      const w = wajibObjek(mentah, 'waktu orang');
      waktu[id] = {
        ...(w.wafat !== undefined ? { wafat: bacaTanggalKira(w.wafat) } : {}),
        ...(w.lahir !== undefined ? { lahir: bacaTanggalKira(w.lahir) } : {}),
      };
    }
    hasil.waktu = waktu;
  }
  if (objek.peristiwa !== undefined) {
    if (!Array.isArray(objek.peristiwa)) throw salah();
    hasil.peristiwa = objek.peristiwa.map(mentah => {
      const e = wajibObjek(mentah, 'peristiwa');
      if (!adaDiGraf(e.idOrang) || !adaDiGraf(e.sesudahWafat)) throw salah();
      if (e.jenis === 'lahir') return { jenis: 'lahir', idOrang: e.idOrang, sesudahWafat: e.sesudahWafat } as Peristiwa;
      if ((e.jenis !== 'nikah' && e.jenis !== 'cerai') || !adaDiGraf(e.idPasangan) || e.idPasangan === e.idOrang) throw salah();
      return { jenis: e.jenis, idOrang: e.idOrang, idPasangan: e.idPasangan, sesudahWafat: e.sesudahWafat } as Peristiwa;
    });
  }
  if (objek.belumPasti !== undefined) {
    if (!Array.isArray(objek.belumPasti)) throw salah();
    hasil.belumPasti = objek.belumPasti.map(mentah => {
      const h = wajibObjek(mentah, 'belum pasti');
      if (h.jenis === 'urutan' && adaDiGraf(h.a) && adaDiGraf(h.b) && typeof h.bersamaan === 'boolean') return { jenis: 'urutan', a: h.a, b: h.b, bersamaan: h.bersamaan } as HalBelumPasti;
      if (h.jenis === 'lahir' && adaDiGraf(h.anak) && adaDiGraf(h.almarhum)) return { jenis: 'lahir', anak: h.anak, almarhum: h.almarhum } as HalBelumPasti;
      throw salah();
    });
  }
  return hasil;
}

function bacaTanggalKira(nilai: unknown): TanggalKira {
  const salah = new Error(t('hitung.data_keadaan_rusak'));
  const o = wajibObjek(nilai, 'tanggal');
  const bulat = (x: unknown, min: number, maks: number) => Number.isInteger(x) && (x as number) >= min && (x as number) <= maks;
  if (!bulat(o.tahun, 1, 9999) || typeof o.kiraKira !== 'boolean') throw salah;
  if (o.bulan !== undefined && !bulat(o.bulan, 1, 12)) throw salah;
  if (o.hari !== undefined && !bulat(o.hari, 1, 31)) throw salah;
  return { tahun: o.tahun as number, kiraKira: o.kiraKira, ...(o.bulan !== undefined ? { bulan: o.bulan as number } : {}), ...(o.hari !== undefined ? { hari: o.hari as number } : {}) };
}
```

7. Di `Aplikasi.tsx` baris 90 dan `DialogBagikan.tsx` baris 84: ganti `JSON.parse(keJson(...))` dengan `JSON.parse(keJsonDibagikan(...))`, dan tambahkan `keJsonDibagikan` ke import dari `./kasus` / `../kasus`. Hapus `keJson` dari import `DialogBagikan.tsx` bila tidak dipakai lagi.

- [ ] **Step 4: Jalankan tes kasus, lalu seluruh tes web dan typecheck**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/kasus.test.ts`
Expected: PASS.
Run: `pnpm --filter @waris/web test && pnpm typecheck`
Expected: PASS. Tes lain yang membandingkan `versi: 3` akan gagal dan harus disesuaikan ke `4`. Tes yang membuat `Kasus` literal tanpa `jenisKasus` harus diberi `jenisKasus: 'nyata'`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/kasus.ts apps/web/src/Aplikasi.tsx apps/web/src/layar/DialogBagikan.tsx apps/web/src/__tests__
git commit -m "feat(web): Kasus v4 (jenisKasus, pintu, kelompokDijawab, belumDiisi, saya, waktu, peristiwa, urutanDijawab, belumPasti), migrasi v3, bagikan tanpa saya"
```

---

### Task 3: `silsilah.ts`: tahun dan peristiwa → data engine

**Files:**
- Create: `apps/web/src/silsilah.ts`
- Modify: `apps/web/src/keadaan.ts` (case `UBAH_KASUS`)
- Test: `apps/web/src/__tests__/silsilah.test.ts`, `apps/web/src/__tests__/keadaan.test.ts`

**Interfaces:**
- Consumes: `Kasus`, `TanggalKira`, `Peristiwa` (Tugas 2).
- Produces:
  ```ts
  export function bandingTanggal(a?: TanggalKira, b?: TanggalKira): -1 | 0 | 1 | null;   // null = tidak bisa dibandingkan
  export function waktuRelatif(kasus: Kasus, id: IdOrang, relatifKe: IdOrang): 'sebelum' | 'sesudah' | null;
  export function urutkanMenurutTahun(kasus: Kasus): Kasus;
  export function terapkanPeristiwa(kasus: Kasus): Kasus;
  export const turunkanDariWaktu: (kasus: Kasus) => Kasus;
  ```

- [ ] **Step 1: Tulis tes yang gagal** (`silsilah.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { bandingTanggal, terapkanPeristiwa, turunkanDariWaktu, urutkanMenurutTahun, waktuRelatif } from '../silsilah';

const t = (tahun: number, bulan?: number) => ({ tahun, kiraKira: false, ...(bulan ? { bulan } : {}) });
function keluarga() {
  let kasus = kasusBaru('L');
  for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_LK', 'ANAK_PR'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const isian = hitungIsian(kasus.graf, 'PEWARIS');
  return { kasus, istri: isian.ISTRI![0]!, a1: isian.ANAK_LK![0]!, a2: isian.ANAK_LK![1]!, pr: isian.ANAK_PR![0]! };
}

describe('silsilah', () => {
  it('bandingTanggal: tahun, lalu bulan; tahun sama tanpa bulan = tidak bisa dibandingkan', () => {
    expect(bandingTanggal(t(1990), t(1998))).toBe(-1);
    expect(bandingTanggal(t(1998), t(1990))).toBe(1);
    expect(bandingTanggal(t(1990, 3), t(1990, 7))).toBe(-1);
    expect(bandingTanggal(t(1990), t(1990))).toBeNull();
    expect(bandingTanggal(t(1990), undefined)).toBeNull();
  });

  it('waktuRelatif dari tahun wafat dua orang', () => {
    const { kasus, a1 } = keluarga();
    const k: Kasus = { ...kasus, waktu: { PEWARIS: { wafat: t(1975) }, [a1]: { wafat: t(1998) } } };
    expect(waktuRelatif(k, a1, 'PEWARIS')).toBe('sesudah');
    expect(waktuRelatif(k, 'PEWARIS', a1)).toBe('sebelum');
    expect(waktuRelatif(kasus, a1, 'PEWARIS')).toBeNull();
  });

  it('urutkanMenurutTahun: yang bertahun diurutkan; yang tanpa tahun tetap di tempatnya', () => {
    const { kasus, istri, a1, a2 } = keluarga();
    const k: Kasus = { ...kasus, urutanWafat: [a1, istri, a2], waktu: { [a1]: { wafat: t(1998) }, [a2]: { wafat: t(1990) } } };
    expect(urutkanMenurutTahun(k).urutanWafat).toEqual([a2, istri, a1]);
    const sama: Kasus = { ...kasus, urutanWafat: [a1, a2], waktu: { [a1]: { wafat: t(1990) }, [a2]: { wafat: t(1990) } } };
    expect(urutkanMenurutTahun(sama)).toBe(sama);
  });

  it('peristiwa lahir → dikandungSetelahWafat', () => {
    const { kasus, a1, pr } = keluarga();
    const k: Kasus = { ...kasus, urutanWafat: [a1], peristiwa: [{ jenis: 'lahir', idOrang: pr, sesudahWafat: a1 }] };
    expect(terapkanPeristiwa(k).dikandungSetelahWafat).toEqual({ [pr]: a1 });
  });

  it('peristiwa cerai (a1 dan istrinya, sesudah pewaris wafat, sebelum a1 wafat) → talak bain', () => {
    const { kasus, a1 } = keluarga();
    let k = { ...kasus, graf: tambahAhliWaris(kasus.graf, a1, 'ISTRI') };
    const istriA1 = hitungIsian(k.graf, a1).ISTRI![0]!;
    k = { ...k, urutanWafat: [a1], peristiwa: [{ jenis: 'cerai', idOrang: a1, idPasangan: istriA1, sesudahWafat: 'PEWARIS' }] };
    const nikah = terapkanPeristiwa(k).graf.pernikahan.find(n => n.idSuami === a1 && n.idIstri === istriA1)!;
    expect(nikah.status).toBe('talakBain');
  });

  it('turunkanDariWaktu = urutkan lalu peristiwa; tanpa waktu/peristiwa mengembalikan objek yang sama', () => {
    const { kasus } = keluarga();
    expect(turunkanDariWaktu(kasus)).toBe(kasus);
  });
});
```

Tambahkan di `keadaan.test.ts`:

```ts
it('UBAH_KASUS mengurutkan urutan wafat menurut tahun (spec kanvas 9.1)', () => {
  let keadaan = pengurangKeadaan(keadaanAwal(null, 'hitung'), { jenis: 'PILIH_PEWARIS', jenisKelamin: 'L' });
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, graf: tambahAhliWaris(tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK'), 'PEWARIS', 'ANAK_LK') }) });
  const [a1, a2] = hitungIsian(keadaan.kasus!.graf, 'PEWARIS').ANAK_LK!;
  keadaan = pengurangKeadaan(keadaan, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, urutanWafat: [a1!, a2!], waktu: { [a1!]: { wafat: { tahun: 2000, kiraKira: false } }, [a2!]: { wafat: { tahun: 1990, kiraKira: false } } } }) });
  expect(keadaan.kasus!.urutanWafat).toEqual([a2, a1]);
});
```

(Tambahkan import `hitungIsian, tambahAhliWaris` dari `'../checklist'` di `keadaan.test.ts` bila belum ada.)

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/silsilah.test.ts src/__tests__/keadaan.test.ts`
Expected: FAIL (`../silsilah` tidak ada).

- [ ] **Step 3: Implementasi `silsilah.ts`**

```ts
// Penurunan data engine dari isian waktu (spec kanvas silsilah 9.1). Menerima Kasus berisi `waktu` dan `peristiwa`;
// menyerahkan Kasus dengan `urutanWafat`, `dikandungSetelahWafat`, dan status pernikahan yang sudah diturunkan.
// Tahun hanya bahan banding di UI; yang dikirim ke engine tetap urutan dan status.

import type { IdOrang } from '@waris/engine';
import type { Kasus, TanggalKira } from './kasus';

export function bandingTanggal(a?: TanggalKira, b?: TanggalKira): -1 | 0 | 1 | null {
  if (!a || !b) return null;
  const urut: Array<[number | undefined, number | undefined]> = [[a.tahun, b.tahun], [a.bulan, b.bulan], [a.hari, b.hari]];
  for (const [x, y] of urut) {
    if (x === undefined || y === undefined) return null;   // presisi tidak cukup untuk memutuskan
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export function waktuRelatif(kasus: Kasus, id: IdOrang, relatifKe: IdOrang): 'sebelum' | 'sesudah' | null {
  const banding = bandingTanggal(kasus.waktu?.[id]?.wafat, kasus.waktu?.[relatifKe]?.wafat);
  return banding === -1 ? 'sebelum' : banding === 1 ? 'sesudah' : null;
}

/** Orang bertahun diurutkan di antara sesamanya; yang tanpa tahun tetap di posisinya (jawaban berpasangan tidak ditimpa). */
export function urutkanMenurutTahun(kasus: Kasus): Kasus {
  const tanggal = (id: IdOrang) => kasus.waktu?.[id]?.wafat;
  const indeks = kasus.urutanWafat.flatMap((id, i) => (tanggal(id) ? [i] : []));
  const bertahun = indeks.map(i => kasus.urutanWafat[i]!);
  // Sisip stabil: hanya pindah bila pasti lebih awal; seri/tak terbanding tetap.
  const terurut: IdOrang[] = [];
  for (const id of bertahun) {
    let posisi = terurut.length;
    while (posisi > 0 && bandingTanggal(tanggal(id), tanggal(terurut[posisi - 1]!)) === -1) posisi--;
    terurut.splice(posisi, 0, id);
  }
  if (terurut.every((id, i) => id === bertahun[i])) return kasus;
  const urutanWafat = [...kasus.urutanWafat];
  indeks.forEach((i, k) => { urutanWafat[i] = terurut[k]!; });
  return { ...kasus, urutanWafat };
}

export function terapkanPeristiwa(kasus: Kasus): Kasus {
  if (!kasus.peristiwa?.length) return kasus;
  const almarhum = [kasus.graf.idPewaris, ...kasus.urutanWafat];
  let dikandung = { ...(kasus.dikandungSetelahWafat ?? {}) };
  let pernikahan = kasus.graf.pernikahan;
  for (const e of kasus.peristiwa) {
    if (!almarhum.includes(e.sesudahWafat)) continue;
    // [R13-1] lahir (dikandung) sesudah X wafat → bukan ahli waris X.
    if (e.jenis === 'lahir') dikandung = { ...dikandung, [e.idOrang]: e.sesudahWafat };
    // ponytail: cerai dari linimasa = talak bain tanpa menanyakan iddah; iddah ditanyakan lewat keadaan "Sudah bercerai".
    if (e.jenis === 'cerai') {
      pernikahan = pernikahan.map(n => ((n.idSuami === e.idOrang && n.idIstri === e.idPasangan) || (n.idIstri === e.idOrang && n.idSuami === e.idPasangan)
        ? { ...n, status: 'talakBain' } : n));
    }
  }
  return { ...kasus, dikandungSetelahWafat: dikandung, graf: { ...kasus.graf, pernikahan } };
}

export const turunkanDariWaktu = (kasus: Kasus): Kasus => terapkanPeristiwa(urutkanMenurutTahun(kasus));
```

Di `keadaan.ts`: import `turunkanDariWaktu` dari `'./silsilah'`, lalu di `case 'UBAH_KASUS'` ganti `rapikanKeadaan(aksi.ubah(keadaan.kasus))` dengan `rapikanKeadaan(turunkanDariWaktu(aksi.ubah(keadaan.kasus)))`.

Catatan: peristiwa `nikah` sengaja tidak mengubah graf. Pernikahan sesudah seseorang wafat tidak mengubah ahli waris orang itu; peristiwa ini hanya untuk kisah.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/silsilah.test.ts src/__tests__/keadaan.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/silsilah.ts apps/web/src/keadaan.ts apps/web/src/__tests__/silsilah.test.ts apps/web/src/__tests__/keadaan.test.ts
git commit -m "feat(web): silsilah.ts menurunkan urutan wafat dari tahun dan dikandung/cerai dari peristiwa; dipanggil di UBAH_KASUS"
```

---

### Task 4: `ujiHipotetis.ts` dan graf contoh tes

**Files:**
- Create: `apps/web/src/__tests__/fixtures/kanvas.ts`
- Create: `apps/web/src/ujiHipotetis.ts`
- Test: `apps/web/src/__tests__/ujiHipotetis.test.ts`

**Interfaces:**
- Consumes: `keInputEngine` (`apps/web/src/jalankan.ts`), `tambahAhliWaris` (`apps/web/src/checklist.ts`), `hitungMunasakhat`, `hitungDzawilArham` (`@waris/engine`).
- Produces:
  ```ts
  export function menerima(kasus: Kasus, id: IdOrang, mayitKonteks?: IdOrang): boolean;
  export function posisiPerluDitanya(kasus: Kasus, idMayit: IdOrang, kunci: KunciAhliWaris, opsi?: { idInduk?: IdOrang }): boolean;
  export function urutanBerpengaruh(kasus: Kasus, id: IdOrang): boolean;
  // fixtures/kanvas.ts
  export function tambah(kasus: Kasus, idMayit: IdOrang, kunci: KunciAhliWaris, ubah?: Partial<Orang>): { kasus: Kasus; id: IdOrang };
  export function keluargaKarto(): { kasus: Kasus; sumi; slamet; budi; rina; ayah; dewi; andi; sari: IdOrang };
  export function keluargaBudi(kakekHidup?: boolean): { kasus: Kasus; ayah; ibu; andi; rina: IdOrang; kakek?: IdOrang };
  ```

- [ ] **Step 1: Tulis graf contoh dan tes yang gagal**

`apps/web/src/__tests__/fixtures/kanvas.ts`:

```ts
// Graf contoh kanvas silsilah (spec 11.1), dibangun lewat checklist seperti isian pengguna.
// Angkanya cocok dengan packages/engine/src/__tests__/kanvasSilsilah.test.ts.
import type { IdOrang, KunciAhliWaris, Orang } from '@waris/engine';
import { tambahAhliWaris, ubahOrang } from '../../checklist';
import { kasusBaru, type Kasus } from '../../kasus';

export function tambah(kasus: Kasus, idMayit: IdOrang, kunci: KunciAhliWaris, ubah: Partial<Orang> = {}): { kasus: Kasus; id: IdOrang } {
  const graf = tambahAhliWaris(kasus.graf, idMayit, kunci);
  const id = Object.keys(graf.orang).find(x => !kasus.graf.orang[x] && !graf.orang[x]!.penghubung)!;
  return { kasus: { ...kasus, graf: ubahOrang(graf, id, ubah) }, id };
}

/** Mbah Karto: istri Sumi, anak Slamet (wafat lebih dulu), Budi, Rina; ayah wafat; Budi beristri Dewi, anak Andi & Sari. Urutan wafat: Sumi, Budi. */
export function keluargaKarto() {
  let k = kasusBaru('L');
  let r = tambah(k, 'PEWARIS', 'ISTRI', { nama: 'Mbah Sumi' }); k = r.kasus; const sumi = r.id;
  r = tambah(k, 'PEWARIS', 'ANAK_LK', { nama: 'Slamet', statusHidup: 'wafat', idIbu: sumi }); k = r.kasus; const slamet = r.id;
  r = tambah(k, 'PEWARIS', 'ANAK_LK', { nama: 'Budi', idIbu: sumi }); k = r.kasus; const budi = r.id;
  r = tambah(k, 'PEWARIS', 'ANAK_PR', { nama: 'Rina', idIbu: sumi }); k = r.kasus; const rina = r.id;
  r = tambah(k, 'PEWARIS', 'AYAH', { statusHidup: 'wafat' }); k = r.kasus; const ayah = r.id;
  r = tambah(k, budi, 'ISTRI', { nama: 'Dewi' }); k = r.kasus; const dewi = r.id;
  r = tambah(k, budi, 'ANAK_LK', { nama: 'Andi', idIbu: dewi }); k = r.kasus; const andi = r.id;
  r = tambah(k, budi, 'ANAK_PR', { nama: 'Sari', idIbu: dewi }); k = r.kasus; const sari = r.id;
  return { kasus: { ...k, urutanWafat: [sumi, budi] }, sumi, slamet, budi, rina, ayah, dewi, andi, sari };
}

/** Budi tak menikah; ayah wafat lebih dulu; ibu; saudara kandung Andi dan Rina; opsional kakek hidup. */
export function keluargaBudi(kakekHidup = false) {
  let k = { ...kasusBaru('L'), graf: ubahOrang(kasusBaru('L').graf, 'PEWARIS', { nama: 'Budi' }) };
  let r = tambah(k, 'PEWARIS', 'AYAH', { statusHidup: 'wafat' }); k = r.kasus; const ayah = r.id;
  r = tambah(k, 'PEWARIS', 'IBU'); k = r.kasus; const ibu = r.id;
  r = tambah(k, 'PEWARIS', 'SAUDARA_KANDUNG', { nama: 'Andi' }); k = r.kasus; const andi = r.id;
  r = tambah(k, 'PEWARIS', 'SAUDARI_KANDUNG', { nama: 'Rina' }); k = r.kasus; const rina = r.id;
  let kakek: IdOrang | undefined;
  if (kakekHidup) { r = tambah(k, 'PEWARIS', 'KAKEK'); k = r.kasus; kakek = r.id; }
  return { kasus: k, ayah, ibu, andi, rina, ...(kakek ? { kakek } : {}) };
}
```

`apps/web/src/__tests__/ujiHipotetis.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ubahOrang } from '../checklist';
import { menerima, posisiPerluDitanya, urutanBerpengaruh } from '../ujiHipotetis';
import { keluargaBudi, keluargaKarto, tambah } from './fixtures/kanvas';
import { kasusBaru } from '../kasus';

describe('ujiHipotetis (spec kanvas 9.3)', () => {
  it('graf contoh: anak Karto beribu Sumi, Andi & Sari menerima di akhir', () => {
    const { kasus, budi, sumi, andi, rina, slamet } = keluargaKarto();
    expect(kasus.graf.orang[budi]!.idIbu).toBe(sumi);
    expect(menerima(kasus, andi)).toBe(true);
    expect(menerima(kasus, rina)).toBe(true);
    expect(menerima(kasus, slamet)).toBe(false);
  });

  it('saudara Karto tidak ditanya: ada anak laki-laki [R06-4]', () => {
    expect(posisiPerluDitanya(keluargaKarto().kasus, 'PEWARIS', 'SAUDARA_KANDUNG')).toBe(false);
  });

  it('kakek Karto ditanya: ayah sudah wafat', () => {
    expect(posisiPerluDitanya(keluargaKarto().kasus, 'PEWARIS', 'KAKEK')).toBe(true);
  });

  it('cucu dari Slamet (wafat lebih dulu) tidak ditanya: Budi masih hidup saat Karto wafat', () => {
    const { kasus, slamet } = keluargaKarto();
    expect(posisiPerluDitanya(kasus, 'PEWARIS', 'CUCU_LK', { idInduk: slamet })).toBe(false);
  });

  it('Budi tak menikah: paman tidak ditanya (ada saudara laki-laki), kakek ditanya (muqasamah) [R08-1]', () => {
    const { kasus } = keluargaBudi();
    expect(posisiPerluDitanya(kasus, 'PEWARIS', 'PAMAN_KANDUNG')).toBe(false);
    expect(posisiPerluDitanya(kasus, 'PEWARIS', 'KAKEK')).toBe(true);
  });

  it('posisi yang sudah penuh (kakek sudah diisi) tidak ditanya lagi', () => {
    expect(posisiPerluDitanya(keluargaBudi(true).kasus, 'PEWARIS', 'KAKEK')).toBe(false);
  });

  it('orang belum pasti → tetap ditanya (uji tidak dipercaya)', () => {
    const { kasus, budi } = keluargaKarto();
    const ragu = { ...kasus, graf: ubahOrang(kasus.graf, budi, { statusHidup: 'tidakDiketahui' }) };
    expect(posisiPerluDitanya(ragu, 'PEWARIS', 'SAUDARA_KANDUNG')).toBe(true);
  });

  it('urutan Sumi–Budi berpengaruh (fixture A vs A2)', () => {
    const { kasus, sumi } = keluargaKarto();
    expect(urutanBerpengaruh(kasus, sumi)).toBe(true);
  });

  it('urutan dua anak yang masing-masing punya anak laki-laki tidak berpengaruh', () => {
    let k = kasusBaru('L');
    let r = tambah(k, 'PEWARIS', 'ANAK_LK'); k = r.kasus; const b1 = r.id;
    r = tambah(k, 'PEWARIS', 'ANAK_LK'); k = r.kasus; const b2 = r.id;
    r = tambah(k, b1, 'ANAK_LK'); k = r.kasus;
    r = tambah(k, b2, 'ANAK_LK'); k = r.kasus;
    expect(urutanBerpengaruh({ ...k, urutanWafat: [b1, b2] }, b1)).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/ujiHipotetis.test.ts`
Expected: FAIL (`../ujiHipotetis` tidak ada).

- [ ] **Step 3: Implementasi `ujiHipotetis.ts`**

```ts
// Uji hipotetis (spec kanvas silsilah 9.3): UI bertanya ke engine "kalau ada orang di posisi ini / kalau urutannya begini,
// apakah hasilnya berubah?" supaya hanya pertanyaan yang berpengaruh yang ditanyakan. Aturan hajb tetap di engine.
// Hasil engine yang tidak OK, galat, atau kasus yang memuat orang belum pasti = "tetap tanya" (aman).

import { hitungDzawilArham, hitungMunasakhat, type IdOrang, type KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from './checklist';
import { keInputEngine } from './jalankan';
import type { Kasus } from './kasus';

// ponytail: uji di kasus yang memuat orang belum pasti selalu "tanya"; bisa diperhalus dengan hitungTaqdir per dunia.
const adaBelumPasti = (kasus: Kasus) => Object.values(kasus.graf.orang)
  .some(o => !o.penghubung && (o.statusHidup === 'tidakDiketahui' || o.statusHidup === 'mafqud' || o.statusHidup === 'dalamKandungan' || !!o.khuntsa));

/** Apakah `id` menerima saham. Bila `mayitKonteks` punya sisa yang keluar ke dzawil arham, kerabat jauhnya dianggap berpengaruh. */
export function menerima(kasus: Kasus, id: IdOrang, mayitKonteks?: IdOrang): boolean {
  if (adaBelumPasti(kasus)) return true;
  try {
    const dasar = keInputEngine(kasus);
    if (kasus.urutanWafat.length === 0) {
      const hasil = hitungDzawilArham(dasar);
      if (hasil.status !== 'OK') return true;
      return hasil.tabel.baris.some(baris => (baris.perOrang[id]?.saham ?? 0n) > 0n);
    }
    const hasil = hitungMunasakhat({ dasar, urutanWafat: kasus.urutanWafat, ...(kasus.dikandungSetelahWafat ? { dikandungSetelahWafat: kasus.dikandungSetelahWafat } : {}) });
    if (hasil.status !== 'OK') return true;
    return (hasil.saham[id] ?? 0n) > 0n
      || hasil.daftarLangkah.some(langkah => langkah.hasil.tabel.baris.some(baris => (baris.perOrang[id]?.saham ?? 0n) > 0n))
      || (mayitKonteks !== undefined && hasil.sisaKeluar.some(sisa => sisa.mayit === mayitKonteks));
  } catch {
    return true;
  }
}

/** Posisi `kunci` (dari sisi `idMayit`) perlu ditanyakan bila orang hipotetis di posisi itu akan menerima sesuatu. */
export function posisiPerluDitanya(kasus: Kasus, idMayit: IdOrang, kunci: KunciAhliWaris, opsi: { idInduk?: IdOrang } = {}): boolean {
  let graf;
  try { graf = tambahAhliWaris(kasus.graf, idMayit, kunci, opsi); } catch { return false; }   // posisi sudah penuh = sudah diisi
  const idBaru = Object.keys(graf.orang).find(id => !kasus.graf.orang[id] && !graf.orang[id]!.penghubung);
  if (!idBaru) return true;
  return menerima({ ...kasus, graf }, idBaru, idMayit);
}

/** Apakah posisi `id` di urutan wafat mengubah saham akhir. Semua posisi dicoba (urutan wafat biasanya pendek). */
export function urutanBerpengaruh(kasus: Kasus, id: IdOrang): boolean {
  const tanpa = kasus.urutanWafat.filter(x => x !== id);
  const sidik = new Set<string>();
  for (let posisi = 0; posisi <= tanpa.length; posisi++) {
    const s = sidikSaham({ ...kasus, urutanWafat: [...tanpa.slice(0, posisi), id, ...tanpa.slice(posisi)] });
    if (s === null) return true;
    sidik.add(s);
    if (sidik.size > 1) return true;
  }
  return false;
}

function sidikSaham(kasus: Kasus): string | null {
  if (adaBelumPasti(kasus)) return null;
  try {
    const hasil = hitungMunasakhat({ dasar: keInputEngine(kasus), urutanWafat: kasus.urutanWafat,
      ...(kasus.dikandungSetelahWafat ? { dikandungSetelahWafat: kasus.dikandungSetelahWafat } : {}) });
    if (hasil.status !== 'OK') return null;
    // Saham dinormalkan terhadap jami'ah supaya dua urutan dengan jami'ah berbeda tetap bisa dibandingkan.
    const fpb = (a: bigint, b: bigint): bigint => (b === 0n ? a : fpb(b, a % b));
    return JSON.stringify(Object.entries(hasil.saham).filter(([, s]) => s > 0n).sort(([a], [b]) => a.localeCompare(b))
      .map(([orang, s]) => { const g = fpb(s, hasil.jamiah); return [orang, `${s / g}/${hasil.jamiah / g}`]; }));
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/ujiHipotetis.test.ts`
Expected: PASS. Bila tes "graf contoh" gagal karena `tambahAhliWaris` membuat ibu penghubung baru, perbaikannya di `fixtures/kanvas.ts` (pakai `ubahOrang` untuk `idIbu`, seperti sekarang), **bukan** di `ujiHipotetis.ts`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/ujiHipotetis.ts apps/web/src/__tests__/ujiHipotetis.test.ts apps/web/src/__tests__/fixtures/kanvas.ts
git commit -m "feat(web): uji hipotetis (posisi/urutan berpengaruh) lewat engine; graf contoh kanvas untuk tes"
```

---

### Task 5: `kelompok.ts`: daftar bagian wawancara

**Files:**
- Create: `apps/web/src/kelompok.ts`
- Test: `apps/web/src/__tests__/kelompok.test.ts`

**Interfaces:**
- Consumes: `posisiPerluDitanya` (Tugas 4), `hitungIsian` (`checklist.ts`), `Kasus`, `Kelompok`, `KELOMPOK` (Tugas 2).
- Produces:
  ```ts
  export type JenisBagian = Kelompok | 'urutan' | 'kamu';
  export interface Bagian { id: string; milik: IdOrang; jenis: JenisBagian }   // id = `${jenis}:${milik}`, kecuali 'urutan' dan 'kamu'
  export function daftarBagian(kasus: Kasus): Bagian[];
  export function anggotaBagian(kasus: Kasus, bagian: Bagian): IdOrang[];
  export function bagianLengkap(kasus: Kasus, bagian: Bagian): boolean;
  ```
- `bagianLengkap` untuk jenis `'urutan'` memakai `pertanyaanUrutanBerikut` (Tugas 6). Supaya tidak ada import melingkar, `kelompok.ts` mengimpor dari `antreanUrutan.ts`. Tugas 6 dikerjakan sesudah tugas ini, jadi di tugas ini `'urutan'` sementara dianggap lengkap bila `kasus.urutanWafat.length < 2`. Tugas 6 menggantinya.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
import { describe, expect, it } from 'vitest';
import { kasusBaru, type Kasus } from '../kasus';
import { anggotaBagian, bagianLengkap, daftarBagian } from '../kelompok';
import { keluargaBudi, keluargaKarto } from './fixtures/kanvas';

const ids = (kasus: Kasus) => daftarBagian(kasus).map(b => b.id);

describe('kelompok (spec kanvas 5.2)', () => {
  it('kasus kosong: pasangan, anak, orang tua, hal lain, kamu', () => {
    expect(ids(kasusBaru('L'))).toEqual(['pasangan:PEWARIS', 'anak:PEWARIS', 'orangTua:PEWARIS', 'halLain:PEWARIS', 'kamu']);
  });

  it('Karto: kakek-nenek muncul (ayah wafat), saudara tidak (ada anak lk); cabang Sumi dan Budi; urutan', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const k: Kasus = { ...kasus, kelompokDijawab: { PEWARIS: ['pasangan', 'anak', 'orangTua'] } };
    expect(ids(k)).toEqual([
      'pasangan:PEWARIS', 'anak:PEWARIS', 'orangTua:PEWARIS', 'kakekNenek:PEWARIS', 'halLain:PEWARIS',
      `anakBersama:${sumi}`, `orangTua:${sumi}`, `halLain:${sumi}`,
      `pasangan:${budi}`, `anak:${budi}`, `halLain:${budi}`,
      'urutan', 'kamu',
    ]);
  });

  it('Budi tak menikah: saudara muncul sesudah anak dijawab; kerabat jauh tidak (ada saudara lk)', () => {
    const { kasus } = keluargaBudi();
    const k: Kasus = { ...kasus, kelompokDijawab: { PEWARIS: ['pasangan', 'anak', 'orangTua', 'kakekNenek'] } };
    expect(ids(k)).toContain('saudara:PEWARIS');
    expect(ids(k)).not.toContain('jauh:PEWARIS');
  });

  it('bagian yang sudah berisi tetap tampil walau tidak lagi "perlu ditanya" (kakek sudah diisi)', () => {
    const { kasus } = keluargaBudi(true);
    expect(ids(kasus)).toContain('kakekNenek:PEWARIS');
  });

  it('anggota bagian: anak Karto, orang tua Karto', () => {
    const { kasus, slamet, budi, rina, ayah } = keluargaKarto();
    const bagian = daftarBagian(kasus);
    expect(new Set(anggotaBagian(kasus, bagian.find(b => b.id === 'anak:PEWARIS')!))).toEqual(new Set([slamet, budi, rina]));
    expect(anggotaBagian(kasus, bagian.find(b => b.id === 'orangTua:PEWARIS')!)).toEqual([ayah]);
  });

  it('bagianLengkap: perlu dijawab, dan tidak ada anggota yang belum diisi', () => {
    const { kasus, budi } = keluargaKarto();
    const anak = daftarBagian(kasus).find(b => b.id === 'anak:PEWARIS')!;
    expect(bagianLengkap(kasus, anak)).toBe(false);
    const dijawab: Kasus = { ...kasus, kelompokDijawab: { PEWARIS: ['anak'] } };
    expect(bagianLengkap(dijawab, anak)).toBe(true);
    expect(bagianLengkap({ ...dijawab, belumDiisi: [budi] }, anak)).toBe(false);
  });

  it('bagian kamu lengkap bila saya dijawab, termasuk null', () => {
    const kamu = { id: 'kamu', milik: 'PEWARIS', jenis: 'kamu' as const };
    expect(bagianLengkap(kasusBaru('L'), kamu)).toBe(false);
    expect(bagianLengkap({ ...kasusBaru('L'), saya: null }, kamu)).toBe(true);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/kelompok.test.ts`
Expected: FAIL (`../kelompok` tidak ada).

- [ ] **Step 3: Implementasi `kelompok.ts`**

```ts
// Bagian wawancara kanvas silsilah (spec 5.2): untuk tiap almarhum, kelompok keluarga yang ditanyakan berurutan.
// Menerima Kasus; menyerahkan daftar bagian, anggota tiap bagian, dan apakah bagian sudah lengkap.
// Bagian tampil bila sudah berisi, sudah dijawab, atau engine menyatakan posisinya berpengaruh (ujiHipotetis).

import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import { hitungIsian } from './checklist';
import type { Kasus, Kelompok } from './kasus';
import { posisiPerluDitanya } from './ujiHipotetis';

export type JenisBagian = Kelompok | 'urutan' | 'kamu';
export interface Bagian { id: string; milik: IdOrang; jenis: JenisBagian }

const KUNCI: Partial<Record<Kelompok, KunciAhliWaris[]>> = {
  kakekNenek: ['KAKEK', 'NENEK_DARI_AYAH', 'NENEK_DARI_IBU'],
  saudara: ['SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU'],
  jauh: ['KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK', 'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'],
};

const bagian = (jenis: JenisBagian, milik: IdOrang): Bagian => ({ id: `${jenis}:${milik}`, milik, jenis });
const dijawab = (kasus: Kasus, milik: IdOrang, jenis: Kelompok) => !!kasus.kelompokDijawab?.[milik]?.includes(jenis);
const nyata = (kasus: Kasus, id: IdOrang | undefined): id is IdOrang => !!id && !!kasus.graf.orang[id] && !kasus.graf.orang[id]!.penghubung;
const pasanganDari = (kasus: Kasus, id: IdOrang) => kasus.graf.pernikahan.flatMap(n => (n.idSuami === id ? [n.idIstri] : n.idIstri === id ? [n.idSuami] : []));

export function daftarBagian(kasus: Kasus): Bagian[] {
  const P = kasus.graf.idPewaris;
  const hasil: Bagian[] = [...bagianPewaris(kasus, P)];
  for (const id of kasus.urutanWafat) {
    // Cabang: orang yang wafat sesudah pemilik, sebelum harta dibagi (spec 5.2).
    const jenis: JenisBagian[] = pasanganDari(kasus, P).includes(id) ? ['anakBersama', 'orangTua', 'halLain'] : ['pasangan', 'anak', 'halLain'];
    hasil.push(...jenis.map(j => bagian(j, id)));
  }
  if (kasus.urutanWafat.length >= 2) hasil.push({ id: 'urutan', milik: P, jenis: 'urutan' });
  hasil.push({ id: 'kamu', milik: P, jenis: 'kamu' });
  return hasil;
}

function bagianPewaris(kasus: Kasus, P: IdOrang): Bagian[] {
  const tampil = (jenis: Kelompok, relevan: () => boolean) =>
    anggotaBagian(kasus, bagian(jenis, P)).length > 0 || dijawab(kasus, P, jenis) || relevan();
  const isian = hitungIsian(kasus.graf, P);
  const ayah = isian.AYAH?.[0], ibu = isian.IBU?.[0];
  const wafat = (id: IdOrang | undefined) => !!id && kasus.graf.orang[id]!.statusHidup === 'wafat';
  const daftar: Bagian[] = [bagian('pasangan', P), bagian('anak', P), bagian('orangTua', P)];
  if (tampil('kakekNenek', () => (wafat(ayah) && posisiPerluDitanya(kasus, P, 'KAKEK'))
    || (wafat(ibu) && (posisiPerluDitanya(kasus, P, 'NENEK_DARI_IBU') || posisiPerluDitanya(kasus, P, 'NENEK_DARI_AYAH'))))) daftar.push(bagian('kakekNenek', P));
  const saudaraTampil = tampil('saudara', () => dijawab(kasus, P, 'anak') && posisiPerluDitanya(kasus, P, 'SAUDARA_KANDUNG'));
  if (saudaraTampil) daftar.push(bagian('saudara', P));
  if (tampil('jauh', () => dijawab(kasus, P, 'anak') && (!saudaraTampil || dijawab(kasus, P, 'saudara')) && posisiPerluDitanya(kasus, P, 'PAMAN_KANDUNG'))) {
    daftar.push(bagian('jauh', P));
  }
  daftar.push(bagian('halLain', P));
  return daftar;
}

export function anggotaBagian(kasus: Kasus, b: Bagian): IdOrang[] {
  const { graf } = kasus;
  switch (b.jenis) {
    case 'pasangan': return pasanganDari(kasus, b.milik).filter(id => nyata(kasus, id));
    case 'anak': return Object.values(graf.orang).filter(o => (o.idAyah === b.milik || o.idIbu === b.milik) && !o.penghubung).map(o => o.id);
    case 'anakBersama': return Object.values(graf.orang).filter(o => o.idAyah === graf.idPewaris || o.idIbu === graf.idPewaris).filter(o => !o.penghubung).map(o => o.id);
    case 'orangTua': return [graf.orang[b.milik]?.idAyah, graf.orang[b.milik]?.idIbu].filter((id): id is IdOrang => nyata(kasus, id));
    case 'kakekNenek': case 'saudara': case 'jauh': {
      const isian = hitungIsian(graf, b.milik);
      return (KUNCI[b.jenis] ?? []).flatMap(k => isian[k] ?? []).filter(id => nyata(kasus, id));
    }
    case 'halLain': case 'urutan': case 'kamu': return [];
  }
}

export function bagianLengkap(kasus: Kasus, b: Bagian): boolean {
  if (b.jenis === 'kamu') return kasus.saya !== undefined;
  if (b.jenis === 'urutan') return kasus.urutanWafat.length < 2;   // diganti di Tugas 6
  if (!dijawab(kasus, b.milik, b.jenis)) return false;
  const belum = new Set(kasus.belumDiisi ?? []);
  return anggotaBagian(kasus, b).every(id => !belum.has(id));
}
```

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/kelompok.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/kelompok.ts apps/web/src/__tests__/kelompok.test.ts
git commit -m "feat(web): kelompok.ts: daftar bagian wawancara per almarhum (tampil lewat uji hipotetis), anggota, dan kelengkapan"
```

---

### Task 6: `antreanUrutan.ts`: pertanyaan urutan wafat

**Files:**
- Create: `apps/web/src/antreanUrutan.ts`
- Modify: `apps/web/src/kelompok.ts` (`bagianLengkap` untuk `'urutan'`)
- Test: `apps/web/src/__tests__/antreanUrutan.test.ts`

**Interfaces:**
- Consumes: `bandingTanggal` (Tugas 3), `urutanBerpengaruh` (Tugas 4), `mulaiSisip`, `posisiAkhir`, `Sisipan` (`apps/web/src/urutan.ts`).
- Produces:
  ```ts
  export function orangUrutanBelumPasti(kasus: Kasus): IdOrang[];
  export function pertanyaanUrutanBerikut(kasus: Kasus): { orang: IdOrang; sisipan: Sisipan } | null;
  export function selesaikanUrutan(kasus: Kasus, orang: IdOrang, sisipan: Sisipan): Kasus;
  export function tundaUrutan(kasus: Kasus, orang: IdOrang, pembanding: IdOrang, bersamaan?: boolean): Kasus;
  ```
  Cara memakai di UI (rencana 2): ambil `pertanyaanUrutanBerikut`. Selama `pembanding(sisipan)` tidak null, tanyakan "{orang} wafat sebelum atau sesudah {pembanding}?" lalu `jawabSisip`. Sesudah itu panggil `selesaikanUrutan`. Jawaban "Belum tahu" → `tundaUrutan`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
import { describe, expect, it } from 'vitest';
import { orangUrutanBelumPasti, pertanyaanUrutanBerikut, selesaikanUrutan, tundaUrutan } from '../antreanUrutan';
import { bagianLengkap } from '../kelompok';
import type { Kasus } from '../kasus';
import { jawabSisip, pembanding } from '../urutan';
import { keluargaKarto } from './fixtures/kanvas';

const tahun = (t: number) => ({ wafat: { tahun: t, kiraKira: false } });

describe('antreanUrutan (spec kanvas 5.6)', () => {
  it('Sumi tanpa tahun, Budi 1998: Sumi ditanya dulu, dibanding Budi', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const k: Kasus = { ...kasus, waktu: { [budi]: tahun(1998) } };
    const q = pertanyaanUrutanBerikut(k)!;
    expect(q.orang).toBe(sumi);
    expect(pembanding(q.sisipan)).toBe(budi);
  });

  it('dijawab "sebelum Budi" → urutan [Sumi, Budi], tidak ada pertanyaan lagi, bagian urutan lengkap', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const k: Kasus = { ...kasus, waktu: { [budi]: tahun(1998) } };   // urutan awal [Sumi, Budi]
    const q = pertanyaanUrutanBerikut(k)!;
    expect(q.orang).toBe(sumi);
    expect(selesaikanUrutan(k, q.orang, jawabSisip(q.sisipan, false)).urutanWafat).toEqual([budi, sumi]);   // "sesudah Budi"
    const selesai = selesaikanUrutan(k, q.orang, jawabSisip(q.sisipan, true));                               // "sebelum Budi"
    expect(selesai.urutanWafat).toEqual([sumi, budi]);
    expect(selesai.urutanDijawab).toEqual([sumi]);
    expect(pertanyaanUrutanBerikut(selesai)).toBeNull();
    expect(bagianLengkap(selesai, { id: 'urutan', milik: 'PEWARIS', jenis: 'urutan' })).toBe(true);
  });

  it('semua bertahun → tidak ada pertanyaan', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    expect(pertanyaanUrutanBerikut({ ...kasus, waktu: { [sumi]: tahun(1990), [budi]: tahun(1998) } })).toBeNull();
  });

  it('"Belum tahu" → belumPasti urutan, tidak ditanya lagi', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const ditunda = tundaUrutan(kasus, sumi, budi);
    expect(ditunda.belumPasti).toEqual([{ jenis: 'urutan', a: sumi, b: budi, bersamaan: false }]);
    expect(orangUrutanBelumPasti(ditunda)).toEqual([]);
  });

  it('urutan yang tidak berpengaruh tidak ditanya', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    // Tanpa Budi di urutan: hanya Sumi, tidak ada yang dibandingkan.
    expect(orangUrutanBelumPasti({ ...kasus, urutanWafat: [sumi] })).toEqual([]);
    expect(budi).toBeTruthy();
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/antreanUrutan.test.ts`
Expected: FAIL (`../antreanUrutan` tidak ada).

- [ ] **Step 3: Implementasi**

`apps/web/src/antreanUrutan.ts`:

```ts
// Antrean pertanyaan urutan wafat (spec kanvas 5.6). Menerima Kasus; menyerahkan orang yang posisinya di urutan wafat
// belum pasti (tanpa tahun pembanding, belum dijawab, belum ditunda) dan yang urutannya mengubah hasil.
// Pertanyaannya berpasangan dengan pencarian biner (urutan.ts), jadi n orang ≈ log₂(n+1) pertanyaan.

import type { IdOrang } from '@waris/engine';
import type { Kasus } from './kasus';
import { bandingTanggal } from './silsilah';
import { urutanBerpengaruh } from './ujiHipotetis';
import { mulaiSisip, posisiAkhir, type Sisipan } from './urutan';

function pasanganBelumPasti(kasus: Kasus, a: IdOrang, b: IdOrang): boolean {
  if (bandingTanggal(kasus.waktu?.[a]?.wafat, kasus.waktu?.[b]?.wafat) !== null) return false;
  const dijawab = new Set(kasus.urutanDijawab ?? []);
  if (dijawab.has(a) || dijawab.has(b)) return false;
  return !(kasus.belumPasti ?? []).some(h => h.jenis === 'urutan' && ((h.a === a && h.b === b) || (h.a === b && h.b === a)));
}

export function orangUrutanBelumPasti(kasus: Kasus): IdOrang[] {
  return kasus.urutanWafat.filter(a => kasus.urutanWafat.some(b => b !== a && pasanganBelumPasti(kasus, a, b)) && urutanBerpengaruh(kasus, a));
}

export function pertanyaanUrutanBerikut(kasus: Kasus): { orang: IdOrang; sisipan: Sisipan } | null {
  const [orang] = orangUrutanBelumPasti(kasus);
  if (!orang) return null;
  const tanpa: Kasus = { ...kasus, urutanWafat: kasus.urutanWafat.filter(id => id !== orang) };
  return { orang, sisipan: mulaiSisip(tanpa, kasus.graf.idPewaris) };
}

export function selesaikanUrutan(kasus: Kasus, orang: IdOrang, sisipan: Sisipan): Kasus {
  const urutanWafat = kasus.urutanWafat.filter(id => id !== orang);
  urutanWafat.splice(posisiAkhir(sisipan), 0, orang);
  return { ...kasus, urutanWafat, urutanDijawab: [...new Set([...(kasus.urutanDijawab ?? []), orang])] };
}

export function tundaUrutan(kasus: Kasus, orang: IdOrang, pembanding: IdOrang, bersamaan = false): Kasus {
  return { ...kasus, belumPasti: [...(kasus.belumPasti ?? []), { jenis: 'urutan', a: orang, b: pembanding, bersamaan }] };
}
```

Di `kelompok.ts`: import `pertanyaanUrutanBerikut` dari `'./antreanUrutan'`, lalu ganti baris `'urutan'` di `bagianLengkap`:

```ts
  if (b.jenis === 'urutan') return pertanyaanUrutanBerikut(kasus) === null;
```

- [ ] **Step 4: Jalankan tes urutan dan kelompok**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/antreanUrutan.test.ts src/__tests__/kelompok.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/antreanUrutan.ts apps/web/src/kelompok.ts apps/web/src/__tests__/antreanUrutan.test.ts
git commit -m "feat(web): antreanUrutan.ts: pertanyaan urutan wafat berpasangan hanya bila berpengaruh; belum tahu → belumPasti"
```

---

### Task 7: Tata letak pohon: pasangan selalu menempel

**Files:**
- Modify: `apps/web/src/hasil/tataLetak.ts` (baris pewaris: kerabat di kiri dirapikan berpasangan)
- Test: `apps/web/src/__tests__/tataLetak.test.ts`

**Interfaces:**
- Consumes: `tataLetak(graf): TataLetak` (sudah ada).
- Produces: invarian "pasangan bersebelahan" (spec 8) yang dipakai rencana 2 (pohon samping) dan rencana 4 (pohon kecil kisah).

- [ ] **Step 1: Tulis tes yang gagal**

Tambahkan di `tataLetak.test.ts`:

```ts
/** Di antara dua orang yang menikah dalam satu baris hanya boleh ada pasangan lain dari salah satunya (poligami). */
function pasanganTidakMenempel(graf: GrafKeluarga, baris: string[][]): string[] {
  const salah: string[] = [];
  const pasanganDari = (id: string) => graf.pernikahan.flatMap(n => (n.idSuami === id ? [n.idIstri] : n.idIstri === id ? [n.idSuami] : []));
  for (const nikah of graf.pernikahan) for (const deret of baris) {
    const i = deret.indexOf(nikah.idSuami), j = deret.indexOf(nikah.idIstri);
    if (i < 0 || j < 0) continue;
    const boleh = new Set([...pasanganDari(nikah.idSuami), ...pasanganDari(nikah.idIstri)]);
    if (deret.slice(Math.min(i, j) + 1, Math.max(i, j)).some(x => !boleh.has(x))) salah.push(`${nikah.idSuami}–${nikah.idIstri}`);
  }
  return salah;
}

it('invarian spec 8: pasangan menempel, juga saudara yang beristri di baris pewaris', () => {
  let graf = bangun('L', ['ISTRI', 'AYAH', 'IBU', 'SAUDARA_KANDUNG', 'SAUDARA_KANDUNG', 'ANAK_LK']);
  const [s1, s2] = hitungIsian(graf, 'PEWARIS').SAUDARA_KANDUNG!;
  graf = tambahAhliWaris(graf, s1!, 'ISTRI');
  graf = tambahAhliWaris(graf, s2!, 'ISTRI');
  const anak = id(graf, 'ANAK_LK');
  graf = tambahAhliWaris(graf, anak, 'ISTRI');
  expect(pasanganTidakMenempel(graf, tataLetak(graf).baris)).toEqual([]);
});

it('invarian spec 8: dua istri pewaris tetap menempel pada pewaris', () => {
  const graf = bangun('L', ['ISTRI', 'ISTRI', 'SAUDARA_KANDUNG', 'AYAH']);
  expect(pasanganTidakMenempel(graf, tataLetak(graf).baris)).toEqual([]);
});
```

- [ ] **Step 2: Jalankan tes**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/tataLetak.test.ts`
Expected: tes pertama FAIL. Istri saudara bisa terpisah dari suaminya karena `lainnya` di baris pewaris diurutkan tanpa `rapikanPasangan`. Tes kedua kemungkinan PASS.

- [ ] **Step 3: Perbaiki `tataLetak.ts`**

Di `tataLetak`, rapikan `lainnya` berpasangan di kedua tempat:

```ts
  const lainnya = barisPewaris.filter(id => id !== graf.idPewaris && !pasanganPewaris.includes(id));
  barisMenurutGenerasi.set(0, [...rapikanPasangan(lainnya, pasanganDari), graf.idPewaris, ...pasanganPewaris]);
```

dan

```ts
  if (atas) barisMenurutGenerasi.set(0, [...rapikanPasangan(urutkanMenurut(lainnya, id => rataRataIndeks(orangTuaDari(id), atas), graf), pasanganDari), graf.idPewaris, ...pasanganPewaris]);
```

- [ ] **Step 4: Jalankan tes tata letak dan seluruh tes web**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/tataLetak.test.ts src/__tests__/tataLetakSeimbang.test.ts && pnpm --filter @waris/web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hasil/tataLetak.ts apps/web/src/__tests__/tataLetak.test.ts
git commit -m "fix(web): tata letak pohon: pasangan saudara di baris pewaris tetap menempel; invarian spec 8 diuji"
```

---

### Task 8: Verifikasi akhir rencana 1

- [ ] **Step 1: Jalankan seluruh tes dan typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: semua PASS.

- [ ] **Step 2: Periksa tidak ada aturan fikih di UI**

Run: `grep -nE "mahjub|hajb|ANAK_LK.*hidup" apps/web/src/kelompok.ts apps/web/src/antreanUrutan.ts apps/web/src/ujiHipotetis.ts`
Expected: tidak ada aturan hajb yang ditulis tangan. Satu-satunya pemutus adalah panggilan engine di `ujiHipotetis.ts`.

---

## Rencana berikutnya (ditulis sesudah rencana 1 selesai, karena memakai API di atas)

| Rencana | Isi (bagian spec) | Bergantung pada |
|---|---|---|
| 2 · Pintu + Almarhum + Kanvas Keluarga | 3, 4, 5 (peta bagian, kartu bagian, baris orang, keadaan sesuai peran + lanjutan, penghitung termasuk kandungan, Hal lain, Kamu, bar bawah, pohon samping), hapus kode Babak, diksi baru | `daftarBagian`, `bagianLengkap`, `pertanyaanUrutanBerikut`, `waktuRelatif`, `tataLetak` |
| 3 · Latihan | 6 (kartu per mayit di atas `LangkahAhliWaris`, urutan wafat, Periksa ringkas) + fixture latihan A (tabel per mayit, jami'ah 72, spec 11.1) | `Kasus.jenisKasus` |
| 4 · Periksa | 7 (belum dipastikan dijawab di tempat, ubah dipandu, kisah per babak dengan pohon kecil, peristiwa) | `turunkanDariWaktu`, `tundaUrutan`, `tataLetak` |
