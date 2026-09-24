# Desain ulang UI `apps/web`

Tanggal: 2026-09-25 · Status: menunggu review · Menggantikan bagian layar & navigasi di `2026-09-24-web-ui-design.md`
(stack, engine, `checklist.ts`, `kasus.ts`, `jalankan.ts` tetap).

Acuan visual dan perilaku:
- Peta alur pengguna: https://claude.ai/artifact/GDUtWx1UEmYSv89uC6V7Yw
- Prototipe layar hasil (v2): https://claude.ai/artifact/9crFg5FKqAFjGd7BS4tXDb — **acuan utama layar hasil**; bila spec dan prototipe berbeda, spec menang.

## Masalah yang diselesaikan

Versi pertama benar secara hitungan tapi terasa seperti formulir: 22 kartu ahli waris sekaligus, label teknis
("sebapak"), penjelasan berupa dinding teks dengan kode `[Rxx-y]`, navigasi Ubah/Kembali/Home yang tumpang tindih,
tanpa validasi. Target: pengguna awam dipandu satu pertanyaan sekali, pelajar bisa melihat cara hitung ala kitab.

## Keputusan

| Topik | Keputusan |
|---|---|
| Design system | Tetap Arif Waris (token + komponen yang ada). Gaya lain = pekerjaan terpisah. |
| Tujuan pemakaian | Ditanya di beranda: **Hitung kasus** / **Belajar**. Bisa diganti di layar hasil. Disimpan sebagai preferensi (localStorage), bukan bagian Kasus. |
| Mode Belajar | Isi kartu Pembagian langsung tertutup seluruhnya (bukan sekadar nominal); pohon hanya nama tanpa angka/status terhalang; tabel, kartu pembulatan, dan alasan di modal disembunyikan. Terbuka lewat "Tampilkan jawaban" atau setelah langkah terakhir. Berbeda dari ikon mata di mode Hitung kasus yang hanya menyembunyikan nominal. |
| Harta | Wajib > 0. Dua cara isi: total langsung atau rinci per kategori. |
| Petunjuk langsung di langkah ahli waris | Tidak ada; pengguna memasukkan semua kerabat dulu. |
| Tur | Tur singkat per layar (wizard, hasil); otomatis sekali di kunjungan pertama, bisa diulang dari header. |
| Kode rujukan | Tidak pernah tampil mentah; jadi kotak "Dalilnya" yang bisa dibuka. |
| Teks penjelasan | Semua teks edukasi di satu tempat (`src/konten/`) supaya tim keilmuan bisa mengedit tanpa menyentuh logika. Yang belum diverifikasi ditandai `perluCek: true`. |

## Navigasi global

| Aksi | Label | Letak |
|---|---|---|
| Menu utama | Logo · Kalkulator (Pusat belajar & Rujukan ditambah saat halamannya ada) | Header |
| Mulai kasus baru | Ulangi dari awal (konfirmasi di halaman, tawarkan simpan file dulu) | Header kanan |
| Tur | Tur singkat | Header kanan |
| Langkah sebelumnya | Kembali | Bar bawah kiri (wizard) |
| Langkah berikutnya | Lanjut: {nama langkah berikut} / Lihat hasil | Bar bawah kanan; nonaktif + alasan bila isian wajib belum lengkap |
| Lompat ke langkah yang sudah diisi | Stepper Pewaris · Harta · Kewajiban · Ahli waris · Kondisi khusus · Hasil | Atas konten |
| Dari hasil ubah data | ← Ubah data (ke langkah Ahli waris) | Bar bawah kiri (hasil) |
| Simpan / buka file | Simpan file (bar bawah hasil) · Buka file (beranda) | |

Header tidak memuat tombol simpan. "Kok bisa gini?" dan "Ubah isian" dihapus.

## Layar

### Beranda
Judul, janji singkat, "5 langkah, ±3 menit", madzhab Syafi'i, dihitung di perangkat.
Pertanyaan pembuka "Mau pakai buat apa?" → dua kartu besar **Hitung kasus** / **Belajar**, lalu mulai.
Bila ada kasus tersimpan: kartu "Lanjutkan kasus terakhir" + "Buka file".

### Kerangka wizard (semua langkah)
Stepper di atas → **pertanyaan utama** (paling besar) → caption muted "ini apa / kenapa ditanya / pengaruhnya"
→ isian → card tambahan tertutup untuk detail → bar bawah sticky. Stiker langkah tidak miring. Tidak ada layar
yang terasa kosong: sisi kanan desktop menampilkan ringkasan kasus berjalan (pewaris, harta dibagi, jumlah ahli waris).

### 1 · Pewaris
Dua kartu besar berikon **Laki-laki / Perempuan** (tanpa pilihan bawaan; wajib). Nama = isian kecil opsional.

### 2 · Harta
- Isian uang: prefix `Rp` di dalam field, titik ribuan saat mengetik (termasuk 0), hanya digit.
- Tab kecil **Total langsung / Rinci per jenis**: kategori Tabungan & kas, Tanah & bangunan, Kendaraan,
  Emas & perhiasan, Piutang, Lainnya; totalnya otomatis. Catatan: harta bersama (gono-gini) diatur KHI, di luar cakupan.
- Tombol angka cepat kecil (+1 jt, +10 jt, +100 jt), tidak lebih menonjol dari isian.
- Card tertutup "Pembulatan": pilihan Rp 1 / 100 / 1.000 dengan contoh akibatnya.
- Validasi: harta > 0.

### 3 · Kewajiban
Urutan bernomor Pengurusan jenazah → Hutang → Wasiat, tiap isian dengan caption alasan dan contoh
(hutang: zakat tertunda, haji yang dinazarkan, cicilan). Wasiat: maksimal 1/3 sisa setelah hutang, kelebihan
otomatis dipangkas dan butuh persetujuan ahli waris. Di bawahnya hitungan berjalan "Yang akan dibagi: Rp …"
yang **diambil dari `hitungTirkah` engine**, bukan dihitung ulang di UI.

### 4 · Ahli waris
Tab **Daftar / Pohon keluarga** di atas graf yang sama.
- **Daftar**: mulai kosong. Tambah cepat: Pasangan (suami/istri sesuai pewaris), Anak laki-laki, Anak perempuan,
  Ayah, Ibu. Tombol "Tambah kerabat lain" membuka kelompok Cucu · Kakek & nenek · Kakak/adik · Keponakan ·
  Paman & sepupu. "Kakak/adik" menanyakan jenis kelamin lalu "satu ayah satu ibu / satu ayah saja / satu ibu saja".
  Label sehari-hari sebagai judul, istilah fikih sebagai caption. Kerabat yang bukan ahli waris (cucu dari anak
  perempuan, kakek dari pihak ibu) disebut di keterangan kelompoknya.
- Orang yang sudah ditambah tampil sebagai kartu kecil (bisa dihapus). Bila pewaris punya 2+ istri, anak baru
  ditanya "dari istri yang mana?".
- **Pohon keluarga**: komponen pohon yang sama dengan layar hasil (tanpa angka), dengan tombol `+` di titik yang
  masuk akal (pasangan & anak di bawah pewaris, orang tua di atas, kakak/adik di samping) yang memanggil aksi
  checklist yang sama. Card penjelasan: kenapa pohon lebih jelas dan cara menyusunnya.
- Validasi: minimal satu ahli waris.

### 5 · Kondisi khusus
Pertanyaan "Ada kondisi khusus?" dengan jawaban bawaan **Tidak ada** + caption "opsional, kebanyakan kasus tidak
butuh ini". Bila **Ada**: tiga kartu rapat (label dan caption berdekatan, tinggi tidak melonjak saat dicentang),
masing-masing menyebut akibatnya:
- Beda agama → orang itu tidak mewarisi (hasil berubah). Mencakup ahli waris mayit munasakhat.
- Terlibat kematian pewaris → orang itu tidak mewarisi. Hanya untuk pewaris pertama.
- Wafat sebelum harta dibagi (munasakhat) → pilih orangnya, urutkan bila lebih dari satu, lalu isi ahli warisnya
  memakai tab Daftar/Pohon yang sama (di Pohon: tandai orang "wafat", lalu tambah keluarganya).

### Hasil
Desktop: **canvas kiri**, **sidebar kanan** (420px). HP (< 980px): tanpa tab; urutan catatan → pembagian → pohon
→ harta yang dibagi → tabel faraidh → tentang kasus → langkah.

Sidebar:
1. **Catatan**: madzhab Syafi'i, musyawarahkan dengan ahli, link "Laporkan ke pengembang" (GitHub issues; URL placeholder di konfigurasi).
2. **Pembagian** (terbuka): bar pecahan + daftar per orang (titik warna, nama, keterangan, nominal, pecahan, persen,
   bar persen). Ikon mata = sembunyikan nominal. Ikon atur membuka panel berjudul: "Tampilkan di samping nominal"
   (centang **Pecahan** — bagian dari harta, mis. 1/6 = satu dari enam bagian; **Persen**) dan "Bentuk pecahan"
   (**Disederhanakan** 1/6 · 13/36 — paling ringkas / **Penyebut sama** 12/72 · 26/72 — gampang dibandingkan). Yang tidak dapat bagian ditulis di bawah dengan alasannya.
   Kartu **pembulatan** muncul hanya bila ada nominal yang bukan kelipatan Rp 1.000 pada pembulatan Rp 1: pilihan
   Rp 1 (transfer) / Rp 100 / Rp 1.000 (tunai) langsung menghitung ulang lewat engine; sisa ditampilkan dengan
   ajakan menyepakatinya bersama ahli waris. Bila semua sudah bulat, kartu tidak muncul.
3. **Harta yang dibagi** (tertutup, total di judul): susunan hitungan (label kiri, angka rata kanan; potongan ditulis
   `−Rp 5.000.000` berwarna merah; garis lalu `=` sebelum total), keterangan batas wasiat, bar komposisi. Tanpa kotak ikon +/−.
4. **Tentang kasus ini** (tertutup): jenis kasus dari `KELAS_MASALAH`, asal masalah dan hubungan nisbahnya dari
   `PERBANDINGAN_NISAB` (tamatsul/tadakhul/tawafuq/tabayun), tashih bila ada; istilah dengan tooltip buatan sendiri.
5. **Pelajari langkah perhitungan** (tertutup; terbuka otomatis di mode Belajar): pilihan Langkah demi langkah /
   Tampilkan semua. Langkah demi langkah = deret tahap horizontal yang bisa digeser + Sebelumnya/Berikutnya.
   Tiap langkah: judul berbentuk jawaban, poin-poin (satu baris explain = satu poin), "Kenapa begitu?" bisa
   dibuka-tutup berisi dalil (`dalilUntuk`). Langkah yang tidak terjadi di kasus ini tidak ditampilkan.
6. **Habis ini ngapain?** (tertutup): daftar bernomor langkah setelah tahu pembagian (bereskan jenazah & hutang,
   tunaikan wasiat, musyawarah, sepakati pembulatan & cara bagi, urus dokumen, tanya ahli bila ragu). Teks di `src/konten/`, `perluCek`.

Canvas:
- Tab **Pohon keluarga / Tabel faraidh** (desktop saja).
- **Pohon**: node = kartu berwarna kelompok (pasangan/keturunan/leluhur/saudara), garis putus = tidak dapat bagian,
  abu-abu putus = almarhum (pewaris dan mayit munasakhat). Garis mendatar + lingkaran = menikah, garis turun = anak.
  Node penghubung buatan sistem ditampilkan kecil "(sudah wafat)" hanya bila diperlukan untuk menyambung garis.
  Legenda di atas pohon. Latar titik-titik.
- **Tabel faraidh** ala kitab: Ahli waris · Bagian · Asal masalah · 'Aul/Radd (bila ada) · Tashih · Per orang · Nominal;
  sel gabungan (ashabah berkelompok) rata tengah; garis tegas; baris terhalang bergaris miring; baris jumlah.
- **Sorot silang**: hover/fokus satu orang di pohon, bar, daftar, atau tabel menyalakan orang yang sama di semua tempat.
- **Klik orang** → modal: peran & hubungan, "Bagiannya di kasus ini" (pecahan/persen/nominal), "Kenapa segitu?"
  (baris explain yang menyebut orang itu, sebagai poin), **"Kapan dapat berapa?"** (lipat; tabel semua ahwal ahli waris
  itu dari `src/konten/ahwal.ts`, baris yang berlaku di kasus ini disorot kecuali di mode Belajar), "Dalilnya" (lipat),
  link kecil "Ubah data orang ini", tombol "Oke, paham". Tampil di kedua mode. Ahwal ditulis per kunci ahli waris,
  `perluCek` sampai diverifikasi tim keilmuan; baris "kasus ini" ditentukan dari jejak engine (FARDH.alasan / ASHABAH / HAJB), bukan ditebak UI.
- Saat langkah perhitungan terbuka, canvas menyorot orang yang disebut langkah itu (dari `Potongan` jenis `orang`)
  dan kolom tabel yang relevan; yang lain diredupkan.

Munasakhat: pohon menampilkan mayit berikutnya sebagai almarhum dengan keluarganya; pembagian = hasil akhir
(jami'ah); langkah perhitungan dikelompokkan per mayit (judul bagian `jelaskanMunasakhat`).

Bar bawah: ← Ubah data · Simpan file.

### Tur singkat
Coachmark bernomor (maks. 4–5 per layar) dengan Lewati / Lanjut. Elemen yang dijelaskan disorot lewat lapisan di
level halaman (lubang terang + garis pink), sisanya digelapkan; klik area gelap menutup tur. Hasil:
pohon, pembagian, pembulatan (bila ada), langkah perhitungan. Wizard: stepper, pertanyaan utama, bar bawah.
Keyboard: Esc menutup.

## Perubahan di luar `apps/web`

- `packages/explain`: `Bab` diberi field `tahap` (Tahap engine yang dijelaskannya) supaya canvas tahu kolom tabel
  mana yang disorot. Tidak ada perubahan narasi.
- `packages/engine`: tidak ada. (`hitungTirkah` diekspor bila belum.)

## Unit baru di `apps/web`

| Unit | Tanggung jawab |
|---|---|
| `src/konten/` | Semua teks edukasi & label sehari-hari (dengan `perluCek`). |
| `src/pohon/tataLetak.ts` | Graf → posisi node per generasi + segmen garis (fungsi murni, dites). |
| `src/pohon/Pohon.tsx` | Render pohon (mode isian dengan `+`, mode hasil dengan angka). |
| `src/hasil/ringkasan.ts` | HasilTampil → data sidebar/tabel/modal (pecahan dua bentuk, persen, adaTidakPas, kelas & nisbah dari jejak). Fungsi murni, dites. |
| `src/hasil/*.tsx` | Sidebar, kartu-kartu, tabel faraidh, modal orang, langkah perhitungan. |
| `src/sorot.ts` | Konteks React untuk sorot silang (id orang aktif + fokus langkah). |
| `src/tur/` | Mesin tur kecil + daftar langkah tur per layar. |
| `src/layar/wizard/*` | Kerangka wizard (stepper, bar bawah, validasi) + 5 langkah. |

`Kasus` naik ke `versi: 2`: tambah `rincianHarta?: Partial<Record<KategoriHarta, bigint>>`. `dariJson` tetap
menerima versi 1 (dimigrasi) dan merapikan `urutanWafat` saat dimuat (sisa temuan review sebelumnya).

## Test

- `tataLetak.test.ts`: generasi benar (orang tua di atas, anak di bawah, pasangan sebaris), garis menikah & anak
  lengkap untuk kasus prototipe dan M1.
- `ringkasan.test.ts`: angka kasus prototipe (ashl 24, tashih 72, 1/6 ↔ 12/72, persen, adaTidakPas true;
  C16-01 dengan harta 24 jt → adaTidakPas false), kelas & nisbah dari jejak, mode Belajar tidak membocorkan angka.
- Wizard: tidak bisa lanjut tanpa jenis kelamin / harta 0 / tanpa ahli waris; alasan tertulis.
- Integrasi C16-01 dan M1 tetap hijau.
- Smoke: beranda → Belajar → wizard → hasil dengan angka tersembunyi → Tampilkan jawaban.

## Tahap pengerjaan

1. Fondasi: konten, kerangka wizard + navigasi global, tur, Kasus v2.
2. Wizard langkah 1–3.
3. Langkah 4–5 (Daftar, Pohon isian, kondisi & munasakhat).
4. Layar hasil (pohon, tabel, sidebar, modal, langkah, sorot silang, pembulatan, mode Belajar).

## Di luar cakupan

Halaman Pusat belajar & Rujukan, isi dalil final (tim keilmuan), gaya visual baru, KHI, dzawil arham.
