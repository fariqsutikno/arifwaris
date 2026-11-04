# Kanvas Silsilah · Rencana 2: Pintu, Almarhum, dan Kanvas Keluarga — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pengguna memilih tujuan (latihan atau kasus nyata), mengisi almarhum, lalu mengisi keluarga lewat kanvas wawancara per bagian untuk `jenisKasus: 'nyata'`, dengan pohon di samping yang bisa diketuk.

**Architecture:** Semua keputusan data ada di fungsi murni baru (`keadaanBaris`, `isianBagian`, `halLain`, `statusKeluarga`, tambahan di `kelompok`) yang memakai fondasi rencana 1 (`daftarBagian`, `bagianLengkap`, `ujiHipotetis`, `antreanUrutan`, `silsilah`). Komponen di `layar/keluarga/` hanya merender dan memanggil fungsi itu lewat `UBAH_KASUS`. Alur Babak lama tidak dibongkar: `Wizard` memilih kanvas bila `jenisKasus === 'nyata'`, selain itu tetap alur lama.

**Tech Stack:** TypeScript, React, Vitest + Testing Library, `@waris/engine`.

**Spec:** `docs/superpowers/specs/2026-10-16-kanvas-silsilah-design.md` (bagian 2, 3, 4, 5, 8; 9 sebagian). Mockup acuan tampilan dan teks: `docs/design/mockup-kanvas-silsilah.html` (v5).

## Global Constraints

- Nama variabel, fungsi, tipe, komentar dalam bahasa Indonesia; istilah fikih memakai glosarium `docs/kb/15_glosarium.md`. Tiap cabang kode dari keputusan fikih diberi anotasi `[Rxx-y]`; aturan di luar KB tidak dikarang (CLAUDE.md).
- Fungsi murni: tanpa I/O, `Date`, `Math.random`. Mesin tidak diubah. UI tidak memuat aturan hajb; "perlu ditanyakan?" hanya dari `ujiHipotetis`/`kelompok`.
- Aturan tampilan spec bagian 2: mulai dari keadaan kosong; jenis kelamin selalu ditanya; **tanpa jawaban bawaan** untuk pertanyaan yang bisa membuat munasakhat/mawani' terlewat; **tombol utama tidak pernah nonaktif** (diklik saat ada yang kurang → baris yang kurang ditandai dan digulir ke sana, tanda hilang saat isian diubah, status lewat live region); garis bawah hanya untuk pindah halaman, penjelasan memakai Details (▸), aksi pada orang = ikon + teks terlihat; tidak ada menu ⋯ tersembunyi; pilihan menyesuaikan orangnya.
- Aksi sekunder/ajakan berupa teks atau tautan, bukan tombol berbingkai; tombol hanya untuk aksi utama (CLAUDE.md, keputusan 2026-09-28). Ikon SVG, bukan emoji. Tanpa metafora stasiun/kereta/kartu remi.
- Teks tampilan baru: kunci `hitung.kanvas.*` lewat `pnpm diksi:tambah <file.json>`, teksnya **disalin persis dari mockup v5 atau spec**. Kalimat yang tidak ada di keduanya: berhenti dan tanya pemilik. Tiga kalimat draf (pengantar cabang, "kenapa tidak ditanyakan", pesan WA) mengikuti Keputusan K2.
- Animasi hanya saat bagian berganti; mati bila gerak dimatikan (`data-gerak`, lihat `gaya/aplikasi.css`).
- Commit sesudah tiap tugas, hanya berkas tugas itu, dengan trailer `Co-Authored-By` sesuai instruksi sesi. Tidak membaca `.env*`.
- Perintah tes: `pnpm --filter @waris/web exec vitest run <berkas>`; semua `pnpm test`; tipe `pnpm typecheck`.

## Keputusan rencana ini

| # | Keputusan | Alasan |
|---|---|---|
| K1 | Kanvas hanya untuk `nyata`. Alur Babak (`LangkahBabak`, `PertanyaanPenutup`, `KE_BABAK`, `alasanBabak`) tetap melayani `latihan` dan **dihapus di akhir rencana 4**, bukan di sini. Ini menyimpang dari spec bagian 12 langkah 6. | Rencana 3 baru menulis layar Latihan. Menghapus Babak sekarang membuat latihan tidak punya layar munasakhat. |
| K2 | Tiga kalimat draf (spec 13) ditaruh di `apps/web/src/konten/kanvasDraf.ts` (konstanta bernama, komentar `DRAF`), **bukan** di snapshot diksi, sampai disahkan tim keilmuan. | Spec melarang kalimat belum sah masuk snapshot; CLAUDE.md melarang hardcode kalimat. Konstanta terpisah memenuhi keduanya dan mudah dipindah. **Perlu persetujuan pemilik.** |
| K3 | "Tetap isi kerabat lain" = state komponen (tidak disimpan di `Kasus`). | Bagian tetap tampil bila sudah berisi atau dijawab; tidak perlu field v4 baru. `ponytail:` hilang saat muat ulang bila belum diisi. |
| K4 | `saya` hanya disimpan + lencana "kamu" di baris. Sebutan "kakekmu" ditunda ke rencana 4 (kisah). | Sebutan butuh hubungan dari sudut pandang `saya`, belum ada fungsinya; Keluarga tidak memerlukannya. |
| K5 | "Masih dalam kandungan" memakai `PertanyaanHamil` apa adanya di bawah penghitung Anak, bukan penghitung ketiga. | Alur janin (siapa ibunya, sudah lahir?) sudah lengkap dan teruji. |
| K6 | `BarBawah` ditulis ulang untuk semua langkah (bukan hanya Keluarga). | Kode sekarang masih `disabled`; spec mengandalkan perubahan ini. |

## Review Focus

1. **Baris ditambah (+) lalu Lanjut tanpa memilih keadaan**: bagian ditandai kurang dan tidak lanjut diam-diam, orangnya tidak dianggap hidup. Diuji di Tugas 3, langkah 1 ("baris kosong menahan lanjut") dan Tugas 7, langkah 1 ("+ menambah baris tanpa keadaan terpilih").
2. **Ya → Tidak pada bagian yang cabangnya sudah terisi** (anak yang wafat sesudah, beserta keluarganya): konfirmasi menyebut semua orang yang ikut terhapus; `urutanWafat` dan bagian cabang ikut bersih. Diuji di Tugas 4, langkah 1 ("Ya → Tidak menghapus seluruh cabang").
3. **Ganti jenis kelamin almarhum sesudah keluarga terisi**: `jenisKasus`, `pintu`, dan tahun wafat almarhum terbawa; keluarga dan `kelompokDijawab` dikosongkan. Diuji di Tugas 2, langkah 1 ("ganti jenis kelamin membawa jenisKasus").
4. **Tahun wafat yang tidak bisa dibandingkan** (tahun sama tanpa bulan, atau tahun pembanding kosong): tidak ditebak, baris meminta pilihan sebelum/sesudah. Diuji di Tugas 3, langkah 1 ("tahun sama → minta pilihan").
5. **Muat ulang di tengah wawancara** (penyimpanan lokal atau berkas JSON): bagian aktif jatuh ke bagian pertama yang belum lengkap, baris kosong tetap tertandai (`belumDiisi` tersimpan). Diuji di Tugas 6, langkah 1 ("pulih ke bagian pertama yang belum lengkap").

Batas yang diketahui, bukan bagian rencana ini: tahun almarhum diubah sesudah anak-anak ditentukan tidak menggolongkan ulang "sebelum/sesudah" (rencana 4, panel "Ada yang keliru?").

---

## Peta berkas

| Berkas | Tugas | Tanggung jawab |
|---|---|---|
| `src/keadaan.ts` | 1 | `jenisKasus` di state, layar `'pintu'`, aksi `PILIH_JENIS_KASUS` |
| `src/layar/PintuLab.tsx` (baru) | 1 | Dua kartu "Mau menghitung apa?" tanpa bawaan |
| `src/layar/belajar/contoh.ts`, `src/lab.ts` | 1 | `kasusDariContoh` = `'latihan'`; susunan cepat = `'nyata'` |
| `src/pewaris.ts` (baru) | 2 | `gantiJenisKelaminPewaris`, `ubahNamaPewaris` (dipindah dari `Wizard.tsx`) |
| `src/layar/keluarga/IsianTahun.tsx` (baru), `src/layar/wizard/PertanyaanPintu.tsx` (baru), `LangkahPewaris.tsx`, `validasi.ts` | 2 | Tahun wafat dan pertanyaan pintu di langkah Almarhum |
| `src/keadaanBaris.ts` (baru), `src/keadaanOrang.ts` | 3 | Keadaan satu baris orang: pilihan, lanjutan, kelengkapan |
| `src/isianBagian.ts` (baru) | 4 | Ya/Tidak, penghitung, baris tetap, Kamu |
| `src/halLain.ts` (baru) | 4 | Beda agama / terlibat wafat per almarhum |
| `src/statusKeluarga.ts` (baru), `src/layar/wizard/BarBawah.tsx` | 5 | Status dan aksi bar bawah tanpa tombol nonaktif |
| `src/kelompok.ts`, `src/ringkasanBagian.ts` (baru) | 6 | `awalCabang`, `bagianDilewati`, ringkasan bagian |
| `src/layar/keluarga/KanvasKeluarga.tsx`, `PetaBagian.tsx`, `KartuBagian.tsx` (baru), `src/gaya/keluarga.css` (baru) | 6 | Kerangka kanvas |
| `src/layar/keluarga/BarisOrang.tsx`, `PenghitungOrang.tsx`, `PilihInduk.tsx` (baru) | 7 | Baris orang dan penghitung |
| `src/layar/keluarga/BagianKeluarga.tsx`, `KenapaTidakDitanya.tsx`, `src/konten/kanvasDraf.ts` (baru) | 8 | Isi bagian pasangan, anak, orang tua, kakek-nenek, saudara, jauh, anak bersama |
| `src/layar/keluarga/BagianUrutan.tsx`, `BagianKamu.tsx`, `BagianHalLain.tsx` (baru), `layar/keadaan/DialogKeadaan.tsx` | 9 | Bagian khusus |
| `src/layar/Wizard.tsx`, `src/layar/wizard/validasi.ts`, `src/layar/PeriksaCerita.tsx`, `src/Aplikasi.tsx` | 10 | Sambungan ke wizard |
| `src/layar/wizard/PanggungPohon.tsx`, `src/layar/lab/PohonSusunan.tsx` | 11 | Pohon samping bisa diketuk |
| `src/__tests__/integrasiKanvas.test.tsx` (baru) | 12 | Kasus A lewat kanvas = fixture |

Semua jalur relatif ke `apps/web/`.

---

### Task 1: Jenis kasus di state aplikasi dan layar Pintu

**Files:**
- Modify: `apps/web/src/keadaan.ts`, `apps/web/src/Aplikasi.tsx` (render layar `'pintu'`), `apps/web/src/layar/belajar/contoh.ts` (`kasusDariContoh` → `kasusBaru(..., 'latihan')`), `apps/web/src/lab.ts` (susunan cepat → `'nyata'` eksplisit)
- Create: `apps/web/src/layar/PintuLab.tsx`
- Test: `apps/web/src/__tests__/keadaan.test.ts`, `apps/web/src/__tests__/pintuLab.test.tsx`

**Interfaces:**
- Consumes: `JenisKasus`, `kasusBaru` (`kasus.ts`).
- Produces:
  ```ts
  export type Layar = 'awal' | 'pintu' | 'wizard' | 'cerita' | 'hasil' | 'belajar';
  // KeadaanAplikasi += jenisKasus: JenisKasus | null
  // Aksi += { jenis: 'PILIH_JENIS_KASUS'; jenisKasus: JenisKasus }
  export function PintuLab(props: { saatPilih: (jenisKasus: JenisKasus) => void }): JSX.Element;
  ```
- Perilaku: `MULAI` → `{ layar: 'pintu', langkah: 1, babak: 0, kasus: null, jenisKasus: null }`. `PILIH_JENIS_KASUS` → `{ layar: 'wizard', langkah: 1, jenisKasus }`. `PILIH_PEWARIS` membuat `kasusBaru(jenisKelamin, keadaan.jenisKasus ?? 'nyata')`. `MUAT` dan `keadaanAwal(kasusTersimpan, …)` mengisi `jenisKasus` dari kasusnya.

- [ ] **Step 1: Tulis tes yang gagal**

Di `keadaan.test.ts`:
- `'MULAI membuka layar pintu tanpa jenis kasus'`: sesudah `MULAI`, `layar === 'pintu'`, `jenisKasus === null`, `kasus === null`.
- `'PILIH_JENIS_KASUS latihan lalu PILIH_PEWARIS → kasus latihan'`: `kasus.jenisKasus === 'latihan'`, `layar === 'wizard'`.
- `'MUAT membawa jenisKasus kasusnya'`.

`pintuLab.test.tsx`:
- `'tanpa pilihan bawaan'`: radiogroup berlabel "Mau menghitung apa?", kedua radio `aria-checked="false"`.
- `'mengklik kartu memanggil saatPilih dengan jenisnya'`: "Belajar atau latihan soal" → `'latihan'`; "Kasus keluarga sungguhan" → `'nyata'`.
- `'kartu menyebut bedanya'`: tiap kartu punya satu kalimat keterangan (teks dari mockup).

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/keadaan.test.ts src/__tests__/pintuLab.test.tsx`
Expected: FAIL (`PintuLab` tidak ada; `layar` bukan `'pintu'`).

- [ ] **Step 3: Implementasi**

Ubah `keadaan.ts` sesuai perilaku di atas. `PintuLab.tsx` memakai pola `kartu-pilihan-deret` + `role="radio"` seperti `LangkahPewaris`. `Aplikasi.tsx` merender `PintuLab` bila `layar === 'pintu'` dan mengirim `PILIH_JENIS_KASUS`. Perbaiki literal `KeadaanAplikasi` di tes lain yang gagal typecheck dengan `jenisKasus: null`. `tautanKasus` untuk `ada: false` tidak perlu diubah. Pembuka Lab dari situasi di Beranda (spec perjalanan-keresahan 6.1) belum ada di kode; bila nanti ada, ia mengirim `PILIH_JENIS_KASUS` `'nyata'` langsung.

- [ ] **Step 4: Jalankan tes dan typecheck**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/keadaan.test.ts src/__tests__/pintuLab.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/keadaan.ts apps/web/src/Aplikasi.tsx apps/web/src/layar/PintuLab.tsx apps/web/src/layar/belajar/contoh.ts apps/web/src/lab.ts apps/web/src/__tests__
git commit -m "feat(web): pintu Lab (latihan atau kasus nyata) dan jenisKasus di state aplikasi"
```

---

### Task 2: Langkah Almarhum untuk kasus nyata: tahun wafat dan pertanyaan pintu

**Files:**
- Create: `apps/web/src/pewaris.ts`, `apps/web/src/layar/keluarga/IsianTahun.tsx`, `apps/web/src/layar/wizard/PertanyaanPintu.tsx`
- Modify: `apps/web/src/layar/Wizard.tsx` (memakai `pewaris.ts`; hapus dua fungsi lokalnya), `apps/web/src/layar/wizard/LangkahPewaris.tsx`, `apps/web/src/layar/wizard/validasi.ts`
- Test: `apps/web/src/__tests__/pewaris.test.ts`, `apps/web/src/__tests__/validasi.test.ts`, `apps/web/src/__tests__/langkahPewaris.test.tsx`

**Interfaces:**
- Consumes: `Kasus`, `TanggalKira`, `Pintu`, `PINTU` (Tugas 2 rencana 1).
- Produces:
  ```ts
  // pewaris.ts
  export function gantiJenisKelaminPewaris(kasus: Kasus, jenisKelamin: 'L' | 'P'): Kasus;   // dibawa: tirkah, satuanPembulatan, rincianHarta, nama, jenisKasus, pintu, waktu[idPewaris]
  export function ubahNamaPewaris(kasus: Kasus, nama: string): Kasus;
  // IsianTahun.tsx
  export function IsianTahun(props: { label: string; nilai: TanggalKira | undefined; saatUbah: (tanggal: TanggalKira | undefined) => void }): JSX.Element;
  ```
- `IsianTahun`: isian angka; kosong → `undefined`; bulat 1–9999 → `{ tahun, kiraKira: false }`; selain itu tidak mengubah nilai dan menampilkan pesan. `ponytail:` `kiraKira` selalu `false` dari isian; tanda "kira-kira" menunggu Periksa.
- `alasanBelumLengkap(kasus, 1)`: untuk `jenisKasus === 'nyata'` dan `pintu` belum dijawab mengembalikan teks `hitung.kanvas.pintu_belum_dijawab`; `'latihan'` tidak pernah.

- [ ] **Step 1: Tulis tes yang gagal**

`pewaris.test.ts`:
- `'ganti jenis kelamin membawa jenisKasus, pintu, tahun wafat, harta, dan nama; keluarga dan kelompokDijawab kosong'` (Review Focus 3): kasus `nyata` dengan `pintu: 'lama'`, `waktu: { PEWARIS: { wafat: { tahun: 1975, kiraKira: false } } }`, `kelompokDijawab: { PEWARIS: ['anak'] }`, satu istri; setelah `gantiJenisKelaminPewaris(…, 'P')`: `jenisKasus`, `pintu`, `waktu.PEWARIS`, `tirkah`, nama sama; `Object.keys(graf.orang)` = `['PEWARIS']`; `kelompokDijawab` tidak ada; `jenisKelamin === 'P'`.
- `'ganti jenis kelamin kasus latihan tetap latihan'`.
- `'ubahNamaPewaris menghapus nama bila kosong'`.

`validasi.test.ts`:
- `'langkah 1 nyata butuh jawaban pintu'`: `kasusBaru('L')` → alasan terisi; dengan `pintu: 'tidakTahu'` → `null`; `kasusBaru('L','latihan')` → `null`.

`langkahPewaris.test.tsx`:
- `'nyata menampilkan tahun wafat dan pertanyaan pintu tanpa bawaan'`: ada isian "Kira-kira tahun berapa", radiogroup pintu dengan empat pilihan, tak satu pun `aria-checked`.
- `'latihan tidak menampilkan keduanya'`.
- `'memilih "Sudah pernah dibagi" menampilkan pesan batas'`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/pewaris.test.ts src/__tests__/validasi.test.ts src/__tests__/langkahPewaris.test.tsx`
Expected: FAIL (`../pewaris` tidak ada).

- [ ] **Step 3: Implementasi**

Pindahkan `gantiPewarisDanKosongkan` (jadi `gantiJenisKelaminPewaris`, tambah pembawaan `jenisKasus`, `pintu`, `waktu[idPewaris]`) dan `ubahNamaPewaris` dari `Wizard.tsx` ke `pewaris.ts`. `PertanyaanPintu` memakai empat nilai `PINTU`; teks pertanyaan dan opsi dari mockup. Tahun almarhum ditulis ke `kasus.waktu[idPewaris].wafat` lewat `UBAH_KASUS`. Tambahkan kunci diksi `hitung.kanvas.*` untuk teks baru.

- [ ] **Step 4: Jalankan tes dan typecheck**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/pewaris.test.ts src/__tests__/validasi.test.ts src/__tests__/langkahPewaris.test.tsx src/__tests__/langkah.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pewaris.ts apps/web/src/layar apps/web/src/snapshot.json apps/web/src/__tests__
git commit -m "feat(web): langkah Almarhum kasus nyata: tahun wafat dan pertanyaan pintu; pewaris.ts membawa jenisKasus saat ganti jenis kelamin"
```

---

### Task 3: `keadaanBaris.ts`: keadaan satu orang dan lanjutannya

**Files:**
- Create: `apps/web/src/keadaanBaris.ts`
- Modify: `apps/web/src/keadaanOrang.ts` (tambah jawaban `{ jenis: 'belumTahu' }` dan `KeadaanTampil 'belumTahu'`), `apps/web/src/layar/keadaan/PertanyaanPenutup.tsx` (satu `case` agar `switch` tetap lengkap)
- Test: `apps/web/src/__tests__/keadaanBaris.test.ts`

**Interfaces:**
- Consumes: `terapkanKeadaan`, `KHUNTSA_MUNGKIN` (`DialogKeadaan.tsx`), `waktuRelatif`, `bandingTanggal`, `turunkanDariWaktu` (`silsilah.ts`), `Kasus.belumDiisi`.
- Produces:
  ```ts
  export type PilihanKeadaan = 'hidup' | 'wafat' | 'belumTahu' | 'hilang' | 'bercerai' | 'khuntsa';
  export interface OpsiKeadaan { nilai: PilihanKeadaan; kelompok: 'utama' | 'lainnya' }   // satu pilihan khusus → 'utama'
  export type Lanjutan = 'wafat' | 'putusan' | 'iddah' | 'baligh';
  export type JawabanLanjutan =
    | { jenis: 'wafat'; tahun?: TanggalKira | null; waktu?: 'sebelum' | 'sesudah' }
    | { jenis: 'putusan'; ada: boolean } | { jenis: 'iddah'; selesai: boolean } | { jenis: 'baligh'; sudah: boolean };
  export const pilihanKeadaan: (kunci: KunciAhliWaris) => OpsiKeadaan[];                       // tabel spec 5.3
  export function keadaanTerpilih(kasus: Kasus, id: IdOrang): PilihanKeadaan | null;           // null = belum dipilih
  export function pilihKeadaan(kasus: Kasus, id: IdOrang, pilihan: PilihanKeadaan, milik: IdOrang): Kasus;   // milik = almarhum pemilik bagian (pasangan bercerai dicari terhadap milik)
  export function lanjutanDiperlukan(kasus: Kasus, id: IdOrang): Lanjutan | null;
  export function jawabLanjutan(kasus: Kasus, id: IdOrang, milik: IdOrang, jawaban: JawabanLanjutan): Kasus;
  export function aturTahunWafat(kasus: Kasus, id: IdOrang, tahun: TanggalKira | undefined): Kasus;
  export function alasanBarisKurang(kasus: Kasus, id: IdOrang): string | null;                 // teks diksi, null = lengkap
  ```
- Aturan data (graf selalu sah bagi engine; `belumDiisi` hanya UI):
  - Baris baru: `statusHidup: 'hidup'` dan `id ∈ belumDiisi`. `keadaanTerpilih` = `null` selama `id ∈ belumDiisi` dan belum ada tanda keadaan di graf.
  - `hidup` → keluar dari `belumDiisi`. `belumTahu` → `statusHidup: 'tidakDiketahui'`, keluar dari `belumDiisi` (muncul lagi di Periksa).
  - `wafat` → `statusHidup: 'wafat'` sementara, tetap di `belumDiisi` sampai `jawabLanjutan({ jenis: 'wafat' })`. Lanjutan: dari `tahun` dan tahun `milik` bila `waktuRelatif` bisa memutuskan; selain itu dari `waktu`. `'sebelum'` → `terapkanKeadaan(wafatSebelum)`; `'sesudah'` → `terapkanKeadaan(wafatSesudah, hartaSudahDibagi: false)`. Bila tidak bisa diputuskan dan `waktu` kosong, baris tetap di `belumDiisi`.
  - `hilang` → `mafqud` sementara; lanjutan `putusan`: `ada: true` → jalur `wafat` di atas; `ada: false` → selesai (`mafqud`) [R13-6].
  - `bercerai` (pasangan saja) → `Pernikahan.status: 'talakRajiIddah'` sementara; lanjutan `iddah`: `selesai: true` → `'talakBain'`; `false` → `'talakRajiIddah'`. Pemetaan menurut bab 02 tabel hubungan, baris Nikah (raj'i dalam iddah masih mewarisi, ba'in tidak). **Cocokkan ke KB sebelum menulis; bila bertentangan, berhenti dan laporkan.** Talak ba'in dalam maradh al-maut [K02-3] tidak ditanyakan di sini (batas yang diketahui).
  - `khuntsa` → `Orang.khuntsa` sementara; lanjutan `baligh` memakai pemetaan layar `baligh` di `DialogKeadaan.tsx` (jangan membuat pemetaan baru).

- [ ] **Step 1: Tulis tes yang gagal**

- `'pilihanKeadaan: leluhur'`: `pilihanKeadaan('AYAH')` = hidup, wafat, belumTahu, hilang (semua `utama`).
- `'pilihanKeadaan: pasangan menaruh hilang dan bercerai di Lainnya'`: `pilihanKeadaan('ISTRI')` → `hilang` dan `bercerai` berkelompok `'lainnya'`.
- `'pilihanKeadaan: anak laki-laki: hilang dan khuntsa di Lainnya; kunci di luar KHUNTSA_MUNGKIN hanya hilang dan tampil langsung'`: `'ANAK_LK'` vs `'AYAH'`/`'NENEK_DARI_IBU'`.
- `'baris kosong menahan lanjut'` (Review Focus 1): kasus dengan satu `ANAK_LK` baru dan `belumDiisi: [id]` → `keadaanTerpilih` `null`, `alasanBarisKurang` terisi; `pilihKeadaan(…, 'hidup', 'PEWARIS')` → `belumDiisi` kosong, alasan `null`.
- `'belum tahu menyimpan tidakDiketahui dan jalankan tidak melempar'`: `statusHidup === 'tidakDiketahui'`; `jalankan(kasus)` mengembalikan objek (`jenis` bukan `'galat'` karena pengecualian).
- `'wafat dengan dua tahun beda → sebelum/sesudah otomatis'`: almarhum 1975; anak `wafat` 1998 → `urutanWafat` memuat anak; anak 1960 → `statusHidup: 'wafat'` dan tidak di `urutanWafat`.
- `'tahun sama → minta pilihan'` (Review Focus 4): kedua 1990 tanpa bulan → `lanjutanDiperlukan` = `'wafat'` dan baris tetap di `belumDiisi`; sesudah `jawabLanjutan({ jenis: 'wafat', waktu: 'sesudah' })` → masuk `urutanWafat`, `belumDiisi` kosong. Hal sama bila tahun almarhum kosong.
- `'hilang → putusan'`: `ada: false` → `mafqud`, selesai; `ada: true` → masuk jalur wafat.
- `'bercerai → iddah'`: `selesai: true` → `talakBain`; `false` → `talakRajiIddah`; baris lengkap sesudahnya.
- `'khuntsa → baligh'`: hasil sama dengan jawaban `khuntsa` di `DialogKeadaan` untuk pilihan yang sama.
- `'aturTahunWafat menulis dan menghapus waktu'`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/keadaanBaris.test.ts`
Expected: FAIL (`../keadaanBaris` tidak ada).

- [ ] **Step 3: Implementasi**

Tulis `keadaanBaris.ts` sebagai komposisi `terapkanKeadaan` dan `turunkanDariWaktu` (tidak menduplikasi hajb atau penerapan keadaan). Tambah `belumTahu` ke `JawabanKeadaan`/`KeadaanTampil` di `keadaanOrang.ts`. Tambah kunci diksi untuk teks alasan.

- [ ] **Step 4: Jalankan tes, seluruh tes web, dan typecheck**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/keadaanBaris.test.ts src/__tests__/keadaanOrang.test.ts src/__tests__/pertanyaanPenutup.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/keadaanBaris.ts apps/web/src/keadaanOrang.ts apps/web/src/layar/keadaan/PertanyaanPenutup.tsx apps/web/src/snapshot.json apps/web/src/__tests__
git commit -m "feat(web): keadaanBaris.ts: pilihan keadaan sesuai peran, lanjutan (wafat/putusan/iddah/baligh), kelengkapan baris; jawaban belumTahu"
```

---

### Task 4: `isianBagian.ts` dan `halLain.ts`: jawaban per bagian

**Files:**
- Create: `apps/web/src/isianBagian.ts`, `apps/web/src/halLain.ts`
- Test: `apps/web/src/__tests__/isianBagian.test.ts`, `apps/web/src/__tests__/halLain.test.ts`

**Interfaces:**
- Consumes: `Bagian`, `anggotaBagian`, `daftarBagian` (`kelompok.ts`), `tambahAhliWaris`, `hapusAhliWaris`, `jenisDari` (`checklist.ts`), `orangTerputus`, `kerabatDari` (`keadaanOrang.ts`), `rapikanKeadaan`, `keluargaKarto`/`tambah` (fixture).
- Produces:
  ```ts
  // isianBagian.ts
  export function kunciBagian(kasus: Kasus, bagian: Bagian): KunciAhliWaris[];   // peran yang dihitung di bagian itu, menurut jenis kelamin milik
  export const adalahBagianTetap: (bagian: Bagian) => boolean;                   // orangTua, kakekNenek: baris tetap tanpa Ya/Tidak
  export function jawabAdaTidak(kasus: Kasus, bagian: Bagian, ada: boolean): Kasus;
  export function dampakAdaKeTidak(kasus: Kasus, bagian: Bagian): IdOrang[];     // orang yang akan terhapus, termasuk keluarga cabang
  export function tambahBaris(kasus: Kasus, bagian: Bagian, kunci: KunciAhliWaris, opsi?: { idInduk?: IdOrang }): Kasus;
  export function kurangiBarisKosong(kasus: Kasus, bagian: Bagian, kunci: KunciAhliWaris): Kasus | null;   // null = tidak ada baris kosong
  export function hapusBaris(kasus: Kasus, id: IdOrang): Kasus;
  export function isiBarisTetap(kasus: Kasus, bagian: Bagian, kunci: KunciAhliWaris, pilihan: PilihanKeadaan): Kasus;
  export function calonKamu(kasus: Kasus): IdOrang[];
  export function jawabKamu(kasus: Kasus, id: IdOrang | null): Kasus;
  // halLain.ts
  export function anggotaHalLain(kasus: Kasus, milik: IdOrang): IdOrang[];
  export function jawabHalLain(kasus: Kasus, milik: IdOrang, ada: boolean): Kasus;   // Tidak → bersihkan agama/membunuh anggota milik
  export function tandaiBedaAgama(kasus: Kasus, id: IdOrang, beda: boolean): Kasus;
  export function tandaiTerlibat(kasus: Kasus, id: IdOrang, terlibat: boolean): Kasus;
  ```
- Aturan: "baris kosong" = `id ∈ belumDiisi` dan tanpa nama. `tambahBaris` menambah ke `belumDiisi`. Jawaban Ya/Tidak masuk `kelompokDijawab[bagian.milik]`. Bagian tetap dianggap dijawab bila tiap baris yang tampil sudah punya orang dengan keadaan dipilih (`isiBarisTetap` menandainya). Jumlah maksimum memakai `jenisDari(kunci).maksimal` (istri 4). `halLain.ts` memindahkan logika `LangkahKondisi` (daftar orang, `membunuhPewaris`, `agama: 'nonIslam'`) per almarhum [bab 02].

- [ ] **Step 1: Tulis tes yang gagal**

`isianBagian.test.ts`:
- `'tambahBaris menandai belumDiisi; kurangiBarisKosong hanya membuang baris kosong terakhir'`: tambah dua istri; beri nama pada yang pertama; `kurang` membuang yang kedua; `kurang` lagi → `null` (nama membuat baris tidak kosong).
- `'istri maksimal 4'`: baris kelima melempar galat yang sama dengan `tambahAhliWaris`.
- `'pasangan laki-laki menghitung istri, perempuan suami'`: `kunciBagian` untuk `pasangan` milik `kasusBaru('L')` = `['ISTRI']`, `kasusBaru('P')` = `['SUAMI']`.
- `'Ya → Tidak menghapus seluruh cabang'` (Review Focus 2): `keluargaKarto()` dengan `kelompokDijawab` anak terisi; `dampakAdaKeTidak(kasus, anak:PEWARIS)` memuat Slamet, Budi, Rina **dan** Dewi, Andi, Sari (keluarga Budi); `jawabAdaTidak(…, false)` → tak satu pun dari mereka di graf, `urutanWafat` tidak memuat Budi, `kelompokDijawab` tidak memuat bagian milik Budi, `anak` pewaris tercatat dijawab.
- `'Tidak pada bagian kosong tidak menghapus apa pun'`.
- `'isiBarisTetap membuat Ayah bila belum ada, menerapkan keadaan, dan menandai bagian dijawab bila semua baris terisi'`.
- `'jawabKamu: id hidup, null untuk orang lain; calonKamu hanya orang hidup bukan penghubung'`.

`halLain.test.ts`:
- `'Tidak membersihkan agama dan membunuh anggota milik itu saja'`.
- `'Ada lalu centang → agama nonIslam; anggota berasal dari keluarga milik'`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/isianBagian.test.ts src/__tests__/halLain.test.ts`
Expected: FAIL (modul tidak ada).

- [ ] **Step 3: Implementasi**

Komposisi fungsi yang sudah ada; hapus orang lewat `hapusAhliWaris` dan rapikan lewat `rapikanKeadaan` (yang membersihkan `urutanWafat`, `kelompokDijawab`, `waktu`). `dampakAdaKeTidak` memakai selisih `orangTerputus` sebelum dan sesudah. Tambah kunci diksi bila ada teks galat baru.

- [ ] **Step 4: Jalankan tes dan typecheck**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/isianBagian.test.ts src/__tests__/halLain.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/isianBagian.ts apps/web/src/halLain.ts apps/web/src/__tests__
git commit -m "feat(web): isianBagian.ts dan halLain.ts: jawaban Ya/Tidak, penghitung, baris tetap, Kamu, beda agama/terlibat per almarhum"
```

---

### Task 5: Status Keluarga dan bar bawah tanpa tombol nonaktif

**Files:**
- Create: `apps/web/src/statusKeluarga.ts`
- Modify: `apps/web/src/layar/wizard/BarBawah.tsx`, `apps/web/src/layar/Wizard.tsx` (hanya pemanggilan `BarBawah`; sambungan kanvas di Tugas 10)
- Test: `apps/web/src/__tests__/statusKeluarga.test.ts`, `apps/web/src/__tests__/barBawah.test.tsx`

**Interfaces:**
- Consumes: `daftarBagian`, `bagianLengkap` (`kelompok.ts`).
- Produces:
  ```ts
  export interface StatusKeluarga { sisa: number; pertama: Bagian | null; status: string }   // pertama = bagian pertama yang belum lengkap
  export function statusKeluarga(kasus: Kasus): StatusKeluarga;
  // BarBawah.tsx
  export function BarBawah(props: {
    saatKembali: () => void;
    status: string | null;                                  // teks live region
    aksi: { label: string; saatKlik: () => void; sebagai: 'tombol' | 'tautan' };
  }): JSX.Element;
  ```
- Spec 5.9 (dua dari tiga baris tabel; baris "Datang dari Periksa" ditambah rencana 4): masih ada bagian → status "Keluarga: {n} bagian lagi.", aksi tautan "Ke Periksa ›"; semua lengkap → "Keluarga sudah lengkap.", tombol "Lanjut: Periksa". Tombol tidak pernah `disabled`.
- Langkah selain Keluarga: `Wizard` menghitung `alasan` seperti sekarang; `aksi.saatKlik` bila ada alasan hanya menaruh alasan di `status` (live region `role="status"`) dan memindahkan fokus ke isian pertama yang tidak valid bila ada (`[aria-invalid="true"]`), tidak lanjut.

- [ ] **Step 1: Tulis tes yang gagal**

`statusKeluarga.test.ts`: kasus kosong → `sisa` ≥ 1 dan `pertama.jenis === 'pasangan'`; kasus Karto dengan semua bagian dijawab → `sisa === 0`, `pertama === null`, status "Keluarga sudah lengkap."

`barBawah.test.tsx`:
- `'tombol utama tidak pernah nonaktif'`: render dengan `aksi.sebagai: 'tombol'` → `disabled` salah.
- `'status berada di role=status'`.
- `'aksi tautan dirender sebagai tautan, bukan tombol berbingkai'`.
- `'Kembali memanggil saatKembali'`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/statusKeluarga.test.ts src/__tests__/barBawah.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Tulis ulang `BarBawah` dengan antarmuka di atas dan sesuaikan pemanggil di `Wizard.tsx` (langkah 1, 2, 4 memakai alasan yang ada). Perbaiki tes lain yang menyebut tombol Lanjut `disabled` (`langkah.test.tsx`, `langkah-harta.test.tsx`) agar menguji "diklik → alasan tampil, tidak lanjut".

- [ ] **Step 4: Jalankan seluruh tes web dan typecheck**

Run: `pnpm --filter @waris/web test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/statusKeluarga.ts apps/web/src/layar/wizard/BarBawah.tsx apps/web/src/layar/Wizard.tsx apps/web/src/snapshot.json apps/web/src/__tests__
git commit -m "feat(web): bar bawah tanpa tombol nonaktif (status + aksi), statusKeluarga"
```

---

### Task 6: Kerangka kanvas: peta bagian, kartu bagian, lanjut lokal

**Files:**
- Create: `apps/web/src/ringkasanBagian.ts`, `apps/web/src/layar/keluarga/KanvasKeluarga.tsx`, `PetaBagian.tsx`, `KartuBagian.tsx`, `apps/web/src/gaya/keluarga.css`
- Modify: `apps/web/src/kelompok.ts` (tambah `awalCabang`, `bagianDilewati`)
- Test: `apps/web/src/__tests__/ringkasanBagian.test.ts`, `apps/web/src/__tests__/kelompok.test.ts`, `apps/web/src/__tests__/kanvasKeluarga.test.tsx`

**Interfaces:**
- Consumes: `daftarBagian`, `bagianLengkap`, `anggotaBagian`, `statusKeluarga`, `jawabAdaTidak`, `dampakAdaKeTidak`.
- Produces:
  ```ts
  // kelompok.ts
  export function awalCabang(kasus: Kasus, bagian: Bagian): boolean;                 // bagian pertama sebuah cabang (milik ≠ pewaris)
  export interface BagianDilewati { jenis: 'saudara' | 'jauh' | 'kakekNenek' | 'anakDariWafat'; milik: IdOrang; sebab?: IdOrang }
  export function bagianDilewati(kasus: Kasus): BagianDilewati[];                    // untuk Details "Kenapa … tidak ditanyakan?"
  // ringkasanBagian.ts
  export function ringkasanBagian(kasus: Kasus, bagian: Bagian): string;             // "Tidak ada" | "Siti, Budi (wafat 1998)" | …
  // KanvasKeluarga.tsx
  export function KanvasKeluarga(props: {
    kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void;
    tandaiKurang: boolean;                    // true setelah aksi utama diklik saat ada yang kurang
    fokusOrang?: { id: IdOrang; kali: number };
    saatSelesai: () => void;                  // tombol "Selesai, lanjut ke Periksa" di bagian terakhir
  }): JSX.Element;
  ```
- Perilaku (spec 5.1, 5.5): kolom kiri = peta bagian + ringkasan bagian selesai + satu kartu aktif; bagian yang belum dicapai tidak dirender. Bagian aktif awal = bagian pertama yang belum lengkap; **tidak pindah sendiri**, hanya lewat tautan "Lanjut: {bagian berikutnya}" di kaki kartu atau tautan "Ubah" pada ringkasan. Peta berupa teks ("{n} dari {m} bagian selesai", deret nama bagian sebagai teks biasa, bukan pil). Fokus pindah ke judul kartu baru; animasi masuk hanya saat bagian berganti. Ya/Tidak = radiogroup tanpa bawaan; "Ya → Tidak" pada bagian berisi membuka `DialogKonfirmasi` yang menyebut `dampakAdaKeTidak`. Kartu pertama sebuah cabang diawali kalimat dari `konten/kanvasDraf.ts` (K2).
- Di tugas ini isi kartu (baris orang, penghitung) belum ada: `KartuBagian` menerima `children`, dan `KanvasKeluarga` memberi `children` kosong selain Ya/Tidak dan kaki. Tugas 8 dan 9 mengisinya.

- [ ] **Step 1: Tulis tes yang gagal**

`kelompok.test.ts` (tambahan): `awalCabang` benar untuk `anakBersama:{sumi}` dan `pasangan:{budi}`, salah untuk `anak:PEWARIS`; `bagianDilewati` pada Karto dengan `anak` dijawab memuat `saudara` dan `jauh` milik `PEWARIS`, serta `anakDariWafat` dengan `sebab` = Slamet.

`ringkasanBagian.test.ts`: bagian tanpa anggota dan `dijawab` → "Tidak ada"; Karto `anak:PEWARIS` menyebut Slamet (wafat), Budi, Rina.

`kanvasKeluarga.test.tsx`:
- `'kasus kosong: hanya kartu Pasangan dan peta; bagian lain tidak dirender'`.
- `'menjawab Tidak lalu Lanjut membuka Anak dan meringkas Pasangan'`; `'menjawab tidak memindahkan bagian sendiri'` (kartu aktif tetap Pasangan sampai Lanjut diklik).
- `'pulih ke bagian pertama yang belum lengkap'` (Review Focus 5): render dengan Karto bagian pasangan dan anak dijawab, `belumDiisi: [satuBaris]` → kartu aktif = bagian yang memuat baris itu; baris kosong tetap ditandai.
- `'Ya → Tidak pada Anak berisi menampilkan konfirmasi yang menyebut Dewi, Andi, Sari'`.
- `'fokus pindah ke judul kartu baru'` dan `'peta tidak berisi tombol atau pil'`.
- `'pengantar cabang tampil di kartu pertama cabang'`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/ringkasanBagian.test.ts src/__tests__/kelompok.test.ts src/__tests__/kanvasKeluarga.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Susun komponen sesuai perilaku di atas. Gaya mengikuti mockup (kelas `.grup`, `.ringkas`, `.kaki-grup`), ditulis di `keluarga.css` dengan token `token.css`, diimpor di tempat `wizard.css` diimpor. Tambah kunci diksi untuk teks peta dan kaki kartu. Buat `konten/kanvasDraf.ts` berisi kalimat pengantar cabang dari spec 5.2 (K2).

- [ ] **Step 4: Jalankan tes dan typecheck**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/ringkasanBagian.test.ts src/__tests__/kelompok.test.ts src/__tests__/kanvasKeluarga.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/ringkasanBagian.ts apps/web/src/kelompok.ts apps/web/src/layar/keluarga apps/web/src/gaya apps/web/src/konten/kanvasDraf.ts apps/web/src/snapshot.json apps/web/src/__tests__
git commit -m "feat(web): kerangka kanvas keluarga: peta bagian, kartu aktif, ringkasan, lanjut lokal"
```

---

### Task 7: Baris orang dan penghitung

**Files:**
- Create: `apps/web/src/layar/keluarga/BarisOrang.tsx`, `PenghitungOrang.tsx`, `PilihInduk.tsx`
- Modify: `apps/web/src/layar/LangkahAhliWaris.tsx` (hanya mengekstrak pilihan "dari siapa" dari `BarisJumlah` ke `PilihInduk` dan memakainya; perilaku lama tidak berubah)
- Test: `apps/web/src/__tests__/barisOrang.test.tsx`

**Interfaces:**
- Consumes: `pilihanKeadaan`, `keadaanTerpilih`, `pilihKeadaan`, `lanjutanDiperlukan`, `jawabLanjutan`, `aturTahunWafat`, `alasanBarisKurang` (Tugas 3); `tambahBaris`, `kurangiBarisKosong`, `hapusBaris`, `dampakAdaKeTidak` (Tugas 4); `IsianTahun` (Tugas 2); `dampakHapus`, `orangTerputus`; `DialogKonfirmasi`.
- Produces:
  ```ts
  export function BarisOrang(props: {
    kasus: Kasus; id: IdOrang; kunci: KunciAhliWaris; milik: IdOrang;
    ubah: (f: (k: Kasus) => Kasus) => void;
    tandaiKurang: boolean; disorot: boolean;
  }): JSX.Element;      // elemen akar membawa data-baris-orang={id} dan id={`baris-${id}`}
  export function PenghitungOrang(props: {
    kasus: Kasus; bagian: Bagian; kunci: KunciAhliWaris; ubah: (f: (k: Kasus) => Kasus) => void;
  }): JSX.Element;
  export function PilihInduk(props: { kunci: KunciAhliWaris; graf: GrafKeluarga; idMayit: IdOrang; nilai: string; saatUbah: (idInduk: string) => void }): JSX.Element;
  ```
- Spec 5.3–5.4: baris = peran (selalu tampil, label cadangan "Anak laki-laki 1" bila nama kosong) + isian nama + "Keadaannya sekarang?" (radiogroup dari `pilihanKeadaan`; pilihan `lainnya` di bawah satu pilihan "Lainnya") + lanjutan + "Hapus" (ikon + teks). Lanjutan: wafat → `IsianTahun` + bila tidak bisa diputuskan, radiogroup "Sebelum/Sesudah {milik}"; putusan, iddah, baligh = Ya/Tidak. Penghitung: **+** menambah baris kosong; **−** hanya membuang baris kosong terakhir, selain itu pesan "hapus lewat 'Hapus' di barisnya"; **Hapus** memakai konfirmasi dampak yang menyebut keluarga yang ikut terhapus. Satu Details "Bingung memilih?" per bagian, hanya memuat pilihan yang tampil (komponen kecil di berkas yang sama). Baris yang kurang (`tandaiKurang && alasanBarisKurang`) menampilkan alasan dan `aria-invalid`; tanda hilang begitu isian diubah.

- [ ] **Step 1: Tulis tes yang gagal**

- `'+ menambah baris tanpa keadaan terpilih; Lanjut-nya tertahan'` (Review Focus 1): sesudah klik +, tidak ada radio keadaan terpilih; `bagianLengkap` salah; dengan `tandaiKurang` baris menampilkan alasan dan `aria-invalid="true"`.
- `'pilihan keadaan sesuai peran'`: baris Ayah menampilkan Masih hidup, Sudah wafat, Belum tahu, Hilang tanpa kabar (tanpa "Lainnya"); baris Istri menampilkan "Lainnya" yang membuka Hilang tanpa kabar dan Sudah bercerai.
- `'Sudah wafat dengan dua tahun: tampil "Berarti sebelum {milik} wafat"; tanpa tahun: tampil pilihan Sebelum/Sesudah'`.
- `'− tanpa baris kosong menampilkan pesan, tidak menghapus orang berisi'`.
- `'Hapus membuka konfirmasi yang menyebut keluarga yang ikut terhapus'`.
- `'Belum tahu menampilkan catatan muncul lagi di Periksa'`.
- `'aksi pada baris = ikon + teks terlihat; tidak ada menu ⋯'`.
- `'Bingung memilih? hanya memuat pilihan yang tampil di bagian itu'`.
- `'baris disorot dapat digulir ke dalam pandangan'` (elemen punya `data-baris-orang` dan mendapat kelas sorot).

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/barisOrang.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Komponen hanya merender dan memanggil fungsi Tugas 3 dan 4 lewat `ubah`. Ikon SVG mengikuti set yang sudah ada (lihat `ui/Ikon`). Tambah kunci diksi untuk teks baru (dari mockup).

- [ ] **Step 4: Jalankan tes, tes `LangkahAhliWaris`, dan typecheck**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/barisOrang.test.tsx src/__tests__/langkah.test.tsx src/__tests__/langkahBabak.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/layar/keluarga apps/web/src/layar/LangkahAhliWaris.tsx apps/web/src/snapshot.json apps/web/src/__tests__
git commit -m "feat(web): baris orang dan penghitung kanvas: keadaan sesuai peran, lanjutan, hapus dengan konfirmasi dampak"
```

---

### Task 8: Isi bagian keluarga dan "kenapa tidak ditanyakan"

**Files:**
- Create: `apps/web/src/layar/keluarga/BagianKeluarga.tsx`, `KenapaTidakDitanya.tsx`
- Modify: `apps/web/src/layar/keluarga/KanvasKeluarga.tsx` (mengisi `children`; state `tambahan` untuk "Tetap isi"), `apps/web/src/konten/kanvasDraf.ts`
- Test: `apps/web/src/__tests__/bagianKeluarga.test.tsx`

**Interfaces:**
- Consumes: `kunciBagian`, `adalahBagianTetap`, `isiBarisTetap`, `jawabAdaTidak` (Tugas 4); `BarisOrang`, `PenghitungOrang` (Tugas 7); `bagianDilewati` (Tugas 6); `KERABAT_LAIN`; `PertanyaanHamil`.
- Produces:
  ```ts
  export function BagianKeluarga(props: { kasus: Kasus; bagian: Bagian; ubah: (f: (k: Kasus) => Kasus) => void; tandaiKurang: boolean; disorot: IdOrang | null }): JSX.Element;
  export function KenapaTidakDitanya(props: { dilewati: BagianDilewati; kasus: Kasus; saatTetapIsi: () => void }): JSX.Element;
  ```
- Isi menurut jenis bagian (spec 5.2): `pasangan` → Ya/Tidak; laki-laki "Berapa istri?" (penghitung `ISTRI`, ≤ 4), perempuan satu `SUAMI`; `anak` → Ya/Tidak + penghitung Laki-laki dan Perempuan + `PertanyaanHamil` (K5); `orangTua` → baris tetap Ayah dan Ibu; `kakekNenek` → baris tetap untuk posisi yang `posisiPerluDitanya`; `saudara`/`jauh` → Ya/Tidak + penghitung per jalur dari `KERABAT_LAIN` (kunci bertingkat memakai `PilihInduk`); `anakBersama` → "Ya, semuanya / Tidak semua" (Tidak semua → centang anak yang juga anak pemilik cabang); `halLain`, `urutan`, `kamu` diisi Tugas 9. `KenapaTidakDitanya` = Details "Kenapa {kelompok} tidak ditanyakan?" dengan satu kalimat dari `konten/kanvasDraf.ts` (K2) dan tautan teks **"Tetap isi kerabat lain"** yang menambahkan bagian itu ke daftar lewat state `tambahan` di `KanvasKeluarga` (K3); untuk `anakDariWafat`, bagian tambahannya `anak:{sebab}`. Sesudah "Tetap isi" muncul tautan teks **"Tambah dengan nama hubungan"** untuk kerabat bukan ahli waris (mertua, besan, anak tiri; spec 5.11): daftar `HUBUNGAN` dan `DialogTambahHubungan` dipakai ulang dari `PohonKeluarga`, tanpa mengubahnya.

- [ ] **Step 1: Tulis tes yang gagal**

- `'pasangan laki-laki: Berapa istri? maksimal 4; perempuan: satu suami'`.
- `'anak: penghitung Laki-laki dan Perempuan; PertanyaanHamil muncul'`.
- `'orang tua: baris tetap Ayah dan Ibu tanpa Ya/Tidak; bagian dijawab setelah keduanya punya keadaan'`.
- `'kakek-nenek hanya baris yang berpengaruh (ayah wafat → Kakek dan Nenek dari ayah)'`.
- `'saudara tidak dirender bila ada anak laki-laki; Details "Kenapa kakak atau adik … tidak ditanyakan?" ada'`.
- `'Tetap isi kerabat lain menambahkan bagian saudara'`.
- `'anak dari orang yang wafat sebelum tampil Details dan Tetap isi membuka anak:{Y}'`.
- `'anak bersama: Ya semuanya mencatat dijawab; Tidak semua menampilkan centang anak'`.
- `'Tambah dengan nama hubungan membuka DialogTambahHubungan dan menambah orang bukan ahli waris tanpa mengubah bagian yang sudah lengkap'`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/bagianKeluarga.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Satu `switch` pada `bagian.jenis`; setiap cabang memanggil fungsi murni, tanpa aturan hajb. Tambah teks draf ke `kanvasDraf.ts` (disalin dari spec 5.7/mockup) dan kunci diksi untuk label.

- [ ] **Step 4: Jalankan tes dan typecheck**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/bagianKeluarga.test.tsx src/__tests__/kanvasKeluarga.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/layar/keluarga apps/web/src/konten/kanvasDraf.ts apps/web/src/snapshot.json apps/web/src/__tests__
git commit -m "feat(web): isi bagian keluarga (pasangan, anak, orang tua, kakek-nenek, saudara, jauh, anak bersama) dan 'kenapa tidak ditanyakan'"
```

---

### Task 9: Bagian Urutan wafat, Kamu, dan Hal lain

**Files:**
- Create: `apps/web/src/layar/keluarga/BagianUrutan.tsx`, `BagianKamu.tsx`, `BagianHalLain.tsx`
- Modify: `apps/web/src/layar/keluarga/KanvasKeluarga.tsx`, `apps/web/src/layar/keadaan/DialogKeadaan.tsx` (prop opsional `mulaiDi?: 'serentak'`), `apps/web/src/layar/keluarga/BarisOrang.tsx` (lencana "kamu" bila `kasus.saya === id`)
- Test: `apps/web/src/__tests__/bagianKhusus.test.tsx`

**Interfaces:**
- Consumes: `pertanyaanUrutanBerikut`, `selesaikanUrutan`, `tundaUrutan` (rencana 1 Tugas 6); `jawabSisip`, `pembanding` (`urutan.ts`); `calonKamu`, `jawabKamu` (Tugas 4); `anggotaHalLain`, `jawabHalLain`, `tandaiBedaAgama`, `tandaiTerlibat`; `DialogKeadaan`.
- Produces: tiga komponen berprops `{ kasus: Kasus; bagian: Bagian; ubah: (f: (k: Kasus) => Kasus) => void }`.
- Perilaku: **Urutan** (5.6) = satu pertanyaan berpasangan per kartu "{A} wafat sebelum atau sesudah {B}?" dengan pilihan Sebelum / Sesudah / "Bersamaan, atau tidak tahu" / "Belum tahu". Sebelum/Sesudah → `jawabSisip`, lalu `selesaikanUrutan` bila `pembanding(sisipan)` kosong; "Belum tahu" → `tundaUrutan`; "Bersamaan" → `DialogKeadaan` dengan `mulaiDi: 'serentak'` (alur gharqa yang ada; dua almarhum lanjutan bersamaan tetap ditolak lewat `alasanTidakDidukung`). **Kamu** (5.8) = pilihan orang hidup + "Bukan, saya mengisi untuk orang lain", tanpa bawaan; boleh dilewati karena "orang lain" juga jawaban. **Hal lain** (5.2) = "Tidak ada / Ada" tanpa bawaan; "Ada" → dua kelompok centang (beda agama, terlibat wafat) atas `anggotaHalLain` [bab 02].

- [ ] **Step 1: Tulis tes yang gagal**

- `'urutan: pertanyaan berpasangan menyebut A dan B; Sebelum menyelesaikan dan bagian lengkap'` (fixture Karto, Budi 1998).
- `'urutan: Belum tahu menyimpan belumPasti dan bagian selesai'`.
- `'urutan: Bersamaan membuka dialog serentak'`.
- `'urutan tidak dirender bila semua bertahun atau tidak berpengaruh'`.
- `'kamu: tanpa bawaan; memilih orang menaruh lencana kamu di barisnya; "orang lain" menyimpan null dan bagian lengkap'`.
- `'hal lain: tanpa bawaan; Tidak membersihkan; Ada menampilkan centang hanya anggota keluarga milik'`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/bagianKhusus.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Tiga komponen tipis di atas fungsi murni yang sudah ada. `DialogKeadaan` menerima `mulaiDi` dan memakainya sebagai nilai awal `useState<Layar>`; perilaku tanpa prop tidak berubah.

- [ ] **Step 4: Jalankan tes termasuk `dialogKeadaan` dan typecheck**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/bagianKhusus.test.tsx src/__tests__/dialogKeadaan.test.tsx src/__tests__/kanvasKeluarga.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/layar apps/web/src/snapshot.json apps/web/src/__tests__
git commit -m "feat(web): bagian Urutan wafat, Kamu, dan Hal lain di kanvas keluarga"
```

---

### Task 10: Sambungan ke wizard: kanvas untuk kasus nyata

**Files:**
- Modify: `apps/web/src/layar/Wizard.tsx`, `apps/web/src/layar/wizard/validasi.ts`, `apps/web/src/layar/PeriksaCerita.tsx`, `apps/web/src/Aplikasi.tsx` (pemulihan URL)
- Test: `apps/web/src/__tests__/wizardKanvas.test.tsx`, `apps/web/src/__tests__/validasi.test.ts`

**Interfaces:**
- Consumes: `KanvasKeluarga`, `statusKeluarga`, `daftarBagian`, `bagianLengkap`, `BarBawah` baru.
- Produces: tidak ada API baru. Perilaku:
  - Langkah 3 untuk `jenisKasus === 'nyata'` merender `KanvasKeluarga` (nama almarhum tidak diulang; sudah di langkah 1). `latihan` tetap merender alur Babak lama tanpa perubahan (K1).
  - `alasanBelumLengkap(kasus, 3)` untuk `nyata`: `null` bila semua `daftarBagian` lengkap dan ada ahli waris; selain itu teks "Masih {n} bagian" (dari `statusKeluarga`). `langkahTerjauh` memakai fungsi yang sama.
  - Aksi bar bawah di langkah 3 nyata mengikuti `statusKeluarga`: tertahan → `tandaiKurang` menyala, gulir ke baris/bagian pertama yang kurang (baris bila ada `belumDiisi`, selain itu kartu bagian), status diumumkan; lengkap → `KE_LANGKAH 4`.
  - Langkah 4 untuk `nyata`: `CeritaKasus` + `NamaKasus` saja (`LangkahKondisi` dihapus karena "Hal lain" ada di kanvas). "Ubah" di `CeritaKasus` untuk `nyata` hanya `KE_LANGKAH 3` (tanpa `KE_BABAK`). Tautan `/langkah/3/{babak}` untuk `nyata` diabaikan babaknya.

- [ ] **Step 1: Tulis tes yang gagal**

`wizardKanvas.test.tsx`:
- `'nyata di langkah 3 merender kanvas (kartu Pasangan), bukan daftar jumlah'`.
- `'latihan di langkah 3 tetap merender LangkahAhliWaris'`.
- `'Lanjut saat ada bagian kurang: tidak pindah, status menyebut sisa bagian, baris pertama yang kurang ditandai dan digulir'`.
- `'semua bagian lengkap: Lanjut membuka Periksa'`.
- `'Periksa nyata tidak menampilkan LangkahKondisi'`.

`validasi.test.ts` (tambahan): `langkahTerjauh` untuk `nyata` berhenti di 3 selama ada bagian belum lengkap, dan naik ke hasil bila semua lengkap, harta terisi, dan pintu dijawab; `latihan` tidak berubah.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/wizardKanvas.test.tsx src/__tests__/validasi.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Cabangkan di `Wizard.tsx` menurut `kasus.jenisKasus`; jangan menyentuh jalur `latihan`. Gulir memakai `scrollIntoView` yang menghormati gerak mati (`data-gerak`), memfokuskan baris atau judul kartu. Perbaiki tes lama yang mengasumsikan `kasusBaru()` ber-Babak (beri `'latihan'`).

- [ ] **Step 4: Jalankan seluruh tes web dan typecheck**

Run: `pnpm --filter @waris/web test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/layar apps/web/src/Aplikasi.tsx apps/web/src/__tests__
git commit -m "feat(web): langkah Keluarga memakai kanvas untuk kasus nyata; Periksa nyata tanpa LangkahKondisi"
```

---

### Task 11: Pohon samping: hanya tampilan, ketuk menggulir ke baris

**Files:**
- Modify: `apps/web/src/layar/wizard/PanggungPohon.tsx`, `apps/web/src/layar/lab/PohonSusunan.tsx` (prop opsional `labelPilih`), `apps/web/src/layar/Wizard.tsx`, `apps/web/src/layar/keluarga/KanvasKeluarga.tsx` (`fokusOrang`: membuka bagian yang memuat orang itu lalu menggulir dan menyorot)
- Test: `apps/web/src/__tests__/pohonSamping.test.tsx`

**Interfaces:**
- Consumes: `PohonSusunan({ saatPilih, labelPilih })`, `anggotaBagian`, `daftarBagian`, `fokusOrang` (Tugas 6).
- Produces: `PanggungPohon` menerima `saatPilihOrang?: (id: IdOrang) => void`; bila ada, memakai `PohonSusunan` hanya-tampil dengan `saatPilih` itu dan label "Ke baris {nama}" (bukan `PohonKeluarga`/menu tambah, yang tidak dipakai di langkah ini, spec 5.11). Di HP pohon menjadi pita ringkas di atas daftar dengan tautan "Pohon lengkap".
- Spec 8 (keadaan simpul): simpul belum diisi/belum tahu bergaris putus-putus, wafat bergaris tipis, pemilik harta bergaris tebal. Periksa `PohonSusunan`/`PohonDasar`; bila belum memberi kelas berbeda per keadaan, tambahkan (`simpul-belum-pasti`, `simpul-wafat`, `simpul-pemilik`).

- [ ] **Step 1: Tulis tes yang gagal**

- `'mengetuk simpul memanggil saatPilihOrang dan tidak membuka menu tambah'`.
- `'label tombol simpul menyebut baris, bukan "Buka menu"'`.
- `'mengetuk simpul orang di bagian yang sudah selesai membuka bagian itu dan menyorot barisnya'` (`KanvasKeluarga` dengan `fokusOrang`).
- `'simpul belum tahu, wafat, dan pemilik memakai kelas berbeda'`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/pohonSamping.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

`Wizard` menyimpan `fokusOrang: { id, kali }` (kali bertambah tiap ketukan agar ketukan berulang tetap memicu). Pita HP memakai kelas responsif yang ada di `wizard.css`.

- [ ] **Step 4: Jalankan tes pohon dan typecheck**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/pohonSamping.test.tsx src/__tests__/pohonKeluarga.test.tsx src/__tests__/tataLetak.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/layar apps/web/src/gaya apps/web/src/__tests__
git commit -m "feat(web): pohon samping langkah Keluarga: hanya tampilan, ketuk menggulir ke baris, gaya simpul menurut keadaan"
```

---

### Task 12: Integrasi kasus A, aksesibilitas, dan verifikasi akhir

**Files:**
- Create: `apps/web/src/__tests__/integrasiKanvas.test.tsx`
- Modify: `docs/superpowers/plans/2026-10-16-kanvas-silsilah-1-fondasi.md` (hanya tabel "Rencana berikutnya", mengikuti K1)

**Interfaces:**
- Consumes: semua fungsi murni dan komponen rencana ini; `keluargaKarto` (fixture); `hitungMunasakhat` lewat `jalankan`.

- [ ] **Step 1: Tulis tes integrasi dan aksesibilitas**

- `'kasus A lewat kanvas = kasus A fixture'` (spec 11.6): membangun Karto hanya dengan `jawabAdaTidak`, `tambahBaris`, `pilihKeadaan`, `jawabLanjutan`, `aturTahunWafat`, `jawabHalLain`, `jawabKamu`; lalu `jalankan(kasus)` dan `jalankan(keluargaKarto().kasus)` menghasilkan saham akhir yang sama (Rina 1/3, Dewi 1/12, Andi 7/18, Sari 7/36).
- `'kasus A lewat migrasi v3 menghasilkan input engine yang sama'`.
- Aksesibilitas (spec 11.8): `'radiogroup berlabel'` (Pintu, Ya/Tidak, keadaan), `'live region mengumumkan status bagian'`, `'fokus pindah ke judul kartu baru'`, `'tombol utama tidak nonaktif'`, `'tab mencapai tiap kontrol baris tanpa jebakan'`.
- `'tidak ada kunci diksi yang hilang'`: tes diksi yang sudah ada tetap hijau (kunci literal `t('hitung.kanvas.*')` ada di snapshot).

- [ ] **Step 2: Jalankan seluruh tes dan typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS. Bila ada tes yang gagal di luar `apps/web` dan lolos saat dijalankan sendiri, catat sebagai flaky; jangan menyembunyikannya.

- [ ] **Step 3: Periksa tidak ada aturan fikih di UI baru**

Run: `grep -rnE "mahjub|hajb|ANAK_LK.*hidup" apps/web/src/layar/keluarga apps/web/src/isianBagian.ts apps/web/src/keadaanBaris.ts apps/web/src/halLain.ts apps/web/src/statusKeluarga.ts`
Expected: tidak ada aturan hajb tertulis; komentar boleh.

- [ ] **Step 4: Verifikasi di browser**

Jalankan dev server lewat `preview_start`, lalu: Lab → "Kasus keluarga sungguhan" → isi kasus A sampai Periksa. Bandingkan dengan `docs/design/mockup-kanvas-silsilah.html` pada lebar desktop dan HP (`resize_window`). Periksa: konsol tanpa galat, tombol utama tidak nonaktif, "+" lalu Lanjut menandai baris, ketuk simpul pohon menggulir ke baris, gerak mati menonaktifkan animasi. Laporkan apa yang tidak sempat diperiksa.

- [ ] **Step 5: Perbarui tabel rencana berikutnya, lalu commit**

Di tabel "Rencana berikutnya" rencana 1, ubah baris rencana 2 dan 4: kode Babak (`LangkahBabak`, `PertanyaanPenutup`, `KE_BABAK`, `alasanBabak`, `PeriksaCerita` lama, `LangkahKondisi` sebagai langkah) dihapus di akhir rencana 4 (K1).

```bash
git add apps/web/src/__tests__/integrasiKanvas.test.tsx docs/superpowers/plans/2026-10-16-kanvas-silsilah-1-fondasi.md
git commit -m "test(web): integrasi kasus A lewat kanvas, aksesibilitas; catat penghapusan kode Babak di akhir rencana 4"
```

---

## Rencana berikutnya

| Rencana | Isi | Bergantung pada |
|---|---|---|
| 3 · Latihan | Spec 6 (kartu per mayit di atas `LangkahAhliWaris`, urutan wafat, Periksa ringkas) + fixture latihan A (jami'ah 72) | `jenisKasus`, `PintuLab` (rencana ini) |
| 4 · Periksa | Spec 7 (belum dipastikan, ubah dipandu, kisah per babak, peristiwa), keadaan bar bawah "Kembali ke Periksa", sebutan "-mu" dari `saya` (K4), **penghapusan kode Babak** (K1) | `turunkanDariWaktu`, `tundaUrutan`, `tataLetak`, `BarBawah` baru |
