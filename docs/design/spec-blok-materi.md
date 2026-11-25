# Spec: blok materi baru dan format kiriman (2026-11-25)

Status: draf, menunggu persetujuan pemilik. Acuan tampilan: `docs/design/preview-materi-v2.html` (disetujui
2026-11-25). Sintaks berkas: **`docs/materi-kit/format-materi.md` adalah satu-satunya sumber**; spec ini
hanya mengatur implementasinya dan tidak mengulang sintaks.

## 1. Tujuan

1. Aplikasi bisa menampilkan pelajaran gaya "buku ringkas" v2: blok alur, cara berpikir, peta bab, peraga,
   bandingan, simulasi, ingat, dasar, tebak, lipat, matriks, soal sebaris, nomor bagian 1a/1b, tautan antarbab.
2. Materi ditulis model lain (Codex) sebagai berkas Markdown di `konten/materi/`, diperiksa otomatis, lalu
   diimpor ke database tanpa disalin tangan.
3. Semua angka yang tampil di pelajaran berasal dari engine atau lolos pemeriksaan engine.

Bukan tujuan: editor visual blok di portal (Markdown + pratinjau sudah cukup), materi KHI, alur tinjauan tim
keilmuan (keputusan pemilik 2026-11-25: koreksi oleh tim pemilik di luar aplikasi).

## 2. Model data (`packages/content/src/materi.ts`)

```ts
interface Pelajaran {
  slug: string; judul: string; modul: number; urutan: number; tujuan: string;
  durasi: number;                 // baru
  tahap: TahapAlur;               // baru
  prasyarat: string[];            // baru, slug
  singgung: string[];             // baru, slug
  perluCek: boolean;              // dipertahankan untuk data lama; impor baru selalu false
  blok: Blok[];
  ar?: VersiArab;
}

type TahapAlur = 'harta' | 'ahli-waris' | 'penghalang' | 'hajb' | 'bagian' | 'ashl' | 'aul-radd' | 'tashih'
  | 'nominal' | 'semua' | 'lanjutan';

type Potongan = ...yang lama
  | { jenis: 'tautanPelajaran'; slug: string; bagian?: string; teks?: string }   // [[>slug#2b|teks]]
  | { jenis: 'tautanBagian'; bagian: string; teks?: string };                     // [[#2b]]
```

Blok baru (yang lama tetap: judul, paragraf, daftar, catatan, tabel, kasus, video, kuis):

| `jenis` | Bentuk data |
|---|---|
| `alur` | `{ tahap: TahapAlur; tanya: Potongan[]; bekal?: Potongan[]; hasil: Potongan[] }` |
| `caraBerpikir` | `{ judul?: string; langkah: { tanya: Potongan[]; akibat: Potongan[] }[] }` |
| `kasus` (diperluas) | tambah `judul?: string; cerita?: Potongan[]; keterangan: Record<KunciAhliWaris, Potongan[]>` |
| `kasusBerkas` | `{ judul?; cerita?; berkas: string }`; berkas dibundel saat impor |
| `peraga` | `{ judul?; pengantar?; tampil: 'kotak' \| 'kotak-tabel' \| 'aul'; keadaan: { label: string; pewaris: 'L' \| 'P'; ahliWaris: string[]; penjelasan: Potongan[] }[] }` |
| `bandingan` | `{ judul?; kolom: string[]; baris: { nama: string; nilai: NilaiBagian[] }[]; catatan?: Potongan[] }` dengan `NilaiBagian = { pecahan?: [bigint, bigint]; sisa: boolean; sepertigaSisa?: boolean; gugur?: boolean }` |
| `simulasi` | `{ judul?; pewaris: 'L' \| 'P'; pilihan: string[]; awal: string[]; tampil: 'status' \| 'bagian' }` |
| `peta` | `{ akar: SimpulPeta }`, `SimpulPeta = { judul: string; keterangan?: string; tujuan?: string; anak: SimpulPeta[] }` |
| `ingat` | `{ judul?: string; butir: { kunci: string; penjelasan: Potongan[] }[]; penutup?: Potongan[] }` |
| `dasar` | `{ isi: Potongan[]; rujukan: string[] }` |
| `tebak` | `{ tanya: Potongan[]; jawab: Potongan[] }` |
| `lipat` | `{ judul: string; blok: Blok[] }` (isi tanpa blok berpagar) |
| `matriks` | `{ kolom: string[]; baris: { label: string; sel: Potongan[][] }[] }` |
| `videoMenyusul` | `{ rencana: string }` (jenis terpisah supaya pemakai `video.idYoutube` tidak berubah) |
| `soal` | `{ soal: SoalKuis }` (tipe `SoalKuis` yang sudah ada; `alasanPilihan` wajib) |

Kode rujukan `[Rxx-y]` sebaris di paragraf: parser tetap membacanya (data lama), tetapi pemeriksa menolaknya di
kiriman baru, dan renderer tidak lagi menampilkannya sebagai chip kode (ganti dengan ikon kecil yang membuka
lembar dalil). Blok `dasar` membawa kode di `rujukan` untuk ketertelusuran dan untuk membuka lembar dalil.

## 3. Parser dan penulis

- `bacaPelajaran(teks: string): Pelajaran` baru: memisahkan kepala berkas (`---`) lalu memanggil `bacaBlok`.
  Kesalahan selalu dilempar dengan slug dan nomor baris (`5-1-hajb:42: blok peraga butuh minimal 2 keadaan`).
- `bacaBlok` diperluas per blok di `format-materi.md` bagian 4–5; setiap blok berpagar diurai fungsi sendiri
  (`bacaAlur`, `bacaPeraga`, ...), satu fungsi satu blok.
- `tulisBlok`/`tulisPelajaran` diperluas; hukum `bacaPelajaran(tulisPelajaran(p)) = p` dijaga dengan test per
  blok (portal menyunting sebagai Markdown dan menyimpan sebagai `Blok[]`).
- `semuaPotongan` diperluas ke blok baru supaya test istilah dan tautan mencakup semuanya.

## 4. Penomoran dan jangkar

- Nomor dihitung saat render, bukan disimpan: `##` ke-n = `0n`; `###` ke-m di bawahnya = `<n><huruf m>`
  (1a, 1b). `## Cek pemahaman` dan `## Ringkasnya` ikut bernomor (seperti preview v2).
- Jangkar elemen = nomor (`id="b-2b"`), sehingga `[[#2b]]` dan `[[>slug#2b]]` stabil selama urutan bagian tidak
  berubah. Fungsi penomoran satu tempat (`nomorBagian(blok: Blok[])`) dipakai renderer, rel "Di halaman ini",
  dan pemeriksa tautan.
- `.isi-materi h2::before` berbasis CSS counter diganti nomor dari fungsi itu, supaya rel dan judul selalu sama.
  Ukuran nomor naik ke 12px (temuan preview).

## 5. Render (`apps/web/src/layar/belajar/`)

Satu komponen per blok di `layar/belajar/blok/`, dipanggil dari `BlokMateri`. Gaya mengikuti preview v2 dan
token yang ada; tidak ada perubahan pada kerangka halaman materi (banner, sidebar, lembar, rel).

| Blok | Catatan implementasi |
|---|---|
| `alur` | Deretan tahap dari `TahapAlur` (label di kamus diksi); tahap sekarang gelap, yang lewat bertanda, `tanya`/`bekal`/`hasil` di bawahnya. |
| `caraBerpikir` | Daftar bernomor dua kolom (pertanyaan → akibat); di HP bertumpuk. |
| `kasus` | Perluasan `ContohDihitung`: judul, cerita, kolom Keterangan dari `keterangan`, baris gugur bergaya mahjub. Tautan teks "Lihat langkah lengkapnya di Lab" membuka **mode contoh jadi** (bagian 6). |
| `peraga` | Menjalankan `jalankan(kasusDariSoal(...))` per keadaan; kotak digambar dengan gaya `.kotak-harta` Lab, jumlah kotak = KPK ashl akhir semua keadaan. `aul`: kotak sebelum 'aul dengan kotak meluap (`.kt.luar`), tautan teks "Terapkan 'aul". Pengganti keadaan = kontrol segmen. Warna orang dari `warnaOrang`. |
| `bandingan` | Batang pecahan; `sisa` bergaris; nilai yang turun dari kolom pertama diberi warna aksen. Animasi lebar dimatikan bila gerak dikurangi. |
| `simulasi` | Kotak centang; setiap perubahan menjalankan engine. Status dan alasan diambil dari jejak engine (alasan hajb sudah punya diksi di `packages/explain`); tidak ada aturan hajb yang ditulis ulang di UI. |
| `peta` | Pohon bercabang (desktop), pohon menurun berbatas kiri (≤ 700px). Simpul bertujuan = tautan ke jangkar. |
| `ingat` | Kartu hijau muda, kata kunci tebal besar, penjelasan kecil. |
| `dasar` | Baris kecil berikon buku; mengetuknya membuka lembar dalil yang sudah ada (`ChipDalil`) untuk kode di `rujukan`. Kode tidak tampil. |
| `tebak` | Tautan teks "Lihat jawabannya" yang membuka jawaban. |
| `lipat` | `<details>`. |
| `matriks` | Kisi kartu dengan label sumbu; di HP dua kolom tanpa label baris. |
| `video` | Bentuk `menyusul` tidak dirender di aplikasi (hanya pratinjau portal). |
| `soal` | Memakai komponen soal kuis yang ada (`KartuSoalKuis`) dengan data dari blok. Jawaban tercatat seperti kuis biasa. |
| `tautanPelajaran` | Chip abu (`.tautan-bab` di preview): nomor + judul pelajaran tujuan, ikon panah serong. |
| `tautanBagian` | Chip kecil berisi nomor bagian. |
| istilah | Tooltip yang sudah ada (`ui/Tooltip.tsx`), ditambah tautan teks "Buka di glosarium". |

Kepala pelajaran: `durasi` tampil di banner; `singgung` tampil sebagai baris chip di atas isi.

## 6. Lab: mode contoh jadi

Kasus dari materi dibuka di Lab **tanpa isian dan tanpa tebakan**: layar Hasil langsung lengkap, penjelasan
langkah terbuka, tidak menimpa kasus pengguna (tidak ada dialog "Buka kasus ini?" karena kasus pengguna tidak
disentuh). Ada pita kecil "Contoh dari pelajaran 5.1, bagian 1" dengan tautan kembali ke jangkar asal.

- Alamat: `#/lab/contoh/<slug>/<indeksBlok>` (F3: `tautanContoh` di `rute.ts`, layar `ContohJadi.tsx`; `kasusBerkas` menyusul); kasus diambil dari konten,
  bukan dari URL, supaya tidak bisa disisipi.
- Status kasus pengguna di penyimpanan lokal tidak berubah; menutup contoh kembali ke kasus sebelumnya.
- Tidak tercatat sebagai percobaan soal dan tidak memberi XP.

## 7. Pemeriksa (`pnpm materi:cek <berkas|folder>`)

`scripts/materi-cek.ts` (vite-node, seperti `db:refs`). Logika validasi di `packages/content` (sintaks, glosarium,
rujukan, tautan) dan `packages/latihan` (engine), supaya portal memakai fungsi yang sama.

| Periksa | Tingkat |
|---|---|
| Sintaks kepala berkas dan semua blok; nomor baris di pesan | galat |
| `slug` cocok dengan nama berkas; `prasyarat`/`singgung` menunjuk slug yang ada (berkas di `konten/materi/` atau snapshot) | galat |
| Istilah `[[id]]` ada di glosarium (id atau sinonim) | galat |
| `[[>slug#bagian]]` dan `[[#bagian]]` menunjuk bagian yang ada (memakai `nomorBagian`) | galat |
| Kode di `dasar` dan `soal.rujukan` ada di tabel "Dasar dan Rujukan" KB | galat |
| `kasus`: hasil engine status OK dan saham + ashl akhir sama dengan `harapan`; `keterangan` hanya untuk kunci yang ada | galat |
| `peraga`, `simulasi`: kunci ahli waris valid; setiap keadaan status OK; `aul` hanya bila engine benar-benar 'aul | galat |
| `soal`: kode unik di seluruh konten, tepat satu `*`, 3–4 pilihan, alasan di setiap pilihan, rujukan ada | galat |
| `[Rxx-y]` sebaris di luar `dasar`; HTML; tautan web; emoji | galat |
| Blok `alur` tidak ada atau bukan blok pertama; `## Cek pemahaman` dan `## Ringkasnya` tidak ada atau tidak di akhir | galat |
| Kata tidak baku (daftar kecil: nggak, banget, aja, kayak, karna, praktek), tanda pisah panjang, kalimat > 35 kata, sapaan atau pengantar dibuat-buat ("Coba bayangkan", "Pernahkah kamu") | peringatan |
| `durasi` jauh dari perkiraan (jumlah kata / 180) | peringatan |

Keluaran: daftar `berkas:baris: pesan`, kode keluar ≠ 0 bila ada galat. Mode `--json` untuk Codex.

## 8. Impor (`pnpm materi:impor <folder>`)

- Membaca semua berkas, menjalankan pemeriksa (berhenti bila ada galat), lalu menulis lewat jalur yang sama dengan
  `scripts/pulihkan` (repo konten, peran impor): konten jenis `materi` sebagai **revisi draf** per slug, dan
  `modul` dari daftar modul di `docs/materi-kit/kerangka-kurikulum.md`.
- Blok `soal` juga menjadi entri `soal_kuis` dengan kode yang sama, ditandai `sumber: 'materi:<slug>'`.
  Sumber kebenarannya berkas materi; di portal entri itu hanya baca, dengan tautan "Sunting di pelajaran".
- Menerbitkan tetap lewat portal (alur terbit yang sudah ada).
- Berkas kasus `kasus-berkas` disimpan sebagai lampiran konten yang sama.

## 9. Portal

- Penyunting Markdown materi yang ada ditambah: pratinjau langsung memakai komponen render yang sama, panel
  "Sintaks blok" (ringkasan dari `format-materi.md`), dan hasil pemeriksa sebaris (galat menghalangi simpan).
- Sesuai memori `admin-tanpa-kode-teknis`: pesan pemeriksa di portal memakai bahasa biasa ("Angka contoh di
  bagian 1 tidak sama dengan hasil hitung"), bukan kode.

## 10. Kurikulum dan level

- Modul menjadi 15 sesuai `kerangka-kurikulum.md`. Nomor modul pelajaran lama ikut berubah lewat impor; slug tetap,
  jadi progres pelajar (berbasis slug) tidak hilang.
- Peta level diganti: A1 = modul 1–3, A2 = 4–5, B1 = 6–8, B2 = 9–10, C1 = 11–12, C2 = 13–15 (keputusan pemilik
  2026-11-25). Perbarui riset 15a dan pemetaan level di kode bila sudah ada.
- `perluCek` tidak lagi dipakai untuk materi baru; lencana "draf" di banner hanya untuk revisi yang belum terbit.

## 11. Tahapan

| Fase | Isi | Selesai bila |
|---|---|---|
| F1 | Tipe, parser, penulis, `nomorBagian`, pemeriksa CLI | dua contoh di `docs/materi-kit/contoh/` lolos `materi:cek`; test round-trip semua blok |
| F2 | Komponen render semua blok + kepala pelajaran | contoh 5.1 dan 6.2 tampil setara preview v2 di desktop dan 375px; uji render per blok |
| F3 | Lab mode contoh jadi | tautan dari blok kasus membuka Hasil lengkap tanpa menyentuh kasus pengguna |
| F4 | Impor + portal (pratinjau, pemeriksa sebaris, soal dari materi) | modul contoh terimpor sebagai draf dan bisa diterbitkan dari portal |
| F5 | 15 modul dan peta level baru | daftar materi menampilkan 15 modul; progres lama utuh |

F1 dikerjakan lebih dulu supaya Codex bisa mulai menulis dengan pemeriksa yang sudah jalan.

## 12. Catatan implementasi F1 (2026-11-25)

- Parser dan penulis: `packages/content/src/materi.ts`, `tulisBlok.ts` (`bacaPelajaran`, `tulisPelajaran`, `nomorBagian`).
- Pemeriksa: `periksaMateri` (`packages/content/src/periksaMateri.ts`) dan `periksaAngkaMateri` + `hitungContoh`
  (`packages/latihan/src/periksaAngkaMateri.ts`); CLI `scripts/materi-cek.ts`.
- Slug yang sah = kolom pertama tabel `kerangka-kurikulum.md` + berkas di `konten/materi/`.
- Skema zod konten (`skema.ts`) belum mengenal blok baru: materi berblok baru belum bisa disimpan ke database
  sampai F4. Editor portal membawa blok baru sebagai blok khusus utuh.

### Catatan F2 (2026-11-25)

- Komponen: `apps/web/src/layar/belajar/blok/` (`BlokIsi.tsx` untuk blok tanpa engine, `Peraga.tsx`, `Simulasi.tsx`,
  `hitungContoh.ts` sebagai satu jalur engine + `ringkas`). Nomor bagian dari `nomorBagian`, jangkar `#b-2b`.
- Pratinjau lokal (dev saja): `#/belajar/pratinjau-<slug>` membaca `docs/materi-kit/contoh/` dan `konten/materi/`.
- Peta bab mengukur dirinya: bila pohon bercabang tidak muat di lembar baca, berganti ke pohon menurun.
- Peraga 'aul: kotak hak yang melebihi harta digambar di luar bingkai; pecahan sebelum 'aul memakai ashl.
- Belum: tautan antarpelajaran belum melompat ke bagian (`#2b`) di pelajaran tujuan; `kasus-berkas` menunggu F3;
  kolom Keterangan studi kasus tampil sebagai daftar di bawah tabel, bukan kolom tabel.

## 13. Keputusan yang masih terbuka

1. Soal dari materi sekaligus masuk bank `soal_kuis` (usulan) atau hanya hidup di pelajaran?
2. Mode contoh jadi dibuka di tab yang sama (usulan, dengan tautan kembali) atau lembar di atas pelajaran?
