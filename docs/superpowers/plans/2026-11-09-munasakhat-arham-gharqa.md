# Munasakhat × dzawil arham × gharqa — Rencana Implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Munasakhat menerima mayit yang ahli warisnya dzawil arham dan langkah berupa kelompok gharqa; gharqa menerima ahli waris yang wafat sesudah musibah.

**Architecture:** Dua orkestrator yang ada diperluas (pendekatan A di spec). Logika langkah gharqa (terpisah/tilad, permutasi, batas skenario) diekstrak ke `langkahGharqa.ts` dan dipakai `munasakhat.ts` dan `gharqa.ts`. Jami'ah tetap satu jalur (`gabung.ts`, R12-2).

**Tech Stack:** TypeScript, bigint, vitest, pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-11-09-munasakhat-arham-gharqa-design.md`

## Global Constraints

- Ikuti `CLAUDE.md` proyek: nama/komentar bahasa Indonesia, istilah fikih sesuai glosarium, tiap cabang fikih beranotasi `[Rxx-y]`.
- Fungsi murni: tanpa I/O, `Date`, `Math.random`; tanpa `number` di jalur hitung.
- Pelanggaran invarian = `throw` (pakai `periksaInvarian` yang ada).
- Data kurang → `PERLU_INPUT`; di luar cakupan → `TIDAK_DIDUKUNG` dengan alasan.
- Kalimat narasi baru hanya lewat templat diksi + `pnpm diksi:tambah <file.json>`.
- Rujukan baru: R12-5 (Lahim · shamela:31238/132), R12-6 (Lahim · shamela:31238/157; Tashil · shamela:11095/128, pembanding), status `sekunder`.
- Batas skenario urutan total: **24** (`MAKS_SKENARIO_URUTAN`).
- Commit langsung setelah tiap task, hanya file milik task itu, dengan baris `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Hasil M1–M9, G1, dan seluruh regression suite lama tidak boleh berubah.

## Review Focus

1. Anggota kelompok yang tidak mendapat bagian dari mayit sebelumnya → dilewati dengan `MUNASAKHAT_DILEWATI` [R12-1], bukan error (tes di Task 4).
2. Orang yang muncul dua kali (sebagai orang tunggal dan di kelompok, atau di dua kelompok) → `throw 'munasakhat: seseorang tercatat wafat dua kali'` (tes di Task 4).
3. Kelompok berisi satu orang → `PERLU_INPUT` (tes di Task 4).
4. Dzawil arham dengan `kebijakanSisa: 'baitulMal'` → tetap baris `sisaKeluar` bertujuan `baitulMalTeratur`, tidak diserap ke dzawil arham (tes di Task 2).
5. Pemanggil lama yang mengirim `urutanWafat: string[]` (web, taqdir, explain) tetap jalan tanpa perubahan (regression suite + typecheck di Task 7).

---

### Task 1: KB — rujukan R12-5/R12-6 dan kasus uji bab 16

**Files:**
- Modify: `docs/kb/12_munasakhat.md` (12.7 Aturan Engine, tabel "Dasar dan Rujukan")
- Modify: `docs/kb/16_kasus_uji.md` (bagian "Munasakhat (Bab 12)")

- [ ] **Step 1: Pasang dependensi di worktree**

Run: `pnpm install --frozen-lockfile && pnpm --filter @waris/engine test`
Expected: semua tes lulus (baseline).

- [ ] **Step 2: Tambah dua baris ke tabel "Dasar dan Rujukan" bab 12**

Isi kolom persis dari tabel "Temuan rujukan" di spec (kode, klaim, jenis `LHM` / `LHM + pembanding`, sumber dengan token `shamela:`, kutipan Arab). Tandai keduanya `sekunder`.

- [ ] **Step 3: Tambah ke 12.7 Aturan Engine**

Tiga butir: (1) satu langkah rantai boleh berupa kelompok gharqa; hukum antar anggota mengikuti 13d (R13-10/K13d-1/R13-19) [R12-5][R12-6]; (2) mas'alah tiap mayit dihitung termasuk fase dzawil arham (bab 14); (3) [SYF] kelompok "terlupakan" di dalam rantai → seluruh hasil ditahan dengan skenario tiap urutan, total ≤ 24.

- [ ] **Step 4: Tambah baris kasus M10–M12 dan MG1–MG7 ke bab 16**

Isi persis dari tabel "Kasus uji" di bawah (kolom: #, Keterangan, Ashl → Jami'ah, Saham akhir, Menguji).

| # | Keterangan | Jami'ah | Saham akhir |
|---|---|---|---|
| M10 | D (lk): istri W + saudara lk kandung AK → AK wafat, hanya meninggalkan bintu ukht BU | 4 (rasio) | W 1/4; BU 3/4; keadaan 1 |
| M11 | M10, AK beristri WA | 16 | W 4; WA 3; BU 9; keadaan 3 |
| M12 | D (lk): istri W + bintu ukht BU (dzawil arham) → BU wafat (suami HB, anak lk AB) | 16 | W 4; HB 3; AB 9; keadaan 3 |
| MG1 | A: anak lk B, C → B dan C wafat bersamaan ([SYF] serentak). B: istri WB, anak lk SB. C: istri WC, anak pr DC | 16 | WB 1; SB 10; WC 1; DC 4 |
| MG2 | MG1, [SYF] terlupakan | MAUQUF | skenario [B,C] = MG1; skenario [C,B]: 128 → WC 8; DC 32; WB 11; SB 77 |
| MG3 | MG1, [HNB] tidak diketahui (tilad–tharif di tengah rantai) | 128 | WB 11; SB 77; WC 8; DC 32 |
| MG4 | MG1 lalu DC wafat (ahli waris: ibu WC, ibnu 'amm SB) | 48 | WB 3; SB 38; WC 7 |
| MG5 | Gharqa B, C ([SYF] serentak), lalu DC wafat sesudahnya | harta B 8; harta C 24 | B: WB 1, SB 7. C: WC 7, SB 17 |
| MG6 | MG1 dengan urutan rantai biasa ['C','B'] (pembanding: bukan gharqa) | 128 | sama dengan skenario [C,B] MG2 |
| MG7 | Negatif: kelompok 1 orang → PERLU_INPUT; kelompok terlupakan 5 orang → PERLU_INPUT; gharqa + taqdir + wafatSesudahnya → TIDAK_DIDUKUNG | — | — |

- [ ] **Step 5: Commit**

```bash
git add docs/kb/12_munasakhat.md docs/kb/16_kasus_uji.md
git commit -m "docs(kb): R12-5/R12-6 munasakhat dengan gharqa & dzawil arham, kasus M10-M12 dan MG1-MG7"
```

---

### Task 2: Dzawil arham di setiap mayit munasakhat

**Files:**
- Modify: `packages/engine/src/munasakhat.ts` (loop utama dan `tentukanKeadaan`)
- Modify: `packages/engine/src/__tests__/fixtures/munasakhat.ts` (tambah `M10`, `M11`, `M12`)
- Test: `packages/engine/src/__tests__/munasakhat.test.ts` (describe baru `'Munasakhat — dzawil arham di mayit mana pun'`)

**Interfaces:**
- Produces: perilaku saja; tanda tangan `hitungMunasakhat` tidak berubah.

Fixture bertipe `InputMunasakhat` (seperti `SISA_KELUAR_MAYIT_KEDUA`, dibuat dengan helper `munasakhat(graf, urutanWafat)`), pakai `p` dan `placeholder` yang ada; F, M, Y = placeholder:
- M10: `D` (L, wafat, idAyah F, idIbu M), `W` (P), `AK` (L, idAyah F, idIbu M), `U` (P, statusHidup 'wafat', idAyah F, idIbu M), `BU` (P, idAyah Y, idIbu U); nikah D–W; `urutanWafat: ['AK']`.
- M11: M10 + `WA` (P), nikah AK–WA.
- M12: `D`, `W`, `U`, `BU` seperti M10 tanpa AK, + `HB` (L), `AB` (L, idAyah HB, idIbu BU); nikah D–W, HB–BU; `urutanWafat: ['BU']`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
test('M10: mayit kedua hanya meninggalkan dzawil arham', () => {
  const hasil = ok(M10);
  expect(sebagaiPecahan(hasil.saham, hasil.jamiah)).toEqual({ W: '1/4', BU: '3/4' });
  expect(hasil.sisaKeluar).toEqual([]);
  expect(hasil.keadaan).toBe(1);
});
test('M11: mayit kedua meninggalkan istri + dzawil arham, sisa tidak keluar', () => {
  const hasil = ok(M11);
  expect(sebagaiPecahan(hasil.saham, hasil.jamiah)).toEqual({ W: '1/4', WA: '3/16', BU: '9/16' });
  expect(hasil.sisaKeluar).toEqual([]);
  expect(hasil.keadaan).toBe(3);
});
test('M12: penerima dzawil arham di mayit pertama wafat sebelum pembagian', () => {
  const hasil = ok(M12);
  expect(sebagaiPecahan(hasil.saham, hasil.jamiah)).toEqual({ W: '1/4', HB: '3/16', AB: '9/16' });
  expect(hasil.keadaan).toBe(3);
});
test('kebijakan sisa baitul mal: sisa tetap keluar, tidak ke dzawil arham', () => {
  const hasil = ok({ ...M11, dasar: { ...M11.dasar, konfigurasi: { ...M11.dasar.konfigurasi, kebijakanSisa: 'baitulMal' } } });
  expect(hasil.sisaKeluar.map(sisa => sisa.tujuan)).toEqual(['baitulMalTeratur']);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/engine test munasakhat`
Expected: M10 gagal dengan `TIDAK_DIDUKUNG`; M11/M12 gagal karena `sisaKeluar` tidak kosong / AB tidak ada.

- [ ] **Step 3: Implementasi**

Di `munasakhat.ts`, ganti `hitung(...)` dengan `hitungDzawilArham(...)` di loop utama dan di `tentukanKeadaan`; hapus import `hitung` bila tak terpakai. Tambah ke komentar pembuka: mas'alah tiap mayit melewati fase dzawil arham (bab 14) [R12-5]. Bila AB ternyata mendapat bagian langsung dari D di M12 (bukan lewat BU), berhenti dan laporkan; jangan ubah ekspektasi.

- [ ] **Step 4: Jalankan seluruh tes engine**

Run: `pnpm --filter @waris/engine test`
Expected: PASS, termasuk M1–M9 dan tes `SISA_KELUAR_MAYIT_KEDUA` (grafnya tanpa dzawil arham, hasil tetap).

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/munasakhat.ts packages/engine/src/__tests__/munasakhat.test.ts packages/engine/src/__tests__/fixtures/munasakhat.ts
git commit -m "feat(engine): munasakhat menghitung dzawil arham di mayit mana pun [R12-5]"
```

---

### Task 3: Tipe kejadian + ekstrak `langkahGharqa.ts` (refactor, perilaku tetap)

**Files:**
- Create: `packages/engine/src/langkahGharqa.ts`
- Modify: `packages/engine/src/gharqa.ts` (pakai modul baru)
- Modify: `packages/engine/src/types.ts` (tipe baru), `packages/engine/src/index.ts` (ekspor tipe)
- Test: `packages/engine/src/__tests__/langkahGharqa.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export interface KejadianGharqa { anggota: IdOrang[]; keadaan: KeadaanGharqa }
  export type KejadianWafat = IdOrang | KejadianGharqa;
  ```
- Produces (`langkahGharqa.ts`):
  ```ts
  export const MAKS_SKENARIO_URUTAN = 24;
  export type MetodeGharqa = { metode: 'terpisah'; rujukan: 'R13-10' | 'K13d-1' } | { metode: 'tilad' } | { metode: 'skenario' };
  export function metodeGharqa(ruleset: Ruleset, keadaan: KeadaanGharqa): MetodeGharqa;
  export function permutasi(daftar: IdOrang[]): IdOrang[][];
  /** Kelompok bermetode 'skenario' diganti tiap permutasi anggotanya sebagai orang tunggal; kelompok lain tetap. */
  export function ekspansiSkenario(daftarKejadian: KejadianWafat[], ruleset: Ruleset): KejadianWafat[][];
  export function tiladSatuMayit(inputMayit: InputEngine, mayit: IdOrang, rekan: IdOrang[]):
    { saham: Saham; jejak: LangkahJejak[]; daftarHasil: HasilOk[]; urutanTharif: IdOrang[] } | Gagal;  // dipindah apa adanya
  export const adalahKelompok: (kejadian: KejadianWafat) => kejadian is KejadianGharqa;
  ```
  `metodeGharqa` memuat keputusan yang sekarang ada di awal `hitungGharqa`: serentak → terpisah R13-10; hanbali → tilad; syafii+terlupakan → skenario; selain itu terpisah (R13-10 untuk syafii, K13d-1 lainnya).

- [ ] **Step 1: Tulis tes yang gagal**

```ts
test('metodeGharqa mengikuti 13d.2', () => {
  expect(metodeGharqa('syafii', 'serentak')).toEqual({ metode: 'terpisah', rujukan: 'R13-10' });
  expect(metodeGharqa('hanbali', 'serentak')).toEqual({ metode: 'terpisah', rujukan: 'R13-10' });
  expect(metodeGharqa('hanbali', 'tidakDiketahui')).toEqual({ metode: 'tilad' });
  expect(metodeGharqa('syafii', 'terlupakan')).toEqual({ metode: 'skenario' });
  expect(metodeGharqa('hanafi', 'terlupakan')).toEqual({ metode: 'terpisah', rujukan: 'K13d-1' });
});
test('ekspansiSkenario hanya memecah kelompok terlupakan [SYF]', () => {
  const kelompok = { anggota: ['B', 'C'], keadaan: 'terlupakan' as const };
  expect(ekspansiSkenario(['X', kelompok], 'syafii')).toEqual([['X', 'B', 'C'], ['X', 'C', 'B']]);
  expect(ekspansiSkenario(['X', kelompok], 'hanbali')).toEqual([['X', kelompok]]);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/engine test langkahGharqa`
Expected: FAIL, modul tidak ada.

- [ ] **Step 3: Implementasi**

Buat `langkahGharqa.ts` (komentar pembuka: menerima apa, memutuskan apa, menyerahkan apa). Pindahkan `tiladSatuMayit`, `permutasi`, `hidupkan` dari `gharqa.ts`; ganti `MAKS_ANGGOTA_SKENARIO` dengan `MAKS_SKENARIO_URUTAN` (cek `n! > 24`, setara batas lama 4 anggota). `hitungGharqa` memakai `metodeGharqa`.

- [ ] **Step 4: Jalankan seluruh tes engine**

Run: `pnpm --filter @waris/engine test`
Expected: PASS, `gharqa.test.ts` tanpa perubahan ekspektasi.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/langkahGharqa.ts packages/engine/src/gharqa.ts packages/engine/src/types.ts packages/engine/src/index.ts packages/engine/src/__tests__/langkahGharqa.test.ts
git commit -m "refactor(engine): ekstrak langkahGharqa.ts dan tipe KejadianWafat"
```

---

### Task 4: Kelompok gharqa sebagai langkah munasakhat (terpisah & tilad)

**Files:**
- Modify: `packages/engine/src/munasakhat.ts`, `packages/engine/src/langkahGharqa.ts`, `packages/engine/src/types.ts`
- Create: `packages/engine/src/__tests__/fixtures/munasakhatGharqa.ts`
- Test: `packages/engine/src/__tests__/munasakhatGharqa.test.ts`

**Interfaces:**
- Consumes: `KejadianWafat`, `metodeGharqa`, `tiladSatuMayit`, `adalahKelompok` (Task 3).
- Produces:
  - `InputMunasakhat.urutanWafat: KejadianWafat[]`.
  - `HasilMunasakhat` varian OK mendapat `urutanWafat: KejadianWafat[]` (urutan kejadian yang dihitung, dipakai explain di Task 7).
  - `langkahGharqa.ts`:
    ```ts
    export interface HasilLangkahKelompok { saham: Saham; jamiah: bigint; jejak: LangkahJejak[]; daftarLangkah: Array<{ mayit: IdOrang; hasil: HasilOk }> }
    /** Satu kelompok gharqa di rantai: tiap anggota yang punya saham diteruskan ke ahli warisnya [R12-6]. */
    export function terapkanKelompok(saham: Saham, jamiah: bigint, kelompok: KejadianGharqa,
      inputAnggota: (mayit: IdOrang) => InputEngine): HasilLangkahKelompok | Gagal;
    ```
    `inputAnggota(mayit)` = input dengan graf "saat kelompok itu wafat" (semua anggota kelompok wafat, kejadian sesudahnya hidup), `idPewaris = mayit`, tirkah nol. Metode `terpisah`: per anggota `hitungDzawilArham`, jejak `MANI istibham` untuk rekan (refs `[rujukan]`), lalu `gabungkan` dengan jejak `MUNASAKHAT` refs `['R12-6']`. Metode `tilad`: `tiladSatuMayit(inputAnggota(mayit), mayit, rekan)` lalu gabung hasilnya. Metode `skenario` tidak boleh sampai sini (`throw`; Task 5 menyaringnya).
  - `grafPada` di `munasakhat.ts` menerima indeks kejadian, bukan indeks orang.

Graf fixture `grafAnakBersaudara` (`MA` placeholder):
`A` (L, wafat), `B`/`C` (L, idAyah A, idIbu MA), `WB` (P), `SB` (L, idAyah B, idIbu WB), `WC` (P), `DC` (P, idAyah C, idIbu WC); nikah B–WB, C–WC; `idPewaris: 'A'`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
const serentak = (anggota = ['B', 'C']) => ({ anggota, keadaan: 'serentak' as const });
test('MG1 [SYF] serentak: B dan C tidak saling mewarisi [R12-6]', () => {
  const hasil = ok({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak()] });
  expect(hasil.jamiah).toBe(16n);
  expect(hasil.saham).toEqual({ WB: 1n, SB: 10n, WC: 1n, DC: 4n });
  expect(hasil.jejak).toContainEqual(expect.objectContaining({ jenis: 'MANI', mani: 'istibham', idOrang: 'C' }));
});
test('urutan anggota tidak mengubah hasil', () => {
  const a = ok({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak(['B', 'C'])] });
  const b = ok({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak(['C', 'B'])] });
  expect(b.saham).toEqual(a.saham);
});
test('MG6 pembanding: rantai biasa C lalu B memberi B bagian dari C', () => {
  const hasil = ok({ dasar: input(grafAnakBersaudara), urutanWafat: ['C', 'B'] });
  expect(hasil.saham).toEqual({ WC: 8n, DC: 32n, WB: 11n, SB: 77n });
});
test('MG3 [HNB] tilad–tharif di tengah rantai [R13-19]', () => {
  const hasil = ok({ dasar: { ...input(grafAnakBersaudara), ruleset: 'hanbali' }, urutanWafat: [{ anggota: ['B', 'C'], keadaan: 'tidakDiketahui' }] });
  expect(hasil.jamiah).toBe(128n);
  expect(hasil.saham).toEqual({ WB: 11n, SB: 77n, WC: 8n, DC: 32n });
});
test('MG4 campuran: kelompok lalu satu orang', () => {
  const hasil = ok({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak(), 'DC'] });
  expect(hasil.jamiah).toBe(48n);
  expect(hasil.saham).toEqual({ WB: 3n, SB: 38n, WC: 7n });
});
test('anggota tanpa bagian dilewati [R12-1]', () => {
  const hasil = ok({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak(['B', 'SB'])] });
  expect(hasil.daftarLangkah.map(langkah => langkah.mayit)).toEqual(['A', 'B']);
  expect(hasil.jejak).toContainEqual({ tahap: 'munasakhat', refs: ['R12-1'], jenis: 'MUNASAKHAT_DILEWATI', mayit: 'SB' });
});
test('kelompok satu orang → PERLU_INPUT', () => {
  expect(hitungMunasakhat({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak(['B'])] }).status).toBe('PERLU_INPUT');
});
test('orang tercatat dua kali → throw', () => {
  expect(() => hitungMunasakhat({ dasar: input(grafAnakBersaudara), urutanWafat: ['B', serentak()] })).toThrow('tercatat wafat dua kali');
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/engine test munasakhatGharqa`
Expected: FAIL (tipe/perilaku belum ada).

- [ ] **Step 3: Implementasi**

`munasakhat.ts`: loop atas kejadian; kejadian orang = perilaku lama; kejadian kelompok → `terapkanKelompok`, lalu `periksaInvarian`. `urutanKematian` meratakan kelompok untuk cek duplikat/keberadaan di graf; kelompok `< 2` anggota → `PERLU_INPUT` (`isian: 'statusHidup'`, `mayit` = anggota pertama). `tentukanKeadaan` memakai daftar orang yang sudah diratakan. Kalau ada kelompok bermetode `skenario`, untuk sementara kembalikan `TIDAK_DIDUKUNG` (Task 5 menggantinya).

- [ ] **Step 4: Jalankan seluruh tes engine**

Run: `pnpm --filter @waris/engine test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/munasakhat.ts packages/engine/src/langkahGharqa.ts packages/engine/src/types.ts packages/engine/src/__tests__/munasakhatGharqa.test.ts packages/engine/src/__tests__/fixtures/munasakhatGharqa.ts
git commit -m "feat(engine): kelompok gharqa sebagai langkah munasakhat [R12-6]"
```

---

### Task 5: [SYF] kelompok terlupakan di rantai → MAUQUF + batas skenario

**Files:**
- Modify: `packages/engine/src/munasakhat.ts`, `packages/engine/src/types.ts`
- Test: `packages/engine/src/__tests__/munasakhatGharqa.test.ts`

**Interfaces:**
- Consumes: `ekspansiSkenario`, `MAKS_SKENARIO_URUTAN` (Task 3).
- Produces:
  ```ts
  type HasilMunasakhatOk = Extract<HasilMunasakhat, { status: 'OK' }>;
  HasilMunasakhat |= { status: 'MAUQUF'; skenario: Array<{ urutanWafat: KejadianWafat[]; hasil: HasilMunasakhatOk }> };
  ```

- [ ] **Step 1: Tulis tes yang gagal**

```ts
test('MG2 [SYF] terlupakan → MAUQUF dengan dua skenario [R13-10]', () => {
  const hasil = hitungMunasakhat({ dasar: input(grafAnakBersaudara), urutanWafat: [{ anggota: ['B', 'C'], keadaan: 'terlupakan' }] });
  if (hasil.status !== 'MAUQUF') throw new Error(hasil.status);
  expect(hasil.skenario.map(skenario => skenario.urutanWafat)).toEqual([['B', 'C'], ['C', 'B']]);
  expect(hasil.skenario[0]!.hasil.saham).toEqual({ WB: 1n, SB: 10n, WC: 1n, DC: 4n });
  expect(hasil.skenario[1]!.hasil.jamiah).toBe(128n);
  expect(hasil.skenario[1]!.hasil.saham).toEqual({ WC: 8n, DC: 32n, WB: 11n, SB: 77n });
});
test('lebih dari 24 skenario → PERLU_INPUT', () => {
  // grafLimaAnak: A dengan anak lk S1..S5 (fixture baru di munasakhatGharqa.ts)
  const hasil = hitungMunasakhat({ dasar: input(grafLimaAnak), urutanWafat: [{ anggota: ['S1', 'S2', 'S3', 'S4', 'S5'], keadaan: 'terlupakan' }] });
  expect(hasil.status).toBe('PERLU_INPUT');
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/engine test munasakhatGharqa`
Expected: FAIL, status `TIDAK_DIDUKUNG`.

- [ ] **Step 3: Implementasi**

Di awal `hitungMunasakhat`: `ekspansiSkenario(input.urutanWafat, input.dasar.ruleset)`. Jumlah > `MAKS_SKENARIO_URUTAN` → `PERLU_INPUT` (alasan: pastikan sebagian urutan dulu). Satu ekspansi → jalur lama. Lebih dari satu → hitung tiap ekspansi; gagal di salah satu → kembalikan kegagalan itu; semua OK → `MAUQUF`. Hapus `TIDAK_DIDUKUNG` sementara dari Task 4.

Pemanggil di engine (`gharqa.ts` `skenarioUrutan`, `taqdir.ts` baris ~237) mengirim urutan orang tunggal, jadi `MAUQUF` tidak mungkin muncul di sana; persempit tipenya dengan `throw new Error('munasakhat: MAUQUF tak terduga')` supaya engine tetap lolos typecheck.

- [ ] **Step 4: Jalankan tes engine + typecheck**

Run: `pnpm --filter @waris/engine test && pnpm typecheck`
Expected: tes PASS. Typecheck boleh gagal hanya di `apps/web`/`packages/explain` karena varian `MAUQUF` baru; catat file-nya untuk Task 7.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/munasakhat.ts packages/engine/src/types.ts packages/engine/src/__tests__/munasakhatGharqa.test.ts packages/engine/src/__tests__/fixtures/munasakhatGharqa.ts
git commit -m "feat(engine): kelompok terlupakan di rantai munasakhat ditahan per skenario [R13-10]"
```

---

### Task 6: Gharqa dengan ahli waris yang wafat sesudahnya

**Files:**
- Modify: `packages/engine/src/gharqa.ts`, `packages/engine/src/types.ts`
- Test: `packages/engine/src/__tests__/gharqa.test.ts` (describe baru `'Gharqa × munasakhat sesudahnya'`)

**Interfaces:**
- Consumes: `hitungMunasakhat` (Task 5), `ekspansiSkenario`, `MAKS_SKENARIO_URUTAN`.
- Produces:
  - `InputGharqa.wafatSesudahnya?: KejadianWafat[]`
  - `HasilGharqa` MAUQUF: `skenario: Array<{ urutan: IdOrang[]; urutanSesudahnya?: KejadianWafat[]; harta: HartaGharqa[] }>`

- [ ] **Step 1: Tulis tes yang gagal**

```ts
const gharqaBC = (tambahan: Partial<InputGharqa> = {}) => hitungGharqa({
  dasar: { ...input(grafAnakBersaudara), ruleset: 'syafii' }, anggota: ['B', 'C'], keadaan: 'serentak', ...tambahan,
});
test('MG5 serentak lalu DC wafat sesudahnya [R12-6]', () => {
  const [hartaB, hartaC] = ok(gharqaBC({ wafatSesudahnya: ['DC'] })).harta;
  expect(hartaB!.saham).toEqual({ WB: 1n, SB: 7n });
  expect(hartaC!.jamiah).toBe(24n);
  expect(hartaC!.saham).toEqual({ WC: 7n, SB: 17n });
});
test('tanpa wafatSesudahnya: hasil sama seperti sebelumnya', () => {
  expect(ok(gharqaBC({ wafatSesudahnya: [] })).harta.map(harta => harta.saham))
    .toEqual(ok(gharqaBC()).harta.map(harta => harta.saham));
});
test('taqdir + wafatSesudahnya → TIDAK_DIDUKUNG', () => {
  const graf = { ...grafAnakBersaudara, orang: { ...grafAnakBersaudara.orang, JN: p('JN', 'L', { statusHidup: 'dalamKandungan', idAyah: 'B', idIbu: 'WB' }) } };
  const hasil = hitungGharqa({ dasar: input(graf), anggota: ['B', 'C'], keadaan: 'serentak', wafatSesudahnya: ['DC'] });
  expect(hasil.status).toBe('TIDAK_DIDUKUNG');
});
```
(`grafAnakBersaudara` di gharqa: `B`/`C` diberi `statusHidup: 'wafat'` lewat salinan graf di tes, karena `periksaAnggota` mewajibkannya.)

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/engine test gharqa`
Expected: FAIL (harta C belum menyerap DC).

- [ ] **Step 3: Implementasi**

Bila `wafatSesudahnya` tidak kosong: `adaTaqdir` → `TIDAK_DIDUKUNG` (alasan: gharqa + taqdir + munasakhat sesudahnya belum didukung). Metode `terpisah`: harta tiap anggota = `hitungMunasakhat({ dasar: inputSebagaiPewaris(input, mayit), urutanWafat: wafatSesudahnya })`. Metode `tilad`: lanjutkan hasil `tiladSatuMayit` dengan kejadian sesudahnya lewat fungsi rantai yang sama di `munasakhat.ts` (ekspor fungsi lanjutan rantai, jangan salin loop). Metode `skenario`: `urutanWafat` = sisa permutasi + `wafatSesudahnya`. Ekspansi `wafatSesudahnya` > 1 → `MAUQUF` dengan `urutanSesudahnya`; total skenario (permutasi anggota × ekspansi) > 24 → `PERLU_INPUT`.

- [ ] **Step 4: Jalankan seluruh tes engine**

Run: `pnpm --filter @waris/engine test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine/src/gharqa.ts packages/engine/src/munasakhat.ts packages/engine/src/types.ts packages/engine/src/__tests__/gharqa.test.ts
git commit -m "feat(engine): gharqa dengan ahli waris yang wafat sebelum pembagian [R12-6]"
```

---

### Task 7: Explain, kompilasi web, dan verifikasi penuh

**Files:**
- Modify: `packages/explain/src/munasakhat.ts` (pembukaan untuk kejadian kelompok)
- Create: file diksi JSON untuk `pnpm diksi:tambah` (kunci `narasi.munasakhat.wafat_bersamaan`)
- Modify: file web yang ditandai typecheck di Task 5 (perkiraan: `apps/web/src/jalankan.ts`, `apps/web/src/hasil/ringkasan.ts`)
- Test: `packages/explain/src/__tests__/munasakhat.test.ts`

**Interfaces:**
- Consumes: `HasilMunasakhat` OK `.urutanWafat: KejadianWafat[]` (Task 4).

- [ ] **Step 1: Tulis tes yang gagal**

```ts
test('MG1 — pembukaan menyebut wafat bersamaan', () => {
  const hasil = hitungMunasakhat({ dasar: input(grafAnakBersaudara), urutanWafat: [{ anggota: ['B', 'C'], keadaan: 'serentak' }] });
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  const teks = jelaskanMunasakhat(hasil, grafAnakBersaudara, { kamus: kamusSnapshot }).daftarBagian[0]!.daftarBab[0]!.daftarBaris.map(keTeksBiasa).join(' ');
  expect(teks).toContain('wafat bersamaan');
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/explain test munasakhat`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Tambah templat `narasi.munasakhat.wafat_bersamaan` (isi: nama anggota + "wafat bersamaan, sehingga tidak saling mewarisi") lewat `pnpm diksi:tambah`; pembukaan memakainya untuk kejadian kelompok. Di web, tangani `status: 'MAUQUF'` munasakhat seperti MAUQUF gharqa (pesan ditahan) supaya typecheck lolos; routing gabungan di `jalankan.ts` tidak termasuk.

- [ ] **Step 4: Verifikasi penuh**

Run: `pnpm test && pnpm typecheck`
Expected: semua PASS, tanpa error tipe.

- [ ] **Step 5: Commit**

```bash
git add packages/explain apps/web <file diksi>
git commit -m "feat(explain): narasi kelompok wafat bersamaan di munasakhat; web menangani MAUQUF munasakhat"
```
