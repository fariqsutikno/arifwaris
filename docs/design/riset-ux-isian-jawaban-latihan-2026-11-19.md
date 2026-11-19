# Riset UX: isian jawaban soal latihan (2026-11-19)

Pertanyaan pemilik: orang menulis jawaban dengan bentuk yang berbeda-beda. Pecahan ditulis `1/2`, `1:2`, `½`; ashabah ditulis
"asobah", "عصبة", atau "sisa"; yang terhalang ditulis "mahjub" atau `0`. Bagaimana supaya seragam? Yang diisi itu pecahan
sederhana, saham dari ashl terakhir, atau apa? Perlukah pilihan mode?

Dasar bukti: `apps/web/src/hasil/KartuTebak.tsx`, `hasil/tebak.ts`, `terjemah.ts` (`angkaLatin`), `packages/content/src/soal.ts`,
KB bab 00, 05, 06, 07, 09, 10, 15. **Tidak ada data pengguna nyata**; yang bertanda "asumsi" belum diuji.

## 1. Yang ada sekarang

- Satu kotak teks per orang (termasuk yang terhalang). Yang ditanyakan: **bagian akhir dari seluruh harta**, sesudah 'aul/radd.
- Pembaca: `bacaPecahan` hanya menerima `a/b` atau bilangan bulat. Angka Arab-Hindi diubah ke Latin (`angkaLatin`).
- Penilaian: senilai diterima (`3/24` = `1/8`), dengan perkalian silang bigint.
- Contoh di petunjuk: `1/8` atau `3/24`, terhalang diisi `0`.

## 2. Audit

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| J1 | **Kritis** | **Di iPhone, garis miring tidak bisa diketik.** Kotak memakai `inputMode="numeric"`, dan sejak iOS 13 itu memunculkan papan angka tanpa tanda baca. Pengguna iPhone tidak bisa menulis `1/8` sama sekali; satu-satunya yang bisa diketik adalah `0` dan `1` | `KartuTebak.tsx` `inputMode="numeric"`; [catskull: iOS inputmode](https://catskull.net/ios-inputmode.html), [WHATWG #3478](https://github.com/whatwg/html/issues/3478) |
| J2 | Tinggi | **Isian tak terbaca dianggap kosong.** "ashabah", `1:2`, `½`, `0,5` → `bacaPecahan` = null → pesan "Masih ada yang kosong" padahal kotaknya berisi. Pengguna diberi tahu hal yang salah dan tidak tahu bentuk mana yang diterima | `nilaiTebakan` → `idKosong` |
| J3 | Tinggi | **Satu kotak dipakai untuk dua jenis jawaban.** Pelajar berpikir dalam **status** (fardh 1/8, ashabah, terhalang), padahal kotak meminta **angka akhir**. "Ashabah" bukan jawaban akhir yang salah, hanya jawaban untuk pertanyaan lain: anak laki-laki ashabah tetap menerima 14/24. Akar keragaman tulisan ada di sini, bukan di ejaan | KB 15 baris Ta'shib; kasus 16.1 |
| J4 | Tinggi | **Tidak mengajarkan langkahnya.** Hanya angka akhir yang dinilai. Jawaban salah tidak memberi tahu kesalahannya ada di mana: hajb, fardh, ashl, 'aul, atau tashih. Padahal pipeline (bab 00.2) dan tabel faraidh di aplikasi sudah memisahkan langkah-langkah itu | `nilaiTebakan`: benar/salah per orang saja |
| J5 | Sedang | **Bentuk jawaban tidak sama dengan cara belajar di kitab/pesantren.** Di sana pelajar mengisi tabel: ashl di kepala kolom, saham bulat per orang. Aplikasi meminta pecahan dari harta, bentuk yang tidak dipakai di tabel | KB 09–10, glosarium "Saham" |
| J6 | Sedang | Petunjuk menyebut "sesudah 'aul atau radd". Kalimat ini membocorkan bahwa soal mungkin punya 'aul/radd, dan bagi pemula kata itu belum dikenal | `hitung.sesudah_aul_atau_radd_bila_ada` |
| J7 | Rendah | Format lain yang wajar ditolak tanpa alasan: `1:8`, `½`, `1 / 8` dengan garis miring Unicode (`⁄`, `∕`), `0,125`, `12,5%`. Angka Persia/Arab sudah diterima, jadi aturannya tidak konsisten | `bacaPecahan` regex |

## 3. JTBD

| # | Saat… | Saya ingin… | Supaya… | Ukuran sukses |
|---|---|---|---|---|
| L-a | mengerjakan soal di HP | memasukkan jawaban tanpa bergulat dengan keyboard | fokus berpikir, bukan mengetik | tiap jawaban bisa dimasukkan di iPhone dan Android tanpa mengganti keyboard |
| L-b | jawaban saya dinilai | yakin aplikasi membaca maksud saya | penilaian adil | tidak ada jawaban yang "dibaca kosong"; yang dibaca aplikasi terlihat sebelum dinilai |
| L-c | jawaban saya salah | tahu salahnya di langkah mana | memperbaiki cara pikir, bukan menebak ulang | umpan balik menyebut langkah (siapa terhalang, fardh, ashl, 'aul/tashih) |
| L-d | sudah mahir / mengulang cepat | menjawab akhirnya saja | tidak bertele-tele | ada jalur jawaban akhir |
| L-e | belajar dari kitab/ustadz | menjawab dalam bentuk yang sama dengan di kelas | yang dilatih di aplikasi terpakai di ujian | bentuk tabel: ashl + saham bulat |

## 4. HMW

- **HMW-1** Bagaimana tiap jenis jawaban punya tempatnya sendiri, supaya tidak ada yang perlu "ditebak bentuknya"?
- **HMW-2** Bagaimana pelajar tahu persis apa yang dibaca aplikasi sebelum dinilai?
- **HMW-3** Bagaimana jawaban salah menunjuk langkah yang keliru?
- **HMW-4** Bagaimana pelajar yang mahir tetap bisa menjawab cepat?

## 5. Kandidat dan penilaian

Kriteria: **K1** bisa diketik di iPhone/Android, **K2** tidak ambigu, **K3** mengajarkan langkah, **K4** tidak membocorkan
jawaban, **K5** usaha (kecil = baik).

### 5a. Cara memasukkan

| Kandidat | K1 | K2 | K3 | K4 | K5 | Catatan |
|---|---|---|---|---|---|---|
| I1. Teks bebas + pembaca toleran (`1:2`, `½`, `0,5`, "asobah", "عصبة", "sisa", "mahjub" → bentuk baku) + gema "Terbaca: 1/8" di bawah kotak | ✓ bila keyboard teks | sebagian: daftar sinonim tak pernah lengkap; "sisa" bisa berarti ashabah atau radd | ✗ | ✓ | sedang | menambal gejala J2/J7, J3 tetap |
| I2. **Kotak pecahan bertumpuk** (pembilang di atas garis, penyebut di bawah), dua kotak angka | ✓ papan angka cukup, tidak perlu "/" | ✓ | ✗ sendirian | ✓ | kecil | menyelesaikan J1, J2, J7 sekaligus |
| I3. **Pilihan status tertutup** per orang: 1/2, 1/4, 1/8, 2/3, 1/3, 1/6, Ashabah, Terhalang (bisa pilih fardh + Ashabah, misalnya ayah bersama anak perempuan) | ✓ | ✓ | ✓ langkah hajb + fardh | sebagian: daftar fardh terlihat (mengenali, bukan mengingat). Bisa diterima karena daftar fardh memang hafalan wajib dan tetap enam | kecil | menyelesaikan J3 |
| I4. Saham sebagai **bilangan bulat** di bawah ashl (seperti tabel) | ✓ papan angka | ✓ | ✓ | ✓ | kecil | menyelesaikan J5; tanpa pecahan sama sekali |

### 5b. Apa yang ditanyakan

| Kandidat | Penilaian |
|---|---|
| M1. Pecahan akhir dari harta saja (sekarang) | cepat, tetapi J3, J4, J5 tetap |
| M2. **Langkah seperti tabel**: (1) status tiap orang [I3] → (2) asal masalah [I4] → (3) asal masalah akhir dan saham akhir tiap orang [I4] | mengikuti pipeline bab 00.2 dan tabel faraidh yang sudah ada di aplikasi; umpan balik per langkah (J4) |
| M3. Pelajar memilih antara M1 dan M2 | melayani L-d sekaligus L-c |

Menjawab pertanyaan pemilik **"yang diisi itu yang disederhanakan atau dari ashl terakhir?"**:
- Di **langkah** (M2): yang diisi **saham bulat dari asal masalah akhir** (sesudah 'aul/radd/tashih), sesuai definisi saham di
  glosarium. Asal masalah harus yang **terkecil** (definisi ashlul mas'alah di glosarium). Bila pelajar memakai kelipatannya
  (48 untuk 24) dengan perbandingan yang benar, jawabannya dinilai **"perbandingan benar, asal masalah belum yang terkecil"**,
  bukan salah total.
- Di **jawaban akhir** (M1): **pecahan apa pun yang senilai** diterima (`3/24` = `1/8`). Bentuk sederhana tidak diwajibkan,
  karena yang diuji besar bagian, bukan kemampuan menyederhanakan.
- Langkah (3) selalu menanyakan "asal masalah akhir", meski sama dengan asal masalah awal. Kalau baris itu hanya muncul saat
  ada tashih/'aul, ia membocorkan jawaban (K4).

### 5c. Pilihan

**M3 dengan M2 sebagai bawaan, I2 + I3 + I4 sebagai cara memasukkan. I1 tidak dipakai.**
- Langkah demi langkah (bawaan): status [I3] → asal masalah [I4] → asal masalah akhir + saham [I4].
- Jawaban akhir: kotak pecahan bertumpuk [I2] + tanda "Tidak dapat" per orang (mengisi 0/1).
- Pindah mode adalah sakelar sungguhan: langsung berlaku, bisa dibalik, isian tidak hilang, dan **tidak membuka jawaban**.
  Ini berbeda dari sakelar Belajar yang dihapus (bagian 10d riset hero), yang membuka jawaban dan butuh dialog.
- Karena tidak ada teks bebas, masalah ejaan ("asobah", "عصبة", "sisa", "mahjub", `1:2`, `½`) **hilang dari akarnya**, bukan
  ditambal dengan daftar sinonim.
- Sebelum dinilai, tiap baris sudah menampilkan dirinya dalam bentuk baku (pecahan bertumpuk, chip status). Tidak ada tahap "dibaca
  sebagai…" yang tersembunyi (HMW-2).

Kenapa I1 ditolak meski paling luwes: sinonim tidak pernah lengkap, "sisa" bermakna ganda (ashabah atau radd), dan J3 tetap
ada. Ia hanya memindahkan masalah dari "ditolak" ke "salah dibaca".

### 5d. Istilah di layar (glosarium bab 15)
- "Ashabah" dengan keterangan kecil "ambil sisa".
- "Terhalang" dengan istilah "hajb hirman" yang bisa diketuk. "Mahjub" tidak ada di glosarium, jadi tidak dipakai sebagai label.
- "Asal masalah" (ashlul mas'alah), "saham".

## 6. Batas dan pertanyaan terbuka
1. **Bab 07–08 di luar daftar status tetap.** 'Umariyyatain (ibu 1/3 sisa, R07-1), musyarrakah, dan kakek bersama saudara
   (muqasamah/1/3/1/6, bab 08) butuh chip tambahan ("1/3 sisa", "Muqasamah"). Usul: chip diturunkan dari bab soal, bukan
   ditampilkan semua. Sampai dirancang, soal bab itu memakai mode Jawaban akhir saja.
2. Munasakhat, dzawil arham, dan kasus khusus tidak masuk soal latihan langkah (orkestrator di atas pipeline).
3. XP: apakah mode Langkah memberi XP lebih? Belum diputuskan.
4. Radd ke salah satu pasangan dan langkah 'aul/radd sebagai pilihan tersendiri ("'Adilah / 'Aul / Radd") belum dimasukkan.
   Mockup memasukkannya secara tidak langsung lewat "asal masalah akhir".
5. Semua penilaian tetap dari engine (`ringkasan`/tabel); layar tidak menghitung sendiri.

## 7. Uji dengan pengguna
1. "Kerjakan soal ini di HP-mu sendiri." Diukur: semua isian bisa dimasukkan tanpa bertanya, di iPhone dan Android.
2. "Anak laki-laki ini dapat apa?" Diukur: memilih Ashabah tanpa ragu di mana menuliskannya.
3. Jawab dengan asal masalah 48 (sengaja). Diukur: paham umpan balik "perbandingan benar, asal masalah belum yang terkecil".
4. Pelajar mahir: pindah ke Jawaban akhir. Diukur: menemukan sakelar dan isiannya tetap ada saat pindah.

## 8. Perubahan kode (sesudah mockup disetujui)
- `KartuTebak.tsx`: tiga langkah + mode Jawaban akhir. Hapus `inputMode="numeric"` dari kotak berisi "/" (tidak ada lagi
  kotak semacam itu).
- `tebak.ts`: penilaian per langkah (status dari `ringkasan`/jejak hajb, ashl & tashih dari tabel engine), dan
  "perbandingan benar, ashl bukan yang terkecil".
- Uji: `tebak.test.ts`, termasuk kelipatan ashl, 'aul, tashih, dan terhalang.

## 9. Opsi untuk dipilih pemilik dan kelayakan per jenis soal (2026-11-19)

Mockup: [mockup-opsi-isian-jawaban.html](mockup-opsi-isian-jawaban.html). Enam opsi untuk soal yang sama, masing-masing bisa diisi dan
dinilai: **A** langkah bertahap, **B** tabel seperti di kitab, **C** pecahan bertumpuk, **D** papan angka sendiri, **E** ketik bebas
dengan pembaca toleran dan gema "Terbaca: …", **F** pilihan ganda. Tab "Kasus khusus" menunjukkan A dan C pada munasakhat, dzawil
arham, haml, mafqud, dan gharqa, dengan angka kunci dari contoh KB (12.6 contoh 2, 14.6, 13a.7 H1 baris [SYF], 13b.6 F1, 13d.2).

| Jenis soal | A | B | C | D | E | F | Yang dibutuhkan |
|---|---|---|---|---|---|---|---|
| Biasa, 'aul, radd, tashih | ✓ | ✓ | ✓ | ✓ | sebagian | ✓ | langkah 3 selalu "asal masalah akhir" |
| Munasakhat (12) | ✓ | ✓ | ✓ | ✓ | sebagian | sebagian | babak per mayit + jami'ah; jawaban akhir = bagian dari harta mayit pertama (12.5); latihan ≤ 3 mayit |
| Dzawil arham (14) | ✓ | sebagian | ✓ | ✓ | sebagian | sebagian | langkah tanzil (didudukkan sebagai → bagi antar perantara → bagi ke kerabat); [HNF] qarabah langkahnya lain |
| Haml, mafqud, khuntsa (13a–c) | ✓ | sebagian (laptop) | ✓ | ✓ | ✗ | sebagian | tiga keadaan per orang (Dapat / **Ditahan dulu** / Tidak dapat) + baris "Ditahan (mauquf)"; langkah menguji **kelompok** tiap orang (R13-4: tetap, terkecil, 0 karena gugur di sebagian, 0 karena berbagi sisa dengan janin [SYF]) alih-alih enam tabel kemungkinan; latihan ≤ 1 orang hilang/khuntsa |
| Gharqa (13d) | ✓ | ✓ | ✓ | ✓ | sebagian | sebagian | langkah keputusan (saling mewarisi / tidak / ditahan, [SYF]) lalu tiap harta dijawab terpisah |
| Laqith, `PERLU_INPUT`, blocked | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | tidak masuk bank soal (R13-14 belum terverifikasi) |

Temuan tambahan:
- **"Ditahan dulu" ≠ "Tidak dapat"** wajib ada di opsi mana pun. Tanpa itu, soal haml/mafqud/khuntsa tidak bisa dijawab benar.
- Daftar langkah diambil dari **jenis soal** (biasa, munasakhat, tanzil, taqdir, gharqa), bukan satu daftar tetap.
- Kode sekarang menutup mode tebak untuk taqdir, menunggu kelahiran, dan gharqa (`Hasil.tsx`, `khusus`). Bentuk isian ini yang
  membuat jenis soal tersebut bisa dilatih.
- E paling rapuh di kasus khusus: kata "ditahan", "mauquf", dan "sisa" menambah tafsir ganda.
