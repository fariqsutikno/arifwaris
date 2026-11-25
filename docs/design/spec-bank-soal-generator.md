# Spec: bank soal hitung hasil generator (2026-11-25)

Status: draf, menunggu persetujuan pemilik. Melengkapi riset `riset-ux-kelas-lms-skala-soal-monetisasi-2026-11-20.md`
bagian 5 (pola deterministik), dengan keputusan pemilik 2026-11-25 di bawah.

## 1. Maksud

Bank berisi **jutaan soal hitung** yang masing-masing punya **kode**. Kelas (LMS), Latihan, dan materi cukup bertanya
"soal tipe seperti apa" (label, tingkat, modul), lalu mengambil acak N kode dari hasilnya. Tim tidak menulis soal
satu per satu; kunci jawaban selalu dari engine.

Keputusan pemilik (2026-11-25):
- Harta **tidak** divariasikan (satu nilai tetap; soal menguji pembagian, bukan aritmetika rupiah).
- Cakupan: kasus satu mayit **dan** kasus lanjutan: munasakhat dengan **2–4 mayit bertumpuk**, gharqa, mafqud, khuntsa,
  haml, dzawil arham, dan keadaan lain yang didukung engine.
- **Hanya soal hitung** dulu. Pilihan ganda menyusul, ditulis Codex lewat paket instruksi seperti materi
  (`docs/soal-kit/`, dibuat terpisah).

Bukan tujuan: editor pola di portal, soal nominal rupiah bervariasi, pilihan ganda otomatis.

## 2. Cara kerja

```
penyapu (skrip)  →  kandidat kasus  →  engine  →  saring  →  label  →  kode  →  indeks bank
```

1. **Penyapu** menyusun kombinasi secara deterministik per **keluarga kasus**:

   | Keluarga | Yang disapu |
   |---|---|
   | `biasa` | jenis kelamin pewaris × himpunan ahli waris dari 25 kunci × jumlah orang (1–4 untuk yang boleh berbilang) |
   | `munasakhat` | kasus biasa sebagai mayit pertama, lalu 1–3 ahli waris ikut wafat berurutan (total 2–4 mayit), masing-masing dengan ahli waris tambahan sendiri |
   | `gharqa` | 2–3 orang wafat bersamaan, keadaan gharqa yang didukung engine, harta tiap mayit tetap |
   | `mafqud`, `khuntsa`, `haml` | kasus biasa dengan satu (atau dua) orang berstatus belum pasti |
   | `dzawilArham` | susunan tanpa ashabul furudh/ashabah yang menghabiskan harta, dengan kerabat dzawil arham |

   Ruang munasakhat dan lanjutan meledak secara kombinatorik, jadi penyapu memakai **batas per keluarga** dan
   **kuota per label** (bagian 4) supaya bank seimbang, bukan didominasi kasus biasa yang mirip.
2. **Engine** menghitung tiap kandidat (madzhab default [SYF]). Yang lolos hanya status OK atau yang memang dibagi
   sebagian dengan bagian ditahan (haml, mafqud) bila keluarga itu memang tentang menahan bagian. `TIDAK_DIDUKUNG`,
   `PERLU_INPUT`, dan titik blocked (CLAUDE.md) dibuang, tidak dikarang.
3. **Saring kesetaraan**: dua kandidat yang hasilnya identik setelah urutan ahli waris dinormalkan dianggap satu soal.
4. **Label otomatis** dari jejak engine (data, bukan teks): siapa gugur dan oleh siapa, 'aul (ashl asal → akhir), radd,
   tashih (inkisar berapa kelompok), kasus bernama (umariyyatain, musyarrakah, akdariyyah, mu'addah, minbariyyah...),
   kakek bersama saudara, ashabah bil ghair/ma'al ghair, jumlah ahli waris, jumlah mayit, jenis ketidakpastian.
5. **Tingkat** (dasar/menengah/sulit) dan **modul** dihitung dari label lewat satu tabel aturan (bagian 4), bukan ditebak.
6. **Kode** dibentuk dari isi kasus (bagian 3), lalu dicatat di **indeks bank** bersama labelnya.

## 3. Kode soal

- Bentuk: `G<versiGenerator>-<keluarga>-<muatan>`, contoh `G1-B-3KQ9X2...`. `muatan` = susunan kasus yang dinormalkan
  (pewaris, ahli waris per kunci & jumlah, urutan wafat dan ahli waris tiap mayit, status belum pasti), dikemas
  biner lalu base32 tanpa huruf mirip.
- Kode **bisa diurai balik** menjadi kasus tanpa basis data (`uraiKodeSoal`), jadi soal yang sama selalu dihasilkan
  ulang identik di klien maupun server. Kunci jawaban tidak masuk kode; dihitung engine saat dibutuhkan.
- `versiGenerator` naik bila aturan normalisasi berubah; kode lama tetap bisa diurai versi lamanya (kejadian
  percobaan lama tetap merujuk soal yang benar).
- Kode generator hidup berdampingan dengan kode soal kurasi (`H-01`...) dan alamat pola (`pola@versi#benih`) yang
  sudah ada di `packages/latihan/src/soal.ts`; pembaca kode mengenali ketiganya.

## 4. Label, tingkat, kuota

- Label adalah daftar token tetap (mis. `aul`, `aul:6>10`, `radd`, `tashih`, `inkisar:2`, `hajb:SAUDARA_SEIBU`,
  `bernama:akdariyyah`, `kakekSaudara`, `munasakhat:3`, `gharqa`, `haml`, `mafqud`, `khuntsa`, `dzawilArham`).
  Daftar token dan arti bahasa biasanya di satu berkas (dipakai filter UI; portal tidak menampilkan token mentah).
- **Tabel tingkat**: dasar = satu kaidah (mis. hanya hajb atau hanya fardh+ashabah), menengah = dua atau lebih kaidah
  hisab ('aul/radd/tashih) atau kasus bernama, sulit = munasakhat ≥ 3 mayit, gharqa, ketidakpastian, dzawil arham, atau
  tashih + 'aul sekaligus. Tabel ini satu konstanta yang mudah disetel tim.
- **Tabel modul**: label → modul kurikulum (mis. `aul` → 6, `tashih` → 7, `munasakhat` → 11, `haml` → 13).
- **Kuota**: tiap kombinasi (keluarga, tingkat, label utama) dibatasi jumlahnya supaya pencarian acak menghasilkan
  soal yang beragam. Angka kuota = konstanta; target total awal sekitar 1 juta soal, bisa dinaikkan.

## 5. Indeks bank dan pencarian

- Tabel `bank_soal` (Supabase): `kode` (kunci), `versi_generator`, `keluarga`, `tingkat`, `modul`, `label text[]`,
  `jumlah_mayit`, `jumlah_ahli_waris`. Indeks GIN pada `label`. Tidak menyimpan kasus atau kunci jawaban (bisa diurai
  dari kode). Diisi skrip `pnpm bank:bangun` (bertahap/berkelompok, bisa dilanjutkan bila terputus), lewat peran impor
  seperti `scripts/pulihkan`. RLS: baca untuk semua, tulis hanya peran impor.
- Fungsi `cariSoal({ tingkat?, modul?, label?: { semua?, salahSatu?, tanpa? }, keluarga?, jumlah, benih })` → daftar kode
  acak namun deterministik terhadap `benih` (supaya kelas bisa memberi soal sama atau berbeda per pelajar, riset 2a).
  Satu fungsi dipakai kelas, Latihan, dan materi.
- Klien yang luring tetap bisa memakai soal kurasi di snapshot; bank hanya untuk mode daring.

## 6. Menampilkan soal

- Kode → kasus (`uraiKodeSoal`) → layar soal hitung yang sudah ada. Kasus satu mayit memakai bentuk lama; kasus lanjutan
  memakai bentuk berkas (`KasusSoal` `bentuk: 'berkas'`). Perlu dicek bahwa layar soal hitung sudah mendukung soal berkas
  sampai penilaian (spec siklus kasus dan soal); bila belum, itu bagian dari pekerjaan ini.
- Judul soal dibuat otomatis dari kasus (`namaKasus` yang sudah ada), bukan AI.

## 7. Uji

- Bolak-balik: `uraiKodeSoal(buatKodeSoal(kasus)) = kasus` (property test, termasuk munasakhat 4 mayit).
- Setiap soal di sampel acak dari bank: engine OK, label konsisten dengan jejak, invarian engine (Σ saham = tashih, dst.).
- Determinisme: penyapu dua kali menghasilkan daftar kode yang sama; `cariSoal` dengan benih sama → kode sama.
- Tidak ada soal dari titik blocked atau `TIDAK_DIDUKUNG`.

## 8. Tahapan

| Fase | Isi | Selesai bila |
|---|---|---|
| G1 | Kode soal (buat/urai) + label dari jejak + tabel tingkat & modul, untuk keluarga `biasa` | property test bolak-balik lulus; label 50 kasus uji bab 16 cocok |
| G2 | Penyapu `biasa` + kuota + `pnpm bank:bangun --kering` (cetak statistik per tingkat/label) | statistik masuk akal; tanpa duplikat |
| G3 | Keluarga lanjutan: munasakhat 2–4 mayit, gharqa, mafqud, khuntsa, haml, dzawil arham | tiap keluarga punya sampel teruji engine |
| G4 | Tabel `bank_soal` + migrasi + RLS + `bank:bangun` sungguhan + `cariSoal` | pencarian per label mengembalikan kode acak deterministik |
| G5 | Layar soal dari kode bank (termasuk soal berkas) + pemakaian di Latihan | soal bank bisa dikerjakan dan dinilai |
| G6 | `docs/soal-kit/` untuk Codex: pilihan ganda | (terpisah, setelah G5) |

## 9. Keputusan terbuka

1. Target jumlah awal (usulan 1 juta) dan kuota per tingkat (usulan dasar 40%, menengah 40%, sulit 20%).
2. Madzhab selain [SYF]: ikut dibangkitkan sebagai varian (label `madzhab:hnb` dst.) atau nanti saja (usulan: nanti).
