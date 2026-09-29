# Multi-madzhab untuk Waris Dasar — Rencana Implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Engine bisa menghitung waris dasar menurut [SYF] (default), [HNB], [HNF], dan [MLK]. Titik khilaf mengikuti matriks bab 18. Kasus yang menyentuh titik yang belum dikaji untuk madzhab itu dikembalikan `TIDAK_DIDUKUNG`, bukan dihitung diam-diam dengan aturan [SYF].

**Architecture:** `Ruleset` diperluas menjadi 4 nilai. Tiap ruleset dipetakan ke objek data `AturanMadzhab` (sekumpulan flag, satu per titik matriks). Objek itu dikirim sebagai argumen ke tahap yang memegang keputusannya (derivasi, hajb, bagian). Setelah pipeline selesai, sebuah **gerbang** memeriksa semua rujukan di jejak. Untuk ruleset non-[SYF], setiap token `Rxx-y` harus tercantum "berlaku" di tabel KB 18.4 untuk madzhab itu. Kode `Kxx-y` selalu sah. Pelanggaran → `TIDAK_DIDUKUNG` beserta daftar tokennya.

**Tech Stack:** TypeScript, pnpm workspace, vitest, fast-check (sudah dipakai `packages/math`), bigint.

**Spec:** `docs/kb/18_matriks_khilaf.md` (sumber keputusan fikih), `CLAUDE.md` (prinsip engine), keputusan pengguna 2026-09-29 di bawah.

## Global Constraints

- `docs/kb/00–18` satu-satunya sumber hukum. Aturan yang tidak ada di KB tidak dikarang → `TIDAK_DIDUKUNG`.
- [SYF] default. Hasil [SYF] untuk semua kasus yang ada sekarang **tidak boleh berubah** (regression suite bab 16 + M1–M9 tetap hijau tanpa diubah).
- Tarjih Lahim/Ithraa tidak pernah dipakai sebagai posisi [SYF].
- Setiap cabang fikih baru diberi anotasi rujukan: `// [K04-2] ...` atau `// [R04-10] ...`.
- Eksak: `bigint`/`Pecahan`, tanpa `number` di jalur hitung. Fungsi murni, tanpa I/O, `Date`, `Math.random` (fast-check hanya di tes).
- Nama/komentar bahasa Indonesia, istilah fikih sesuai glosarium bab 15.
- Pelanggaran invarian = `throw`, bukan lanjut diam-diam.
- Commit setelah tiap task, hanya file milik task itu. Pesan commit diakhiri `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- UI web: aksi sekunder berupa teks/tautan, bukan tombol berbingkai. Ikon SVG, bukan emoji.

**Keputusan pengguna 2026-09-29 yang mengikat rencana ini:**
1. Nilai harapan tes per madzhab diturunkan dari sel matriks 18 beserta nukilannya; pengguna mereview.
2. Sisa ke baitul mal menjadi output resmi (bukan `TIDAK_DIDUKUNG`).
3. K02-x (mawani' antar-madzhab) ditunda. Kasus yang menyentuhnya ditolak oleh gerbang.

## Review Focus

1. **Kasus [SYF] lama berubah hasil** karena flag bawaan salah pasang → setiap task yang mengubah tahap menjalankan seluruh suite engine; Task 4 menambah tes "semua fixture bab 16 dengan `ATURAN.syafii` eksplisit = hasil lama".
2. **Kasus non-[SYF] yang diam-diam memakai aturan [SYF]** pada titik yang belum dikaji → gerbang (Task 4), diuji dengan pembunuh (`R02-9`, K02-1 ditunda) di mode [HNB].
3. **Konfigurasi yang tidak sah untuk madzhab**, mis. `kebijakanSisa: 'baitulMal'` di [HNB] atau `talakBainSaatMaradh: 'qaulQadim'` di luar [SYF] → `TIDAK_DIDUKUNG` dengan ref `K09-1`/`K02-3` (Task 4).
4. **Munasakhat dengan ruleset non-[SYF]**: ruleset harus diteruskan ke tiap mayit dan gerbang berlaku per mayit (Task 4, tes M2 mode [HNB]).
5. **File kasus lama tanpa field `ruleset`** dibuka di web → dianggap `syafii`, bukan galat (Task 9).

---

## Peta File

| File | Tanggung jawab |
|---|---|
| `packages/engine/src/__tests__/invarian.property.test.ts` (baru) | Property test invarian pipeline (Task 1) |
| `packages/engine/src/stages/klasifikasi.ts` | Sisa ke baitul mal teratur (Task 2) |
| `packages/engine/src/types.ts` | `Ruleset` 4 nilai, `TujuanSisa`, `PeranAhliWaris.rujukan`, nama kasus khusus baru |
| `docs/kb/18_matriks_khilaf.md` | Bagian baru 18.4: keberlakuan token engine per madzhab (Task 3) |
| `packages/engine/src/rulesets/madzhab.ts` (baru) | `ATURAN`, `rujukanTitik` (Task 4) |
| `packages/engine/src/rulesets/berlaku.ts` (baru) | Salinan tabel 18.4 sebagai konstanta (Task 3/4) |
| `packages/engine/src/rulesets/gerbang.ts` (baru) | `periksaKonfigurasi`, `periksaKeberlakuan` (Task 4) |
| `packages/engine/src/pipeline.ts` | Meneruskan `aturan` + memanggil gerbang (Task 4) |
| `packages/engine/src/stages/derivasi.ts`, `hajb.ts`, `bagian.ts`, `mawani.ts` | Cabang overlay (Task 5–7) |
| `packages/engine/src/__tests__/fixtures/madzhab.ts` (baru) | Kasus uji per madzhab (Task 5–7) |
| `packages/engine/src/__tests__/madzhab.test.ts` (baru) | Tes overlay + gerbang |
| `packages/content/src/refs.ts` | `MATRIKS_KHILAF`, `cariTitikKhilaf`, parser 18.4 (Task 3, 8) |
| `packages/explain/src/cerita.ts`, `arab.ts`, `ringkas.ts` | Narasi baitul mal teratur, musyarrakah tanpa tasyrik, nama madzhab (Task 2, 6, 9) |
| `apps/web/src/kasus.ts`, `jalankan.ts`, `layar/wizard/LangkahPewaris.tsx`, `layar/Hasil.tsx`, `hasil/ringkasan.ts`, `snapshot.json` | Pilihan madzhab + label (Task 2, 9) |

---

### Task 1: Property test invarian pipeline

Jaring pengaman sebelum overlay mengubah hajb dan bagian. Tidak mengubah kode produksi.

**Files:**
- Modify: `packages/engine/package.json` (devDependency `fast-check`)
- Create: `packages/engine/src/__tests__/invarian.property.test.ts`

**Interfaces:**
- Consumes: `hitung` (`pipeline.ts`), `input`, `p` (`__tests__/fixtures/bab16.ts`)
- Produces: `susunGraf(s: Susunan): GrafKeluarga` dan `periksaInvarian(graf, hasil)` — diekspor dari file tes ini, dipakai ulang Task 4–7 untuk menjalankan property yang sama per ruleset.

- [ ] **Step 1: Tambah dependency**

Di `packages/engine/package.json` bagian `devDependencies` tambahkan `"fast-check": "^3.22.0"`, lalu:

Run: `pnpm install`
Expected: selesai tanpa galat.

- [ ] **Step 2: Tulis property test**

```ts
// Property test invarian (CLAUDE.md "Invarian sebagai assertion"): untuk susunan ahli waris acak,
// pipeline tidak boleh throw, dan hasil OK harus memenuhi Σ saham = penyebut akhir, 'aul hanya ke nilai sah [R09-4],
// saham bulat ≥ 0, dan rasio 2:1 dalam kelompok ashabah campuran (bab 10.5).
import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { hitung } from '../pipeline.js';
import type { GrafKeluarga, HasilEngine, Orang, Pernikahan, Ruleset } from '../types.js';
import { input, p } from './fixtures/bab16.js';

export interface Susunan {
  pewarisLk: boolean; pasangan: number; ayah: boolean; ibu: boolean; kakek: boolean; nenekDariIbu: boolean; nenekDariAyah: boolean;
  anakLk: number; anakPr: number; cucuLk: number; cucuPr: number;
  saudaraKandung: number; saudariKandung: number; saudaraSebapak: number; saudariSebapak: number;
  saudaraSeibu: number; saudariSeibu: number; pamanKandung: number;
}

const antara = (max: number) => fc.integer({ min: 0, max });
export const arbSusunan: fc.Arbitrary<Susunan> = fc.record({
  pewarisLk: fc.boolean(), pasangan: antara(4), ayah: fc.boolean(), ibu: fc.boolean(), kakek: fc.boolean(),
  nenekDariIbu: fc.boolean(), nenekDariAyah: fc.boolean(), anakLk: antara(3), anakPr: antara(3), cucuLk: antara(2), cucuPr: antara(2),
  saudaraKandung: antara(3), saudariKandung: antara(3), saudaraSebapak: antara(2), saudariSebapak: antara(2),
  saudaraSeibu: antara(2), saudariSeibu: antara(2), pamanKandung: antara(1),
});

/** Kerangka tetap: kakek K + nenek NA → ayah A; nenek NI → ibu I; A + I → pewaris PW. Yang "tidak ada" = penghubung wafat. */
export function susunGraf(s: Susunan): GrafKeluarga {
  const orang: Record<string, Orang> = {};
  const pernikahan: Pernikahan[] = [];
  const penghubung = { statusHidup: 'wafat' as const, penghubung: true };
  const tambah = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}) => { orang[id] = p(id, jenisKelamin, lain); };
  const banyak = (awalan: string, jumlah: number, jenisKelamin: 'L' | 'P', lain: Partial<Orang>) => {
    for (let i = 0; i < jumlah; i++) tambah(`${awalan}${i}`, jenisKelamin, lain);
  };

  tambah('K', 'L', s.kakek ? {} : penghubung);
  tambah('NA', 'P', s.nenekDariAyah ? {} : penghubung);
  tambah('A', 'L', { ...(s.ayah ? {} : penghubung), idAyah: 'K', idIbu: 'NA' });
  tambah('NI', 'P', s.nenekDariIbu ? {} : penghubung);
  tambah('I', 'P', { ...(s.ibu ? {} : penghubung), idIbu: 'NI' });
  tambah('PW', s.pewarisLk ? 'L' : 'P', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' });

  const jumlahPasangan = s.pewarisLk ? s.pasangan : Math.min(s.pasangan, 1);
  for (let i = 0; i < jumlahPasangan; i++) {
    tambah(`PS${i}`, s.pewarisLk ? 'P' : 'L');
    pernikahan.push(s.pewarisLk ? { idSuami: 'PW', idIstri: `PS${i}`, status: 'utuh' } : { idSuami: `PS${i}`, idIstri: 'PW', status: 'utuh' });
  }
  const dariPewaris: Partial<Orang> = s.pewarisLk ? { idAyah: 'PW' } : { idIbu: 'PW' };
  banyak('AL', s.anakLk, 'L', dariPewaris);
  banyak('AP', s.anakPr, 'P', dariPewaris);
  tambah('AW', 'L', { ...penghubung, ...dariPewaris });          // anak lk wafat, jalur cucu
  banyak('CL', s.cucuLk, 'L', { idAyah: 'AW' });
  banyak('CP', s.cucuPr, 'P', { idAyah: 'AW' });
  banyak('SK', s.saudaraKandung, 'L', { idAyah: 'A', idIbu: 'I' });
  banyak('SKP', s.saudariKandung, 'P', { idAyah: 'A', idIbu: 'I' });
  tambah('IT', 'P', penghubung);                                   // ibu tiri, jalur saudara sebapak
  banyak('SB', s.saudaraSebapak, 'L', { idAyah: 'A', idIbu: 'IT' });
  banyak('SBP', s.saudariSebapak, 'P', { idAyah: 'A', idIbu: 'IT' });
  tambah('AT', 'L', penghubung);                                   // ayah tiri, jalur saudara seibu
  banyak('SI', s.saudaraSeibu, 'L', { idAyah: 'AT', idIbu: 'I' });
  banyak('SIP', s.saudariSeibu, 'P', { idAyah: 'AT', idIbu: 'I' });
  banyak('PM', s.pamanKandung, 'L', { idAyah: 'K', idIbu: 'NA' });
  return { idPewaris: 'PW', orang, pernikahan };
}

const AUL_SAH: Record<string, bigint[]> = { 6: [7n, 8n, 9n, 10n], 12: [13n, 15n, 17n], 24: [27n] };   // [R09-4]

export function periksaInvarian(graf: GrafKeluarga, hasil: HasilEngine): void {
  if (hasil.status !== 'OK') return;
  const { totalKolom, baris } = hasil.tabel;
  const penyebut = totalKolom.tashih ?? totalKolom.radd ?? totalKolom.aul ?? totalKolom.ashl;
  if (penyebut === undefined) throw new Error('tabel tanpa penyebut');
  const semuaSaham = baris.flatMap(barisIni => Object.values(barisIni.perOrang).map(sel => sel.saham));
  expect(semuaSaham.every(saham => saham >= 0n)).toBe(true);
  expect(semuaSaham.reduce((a, b) => a + b, 0n) + (hasil.sisaKeluar?.saham ?? 0n)).toBe(penyebut);
  for (const langkah of hasil.jejak) {
    if (langkah.jenis === 'AUL') expect(AUL_SAH[String(langkah.dari)]).toContain(langkah.menjadi);
  }
  for (const barisIni of baris) {
    if (!barisIni.ashabah) continue;
    const perJenis = { L: new Set<bigint>(), P: new Set<bigint>() };
    for (const [id, sel] of Object.entries(barisIni.perOrang)) perJenis[graf.orang[id]!.jenisKelamin].add(sel.saham);
    expect(perJenis.L.size, `anggota lk ${barisIni.kelompok} berbeda saham`).toBeLessThanOrEqual(1);
    expect(perJenis.P.size, `anggota pr ${barisIni.kelompok} berbeda saham`).toBeLessThanOrEqual(1);
    const [lk] = perJenis.L; const [pr] = perJenis.P;
    if (lk !== undefined && pr !== undefined) expect(lk, `2:1 di ${barisIni.kelompok}`).toBe(2n * pr);
  }
}

const BANYAK_PERCOBAAN = 500;

export function jalankanProperty(ruleset: Ruleset): void {
  let banyakOk = 0;
  fc.assert(fc.property(arbSusunan, susunan => {
    const graf = susunGraf(susunan);
    const hasil = hitung({ ...input(graf), ruleset });
    expect(['OK', 'TIDAK_DIDUKUNG', 'PERLU_INPUT']).toContain(hasil.status);
    if (hasil.status === 'OK') banyakOk++;
    periksaInvarian(graf, hasil);
  }), { numRuns: BANYAK_PERCOBAAN });
  // Tanpa ini, generator yang selalu memicu PERLU_INPUT membuat property lulus tanpa memeriksa apa pun.
  // Untuk [SYF] harus mayoritas OK; ruleset lain boleh lebih rendah karena gerbang 18.4.
  if (ruleset === 'syafii') expect(banyakOk).toBeGreaterThan(BANYAK_PERCOBAAN / 2);
}

describe('Invarian pipeline — susunan acak', () => {
  test('[SYF]', () => jalankanProperty('syafii'));
});
```

- [ ] **Step 3: Jalankan**

Run: `pnpm --filter @waris/engine exec vitest run src/__tests__/invarian.property.test.ts`
Expected: PASS. Bila gagal, fast-check mencetak susunan minimal yang gagal. **Jangan ubah tes supaya lulus.** Laporkan susunannya ke pengguna sebagai temuan: itu bug engine [SYF] atau data yang tidak masuk akal di generator. Perbaiki generator hanya bila grafnya memang mustahil (mis. dua ayah).

- [ ] **Step 4: Seluruh suite engine**

Run: `pnpm --filter @waris/engine test`
Expected: semua PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/package.json pnpm-lock.yaml packages/engine/src/__tests__/invarian.property.test.ts
git commit -m "engine: property test invarian pipeline (Σ saham, 'aul sah, 2:1) atas susunan ahli waris acak

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Sisa ke baitul mal teratur sebagai output resmi

Sekarang `kebijakanSisa: 'baitulMal'` mengembalikan `TIDAK_DIDUKUNG` (`klasifikasi.ts:55`). [SYF] asal madzhab dan [MLK]: sisa ke baitul mal bila baitul mal teratur [R09-8], K09-1. Output baru memakai `sisaKeluar` yang sudah ada, dengan tujuan baru `'baitulMalTeratur'`. Tujuan lama `'baitulMal'` tetap berarti "tidak ada dzawil arham di data, jadi baitul mal".

**Files:**
- Modify: `packages/engine/src/types.ts` (`TujuanSisa`)
- Modify: `packages/engine/src/stages/klasifikasi.ts:53-57`
- Modify: `packages/explain/src/cerita.ts` (teks tujuan di sekitar baris 421 dan fungsi `ceritaSisaKeluar`), `packages/explain/src/munasakhat.ts` (`TEKS_TUJUAN_SISA`), `packages/explain/src/arab.ts` (`barisSisaKeluar`)
- Modify: `apps/web/src/hasil/ringkasan.ts` (`TEKS_SISA_KELUAR`), `apps/web/src/snapshot.json` (2 kunci diksi baru)
- Test: `packages/engine/src/stages/__tests__/tahap3-6.test.ts`, `packages/explain/src/__tests__/` (file tes cerita yang sudah ada untuk sisa keluar)

**Interfaces:**
- Produces: `TujuanSisa = 'dzawilArham' | 'baitulMal' | 'baitulMalTeratur'`. Hasil `hitung` dengan `kebijakanSisa: 'baitulMal'` dan saham < ashl tanpa ashabah → `sisaKeluar: { tujuan: 'baitulMalTeratur', saham, nominal }`, jejak `SISA_KELUAR` dengan refs `['R09-8']`.

- [ ] **Step 1: Tes engine yang gagal**

Tambahkan ke `packages/engine/src/stages/__tests__/tahap3-6.test.ts` (ikuti pola impor file itu; `hitung`, `input`, `p` dari fixture bab16):

```ts
describe('Sisa ke baitul mal teratur [R09-8]', () => {
  // Ibu 1/6, anak pr 1/2, tanpa ashabah → sisa 2/6 ke baitul mal, bukan radd.
  const graf = {
    idPewaris: 'PW',
    orang: {
      PW: p('PW', 'L', { statusHidup: 'wafat', idIbu: 'I' }),
      I: p('I', 'P'),
      AP: p('AP', 'P', { idAyah: 'PW' }),
    },
    pernikahan: [],
  };

  test('kebijakan baitulMal: sisa jadi baris baitul mal, ashl tidak berubah', () => {
    const hasil = hitung({ ...input(graf, { kebijakanSisa: 'baitulMal', talakBainSaatMaradh: 'qaulJadid' }),
      tirkah: { kotor: 6_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } });
    if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    expect(hasil.tabel.totalKolom).toEqual({ ashl: 6n });
    expect(hasil.sisaKeluar).toEqual({ tujuan: 'baitulMalTeratur', saham: 2n, nominal: 2_000_000n });
    expect(hasil.jejak).toContainEqual({ tahap: 'klasifikasi', refs: ['R09-8'], jenis: 'SISA_KELUAR', saham: 2n, ashl: 6n, tujuan: 'baitulMalTeratur' });
  });

  test('kebijakan radd (bawaan) tidak berubah: sisa di-radd', () => {
    const hasil = hitung(input(graf));
    if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    expect(hasil.sisaKeluar).toBeUndefined();
    expect(hasil.tabel.totalKolom.radd).toBe(4n);
  });
});
```

Run: `pnpm --filter @waris/engine exec vitest run src/stages/__tests__/tahap3-6.test.ts`
Expected: tes pertama FAIL (status `TIDAK_DIDUKUNG`).

- [ ] **Step 2: Implementasi engine**

`types.ts`:

```ts
/**
 * Tujuan sisa yang tidak dibagi ke ahli waris:
 * - dzawilArham: hanya pasangan mewarisi dan ada dzawil arham [R09-9] [R14-3];
 * - baitulMal: hanya pasangan mewarisi, tidak ada dzawil arham di data [R02-1];
 * - baitulMalTeratur: kebijakan sisa = baitul mal karena baitul mal teratur [R09-8], K09-1.
 */
export type TujuanSisa = 'dzawilArham' | 'baitulMal' | 'baitulMalTeratur';
```

`klasifikasi.ts`, ganti blok `if (konfigurasi.kebijakanSisa === 'baitulMal') { return { status: 'TIDAK_DIDUKUNG', ... } }` dengan:

```ts
  // [R09-8] asal madzhab: sisa ke baitul mal bila baitul mal teratur; ashl tidak berubah.
  if (konfigurasi.kebijakanSisa === 'baitulMal') return sisaKeBaitulMal(ashl, saham, total);
```

dan tambahkan di bawah `sisaKeluarDariPasangan`:

```ts
function sisaKeBaitulMal(ashl: bigint, saham: Record<IdKelompok, bigint>, total: bigint): HasilKlasifikasi {
  const sisa = ashl - total;
  return {
    dasar: ashl, saham, sisaKeluar: { saham: sisa, tujuan: 'baitulMalTeratur' },
    jejak: [{ tahap: 'klasifikasi', refs: ['R09-8'], jenis: 'SISA_KELUAR', saham: sisa, ashl, tujuan: 'baitulMalTeratur' }],
  };
}
```

Periksa: bila `terapkanRadd` kini tidak pernah mengembalikan `TidakDidukung`, sempitkan tipe kembaliannya dan hapus pengecekan yang mati di pemanggil.

Run: `pnpm --filter @waris/engine test`
Expected: semua PASS. Munasakhat otomatis ikut karena memakai `hasil.sisaKeluar`.

- [ ] **Step 3: Explain dan web**

Semua peta teks per tujuan (`TEKS_TUJUAN_SISA` di explain munasakhat, cabang `sisaKeluar.tujuan === 'dzawilArham' ? ...` di `cerita.ts`, padanannya di `arab.ts`, `TEKS_SISA_KELUAR` di web) mendapat entri ketiga:
- Explain Indonesia: `'untuk baitul mal'`. Explain Arab: `'لبيت المال'`.
- Web `TEKS_SISA_KELUAR.baitulMalTeratur`: `{ judul: t('hitung.sisa_untuk_baitul_mal'), keterangan: t('hitung.baitul_mal_teratur') }`. Tambahkan dua entri ke `apps/web/src/snapshot.json`, dengan format entri diksi yang sama seperti `hitung.sisa_untuk_dzawil_arham`:
  - `hitung.sisa_untuk_baitul_mal`: id `"Sisa untuk baitul mal"`, ar `"الباقي لبيت المال"`
  - `hitung.baitul_mal_teratur`: id `"Karena baitul mal dianggap teratur"`, ar `"لانتظام بيت المال"`

Ubah cabang ternary di explain menjadi lookup peta, supaya TypeScript memaksa ketiga tujuan terisi (`Record<TujuanSisa, string>`). Tambahkan satu tes explain yang memakai graf Step 1 dan memeriksa baris hasil memuat `"untuk baitul mal."`.

Run: `pnpm -r test`
Expected: semua PASS (termasuk tes diksi web yang menangkap kunci tak dikenal).

- [ ] **Step 4: Commit**

```bash
git add packages/engine packages/explain apps/web/src/hasil/ringkasan.ts apps/web/src/snapshot.json
git commit -m "engine: kebijakan sisa baitul mal jadi output resmi (sisaKeluar baitulMalTeratur) [R09-8]

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: KB 18.4 — keberlakuan token engine per madzhab (CHECKPOINT pengguna)

Header bab 18 mewajibkan ini: titik yang tidak ada di matriks sama dengan [SYF] **hanya bila** bab asalnya menyebut ijma'/jumhur. Engine memakai 62 token `Rxx-y`. Hampir semuanya berjenis RDH, jadi keberlakuannya untuk madzhab lain harus diputuskan per token. Ini keputusan fikih: **disusun sebagai draf, lalu pengguna mereview sebelum Task 4 dimulai.**

**Files:**
- Modify: `docs/kb/18_matriks_khilaf.md` (bagian baru `## 18.4`; bagian "Yang Belum Ada" tetap)
- Create: `packages/engine/src/rulesets/berlaku.ts`
- Modify: `packages/content/src/refs.ts` (impor bab 18, `bacaKeberlakuan`)
- Test: `packages/content/src/__tests__/refs.test.ts`

**Interfaces:**
- Produces: `BERLAKU_LINTAS_MADZHAB: Record<'hanbali' | 'hanafi' | 'maliki', ReadonlySet<string>>` di `berlaku.ts`; `bacaKeberlakuan(md18): Array<{ token: string; hanbali: boolean; hanafi: boolean; maliki: boolean; dasar: string }>` di content.

- [ ] **Step 1: Daftar token engine**

Run:
```bash
grep -rohE "R[0-9]{2}[a-d]?-[0-9]+" packages/engine/src --exclude-dir=__tests__ | sort -u
```
Expected: ±62 token (R01-1 … R14-5).

- [ ] **Step 2: Susun draf tabel 18.4**

Tambahkan ke `docs/kb/18_matriks_khilaf.md`, sebelum bagian 18.3 atau sesudahnya (nomor 18.4):

```markdown
## 18.4 Keberlakuan Token Engine per Madzhab
Token `Rxx-y` yang dipakai engine. **ya** = keputusan yang sama berlaku untuk madzhab itu; **tidak** = belum dikaji
atau berbeda tanpa overlay → engine mode itu `TIDAK_DIDUKUNG` bila kasus menyentuh token ini. Titik yang punya baris di 18.2
mengikuti barisnya: sel "= [SYF]" → ya; sel berbeda → tidak (overlay memakai kode `Kxx-y`, bukan token ini).
| Token | [HNB] | [HNF] | [MLK] | Dasar |
|---|---|---|---|---|
| R04-2 | ya | ya | ya | Q (An-Nisa' 12) + ijma' (bab 4.1) |
| R02-9 | tidak | tidak | tidak | K02-1 berbeda; ditunda (keputusan 2026-09-29) |
```

Isi satu baris per token dari Step 1. Aturan pengisian, **urut, berhenti di aturan pertama yang cocok**:
1. Token yang keputusannya punya baris di 18.2 → ikuti sel madzhab itu ("= [SYF]" → ya; selain itu → tidak). Pemetaan wajib: K03-1 → R03-4; K04-1 → R04-9; K04-2 → R04-10; K07-1 → R07-2, R07-3; K05-1/K08-1 → R05-2, R08-2, R08-3, R08-4, R08-5; K09-1 → R09-7, R09-8, R09-9; K02-1 → R02-9; K02-3 → R02-3; K13-x/K14-x → token bab 13/14 terkait.
2. Jenis mengandung `KH` saja (kaidah hisab: R09-10, R10-1, R10-2, R11-1, R12-2) → ya untuk ketiganya, dasar "KH, 18.3 baris munasakhat/'aul/tashih".
3. Teks bab asal di sekitar token menyebut ijma', jumhur, sepakat, "keempat madzhab", atau `IJ` ada di kolom Jenis → ya, dasar = kutipan singkat + lokasi bab.
4. Selain itu → **tidak**, dasar "belum dikaji".

Jangan menilai dari pengetahuan umum. Bila ragu → tidak.

- [ ] **Step 3: Parser + tes sinkron**

`packages/content/src/refs.ts`: impor `bab18` (`../../../docs/kb/18_matriks_khilaf.md?raw`, pola sama dengan impor bab lain), lalu:

```ts
export interface Keberlakuan { token: string; hanbali: boolean; hanafi: boolean; maliki: boolean; dasar: string }

/** Tabel bab 18.4: token engine yang berlaku untuk tiap madzhab non-[SYF]. */
export const bacaKeberlakuan = (teksMarkdown: string): Keberlakuan[] =>
  barisTabelBagian(teksMarkdown, '18.4')
    .filter(([token = '']) => /^R\d{2}[a-d]?-\d+$/.test(token))
    .map(([token = '', hanbali = '', hanafi = '', maliki = '', dasar = '']) => ({
      token, hanbali: hanbali === 'ya', hanafi: hanafi === 'ya', maliki: maliki === 'ya', dasar,
    }));

export const KEBERLAKUAN: Keberlakuan[] = bacaKeberlakuan(bab18);
```

Tes di `refs.test.ts`:

```ts
import { BERLAKU_LINTAS_MADZHAB } from '../../../engine/src/rulesets/berlaku.js';

describe('KB 18.4 keberlakuan token', () => {
  test('setiap token engine tercantum tepat sekali', () => {
    const tokens = KEBERLAKUAN.map(baris => baris.token);
    expect(new Set(tokens).size).toBe(tokens.length);
    // TOKEN_ENGINE: salin daftar Step 1 sebagai array literal di tes ini.
    expect([...tokens].sort()).toEqual([...TOKEN_ENGINE].sort());
  });

  test('konstanta engine sama persis dengan tabel KB', () => {
    for (const madzhab of ['hanbali', 'hanafi', 'maliki'] as const) {
      const dariKb = KEBERLAKUAN.filter(baris => baris[madzhab]).map(baris => baris.token).sort();
      expect([...BERLAKU_LINTAS_MADZHAB[madzhab]].sort(), madzhab).toEqual(dariKb);
    }
  });
});
```

`packages/engine/src/rulesets/berlaku.ts`:

```ts
// Salinan tabel KB 18.4: token Rxx-y yang keputusannya berlaku juga untuk madzhab non-[SYF].
// Sumber kebenaran = KB; tes content (refs.test.ts) menjaga keduanya tetap sama.
export const BERLAKU_LINTAS_MADZHAB: Record<'hanbali' | 'hanafi' | 'maliki', ReadonlySet<string>> = {
  hanbali: new Set([/* token "ya" kolom [HNB] */]),
  hanafi: new Set([/* token "ya" kolom [HNF] */]),
  maliki: new Set([/* token "ya" kolom [MLK] */]),
};
```

Isi ketiga set persis dari tabel Step 2. Komentar `/* ... */` di atas adalah tempat isi, bukan untuk dibiarkan: tes Step 3 gagal kalau set kosong tidak sama dengan KB.

Run: `pnpm --filter @waris/content test`
Expected: PASS.

- [ ] **Step 4: Commit, lalu BERHENTI untuk review pengguna**

```bash
git add docs/kb/18_matriks_khilaf.md packages/content/src packages/engine/src/rulesets/berlaku.ts
git commit -m "kb: 18.4 keberlakuan token engine per madzhab (draf, menunggu review pengguna)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Kirim tabel 18.4 ke pengguna: jumlah ya/tidak per madzhab, dan daftar token "tidak" yang paling sering muncul di kasus sehari-hari. **Task 4 tidak dimulai sebelum pengguna menyetujui tabel.** Koreksi pengguna → ubah KB + `berlaku.ts`, tes, commit.

---

### Task 4: Ruleset 4 nilai, `AturanMadzhab`, dan gerbang

Kerangka tanpa perubahan perilaku fikih. Semua flag [SYF], sehingga hasil [SYF] identik. Mode non-[SYF] hanya bisa menghasilkan hasil yang seluruh tokennya disetujui di 18.4.

**Files:**
- Modify: `packages/engine/src/types.ts:69` (`Ruleset`)
- Create: `packages/engine/src/rulesets/madzhab.ts`, `packages/engine/src/rulesets/gerbang.ts`
- Modify: `packages/engine/src/pipeline.ts`, `packages/engine/src/index.ts` (ekspor)
- Modify: `packages/engine/src/stages/derivasi.ts`, `hajb.ts`, `bagian.ts` (parameter `aturan` dengan bawaan `ATURAN.syafii`; belum dipakai)
- Create: `packages/engine/src/__tests__/madzhab.test.ts`

**Interfaces:**
- Consumes: `BERLAKU_LINTAS_MADZHAB` (Task 3)
- Produces:
  - `type Ruleset = 'syafii' | 'hanbali' | 'hanafi' | 'maliki'` (types.ts), `DAFTAR_RULESET: readonly Ruleset[]`
  - `interface AturanMadzhab { ruleset: Ruleset; batasLakiLakiJalurNenek?: number; nenekDekatMenghijabMutlak: boolean; ummulAbTerhijabAyah: boolean; tasyrik: boolean; kakekMenghijabSaudara: boolean; kebijakanSisaSah: ReadonlyArray<KonfigurasiMadzhab['kebijakanSisa']> }`
  - `ATURAN: Record<Ruleset, AturanMadzhab>`
  - `rujukanTitik(aturan: AturanMadzhab, kodeKhilaf: string, tokenSyafii: string): string`
  - `periksaKonfigurasi(input: InputEngine): Extract<HasilEngine, { status: 'TIDAK_DIDUKUNG' }> | undefined`
  - `periksaKeberlakuan(ruleset: Ruleset, hasil: Extract<HasilEngine, { status: 'OK' }>): Extract<HasilEngine, { status: 'TIDAK_DIDUKUNG' }> | undefined`
  - Signature tahap: `turunkanPeran(graf, konfigurasi, aturan = ATURAN.syafii)`, `terapkanHajb(kandidat, aturan = ATURAN.syafii)`, `tetapkanBagian(efektif, kandidat, aturan = ATURAN.syafii)`

- [ ] **Step 1: Tes yang gagal**

`packages/engine/src/__tests__/madzhab.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { hitung } from '../pipeline.js';
import { hitungMunasakhat } from '../munasakhat.js';
import type { InputEngine } from '../types.js';
import { BAB16_FIXTURES } from './fixtures/bab16.js';
import { M2 } from './fixtures/munasakhat.js';
import { input, p } from './fixtures/bab16.js';

const denganRuleset = (dasar: InputEngine, ruleset: InputEngine['ruleset']): InputEngine => ({ ...dasar, ruleset });

describe('Kerangka ruleset', () => {
  test('[SYF] eksplisit = hasil lama untuk semua fixture bab 16', () => {
    for (const fixture of BAB16_FIXTURES) {
      expect(hitung(denganRuleset(fixture.input, 'syafii'))).toEqual(hitung(fixture.input));
    }
  });

  test('gerbang: pembunuh di mode [HNB] → TIDAK_DIDUKUNG dengan token R02-9 (K02-1 ditunda)', () => {
    const graf = {
      idPewaris: 'PW',
      orang: {
        PW: p('PW', 'L', { statusHidup: 'wafat' }),
        AL: p('AL', 'L', { idAyah: 'PW' }),
        AL2: p('AL2', 'L', { idAyah: 'PW', membunuhPewaris: true }),
      },
      pernikahan: [],
    };
    expect(hitung(denganRuleset(input(graf), 'hanbali'))).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: expect.arrayContaining(['R02-9']) });
    expect(hitung(input(graf)).status).toBe('OK');
  });

  test('konfigurasi tidak sah: baitulMal di [HNB] → TIDAK_DIDUKUNG K09-1', () => {
    const graf = { idPewaris: 'PW', orang: { PW: p('PW', 'L', { statusHidup: 'wafat' }), AL: p('AL', 'L', { idAyah: 'PW' }) }, pernikahan: [] };
    const hasil = hitung({ ...input(graf, { kebijakanSisa: 'baitulMal', talakBainSaatMaradh: 'qaulJadid' }), ruleset: 'hanbali' });
    expect(hasil).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['K09-1'] });
  });

  test("konfigurasi tidak sah: qaul qadim talak ba'in di luar [SYF] → TIDAK_DIDUKUNG K02-3", () => {
    const graf = { idPewaris: 'PW', orang: { PW: p('PW', 'L', { statusHidup: 'wafat' }), AL: p('AL', 'L', { idAyah: 'PW' }) }, pernikahan: [] };
    const hasil = hitung({ ...input(graf, { kebijakanSisa: 'radd', talakBainSaatMaradh: 'qaulQadim' }), ruleset: 'maliki' });
    expect(hasil).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['K02-3'] });
  });

  test('munasakhat meneruskan ruleset ke tiap mayit', () => {
    const hasil = hitungMunasakhat({ ...M2.input, dasar: denganRuleset(M2.input.dasar, 'hanbali') });
    if (hasil.status === 'OK') {
      expect(hasil.daftarLangkah.every(langkah => langkah.hasil.ruleset === 'hanbali')).toBe(true);
    } else {
      expect(hasil.status).toBe('TIDAK_DIDUKUNG');   // sah bila 18.4 menolak salah satu token M2
    }
  });
});
```

Run: `pnpm --filter @waris/engine exec vitest run src/__tests__/madzhab.test.ts`
Expected: FAIL (tipe `'hanbali'` belum ada).

- [ ] **Step 2: `madzhab.ts`**

```ts
// Ruleset overlay (bab 18): tiap madzhab = sekumpulan flag, satu per titik matriks 18.2 yang disentuh waris dasar.
// Tahap pipeline menerima `AturanMadzhab` sebagai argumen dan bercabang pada flag-nya; tidak ada tahap yang
// memeriksa nama madzhab langsung. Titik di luar matriks dijaga gerbang (gerbang.ts + KB 18.4).
import type { KonfigurasiMadzhab, Ruleset } from '../types.js';

export const DAFTAR_RULESET: readonly Ruleset[] = ['syafii', 'hanbali', 'hanafi', 'maliki'];

export interface AturanMadzhab {
  ruleset: Ruleset;
  /** [K03-1] banyaknya laki-laki paling banyak di jalur nenek pihak ayah; undefined = tak dibatasi. */
  batasLakiLakiJalurNenek?: number;
  /** [K04-1] nenek yang lebih dekat menghijab yang lebih jauh dari pihak mana pun. */
  nenekDekatMenghijabMutlak: boolean;
  /** [K04-2] ummul ab terhijab oleh ayah. */
  ummulAbTerhijabAyah: boolean;
  /** [K07-1] musyarrakah: saudara kandung digabung dengan saudara seibu. */
  tasyrik: boolean;
  /** [K05-1] [K08-1] kakek menghijab saudara kandung/sebapak seperti ayah. */
  kakekMenghijabSaudara: boolean;
  /** [K09-1] kebijakan sisa yang sah untuk madzhab ini. */
  kebijakanSisaSah: ReadonlyArray<KonfigurasiMadzhab['kebijakanSisa']>;
}

export const ATURAN: Record<Ruleset, AturanMadzhab> = {
  syafii: {
    ruleset: 'syafii', nenekDekatMenghijabMutlak: false, ummulAbTerhijabAyah: true, tasyrik: true,
    kakekMenghijabSaudara: false, kebijakanSisaSah: ['radd', 'baitulMal'],
  },
  // [K03-1] Mughni 6/300–301: tiga nenek (ummul umm, ummul ab, ummul jadd) → paling banyak 2 laki-laki (ayah, kakek).
  hanbali: {
    ruleset: 'hanbali', batasLakiLakiJalurNenek: 2, nenekDekatMenghijabMutlak: true, ummulAbTerhijabAyah: false, tasyrik: false,
    kakekMenghijabSaudara: false, kebijakanSisaSah: ['radd'],
  },
  hanafi: {
    ruleset: 'hanafi', nenekDekatMenghijabMutlak: true, ummulAbTerhijabAyah: true, tasyrik: false,
    kakekMenghijabSaudara: true, kebijakanSisaSah: ['radd'],
  },
  // [K03-1] 'Iqd 3/1239–1240: hanya ummul umm dan ummul ab (ke atas lewat perempuan) → paling banyak 1 laki-laki (ayah).
  maliki: {
    ruleset: 'maliki', batasLakiLakiJalurNenek: 1, nenekDekatMenghijabMutlak: false, ummulAbTerhijabAyah: true, tasyrik: true,
    kakekMenghijabSaudara: false, kebijakanSisaSah: ['radd', 'baitulMal'],
  },
};

/** Titik yang ada di matriks 18: [SYF] memakai token bab asal, madzhab lain memakai kode matriks (sel madzhab itu). */
export const rujukanTitik = (aturan: AturanMadzhab, kodeKhilaf: string, tokenSyafii: string): string =>
  aturan.ruleset === 'syafii' ? tokenSyafii : kodeKhilaf;
```

- [ ] **Step 3: `gerbang.ts`**

```ts
// Gerbang ruleset (bab 18 header): hasil madzhab non-[SYF] hanya sah bila setiap token Rxx-y yang dipakai
// tercantum "ya" di KB 18.4 untuk madzhab itu. Kode Kxx-y (sel matriks) selalu sah.
import type { HasilEngine, InputEngine, Ruleset } from '../types.js';
import { BERLAKU_LINTAS_MADZHAB } from './berlaku.js';
import { ATURAN } from './madzhab.js';

type TidakDidukung = Extract<HasilEngine, { status: 'TIDAK_DIDUKUNG' }>;
type HasilOk = Extract<HasilEngine, { status: 'OK' }>;

const NAMA_MADZHAB: Record<Ruleset, string> = { syafii: "Syafi'i", hanbali: 'Hanbali', hanafi: 'Hanafi', maliki: 'Maliki' };
const KODE_KHILAF = /^K\d{2}[a-d]?-\d+$/;

export function periksaKonfigurasi(input: InputEngine): TidakDidukung | undefined {
  const aturan = ATURAN[input.ruleset];
  if (!aturan.kebijakanSisaSah.includes(input.konfigurasi.kebijakanSisa)) {
    return { status: 'TIDAK_DIDUKUNG', alasan: `Kebijakan sisa "${input.konfigurasi.kebijakanSisa}" tidak dikenal dalam madzhab ${NAMA_MADZHAB[input.ruleset]}.`, refs: ['K09-1'] };
  }
  // [K02-3] qaul qadim adalah khilaf internal Syafi'iyyah.
  if (input.ruleset !== 'syafii' && input.konfigurasi.talakBainSaatMaradh === 'qaulQadim') {
    return { status: 'TIDAK_DIDUKUNG', alasan: "Pilihan qaul qadim hanya ada dalam madzhab Syafi'i.", refs: ['K02-3'] };
  }
  return undefined;
}

export function periksaKeberlakuan(ruleset: Ruleset, hasil: HasilOk): TidakDidukung | undefined {
  if (ruleset === 'syafii') return undefined;
  const berlaku = BERLAKU_LINTAS_MADZHAB[ruleset];
  const dipakai = new Set([
    ...hasil.jejak.flatMap(langkah => langkah.refs),
    ...Object.values(hasil.statusOrang).flatMap(status => ('rujukanAturan' in status && status.rujukanAturan ? [status.rujukanAturan] : [])),
  ]);
  const belumDikaji = [...dipakai].filter(kode => !KODE_KHILAF.test(kode) && !berlaku.has(kode)).sort();
  if (belumDikaji.length === 0) return undefined;
  return {
    status: 'TIDAK_DIDUKUNG',
    alasan: `Kasus ini menyentuh aturan yang belum dikaji untuk madzhab ${NAMA_MADZHAB[ruleset]}: ${belumDikaji.join(', ')}.`,
    refs: belumDikaji,
  };
}
```

- [ ] **Step 4: Sambungkan ke pipeline**

`types.ts`: `export type Ruleset = 'syafii' | 'hanbali' | 'hanafi' | 'maliki';`

`pipeline.ts`:
- Di awal `hitung`: `const konfigurasiTidakSah = periksaKonfigurasi(input); if (konfigurasiTidakSah) return konfigurasiTidakSah;`
- Simpan objek hasil OK ke `const hasil = { ... }` lalu `return periksaKeberlakuan(input.ruleset, hasil) ?? hasil;`
- Di `jalankanTahapAhliWaris`: `const aturan = ATURAN[input.ruleset];` lalu teruskan ke `turunkanPeran(graf, konfigurasi, aturan)`, `terapkanHajb(kandidat, aturan)`, `tetapkanBagian(hajb.efektif, kandidat, aturan)`.

Di ketiga tahap, tambahkan parameter `aturan: AturanMadzhab = ATURAN.syafii`. Belum dipakai di task ini. Impor `ATURAN` dari `../rulesets/madzhab.js`: arah import satu arah (stages → rulesets → types), tanpa siklus.

`index.ts`: ekspor `DAFTAR_RULESET`, `ATURAN`, `type AturanMadzhab`.

Property test: tambahkan ke `invarian.property.test.ts`:

```ts
  test.each(['hanbali', 'hanafi', 'maliki'] as const)('[%s]', ruleset => jalankanProperty(ruleset));
```

- [ ] **Step 5: Jalankan**

Run: `pnpm --filter @waris/engine test && pnpm --filter @waris/engine exec tsc --noEmit`
Expected: semua PASS, tanpa galat tipe.

- [ ] **Step 6: Commit**

```bash
git add packages/engine
git commit -m "engine: ruleset syafii/hanbali/hanafi/maliki, AturanMadzhab, gerbang keberlakuan KB 18.4

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Overlay nenek — K03-1, K04-1, K04-2

Tiga titik nenek disentuh [HNB] (ketiganya), [HNF] (K04-1), dan [MLK] (K03-1).

**Files:**
- Modify: `packages/engine/src/types.ts` (`PeranAhliWaris.rujukan?`)
- Modify: `packages/engine/src/stages/derivasi.ts` (fungsi `peranLeluhur`, cabang nenek)
- Modify: `packages/engine/src/stages/mawani.ts:22-23`
- Modify: `packages/engine/src/stages/hajb.ts:58-70`
- Create: `packages/engine/src/__tests__/fixtures/madzhab.ts`
- Modify: `packages/engine/src/__tests__/madzhab.test.ts`

**Interfaces:**
- Consumes: `AturanMadzhab`, `rujukanTitik` (Task 4)
- Produces: `PeranAhliWaris.rujukan?: string`. Bila ada, `mawani` memakainya sebagai `rujukanAturan` status dzawil arham, menggantikan `'R14-4'`. Fixture `KASUS_MADZHAB: KasusMadzhab[]` dengan `interface KasusMadzhab { id: string; kode: string; menguji: string; graf: GrafKeluarga; harapan: Partial<Record<Ruleset, { saham: Record<string, bigint>; penyebut: bigint } | 'TIDAK_DIDUKUNG'>> }`

- [ ] **Step 1: Fixture (nilai harapan dari matriks 18)**

`packages/engine/src/__tests__/fixtures/madzhab.ts`:

```ts
/**
 * Kasus uji overlay madzhab (bab 18.2). Dibuat SEBELUM logika. Nilai harapan diturunkan dari sel matriks;
 * [SYF] dicocokkan ke bab asal. `saham` = saham akhir per orang (> 0) terhadap `penyebut` akhir.
 */
import type { GrafKeluarga, Ruleset } from '../../types.js';
import { p } from './bab16.js';

export interface KasusMadzhab {
  id: string;
  kode: string;
  menguji: string;
  graf: GrafKeluarga;
  harapan: Partial<Record<Ruleset, { saham: Record<string, bigint>; penyebut: bigint } | 'TIDAK_DIDUKUNG'>>;
}

const penghubung = { statusHidup: 'wafat' as const, penghubung: true };

// ─── K04-2: ayah + ibu ayah (ummul ab) + anak lk ───
// [SYF]/[HNF]/[MLK]: nenek terhijab ayah [R04-10] → ayah 1/6 = 1, anak lk 5 (ashl 6).
// [HNB]: nenek tidak terhijab (Mughni 6/303) → ayah 1, nenek 1, anak lk 4 (ashl 6).
const grafK04_2: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A' }),
    A: p('A', 'L', { idIbu: 'NA' }),
    NA: p('NA', 'P'),
    AL: p('AL', 'L', { idAyah: 'PW' }),
  },
  pernikahan: [],
};

// ─── K04-1: ibu ayah (dekat, pihak ayah) + ibu dari ibu dari ibu (jauh, pihak ibu) + anak lk; tanpa ayah & ibu ───
// [SYF]/[MLK]: yang dekat pihak ayah tidak menghijab yang jauh pihak ibu → berbagi 1/6: ashl 6 → tashih 12: NA 1, N3 1, anak lk 10.
// [HNB]/[HNF]: yang dekat menghijab mutlak → NA 1, anak lk 5 (ashl 6).
const grafK04_1: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }),
    A: p('A', 'L', { ...penghubung, idIbu: 'NA' }),
    NA: p('NA', 'P'),
    I: p('I', 'P', { ...penghubung, idIbu: 'I2' }),
    I2: p('I2', 'P', { ...penghubung, idIbu: 'N3' }),
    N3: p('N3', 'P'),
    AL: p('AL', 'L', { idAyah: 'PW' }),
  },
  pernikahan: [],
};

// ─── K03-1 (a): ibu kakek (ummul jadd) + anak lk; ayah & kakek wafat ───
// [SYF]/[HNB]/[HNF]: ahli waris 1/6 → nenek 1, anak lk 5 (ashl 6).
// [MLK]: hanya ummul umm & ummul ab → dzawil arham → anak lk seluruhnya (1/1).
const grafK03_1a: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A' }),
    A: p('A', 'L', { ...penghubung, idAyah: 'K' }),
    K: p('K', 'L', { ...penghubung, idIbu: 'UK' }),
    UK: p('UK', 'P'),
    AL: p('AL', 'L', { idAyah: 'PW' }),
  },
  pernikahan: [],
};

// ─── K03-1 (b): ibu ayah kakek (umm abil jadd) + anak lk ───
// [SYF]/[HNF]: ahli waris → nenek 1, anak lk 5 (ashl 6).  [HNB]/[MLK]: dzawil arham → anak lk 1/1.
const grafK03_1b: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A' }),
    A: p('A', 'L', { ...penghubung, idAyah: 'K' }),
    K: p('K', 'L', { ...penghubung, idAyah: 'KB' }),
    KB: p('KB', 'L', { ...penghubung, idIbu: 'UKB' }),
    UKB: p('UKB', 'P'),
    AL: p('AL', 'L', { idAyah: 'PW' }),
  },
  pernikahan: [],
};

const sendiri = { saham: { AL: 1n }, penyebut: 1n };

export const KASUS_NENEK: KasusMadzhab[] = [
  { id: 'MZ1', kode: 'K04-2', menguji: 'ummul ab bersama ayah', graf: grafK04_2, harapan: {
    syafii: { saham: { A: 1n, AL: 5n }, penyebut: 6n }, hanafi: { saham: { A: 1n, AL: 5n }, penyebut: 6n },
    maliki: { saham: { A: 1n, AL: 5n }, penyebut: 6n }, hanbali: { saham: { A: 1n, NA: 1n, AL: 4n }, penyebut: 6n } } },
  { id: 'MZ2', kode: 'K04-1', menguji: 'nenek dekat pihak ayah vs jauh pihak ibu', graf: grafK04_1, harapan: {
    syafii: { saham: { NA: 1n, N3: 1n, AL: 10n }, penyebut: 12n }, maliki: { saham: { NA: 1n, N3: 1n, AL: 10n }, penyebut: 12n },
    hanbali: { saham: { NA: 1n, AL: 5n }, penyebut: 6n }, hanafi: { saham: { NA: 1n, AL: 5n }, penyebut: 6n } } },
  { id: 'MZ3', kode: 'K03-1', menguji: 'ummul jadd', graf: grafK03_1a, harapan: {
    syafii: { saham: { UK: 1n, AL: 5n }, penyebut: 6n }, hanbali: { saham: { UK: 1n, AL: 5n }, penyebut: 6n },
    hanafi: { saham: { UK: 1n, AL: 5n }, penyebut: 6n }, maliki: sendiri } },
  { id: 'MZ4', kode: 'K03-1', menguji: 'umm abil jadd', graf: grafK03_1b, harapan: {
    syafii: { saham: { UKB: 1n, AL: 5n }, penyebut: 6n }, hanafi: { saham: { UKB: 1n, AL: 5n }, penyebut: 6n },
    hanbali: sendiri, maliki: sendiri } },
];

export const KASUS_MADZHAB: KasusMadzhab[] = [...KASUS_NENEK];
```

Tambahkan ke `madzhab.test.ts`:

```ts
import { KASUS_MADZHAB } from './fixtures/madzhab.js';
import { periksaInvarian } from './invarian.property.test.js';

function sahamAkhir(hasil: Extract<ReturnType<typeof hitung>, { status: 'OK' }>) {
  const { totalKolom, baris } = hasil.tabel;
  const penyebut = totalKolom.tashih ?? totalKolom.radd ?? totalKolom.aul ?? totalKolom.ashl!;
  const saham = Object.fromEntries(baris.flatMap(b => Object.entries(b.perOrang)).filter(([, sel]) => sel.saham > 0n).map(([id, sel]) => [id, sel.saham]));
  return { saham, penyebut };
}

describe('Overlay madzhab — kasus bab 18.2', () => {
  for (const kasus of KASUS_MADZHAB) {
    for (const [ruleset, harapan] of Object.entries(kasus.harapan)) {
      test(`${kasus.id} ${kasus.kode} ${kasus.menguji} [${ruleset}]`, () => {
        const hasil = hitung({ ...input(kasus.graf), ruleset: ruleset as InputEngine['ruleset'] });
        if (harapan === 'TIDAK_DIDUKUNG') { expect(hasil.status).toBe('TIDAK_DIDUKUNG'); return; }
        if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
        periksaInvarian(kasus.graf, hasil);
        expect(sahamAkhir(hasil)).toEqual(harapan);
      });
    }
  }
});
```

Run: `pnpm --filter @waris/engine exec vitest run src/__tests__/madzhab.test.ts`
Expected: kasus [SYF] PASS; kasus non-[SYF] yang berbeda dari [SYF] FAIL. Catatan: kasus non-[SYF] juga bisa gagal dengan status `TIDAK_DIDUKUNG` bila 18.4 menolak salah satu token yang dipakai (mis. R04-7). **Itu keputusan KB, bukan bug.** Laporkan token itu ke pengguna dan jangan ubah harapan diam-diam.

- [ ] **Step 2: K03-1 di derivasi**

`types.ts`, di `PeranAhliWaris` tambahkan:

```ts
  /** Rujukan keputusan peran bila berasal dari titik khilaf (mis. 'K03-1'), dipakai mawani untuk status dzawil arham. */
  rujukan?: string;
```

`derivasi.ts`, `peranLeluhur` menerima `aturan: AturanMadzhab` (teruskan dari `turunkanPeran`). Cabang nenek:

```ts
    const daftarJenisKelamin = perantara.map(id => jenisKelaminDari(graf, id));
    const fasidah = daftarJenisKelamin.some((jenisKelamin, i) => jenisKelamin === 'L' && daftarJenisKelamin.slice(0, i).includes('P'));
    // [K03-1] [HNB] tiga nenek (lewat ayah paling tinggi ummul jadd); [MLK] hanya ummul umm & ummul ab.
    // Pola shahihah L*P*, jadi banyaknya L = laki-laki di pangkal jalur.
    const lakiLakiDiJalur = daftarJenisKelamin.filter(jenisKelamin => jenisKelamin === 'L').length;
    const melewatiBatas = aturan.batasLakiLakiJalurNenek !== undefined && lakiLakiDiJalur > aturan.batasLakiLakiJalurNenek;
    kunci = fasidah || melewatiBatas ? 'DZAWIL_ARHAM' : kekerabatan.jalur === 'sebapak' ? 'NENEK_DARI_AYAH' : 'NENEK_DARI_IBU';
    if (melewatiBatas && !fasidah) return { idOrang, kunci, kekerabatan, lintasan, rujukan: 'K03-1' };
```

`mawani.ts`:

```ts
      statusOrang[idOrang] = { jenis: 'bukanAhliWaris', alasan: 'dzawil arham', rujukanAturan: peran.rujukan ?? 'R14-4' };
```

- [ ] **Step 3: K04-1 dan K04-2 di hajb**

`terapkanHajb(kandidat, aturan)` meneruskan `aturan` ke `cariHajib(ahliWaris, efektif, aturan)`. Ganti cabang nenek:

```ts
    case 'NENEK_DARI_IBU': case 'NENEK_DARI_AYAH': {
      const pihak = ahliWaris.kunci;
      const olehIbu = denganKunci(efektif, ['IBU']);
      // [R04-10] ayah menghijab nenek dari pihaknya; [K04-2] [HNB] tidak.
      const olehAyah = pihak === 'NENEK_DARI_AYAH' && aturan.ummulAbTerhijabAyah ? ayah : [];
      const olehKakek = kakek.filter(kakekIni => ahliWaris.lintasan.includes(kakekIni.idOrang));   // [R04-6] hanya nenek yang lewat kakek itu
      // [R04-9] [SYF]/[MLK]: nenek dekat sepihak menghijab yang jauh; nenek dekat pihak ibu juga menghijab nenek jauh pihak ayah,
      // tidak sebaliknya. [K04-1] [HNB]/[HNF]: yang lebih dekat menghijab mutlak.
      const olehNenek = denganKunci(efektif, ['NENEK_DARI_IBU', 'NENEK_DARI_AYAH']).filter(nenek => nenek.kekerabatan.generasiLeluhur < generasi
        && (aturan.nenekDekatMenghijabMutlak || nenek.kunci === pihak || nenek.kunci === 'NENEK_DARI_IBU'));
      if (olehIbu.length > 0) return hajibDari(olehIbu, 'R04-9');
      if (olehAyah.length > 0) return hajibDari(olehAyah, 'R04-10');
      if (olehKakek.length > 0) return hajibDari(olehKakek, 'R04-6');
      return hajibDari(olehNenek, rujukanTitik(aturan, 'K04-1', 'R04-9'));
    }
```

Rujukan tiap penghalang kini dipisah (sebelumnya semuanya `'R04-9'`). Bila ada tes [SYF] lama yang memeriksa `rujukanAturan: 'R04-9'` untuk nenek yang dihijab ayah atau kakek, **laporkan ke pengguna sebelum mengubah tes itu**. Perubahan itu memperbaiki ketertelusuran (R04-10 dan R04-6 memang token keputusan tersebut), tetapi tetap mengubah output [SYF].

Kalau pengguna menolak perubahan rujukan [SYF], alternatifnya: pertahankan satu `hajibDari([...], 'R04-9')` untuk [SYF] dan pakai rujukan terpisah hanya bila `aturan.ruleset !== 'syafii'`.

- [ ] **Step 4: Jalankan**

Run: `pnpm --filter @waris/engine test`
Expected: semua PASS, termasuk bab 16, M1–M9, property 4 ruleset.

- [ ] **Step 5: Commit**

```bash
git add packages/engine
git commit -m "engine: overlay nenek K03-1 (batas jalur), K04-1 (hijab mutlak), K04-2 (ummul ab bersama ayah)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Overlay musyarrakah — K07-1

[HNB] dan [HNF] tanpa tasyrik. [SYF] dan [MLK] tasyrik.

**Files:**
- Modify: `packages/engine/src/types.ts:143` (`KASUS_KHUSUS.nama`)
- Modify: `packages/engine/src/stages/bagian.ts` (`bagianSaudaraSeibu`, teruskan `aturan`)
- Modify: `packages/explain/src/cerita.ts:188` (switch `nama`), `packages/explain/src/arab.ts` dan `ringkas.ts` bila punya switch yang sama (TypeScript akan menandainya)
- Modify: `packages/engine/src/__tests__/fixtures/madzhab.ts`

**Interfaces:**
- Produces: `KASUS_KHUSUS.nama` ditambah `'musyarrakahTanpaTasyrik'`, dengan refs `['K07-1']`.

- [ ] **Step 1: Fixture**

Tambahkan ke `fixtures/madzhab.ts`, dan masukkan ke `KASUS_MADZHAB`:

```ts
// ─── K07-1: suami, ibu, 2 saudara seibu, saudara lk kandung (bab 7 contoh) ───
// [SYF]/[MLK] tasyrik: ashl 6 → tashih 18: suami 9, ibu 3, tiap saudara (3 orang) 2.
// [HNB]/[HNF] tanpa tasyrik: suami 3, ibu 1, tiap saudara seibu 1, saudara kandung 0 (ashl 6).
const grafK07_1: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'P', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }),
    A: p('A', 'L', penghubung),
    AT: p('AT', 'L', penghubung),
    I: p('I', 'P'),
    H: p('H', 'L'),
    SI1: p('SI1', 'L', { idAyah: 'AT', idIbu: 'I' }),
    SI2: p('SI2', 'P', { idAyah: 'AT', idIbu: 'I' }),
    SK: p('SK', 'L', { idAyah: 'A', idIbu: 'I' }),
  },
  pernikahan: [{ idSuami: 'H', idIstri: 'PW', status: 'utuh' }],
};

export const KASUS_MUSYARRAKAH: KasusMadzhab[] = [
  { id: 'MZ5', kode: 'K07-1', menguji: 'musyarrakah', graf: grafK07_1, harapan: {
    syafii: { saham: { H: 9n, I: 3n, SI1: 2n, SI2: 2n, SK: 2n }, penyebut: 18n },
    maliki: { saham: { H: 9n, I: 3n, SI1: 2n, SI2: 2n, SK: 2n }, penyebut: 18n },
    hanbali: { saham: { H: 3n, I: 1n, SI1: 1n, SI2: 1n }, penyebut: 6n },
    hanafi: { saham: { H: 3n, I: 1n, SI1: 1n, SI2: 1n }, penyebut: 6n } } },
];
```

Run: `pnpm --filter @waris/engine exec vitest run src/__tests__/madzhab.test.ts`
Expected: MZ5 [HNB]/[HNF] FAIL.

- [ ] **Step 2: Implementasi**

`types.ts`: `nama: 'umariyyatain' | 'musyarrakah' | 'musyarrakahTanpaTasyrik' | 'akdariyyah' | 'muaddah'`.

`bagian.ts`: `tetapkanBagian(efektif, kandidat, aturan)` meneruskan `aturan` ke `bagianSaudaraSeibu(penyusun, aturan)`:

```ts
function bagianSaudaraSeibu(penyusun: Penyusun, aturan: AturanMadzhab): boolean {
  const awladUmm = penyusun.dari('SAUDARA_SEIBU', 'SAUDARI_SEIBU');
  if (adalahMusyarrakah(penyusun.efektif)) {
    if (aturan.tasyrik) {
      penyusun.jejak.push({ tahap: 'furudh', refs: [rujukanTitik(aturan, 'K07-1', 'R07-2')], jenis: 'KASUS_KHUSUS', nama: 'musyarrakah' });
      penyusun.tambahFardh('MUSYARRAKAH', [...awladUmm, ...penyusun.dari('SAUDARA_KANDUNG', 'SAUDARI_KANDUNG')], TSULUTS, { kode: 'MUSYARRAKAH' }, [rujukanTitik(aturan, 'K07-1', 'R07-2')]);
      return true;
    }
    // [K07-1] [HNB]/[HNF] tanpa tasyrik: saudara seibu tetap 1/3, saudara kandung ashabah atas sisa yang sudah habis.
    penyusun.jejak.push({ tahap: 'furudh', refs: ['K07-1'], jenis: 'KASUS_KHUSUS', nama: 'musyarrakahTanpaTasyrik' });
  }
  if (awladUmm.length > 0) {
    penyusun.tambahFardh('AWLAD_UMM', awladUmm, awladUmm.length === 1 ? SUDUS : TSULUTS, { kode: 'KALALAH', banyaknya: awladUmm.length }, ['R04-16']);
  }
  return false;
}
```

Explain: di switch `nama` pada `cerita.ts` tambahkan:

```ts
    case 'musyarrakahTanpaTasyrik':
      return kalimat`Susunan ini dikenal sebagai ${istilah('musyarrakah', 'al-Musyarrakah')}, tetapi menurut madzhab ini saudara kandung tidak digabung dengan saudara seibu, jadi ia tidak mendapat sisa.`;
```

Padanan Arab di `arab.ts` (bila ada switch serupa): `kalimat\`${istilah('musyarrakah', 'المشركة')}، ولا تشريك فيها على هذا المذهب\``. Tambahkan tes explain untuk MZ5 [HNB] yang memastikan kalimat itu muncul.

- [ ] **Step 3: Jalankan**

Run: `pnpm -r test`
Expected: semua PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/engine packages/explain
git commit -m "engine: overlay K07-1 musyarrakah tanpa tasyrik untuk [HNB]/[HNF]

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Overlay kakek — K05-1/K08-1 ([HNF] kakek = ayah)

**Files:**
- Modify: `packages/engine/src/stages/hajb.ts` (cabang saudara kandung/sebapak)
- Modify: `packages/engine/src/__tests__/fixtures/madzhab.ts`

- [ ] **Step 1: Fixture**

```ts
// ─── K05-1: istri, kakek, saudara lk kandung ───
// [SYF]/[HNB]/[MLK] (bab 08): istri 1/4; sisa 3/4, kakek pilih terbaik: muqasamah 3/8 > 1/6 dan > 1/3 sisa (1/4)
//   → ashl 4 → tashih 8: istri 2, kakek 3, saudara 3.
// [HNF]: kakek menghijab saudara (Mabsuth 29/180) → istri 1, kakek 3 (ashl 4).
const grafK05_1: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }),
    A: p('A', 'L', { ...penghubung, idAyah: 'K' }),
    I: p('I', 'P', penghubung),
    K: p('K', 'L'),
    W: p('W', 'P'),
    SK: p('SK', 'L', { idAyah: 'A', idIbu: 'I' }),
  },
  pernikahan: [{ idSuami: 'PW', idIstri: 'W', status: 'utuh' }],
};

export const KASUS_KAKEK: KasusMadzhab[] = [
  { id: 'MZ6', kode: 'K05-1', menguji: 'kakek bersama saudara kandung', graf: grafK05_1, harapan: {
    syafii: { saham: { W: 2n, K: 3n, SK: 3n }, penyebut: 8n }, hanbali: { saham: { W: 2n, K: 3n, SK: 3n }, penyebut: 8n },
    maliki: { saham: { W: 2n, K: 3n, SK: 3n }, penyebut: 8n }, hanafi: { saham: { W: 1n, K: 3n }, penyebut: 4n } } },
];
```

Masukkan `KASUS_MUSYARRAKAH` dan `KASUS_KAKEK` ke `KASUS_MADZHAB`.

Run: tes madzhab. Expected: MZ6 [HNF] FAIL.

- [ ] **Step 2: Implementasi**

`hajb.ts`:

```ts
    case 'SAUDARA_KANDUNG': case 'SAUDARI_KANDUNG': {
      // [K05-1] [HNF] kakek = ayah: menghijab saudara kandung/sebapak.
      const olehKakek = aturan.kakekMenghijabSaudara ? kakek : [];
      if (olehKakek.length > 0 && faruMudzakkar.length === 0 && ayah.length === 0) return hajibDari(olehKakek, 'K05-1');
      return hajibDari([...faruMudzakkar, ...ayah], 'R06-4');
    }

    case 'SAUDARA_SEBAPAK': case 'SAUDARI_SEBAPAK': {
      const penghalangDasar = [...faruMudzakkar, ...ayah];
      if (aturan.kakekMenghijabSaudara && penghalangDasar.length === 0 && kakek.length > 0) return hajibDari(kakek, 'K05-1');
      // ...isi cabang lama tanpa perubahan...
    }
```

Setelah saudara dihijab, `bagianKakek` tidak menemukan saudara, sehingga `jaddWalIkhwah` tidak dipanggil. Periksa di `bagian.ts:191-215` bahwa jalur ini tidak memakai token bab 08. Kalau ternyata dipakai, pastikan cabang tanpa saudara tidak memancarkan R08-x.

- [ ] **Step 3: Jalankan**

Run: `pnpm --filter @waris/engine test`
Expected: semua PASS. Kasus [HNF] lain dengan kakek yang menyentuh token "tidak" di 18.4 (mis. R07-1 'Umariyyatain dengan kakek) akan `TIDAK_DIDUKUNG`. Itu disengaja.

- [ ] **Step 4: Commit**

```bash
git add packages/engine
git commit -m "engine: overlay K05-1 [HNF] kakek menghijab saudara kandung/sebapak

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Content — matriks 18 sebagai rujukan yang bisa dicari

Explain dan web menampilkan chip rujukan dari kode. Kode `Kxx-y` perlu bisa dicari seperti `Rxx-y`: titik, sel madzhab, sumber, tautan shamela.

**Files:**
- Modify: `packages/content/src/refs.ts`, `packages/content/src/index.ts`
- Test: `packages/content/src/__tests__/refs.test.ts`

**Interfaces:**
- Produces: `interface TitikKhilaf { kode: string; titik: string; sel: Record<'syafii' | 'hanbali' | 'hanafi' | 'maliki', string>; bab: string; tautan: Record<'syafii' | 'hanbali' | 'hanafi' | 'maliki', TautanRujukan[]> }`, `MATRIKS_KHILAF: TitikKhilaf[]`, `cariTitikKhilaf(kode: string): TitikKhilaf | undefined`

- [ ] **Step 1: Tes yang gagal**

```ts
describe('Matriks khilaf bab 18.2', () => {
  test('memuat semua kode Kxx-y dengan empat sel', () => {
    const kode = MATRIKS_KHILAF.map(titik => titik.kode);
    expect(kode).toEqual(expect.arrayContaining(['K03-1', 'K04-1', 'K04-2', 'K05-1', 'K07-1', 'K08-1', 'K09-1']));
    expect(new Set(kode).size).toBe(kode.length);
  });

  test('K04-2 [HNB] berisi sel Mughni dan tautannya', () => {
    const titik = cariTitikKhilaf('K04-2')!;
    expect(titik.sel.hanbali).toContain('tidak terhijab');
    expect(titik.tautan.hanbali.map(tautan => tautan.label)).toContain('shamela:8463/2625');   // sesuaikan dengan bentuk `label` hasil uraiTautan
  });

  test('setiap Kxx-y yang dipakai engine ada di matriks', () => {
    // KODE_ENGINE: hasil `grep -rohE "K[0-9]{2}[a-d]?-[0-9]+" packages/engine/src --exclude-dir=__tests__ | sort -u`
    for (const kode of KODE_ENGINE) expect(cariTitikKhilaf(kode), kode).toBeDefined();
  });
});
```

- [ ] **Step 2: Implementasi**

```ts
export interface TitikKhilaf {
  kode: string; titik: string; bab: string;
  sel: Record<Ruleset, string>;
  tautan: Record<Ruleset, TautanRujukan[]>;
}
type Ruleset = 'syafii' | 'hanbali' | 'hanafi' | 'maliki';

/** Baris matriks bab 18.2 (beberapa sub-tabel ###; baris kepala ulang disaring lewat pola kode). */
export const MATRIKS_KHILAF: TitikKhilaf[] = barisTabelBagian(bab18, '18.2')
  .filter(([kode = '']) => /^K\d{2}[a-d]?-\d+$/.test(kode))
  .map(([kode = '', titik = '', syafii = '', hanbali = '', hanafi = '', maliki = '', bab = '']) => {
    const sel = { syafii, hanbali, hanafi, maliki };
    return { kode, titik, bab, sel, tautan: Object.fromEntries(Object.entries(sel).map(([madzhab, isi]) => [madzhab, uraiTautan(isi)])) as TitikKhilaf['tautan'] };
  });

const titikMenurutKode = new Map(MATRIKS_KHILAF.map(titik => [titik.kode, titik]));
export const cariTitikKhilaf = (kode: string): TitikKhilaf | undefined => titikMenurutKode.get(kode);
```

Content tidak mengimpor engine, jadi tipe `Ruleset` diduplikasi lokal. Ekspor `MATRIKS_KHILAF`, `cariTitikKhilaf`, `type TitikKhilaf` dari `index.ts`.

Run: `pnpm --filter @waris/content test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/content
git commit -m "content: matriks khilaf bab 18.2 bisa dicari per kode Kxx-y

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Web — pilihan madzhab, label hasil, chip rujukan Kxx-y

**Files:**
- Modify: `apps/web/src/kasus.ts` (`Kasus.ruleset?`, `bacaKasus`)
- Modify: `apps/web/src/jalankan.ts` (`keInputEngine`)
- Modify: `apps/web/src/layar/wizard/LangkahPewaris.tsx` (pilihan madzhab)
- Modify: `apps/web/src/layar/Hasil.tsx:166` (label madzhab)
- Modify: `apps/web/src/layar/belajar/ChipDalil.tsx` (fallback `cariTitikKhilaf`)
- Modify: `apps/web/src/snapshot.json` (kunci diksi baru)
- Test: `apps/web/src/__tests__/kasus.test.ts` (kedua tes Step 1)

**Interfaces:**
- Consumes: `DAFTAR_RULESET`, `type Ruleset` (engine), `cariTitikKhilaf` (content)
- Produces: `Kasus.ruleset?: Ruleset` (tidak ada = `'syafii'`).

- [ ] **Step 1: Tes yang gagal**

Di `apps/web/src/__tests__/kasus.test.ts`:

```ts
test('file lama tanpa ruleset dibaca sebagai syafii; ruleset tak dikenal ditolak', () => {
  const lama = keJson(kasusBaru('L'));
  const hasil = dariJson(lama);
  expect(hasil.berhasil && (hasil.kasus.ruleset ?? 'syafii')).toBe('syafii');
  const aneh = JSON.parse(lama); aneh.ruleset = 'zhahiri';
  expect(dariJson(JSON.stringify(aneh)).berhasil).toBe(false);
});
```

Di file yang sama (impor `keInputEngine` dari `../jalankan`):

```ts
test('ruleset kasus diteruskan ke engine', () => {
  expect(keInputEngine({ ...kasusBaru('L'), ruleset: 'hanbali' }).ruleset).toBe('hanbali');
  expect(keInputEngine(kasusBaru('L')).ruleset).toBe('syafii');
});
```

Run: `pnpm --filter @waris/web test`
Expected: FAIL.

- [ ] **Step 2: Implementasi data**

`kasus.ts`: di interface `Kasus` tambahkan `/** Madzhab perhitungan; tidak ada = Syafi'i (file lama). */ ruleset?: Ruleset;`. Di `bacaKasus`:

```ts
  if (objek.ruleset !== undefined && !DAFTAR_RULESET.includes(objek.ruleset as Ruleset)) throw new Error(t('hitung.madzhab_tidak_dikenal'));
  const ruleset = objek.ruleset as Ruleset | undefined;
  const kasus: Kasus = { versi: 2, graf, tirkah, satuanPembulatan, urutanWafat, ...(rincianHarta ? { rincianHarta } : {}), ...(ruleset ? { ruleset } : {}) };
```

`jalankan.ts`: `ruleset: kasus.ruleset ?? 'syafii',`.

- [ ] **Step 3: UI**

`LangkahPewaris.tsx`: di bawah isian nama, tambahkan satu `<label className="isian isian-kecil">` berisi `<select>` dengan empat opsi dari `DAFTAR_RULESET`. Label opsi memakai `t('umum.madzhab_syafii')` dan seterusnya. Tambahkan prop `saatPilihMadzhab: (ruleset: Ruleset) => void`, dan sambungkan di `Wizard.tsx` dengan pola yang sama seperti `saatUbahNama` (ubah `kasus.ruleset`). Opsi non-[SYF] diberi keterangan kecil `t('hitung.madzhab_sekunder_keterangan')`.

`Hasil.tsx:166`: ganti `t('hitung.hasil_ini_menurut_madzhab_syafi_i')` dengan `t('hitung.hasil_ini_menurut_madzhab', { madzhab: namaMadzhab(kasus.ruleset ?? 'syafii') })`.

`ChipDalil.tsx`: bila `cariRujukan(kode)` kosong dan kode cocok `/^K/`, pakai `cariTitikKhilaf(kode)`. Klaim = `titik`, isi = sel madzhab hasil (`hasil.ruleset`) + tautannya.

Diksi baru di `snapshot.json`, dengan format entri seperti `hitung.hasil_ini_menurut_madzhab_syafi_i`:

| kunci | id | ar |
|---|---|---|
| `hitung.madzhab` | Madzhab | المذهب |
| `umum.madzhab_syafii` | Syafi'i | الشافعي |
| `umum.madzhab_hanbali` | Hanbali | الحنبلي |
| `umum.madzhab_hanafi` | Hanafi | الحنفي |
| `umum.madzhab_maliki` | Maliki | المالكي |
| `hitung.madzhab_sekunder_keterangan` | Selain Syafi'i: hanya titik perbedaan yang sudah dikaji; kasus lain akan ditolak dengan alasannya. | غير الشافعي: تُعتمد مواضع الخلاف المدروسة فقط، وما سواها يُرفض مع بيان السبب. |
| `hitung.hasil_ini_menurut_madzhab` | Hasil ini menurut madzhab {madzhab}. Untuk pembagian nyata, musyawarahkan dengan ahli faraidh atau ustadz setempat. | هذه النتيجة على مذهب {madzhab}. وللقسمة الحقيقية شاوروا أهل الفرائض أو عالما محليا. |
| `hitung.madzhab_tidak_dikenal` | Madzhab di file tidak dikenal. | المذهب في الملف غير معروف. |

- [ ] **Step 4: Jalankan + verifikasi browser**

Run: `pnpm -r test && pnpm --filter @waris/web exec tsc --noEmit`
Expected: PASS.

Browser (`preview_start` name `web`):
1. Muat kasus MZ1 (K04-2) lewat localStorage `arif-waris:kasus`, `ruleset: 'hanbali'`.
2. Buka hasil: nenek mendapat 1/6, label "menurut madzhab Hanbali".
3. Ganti ke Syafi'i: nenek terhalang.
4. Chip rujukan nenek di mode Hanbali menampilkan sel K04-2 dengan tautan Mughni.
5. Screenshot sebagai bukti.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git commit -m "web: pilihan madzhab di langkah pewaris, label hasil per madzhab, chip rujukan Kxx-y

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Di luar rencana ini (dicatat, bukan dikerjakan)

- K02-x mawani' antar-madzhab (ditunda; gerbang menolak kasusnya).
- K05-2 wala' dengan ayah mu'tiq: engine belum memodelkan 'ashabah mu'tiq, jadi titik ini belum tersentuh.
- K13a–d, K14-x: dikerjakan bersama bab 13/14 nanti, langsung dengan `AturanMadzhab`.
- Opsi `kebijakanSisa` di UI web (baitul mal teratur): engine siap sejak Task 2; tampilan pengaturannya belum.
- Label kerabat jauh (`SEPUPU_SEBAPAK` untuk semua kedalaman) dan mode pohon bebas: rencana terpisah.
