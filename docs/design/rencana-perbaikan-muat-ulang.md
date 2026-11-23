# Rencana perbaikan: muat ulang di Hitung & Latihan

Tanggal: 2026-11-23. Untuk dikerjakan di sesi baru (Sonnet). Diagnosis & peta uji lengkap:
`docs/design/uji-muat-ulang-hitung.md` (baca dulu; ID seperti A1, B1, L4 merujuk ke sana).

**Tujuan:** refresh (atau ganti bahasa, yang juga memuat ulang) di soal latihan atau di Lab Hitung mengembalikan
pengguna ke layar, soal, isian, dan status yang sama, tanpa progres ganda.

**Di luar cakupan:** sinkron isian ke akun/server, pulih lintas perangkat, mengubah alur Babak/cerita, tampilan baru.

## Keputusan yang sudah diambil

- Isian & status soal disimpan di `sessionStorage` per `idSesi`: bertahan saat refresh, hilang saat tab ditutup.
  Cukup untuk keluhan; tidak menambah data permanen.
- **H2 "Jangan simpan kasus ini"** diingat per `idSesi` di `sessionStorage` yang sama. Alasan: pilihan eksplisit
  pengguna untuk tidak menyimpan tidak boleh dibatalkan diam-diam oleh simpan otomatis sesudah refresh.
- Jangkar dibuat deterministik dari `idSesi` (benih), bukan `Math.random`. Buka soal yang sama lagi dari daftar =
  `idSesi` baru = jangkar boleh beda (perilaku B5 tetap).
- Kasus yang tidak ditemukan saat pulih (P8): tetap ke Awal, tetapi dengan pemberitahuan. Teks lewat `t()` +
  snapshot diksi, bukan hardcode.

## Aturan kerja

- Ikuti `CLAUDE.md` (penamaan Indonesia, komentar "mengapa", tanpa nama 1 huruf) dan konvensi file sekitar.
- TDD: tiap tugas tulis tes merah dulu, jalankan, baru implementasi.
- Commit sesudah tiap tugas, hanya file sendiri (worktree ini punya perubahan KHI yang belum di-commit milik sesi
  lain: `PanelKhi*`, `catatanKhi*`, `khi.css`, `Hasil.tsx` bagian KHI, `main.tsx`, `snapshot.json`. **Jangan ikut
  di-stage.** Untuk `Hasil.tsx`/`snapshot.json` pakai `git add -p`).
- Perintah tes: `pnpm --filter @waris/web exec vitest run <path>`; seluruh web: `pnpm --filter @waris/web test`;
  tipe: `pnpm --filter @waris/web exec tsc --noEmit`.

## Peta file

| File | Peran |
|---|---|
| `apps/web/src/Aplikasi.tsx` | `pulihDariUrl`, `soalAktif`, `bukaRiwayat`, efek `PULIHKAN`, props ke `Hasil` |
| `apps/web/src/sesiTab.ts` (**baru**) | satu-satunya pemilik `sessionStorage`: progres soal + tanda jangan-simpan per `idSesi` |
| `apps/web/src/acakBerbenih.ts` (**baru**) | PRNG kecil deterministik dari string |
| `apps/web/src/layar/Hasil.tsx` | jangkar berbenih, pulihkan status soal, teruskan isian awal |
| `apps/web/src/hasil/TabelLatihan.tsx` | prop `isianAwal`, `hasilAwal`, `saatIsianBerubah` |
| `apps/web/src/hasil/GharqaLatihan.tsx` | sama untuk pilihan gharqa |
| `apps/web/src/layar/wizard/validasi.ts` atau `KonfirmasiKasusBaru.tsx` | `bolehDiHasil` (dekat `kasusLengkap`) |
| `apps/web/src/__tests__/pulihUrl.test.ts` | tes pulih (perluas) |

---

## Tugas 1: syarat "boleh di Hasil" (B1, P4, P5, H7)

**Masalah:** susunan cepat (`mulaiDari`) membuka Hasil dengan harta 0; `pulihDariUrl` memaksa `!kasusLengkap` ke wizard.

1. Tes merah di `pulihUrl.test.ts`:
   - kasus `kasusBaru('L')` + ISTRI, `tirkah.kotor = 0n`, `jenisKasus` latihan/default → `pulihDariUrl('#/hitung/x')`
     → `layar: 'hasil'`.
   - kasus tanpa ahli waris → tetap `wizard` (tes lama dipertahankan).
   - kasus `nyata` yang pintunya belum dijawab → `wizard`.
2. Implementasi: `bolehDiHasil(kasus)` = semua langkah wizard lengkap **kecuali** syarat harta langkah 2
   (`alasanBelumLengkap` untuk langkah 1, 3, 4 kosong). Letakkan di `validasi.ts` dekat `langkahTerjauh`, satu sumber.
   Pakai di `pulihDariUrl` menggantikan `kasusLengkap`. Periksa apakah `mulaiDari` di `Aplikasi.tsx` perlu ikut
   memakai `bolehDiHasil` (supaya kedua jalur memakai syarat yang sama); jangan ubah `kasusLengkap` lain (riwayat,
   konfirmasi) tanpa alasan.
3. Hijau → commit `fix(web): muat ulang susunan cepat tetap di Hasil (bolehDiHasil)`.

## Tugas 2: pulihkan soal aktif (A1, A2, L1, L12, L17)

**Masalah:** `soalAktif` hanya `useState`; refresh/buka dari Riwayat kehilangan hero soal, soal berikutnya, penanda
selesai, dan pencatatan percobaan.

1. Tes merah (unit, ekspor fungsi murni dari `Aplikasi.tsx`):
   - `soalDariSumber({ jenis: 'latihan', kode: 'H-01' })` → soal H-01 dari `daftarSoalHitung()`.
   - kode tak dikenal → `null` (L12: kasus tetap dibuka sebagai latihan terkunci, tanpa hero).
   - sumber non-latihan → `null`.
2. Implementasi di `Aplikasi.tsx`:
   - `useState(() => soalDariSumber(pulih?.sumber))` untuk `soalAktif`.
   - efek `PULIHKAN`: `setSoalAktif(soalDariSumber(dariUrl.sumber))` menggantikan `setSoalAktif(null)`.
   - `bukaRiwayat`: setelah `bukaDiHitung`, `setSoalAktif(soalDariSumber(entri.sumber))` (L17: buka soal latihan dari
     Riwayat juga dapat hero & penanda).
3. Cek manual di preview (`preview_start web`): buka soal dari Latihan → refresh → judul "Soal 1 dari 23 · …" dan
   "Soal H-01" tetap ada.
4. Commit `fix(web): soal latihan dipulihkan dari riwayat saat muat ulang/buka riwayat`.

## Tugas 3: jangkar berbenih (A4, L6)

1. `acakBerbenih.ts`: `export function acakDariBenih(benih: string): () => number` (hash string → mulberry32 atau
   sejenis, ±10 baris). Tes: benih sama → deret sama; benih beda → deret beda; nilai dalam [0, 1).
2. `Hasil.tsx`: `pilihJangkar(tabelSoal, acakDariBenih(idSesi))`; gharqa: benih `${idSesi}:${indeks}` per harta.
   Komentar mengapa: "berbenih supaya jangkar sama setelah muat ulang".
   Catatan CLAUDE.md "tanpa Math.random" berlaku untuk engine; ini UI, tetapi deterministik justru lebih baik.
3. Tes komponen kecil atau unit: dua render `Hasil` dengan `idSesi` sama → jangkar sama.
4. Commit `fix(web): jangkar soal latihan berbenih idSesi, stabil saat muat ulang`.

## Tugas 4: modul `sesiTab.ts` (fondasi untuk tugas 5 & 6)

Satu modul, fungsi saja (bukan kelas), semua akses dibungkus try/catch (mode privat/kuota → tidak crash, P10):

```ts
export interface ProgresSoalTab {
  isian: IsianTabel | null;          // soal biasa/taqdir
  pilihanGharqa: KeputusanGharqa | null;
  jawabanTerbuka: boolean;
  sudahMencoba: boolean;
  tebakanBenar: boolean;
  idSesiSoal: string;                // id sesi percobaan (L7)
  revisiSoal: string;                // L13: dibuang bila revisi beda
}
export function bacaProgresSoalTab(idSesi: string, revisiSoal: string): ProgresSoalTab | null
export function simpanProgresSoalTab(idSesi: string, progres: ProgresSoalTab): void
export function hapusProgresSoalTab(idSesi: string): void
export function bacaJanganSimpanTab(idSesi: string): boolean
export function simpanJanganSimpanTab(idSesi: string, nilai: boolean): void
```

- Kunci: `arif-waris:tab:soal:<idSesi>`, `arif-waris:tab:jangan-simpan:<idSesi>`.
- Validasi bentuk saat baca (JSON rusak/versi lama → `null`).
- Tes unit: simpan→baca bolak-balik; revisi beda → `null`; JSON rusak → `null`; `sessionStorage` melempar → tidak
  melempar, `null`/`false`.
- Commit `feat(web): sesiTab, simpanan sessionStorage per idSesi (progres soal, jangan simpan)`.

## Tugas 5: isian & status soal bertahan (A3, L2–L5, L7, L8, L9, X5)

1. `TabelLatihan.tsx`: prop opsional `isianAwal?: IsianTabel`, `saatIsianBerubah?: (isian: IsianTabel) => void`.
   `useState(isianAwal ?? kosong)`; panggil `saatIsianBerubah` saat isian berubah (termasuk Kosongkan).
   Hasil periksa terakhir tidak perlu dipersist: bila `tebakanBenar`, tabel tampil terbuka lewat `terbuka`.
   `GharqaLatihan.tsx`: sama untuk `dipilih` (`pilihanAwal`, `saatPilihanBerubah`) dan teruskan ke tabel di dalamnya.
2. `Hasil.tsx` (hanya bila `soal` ada dan `adalahBelajar`):
   - Saat mount: `const awal = bacaProgresSoalTab(idSesi, soal.revisiId)`. Inisialisasi `jawabanTerbuka`,
     `sudahMencoba`, `tebakanBenar`, `idSesiSoal` dari `awal` bila ada.
   - Awas efek `useEffect(() => setJawabanTerbuka(!adalahBelajar), [adalahBelajar])`: jangan sampai menimpa nilai
     pulihan pada render pertama.
   - Setiap perubahan isian/status → `simpanProgresSoalTab`.
   - **Tanpa efek samping saat pulih (L4, X5):** nilai pulihan hanya mengisi state; JANGAN memanggil
     `saatDikerjakan`, `catatLatihan`, atau `catat('buka')` ulang. `catat('buka')` dilewati bila `awal` ada
     (`sudahDibuka.current = true`), karena kejadian `buka` sesi itu sudah tercatat sebelum refresh.
3. `Aplikasi.tsx` `kerjakanSoal`: `idSesi` baru otomatis lewat `MUAT` → progres lama tidak terbaca (L8). Tidak perlu
   hapus eksplisit; boleh `hapusProgresSoalTab(idSesiLama)` saat ganti sesi supaya tidak menumpuk.
4. Tes komponen (Testing Library, lihat pola `hasil/PanelKhi.test.tsx`):
   - isi satu sel → unmount → render ulang dengan `idSesi` sama → sel terisi (L2).
   - periksa salah → render ulang → buka jawaban → `saatDikerjakan(false)` dipanggil sekali (L3).
   - jawab benar → render ulang → pembahasan terbuka, `saatDikerjakan` **tidak** dipanggil lagi (L4).
   - lihat jawaban tanpa mencoba → render ulang → terbuka, `saatDikerjakan` tidak dipanggil (L5).
   - `idSesi` beda → isian kosong (L8).
5. Commit `fix(web): isian dan status soal latihan bertahan saat muat ulang (sessionStorage)`.

## Tugas 6: "Jangan simpan" diingat (H2)

1. `Aplikasi.tsx`: inisialisasi `sesiJanganSimpan` dari `bacaJanganSimpanTab(pulih?.id)`; `saatJanganSimpan`
   memanggil `simpanJanganSimpanTab(idSesi, nilai)` (Urungkan → `false`).
2. Tes: tandai jangan simpan → simulasikan pulih dengan id sama → `janganSimpan` true → `useSimpanOtomatis` tidak
   menyimpan.
3. Commit `fix(web): pilihan Jangan simpan bertahan saat muat ulang`.

## Tugas 7: kasus tidak ditemukan (P8, P10, P11, X2)

1. `pulihDariUrl` tetap mengembalikan `null`, tetapi `Aplikasi` membedakan "URL kasus tapi entri tak ada" dari
   "bukan URL kasus" (mis. `bacaRute(hash).kasus` ada && `pulih === null`).
2. Tampilkan pemberitahuan di Awal Hitung (pakai komponen toast/peringatan yang sudah ada; cari dulu, jangan buat
   baru): mis. "Kasus ini tidak ada lagi di perangkat ini. Mungkin sudah dihapus atau lewat 30 hari." Tambah kunci
   diksi ke snapshot (`pnpm diksi:tambah <file.json>`, lihat CLAUDE.md), jangan hardcode.
3. Tes komponen: hash `#/hitung/tidak-ada` → pemberitahuan tampil, URL jadi `#/hitung`.
4. Commit `feat(web): beri tahu bila kasus di URL tidak ditemukan`.

## Tugas 8: dedup riwayat lintas tab (X1, X3)

`catatRiwayat` membuang entri lain berisi JSON sama. Dua tab membuka soal yang sama → entri tab pertama hilang →
refresh tab pertama gagal pulih.

1. Tes merah: `catatRiwayat('a', k)`, `catatRiwayat('b', k)` → `pulihDariUrl('#/hitung/a')` tidak null.
2. Opsi paling kecil: dedup hanya membuang entri **bersumber sama dan bukan latihan**, ATAU pulih mencari entri
   berisi kasus sama bila id tak ada. Pilih yang tidak menggandakan daftar Riwayat untuk kasus `sendiri` (perilaku
   "tidak dicatat dua kali" harus tetap). Tulis alasan pilihan di pesan commit. Jika ragu, tanyakan pemilik.
3. Commit `fix(web): refresh tetap pulih walau kasus sama dibuka di tab lain`.

## Tugas 9: properti & verifikasi akhir

1. Property test (fast-check ada di `packages/latihan|engine|math` tapi belum di `apps/web`; jangan tambah dependency,
   cukup loop atas kasus contoh: susunan cepat, soal-soal `daftarSoalHitung()`, kasus belum lengkap): untuk tiap
   keadaan hasil/wizard/cerita yang dicapai lewat reducer, `catatRiwayat(id, kasus)` lalu
   `pulihDariUrl(tautanKasus(id, keadaan))` → `layar` & `langkah` sama.
2. Tes sisa dari peta uji yang murah di level U: P3, P6, H5, H6, H8, H9, L10, L11, L16.
3. `pnpm --filter @waris/web test` + `tsc --noEmit` hijau.
4. Preview (sekali, hemat): L1–L5, H2, P4, P8, P13 (back/forward), H4 (dialog `beforeunload` di wizard).
   Lampirkan ringkasan hasil, bukan klaim.
5. Perbarui status di `uji-muat-ulang-hitung.md` (tandai ID yang sudah tercakup tes) → commit.

## Selesai bila

- Semua tes baru & lama hijau, tipe bersih.
- Di preview: soal latihan setengah diisi → refresh → hero, kode, isian, jangkar sama; jawab benar → refresh →
  pembahasan terbuka, progres tidak dobel; susunan cepat → refresh → tetap Hasil.
- Tidak ada file KHI milik sesi lain yang ikut ter-commit.
