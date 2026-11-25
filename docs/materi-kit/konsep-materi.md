# Konsep materi

## 1. Orientasi: materi menyiapkan pelajar untuk menghitung

Tujuan setiap pelajaran adalah supaya, setelah membacanya, pelajar **bisa mengerjakan sesuatu** pada sebuah kasus
waris: mengenali siapa ahli warisnya, memutuskan siapa yang gugur, menentukan bagian, mengenali kapan terjadi 'aul,
dan seterusnya. Pengetahuan ("'aul itu ini, jenisnya a, b, c") hanya bahan; yang dinilai adalah kemampuan memakainya.

Pertanyaan yang harus bisa dijawab setiap pelajaran:

1. **Di tahap mana** dalam alur pembagian pelajaran ini berada? (blok `alur`)
2. **Pertanyaan apa** yang diajukan pelajar di tahap itu, dan dengan urutan apa? (blok `cara-berpikir`)
3. **Kaidah apa** yang dipakai untuk menjawabnya, dan **kenapa** kaidahnya begitu?
4. **Bagaimana kelihatannya** pada kasus nyata? (blok `kasus`, `peraga`, `simulasi`)
5. **Di mana orang biasanya salah**, dan bagaimana mengenalinya?
6. **Apa yang diserahkan** ke tahap berikutnya?

Pelajaran tidak menjelaskan aritmetika per langkah (menyamakan penyebut, mengalikan saham); itu ditunjukkan Lab
Hitung, dan setiap studi kasus punya tautan ke sana. Pelajaran menjelaskan **keputusan** di balik langkah itu.

## 2. Alur pembagian: benang merah seluruh materi

Seluruh materi bertumpu pada satu alur yang sama dengan urutan kerja engine dan Lab (KB bab 00.2):

```
Harta bersih → Siapa ahli waris → Penghalang waris → Hajb → Bagian pasti dan sisa
→ Penyebut bersama → 'Aul atau radd → Tashih → Ke rupiah
```

- Alur ini diperkenalkan utuh di pelajaran 1.3, lalu **setiap** pelajaran membuka dengan blok `alur` yang
  menyorot tahapnya.
- Setiap pelajaran menyebut bekal dari tahap sebelumnya dan hasil yang diserahkan ke tahap berikutnya.
- Pelajaran lanjutan (munasakhat, dzawil arham, kasus belum pasti) menjelaskan bagaimana alur ini **diulang atau
  dimodifikasi**, bukan alur baru.

Dengan begitu, ketika pelajar sampai di Lab, urutan yang mereka lihat sudah dikenal.

## 3. Wujud materi

Buku pelajaran faraidh digital: 15 modul, 54 pelajaran, masing-masing 15–20 menit baca. Lengkap tetapi
tidak sedalam kitab. Setiap pelajaran membahas satu pokok sampai tuntas, dipecah menjadi bagian bernomor.

## 4. Jenis isi dalam pelajaran

| Jenis | Artinya | Contoh |
|---|---|---|
| **Gambaran masalah** (taswir) | Kasus nyata yang memunculkan pertanyaan pelajaran ini, di awal sebelum istilah | Keluarga Pak Rahmat kaget kakaknya tidak dapat |
| **Konsep** | Apa sesuatu itu: pengertian, batasnya, dan bedanya dengan yang mirip | Hajb nuqshan vs hajb hirman; mahjub vs mamnu' |
| **Kaidah** | Aturan yang dipakai memutuskan, beserta alasan dan pengecualiannya | "Yang terhubung lewat seseorang gugur oleh orang itu, kecuali saudara seibu bersama ibu" |
| **Pemetaan** | Pengelompokan yang membuat banyak aturan terlihat sebagai satu pola | Empat pemicu nuqshan; empat kelompok ahli waris terhadap hajb |
| **Cara berpikir** | Urutan pertanyaan untuk memutuskan di tahap ini | Urutan memeriksa siapa yang gugur |
| **Contoh** | Kasus bertabel yang dihitung engine | Studi kasus 'aul 6 ke 7 |
| **Kesalahan umum** | Salah paham yang membuat hitungan salah, dan cara mengenalinya | Mengira saudara yang gugur tidak menurunkan ibu |
| **Dasar** | Kekuatan dan sumber kaidah dalam bahasa yang bisa dibaca awam | "Disepakati empat madzhab" |

Setiap konsep dan kaidah dijelaskan **kenapa**-nya kalau KB memberi alasannya. Kalau KB tidak memberi alasan,
jangan mengarang alasan; cukup nyatakan kaidahnya.

## 5. Unsur wajib dan unsur pilihan

**Wajib di setiap pelajaran:**

1. Kepala berkas lengkap (format bagian 1).
2. Blok `alur` di paling awal.
3. Bagian pertama berupa **gambaran masalah**, biasanya dengan blok `kasus`.
4. Bagian bernomor (`##`, `###`).
5. Istilah bertooltip di kemunculan pertama.
6. Minimal satu blok `kasus` dengan angka yang lolos pemeriksa.
7. Tautan antarbab setiap kali menyebut hal yang dibahas di pelajaran lain.
8. Blok `dasar` untuk klaim fikih penting.
9. `## Cek pemahaman` dengan 2–4 blok `soal`.
10. `## Ringkasnya` berupa paragraf pendek dan daftar biasa, ditutup satu kalimat yang menyambung ke pelajaran
    berikutnya.

**Pilihan (pakai kalau membantu, jangan semua):** `peta`, `cara-berpikir`, `peraga`, `bandingan`, `simulasi`,
`ingat`, `tebak`, `lipat`, `matriks`, `video`, catatan, bagian "Kesalahan yang sering terjadi".

Tidak ada templat urutan yang kaku. Pelajaran yang isinya daftar (misalnya 25 ahli waris) cocok dengan peta dan
tabel; pelajaran tentang satu kaidah besar cocok dengan peraga dan simulasi; pelajaran sejarah ('aul) cocok
dengan kisah lalu peraga. Lihat dua contoh di `contoh/`.

## 6. Kesalahan umum dan pengecoh soal

Pilihan salah di blok `soal` dan bagian "Kesalahan yang sering terjadi" diambil dari salah paham yang nyata,
misalnya:

- memakai kaidah yang benar di tahap yang salah (menurunkan ibu karena saudara yang terkena penghalang waris);
- tertukar dua keadaan yang mirip (1/3 dengan 1/3 sisa; 'aul dengan radd);
- lupa pengecualian (saudara seibu bersama ibu);
- menerapkan kaidah satu jenis ke jenis lain (anak perempuan menggugurkan saudara kandung);
- aritmetika yang tidak mungkin ('aul ashl 12 ke 14).

Setiap alasan pilihan salah menunjuk ke bagian pelajaran yang meluruskannya (`[[#5e]]`).

## 7. Batas isi

- Fikih **hanya dari `docs/kb/`**. Madzhab Syafi'i ([SYF]) adalah posisi utama. Kalau ada khilaf yang tercatat di
  KB atau `docs/kb/18_matriks_khilaf.md`, sebut singkat di catatan atau blok `dasar` ("Menurut madzhab Hanbali
  ..."), jangan jadikan isi utama.
- Yang ditandai `[perlu verifikasi lanjut]` di KB tidak ditulis sebagai hukum.
- KHI tidak dibahas di materi fikih. Kalau relevan, cukup satu kalimat bahwa ada panel "Kalau menurut KHI" di
  layar Hasil.
- Tidak ada fatwa untuk kasus pribadi pembaca.
