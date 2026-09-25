# PRD — Pusat Belajar (materi pembelajaran)

Tanggal: 2026-09-25 · Status: disetujui, keputusan di akhir dokumen · Mendahului bab 12 lanjutan, bab 13 (haml, mafqud, dst.), bab 14.

## Latar

Kalkulator sudah bisa menghitung dan menjelaskan satu kasus langkah demi langkah (mode Hitung kasus / Belajar).
Yang belum ada: tempat belajar faraidh **tanpa harus punya kasus dulu**. Header sudah menyisakan slot
"Pusat belajar & Rujukan" (spec desain ulang UI, bagian Navigasi global). Dokumen ini mengisi slot itu.

Alasan didahulukan dari haml/mafqud: sebagian besar bahannya sudah ada di KB dan `packages/content`, nilai
edukasinya langsung terasa untuk semua pengguna, sedangkan haml/mafqud masih diblok (rincian [SYF] belum ada di KB).

## Tujuan

1. Pelajar awam bisa belajar faraidh berurutan dari nol sampai bisa mengerjakan kasus 'aul/radd/tashih sendiri.
2. Setiap istilah, klaim hukum, dan jawaban soal bisa ditelusuri ke KB (`[Rxx-y]`), sama seperti kalkulator.
3. Kalkulator dan pusat belajar saling menaut: istilah di hasil → glosarium; materi → "coba di kalkulator".

## Bukan tujuan (fase ini)

- Akun, login, progres tersimpan di server, sertifikat, papan peringkat. App tetap statis, tanpa backend.
- Materi di luar [SYF] atau di luar KB. Materi KHI tetap fase 4.
- Menulis hukum baru. Materi hanya memparafrasekan KB; yang belum ada di KB ditandai, tidak dikarang.
- Menyimpan file ebook berhak cipta di app.

## Prinsip konten

| Prinsip | Aturan |
|---|---|
| Satu sumber hukum | Isi fikih diambil dari `docs/kb/` (parse `?raw`, seperti `glossary.ts`/`refs.ts` sekarang) atau ditulis ulang di `docs/materi/` dengan kode `[Rxx-y]` per klaim. |
| Bisa diedit tim keilmuan | Semua teks edukasi berupa Markdown/TS data di satu tempat, bukan tersebar di komponen. |
| Status review | Tiap entri baru membawa `perluCek: true` sampai diverifikasi. Tampil di UI sebagai label kecil "belum direview". |
| Kode rujukan | Tidak tampil mentah; jadi kotak "Dalilnya" (komponen yang sudah ada di hasil). |
| Blocked tetap blocked | Topik bab 17.4 / titik blocked di CLAUDE.md tampil sebagai "sedang dikaji", bukan diisi. |

## Fitur

Prioritas: **P0** = rilis pertama pusat belajar; **P1** = setelahnya.

### 1. Glosarium — P0

Data sudah ada: `GLOSARIUM` (bab 15, kolom Istilah/Arab/Makna/Arti awam).

- Halaman daftar A–Z + kotak cari (istilah, sinonim, arti awam). Cari = filter di klien, tanpa pustaka.
- Tiap istilah punya URL sendiri (`#/glosarium/ashabah`) supaya bisa dibagikan dan ditaut dari hasil/materi.
- Tampil: istilah, teks Arab, arti awam (utama), makna teknis (sekunder), "dibahas di materi X".
- Istilah di layar hasil & materi yang ada di glosarium → tautan/tooltip ke entri ini.

Kriteria terima: semua baris bab 15 tampil; cari "sisa" menemukan Ashabah; entri tanpa arti awam tetap tampil.

### 2. Sumber rujukan — P0

Data sudah ada: `RUJUKAN`, `DAFTAR_AYAT`, bab 17.

- Halaman "Rujukan": daftar kitab (17.2), hadits (17.3), hierarki dalil (17.1), dan titik yang masih dikaji (17.4).
- Halaman per kode rujukan (`#/rujukan/R09-4`): klaim, jenis dalil, kutipan Arab, sumber, status
  terverifikasi/perlu verifikasi, dha'if. Dari sini ada "dipakai di materi …" dan "dipakai di soal …".
- Kotak "Dalilnya" di hasil kalkulator mendapat tautan "lihat selengkapnya" ke halaman ini.

Kriteria terima: setiap kode yang dirujuk materi/soal punya halaman; kode yang tidak ada di KB = test gagal.

### 3. Materi terstruktur — P0

KB ditulis untuk engine (padat, bertabel). Materi = versi ajar dari KB yang sama.

Struktur (mengikuti urutan pipeline, bab 00.2):

| Modul | Isi | Sumber KB |
|---|---|---|
| 1. Pengantar | Apa itu faraidh, tirkah, urutan hak atas harta | bab 01, 02 |
| 2. Siapa ahli waris | Daftar ahli waris, sebab & penghalang | bab 02, 03 |
| 3. Bagian pasti (furudh) | 1/2, 1/4, 1/8, 2/3, 1/3, 1/6 dan syaratnya | bab 04, 07 |
| 4. Sisa (ashabah) | Bi nafsihi, bil ghair, ma'al ghair, urutan jihah | bab 05 |
| 5. Penghalang (hajb) | Hirman vs nuqshan | bab 06 |
| 6. Kakek & saudara | Muqasamah, akdariyyah | bab 08 |
| 7. Menghitung | Ashl, 'aul, radd | bab 09 |
| 8. Tashih | Inkisar, nisab arba' | bab 10 |
| 9. Pembagian nominal | Dari saham ke rupiah, pembulatan | bab 11, engine-contract Tahap 6 |
| 10. Munasakhat | Tiga keadaan, jami'ah | bab 12 |

Tiap pelajaran (unit terkecil, ±5 menit baca):
- Tujuan belajar 1–2 kalimat, isi, **contoh yang dihitung engine** (bukan angka ketikan tangan), rangkuman,
  2–3 soal cek pemahaman (dari bank soal, fitur 4), tombol "Coba kasus ini di kalkulator" (buka wizard terisi).
- Klaim hukum diberi `[Rxx-y]` di sumber → dirender sebagai "Dalilnya".
- Progres baca (sudah/belum) disimpan di `localStorage`, dibungkus try/catch; tanpa itu tetap jalan.

Format sumber: `docs/materi/NN-slug.md` dengan frontmatter (`judul`, `modul`, `urutan`, `rujukan`, `perluCek`)
dan blok contoh `kasus` berisi input ahli waris dalam bentuk data. Parse `?raw` seperti KB.

Kriteria terima: tiap contoh `kasus` di materi dijalankan engine di test dan hasilnya cocok dengan angka di teks;
tiap `[Rxx-y]` ada di `RUJUKAN`.

Konten ditulis bertahap: rilis P0 cukup modul 1–5 (dasar); modul 6–10 menyusul tanpa perubahan kode.

### 4. Bank soal latihan — P0

Dua jenis soal:

| Jenis | Contoh | Kunci jawaban dari |
|---|---|---|
| **Hitung** | "Istri, ayah, ibu, 2 anak pr. Tentukan ashl, 'aul, dan saham tiap ahli waris." | Engine (deterministik), divalidasi silang dengan bab 16 |
| **Konsep** | Pilihan ganda / benar-salah: "Siapa yang menghalangi saudara seibu?" | Ditulis manual + `[Rxx-y]` + `perluCek` |

- Sumber awal soal hitung: 24 kasus bab 16 + contoh M1–M9 bab 12 (Lahim), dikelompokkan per modul & tingkat
  (dasar / menengah / sulit). Soal nomor 24 (dzawil arham) tidak dimasukkan selama bab 14 dicabut dari UI.
- Soal hitung dijawab per langkah mengikuti pipeline: siapa terhalang → bagian tiap orang → ashl → 'aul/radd → tashih.
  Tiap tahap dicek langsung; salah → tampilkan penjelasan tahap itu dari `packages/explain`, bukan cuma "salah".
  Ini memakai ulang trace yang sudah ada.
- Mode latihan: pilih modul/tingkat → 5–10 soal → ringkasan skor. Skor & riwayat di `localStorage` saja.
- Soal konsep disimpan di `docs/materi/soal/*.md` (atau satu file TS data), satu soal = satu entri.

Kriteria terima: test memastikan kunci setiap soal hitung = hasil engine = angka bab 16; setiap soal konsep punya
rujukan yang valid.

### 5. FAQ — P1

- Dua kelompok: **Fikih** ("Apakah anak angkat dapat warisan?") dan **Pakai aplikasi** ("Apakah data saya dikirim?").
- Jawaban fikih wajib punya `[Rxx-y]`; yang tidak ada di KB tidak dijawab, diganti arahan ke direktori/konsultasi.
- Satu file sumber, dirender sebagai daftar lipat + tautan ke materi/glosarium. Ikut dicari oleh kotak cari global.

### 6. Buku & bacaan — P1

- Daftar kurasi, **tautan saja**: judul, penulis, bahasa, tingkat, format, tautan resmi/legal, catatan madzhab
  (mis. "Hanbali, pembanding").
- Isi awal: bab 17.2 saja (Raudhah, Tashil al-Fara'idh, Al-Fara'idh al-Muyassar, al-Lahim). Tambahan diurus tim
  keilmuan lewat file data yang sama.
- Tidak mengunggah PDF ke app kecuali lisensinya jelas mengizinkan.

### 7. Konsultasi (direktori dosen) — P1

Isinya tautan ke dosen di lingkungan kampus sendiri, bukan direktori ustadz/konsultan umum.

- Data statis di repo: nama & gelar, bidang keahlian, tautan profil resmi (laman fakultas/SINTA/Google Scholar),
  kontak **institusional** yang dosen izinkan (email kampus). Nomor HP pribadi & alamat rumah tidak dicantumkan.
- Tiap dosen dicantumkan hanya setelah setuju; entri membawa tanggal verifikasi.
- Disclaimer singkat: konsultasi di luar tanggung jawab aplikasi.
- Tampil di halaman Belajar dan sebagai arahan dari jawaban FAQ / hasil yang `TIDAK_DIDUKUNG` ("Tanyakan ke dosen").
- Tanpa peta, filter, atau form pendaftaran. Daftar pendek tidak butuh itu.

## Navigasi & teknis

- Header: Kalkulator · **Belajar** · **Rujukan**. "Belajar" = beranda pusat belajar (lanjutkan pelajaran terakhir,
  daftar modul, latihan soal, glosarium, FAQ, bacaan).
- Routing: sekarang layar dipilih lewat state reducer (`Aplikasi.tsx`). Halaman belajar butuh URL yang bisa
  dibagikan → tambah routing berbasis `location.hash` (native, tanpa react-router). Kalkulator tetap memakai state.
- Paket:
  - `packages/content`: parser & data (glosarium, rujukan — sudah; tambah materi, soal, FAQ, bacaan).
  - `apps/web`: layar-layar baru di `src/layar/belajar/`.
  - Soal hitung memanggil engine + explain dari `apps/web` (content tidak mengimpor engine; aturan satu arah tetap).
- Cari global (istilah, materi, FAQ): filter string di klien. Index/fuzzy search ditunda sampai isinya terbukti banyak.

## Tahapan

| Tahap | Isi | Selesai bila |
|---|---|---|
| A | Routing hash, header, halaman Glosarium & Rujukan | Semua entri bab 15 & tabel rujukan tampil, tautan dari hasil jalan |
| B | Format & parser materi + modul 1–5 | Contoh `kasus` di materi lolos test engine |
| C | Bank soal hitung (bab 16 + M1–M9) + soal konsep modul 1–5 | Kunci = engine = bab 16 |
| D | Modul 6–10 + soalnya | idem |
| E | FAQ, Buku & bacaan | Semua jawaban fikih berujukan valid |
| F | Konsultasi (direktori dosen) | Semua entri berizin & bertanggal |

Setelah C, pengerjaan munasakhat lanjutan / haml / mafqud bisa jalan paralel dengan penulisan konten D–E.

## Keputusan (2026-09-25)

1. **Penulis konten**: Claude membuat draf materi, soal konsep, dan FAQ dari KB; semua `perluCek: true` sampai
   direview tim keilmuan.
2. **Direktori**: menjadi daftar tautan ke dosen kampus sendiri (fitur 7), naik ke P1.
3. **Soal hitung**: dijawab per langkah pipeline.
4. **Buku**: cukup dari bab 17.2 dulu; tambahan bacaan diurus tim keilmuan.
