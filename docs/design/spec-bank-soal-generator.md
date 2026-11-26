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
- Tingkat (`ATURAN_TINGKAT`, diganti 2026-11-26 atas keputusan pemilik; lihat catatan G2 lanjutan): sulit = dua kaidah hisab lanjutan (`aul`/`radd`/`tashih`) sekaligus, atau `inkisar:3`+, atau `bernama:*`; menengah = salah satu `aul`/`radd`/`kakekSaudara`/ashabah bil ghair/ma'al ghair, atau `inkisar:2`+; selebihnya dasar (termasuk tashih 1 kelompok). Mudah disetel.
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

### Catatan G2 lanjutan (2026-11-26): aturan tingkat baru, pembangun mengalir, sapuan penuh

- Aturan tingkat (keputusan pemilik): lihat butir Tingkat di atas; token nyata: `tashih`, `aul`, `radd`, `inkisar:<n>` (n = kelompok inkisar yang tidak habis), `bernama:*`.
  Kasus bernama kini selalu sulit (sebelumnya menengah); tashih 1 kelompok kini dasar.
- Pembangun mengalir `bangunBank` (`bangunBank.ts`): pass 1 menjalankan engine sekali per kandidat dan hanya mencatat hash kode, nomor profil label, nomor sapuan (12 byte/lolos, larik padat);
  kuota dari ukuran kelompok (water-filling `bagiJatah`, dipakai bersama `terapkanKuota` versi memori); pass 2 mengulang sapuan tanpa engine untuk mengambil kode terpilih.
  Hasil sama dengan `saringKandidat` + `terapkanKuota` (diuji pada `--batas` 3000, target 400 dan 100.000), kecuali dua kode berhash sama tepat di batas kuota: yang lebih awal disapu menang.
  CLI mencetak progres tiap 100 ribu kandidat dan menulis JSONL bertahap.
- Sapuan penuh nyata (`pnpm bank:bangun --kering`, 1 thread, 38 menit 15 dtk, puncak RSS 850 MB): kandidat 5.718.421; lolos engine 5.681.071; dibuang 37.350 (semua `TIDAK_DIDUKUNG`).
  Lolos per tingkat: dasar 3.403.659 / menengah 2.082.237 / sulit 195.175. Setelah kuota (target 1 juta): 995.175 = dasar 400.000 + menengah 400.000 + sulit 195.175.
  Jadi porsi 40/40/20 hampir tercapai; satu-satunya kekurangan: stok sulit 195.175 < 200.000 (selisih 4.825 tidak ditambal dari tingkat lain).
  Modul setelah kuota: 5 = 937.082, 7 = 354.649, 4 = 328.012, 6 = 135.793, 10 = 108.993, 3 = 5.960, 9 = 2.855.
  Stok terbesar per label utama: `dasar/inkisar:1` 1.529.864, `menengah/inkisar:2` 883.716, `menengah/inkisar:1` 614.078, `menengah/ashabahBilGhair` 405.950; label sulit kecil
  (`sulit/inkisar:3` 48.277, `sulit/bernama:muaddah` 48.258, `sulit/aul:12>13` 29.159, `sulit/aul:6>7` 26.188) diambil semua.

### Catatan implementasi G3 (2026-11-27): keluarga lanjutan

- Letak (`packages/latihan/src/bank/`): `kodeBiasa.ts` (isi lama `kodeSoal.ts`, tata letak bit `G1-B` tidak berubah), `kodeSoal.ts` (pintu `buatKodeSoal`/`uraiKodeSoal` semua keluarga),
  `kodeLanjutan.ts` + `bitMuatan.ts` (muatan lanjutan), `bangunKasus.ts` (struktur → `Kasus`), `penyapuLanjutan.ts`, label di `labelSoal.ts`, tingkat/modul di `tingkatModul.ts`, kuota di `bangunBank.ts`
  (`bangunBankDariKode`, `saringKode`). CLI: `pnpm bank:bangun --kering [--keluarga biasa|munasakhat|gharqa|mafqud|khuntsa|haml|dzawilArham|semua] [--batas n] [--target n]`,
  indeks per keluarga `.bank/indeks-<keluarga>.jsonl`. Uji: `__tests__/bankLanjutan.test.ts`.
- Kode: `G1-<huruf>-<muatan>`, huruf `M` munasakhat, `G` gharqa, `Q` mafqud, `K` khuntsa, `H` haml, `D` dzawilArham. Muatan = daftar (nilai, lebar bit) base32 Crockford; bit sisa dan slot tak terpakai wajib nol,
  jadi satu kasus tepat satu kode (diuji). Urutan `URUTAN_KERABAT_JAUH` (keluarga D) hanya boleh ditambah di akhir, seperti `URUTAN_KUNCI`.
  - **M/G (berantai)**: kasus biasa mayit pertama (76 bit, sama dengan `B`) + 1-3 mayit tambahan (gharqa 1-2): tiap mayit = salah satu ahli waris mayit pertama (kunci + urutan dalam kunci, orang sekunci diambil berurutan)
    + ahli waris tambahan sendiri (pasangan 0/1, anak lk 0-3, anak pr 0-3, lewat pembangun checklist yang sama). Munasakhat: mayit tambahan masuk `urutanWafat` (total 2-4 mayit). Gharqa: mayit tambahan berstatus
    `wafat` dalam `gharqa.anggota` bersama pewaris, harta tiap anggota = `HARTA_SOAL_BANK`, keadaan 2 bit (`serentak`, `terlupakan`, `berurutanTakDiketahui`, `tidakDiketahui`).
  - **Q/K/H**: kasus biasa + satu ahli waris berstatus `mafqud` / `khuntsa: diharapkanJelas` / `dalamKandungan`. Khuntsa dan janin hanya di kelompok keturunan/saudara (janin tak mungkin ayah mayit; ibunya harus hidup).
  - **D**: pewaris + pasangan 0/1 + 18 jenis kerabat jauh (cucu/keponakan dari jalur perempuan, anak saudari, bint akh, khal, khalah, 'ammah, paman seibu, jadd rahim, bint 'amm) masing-masing 0-2 orang,
    dibangun dengan `tambahSaudara`/`pastikanOrangTua`/`tambahOrangBaru` yang ada; tidak ada kunci baru di engine. Hanya yang dinilai engine sebagai dzawil arham (`jenisSoalDari`) yang lolos.
- Lolos = engine memberi hasil yang memang dituntut keluarganya: munasakhat `OK` tanpa `MUNASAKHAT_DILEWATI` (mayit yang tak dapat bagian dilewati [R12-1], jadi tak sebanyak yang tertulis di kode); gharqa `OK` atau `MAUQUF`
  (`terlupakan` [SYF] = ditahan, label `ditahan`); mafqud/khuntsa/haml hasil taqdir `OK` dengan jenis cocok; dzawilArham `OK` dengan `tanzil`. Alasan dibuang dipisah: `TIDAK_DIDUKUNG`, `PERLU_INPUT`, `GALAT_ENGINE`,
  `BUKAN_KELUARGA_INI`, `MAYIT_DILEWATI` (plus `KASUS_TIDAK_SAH` dari kode). Madzhab selalu [SYF] bawaan; haml memakai 4 taqdir [SYF] (diuji: daftar dunia <= 4, mitra ashabah janin = 0 [R13-15], tak ada model 6 taqdir).
- Label dari jejak/hasil engine: `munasakhat`, `munasakhat:<n>` (= jumlah langkah di `daftarLangkah`), `keadaan:<1|2|3>` dan `ikhtishar` (dari `hasil.keadaan`/`hasil.ikhtishar`), kaidah tiap mas'alah (aul, radd, tashih, hajb:*, bernama:*; hitungan per mas'alah
  `inkisar:*`/`jumlahAhliWaris:*` tidak digabung); `gharqa`, `gharqa:<keadaan>` (masukan kasus), `mayit:<n>`, `ditahan`; `mafqud|khuntsa|haml`, `dunia:<n>`, `sasaran:<KUNCI>` (peran yang ditetapkan engine; haml tidak punya
  karena node janin tak punya peran di statusOrang), `mauquf`, `kelasD`; `dzawilArham`, `tanzil:<KUNCI>`, `dzawilArham:pasangan|duaJalur|samaRata`. Keadaan munasakhat 1/2/3 dan ikhtishar dipakai karena engine membedakannya.
- Tingkat: munasakhat 2 mayit menengah (kecuali dua kaidah hisab = sulit), 3 mayit atau lebih sulit; gharqa, mafqud, khuntsa, haml, dzawilArham selalu sulit. Modul keluarga lanjutan hanya satu (tidak ikut modul kaidah di dalamnya,
  supaya munasakhat berhajb tidak muncul di modul hajb): munasakhat 11, dzawilArham 12, haml 13, mafqud/khuntsa/gharqa 14.
- Batas sapuan (`SAPUAN_LANJUTAN`): dasar = sapuan biasa dengan ruang kecil (kunci hadir dan jumlah per kunci, istri ikut dibatasi), lalu pengacak deterministik per nomor kandidat (`pembagi`) sebelum graf dibangun dan engine dijalankan.
  Munasakhat 2/3/4 mayit: dasar (<=3 kunci, <=2 orang), (<=2 kunci, <=2 orang), (3 kunci masing-masing 1 orang), pembagi 4/4/100, anak tambahan <= 2/1/1; gharqa 2/3 anggota: pembagi 80; mafqud dan khuntsa: dasar <= 4 kunci,
  pembagi 8; haml: dasar <= 4 kunci, tanpa pembagi (sebagian besar gugur sebelum engine karena ibu janin harus hidup); dzawilArham: <= 4 jenis kerabat, tanpa pembagi.
- Kuota (`KUOTA_KELUARGA_LANJUTAN`, di luar target 1 juta keluarga biasa): munasakhat 60.000, gharqa 30.000, mafqud 30.000, khuntsa 20.000, haml 15.000, dzawilArham 30.000 (total 185.000). Alasan: tiap keluarga paling banyak 6% dari 1 juta supaya
  tidak ada yang mendominasi, munasakhat terbesar karena ruangnya paling luas dan punya tiga jumlah mayit; di dalam keluarga jatah dibagi rata ke label utama dengan water-filling yang sama (label utama lanjutan = ciri jejak, mis.
  `munasakhat:3/keadaan:2/tashih`, `mafqud/sasaran:AYAH/dunia:2/mauquf`). Stok haml (16.032) hanya sedikit di atas kuotanya; stok lain jauh di atas.
- Angka nyata, tiap keluarga disapu sendiri (`--keluarga <nama>`, 1 thread, mesin dev; waktu = dua pass sapuan + engine):

  | Keluarga | Kandidat | Lolos engine | Dibuang | Setelah kuota | Waktu | Puncak RSS |
  |---|---|---|---|---|---|---|
  | munasakhat | 385.776 | 223.501 | TIDAK_DIDUKUNG 8.698; MAYIT_DILEWATI 153.577 | 60.000 | 281,8 dtk | 355 MB |
  | gharqa | 59.152 | 58.236 | TIDAK_DIDUKUNG 916 | 30.000 | 54,3 dtk | 314 MB |
  | mafqud | 74.082 | 73.690 | TIDAK_DIDUKUNG 392 | 30.000 | 55,9 dtk | 310 MB |
  | khuntsa | 60.819 | 60.449 | TIDAK_DIDUKUNG 370 | 20.000 | 52,5 dtk | 297 MB |
  | haml | 17.598 | 16.032 | TIDAK_DIDUKUNG 1.566 | 15.000 | 157,6 dtk | 310 MB |
  | dzawilArham | 200.468 | 200.468 | (tidak ada) | 30.000 | 106,8 dtk | 291 MB |

  Alasan TIDAK_DIDUKUNG yang teramati pada sampel: munasakhat "tidak ada ahli waris; harta ke baitul mal" dan "kakek bersama saudari ashabah ma'al ghair belum dirinci KB bab 08"; haml "berbagi fardh sekelompok dengan janin belum diatur KB [SYF]"
  (R13-4, R13-15). Tidak satu pun `PERLU_INPUT` atau galat engine pada sapuan akhir (sebelum perbaikan janin sebagai orang tua, haml sempat 2.676 `PERLU_INPUT`: graf salah, bukan batas engine).
  Munasakhat setelah kuota: 2 mayit 32.038, 3 mayit 14.732, 4 mayit 13.230; keadaan 3 = 39.978, keadaan 1 = 10.138, keadaan 2 = 9.884; ikhtishar 7.672; menengah 28.457, sulit 31.543.
  Kuota tingkat sulit (bank penuh): sulit keluarga biasa 195.175 + lanjutan 156.543 = 351.718, jadi kekurangan 4.825 dari G2 terisi; bank penuh = 995.175 + 185.000 = 1.180.175 baris
  (dasar 400.000, menengah 428.457, sulit 351.718). Angka ini diukur pada sapuan penuh `pnpm bank:bangun --kering` (semua keluarga, satu proses): kandidat 6.516.316; lolos engine 6.313.447 (biasa 5.681.071, tidak berubah dari G2);
  dibuang TIDAK_DIDUKUNG 49.292 dan MAYIT_DILEWATI 153.577; setelah kuota 1.180.175 (biasa 995.175 + lanjutan 185.000); waktu 2.833 dtk (47 menit), puncak RSS 856 MB; modul 14 = 80.000, 11 = 60.000, 12 = 30.000, 13 = 15.000.
- Yang belum atau tidak bisa:
  - Dua orang belum pasti sekaligus (mafqud/khuntsa/haml ganda): tidak dibangun; satu orang saja. Kombinatorik taqdir punya batas keras (`BATAS_DUNIA`) dan hasilnya `PERLU_INPUT`, jadi tidak dipaksakan.
  - Pilihan "tunggu kelahiran" (`pilihanJanin`, hasil `menunggu`) untuk haml tidak dikodekan: satu soal haml = satu hasil taqdir.
  - Mayit tambahan selalu ahli waris langsung mayit pertama dan ahli waris tambahannya tidak ikut wafat (munasakhat bertingkat tiga generasi, kelompok gharqa di tengah rantai munasakhat, dan anggota gharqa yang tak sekerabat belum ada).
  - Haml hanya sebagai anak atau saudara (kandung/seibu) dari ibu yang hidup; haml dari ibu penghubung (sudah wafat) tidak sah. Label haml hanya 3 kelompok kuota (tanpa mauquf, mauquf, mauquf + kelasD) karena engine tidak memberi peran bagi node janin.
  - Madzhab selain [SYF] dan mu'tiq/mu'tiqah tidak disapu. `bernama:minbariyyah` masih belum bisa diturunkan dari jejak (catatan G1).

## 9. Keputusan terbuka

1. Target jumlah awal (usulan 1 juta) dan kuota per tingkat (usulan dasar 40%, menengah 40%, sulit 20%).
2. Madzhab selain [SYF]: ikut dibangkitkan sebagai varian (label `madzhab:hnb` dst.) atau nanti saja (usulan: nanti).
