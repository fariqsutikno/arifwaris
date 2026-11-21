# 05. Soal buta, mode Ujian, dan keterlibatan (G3 bagian soal buta; skema penalaran di awal G4; sisanya G6)

Induk: `00-induk.md` bagian 4. Perilaku: spec 1.1 (Ujian), 4.4 (saran belajar), 4A.1–4A.11, riset kelas 14–16 (D11, D14–D22).
Prasyarat G6: G3 (kejadian di server, aksi `buka`), G4 (konten cukup: bagian 6.4). Perkiraan G6: 12–18 orang-hari + mockup.

Semua turunan (skor, kemahiran, rekor, lencana, level, profil, soal hari ini) adalah **fungsi murni** di `@waris/latihan`
atas `KejadianPercobaan[]` + aturan bernama (satu tempat untuk tiap ambang, ditandai USULAN). Klien memakainya untuk
tampilan pribadi; server memakai fungsi yang sama lewat edge function untuk tampilan pengajar (`06`). Tidak ada ambang
yang ditulis di komponen.

**Proses tampilan** (aturan "UI lewat JTBD/HMW dulu"): satu sesi riset UX + mockup sebelum G6 untuk semua layar baru di
dokumen ini (daftar di bagian 8); pemilik memilih; baru dibangun. Soal buta punya mockup sendiri lebih awal (bagian 1).

---

## 1. Soal buta sebelum dibuka (spec 4A.9, D16; kapan saja sesudah mockup disetujui, paling lambat G3; 2–3 hari)

Spec memasukkannya ke fase P0 karena murah; tidak bergantung G1/G2, jadi boleh lebih awal bila mockup sudah ada.
- Mockup daftar soal: kode/nomor, bab, tingkat, jenis soal, status; tanpa ahli waris, jumlah orang, harta, atau topik.
- Ubah `layar/belajar/DaftarSoalHitung.tsx` (judul berisi ahli waris di ±baris 39 dan 115) dan `SoalAcak.tsx` (±baris 59).
  Judul asli tampil sesudah soal selesai atau jawaban dibuka (pola topik yang sudah ada, ±baris 118). Pencarian sebelum
  selesai hanya pada bab/tingkat/jenis/kode.
- Status selesai/dibuka diambil dari satu fungsi (`statusSoal` di `@waris/latihan` setelah G3; sebelum itu dari
  `bacaProgresLatihan`).
- Uji komponen: daftar sebelum dikerjakan tidak memuat nama ahli waris mana pun (cek teks render terhadap
  `DAFTAR_JENIS`); sesudah benar, judul tampil.

## 2. Tambahan aksi `buka` (ikut G3, karena murah dan mencegah migrasi)

Lencana kecepatan dan dimensi kelancaran butuh waktu yang dipercaya. `dimulaiPada` klien tidak dipercaya (spec 2.1).
Maka kejadian baru **`buka`** dikirim saat soal dibuka (daring), dan waktu pengerjaan = selisih `diterima_pada` server
antara `buka` dan kejadian benar pertama dalam `idSesiSoal` yang sama. Tanpa `buka` yang diterima server, soal itu tidak
dihitung untuk kecepatan (tetap dihitung untuk lainnya).
- Tambah `'buka'` ke tipe `aksi` di G1 dan ke `check` kolom `aksi` saat migrasi `percobaan_soal` di G3 (`04` bagian 1).
  Ini tambahan dari spec 2.1; perbarui spec bersama migrasinya.
- Mengirim `buka` lebih awal hanya memperlama durasi, jadi tidak bisa dipakai untuk curang. Menyalin dari kalkulator tetap
  mungkin (*open book*, audit 8c butir 12); soal buta (bagian 1) mengurangi pengerjaan di depan.

## 3. Mode Ujian (fase P2; 3–5 hari + mockup)

- **Mockup** tab Ujian di `mockup-tabel-faraidh-final.html` (spec 8.2): tombol Kirim, dialog "Masih ada kotak kosong.
  Tetap kirim?", tampilan sesudah Kirim (sel benar/salah sekaligus, ringkasan `{benar} dari {total} kolom benar`, kunci
  tampil), hitung mundur bila **Pakai waktu** dinyalakan, dan pintu masuk Ujian di latihan mandiri (paket soal).
- **Komponen**: `TabelLatihan` mode `'ujian'` (prop sudah ada sejak G1): Kirim sekali, Lihat jawaban tersembunyi sebelum
  Kirim, `terkunci` sesudahnya; penilaian `putusanUjian(nilaiSemuaKolom(...))` (sudah ada sejak G1).
- **Skor**: `skorButir(hasilKolom, bobotTahapan)` di `@waris/latihan`, dipakai Ujian mandiri (XP parsial spec 3.1 butir 5)
  dan nilai tugas (`06`). Skor per sel → kolom → tahapan dengan bobot 40 · 30 · 30 (D13; konstanta `BOBOT_TAHAPAN_BAWAAN`).
  Sel kepala yang salah membuat seluruh kolom salah (spec 1.1, supaya satu salah kepala tidak dihukum dua kali).
- **Waktu**: mandiri = hitung mundur di klien (hanya alat bantu, tidak dipercaya, tidak memengaruhi XP). Tugas = server
  (`06`).
- **Rekor Ujian** `rekorUjian(kejadian)` dari kejadian (ikut sinkron), memakai `predikatDari` dari `skorKuis.ts` (satu tangga
  predikat).
- Hero: `Ujian · Soal {i} dari {n} · {bab}` (spec 1.3). Teks baru lewat diksi.
- Uji: kotak kosong saat Kirim = salah; Kirim kedua tidak mungkin; skor parsial sesuai bobot; XP parsial lalu top-up tidak
  melebihi `bobotXp` (kasus di `xp-kasus.json`).

## 4. Umpan dan saran (fase P2; 2–3 hari)

- **Kolom yang sudah benar** (K12, pilihan pemilik spec 8.11): saat Latihan salah, kolom sebelum kolom salah ditandai benar.
  Datanya sudah ada di `HasilKolom[]`; hanya tampilan (mockup).
- **Saran belajar** (spec 4.4, pengganti nyawa): sesudah 3 Periksa salah di kolom yang sama dalam satu sesi soal, muncul
  tautan materi bab terkait + soal serupa. Tanpa kunci, tanpa penalti. Fungsi `saranBelajar(kejadianSesi)`.
- **Soal serupa** (4A.2): soal lain dengan `topik` sama (sebelum pola soal); soal lain dari pola yang sama (sesudah katalog soal bangkitan ada di G4).
  Pilihan soal serupa di satu fungsi `soalSerupa(idSoal, katalog)`.

## 5. Kemahiran, rekor, lencana, level, profil, soal hari ini (fase P2b; 7–10 hari)

| Mekanik | Fungsi murni | Aturan (USULAN kecuali disebut keputusan) | Sumber |
|---|---|---|---|
| Kemahiran per topik | `kemahiranTopik(kejadian, aturan)` → Beginner · Intermediate · Advanced | nama tingkat = keputusan D11; ambang dari spec 4A.3 | spec 4A.3 |
| Rekor beruntun | `rekorBeruntun(kejadian, rentang)` | 20 / 50 / 100 benar berturut tanpa dibuka (keputusan D19); dicapai **dalam periode** bila dilihat di kelas (D20) | riset kelas 15c |
| Lencana penyelesaian | `lencanaPenyelesaian(kejadian, katalog)` | menyelesaikan **semua** soal satu bab/jenis (D15), bukan "tuntas bab" | riset kelas 14b |
| Lencana kecepatan | `lencanaKecepatan(kejadian, ambang)` | ≤ 30 detik (dasar), ≤ 45 (menengah), ≤ 60 (sulit) sebelum ada data, lalu 1% waktu tercepat (D21; spec 8.25); hanya dengan `buka` server (bagian 2) | riset kelas 15c |
| Level A1–C2 | `levelPelajar(kemahiran, petaLevel, indikator)` | peta bab → level riset kelas 15a (**perlu validasi tim keilmuan**, spec 8.27); indikator spec 8.28 | spec 4A.10 |
| Tes awal / akhir | `gainTernormalisasi(awal, akhir)` | paket soal tetap per level; `(akhir − awal) / (100 − awal)` | D18 |
| Profil 5 dimensi | `profilKecakapan(kejadian, aturan, rentang)` | 4 dimensi dari tabel (pakai `benarEcf` untuk hisab dan prosedur); kelancaran dari durasi `buka`; penalaran dari bagian 6; ambang spec 4A.11 / 8.29 | spec 4A.11 |
| Soal hari ini | `soalHariIni(kejadian, katalog, tanggalServer)` | pengulangan berjarak; streak apa adanya; tanpa bonus XP (spec 8.14 bila pemilik memilih lain) | spec 4A.4 |
| Saran kesulitan | `saranKesulitan(kemahiran)` | saran, bukan kunci (K15) | spec 4A.5 |

- Lencana dan rekor **selalu terlihat oleh pengajar** kelas yang diikuti (D14), hanya yang dicapai dalam periode kelas.
- Tidak ada yang menjadi nilai otomatis (profil dan lencana ditampilkan bersama jumlah buktinya).
- Uji: tiap fungsi punya uji tabel kasus; property test: menambah kejadian salah tidak pernah menaikkan tingkat; kejadian
  `lihatJawaban` tidak pernah dihitung sebagai bukti benar.

## 6. Soal penalaran (D22, riset kelas 16d)

### 6.1 Skema (pasang di **awal G4**, sebelum penulis mulai; 1–2 hari)
Dua jenis konten baru; "transfer" bukan jenis konten melainkan aturan memilih soal (bagian 6.3).
```ts
interface SoalPilihAlasan {          // jenis konten 'soal_alasan'
  kode: string; bab: number; tingkat: Tingkat;
  soalAcuan: string;                 // slug soal hitung yang dipakai sebagai konteks
  langkah: string;                   // id langkah/kolom yang ditanyakan (mis. 'bagian:IBU')
  pilihan: Potongan[][]; indeksBenar: number;   // alasan benar bersumber LangkahJejak + refs; pengecoh ditulis penulis
  pembahasan: Potongan[];
}
interface KesalahanUmum {            // jenis konten 'kesalahan_umum', katalog per bab, ditinjau tim keilmuan
  kode: string; bab: number;
  uraian: Potongan[];                // mis. "ibu diberi 1/3 padahal ada anak"
  ubah: { kolom: string; peran: string; menjadi: string };   // transformasi deklaratif atas tabel kunci engine
}
// 'temukan kesalahan' = soal hitung + satu KesalahanUmum yang cocok → tabel kunci dengan satu sel diubah;
// pelajar menunjuk sel yang salah lalu memilih uraian kesalahannya. Tidak perlu jenis soal tersendiri.
```
Skema zod di `packages/content/src/skema.ts`; dimasukkan ke `JENIS_FIKIH` (wajib ditinjau). Penulis pengecoh dan katalog
kesalahan ditunjuk pemilik (spec 8.30, gerbang G4).

### 6.2 Tampilan (G6, sesudah mockup)
Komponen pilihan alasan memakai pola `KartuSoalKuis` yang ada; temukan kesalahan memakai `TabelLatihan` mode baca dengan
sel yang bisa diketuk.

### 6.3 Transfer
`pilihSoalTransfer(kejadian, katalog)`: soal dengan susunan ahli waris yang belum pernah dikerjakan pelajar. Bermakna
setelah katalog soal bangkitan ada (G4); sebelum itu dari soal kurasi.

### 6.4 Target konten minimal G4 (USULAN, supaya bukti kemahiran dan profil cukup)
- Per bab 4–10: ≥ 3 soal dasar, ≥ 3 menengah, ≥ 2 sulit; ≥ 2 soal per `topik`.
- Per jenis khusus (bab 12, 13a–d, 14): ≥ 4 soal.
- Per bab: ≥ 3 soal pilih alasan dan ≥ 3 kesalahan umum.
- Paket tes awal/akhir: satu paket per level yang dipakai pemilik, disusun dari soal di atas.

## 7. Kriteria terima setiap mekanik (dari spec 4A.6–4A.8)
- Tidak memakai pola gelap di spec 4A.6 (hitung mundur palsu, kehilangan streak yang menakutkan, hadiah acak, dsb.).
- Punya ukuran keberhasilan dari spec 4A.7 yang bisa dihitung dari kejadian.
- **Tidak tampil di layar tugas kelas** (4A.8): layar tugas hanya aturan tugas.

## 8. Layar yang butuh mockup sebelum G6
Tab Ujian dan pintu masuk Ujian mandiri; tanda kolom benar dan saran belajar; tampilan kemahiran, level, dan profil
pribadi; lencana dan rekor; soal hari ini; soal pilih alasan dan temukan kesalahan. (Soal buta: mockup terpisah, lebih awal.)
