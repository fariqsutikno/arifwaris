# Dzawil Arham (bab 14) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kasus yang kini berhenti di `TIDAK_DIDUKUNG (fase 3)` — hanya dzawil arham, atau hanya pasangan + dzawil arham — dihitung tuntas dengan metode tanzil, lengkap dengan jejak dan narasi templat.

**Architecture:** Orkestrator `hitungDzawilArham(input)` di atas pipeline (pola `munasakhat.ts`), tanda tangan sama dengan `hitung`. Tiga tahap: cari rute tanzil & saring jihah → `hitung()` pada graf posisi para perantara → bagian tiap perantara diberikan ke penerimanya lewat `hitungDzawilArham` rekursif (perantara sebagai pewaris), digabung dengan `gabungkan` (diangkat dari munasakhat). Pasangan = munasakhat keadaan 3.

**Tech Stack:** TypeScript, pnpm workspace, vitest, `@waris/math` (bigint `fpb`), `@waris/engine`, `@waris/explain`.

**Spec:** `docs/superpowers/specs/2026-09-30-dzawil-arham-design.md`

## Global Constraints

- Semua nama/komentar bahasa Indonesia; istilah fikih sesuai `docs/kb/15_glosarium.md`.
- Jalur hitung: `bigint` saja, dilarang `number` (kecuali indeks loop / `langkah` hitungan derajat).
- Fungsi murni: tanpa I/O, `Date`, `Math.random`.
- Setiap cabang fikih diberi anotasi rujukan `// [R14-x] ...` atau `// [K14-x] ...`.
- Pelanggaran invarian = `throw new Error('invariant: ...')`, bukan lanjut diam-diam.
- Tidak ada aturan di luar KB bab 14/18; yang tak tercakup → `TIDAK_DIDUKUNG`.
- Narasi hanya lewat diksi (`pnpm diksi:tambah <file.json>`); tes `cakupan.test.ts` harus tetap lulus (tidak ada ``kalimat`…` `` berhuruf).
- `hitung()` tidak berubah perilakunya kecuali field `kode` baru di satu `TIDAK_DIDUKUNG`.
- Commit setelah tiap task, hanya file task itu; pesan diakhiri `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Perintah tes: `pnpm --filter @waris/engine test`, `pnpm --filter @waris/explain test`, `pnpm --filter @waris/content test`, `pnpm typecheck`.

## Review Focus

1. Pernikahan antarkerabat (satu orang punya dua lintasan ke pewaris) — rute ganda harus dideduplikasi, dan dua jalur sungguhan dijumlahkan, bukan dihitung dua kali. (Task 4 tes `semuaLintasan` dedup; Task 7 DA-07.)
2. Dzawil arham non-muslim / pembunuh / agama belum diisi — tidak boleh menempati kursi perantara. (Task 6 tes mawani.)
3. Perantara terhijab di mas'alah perantara (mis. saudari oleh ayah) — penerimanya harus tampil sebagai terhalang dengan saham 0, bukan hilang dari hasil. (Task 7 DA-06 `dikecualikan`.)
4. Nominal & pembulatan pada hasil dzawil arham — Σ nominal + selisih pembulatan = harta bersih. (Task 7 tes nominal.)
5. Mas'alah perantara ber-'aul — hanya 6→7 yang sah; pelanggaran harus throw. (Task 5 unit `periksaAulDzawilArham`; Task 7 DA-16.)

---

## File Structure

| File | Tanggung jawab |
|---|---|
| `docs/kb/18_matriks_khilaf.md`, `docs/kb/14_dzawil_arham.md` | keputusan 18.4 token R14-x per madzhab; koreksi teks 14.8 (Task 1, checkpoint) |
| `packages/engine/src/rulesets/berlaku.ts` | salinan 18.4 (Task 1) |
| `packages/engine/src/types.ts` | `Jihah`, tahap `dzawilArham`, jejak `DZAWIL_ARHAM_*`, `kode` di `TIDAK_DIDUKUNG`, `K14-3` |
| `packages/engine/src/gabung.ts` (baru) | `gabungkan`, `periksaInvarian`, `sahamDari`, `idSisaKeluar`, `totalSaham` — dipakai munasakhat & dzawil arham |
| `packages/engine/src/stages/mawani.ts` | ekspor `maniDari(orang)` (fungsi bersama) |
| `packages/engine/src/stages/tanzil.ts` (baru) | `semuaLintasan`, `cariRuteTanzil`, `saringJihah` |
| `packages/engine/src/stages/perantara.ts` (baru) | `grafPosisi`, `bagiAntarPerantara`, `periksaAulDzawilArham`, `samakanDalamSatuKelompok` |
| `packages/engine/src/dzawilArham.ts` (baru) | orkestrator `hitungDzawilArham` |
| `packages/engine/src/__tests__/fixtures/dzawilArham.ts` (baru) | fixture regression DA-01..DA-16 |
| `packages/engine/src/__tests__/dzawilArham.test.ts` (baru) | regression + invarian + gerbang + mawani |
| `packages/engine/src/stages/__tests__/tanzil.test.ts` (baru) | unit tahap tanzil & perantara |
| `packages/explain/src/dzawilArham.ts` (baru) | bab penjelasan dzawil arham (id + ar lewat diksi) |
| `packages/explain/src/narasi.ts`, `cerita.ts`, `arab.ts` | cabang ke bab dzawil arham; ekspor `babHasil` |
| `apps/web/src/jalankan.ts`, `packages/engine/src/index.ts` | pintu masuk publik |

---

### Task 1: Checkpoint KB — keberlakuan 18.4 dan koreksi 14.8 (BERHENTI untuk keputusan pengguna)

**Files:**
- Modify: `docs/kb/18_matriks_khilaf.md` (tabel 18.4, baris R14-x sekitar baris 157–159)
- Modify: `docs/kb/14_dzawil_arham.md` (14.8)
- Modify: `packages/engine/src/rulesets/berlaku.ts`
- Modify: `docs/superpowers/specs/2026-09-30-dzawil-arham-design.md` (baris tes 14.8)
- Test: `packages/content/src/__tests__/refs.test.ts` (sudah ada; menjaga 18.4 ↔ berlaku.ts)

**Interfaces:**
- Produces: `BERLAKU_LINTAS_MADZHAB.hanbali` memuat token R14 yang disetujui; dipakai gerbang saat Task 7 menguji [HNB].

- [ ] **Step 1: Sajikan keputusan ke pengguna dan TUNGGU jawaban.** Kirim pesan ini (jangan edit KB sebelum dijawab):

```
Sebelum kode bab 14 ditulis, ada 4 titik KB yang perlu keputusan Anda:

(a) Tabel 18.4 — token bab 14 untuk [HNB]. Hasil [HNB] memakai R14-4 (definisi), R14-7 (yang lebih dulu sampai),
    R14-9 (tunggal ambil semua), R14-10 (jihah), R14-11 (dua jalur), R14-12 (pasangan), R14-13 ('aul 6→7).
    Usulan: semuanya "ya" untuk [HNB] (dasar: Mughni 6/318–319 tanzil; Lahim hlm. 192–217, nukilan Hanbali),
    "tidak" untuk [HNF] dan [MLK]. R14-4 kini "tidak" karena alasan K14-1, padahal K14-1 soal *apakah mewarisi*,
    bukan definisi. R14-8 tetap "tidak" untuk [HNB] (diganti K14-3).
(b) 14.8: "satu orang = anak lk dari anak pr saudara seibu DAN anak lk dari saudari kandung" mustahil secara nasab
    (dua ibu). Agar angka Lahim (5: 4, 1) konsisten dengan R14-7, bacaan yang cocok: orang itu = anak lk dari
    **anak lk** saudari kandung (dari pihak ayahnya) dan anak lk dari anak pr saudara seibu (dari pihak ibunya),
    bersama cucu lk saudari sebapak. Mohon cek Lahim hlm. 194 dan konfirmasi.
(c) [HNB] K14-3 di engine: di bawah satu perantara, penerima dalam satu kelompok dibagi sama rata; khal+khalah
    (di bawah perantara ibu) tetap 2:1 (Mughni 6/324); penerima di beberapa kelompok → TIDAK_DIDUKUNG K14-3.
(d) [MLK] dengan kebijakan radd (imam tidak adil): mewarisi menurut K14-1, tapi metodenya (K14-2) kosong
    → TIDAK_DIDUKUNG K14-2.
Setuju semua, atau ada yang diubah?
```

- [ ] **Step 2: Setelah disetujui, edit 18.4.** Ganti baris R14-4 dan tambahkan baris R14-6..R14-13 (urut kode) di tabel 18.4 dengan kolom `| Token | [HNB] | [HNF] | [MLK] | Dasar |`, sesuai jawaban (a). Contoh bila (a) disetujui apa adanya:

```markdown
| R14-4 | ya | tidak | tidak | Definisi sama (Mughni 6/318); K14-1 hanya soal apakah mewarisi |
| R14-6 | tidak | tidak | tidak | Kutipan Raudhah khusus [SYF]; [HNB] tanzil lewat K14-2 |
| R14-7 | ya | tidak | tidak | Lahim hlm. 192–193 (nukilan Hanbali); [HNF] qarabah |
| R14-8 | tidak | tidak | tidak | K14-3 berbeda |
| R14-9 | ya | tidak | tidak | Mughni 6/319 tanzil |
| R14-10 | ya | tidak | tidak | Lahim hlm. 192–194 |
| R14-11 | ya | tidak | tidak | Lahim hlm. 194–195 |
| R14-12 | ya | tidak | tidak | Lahim hlm. 207–208 |
| R14-13 | ya | tidak | tidak | Lahim hlm. 217 |
```

- [ ] **Step 3: Sinkronkan `berlaku.ts`.** Tambahkan token berstatus "ya" ke set `hanbali` (urut leksikografis seperti isi set sekarang), mis. `'R14-4', 'R14-7', 'R14-9', 'R14-10', 'R14-11', 'R14-12', 'R14-13'` disisipkan setelah `'R13-1'`.

- [ ] **Step 4: Koreksi 14.8** di `docs/kb/14_dzawil_arham.md` sesuai jawaban (b), dan samakan baris tabel tes 14.8 di spec.

- [ ] **Step 5: Jalankan tes content**

Run: `pnpm --filter @waris/content test`
Expected: PASS (tes `KB 18.4 keberlakuan token` mencocokkan tabel dengan `berlaku.ts`).

- [ ] **Step 6: Commit**

```bash
git add docs/kb/18_matriks_khilaf.md docs/kb/14_dzawil_arham.md packages/engine/src/rulesets/berlaku.ts docs/superpowers/specs/2026-09-30-dzawil-arham-design.md
git commit -m "kb: keberlakuan token bab 14 untuk [HNB] (18.4) dan koreksi contoh 14.8

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Fixture regression dzawil arham (sebelum logika)

**Files:**
- Create: `packages/engine/src/__tests__/fixtures/dzawilArham.ts`
- Create: `packages/engine/src/__tests__/dzawilArham.test.ts`

**Interfaces:**
- Consumes: `p`, `input`, `case24` dari `./bab16.js`.
- Produces: `DZAWIL_ARHAM_FIXTURES: FixtureDzawilArham[]`, `KASUS_DZAWIL_ARHAM_MADZHAB`, dan graf bernama (`grafDA06`, dst.) yang dipakai Task 7 dan Task 9. Test mengimpor `hitungDzawilArham` dari `../dzawilArham.js` (dibuat Task 7).

- [ ] **Step 1: Tulis fixture**

```ts
/**
 * Fixture regression dzawil arham (bab 14) — dibuat SEBELUM logika. Harapan = saham akhir per orang (> 0)
 * terhadap `penyebut`; dibandingkan sebagai pecahan kecuali `penyebutEksak`.
 */
import type { GrafKeluarga, InputEngine, KonfigurasiMadzhab, Ruleset } from '../../types.js';
import { case24, input, p } from './bab16.js';

export interface FixtureDzawilArham {
  id: string;
  sumber: string;
  menguji: string;
  input: InputEngine;
  harapan:
    | { status: 'OK'; saham: Record<string, bigint>; penyebut: bigint; penyebutEksak?: boolean; dikecualikan?: string[]; jenisJejak?: string[] }
    | { status: 'TIDAK_DIDUKUNG'; refs: string[] }
    | { status: 'PERLU_INPUT'; isian: string[] };
}

const penghubung = { statusHidup: 'wafat' as const, penghubung: true };
const RADD: KonfigurasiMadzhab = { kebijakanSisa: 'radd', talakBainSaatMaradh: 'qaulJadid' };
const BAITUL_MAL: KonfigurasiMadzhab = { kebijakanSisa: 'baitulMal', talakBainSaatMaradh: 'qaulJadid' };
const dengan = (graf: GrafKeluarga, ruleset: Ruleset = 'syafii', konfigurasi: KonfigurasiMadzhab = RADD): InputEngine =>
  ({ ...input(graf, konfigurasi), ruleset });

/** Pewaris lk D dengan ayah F1 & ibu M1 (keduanya wafat). */
const keluargaInti = {
  D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
  F1: p('F1', 'L', penghubung),
  M1: p('M1', 'P', penghubung),
};

// 14.6 #1: anak pr saudara lk kandung / seibu / sebapak → sebagai saudara kandung (ashabah), seibu (1/6), sebapak (terhijab).
export const grafDA02: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    FX: p('FX', 'L', penghubung), MX: p('MX', 'P', penghubung),
    SK: p('SK', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    SI: p('SI', 'L', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    SB: p('SB', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'MX' }),
    A1: p('A1', 'P', { idAyah: 'SK' }),
    A2: p('A2', 'P', { idAyah: 'SI' }),
    A3: p('A3', 'P', { idAyah: 'SB' }),
  },
  pernikahan: [],
};

// 14.6 #3: anak pr dari anak pr dari anak pr (X1, 2 langkah) vs anak pr dari bint ibn ibn (X2, 1 langkah) → semua X2.
export const grafDA03: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { statusHidup: 'wafat' }),
    AP: p('AP', 'P', { ...penghubung, idAyah: 'D' }),
    APP: p('APP', 'P', { ...penghubung, idIbu: 'AP' }),
    X1: p('X1', 'P', { idIbu: 'APP' }),
    S: p('S', 'L', { ...penghubung, idAyah: 'D' }),
    SS: p('SS', 'L', { ...penghubung, idAyah: 'S' }),
    SSD: p('SSD', 'P', { ...penghubung, idAyah: 'SS' }),
    X2: p('X2', 'P', { idIbu: 'SSD' }),
  },
  pernikahan: [],
};

// 14.6 #4: ayahnya ibu, anak pr saudari seibu / kandung / sebapak → ibu 1/6, seibu 1/6, kandung 1/2, sebapak 1/6.
export const grafDA04: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    M1: p('M1', 'P', { ...penghubung, idAyah: 'MGF' }),
    MGF: p('MGF', 'L'),
    FX: p('FX', 'L', penghubung), MX: p('MX', 'P', penghubung),
    SiI: p('SiI', 'P', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    SiB: p('SiB', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'MX' }),
    B1: p('B1', 'P', { idIbu: 'SiI' }),
    B2: p('B2', 'P', { idIbu: 'SiK' }),
    B3: p('B3', 'P', { idIbu: 'SiB' }),
  },
  pernikahan: [],
};

// 14.4: cicit pr dari anak pr (bunuwwah, 2 langkah) + anak pr saudara lk kandung (ubuwwah) → masing-masing 1/2.
export const grafDA05: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    AP: p('AP', 'P', { ...penghubung, idAyah: 'D' }),
    Q: p('Q', 'P', { ...penghubung, idIbu: 'AP' }),
    X1: p('X1', 'P', { idIbu: 'Q' }),
    SK: p('SK', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    X2: p('X2', 'P', { idAyah: 'SK' }),
  },
  pernikahan: [],
};

// 14.7 (Lahim hlm. 222): 'ammah kandung (→ ayah), anak lk saudari kandung (→ saudari, terhijab ayah), anak lk anak pr (→ anak pr).
export const grafDA06: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    F1: p('F1', 'L', { ...penghubung, idAyah: 'PGF', idIbu: 'PGM' }),
    PGF: p('PGF', 'L', penghubung), PGM: p('PGM', 'P', penghubung),
    AM1: p('AM1', 'P', { idAyah: 'PGF', idIbu: 'PGM' }),
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    NS: p('NS', 'L', { idIbu: 'SiK' }),
    AP: p('AP', 'P', { ...penghubung, idAyah: 'D' }),
    NP: p('NP', 'L', { idIbu: 'AP' }),
  },
  pernikahan: [],
};

// 14.8 (dikoreksi di Task 1): Z = anak lk dari anak lk saudari kandung (pihak ayah Z) sekaligus anak lk dari anak pr
// saudara seibu (pihak ibu Z); Y = cucu lk saudari sebapak. Mas'alah 5: Z = 3 + 1, Y = 1.
export const grafDA07: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    FX: p('FX', 'L', penghubung), MX: p('MX', 'P', penghubung),
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    AZ: p('AZ', 'L', { ...penghubung, idIbu: 'SiK' }),
    SI: p('SI', 'L', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    IZ: p('IZ', 'P', { ...penghubung, idAyah: 'SI' }),
    Z: p('Z', 'L', { idAyah: 'AZ', idIbu: 'IZ' }),
    SiB: p('SiB', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'MX' }),
    AY: p('AY', 'L', { ...penghubung, idIbu: 'SiB' }),
    Y: p('Y', 'L', { idAyah: 'AY' }),
  },
  pernikahan: [],
};

// 14.9: suami + anak lk anak pr → 2: 1, 1.
export const grafDA08: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'P', { statusHidup: 'wafat' }),
    H: p('H', 'L'),
    AP: p('AP', 'P', { ...penghubung, idIbu: 'D', idAyah: 'H' }),
    X: p('X', 'L', { idIbu: 'AP' }),
  },
  pernikahan: [{ idSuami: 'H', idIstri: 'D', status: 'utuh' }],
};

// 14.9: istri + anak saudari kandung → 4: 1, 3.
export const grafDA09: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    W: p('W', 'P'),
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    X: p('X', 'L', { idIbu: 'SiK' }),
  },
  pernikahan: [{ idSuami: 'D', idIstri: 'W', status: 'utuh' }],
};

// 14.9: 4 istri + anak pr saudara kandung → 16: tiap istri 1, anak pr saudara 12.
export const grafDA10: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    W1: p('W1', 'P'), W2: p('W2', 'P'), W3: p('W3', 'P'), W4: p('W4', 'P'),
    SK: p('SK', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    X: p('X', 'P', { idAyah: 'SK' }),
  },
  pernikahan: ['W1', 'W2', 'W3', 'W4'].map(idIstri => ({ idSuami: 'D', idIstri, status: 'utuh' as const })),
};

// K14-3: anak lk & anak pr dari anak pr. [SYF] 2:1; [HNB] sama rata.
export const grafDA11: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { statusHidup: 'wafat' }),
    AP: p('AP', 'P', { ...penghubung, idAyah: 'D' }),
    XL: p('XL', 'L', { idIbu: 'AP' }),
    XP: p('XP', 'P', { idIbu: 'AP' }),
  },
  pernikahan: [],
};

// K14-3 pengecualian [HNB]: khal & khalah kandung → 2:1 (Mughni 6/324); [SYF] juga 2:1 (saudara kandung ibu).
export const grafDA12: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    M1: p('M1', 'P', { ...penghubung, idAyah: 'MGF', idIbu: 'MGM' }),
    MGF: p('MGF', 'L', penghubung), MGM: p('MGM', 'P', penghubung),
    KH: p('KH', 'L', { idAyah: 'MGF', idIbu: 'MGM' }),
    KL: p('KL', 'P', { idAyah: 'MGF', idIbu: 'MGM' }),
  },
  pernikahan: [],
};

// Mawani': anak lk saudari non-muslim tidak menempati kursi perantara; anak pr saudara lk mengambil semua.
export const grafDA14: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    NS: p('NS', 'L', { idIbu: 'SiK', agama: 'nonIslam' }),
    SK: p('SK', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    X: p('X', 'P', { idAyah: 'SK' }),
  },
  pernikahan: [],
};

// 'Aul 6 → 7 [R14-13]: anak dua saudari kandung (2/3), anak dua saudara seibu (1/3), khalah (ibu 1/6).
export const grafDA16: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    M1: p('M1', 'P', { ...penghubung, idAyah: 'MGF' }),
    MGF: p('MGF', 'L', penghubung),
    FX: p('FX', 'L', penghubung),
    SiK1: p('SiK1', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    SiK2: p('SiK2', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    SI1: p('SI1', 'L', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    SI2: p('SI2', 'L', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    N1: p('N1', 'L', { idIbu: 'SiK1' }), N2: p('N2', 'L', { idIbu: 'SiK2' }),
    N3: p('N3', 'L', { idAyah: 'SI1' }), N4: p('N4', 'L', { idAyah: 'SI2' }),
    KL: p('KL', 'P', { idAyah: 'MGF' }),
  },
  pernikahan: [],
};

export const DZAWIL_ARHAM_FIXTURES: FixtureDzawilArham[] = [
  { id: 'DA-01', sumber: '16 #24, 14.6', menguji: "khalah (→ ibu) & 'ammah (→ ayah)", input: case24.input,
    harapan: { status: 'OK', saham: { KL1: 1n, AM1: 2n }, penyebut: 3n, jenisJejak: ['DZAWIL_ARHAM_TANZIL', 'DZAWIL_ARHAM_MASALAH_PERANTARA'] } },
  { id: 'DA-02', sumber: '14.6 #1', menguji: 'hajb antar-perantara lewat pipeline', input: dengan(grafDA02),
    harapan: { status: 'OK', saham: { A1: 5n, A2: 1n }, penyebut: 6n, dikecualikan: ['A3'] } },
  { id: 'DA-03', sumber: '14.6 #3', menguji: 'yang lebih dulu sampai ke ahli waris menang [R14-7]', input: dengan(grafDA03),
    harapan: { status: 'OK', saham: { X2: 1n }, penyebut: 1n, dikecualikan: ['X1'], jenisJejak: ['DZAWIL_ARHAM_TERHIJAB_JIHAH'] } },
  { id: 'DA-04', sumber: '14.6 #4', menguji: 'empat perantara berfardh', input: dengan(grafDA04),
    harapan: { status: 'OK', saham: { MGF: 1n, B1: 1n, B2: 3n, B3: 1n }, penyebut: 6n } },
  { id: 'DA-05', sumber: '14.4', menguji: 'lintas jihah: jarak tidak berpengaruh', input: dengan(grafDA05),
    harapan: { status: 'OK', saham: { X1: 1n, X2: 1n }, penyebut: 2n } },
  { id: 'DA-06', sumber: '14.7', menguji: 'hajb antar-perantara lintas jihah', input: dengan(grafDA06),
    harapan: { status: 'OK', saham: { AM1: 1n, NP: 1n }, penyebut: 2n, dikecualikan: ['NS'] } },
  { id: 'DA-07', sumber: '14.8', menguji: 'satu orang dua jalur [R14-11]', input: dengan(grafDA07),
    harapan: { status: 'OK', saham: { Z: 4n, Y: 1n }, penyebut: 5n, jenisJejak: ['DZAWIL_ARHAM_DUA_JALUR'] } },
  { id: 'DA-08', sumber: '14.9', menguji: 'suami + dzawil arham', input: dengan(grafDA08),
    harapan: { status: 'OK', saham: { H: 1n, X: 1n }, penyebut: 2n, penyebutEksak: true, jenisJejak: ['DZAWIL_ARHAM_GABUNG_PASANGAN'] } },
  { id: 'DA-09', sumber: '14.9', menguji: 'istri + dzawil arham', input: dengan(grafDA09),
    harapan: { status: 'OK', saham: { W: 1n, X: 3n }, penyebut: 4n, penyebutEksak: true } },
  { id: 'DA-10', sumber: '14.9', menguji: '4 istri + dzawil arham (tashih zaujiyyah)', input: dengan(grafDA10),
    harapan: { status: 'OK', saham: { W1: 1n, W2: 1n, W3: 1n, W4: 1n, X: 12n }, penyebut: 16n, penyebutEksak: true } },
  { id: 'DA-11', sumber: '14.5 (R14-8)', menguji: '[SYF] 2:1 di bawah perantara', input: dengan(grafDA11),
    harapan: { status: 'OK', saham: { XL: 2n, XP: 1n }, penyebut: 3n } },
  { id: 'DA-12', sumber: '14.5 (R14-8)', menguji: 'khal & khalah 2:1', input: dengan(grafDA12),
    harapan: { status: 'OK', saham: { KH: 2n, KL: 1n }, penyebut: 3n } },
  { id: 'DA-13', sumber: '14.3 (R14-5)', menguji: '[SYF] baitul mal tegak → tidak mewarisi', input: dengan(grafDA11, 'syafii', BAITUL_MAL),
    harapan: { status: 'TIDAK_DIDUKUNG', refs: ['R14-5'] } },
  { id: 'DA-14', sumber: '02 (R02-4)', menguji: 'mawani dzawil arham sebelum tanzil', input: dengan(grafDA14),
    harapan: { status: 'OK', saham: { X: 1n }, penyebut: 1n, jenisJejak: ['MANI'] } },
  { id: 'DA-15', sumber: '00 konvensi 4', menguji: 'agama dzawil arham belum diisi → tanya',
    input: dengan({ ...grafDA11, orang: { ...grafDA11.orang, XL: p('XL', 'L', { idIbu: 'AP', agama: 'tidakDiketahui' }) } }),
    harapan: { status: 'PERLU_INPUT', isian: ['agama'] } },
  { id: 'DA-16', sumber: '14.10 (R14-13)', menguji: "'aul 6 → 7", input: dengan(grafDA16),
    harapan: { status: 'OK', saham: { N1: 2n, N2: 2n, N3: 1n, N4: 1n, KL: 1n }, penyebut: 7n } },
];

/** Kasus yang sama lintas madzhab (K14-1..3). */
export const KASUS_DZAWIL_ARHAM_MADZHAB: Array<{ id: string; graf: GrafKeluarga; konfigurasi?: KonfigurasiMadzhab;
  harapan: Partial<Record<Ruleset, FixtureDzawilArham['harapan']>> }> = [
  { id: 'K14-3 anak dari anak pr', graf: grafDA11, harapan: {
    hanbali: { status: 'OK', saham: { XL: 1n, XP: 1n }, penyebut: 2n, jenisJejak: ['KHILAF_MADZHAB'] },
    hanafi: { status: 'TIDAK_DIDUKUNG', refs: ['K14-2'] },
    maliki: { status: 'TIDAK_DIDUKUNG', refs: ['K14-2'] },
  } },
  { id: 'K14-3 khal & khalah', graf: grafDA12, harapan: {
    hanbali: { status: 'OK', saham: { KH: 2n, KL: 1n }, penyebut: 3n },
  } },
  { id: 'K14-1 maliki baitul mal', graf: grafDA11, konfigurasi: BAITUL_MAL, harapan: {
    maliki: { status: 'TIDAK_DIDUKUNG', refs: ['K14-1'] },
  } },
];

export { dengan };
```

Catatan DA-16: ashl 6 → 'aul 7: dua saudari kandung 4, dua saudara seibu 2, ibu 1. N1/N2 masing-masing 2, N3/N4 masing-masing 1, KL 1.

- [ ] **Step 2: Tulis test regression**

```ts
import { describe, expect, test } from 'vitest';
import { hitungDzawilArham } from '../dzawilArham.js';
import type { HasilEngine, Ruleset } from '../types.js';
import { DZAWIL_ARHAM_FIXTURES, KASUS_DZAWIL_ARHAM_MADZHAB, dengan, type FixtureDzawilArham } from './fixtures/dzawilArham.js';

type Ok = Extract<HasilEngine, { status: 'OK' }>;
const fpb = (a: bigint, b: bigint): bigint => (b === 0n ? a : fpb(b, a % b));

function sahamPerOrang(hasil: Ok): Record<string, bigint> {
  return Object.fromEntries(hasil.tabel.baris.flatMap(baris => Object.entries(baris.perOrang).map(([id, sel]) => [id, sel.saham])));
}
function sebagaiPecahan(saham: Record<string, bigint>, penyebut: bigint): Record<string, string> {
  return Object.fromEntries(Object.entries(saham).filter(([, s]) => s > 0n)
    .map(([id, s]) => { const g = fpb(s, penyebut); return [id, `${s / g}/${penyebut / g}`]; }));
}

function periksa(hasil: HasilEngine, harapan: FixtureDzawilArham['harapan']) {
  expect(hasil.status).toBe(harapan.status);
  if (hasil.status === 'OK' && harapan.status === 'OK') {
    const saham = sahamPerOrang(hasil);
    const penyebut = hasil.tabel.totalKolom.tashih!;
    expect(sebagaiPecahan(saham, penyebut)).toEqual(sebagaiPecahan(harapan.saham, harapan.penyebut));
    expect(Object.values(saham).reduce((a, b) => a + b, 0n), 'Σ saham = penyebut').toBe(penyebut);
    if (harapan.penyebutEksak) expect(penyebut).toBe(harapan.penyebut);
    for (const id of harapan.dikecualikan ?? []) expect(hasil.tabel.dikecualikan).toContain(id);
    const jenis = new Set(hasil.jejak.map(langkah => langkah.jenis));
    for (const j of harapan.jenisJejak ?? []) expect(jenis, `jejak ${j}`).toContain(j);
    expect(hasil.sisaKeluar).toBeUndefined();
  } else if (hasil.status === 'TIDAK_DIDUKUNG' && harapan.status === 'TIDAK_DIDUKUNG') {
    expect(hasil.refs).toEqual(harapan.refs);
  } else if (hasil.status === 'PERLU_INPUT' && harapan.status === 'PERLU_INPUT') {
    expect(hasil.pertanyaan.map(q => q.isian)).toEqual(expect.arrayContaining(harapan.isian));
  }
}

describe('Dzawil arham bab 14 — regression [SYF]', () => {
  for (const fixture of DZAWIL_ARHAM_FIXTURES) {
    test(`${fixture.id} (${fixture.sumber}): ${fixture.menguji}`, () => periksa(hitungDzawilArham(fixture.input), fixture.harapan));
  }
});

describe('Dzawil arham — overlay madzhab (K14-1..3)', () => {
  for (const kasus of KASUS_DZAWIL_ARHAM_MADZHAB) {
    for (const [ruleset, harapan] of Object.entries(kasus.harapan) as Array<[Ruleset, FixtureDzawilArham['harapan']]>) {
      test(`${kasus.id} [${ruleset}]`, () => periksa(hitungDzawilArham(dengan(kasus.graf, ruleset, kasus.konfigurasi)), harapan));
    }
  }
});
```

- [ ] **Step 3: Jalankan — harus gagal**

Run: `pnpm --filter @waris/engine test dzawilArham`
Expected: FAIL — `Cannot find module '../dzawilArham.js'`.

- [ ] **Step 4: Commit**

```bash
git add packages/engine/src/__tests__/fixtures/dzawilArham.ts packages/engine/src/__tests__/dzawilArham.test.ts
git commit -m "engine: fixture regression dzawil arham bab 14 (sebelum logika)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Tipe jejak dzawil arham dan kode fase di pipeline

**Files:**
- Modify: `packages/engine/src/types.ts` (`Tahap` baris 115, `KodeKhilafOverlay` baris 142, `LangkahJejak` baris 144–182, `HasilEngine` baris 190–192)
- Modify: `packages/engine/src/pipeline.ts:105-107`
- Modify: `packages/engine/src/stages/model.ts:29`
- Test: `packages/engine/src/__tests__/regression.test.ts` (tambah satu test)

**Interfaces:**
- Produces (dipakai Task 4–10):
  - `export type Jihah = 'bunuwwah' | 'ubuwwah' | 'umumah';`
  - `Tahap` + `'dzawilArham'`; `KodeKhilafOverlay` + `'K14-3'`.
  - Varian `LangkahJejak`:
    - `{ jenis: 'DZAWIL_ARHAM_TANZIL'; idOrang; perantara: IdOrang; kunciPerantara: KunciAhliWaris; jihah: Jihah; langkah: number }`
    - `{ jenis: 'DZAWIL_ARHAM_TERHIJAB_JIHAH'; idOrang; perantara: IdOrang; oleh: IdOrang[] }`
    - `{ jenis: 'DZAWIL_ARHAM_MASALAH_PERANTARA'; ashl: bigint; aul?: bigint; saham: Record<IdOrang, bigint>; masalah: bigint; mahjub: IdOrang[] }`
    - `{ jenis: 'DZAWIL_ARHAM_TURUN'; perantara: IdOrang; rasio: 'ikutMasalah' | 'samaRata'; saham: Record<IdOrang, bigint>; masalah: bigint; mahjub: IdOrang[] }`
    - `{ jenis: 'DZAWIL_ARHAM_DUA_JALUR'; idOrang; perantara: IdOrang[] }`
    - `{ jenis: 'DZAWIL_ARHAM_GABUNG_PASANGAN'; saham: bigint; masalah: bigint; hubungan: HubunganInkisar; jamiah: bigint }`
  - `TIDAK_DIDUKUNG` + `kode?: 'FASE_DZAWIL_ARHAM'`.

- [ ] **Step 1: Tulis test yang gagal** — tambahkan di akhir `regression.test.ts`:

```ts
describe('Pipeline — penanda fase dzawil arham', () => {
  test('hanya dzawil arham → TIDAK_DIDUKUNG berkode FASE_DZAWIL_ARHAM', () => {
    const hasil = hitung(BAB16_FIXTURES.find(f => f.id === 'C16-24')!.input);
    expect(hasil).toMatchObject({ status: 'TIDAK_DIDUKUNG', kode: 'FASE_DZAWIL_ARHAM', refs: ['R14-4'] });
  });
});
```

- [ ] **Step 2: Jalankan — gagal**

Run: `pnpm --filter @waris/engine test regression`
Expected: FAIL — objek tidak punya `kode`.

- [ ] **Step 3: Implementasi tipe.** Di `types.ts`:

```ts
export type Tahap = 'tirkah' | 'derivasi' | 'mawani' | 'hajb' | 'furudh' | 'ashabah' | 'ashl' | 'klasifikasi' | 'tashih' | 'distribusi' | 'munasakhat' | 'dzawilArham';
```

```ts
export type KodeKhilafOverlay = 'K03-1' | 'K04-1' | 'K04-2' | 'K05-1' | 'K07-1' | 'K14-3';

/** [R14-10] Jihah ahl at-tanzil, ditentukan oleh ahli waris perantara (Lahim hlm. 192–193). */
export type Jihah = 'bunuwwah' | 'ubuwwah' | 'umumah';
```

Tambahkan varian sebelum `);` penutup `LangkahJejak`:

```ts
  // Bab 14 dzawil arham (tanzil). `perantara` = orang di graf (biasanya wafat) yang posisinya ahli waris.
  | { jenis: 'DZAWIL_ARHAM_TANZIL'; idOrang: IdOrang; perantara: IdOrang; kunciPerantara: KunciAhliWaris; jihah: Jihah; langkah: number }
  | { jenis: 'DZAWIL_ARHAM_TERHIJAB_JIHAH'; idOrang: IdOrang; perantara: IdOrang; oleh: IdOrang[] }
  // Mas'alah para perantara (hasil pipeline pada graf posisi): saham per perantara terhadap `masalah`.
  | { jenis: 'DZAWIL_ARHAM_MASALAH_PERANTARA'; ashl: bigint; aul?: bigint; saham: Record<IdOrang, bigint>; masalah: bigint; mahjub: IdOrang[] }
  // Bagian seorang perantara diberikan kepada penerimanya seolah ia wafat meninggalkan mereka.
  | { jenis: 'DZAWIL_ARHAM_TURUN'; perantara: IdOrang; rasio: 'ikutMasalah' | 'samaRata'; saham: Record<IdOrang, bigint>; masalah: bigint; mahjub: IdOrang[] }
  | { jenis: 'DZAWIL_ARHAM_DUA_JALUR'; idOrang: IdOrang; perantara: IdOrang[] }
  // [R14-12] sisa pasangan (saham) vs mas'alah dzawil arham (masalah), seperti munasakhat keadaan 3.
  | { jenis: 'DZAWIL_ARHAM_GABUNG_PASANGAN'; saham: bigint; masalah: bigint; hubungan: HubunganInkisar; jamiah: bigint }
```

Di `HasilEngine`:

```ts
  | { status: 'TIDAK_DIDUKUNG'; alasan: string; refs: string[]; kode?: 'FASE_DZAWIL_ARHAM' }
```

Di `stages/model.ts:29`:

```ts
export type TidakDidukung = { status: 'TIDAK_DIDUKUNG'; alasan: string; refs: string[]; kode?: 'FASE_DZAWIL_ARHAM' };
```

Di `pipeline.ts:105-107`:

```ts
    return adaDzawilArham
      ? { status: 'TIDAK_DIDUKUNG', alasan: 'Tidak ada ashabul furudh/ashabah; pewarisan dzawil arham.', refs: ['R14-4'], kode: 'FASE_DZAWIL_ARHAM' }
      : { status: 'TIDAK_DIDUKUNG', alasan: 'Tidak ada ahli waris; harta ke baitul mal.', refs: ['R02-1'] };
```

Di `fixtures/bab16.ts` ganti komentar case24 baris 731: `// [R14-1] Pipeline berhenti di fase dzawil arham; hasil tanzil diuji di dzawilArham.test.ts (DA-01).`

- [ ] **Step 4: Jalankan**

Run: `pnpm --filter @waris/engine test regression && pnpm typecheck`
Expected: PASS; typecheck mungkin gagal di `explain` bila ada `switch` exhaustive atas `LangkahJejak['jenis']` — bila ya, tambahkan cabang `default`/kasus kosong yang ada polanya di file itu (Task 10 mengisi narasinya).

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/types.ts packages/engine/src/pipeline.ts packages/engine/src/stages/model.ts packages/engine/src/__tests__/regression.test.ts packages/engine/src/__tests__/fixtures/bab16.ts
git commit -m "engine: tipe jejak dzawil arham dan kode FASE_DZAWIL_ARHAM di pipeline

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Angkat `gabungkan` dari munasakhat ke modul bersama

**Files:**
- Create: `packages/engine/src/gabung.ts`
- Modify: `packages/engine/src/munasakhat.ts` (hapus baris 134–183 yang dipindah; ganti pemakaian)
- Test: `packages/engine/src/__tests__/munasakhat.test.ts` (sudah ada; harus tetap lulus)

**Interfaces:**
- Produces:
  - `export type Saham = Record<string, bigint>;`
  - `export const idSisaKeluar = (mayit: IdOrang): IdSisaKeluar`
  - `export const AWALAN_SISA = 'sisaKeluar:'`
  - `export function sahamDari(mayit: IdOrang, hasil: HasilOk): Saham`
  - `export const totalSaham = (saham: Saham): bigint`
  - `export interface HasilGabung { saham: Saham; sahamMayit: bigint; masalah: bigint; hubungan: HubunganInkisar; fpb: bigint; wafqMasalah: bigint; wafqSaham: bigint; jamiah: bigint; rincian: Record<string, { sebelum: bigint; dariMayit: bigint; sesudah: bigint }> }`
  - `export function gabungkan(saham: Saham, jamiah: bigint, mayit: string, sahamMasalah: Saham, masalah: bigint): HasilGabung`
  - `export function periksaInvarian(saham: Saham, jamiah: bigint, konteks: string): void`

- [ ] **Step 1: Buat `gabung.ts`**

```ts
// Penggabungan mas'alah bertingkat (bab 12.3): saham seorang "mayit" di jami'ah dibandingkan dengan mas'alah-nya
// (habis / tawafuq / tabayun), lalu jami'ah diperbesar. Dipakai munasakhat dan dzawil arham (bagian perantara →
// penerimanya; sisa pasangan → mas'alah dzawil arham [R14-12]).

import { fpb } from '@waris/math';
import type { HasilEngine, HubunganInkisar, IdOrang, IdSisaKeluar } from './types.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
export type Saham = Record<string, bigint>;

export const AWALAN_SISA = 'sisaKeluar:';
export const idSisaKeluar = (mayit: IdOrang): IdSisaKeluar => `${AWALAN_SISA}${mayit}`;

/** Saham mas'alah seorang mayit, termasuk sisa yang keluar [R09-9] supaya jumlahnya = tashih. */
export function sahamDari(mayit: IdOrang, hasil: HasilOk): Saham {
  const saham: Saham = {};
  for (const barisTabel of hasil.tabel.baris) {
    for (const [idOrang, selOrang] of Object.entries(barisTabel.perOrang)) {
      if (selOrang.saham > 0n) saham[idOrang] = selOrang.saham;
    }
  }
  if (hasil.sisaKeluar) saham[idSisaKeluar(mayit)] = hasil.sisaKeluar.saham;
  return saham;
}

export const totalSaham = (saham: Saham): bigint => Object.values(saham).reduce((a, b) => a + b, 0n);

export interface HasilGabung {
  saham: Saham;
  sahamMayit: bigint;
  masalah: bigint;
  hubungan: HubunganInkisar;
  fpb: bigint;
  wafqMasalah: bigint;
  wafqSaham: bigint;
  jamiah: bigint;
  /** Per orang: saham sebelum × wafqMasalah + saham dari mayit × wafqSaham = sesudah. */
  rincian: Record<string, { sebelum: bigint; dariMayit: bigint; sesudah: bigint }>;
}

/**
 * [R12-2] Saham mayit di jami'ah sejauh ini vs mas'alah-nya: habis / tawafuq / tabayun, tanpa tadakhul.
 * Jami'ah baru = jami'ah × wafq mas'alah; saham mas'alah mayit × wafq saham.
 */
export function gabungkan(saham: Saham, jamiah: bigint, mayit: string, sahamMasalah: Saham, masalah: bigint): HasilGabung {
  const sahamMayit = saham[mayit]!;
  const faktor = fpb(sahamMayit, masalah);
  const wafqMasalah = masalah / faktor;
  const wafqSaham = sahamMayit / faktor;
  const hubungan: HubunganInkisar = sahamMayit % masalah === 0n ? 'habis' : faktor === 1n ? 'tabayun' : 'tawafuq';

  const rincian: HasilGabung['rincian'] = {};
  for (const [idOrang, nilai] of Object.entries(saham)) {
    if (idOrang !== mayit) rincian[idOrang] = { sebelum: nilai, dariMayit: 0n, sesudah: nilai * wafqMasalah };
  }
  for (const [idOrang, nilai] of Object.entries(sahamMasalah)) {
    const rincianOrang = rincian[idOrang] ?? { sebelum: 0n, dariMayit: 0n, sesudah: 0n };
    rincian[idOrang] = { ...rincianOrang, dariMayit: nilai, sesudah: rincianOrang.sesudah + nilai * wafqSaham };
  }
  const sahamBaru: Saham = Object.fromEntries(Object.entries(rincian).map(([idOrang, rincianOrang]) => [idOrang, rincianOrang.sesudah]));
  return { saham: sahamBaru, sahamMayit, masalah, hubungan, fpb: faktor, wafqMasalah, wafqSaham, jamiah: jamiah * wafqMasalah, rincian };
}

export function periksaInvarian(saham: Saham, jamiah: bigint, konteks: string): void {
  if (totalSaham(saham) !== jamiah) throw new Error(`invariant ${konteks}: Σ saham ${totalSaham(saham)} ≠ jami'ah ${jamiah}`);
  if (Object.values(saham).some(nilai => nilai <= 0n)) throw new Error(`invariant ${konteks}: ada saham ≤ 0`);
}
```

- [ ] **Step 2: Ubah `munasakhat.ts`.** Hapus `AWALAN_SISA`, `idSisaKeluar`, `sahamDari`, `total`, `gabungkan`, `periksaInvarian` (baris 134–183). Tambahkan import dan pembungkus jejak:

```ts
import { AWALAN_SISA, gabungkan as gabungkanSaham, idSisaKeluar, periksaInvarian, sahamDari, totalSaham as total, type Saham } from './gabung.js';
```

Hapus `type Saham = ...` lokal (baris 23) dan `import { fpb } from '@waris/math';` bila tidak dipakai lagi (`ikhtisharSiham` masih memakai `fpb` — biarkan import-nya). Tambahkan di bawah `tentukanKeadaan`:

```ts
function gabungkan(saham: Saham, jamiah: bigint, mayit: IdOrang, sahamMasalah: Saham, masalah: bigint):
  { saham: Saham; jejak: Extract<LangkahJejak, { jenis: 'MUNASAKHAT' }> } {
  const hasil = gabungkanSaham(saham, jamiah, mayit, sahamMasalah, masalah);
  return {
    saham: hasil.saham,
    jejak: { tahap: 'munasakhat', refs: ['R12-2'], jenis: 'MUNASAKHAT', mayit, saham: hasil.sahamMayit, masalah, hubungan: hasil.hubungan,
      fpb: hasil.fpb, wafqMasalah: hasil.wafqMasalah, wafqSaham: hasil.wafqSaham, jamiah: hasil.jamiah, rincian: hasil.rincian },
  };
}
```

Ganti `periksaInvarian(saham, jamiah);` menjadi `periksaInvarian(saham, jamiah, 'munasakhat');`.

- [ ] **Step 3: Jalankan**

Run: `pnpm --filter @waris/engine test munasakhat && pnpm --filter @waris/explain test munasakhat && pnpm typecheck`
Expected: PASS (pesan galat invarian lama `munasakhat: Σ saham` tidak diuji teksnya; kalau ada tes yang mencocokkan teks, sesuaikan harapannya ke `invariant munasakhat: Σ saham`).

- [ ] **Step 4: Commit**

```bash
git add packages/engine/src/gabung.ts packages/engine/src/munasakhat.ts
git commit -m "engine: gabungkan & sahamDari diangkat ke gabung.ts (dipakai munasakhat dan dzawil arham)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Tahap tanzil — rute, perantara, jihah

**Files:**
- Create: `packages/engine/src/stages/tanzil.ts`
- Create: `packages/engine/src/stages/__tests__/tanzil.test.ts`

**Interfaces:**
- Consumes: `turunkanPeran` (`stages/derivasi.ts`), tipe `Jihah`, jejak `DZAWIL_ARHAM_TANZIL` / `DZAWIL_ARHAM_TERHIJAB_JIHAH` (Task 3).
- Produces:
  - `export interface RuteTanzil { idOrang: IdOrang; lintasan: IdOrang[]; perantara: IdOrang; kunciPerantara: KunciAhliWaris; jihah: Jihah; langkah: number }`
  - `export function semuaLintasan(graf: GrafKeluarga, idOrang: IdOrang): IdOrang[][]` — tiap lintasan `[pewaris, ..., idOrang]`.
  - `export function cariRuteTanzil(graf: GrafKeluarga, daftarPeran: Record<IdOrang, PeranAhliWaris>, idOrang: IdOrang): RuteTanzil[]` — throw invarian bila kosong.
  - `export function saringJihah(daftarRute: RuteTanzil[]): { lolos: RuteTanzil[]; tersisih: RuteTanzil[]; jejak: LangkahJejak[] }`

- [ ] **Step 1: Tulis test yang gagal**

```ts
import { describe, expect, test } from 'vitest';
import { case24 } from '../../__tests__/fixtures/bab16.js';
import { grafDA03, grafDA04, grafDA07 } from '../../__tests__/fixtures/dzawilArham.js';
import { KONFIGURASI_BAWAAN } from '../../types.js';
import { turunkanPeran } from '../derivasi.js';
import { cariRuteTanzil, saringJihah, semuaLintasan } from '../tanzil.js';

const peranDari = (graf: typeof grafDA03) => turunkanPeran(graf, KONFIGURASI_BAWAAN).daftarPeran;

describe('semuaLintasan', () => {
  test('khalah: lintasan melompat dari ibu ke saudarinya, tanpa duplikat lewat kakek/nenek', () => {
    expect(semuaLintasan(case24.input.graf, 'KL1')).toEqual([['D', 'M1', 'KL1']]);
  });
  test('kakek fasid (ayahnya ibu): lintasan leluhur', () => {
    expect(semuaLintasan(grafDA04, 'MGF')).toEqual([['D', 'M1', 'MGF']]);
  });
  test('satu orang dua jalur → dua lintasan', () => {
    expect(semuaLintasan(grafDA07, 'Z').map(l => l.join('>')).sort())
      .toEqual(['D>SI>IZ>Z', 'D>SiK>AZ>Z']);
  });
});

describe('cariRuteTanzil [R14-7]', () => {
  test("khalah → ibu, 'ammah → ayah", () => {
    const graf = case24.input.graf;
    const peran = peranDari(graf);
    expect(cariRuteTanzil(graf, peran, 'KL1')).toMatchObject([{ perantara: 'M1', kunciPerantara: 'IBU', jihah: 'umumah', langkah: 1 }]);
    expect(cariRuteTanzil(graf, peran, 'AM1')).toMatchObject([{ perantara: 'F1', kunciPerantara: 'AYAH', jihah: 'ubuwwah', langkah: 1 }]);
  });
  test('ayahnya ibu → ibu', () => {
    expect(cariRuteTanzil(grafDA04, peranDari(grafDA04), 'MGF')).toMatchObject([{ perantara: 'M1', kunciPerantara: 'IBU' }]);
  });
  test('anak pr dari anak pr dari anak pr: 2 langkah ke anak pr; dari bint ibn ibn: 1 langkah ke cucu pr', () => {
    const peran = peranDari(grafDA03);
    expect(cariRuteTanzil(grafDA03, peran, 'X1')).toMatchObject([{ perantara: 'AP', kunciPerantara: 'ANAK_PR', langkah: 2, jihah: 'bunuwwah' }]);
    expect(cariRuteTanzil(grafDA03, peran, 'X2')).toMatchObject([{ perantara: 'SSD', kunciPerantara: 'CUCU_PR', langkah: 1 }]);
  });
});

describe('saringJihah [R14-10]', () => {
  test('jihah sama: yang lebih dulu sampai menghijab; jejak mencatat penghijabnya', () => {
    const peran = peranDari(grafDA03);
    const rute = [...cariRuteTanzil(grafDA03, peran, 'X1'), ...cariRuteTanzil(grafDA03, peran, 'X2')];
    const hasil = saringJihah(rute);
    expect(hasil.lolos.map(r => r.idOrang)).toEqual(['X2']);
    expect(hasil.jejak).toContainEqual({ tahap: 'dzawilArham', refs: ['R14-7', 'R14-10'], jenis: 'DZAWIL_ARHAM_TERHIJAB_JIHAH', idOrang: 'X1', perantara: 'AP', oleh: ['X2'] });
  });
});
```

- [ ] **Step 2: Jalankan — gagal**

Run: `pnpm --filter @waris/engine test tanzil`
Expected: FAIL — modul `../tanzil.js` tidak ada.

- [ ] **Step 3: Implementasi `tanzil.ts`**

```ts
// Tahap tanzil (bab 14.5, 14.7) — dzawil arham didudukkan pada posisi ahli waris perantaranya.
//   Masuk : graf + peran hasil derivasi + id seorang dzawil arham.
//   Putus : tiap lintasan orang itu ke pewaris dinaikkan derajat demi derajat sampai posisi ahli waris (perantara);
//           dalam jihah yang sama, yang lebih dulu sampai menghijab yang lain.
//   Keluar: rute yang lolos → mas'alah perantara (stages/perantara.ts).

import type { GrafKeluarga, IdOrang, Jihah, KunciAhliWaris, LangkahJejak, PeranAhliWaris } from '../types.js';

export interface RuteTanzil {
  idOrang: IdOrang;
  /** [pewaris, ..., idOrang] */
  lintasan: IdOrang[];
  perantara: IdOrang;
  kunciPerantara: KunciAhliWaris;
  jihah: Jihah;
  /** Banyaknya derajat dari orang ini ke perantara. */
  langkah: number;
}

// Pasangan dan wala' bukan kekerabatan nasab, jadi tidak pernah menjadi perantara.
const BUKAN_PERANTARA = new Set<PeranAhliWaris['kunci']>(['DZAWIL_ARHAM', 'BUKAN_AHLI_WARIS', 'SUAMI', 'ISTRI', 'MUTIQ', 'MUTIQAH']);
// [R14-10] bunuwwah = lewat anak mayit; umumah = lewat ibu (termasuk anak ibu dan ibunya ibu); sisanya ubuwwah.
const JIHAH_BUNUWWAH = new Set<KunciAhliWaris>(['ANAK_LK', 'ANAK_PR', 'CUCU_LK', 'CUCU_PR']);
const JIHAH_UMUMAH = new Set<KunciAhliWaris>(['IBU', 'NENEK_DARI_IBU', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU']);

export function cariRuteTanzil(graf: GrafKeluarga, daftarPeran: Record<IdOrang, PeranAhliWaris>, idOrang: IdOrang): RuteTanzil[] {
  const daftarRute = semuaLintasan(graf, idOrang).flatMap(lintasan => {
    const rute = naikKePerantara(daftarPeran, idOrang, lintasan);
    return rute ? [rute] : [];
  });
  // Tiap lintasan memuat orang tua/anak/saudara pewaris (semuanya ahli waris), jadi mustahil kosong.
  if (daftarRute.length === 0) throw new Error(`invariant: dzawil arham ${idOrang} tanpa perantara [R14-7]`);
  return daftarRute;
}

/** [R14-7] [R14-10] Dalam jihah yang sama, rute dengan langkah paling sedikit menghijab yang lain; lintas jihah tidak. */
export function saringJihah(daftarRute: RuteTanzil[]): { lolos: RuteTanzil[]; tersisih: RuteTanzil[]; jejak: LangkahJejak[] } {
  const terdekat = new Map<Jihah, number>();
  for (const rute of daftarRute) terdekat.set(rute.jihah, Math.min(terdekat.get(rute.jihah) ?? Infinity, rute.langkah));
  const lolos = daftarRute.filter(rute => rute.langkah === terdekat.get(rute.jihah));
  const tersisih = daftarRute.filter(rute => rute.langkah !== terdekat.get(rute.jihah));
  const jejak: LangkahJejak[] = [
    ...lolos.map((rute): LangkahJejak => ({ tahap: 'dzawilArham', refs: ['R14-7', 'R14-10'], jenis: 'DZAWIL_ARHAM_TANZIL',
      idOrang: rute.idOrang, perantara: rute.perantara, kunciPerantara: rute.kunciPerantara, jihah: rute.jihah, langkah: rute.langkah })),
    ...tersisih.map((rute): LangkahJejak => ({ tahap: 'dzawilArham', refs: ['R14-7', 'R14-10'], jenis: 'DZAWIL_ARHAM_TERHIJAB_JIHAH',
      idOrang: rute.idOrang, perantara: rute.perantara,
      oleh: [...new Set(lolos.filter(pemenang => pemenang.jihah === rute.jihah).map(pemenang => pemenang.idOrang))] })),
  ];
  return { lolos, tersisih, jejak };
}

/**
 * Semua lintasan [pewaris, ..., idOrang] tanpa simpul berulang: keturunan, leluhur, dan hawasyi. Lintasan hawasyi
 * melompat dari Y (pewaris/leluhurnya) ke X (saudaranya), bukan lewat orang tua bersama — sehingga khal/khalah
 * langsung sampai ke ibu dan 'ammah ke ayah (pengecualian 14.5 langkah 1).
 */
export function semuaLintasan(graf: GrafKeluarga, idOrang: IdOrang): IdOrang[][] {
  const { idPewaris } = graf;
  const naikPewaris = lintasanKeAtas(graf, idPewaris);
  const naikOrang = lintasanKeAtas(graf, idOrang);
  const leluhurPewaris = new Set(naikPewaris.map(lintasan => lintasan.at(-1)!));
  const hasil = new Map<string, IdOrang[]>();
  const simpan = (lintasan: IdOrang[]) => {
    if (new Set(lintasan).size === lintasan.length) hasil.set(lintasan.join('>'), lintasan);
  };

  for (const naik of naikOrang) if (naik.at(-1) === idPewaris) simpan([...naik].reverse());
  for (const naik of naikPewaris) if (naik.at(-1) === idOrang) simpan(naik);
  for (const naik of naikOrang) {
    if (naik.length < 2) continue;
    const idX = naik.at(-2)!;
    if (leluhurPewaris.has(idX)) continue;
    for (const jalurY of naikPewaris) {
      if (jalurY.length >= 2 && jalurY.at(-1) === naik.at(-1)) simpan([...jalurY.slice(0, -1), ...naik.slice(0, -1).reverse()]);
    }
  }
  return [...hasil.values()];
}

// ─── Bantuan ──────────────────────────────────────────────────────────────────

/** [R14-7] naik satu derajat demi satu derajat sampai bertemu ahli waris. */
function naikKePerantara(daftarPeran: Record<IdOrang, PeranAhliWaris>, idOrang: IdOrang, lintasan: IdOrang[]): RuteTanzil | undefined {
  for (let i = lintasan.length - 2; i >= 1; i--) {
    const kunci = daftarPeran[lintasan[i]!]?.kunci;
    if (kunci === undefined || BUKAN_PERANTARA.has(kunci)) continue;
    const kunciPerantara = kunci as KunciAhliWaris;
    return { idOrang, lintasan, perantara: lintasan[i]!, kunciPerantara, jihah: jihahDari(kunciPerantara), langkah: lintasan.length - 1 - i };
  }
  return undefined;
}

const jihahDari = (kunci: KunciAhliWaris): Jihah =>
  JIHAH_BUNUWWAH.has(kunci) ? 'bunuwwah' : JIHAH_UMUMAH.has(kunci) ? 'umumah' : 'ubuwwah';

/** Semua lintasan [idAwal, ..., leluhur] lewat idAyah/idIbu, termasuk [idAwal]. */
// ponytail: eksponensial pada pernikahan antarkerabat berlapis; cukup untuk graf keluarga, memoisasi bila perlu.
function lintasanKeAtas(graf: GrafKeluarga, idAwal: IdOrang): IdOrang[][] {
  const hasil: IdOrang[][] = [];
  const telusuri = (lintasan: IdOrang[]) => {
    hasil.push(lintasan);
    const orangIni = graf.orang[lintasan.at(-1)!];
    for (const idOrangTua of [orangIni?.idAyah, orangIni?.idIbu]) {
      if (idOrangTua !== undefined && graf.orang[idOrangTua] && !lintasan.includes(idOrangTua)) telusuri([...lintasan, idOrangTua]);
    }
  };
  telusuri([idAwal]);
  return hasil;
}
```

- [ ] **Step 4: Jalankan**

Run: `pnpm --filter @waris/engine test tanzil`
Expected: PASS. Bila `semuaLintasan(grafDA07, 'Z')` juga memuat lintasan `D>F1>SiK>AZ>Z`-semacamnya, periksa bahwa `leluhurPewaris` memuat `F1`/`M1` (lintasan hawasyi tidak boleh melewati leluhur pewaris sebagai X).

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/stages/tanzil.ts packages/engine/src/stages/__tests__/tanzil.test.ts
git commit -m "engine: tahap tanzil — lintasan, perantara, dan saring jihah (R14-7, R14-10)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Mas'alah perantara, graf posisi, invarian 'aul, dan mawani bersama

**Files:**
- Create: `packages/engine/src/stages/perantara.ts`
- Modify: `packages/engine/src/stages/mawani.ts` (ekspor `maniDari`, pakai di `terapkanMawani`)
- Modify: `packages/engine/src/stages/__tests__/tanzil.test.ts` (tambah describe)

**Interfaces:**
- Consumes: `hitung` (`pipeline.ts`), `sahamDari`, `totalSaham` (Task 4), `RuteTanzil` (Task 5).
- Produces:
  - `export function maniDari(orang: Orang): { mani: 'ikhtilafDin' | 'qatl'; rujukanAturan: 'R02-4' | 'R02-9' } | undefined` (mawani.ts)
  - `export function grafPosisi(graf: GrafKeluarga, idPewaris: IdOrang, hidup: IdOrang[]): GrafKeluarga`
  - `export function periksaAulDzawilArham(totalKolom: TabelMasalah['totalKolom']): void`
  - `export interface MasalahPerantara { saham: Saham; masalah: bigint; mahjub: Record<IdOrang, IdOrang[]>; jejak: LangkahJejak }`
  - `export function bagiAntarPerantara(input: InputEngine, lolos: RuteTanzil[]): MasalahPerantara | Exclude<HasilEngine, { status: 'OK' }>`
  - `export function samakanDalamSatuKelompok(hasil: HasilOk): { saham: Saham; masalah: bigint } | undefined`
  - `export const TANPA_TIRKAH`

- [ ] **Step 1: Tulis test yang gagal** (tambahkan ke `tanzil.test.ts`):

```ts
import { hitung } from '../../pipeline.js';
import { bagiAntarPerantara, grafPosisi, periksaAulDzawilArham, samakanDalamSatuKelompok } from '../perantara.js';
import { dengan, grafDA11, grafDA16 } from '../../__tests__/fixtures/dzawilArham.js';

describe('perantara', () => {
  test("graf posisi: hanya perantara hidup (muslim, bukan pembunuh), pewaris muslim, pernikahan dibuang", () => {
    const graf = grafPosisi(case24.input.graf, 'D', ['M1', 'F1']);
    expect(graf.orang.M1).toMatchObject({ statusHidup: 'hidup', agama: 'islam', membunuhPewaris: false });
    expect(graf.orang.KL1).toMatchObject({ statusHidup: 'wafat', penghubung: true });
    expect(graf.pernikahan).toEqual([]);
  });

  test("mas'alah perantara 'ammah/khalah: ayah 2, ibu 1 dari 3", () => {
    const graf = case24.input.graf;
    const peran = turunkanPeran(graf, KONFIGURASI_BAWAAN).daftarPeran;
    const lolos = [...cariRuteTanzil(graf, peran, 'KL1'), ...cariRuteTanzil(graf, peran, 'AM1')];
    const hasil = bagiAntarPerantara(case24.input, lolos);
    expect(hasil).toMatchObject({ saham: { M1: 1n, F1: 2n }, masalah: 3n });
  });

  test("'aul dzawil arham hanya 6 → 7 [R14-13]", () => {
    expect(() => periksaAulDzawilArham({ ashl: 6n, aul: 7n })).not.toThrow();
    expect(() => periksaAulDzawilArham({ ashl: 6n, aul: 8n })).toThrow('R14-13');
    expect(() => periksaAulDzawilArham({ ashl: 12n, aul: 13n })).toThrow('R14-13');
  });

  test('sama rata hanya bila semua penerima satu kelompok', () => {
    const graf = grafPosisi(grafDA11, 'AP', ['XL', 'XP']);
    const hasil = hitung(dengan(graf));
    if (hasil.status !== 'OK') throw new Error(hasil.status);
    expect(samakanDalamSatuKelompok(hasil)).toEqual({ saham: { XL: 1n, XP: 1n }, masalah: 2n });
  });
});
```

Tambahkan juga di test mawani yang ada (atau di sini):

```ts
import { maniDari } from '../mawani.js';
test('maniDari: beda agama dan pembunuh', () => {
  expect(maniDari({ id: 'A', jenisKelamin: 'L', statusHidup: 'hidup', agama: 'nonIslam' })).toEqual({ mani: 'ikhtilafDin', rujukanAturan: 'R02-4' });
  expect(maniDari({ id: 'A', jenisKelamin: 'L', statusHidup: 'hidup', agama: 'islam', membunuhPewaris: true })).toEqual({ mani: 'qatl', rujukanAturan: 'R02-9' });
  expect(maniDari({ id: 'A', jenisKelamin: 'L', statusHidup: 'hidup', agama: 'islam' })).toBeUndefined();
});
```

- [ ] **Step 2: Jalankan — gagal**

Run: `pnpm --filter @waris/engine test tanzil`
Expected: FAIL — modul `../perantara.js` tidak ada.

- [ ] **Step 3: `mawani.ts` — fungsi bersama.** Tambahkan di atas `terkenaTalakBain`:

```ts
/** Penghalang yang melekat pada orangnya (bab 02); dipakai juga orkestrator dzawil arham sebelum tanzil. */
export function maniDari(orang: Orang): { mani: 'ikhtilafDin' | 'qatl'; rujukanAturan: 'R02-4' | 'R02-9' } | undefined {
  if (orang.agama === 'nonIslam') return { mani: 'ikhtilafDin', rujukanAturan: 'R02-4' };
  // [R02-9] [SYF] semua bentuk pembunuhan menghalangi.
  if (orang.membunuhPewaris === true) return { mani: 'qatl', rujukanAturan: 'R02-9' };
  return undefined;
}
```

Ganti dua cabang `nonIslam` / `membunuhPewaris` di `terapkanMawani` dengan:

```ts
    } else if (maniDari(orangIni)) {
      const { mani, rujukanAturan } = maniDari(orangIni)!;
      statusOrang[idOrang] = { jenis: 'mamnu', peran, mani, rujukanAturan };
      jejak.push({ tahap: 'mawani', refs: [rujukanAturan], jenis: 'MANI', idOrang, mani });
    } else {
```

Tambahkan `Orang` ke import tipe.

- [ ] **Step 4: Implementasi `perantara.ts`**

```ts
// Tahap mas'alah perantara (bab 14.5 langkah 3) — harta dibagi di antara para perantara seolah mayit meninggalkan
// mereka. Pipeline yang sama dijalankan pada "graf posisi": hanya perantara yang hidup, sehingga hajb antar-perantara,
// furudh, 'aul, dan radd tidak ditulis ulang.
//   Keluar: saham per perantara → turun ke penerima (dzawilArham.ts).

import { hitung } from '../pipeline.js';
import { sahamDari, totalSaham, type Saham } from '../gabung.js';
import type { GrafKeluarga, HasilEngine, IdOrang, InputEngine, LangkahJejak, TabelMasalah } from '../types.js';
import type { RuteTanzil } from './tanzil.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
type BukanOk = Exclude<HasilEngine, { status: 'OK' }>;

export const TANPA_TIRKAH = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

export interface MasalahPerantara {
  saham: Saham;
  masalah: bigint;
  /** Perantara yang terhijab → penghijabnya. */
  mahjub: Record<IdOrang, IdOrang[]>;
  jejak: LangkahJejak;
}

export function bagiAntarPerantara(input: InputEngine, lolos: RuteTanzil[]): MasalahPerantara | BukanOk {
  const daftarPerantara = [...new Set(lolos.map(rute => rute.perantara))].sort();
  const hasil = hitungPosisi(input, input.graf.idPewaris, daftarPerantara);
  if (hasil.status !== 'OK') return hasil;
  periksaAulDzawilArham(hasil.tabel.totalKolom);

  const saham = sahamDari(input.graf.idPewaris, hasil);
  const masalah = totalSaham(saham);
  const mahjub = Object.fromEntries(daftarPerantara.flatMap(id => {
    const status = hasil.statusOrang[id];
    return status?.jenis === 'mahjub' ? [[id, status.oleh]] : [];
  }));
  const { ashl, aul } = hasil.tabel.totalKolom;
  return {
    saham, masalah, mahjub,
    jejak: { tahap: 'dzawilArham', refs: ['R14-9', 'R14-13'], jenis: 'DZAWIL_ARHAM_MASALAH_PERANTARA',
      ashl: ashl!, ...(aul !== undefined ? { aul } : {}), saham, masalah, mahjub: Object.keys(mahjub) },
  };
}

/** Pipeline pada graf posisi: `hidup` = ahli waris, pewaris = `idPewaris`; tanpa harta (hanya mas'alah), radd. */
export function hitungPosisi(input: InputEngine, idPewaris: IdOrang, hidup: IdOrang[], hitungFn: (masukan: InputEngine) => HasilEngine = hitung): HasilEngine {
  return hitungFn({ ...input, graf: grafPosisi(input.graf, idPewaris, hidup), tirkah: TANPA_TIRKAH,
    konfigurasi: { ...input.konfigurasi, kebijakanSisa: 'radd' } });
}

/**
 * Graf virtual: `hidup` menempati posisi ahli waris (posisi, bukan orangnya: agama & qatl netral — penghalang orang
 * asli sudah disaring sebelum tanzil), pewaris muslim, yang lain penghubung. Pernikahan dibuang: pasangan diurus
 * di mas'alah zaujiyyah tersendiri [R14-12].
 */
export function grafPosisi(graf: GrafKeluarga, idPewaris: IdOrang, hidup: IdOrang[]): GrafKeluarga {
  const setHidup = new Set(hidup);
  const orang = Object.fromEntries(Object.entries(graf.orang).map(([id, orangIni]) => [id,
    id === idPewaris ? { ...orangIni, statusHidup: 'wafat' as const, agama: 'islam' as const, penghubung: false }
      : setHidup.has(id) ? { ...orangIni, statusHidup: 'hidup' as const, agama: 'islam' as const, membunuhPewaris: false, penghubung: false }
      : { ...orangIni, statusHidup: 'wafat' as const, penghubung: true }]));
  return { idPewaris, orang, pernikahan: [] };
}

/** [R14-13] 'aul dalam bab dzawil arham hanya 6 → 7: 12, 24, dan 'aul di atas 7 selalu melibatkan pasangan. */
export function periksaAulDzawilArham(totalKolom: TabelMasalah['totalKolom']): void {
  if (totalKolom.aul === undefined) return;
  if (totalKolom.ashl !== 6n || totalKolom.aul !== 7n) {
    throw new Error(`invariant: 'aul dzawil arham ${totalKolom.ashl} → ${totalKolom.aul} [R14-13]`);
  }
}

/** Penerima yang mendapat bagian semuanya satu kelompok → satu saham per kepala; selain itu undefined. */
export function samakanDalamSatuKelompok(hasil: HasilOk): { saham: Saham; masalah: bigint } | undefined {
  const barisBerisi = hasil.tabel.baris.filter(baris => Object.values(baris.perOrang).some(sel => sel.saham > 0n));
  if (barisBerisi.length !== 1) return undefined;
  const penerima = Object.entries(barisBerisi[0]!.perOrang).filter(([, sel]) => sel.saham > 0n).map(([id]) => id);
  return { saham: Object.fromEntries(penerima.map(id => [id, 1n])), masalah: BigInt(penerima.length) };
}
```

- [ ] **Step 5: Jalankan**

Run: `pnpm --filter @waris/engine test`
Expected: PASS untuk tanzil & semua tes lama (mawani tidak berubah perilakunya); `dzawilArham.test.ts` masih FAIL (modul belum ada).

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src/stages/perantara.ts packages/engine/src/stages/mawani.ts packages/engine/src/stages/__tests__/tanzil.test.ts
git commit -m "engine: mas'alah perantara lewat graf posisi, invarian 'aul R14-13, maniDari bersama

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Orkestrator `hitungDzawilArham`

**Files:**
- Create: `packages/engine/src/dzawilArham.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/src/__tests__/dzawilArham.test.ts` (dari Task 2; tambah tes nominal)

**Interfaces:**
- Consumes: semua fungsi Task 4–6; `turunkanPeran`, `terapkanMawani`, `hitungTirkah`, `bagikanNominal`, `periksaKeberlakuan`, `ATURAN`.
- Produces: `export function hitungDzawilArham(input: InputEngine): HasilEngine` (juga diekspor dari `index.ts`).

- [ ] **Step 1: Tambah tes nominal** di `dzawilArham.test.ts`:

```ts
import { case24 } from './fixtures/bab16.js';

describe('Dzawil arham — nominal', () => {
  test('harta 90.000.000: khalah 30 jt, ammah 60 jt; Σ nominal + selisih = bersih', () => {
    const hasil = hitungDzawilArham({ ...case24.input, tirkah: { kotor: 90_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } });
    if (hasil.status !== 'OK') throw new Error(hasil.status);
    const nominal = Object.fromEntries(hasil.tabel.baris.flatMap(b => Object.entries(b.perOrang).map(([id, sel]) => [id, sel.nominal])));
    expect(nominal).toMatchObject({ KL1: 30_000_000n, AM1: 60_000_000n });
    expect(Object.values(nominal).reduce((a, b) => a + b, 0n) + hasil.pembulatan.sisaPembulatan).toBe(90_000_000n);
  });

  test('kasus tanpa dzawil arham → hasil hitung() apa adanya', () => {
    const graf = { idPewaris: 'D', orang: { D: { id: 'D', jenisKelamin: 'L' as const, statusHidup: 'wafat' as const, agama: 'islam' as const },
      A: { id: 'A', jenisKelamin: 'P' as const, statusHidup: 'hidup' as const, agama: 'islam' as const, idAyah: 'D' } }, pernikahan: [] };
    const masukan = { ...case24.input, graf };
    expect(hitungDzawilArham(masukan)).toEqual(hitung(masukan));
  });
});
```

(Tambahkan `import { hitung } from '../pipeline.js';`.)

- [ ] **Step 2: Jalankan — gagal**

Run: `pnpm --filter @waris/engine test dzawilArham`
Expected: FAIL — modul `../dzawilArham.js` tidak ada.

- [ ] **Step 3: Implementasi `dzawilArham.ts`**

```ts
// Orkestrator dzawil arham (bab 14) di atas pipeline, pola sama dengan munasakhat.ts.
//   Masuk : InputEngine — tanda tangan sama dengan hitung(), supaya orkestrator taqdir bab 13 (dan munasakhat)
//           cukup menerima fungsi hitung sebagai argumen.
//   Putus : ambil alih hanya bila pipeline berhenti di fase dzawil arham, atau hanya pasangan yang mewarisi dan
//           sisanya untuk dzawil arham. Lalu: saring mawani' → tanzil & jihah → mas'alah perantara → turun ke penerima
//           (rekursif: perantara sebagai pewaris) → gabung dengan mas'alah zaujiyyah bila ada pasangan.
//   Keluar: HasilEngine OK dengan saham per orang asli; jejak DZAWIL_ARHAM_* + refs R14-x.

import { gabungkan, idSisaKeluar, periksaInvarian, sahamDari, totalSaham, type Saham } from './gabung.js';
import { hitung } from './pipeline.js';
import { periksaKeberlakuan } from './rulesets/gerbang.js';
import { ATURAN } from './rulesets/madzhab.js';
import { turunkanPeran } from './stages/derivasi.js';
import { maniDari, terapkanMawani } from './stages/mawani.js';
import { bagikanNominal } from './stages/pembagian.js';
import { bagiAntarPerantara, hitungPosisi, samakanDalamSatuKelompok } from './stages/perantara.js';
import { cariRuteTanzil, saringJihah, type RuteTanzil } from './stages/tanzil.js';
import { hitungTirkah } from './stages/tirkah.js';
import type {
  HasilEngine, IdOrang, InputEngine, KunciAhliWaris, LangkahJejak, PeranAhliWaris, Pertanyaan, StatusOrang, TabelMasalah, Uang,
} from './types.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
type BukanOk = Exclude<HasilEngine, { status: 'OK' }>;

interface HasilArham {
  saham: Saham;
  masalah: bigint;
  statusArham: Record<IdOrang, StatusOrang>;
  jejak: LangkahJejak[];
}

// [R14-8] cabang perantara yang aslinya sama rata (anak ibu) dibagi sama rata.
const PERANTARA_SAMA_RATA_SYF = new Set<KunciAhliWaris>(['SAUDARA_SEIBU', 'SAUDARI_SEIBU']);

export function hitungDzawilArham(input: InputEngine): HasilEngine {
  const hasilPipeline = hitung(input);
  const denganPasangan = hasilPipeline.status === 'OK' && hasilPipeline.sisaKeluar?.tujuan === 'dzawilArham' ? hasilPipeline : undefined;
  const tanpaAhliWaris = hasilPipeline.status === 'TIDAK_DIDUKUNG' && hasilPipeline.kode === 'FASE_DZAWIL_ARHAM';
  if (!denganPasangan && !tanpaAhliWaris) return hasilPipeline;

  const ditolak = gerbangMadzhab(input);
  if (ditolak) return ditolak;

  const arham = bagiDzawilArham(input);
  if ('status' in arham) return arham;

  const hasil = denganPasangan ? gabungDenganPasangan(input, denganPasangan, arham) : tanpaPasangan(input, arham);
  return periksaKeberlakuan(input.ruleset, hasil) ?? hasil;
}

// ─── Gerbang madzhab (K14-1, K14-2) ───────────────────────────────────────────

function gerbangMadzhab(input: InputEngine): BukanOk | undefined {
  // [R14-5] [SYF] / [K14-1] [MLK]: selama baitul mal tegak, dzawil arham tidak mewarisi.
  if (input.konfigurasi.kebijakanSisa === 'baitulMal') {
    return { status: 'TIDAK_DIDUKUNG', alasan: 'Dzawil arham tidak mewarisi selama baitul mal tegak; harta ke baitul mal.',
      refs: [input.ruleset === 'syafii' ? 'R14-5' : 'K14-1'] };
  }
  // [K14-2] [HNF] metode qarabah belum diimplementasikan; [MLK] metodenya belum ada di matriks.
  if (input.ruleset === 'hanafi' || input.ruleset === 'maliki') {
    return { status: 'TIDAK_DIDUKUNG', alasan: 'Metode pembagian dzawil arham untuk madzhab ini belum didukung.', refs: ['K14-2'] };
  }
  return undefined;
}

// ─── Inti tanzil ──────────────────────────────────────────────────────────────

function bagiDzawilArham(input: InputEngine): HasilArham | BukanOk {
  const { graf } = input;
  const { daftarPeran } = turunkanPeran(graf, input.konfigurasi, ATURAN[input.ruleset]);
  const calon = Object.values(daftarPeran)
    .filter(peran => peran.kunci === 'DZAWIL_ARHAM' && graf.orang[peran.idOrang]!.statusHidup === 'hidup' && !graf.orang[peran.idOrang]!.penghubung);

  const saring = saringMawani(input, calon);
  if ('status' in saring) return saring;

  const semuaRute = saring.boleh.flatMap(peran => cariRuteTanzil(graf, daftarPeran, peran.idOrang));
  const { lolos, jejak: jejakTanzil } = saringJihah(semuaRute);

  const perantara = bagiAntarPerantara(input, lolos);
  if ('status' in perantara) return perantara;

  let saham = perantara.saham;
  let masalah = perantara.masalah;
  const jejakTurun: LangkahJejak[] = [];
  for (const idPerantara of Object.keys(perantara.saham).sort()) {
    const turun = turunkanKePenerima(input, idPerantara, lolos.filter(rute => rute.perantara === idPerantara));
    if ('status' in turun) return turun;
    const gabung = gabungkan(saham, masalah, idPerantara, turun.saham, turun.masalah);
    saham = gabung.saham;
    masalah = gabung.jamiah;
    jejakTurun.push(...turun.jejak);
  }
  periksaInvarian(saham, masalah, 'dzawil arham');

  return {
    saham, masalah,
    statusArham: statusDzawilArham(daftarPeran, saring.statusMani, semuaRute, lolos, saham, perantara.mahjub),
    jejak: [...saring.jejak, ...jejakTanzil, perantara.jejak, ...jejakTurun, ...jejakDuaJalur(lolos)],
  };
}

/** Mawani' (bab 02) berlaku bagi dzawil arham sendiri, sebelum tanzil, supaya yang terhalang tidak menempati kursi perantara. */
function saringMawani(input: InputEngine, calon: PeranAhliWaris[]):
  { boleh: PeranAhliWaris[]; statusMani: Record<IdOrang, StatusOrang>; jejak: LangkahJejak[] } | BukanOk {
  const pertanyaan: Pertanyaan[] = calon
    .filter(peran => input.graf.orang[peran.idOrang]!.agama === 'tidakDiketahui')
    .map(peran => ({ idOrang: peran.idOrang, isian: 'agama', alasan: 'Agama belum diisi; beda agama menghalangi waris (bab 2.4).' }));
  if (pertanyaan.length > 0) return { status: 'PERLU_INPUT', pertanyaan };

  const boleh: PeranAhliWaris[] = [];
  const statusMani: Record<IdOrang, StatusOrang> = {};
  const jejak: LangkahJejak[] = [];
  for (const peran of calon) {
    const mani = maniDari(input.graf.orang[peran.idOrang]!);
    if (!mani) { boleh.push(peran); continue; }
    statusMani[peran.idOrang] = { jenis: 'mamnu', peran, mani: mani.mani, rujukanAturan: mani.rujukanAturan };
    jejak.push({ tahap: 'mawani', refs: [mani.rujukanAturan], jenis: 'MANI', idOrang: peran.idOrang, mani: mani.mani });
  }
  return { boleh, statusMani, jejak };
}

/**
 * [R14-5 langkah 4] Bagian perantara diberikan kepada penerimanya seolah perantara wafat meninggalkan mereka:
 * hitungDzawilArham rekursif dengan perantara sebagai pewaris (cabang yang dzawil arham bagi perantara ikut tertangani).
 */
function turunkanKePenerima(input: InputEngine, idPerantara: IdOrang, rute: RuteTanzil[]):
  { saham: Saham; masalah: bigint; jejak: LangkahJejak[] } | BukanOk {
  const penerima = [...new Set(rute.map(ruteIni => ruteIni.idOrang))].sort();
  const kunciPerantara = rute[0]!.kunciPerantara;
  const hasil = hitungPosisi(input, idPerantara, penerima, hitungDzawilArham);
  if (hasil.status !== 'OK') return hasil;

  let saham = sahamDari(idPerantara, hasil);
  let masalah = totalSaham(saham);
  const mahjub = penerima.filter(id => !saham[id]);
  const samaRata = input.ruleset === 'hanbali' ? !khalDanKhalah(kunciPerantara, hasil) : PERANTARA_SAMA_RATA_SYF.has(kunciPerantara);
  const jejak: LangkahJejak[] = [];
  if (samaRata) {
    const rata = samakanDalamSatuKelompok(hasil);
    // [K14-3] rincian sama rata lintas kelompok belum ada di KB.
    if (!rata) return { status: 'TIDAK_DIDUKUNG', alasan: 'Pembagian sama rata dzawil arham lintas kelompok belum didukung.', refs: ['K14-3'] };
    saham = rata.saham;
    masalah = rata.masalah;
    if (input.ruleset === 'hanbali') {
      jejak.push({ tahap: 'dzawilArham', refs: ['K14-3'], jenis: 'KHILAF_MADZHAB', kode: 'K14-3', ruleset: 'hanbali', idOrang: Object.keys(saham) });
    }
  }
  jejak.unshift({ tahap: 'dzawilArham', refs: [input.ruleset === 'hanbali' ? 'K14-3' : 'R14-8'], jenis: 'DZAWIL_ARHAM_TURUN',
    perantara: idPerantara, rasio: samaRata ? 'samaRata' : 'ikutMasalah', saham, masalah, mahjub });
  return { saham, masalah, jejak };
}

/** [K14-3] [HNB] khal 2/3, khalah 1/3 (Mughni 6/324): penerima di bawah ibu yang semuanya saudara/saudarinya. */
function khalDanKhalah(kunciPerantara: KunciAhliWaris, hasil: HasilOk): boolean {
  if (kunciPerantara !== 'IBU') return false;
  return Object.values(hasil.statusOrang).every(status => status.jenis !== 'ahliWaris'
    || ['SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU'].includes(status.peran.kunci));
}

/** [R14-11] satu orang lewat dua jalur yang lolos: bagiannya dari tiap jalur dijumlahkan (gabungkan sudah menjumlah). */
function jejakDuaJalur(lolos: RuteTanzil[]): LangkahJejak[] {
  const perOrang = new Map<IdOrang, Set<IdOrang>>();
  for (const rute of lolos) perOrang.set(rute.idOrang, (perOrang.get(rute.idOrang) ?? new Set()).add(rute.perantara));
  return [...perOrang].filter(([, perantara]) => perantara.size > 1)
    .map(([idOrang, perantara]) => ({ tahap: 'dzawilArham', refs: ['R14-11'], jenis: 'DZAWIL_ARHAM_DUA_JALUR', idOrang, perantara: [...perantara].sort() }));
}

function statusDzawilArham(
  daftarPeran: Record<IdOrang, PeranAhliWaris>, statusMani: Record<IdOrang, StatusOrang>,
  semuaRute: RuteTanzil[], lolos: RuteTanzil[], saham: Saham, mahjubPerantara: Record<IdOrang, IdOrang[]>,
): Record<IdOrang, StatusOrang> {
  const status: Record<IdOrang, StatusOrang> = { ...statusMani };
  for (const idOrang of new Set(semuaRute.map(rute => rute.idOrang))) {
    const peran = daftarPeran[idOrang]!;
    if (saham[idOrang]) { status[idOrang] = { jenis: 'ahliWaris', peran }; continue; }
    const ruteLolos = lolos.filter(rute => rute.idOrang === idOrang);
    status[idOrang] = ruteLolos.length === 0
      // [R14-7] kalah cepat dalam jihah yang sama.
      ? { jenis: 'mahjub', peran, oleh: [...new Set(lolos.filter(rute => semuaRute.some(r => r.idOrang === idOrang && r.jihah === rute.jihah)).map(rute => rute.idOrang))], rujukanAturan: 'R14-7' }
      // [R14-10] perantaranya terhijab (atau ia terhijab di bawah perantaranya).
      : { jenis: 'mahjub', peran, oleh: ruteLolos.flatMap(rute => mahjubPerantara[rute.perantara] ?? []), rujukanAturan: 'R14-10' };
  }
  return status;
}

// ─── Menyusun hasil ───────────────────────────────────────────────────────────

function tanpaPasangan(input: InputEngine, arham: HasilArham): HasilOk {
  const tirkah = hitungTirkah(input.tirkah);
  const { daftarPeran } = turunkanPeran(input.graf, input.konfigurasi, ATURAN[input.ruleset]);
  const statusOrang = { ...terapkanMawani(input.graf, daftarPeran, input.ruleset).statusOrang, ...arham.statusArham };
  const nominal = bagikanNominal(arham.saham, arham.masalah, tirkah.bersih, input.pembulatan.satuan);
  return {
    status: 'OK', statusOrang,
    tabel: susunTabel(arham.saham, arham.masalah, nominal.nominal, statusOrang, []),
    jejak: [tirkah.jejak, ...arham.jejak, ...nominal.jejak],
    pembulatan: { satuan: input.pembulatan.satuan, sisaPembulatan: nominal.sisaPembulatan },
    ruleset: input.ruleset, konfigurasi: input.konfigurasi, versiKb: input.versiKb,
  };
}

/** [R14-12] mas'alah zaujiyyah = mas'alah pertama; sisa pasangan = saham "mayit kedua" (munasakhat keadaan 3). */
function gabungDenganPasangan(input: InputEngine, pasangan: HasilOk, arham: HasilArham): HasilOk {
  const idSisa = idSisaKeluar(input.graf.idPewaris);
  const sahamZaujiyyah = sahamDari(input.graf.idPewaris, pasangan);
  const gabung = gabungkan(sahamZaujiyyah, totalSaham(sahamZaujiyyah), idSisa, arham.saham, arham.masalah);
  periksaInvarian(gabung.saham, gabung.jamiah, 'dzawil arham + pasangan');

  const bersih = pasangan.jejak.find(langkah => langkah.jenis === 'TIRKAH')!.bersih;
  const nominal = bagikanNominal(gabung.saham, gabung.jamiah, bersih, input.pembulatan.satuan);
  const statusOrang = { ...pasangan.statusOrang, ...arham.statusArham };
  const barisPasangan = pasangan.tabel.baris.filter(baris => Object.values(baris.perOrang).some(sel => sel.saham > 0n));
  return {
    status: 'OK', statusOrang,
    tabel: susunTabel(gabung.saham, gabung.jamiah, nominal.nominal, statusOrang, barisPasangan),
    jejak: [
      ...pasangan.jejak.filter(langkah => langkah.jenis !== 'DISTRIBUSI'),
      ...arham.jejak,
      { tahap: 'dzawilArham', refs: ['R14-12', 'R12-2'], jenis: 'DZAWIL_ARHAM_GABUNG_PASANGAN',
        saham: gabung.sahamMayit, masalah: gabung.masalah, hubungan: gabung.hubungan, jamiah: gabung.jamiah },
      ...nominal.jejak,
    ],
    pembulatan: { satuan: input.pembulatan.satuan, sisaPembulatan: nominal.sisaPembulatan },
    ruleset: input.ruleset, konfigurasi: input.konfigurasi, versiKb: input.versiKb,
  };
}

/** Satu baris per penerima; pasangan tetap satu baris kelompoknya dengan fardh-nya. */
function susunTabel(saham: Saham, jamiah: bigint, nominal: Record<IdOrang, Uang>, statusOrang: Record<IdOrang, StatusOrang>,
  barisPasangan: TabelMasalah['baris']): TabelMasalah {
  const anggotaPasangan = new Set(barisPasangan.flatMap(baris => baris.anggota));
  const sel = (id: IdOrang) => ({ saham: saham[id] ?? 0n, nominal: nominal[id] ?? 0n });
  const baris: TabelMasalah['baris'] = [
    ...barisPasangan.map(barisAsal => ({
      kelompok: barisAsal.kelompok, anggota: barisAsal.anggota, ...(barisAsal.fardh ? { fardh: barisAsal.fardh } : {}),
      sel: { tashih: barisAsal.anggota.reduce((jumlah, id) => jumlah + (saham[id] ?? 0n), 0n) },
      perOrang: Object.fromEntries(barisAsal.anggota.map(id => [id, sel(id)])),
    })),
    ...Object.keys(saham).filter(id => !anggotaPasangan.has(id)).sort()
      .map(id => ({ kelompok: id, anggota: [id], sel: { tashih: saham[id]! }, perOrang: { [id]: sel(id) } })),
  ];
  const dikecualikan = Object.entries(statusOrang)
    .filter(([id, status]) => (status.jenis === 'mahjub' || status.jenis === 'mamnu') && !saham[id]).map(([id]) => id).sort();
  return { kolom: barisPasangan.length ? ['fardh', 'tashih', 'perOrang', 'nominal'] : ['tashih', 'perOrang', 'nominal'],
    totalKolom: { tashih: jamiah }, baris, dikecualikan };
}
```

Di `index.ts` tambahkan: `export { hitungDzawilArham } from './dzawilArham.js';`

- [ ] **Step 4: Jalankan**

Run: `pnpm --filter @waris/engine test && pnpm typecheck`
Expected: PASS seluruh `dzawilArham.test.ts` (setelah Task 1 disetujui; tanpa itu kasus [HNB] gagal di gerbang dengan refs R14-x — itu menandakan Task 1 belum selesai, bukan bug). Bila DA-06 `dikecualikan` tidak memuat `NS`, periksa `statusDzawilArham` cabang `R14-10`.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/dzawilArham.ts packages/engine/src/index.ts packages/engine/src/__tests__/dzawilArham.test.ts
git commit -m "engine: orkestrator hitungDzawilArham (tanzil, pasangan, overlay K14-1..3)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Invarian lintas fixture

**Files:**
- Modify: `packages/engine/src/__tests__/dzawilArham.test.ts`

**Interfaces:**
- Consumes: `DZAWIL_ARHAM_FIXTURES`, `hitungDzawilArham`.

- [ ] **Step 1: Tulis tes invarian**

```ts
describe('Dzawil arham — invarian di semua fixture OK', () => {
  for (const fixture of DZAWIL_ARHAM_FIXTURES.filter(f => f.harapan.status === 'OK')) {
    test(fixture.id, () => {
      const hasil = hitungDzawilArham(fixture.input);
      if (hasil.status !== 'OK') throw new Error(hasil.status);
      const saham = sahamPerOrang(hasil);
      expect(Object.values(saham).every(s => s >= 0n), 'saham bulat ≥ 0').toBe(true);
      expect(Object.values(saham).reduce((a, b) => a + b, 0n), 'Σ saham = tashih').toBe(hasil.tabel.totalKolom.tashih);
      for (const langkah of hasil.jejak) {
        if (langkah.jenis === 'DZAWIL_ARHAM_MASALAH_PERANTARA' && langkah.aul !== undefined) {
          expect([langkah.ashl, langkah.aul], "'aul hanya 6 → 7 [R14-13]").toEqual([6n, 7n]);
        }
      }
      // Tiap dzawil arham hidup yang tidak mendapat saham harus tercatat alasannya.
      for (const [id, status] of Object.entries(hasil.statusOrang)) {
        if (status.jenis === 'ahliWaris' && status.peran.kunci === 'DZAWIL_ARHAM') expect(saham[id], id).toBeGreaterThan(0n);
      }
    });
  }
});
```

- [ ] **Step 2: Jalankan**

Run: `pnpm --filter @waris/engine test dzawilArham`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/__tests__/dzawilArham.test.ts
git commit -m "engine: tes invarian dzawil arham lintas fixture

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Narasi dzawil arham (id + ar lewat diksi)

**Files:**
- Create: `packages/explain/src/dzawilArham.ts`
- Modify: `packages/explain/src/narasi.ts` (cabang bab), `packages/explain/src/cerita.ts` (ekspor `babHasil`), `packages/explain/src/arab.ts` (ekspor `babHasil` sebagai `babHasilArab` bila namanya sama)
- Modify: `packages/explain/src/__tests__/kasus.ts` (sertakan fixture dzawil arham)
- Modify: `apps/web/src/snapshot.json` (lewat `pnpm diksi:tambah`)
- Test: `packages/explain/src/__tests__/cakupan.test.ts`, `emas.test.ts` (sudah ada)

**Interfaces:**
- Consumes: jejak `DZAWIL_ARHAM_*`, `SISA_KELUAR`, `ceritaSisaKeluar` (cerita.ts), `buatBaris`, `susun`, `teksKamus`, `gabungDan`, `sebutSemua`.
- Produces: `export function babDzawilArham(konteks: Konteks): Bab`; `export function adaDzawilArham(hasil: HasilOk): boolean`.

- [ ] **Step 1: Sertakan kasus di `kasus.ts`** (sebelum loop munasakhat):

```ts
import { hitungDzawilArham } from '@waris/engine';
import { DZAWIL_ARHAM_FIXTURES } from '../../../engine/src/__tests__/fixtures/dzawilArham.js';
// ...
  for (const fixture of DZAWIL_ARHAM_FIXTURES) {
    const hasilHitung = hitungDzawilArham(fixture.input);
    if (hasilHitung.status !== 'OK') continue;
    for (const mode of MODE) {
      hasil[`dzawilArham:${fixture.id}/${mode}`] = jelaskan(hasilHitung, fixture.input.graf,
        mode === 'arab' ? { bahasa: 'ar', kamus: kamusSnapshot } : { gaya: mode, kamus: kamusSnapshot });
    }
  }
```

- [ ] **Step 2: Jalankan — gagal**

Run: `pnpm --filter @waris/explain test`
Expected: FAIL — `emas.test.ts` snapshot baru untuk kunci `dzawilArham:*` berisi bab yang salah/kosong, atau error pada bab bagian (tidak ada FARDH). Catat galatnya.

- [ ] **Step 3: Tambah diksi.** Buat `diksi-dzawil-arham.json` di root repo:

```json
[
  { "kunci": "narasi.dzawil_arham.judul", "id": "Dzawil arham", "ar": "ذوو الأرحام" },
  { "kunci": "narasi.dzawil_arham.pembuka", "id": "Tidak ada ashabul furudh atau ashabah yang menerima sisa, dan baitul mal dianggap tidak tegak, maka harta diwarisi dzawil arham dengan cara tanzil: tiap orang didudukkan pada posisi ahli waris yang menjadi perantaranya.", "ar": "لم يوجد صاحب فرض يُرَدّ عليه ولا عاصب، وبيت المال غير منتظم، فيرث ذوو الأرحام على مذهب أهل التنزيل: يُنزَّل كلٌّ منهم منزلة من أدلى به." },
  { "kunci": "narasi.dzawil_arham.tanzil", "id": "{siapa} didudukkan sebagai {perantara} ({langkah} derajat).", "ar": "{siapa} يُنزَّل منزلة {perantara} ({langkah} درجة)." },
  { "kunci": "narasi.dzawil_arham.terhijab_jihah", "id": "{siapa} tidak mendapat bagian karena {oleh} lebih dulu sampai ke ahli waris dari arah yang sama.", "ar": "{siapa} محجوب؛ لأن {oleh} أسبق إلى الوارث من جهته." },
  { "kunci": "narasi.dzawil_arham.masalah", "id": "Harta dibagi di antara para perantara seolah mereka ahli warisnya: {rincian}, dari {masalah} bagian.", "ar": "تُقسم التركة بين المُدلى بهم كأنهم الورثة: {rincian}، من {masalah}." },
  { "kunci": "narasi.dzawil_arham.masalah_butir", "id": "{perantara} {saham}", "ar": "{perantara} {saham}" },
  { "kunci": "narasi.dzawil_arham.aul", "id": "Jumlah bagiannya melebihi {ashl}, sehingga dinaikkan ('aul) menjadi {aul}.", "ar": "وعالت المسألة من {ashl} إلى {aul}." },
  { "kunci": "narasi.dzawil_arham.perantara_terhijab", "id": "{perantara} terhalang, sehingga yang bernasab melaluinya tidak mendapat apa-apa.", "ar": "{perantara} محجوب، فلا شيء لمن أدلى به." },
  { "kunci": "narasi.dzawil_arham.turun", "id": "Bagian {perantara} diberikan kepada {penerima} seolah ia wafat meninggalkan mereka.", "ar": "ونصيب {perantara} لمن أدلى به كأنه مات عنهم: {penerima}." },
  { "kunci": "narasi.dzawil_arham.turun_sama_rata", "id": "Bagian {perantara} dibagi sama rata di antara {penerima}.", "ar": "ونصيب {perantara} بين {penerima} بالسوية." },
  { "kunci": "narasi.dzawil_arham.dua_jalur", "id": "{siapa} mewarisi lewat dua jalur ({perantara}), dan bagian dari keduanya dijumlahkan.", "ar": "{siapa} يرث بجهتين ({perantara})، فيُجمع له نصيبهما." },
  { "kunci": "narasi.dzawil_arham.gabung_pasangan", "id": "Sisa sebanyak {saham} bagian dibandingkan dengan {masalah} bagian dzawil arham, sehingga pembaginya menjadi {jamiah}.", "ar": "ويُقابَل الباقي ({saham}) بمسألة ذوي الأرحام ({masalah})، فتصح من {jamiah}." }
]
```

Run: `pnpm diksi:tambah diksi-dzawil-arham.json && rm diksi-dzawil-arham.json`
Expected: `12 kunci ditambahkan`.

- [ ] **Step 4: Implementasi `packages/explain/src/dzawilArham.ts`**

```ts
// Bab penjelasan dzawil arham (bab 14): tanzil → mas'alah perantara → turun ke penerima → (gabung pasangan).
// Semua kalimat = templat diksi `narasi.dzawil_arham.*` (id + ar dalam satu kunci; bahasa dipilih penyusun).

import type { IdOrang } from '@waris/engine';
import { ceritaSisaKeluar, type Bab } from './cerita.js';
import { sebutSemua, type HasilOk, type Konteks } from './context.js';
import { buatBaris, gabungDan, susun, teksKamus, type BarisPenjelasan, type Potongan, type Sisipan } from './segments.js';

const teks = (konteks: Konteks, kunci: string, sisipan: Record<string, Sisipan> = {}): Potongan[] =>
  susun(konteks.penyusun, `narasi.dzawil_arham.${kunci}`, sisipan);
const sebut = (konteks: Konteks, ids: IdOrang[]): Potongan[] => sebutSemua(konteks, ids);

export const adaDzawilArham = (hasil: HasilOk): boolean =>
  hasil.jejak.some(langkah => langkah.jenis === 'DZAWIL_ARHAM_MASALAH_PERANTARA');

export function babDzawilArham(konteks: Konteks): Bab {
  const daftarBaris: BarisPenjelasan[] = [];
  const [sisaKeluar] = konteks.daftarLangkah('SISA_KELUAR');
  if (sisaKeluar) daftarBaris.push(ceritaSisaKeluar(konteks, sisaKeluar));
  daftarBaris.push(buatBaris(teks(konteks, 'pembuka'), ['R14-5', 'R14-6']));

  for (const langkah of konteks.daftarLangkah('DZAWIL_ARHAM_TANZIL')) {
    daftarBaris.push(buatBaris(teks(konteks, 'tanzil', {
      siapa: sebut(konteks, [langkah.idOrang]), perantara: sebut(konteks, [langkah.perantara]), langkah: langkah.langkah,
    }), langkah.refs, [langkah.idOrang]));
  }
  for (const langkah of konteks.daftarLangkah('DZAWIL_ARHAM_TERHIJAB_JIHAH')) {
    daftarBaris.push(buatBaris(teks(konteks, 'terhijab_jihah', {
      siapa: sebut(konteks, [langkah.idOrang]), oleh: sebut(konteks, langkah.oleh),
    }), langkah.refs, [langkah.idOrang]));
  }

  const [masalah] = konteks.daftarLangkah('DZAWIL_ARHAM_MASALAH_PERANTARA');
  if (masalah) {
    const rincian = gabungDan(konteks.penyusun, Object.entries(masalah.saham)
      .map(([id, saham]) => teks(konteks, 'masalah_butir', { perantara: sebut(konteks, [id]), saham })));
    daftarBaris.push(buatBaris(teks(konteks, 'masalah', { rincian, masalah: masalah.masalah }), masalah.refs));
    if (masalah.aul !== undefined) daftarBaris.push(buatBaris(teks(konteks, 'aul', { ashl: masalah.ashl, aul: masalah.aul }), ['R14-13']));
    for (const id of masalah.mahjub) daftarBaris.push(buatBaris(teks(konteks, 'perantara_terhijab', { perantara: sebut(konteks, [id]) }), ['R14-10']));
  }

  for (const langkah of konteks.daftarLangkah('DZAWIL_ARHAM_TURUN')) {
    const penerima = Object.keys(langkah.saham);
    daftarBaris.push(buatBaris(teks(konteks, langkah.rasio === 'samaRata' ? 'turun_sama_rata' : 'turun', {
      perantara: sebut(konteks, [langkah.perantara]), penerima: sebut(konteks, penerima),
    }), langkah.refs, penerima));
  }
  for (const langkah of konteks.daftarLangkah('DZAWIL_ARHAM_DUA_JALUR')) {
    daftarBaris.push(buatBaris(teks(konteks, 'dua_jalur', {
      siapa: sebut(konteks, [langkah.idOrang]), perantara: sebut(konteks, langkah.perantara),
    }), langkah.refs, [langkah.idOrang]));
  }
  const [gabung] = konteks.daftarLangkah('DZAWIL_ARHAM_GABUNG_PASANGAN');
  if (gabung) {
    daftarBaris.push(buatBaris(teks(konteks, 'gabung_pasangan', { saham: gabung.saham, masalah: gabung.masalah, jamiah: gabung.jamiah }), gabung.refs));
  }
  return { judul: teksKamus(konteks.penyusun, 'narasi.dzawil_arham.judul'), daftarBaris, kolom: 'bagian' };
}
```

- [ ] **Step 5: Cabang di `narasi.ts`.** Ekspor `babHarta` dan `babHasil` dari `cerita.ts` (ubah `function` → `export function`), dan `babTirkah`/`babHasil` dari `arab.ts` (ekspor dengan nama `babTirkahArab`, `babHasilArab` lewat `export { babTirkah as babTirkahArab, babHasil as babHasilArab }` di akhir file; periksa tanda tangannya `(konteks, sebut)`). Di `jelaskan`:

```ts
import { adaDzawilArham, babDzawilArham } from './dzawilArham.js';
import { babHarta, babHasil } from './cerita.js';
import { babHasilArab, babTirkahArab, buatSebutArab } from './arab.js';
// ...
  const daftarBab = adaDzawilArham(hasil)
    ? babUntukDzawilArham(konteks, graf, arab)
    : arab ? babArab(konteks, graf) : opsi.gaya === 'ringkas' ? babRingkas(konteks) : babCerita(konteks);
// ...
/** Dzawil arham: harta → tanzil → hasil. Bab fardh/ashl/tashih pipeline tidak berlaku (pembaginya dari tanzil). */
function babUntukDzawilArham(konteks: Konteks, graf: GrafKeluarga, arab: boolean): BabPenjelasan[] {
  const sebut = arab ? buatSebutArab(konteks, graf) : undefined;
  return [
    arab ? babTirkahArab(konteks, sebut!) : babHarta(konteks),
    babDzawilArham(konteks),
    arab ? babHasilArab(konteks, sebut!) : babHasil(konteks),
  ].filter((bab): bab is BabPenjelasan => bab !== undefined);
}
```

Bila `buatSebutArab` belum diekspor dari `arab.ts`, ekspor. Impor tipe `Konteks` dari `./context.js`.

- [ ] **Step 6: Jalankan & perbarui snapshot emas untuk kunci baru saja**

Run: `pnpm --filter @waris/explain test -- -u emas && pnpm --filter @waris/explain test`
Expected: PASS; `git diff --stat packages/explain/src/__tests__/__snapshots__` hanya menambah entri `dzawilArham:*` (bila entri lama berubah, hentikan dan periksa — itu regresi). Baca salah satu snapshot `dzawilArham:DA-06/cerita` dan pastikan kalimatnya masuk akal (penerima, perantara, 'ammah didudukkan sebagai ayah). Tes `cakupan.test.ts` tidak boleh memunculkan kunci `narasi.dzawil_arham.*` yang tidak terpakai.

- [ ] **Step 7: Commit**

```bash
git add packages/explain/src apps/web/src/snapshot.json
git commit -m "explain: bab dzawil arham dari diksi narasi.dzawil_arham.* (id + ar)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Pintu masuk web

**Files:**
- Modify: `apps/web/src/jalankan.ts:35` (dan import)

**Interfaces:**
- Consumes: `hitungDzawilArham` dari `@waris/engine`.

- [ ] **Step 1: Ganti pemanggilan**

```ts
      ? { jenis: 'biasa', hasil: hitungDzawilArham(dasar) }
```

Sesuaikan import (`hitung` → `hitungDzawilArham` bila `hitung` tidak dipakai lagi di file itu) dan komentar baris 2: `// Bukan munasakhat → hitungDzawilArham() (pipeline + bab 14); ada yang wafat sebelum pembagian → hitungMunasakhat() (bab 12).`

- [ ] **Step 2: Jalankan semua**

Run: `pnpm test && pnpm typecheck`
Expected: PASS di semua paket.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/jalankan.ts
git commit -m "web: kalkulator memakai hitungDzawilArham

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Tindak lanjut (di luar plan ini)

- Munasakhat memanggil `hitungDzawilArham` untuk tiap mayit (cukup menerima fungsi hitung sebagai argumen).
- Qarabah [HNF] (14.11).
- Bab 13 (taqdir) membungkus `hitungDzawilArham`.
