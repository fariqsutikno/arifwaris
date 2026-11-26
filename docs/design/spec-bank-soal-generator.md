# Spec: bank soal hitung hasil generator (2026-11-25)

Status: disetujui pemilik 2026-11-26 (usulan di bagian 9 dipakai sampai diputuskan lain). Melengkapi riset `riset-ux-kelas-lms-skala-soal-monetisasi-2026-11-20.md`
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

### Catatan implementasi G1 (2026-11-26)

- Letak: `packages/latihan/src/bank/` (`kodeSoal.ts`, `labelSoal.ts`, `tingkatModul.ts`, `soalDariKode.ts`), diekspor dari `index.ts`; uji `src/__tests__/bank.test.ts`.
  `soal.ts`: `bacaIdSoal` mengenali bentuk ketiga `{ jenis: 'generator', kode }` (dicek lebih dulu karena kode G lolos pola slug kurasi);
  `muatSoal` mengembalikan `TIDAK_DIDUKUNG` untuk kode generator sampai G5 (layar memuatnya lewat `soalDariKode`).
- Muatan `G1-B`: 80 bit = pewaris (1 bit, P=1) + 25 kunci × 3 bit jumlah (0–7) + 4 bit penutup nol, ditulis 16 huruf Crockford.
  Urutan 25 kunci = konstanta `URUTAN_KUNCI` (hanya boleh ditambah di akhir; kasus 1 bab 16 = `G1-B-2000000002000040` dibekukan di uji).
  Kode yang bit penutupnya tidak nol ditolak, jadi satu kasus tepat satu kode. Keluarga lain (G3) cukup huruf baru; muatan `B` tidak berubah.
  Jumlah di atas batas checklist (istri > 4, pasangan/ayah/ibu/kakek/nenek > 1), pasangan salah jenis kelamin, kasus kosong, dan
  mu'tiq/mu'tiqah (belum bisa dibangun dari checklist) = `KASUS_TIDAK_SAH`. Harta soal bank = `HARTA_SOAL_BANK` (120 juta, satu nilai).
- Token yang **tidak bisa diturunkan dari jejak**: `bernama:minbariyyah` (jejak hanya menandai umariyyatain, musyarrakah, akdariyyah, muaddah;
  minbariyyah 24>27 hanya terlihat sebagai `aul:24>27`). Tidak dipancarkan sampai engine menambahkan penandanya.
  Sisa pasangan yang keluar ke dzawil arham/baitul mal (`SISA_KELUAR`) juga belum punya token.
- Turunan jejak: `inkisar:<n>` = jumlah langkah inkisar yang tidak `habis`; `kakekSaudara` dari `FARDH` alasan JADD_*, `ASHABAH.pilihanJadd`,
  atau `KASUS_KHUSUS` muaddah/akdariyyah; `jumlahAhliWaris` = orang bukan `bukanAhliWaris` di `statusOrang` (yang gugur ikut terhitung).
- Tingkat (`ATURAN_TINGKAT`): sulit = `aul` + `tashih`; menengah = salah satu `aul`/`radd`/`tashih`/`kakekSaudara`/ashabah bil ghair/ma'al ghair/`bernama:*`;
  selebihnya dasar. Bil ghair/ma'al ghair dimasukkan menengah atas keputusan implementasi (spec hanya menyebut "fardh+ashabah" sebagai dasar). Mudah disetel.
- Modul (`ATURAN_MODUL`, 15 modul `docs/materi-kit/kerangka-kurikulum.md`): hajb → 5, ashabah bil/ma'al ghair → 4, aul/radd → 6, tashih → 7,
  umariyyatain/musyarrakah → 9, kakekSaudara/muaddah/akdariyyah → 10; tanpa kaidah lanjutan → [3, 4].
- Uji: 38 kasus satu mayit (bab 16 + padanan 'aul bab 9 + pembanding) dengan label tulisan tangan; property bolak-balik dan tabrakan.

### Catatan implementasi G2 (2026-11-26)

- Letak: `packages/latihan/src/bank/penyapu.ts` (`sapuKasusBiasa`), `bangunBank.ts` (`saringKandidat`, `labelUtama`, `terapkanKuota`, `hashKode`), CLI `scripts/bank-bangun.ts`
  (`pnpm bank:bangun --kering [--batas n] [--target n]`, menulis `.bank/indeks-biasa.jsonl`, folder di-gitignore). Uji: `src/__tests__/penyapu.test.ts`.
- Batas sapuan (konstanta di `penyapu.ts`): jumlah kunci hadir <= `BATAS_KUNCI_HADIR` = 5; jumlah orang per kunci berbilang 1..`BATAS_JUMLAH_BERBILANG` = 3
  (istri 4, kunci bermaksimal 1 memakai maksimalnya); mu'tiq/mu'tiqah tidak disapu (belum bisa dibangun dari checklist). Ruang: 5.718.421 kandidat
  (K=4: 676 ribu; K=6: 46,8 juta). Penyapu tidak memangkas kerabat "pasti gugur"; hanya `periksaKasusBiasa`.
  Urutan sapuan: jumlah kunci naik, tiap jumlah pewaris L lalu P, sehingga `--batas` kecil sudah memuat kedua pewaris (tapi hanya kombinasi kunci sedikit).
- Kesetaraan (§2.3): kasus ternormalkan sama = kode sama; penyapu membangkitkan tiap kasus tepat sekali. Jumlah orang berbeda tidak digabung walau bagian hasilnya serupa (susunan yang gugur berbeda = soal hajb berbeda).
- Label utama (satu per soal, untuk kuota), prioritas: `bernama:*` > `aul:<a>><b>` > `inkisar:<n>` > `tashih` > `radd` > `kakekSaudara` > `ashabahBilGhair` > `ashabahMaalGhair` > `hajb:<KUNCI>` > `dasar`.
- Kuota: target total `TARGET_TOTAL_SOAL` = 1.000.000, porsi `PORSI_TINGKAT` 40/40/20. Per tingkat dibagi rata ke label utama dengan water-filling (jatah label kecil yang tak terpakai pindah ke label besar);
  dalam kelompok diambil N kode ber-hash FNV-1a terkecil (tersebar, deterministik). Stok tingkat kurang dari target = diambil semua, tidak ditambal dari tingkat lain.
- Angka nyata (mesin dev, 1 thread): engine + kode ~0,3 ms/kandidat (naik ke ~0,5-0,7 ms pada kasus besar). Sapuan penuh 5,7 juta tidak diselesaikan di sini (3,5 juta kandidat = 1792 dtk, lalu proses terhenti); perkiraan 45-70 menit.
  Sapuan `--batas 1500000` (kombinasi sampai sekitar 4 kunci, 502 dtk): lolos engine 1.493.268, dibuang 6.732 (semua `TIDAK_DIDUKUNG`); lolos per tingkat dasar 317.797 / menengah 1.133.343 / sulit 42.128;
  setelah kuota (target 1 juta) 759.925 = dasar 317.797 + menengah 400.000 + sulit 42.128. Jadi pada ruang ini porsi 40/40/20 belum tercapai: dasar dan sulit kekurangan stok, menengah (didominasi `inkisar:1/2`) berlebih.
  Mengejar porsi butuh ruang lebih besar (K=5, ikut menyumbang `aul`+`tashih`) atau keluarga G3, atau target/porsi disesuaikan (keputusan pemilik, §9).

## 9. Keputusan terbuka

1. Target jumlah awal (usulan 1 juta) dan kuota per tingkat (usulan dasar 40%, menengah 40%, sulit 20%).
2. Madzhab selain [SYF]: ikut dibangkitkan sebagai varian (label `madzhab:hnb` dst.) atau nanti saja (usulan: nanti).
