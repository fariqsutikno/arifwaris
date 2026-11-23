# Rencana perbaikan: muat ulang, model simpan, dan hapus kasus

> **Pembaruan 2026-11-23 (penggabungan #53 dan #55):** bagian soal latihan dalam rencana ini **digantikan model #55**
> (`spec-siklus-kasus-dan-soal.md`): soal tidak masuk riwayat, isian disimpan per kode soal (`isianSoal.ts`), soal punya
> alamat `#/latihan/soal/<kode>`, jangkar berbenih kode soal + nomor percobaan. `progresSoalLokal.ts` dibuang. Bagian
> yang tetap berlaku: boleh di Hasil, Hapus kasus ini (hapus tuntas), kebijakan privasi, kasus tak ditemukan, hash rusak.
> Baris/tugas yang berubah diberi tanda "digantikan model #55".

Tanggal: 2026-11-23 (revisi 2: model simpan disederhanakan, keputusan pemilik). Untuk dikerjakan di sesi baru
(Sonnet). Diagnosis & peta uji: `docs/design/uji-muat-ulang-hitung.md` (ID seperti A1, B1, L4, S3 merujuk ke sana).

**Tujuan:**
1. Refresh (atau ganti bahasa, yang juga memuat ulang) di soal latihan atau Lab Hitung mengembalikan pengguna ke
   layar, soal, isian, dan status yang sama, tanpa progres ganda.
2. Model simpan yang jujur dan sederhana: **lokal selalu otomatis**, **akun = ikut tersinkron bila masuk**,
   privasi lewat **"Hapus kasus ini"** yang benar-benar menghapus. Tidak ada lagi mode "Jangan simpan".
3. Kebijakan privasi menyebut apa yang tersimpan di perangkat, berapa lama, dan cara menghapusnya.

**Di luar cakupan:** sinkron isian soal setengah jadi ke akun, desain ulang halaman Riwayat, konten KHI, audit
aturan akses tautan bagikan `#/k/<slug>` (dijadwalkan sesudah rencana ini selesai, lihat bawah).

## Model simpan (keputusan pemilik 2026-11-23)

| Data | Di perangkat (localStorage) | Di akun (bila masuk) | Masa |
|---|---|---|---|
| Kasus (sendiri, impor, materi, salinan tautan) | otomatis: riwayat + Tersimpan | Tersimpan tersinkron (sudah berjalan: `simpanKasus` → `antre('tersimpan')`) | riwayat 30 hari tak dibuka; Tersimpan sampai dihapus |
| Kasus soal latihan | otomatis: riwayat (sumber `latihan`) | tidak (progres & XP yang tersinkron) | 30 hari | ← digantikan model #55 (soal tidak masuk riwayat; isian per kode soal, tanpa kedaluwarsa 30 hari)
| Isian soal setengah jadi + status (dibuka/mencoba/benar) | otomatis, per sesi kasus | tidak | ikut entri riwayatnya (30 hari) | ← digantikan model #55 (soal tidak masuk riwayat; isian per kode soal, tanpa kedaluwarsa 30 hari)
| Progres latihan, XP, percobaan | sudah ada | sudah tersinkron | tidak berubah |

- **Mengulang soal:** buka dari daftar Latihan = percobaan baru (sesi baru, tabel kosong, jangkar baru). Buka dari *(digantikan model #55, `spec-siklus-kasus-dan-soal.md`)*
  Riwayat = lanjut isian terakhir. Tombol "Kosongkan" di tabel tetap untuk mengulang di tempat.
- **"Jangan simpan kasus ini" dihapus.** Alasan: sekarang menyesatkan, karena hanya menghapus dari Tersimpan
  (`hapusTersimpan`), sedangkan efek `catatRiwayat` di `Aplikasi.tsx` tetap menulis kasus ke riwayat perangkat
  30 hari. Selain itu membuat refresh setengah benar (pilihan hilang, simpan otomatis jalan lagi).
- **Gantinya: "Hapus kasus ini"** di layar Hasil, yang menghapus **tuntas**: riwayat, Tersimpan (lokal + antrean
  akun `hapus_tersimpan`), isian soal lokal, dan bila kasus sedang dibagikan, tautannya dihentikan
  (`repoAkun.bagikan.berhenti` + `bagikanLokal`). Sesudah hapus: kembali ke Awal Hitung, toast dengan Urungkan
  (urungkan = tulis ulang semua yang tadi dihapus, kecuali tautan yang sudah dihentikan; sebut itu di teks dialog).
- Keluar akun di perangkat bersama sudah membersihkan (`keluarDanBersihkan`); pastikan isian soal lokal ikut.

## Aturan kerja

- Ikuti `CLAUDE.md` (penamaan Indonesia, komentar "mengapa", tanpa nama 1 huruf; UI: aksi sekunder = teks/tautan,
  tombol berbingkai hanya aksi utama dialog) dan konvensi file sekitar. Memori pemilik: ikon SVG bukan emoji.
- TDD: tiap tugas tulis tes merah dulu, jalankan, baru implementasi.
- Commit sesudah tiap tugas, **hanya file sendiri**. Worktree ini punya perubahan KHI belum di-commit milik sesi
  lain (`PanelKhi*`, `catatanKhi*`, `khi.css`, bagian KHI `Hasil.tsx`, `main.tsx`, `snapshot.json`,
  `packages/content|explain` KHI, `mockup-kalau-menurut-khi.html`, `AGENTS.md`). Jangan di-stage; untuk
  `Hasil.tsx`/`snapshot.json` pakai `git add -p`. Kalau bentrok berat, berhenti dan tanya pemilik.
- Teks baru lewat `t()` + snapshot diksi (`pnpm diksi:tambah <file.json>`), jangan hardcode. Kunci yang tidak
  dipakai lagi dihapus dari snapshot di tugas yang sama.
- Perintah: `pnpm --filter @waris/web exec vitest run <path>`, `pnpm --filter @waris/web test`,
  `pnpm --filter @waris/web exec tsc --noEmit`.

## Peta file

| File | Peran |
|---|---|
| `apps/web/src/Aplikasi.tsx` | `pulihDariUrl`, `soalAktif`, `bukaRiwayat`, efek `PULIHKAN`, props ke `Hasil`; buang `sesiJanganSimpan` |
| `apps/web/src/progresSoalLokal.ts` (**baru**) | satu-satunya pemilik simpanan isian/status soal per `idSesi` (localStorage) ← bagian soal digantikan model #55 |
| `apps/web/src/acakBerbenih.ts` (**baru**) | PRNG kecil deterministik dari string |
| `apps/web/src/riwayat.ts` | kedaluwarsa riwayat ikut membuang progres soal; dedup lintas tab ← bagian soal digantikan model #55 |
| `apps/web/src/kasusmu.ts` | `hapusKasus` jadi hapus tuntas (+ progres soal, + tautan bagikan) ← bagian soal digantikan model #55 |
| `apps/web/src/layar/Hasil.tsx` | jangkar berbenih, pulihkan status soal, "Hapus kasus ini" ← bagian soal digantikan model #55 |
| `apps/web/src/hasil/LembarBagikan.tsx` | buang tautan "Jangan simpan" |
| `apps/web/src/hasil/useSimpanOtomatis.ts` | buang parameter jangan-simpan bila tak terpakai lagi |
| `apps/web/src/hasil/TabelLatihan.tsx`, `GharqaLatihan.tsx` | isian awal + callback perubahan |
| `apps/web/src/layar/lab/BerkasKasus.tsx` | pakai hapus tuntas (sekarang tidak menghentikan tautan bagikan) |
| `apps/web/src/akun/sinkron.ts` | `keluarDanBersihkan` ikut membersihkan progres soal lokal ← bagian soal digantikan model #55 |
| `apps/web/src/layar/wizard/validasi.ts` | `bolehDiHasil` dekat `langkahTerjauh` |
| `apps/web/src/layar/Privasi.tsx`, `akun/persetujuan.ts`, `snapshot.json` | teks kebijakan + versi |

---

## Tugas 1: syarat "boleh di Hasil" (B1, P4, P5, H7)

**Masalah:** susunan cepat (`mulaiDari`) membuka Hasil dengan harta 0; `pulihDariUrl` memaksa `!kasusLengkap` ke wizard.

1. Tes merah di `__tests__/pulihUrl.test.ts`:
   - `kasusBaru('L')` + ISTRI, `tirkah.kotor = 0n` → `pulihDariUrl('#/hitung/x')` → `layar: 'hasil'`.
   - kasus tanpa ahli waris → `wizard` (tes lama tetap).
   - kasus `nyata` yang pintunya belum dijawab → `wizard`.
2. `bolehDiHasil(kasus)` = langkah 1, 3, 4 lengkap menurut `alasanBelumLengkap`; harta (langkah 2) boleh 0. Satu
   sumber di `validasi.ts`. Pakai di `pulihDariUrl` menggantikan `kasusLengkap`; periksa `mulaiDari` memakai
   syarat yang sama. Jangan ubah pemakai `kasusLengkap` lain tanpa alasan.
3. Commit `fix(web): muat ulang susunan cepat tetap di Hasil (bolehDiHasil)`.

## Tugas 2: pulihkan soal aktif (A1, A2, L1, L12, L17) — *(digantikan model #55, `spec-siklus-kasus-dan-soal.md`)*

1. Tes merah: ekspor `soalDariSumber(sumber)` dari `Aplikasi.tsx`:
   `{latihan, 'H-01'}` → soal H-01 dari `daftarSoalHitung()`; kode tak dikenal → `null`; sumber lain → `null`.
2. `Aplikasi.tsx`:
   - `useState(() => soalDariSumber(pulih?.sumber))` untuk `soalAktif`.
   - efek `PULIHKAN`: `setSoalAktif(soalDariSumber(dariUrl.sumber))` menggantikan `setSoalAktif(null)`.
   - `bukaRiwayat`: sesudah `bukaDiHitung`, `setSoalAktif(soalDariSumber(entri.sumber))` (L17).
3. Preview: buka soal dari Latihan → refresh → "Soal 1 dari 23 · …" dan "Soal H-01" tetap.
4. Commit `fix(web): soal latihan dipulihkan dari riwayat saat muat ulang/buka riwayat`.

## Tugas 3: jangkar berbenih (A4, L6) — *(digantikan model #55, `spec-siklus-kasus-dan-soal.md`)*

1. `acakBerbenih.ts`: `export function acakDariBenih(benih: string): () => number` (hash string → mulberry32,
   ±10 baris). Tes: benih sama → deret sama; beda → beda; nilai dalam [0, 1).
2. `Hasil.tsx`: `pilihJangkar(tabelSoal, acakDariBenih(idSesi))`; gharqa: benih `${idSesi}:${indeks}` per harta.
   Komentar: berbenih supaya jangkar sama setelah muat ulang; sesi baru = jangkar baru (B5).
3. Commit `fix(web): jangkar soal latihan berbenih idSesi, stabil saat muat ulang`.

## Tugas 4: modul `progresSoalLokal.ts` — *(digantikan model #55, `spec-siklus-kasus-dan-soal.md`)*

Fungsi saja, semua akses localStorage dibungkus try/catch (mode privat/kuota → tidak crash, P10):

```ts
export interface ProgresSoalLokal {
  isian: IsianTabel | null;              // soal biasa/taqdir
  pilihanGharqa: KeputusanGharqa | null;
  jawabanTerbuka: boolean;
  sudahMencoba: boolean;
  tebakanBenar: boolean;
  idSesiSoal: string;                    // id sesi percobaan (L7)
  revisiSoal: string;                    // L13: dibuang bila revisi beda
}
export function bacaProgresSoal(idSesi: string, revisiSoal: string): ProgresSoalLokal | null
export function simpanProgresSoal(idSesi: string, progres: ProgresSoalLokal): void
export function hapusProgresSoal(idSesi: string): void
export function hapusSemuaProgresSoal(): void              // untuk keluar akun
export function buangProgresSoalSelain(idSah: ReadonlySet<string>): void  // ikut kedaluwarsa riwayat
```

- Satu kunci `arif-waris:progres-soal` berisi objek `{ [idSesi]: ProgresSoalLokal }` (mudah dibersihkan sekaligus).
- Validasi bentuk saat baca (JSON rusak/versi lama → `null`).
- `riwayat.ts`: sesudah `catatRiwayat` membuang entri kedaluwarsa, panggil `buangProgresSoalSelain(id yang tersisa)`
  supaya isian tidak hidup lebih lama dari kasusnya (S5).
- Tes unit: bolak-balik; revisi beda → `null`; JSON rusak → `null`; localStorage melempar → tidak melempar;
  entri riwayat kedaluwarsa → progresnya ikut hilang.
- Commit `feat(web): progresSoalLokal, isian soal per sesi di perangkat`.

## Tugas 5: isian & status soal bertahan (A3, L2–L5, L7, L8, L9, X5) — *(digantikan model #55, `spec-siklus-kasus-dan-soal.md`)*

1. `TabelLatihan.tsx`: prop opsional `isianAwal?: IsianTabel`, `saatIsianBerubah?: (isian: IsianTabel) => void`;
   `useState(isianAwal ?? kosong)`; panggil callback tiap isian berubah (termasuk Kosongkan). Hasil periksa
   terakhir tidak dipersist; bila `tebakanBenar`, tabel tampil terbuka lewat `terbuka`.
   `GharqaLatihan.tsx`: sama untuk `dipilih` (`pilihanAwal`, `saatPilihanBerubah`) dan teruskan ke tabelnya.
2. `Hasil.tsx` (hanya bila `soal` ada dan `adalahBelajar`):
   - Mount: `const awal = bacaProgresSoal(idSesi, soal.revisiId)`; isi `jawabanTerbuka`, `sudahMencoba`,
     `tebakanBenar`, `idSesiSoal` dari `awal`.
   - Awas `useEffect(() => setJawabanTerbuka(!adalahBelajar), [adalahBelajar])`: jangan menimpa nilai pulihan.
   - Tiap perubahan isian/status → `simpanProgresSoal`.
   - **Tanpa efek samping saat pulih (L4, X5):** nilai pulihan hanya mengisi state; JANGAN memanggil
     `saatDikerjakan`, `catatLatihan`, atau `catat('buka')` ulang (`sudahDibuka.current = true` bila `awal` ada).
3. Buka soal dari daftar → `MUAT` memberi `idSesi` baru → progres lama tidak terbaca (L8). Sisa progres sesi lama
   dibersihkan oleh kedaluwarsa riwayat; tidak perlu hapus eksplisit.
4. Tes komponen (pola `hasil/PanelKhi.test.tsx`, `__tests__/hasil.test.tsx`):
   - isi sel → unmount → render ulang `idSesi` sama → sel terisi (L2).
   - periksa salah → render ulang → buka jawaban → `saatDikerjakan(false)` sekali (L3).
   - jawab benar → render ulang → pembahasan terbuka, `saatDikerjakan` tidak dipanggil lagi (L4).
   - lihat jawaban tanpa mencoba → render ulang → terbuka, `saatDikerjakan` tidak dipanggil (L5).
   - `idSesi` beda → kosong (L8).
5. Commit `fix(web): isian dan status soal latihan tersimpan otomatis di perangkat`.

## Tugas 6: hapus tuntas di satu tempat (S1–S4, S7) — bagian progres soal digantikan model #55

1. Tes merah untuk `hapusKasus(id, bagikan?)` di `kasusmu.ts`:
   - menghapus entri riwayat, Tersimpan (dan antre `hapus_tersimpan`), progres soal `id`.
   - bila `sudahDibagikan(id)` dan `bagikan` diberikan → `bagikan.berhenti(id)` dipanggil dan `bagikanLokal`
     dibersihkan; galat jaringan tidak membatalkan hapus lokal (dicatat, kasus tetap hilang dari perangkat).
   - mengembalikan cadangan `{ entriRiwayat, tersimpan, progresSoal }` untuk Urungkan; `pulihkanKasus(cadangan)`
     menulis ulang semuanya (Tersimpan ikut antre lagi ke akun).
2. Pakai di `layar/lab/BerkasKasus.tsx` (sekarang tidak menghentikan tautan bagikan) dan halaman Riwayat bila
   memakai jalur lain (cari semua pemanggil `hapusRiwayat`/`hapusTersimpan` di luar modulnya; satukan).
3. Commit `fix(web): hapus kasus tuntas (riwayat, tersimpan, progres soal, tautan bagikan)`.

## Tugas 7: "Jangan simpan" → "Hapus kasus ini" (S1, S6, H2 lama)

1. Buang: `sesiJanganSimpan` & `saatJanganSimpan` di `Aplikasi.tsx`; prop `janganSimpan`/`saatJanganSimpan` di
   `Hasil.tsx`; tautan di `LembarBagikan.tsx`; kunci diksi `hasil.bagikan_lembar.jangan_simpan(_ket)`,
   `hasil.simpan.tidak_disimpan` bila tak terpakai lagi; tes terkait di `__tests__/hasil.test.tsx`.
   `useSimpanOtomatis(idSesi, kasus, aktif)`: `aktif` = `!hanyaBaca && !tanpaSimpan` saja.
2. Tambah "Hapus kasus ini" di Hasil: tautan teks bergaya bahaya (bukan tombol berbingkai), di tempat tautan lama
   (lembar bagikan/aksi kasus). Tidak tampil untuk `hanyaBaca` (tautan penerima). Untuk soal latihan: tampil juga
   (menghapus kasus + isian dari perangkat; progres/XP tidak dihapus, sebut di dialog).
3. Dialog konfirmasi (`DialogKonfirmasi` yang sudah ada):
   - judul "Hapus kasus ini?"; isi: dihapus dari perangkat ini dan dari akunmu (bila masuk); bila dibagikan:
     "tautan bagikannya juga dihentikan dan tidak bisa dipulihkan"; tombol Hapus / Batal.
4. Sesudah hapus: `kirim({ jenis: 'ULANGI' })` → Awal Hitung, toast "Kasus dihapus" + Urungkan (memanggil
   `pulihkanKasus` lalu membuka kasus itu lagi lewat `bukaRiwayat`).
5. Label status simpan di hero: "Tersimpan di riwayat · {jam}" → sesuaikan bila perlu supaya jujur:
   masuk akun → "Tersimpan · ikut akunmu"; tidak masuk → "Tersimpan di perangkat ini". Usulkan teks, minta
   persetujuan pemilik di akhir sesi bila ragu.
6. Tes komponen: tautan lama tidak ada; hapus → dialog → konfirmasi → `hapusKasus` dipanggil, layar Awal, toast;
   Urungkan → kasus kembali; refresh sesudah hapus (`#/hitung/<id>`) → P8.
7. Commit `feat(web): ganti Jangan simpan dengan Hapus kasus ini (hapus tuntas + urungkan)`.

## Tugas 8: keluar akun membersihkan isian soal (S8) — bagian progres soal digantikan model #55

1. `akun/sinkron.ts` `keluarDanBersihkan`: tambah `hapusSemuaProgresSoal()` di samping pembersihan yang sudah ada.
   Periksa juga apakah riwayat lokal dibersihkan; samakan dengan teks kebijakan (Tugas 10), jangan mengubah
   perilaku lain tanpa mencatatnya.
2. Tes unit: sesudah keluar, `bacaProgresSoal` → `null`.
3. Commit `fix(web): keluar akun ikut membersihkan isian soal di perangkat`.

## Tugas 9: kasus tidak ditemukan, hash rusak, lintas tab (P8, P10, P11, P16, P17, X1, X2)

1. `Aplikasi` membedakan "URL kasus tapi entri tak ada" (`bacaRute(hash).kasus` ada && `pulih === null`) dari
   "bukan URL kasus". Tampilkan pemberitahuan di Awal Hitung pakai komponen peringatan/toast yang sudah ada:
   "Kasus ini tidak ada lagi di perangkat ini. Mungkin sudah dihapus atau lewat 30 hari." (diksi).
2. Dedup lintas tab: `catatRiwayat` membuang entri lain berisi JSON sama → refresh tab pertama gagal pulih.
   Tes merah: `catatRiwayat('a', k)`, `catatRiwayat('b', k)` → `pulihDariUrl('#/hitung/a')` tidak null.
   Perbaikan terkecil yang dianjurkan: bila id tak ada, `pulihDariUrl` tidak bisa menebak; jadi dedup dibatasi ke
   sumber bukan `latihan` (soal latihan per sesi memang boleh berganda, tiap sesi = percobaan) DAN pulih tetap
   jatuh ke P8 bila memang hilang. Pertahankan "kasus sendiri yang sama tidak dicatat dua kali". Tulis alasan di
   pesan commit; ragu → tanya pemilik.
3. Aturan keamanan pesan (P16): teks pemberitahuan **umum dan sama untuk semua sebab** (dihapus, kedaluwarsa,
   id acak/tebakan, perangkat lain), dan **tidak menampilkan id atau teks apa pun dari URL**. Id kasus hanya dicari
   di localStorage perangkat (tidak ada permintaan server berdasarkan id), jadi tidak ada IDOR di jalur ini; jangan
   menambah fetch server berdasarkan id dari URL.
4. Hash rusak (P17): `bacaRute` memanggil `decodeURIComponent`, yang melempar `URIError` untuk `%` salah format
   (mis. `#/hitung/%E0`, `#/belajar/%`). Tes merah dulu: `bacaRute('#/hitung/%E0')` tidak melempar. Perbaikan:
   satu helper `dekodeSegmen` dengan try/catch di `rute.ts` dipakai di semua pemanggilan (jangan tambal per cabang);
   segmen gagal decode → rute dianggap tak dikenal (`beranda`), atau untuk `#/hitung/...` → perlakuan P8.
   Cek juga di preview bahwa halaman tidak blank.
5. Commit `fix(web): beri tahu kasus tak ditemukan (pesan umum); hash rusak tidak membuat aplikasi macet; refresh pulih walau soal sama dibuka di tab lain`.

## Tugas 10: kebijakan privasi (S9)

Teks ada di `snapshot.json` (kunci `privasi.*`), dirender `layar/Privasi.tsx`. Bagian `[DIISI PEMILIK]` jangan
diisi sendiri. Perubahan:

1. `privasi.data_isi`: tambahkan kalimat perangkat, usulan:
   "Tanpa masuk pun, kasus yang kamu hitung dan isian soal latihan tersimpan otomatis di perangkat ini (penyimpanan
   peramban) supaya bisa dilanjutkan setelah halaman dimuat ulang. Data ini tidak dikirim ke server kecuali kamu
   masuk." Ganti kalimat lama "Tanpa masuk, semuanya hanya tersimpan di perangkatmu." supaya tidak dobel.
   Bila masuk: "riwayat kasus hitungan yang kamu simpan" → "kasus hitungan yang tersimpan (otomatis)", karena
   Tersimpan disinkron otomatis, bukan hanya yang disimpan manual.
2. `privasi.retensi_isi`: tambahkan bagian yang sudah pasti: "Di perangkat: kasus yang tidak dibuka 30 hari dan
   isian soalnya dihapus otomatis; kasus yang kamu simpan bertahan sampai kamu menghapusnya." Biarkan
   `[DIISI PEMILIK]` untuk data server lainnya.
3. `privasi.hak_isi`: tambahkan "Kamu bisa menghapus satu kasus kapan saja lewat 'Hapus kasus ini' di halaman
   hasil atau di Riwayat; kasus terhapus dari perangkat dan dari akunmu, dan tautan bagikannya dihentikan."
4. `privasi.dialog_ringkas`: tambahkan satu kalimat pendek: "Kasus hitunganmu ikut tersimpan di akun."
5. Naikkan `VERSI_KEBIJAKAN_PRIVASI` 1 → 2 di `akun/persetujuan.ts` (isi data yang disimpan berubah → minta setuju
   ulang). Perbarui tes persetujuan yang mengandalkan angka versi.
6. Teks Arab/terjemah: ikuti pola entri diksi lain; jika ada kolom bahasa lain yang wajib, isi atau tandai sesuai
   konvensi snapshot (cek tes cakupan diksi).
7. Catat di laporan akhir: memori pemilik "saat fitur kelas mulai, update kebijakan" tetap berlaku terpisah.
8. Commit `docs(web): kebijakan privasi v2 (simpan otomatis di perangkat, retensi lokal, hapus kasus)`.

## Tugas 11: properti & verifikasi akhir

1. Invarian (tanpa menambah dependency; fast-check belum ada di `apps/web`): loop atas kasus contoh (susunan cepat,
   soal `daftarSoalHitung()`, kasus belum lengkap): tiap keadaan hasil/wizard/cerita lewat reducer →
   `catatRiwayat(id, kasus)` → `pulihDariUrl(tautanKasus(id, keadaan))` → `layar` & `langkah` sama.
2. Tes sisa murah level U dari peta uji: P3, P6, H5, H6, H8, H9, L10, L11, L16.
3. `pnpm --filter @waris/web test` + `tsc --noEmit` hijau.
4. Preview (sekali): L1–L5, S1 (hapus + urungkan), P4, P8, P13 (back/forward), H4 (`beforeunload` di wizard),
   halaman `#/privasi`. Laporkan apa yang terlihat, bukan klaim.
5. Tandai ID yang tercakup di `uji-muat-ulang-hitung.md` → commit.

## Selesai bila

- Tes baru & lama hijau, tipe bersih, tidak ada kunci diksi yatim.
- Preview: soal setengah diisi → refresh (dan tutup tab lalu buka dari Riwayat) → hero, kode, isian, jangkar sama;
  jawab benar → refresh → pembahasan terbuka, progres tidak dobel; susunan cepat → refresh → tetap Hasil;
  "Hapus kasus ini" → kasus hilang dari Riwayat & tautan bagikan mati, Urungkan mengembalikan.
- Tidak ada "Jangan simpan" tersisa di UI/kode/diksi.
- Kebijakan privasi v2 tampil dan dialog persetujuan muncul ulang untuk akun yang menyetujui v1.
- Tidak ada file KHI milik sesi lain yang ikut ter-commit.

## Agenda sesudahnya (bukan bagian rencana ini)

Audit keamanan tautan bagikan `#/k/<slug>`: aturan akses (RLS) tabel `kasus_dibagikan` di Supabase, dan apakah
hasil `perlu_masuk` / `tidak_boleh` / `tidak_ada` dari `RepositoriBagikan.baca` membocorkan bahwa sebuah slug ada
(enumerasi slug). Keputusan pemilik 2026-11-23: dikerjakan setelah rencana ini selesai.
