# 07. SaaS lanjutan: lembaga dan monetisasi, alat ukur, rekomendasi perlakuan, ticketing (G8)

Induk: `00-induk.md` bagian 4 G8. Dasar: riset kelas 6 (monetisasi), 8 (R7–R9), 13a (D10); riset pasar bagian 4–8.
Prasyarat: G7 dipakai minimal satu dosen pilot. Perkiraan: 20–30 orang-hari.

Dokumen ini sengaja lebih ringkas daripada `02`–`06`: isinya akan berubah setelah pilot dan wawancara dosen/kaprodi,
jadi rinciannya ditulis ulang saat G8 dimulai. Yang ditetapkan di sini hanya **bentuk** dan **urutan**.

---

## 1. Lembaga dan monetisasi (fase P6; 10–15 hari)

### 1.1 Urutan yang murah dulu
1. **Hak akses sebagai data**: fungsi SQL `hak_fitur(p_fitur text, p_kelas uuid default null) returns jsonb` membaca paket
   aktif (pengguna atau lembaga pemilik kelas) dan mengembalikan `{ boleh, batas }`. UI dan edge function bertanya ke fungsi
   ini; tidak ada `if (pro)` tersebar dan tidak ada salinan aturan di TS. Konstanta "Gratis 20 pelajar" dari `06` bagian
   2.1 pindah ke sini.
2. **Lembaga**: tabel `lembaga`, `admin_lembaga`; `kelas.lembaga_id` (sudah disiapkan spec 5.1). Admin lembaga menyetujui
   pengajarnya sendiri (spec 5.4b) dan melihat rekap pemakaian (pelajar aktif per periode), bukan isian pelajar.
3. **Langganan**: tabel `langganan (pemilik, paket, mulai, selesai, batas)`; "pelajar aktif" = anggota aktif yang punya
   minimal satu kejadian tugas dalam periode (turunan dari data, bukan penghitung).
4. **Pembayaran, tahap 1 manual**: kampus biasanya membayar lewat invoice dan transfer (riset pasar 7, [Dugaan] mekanisme
   pengadaan). Admin membuat invoice (PDF) dan mengaktifkan langganan setelah dana masuk. Tanpa gerbang pembayaran dulu.
5. **Pembayaran, tahap 2 gerbang**: hanya bila Pengajar Pro perorangan cukup banyak. Halaman bayar milik penyedia
   (tidak ada data kartu di aplikasi), webhook `webhook-bayar` memverifikasi tanda tangan lalu mengaktifkan langganan;
   satu modul batas untuk penyedia (aturan batas eksternal).
6. **Undangan email + email transaksional**: satu modul batas untuk penyedia email; sekaligus membuka pemberitahuan
   retensi yang ditunda di `01` bagian 2.5.
7. **DPA** templat untuk lembaga (pemrosesan atas nama lembaga), ditinjau konsultan.

### 1.2 Harga (keputusan pemilik, setelah uji ke dosen dan kaprodi)
Usulan riset: publik gratis; Pengajar Gratis maks 20 pelajar (D2); Pengajar Pro ±Rp150.000 per semester; Lembaga
±Rp15.000–25.000 per pelajar aktif per semester; riset pasar menambah opsi paket prodi tetap ±Rp2,5–3 juta per semester
([Dugaan], belum diuji). Tanpa iklan. Angka disimpan di tabel paket, bukan di kode.

## 2. Alat ukur keberhasilan (fase P7, R8; 5–8 hari)

- **Ukuran belajar** (spec 4A.7): retensi pelajar, penyelesaian jujur (benar tanpa dibuka), tanda menebak, kesalahan
  berulang per konsep, gain tes awal/akhir per kelas. **Ukuran bisnis** (riset kelas R8): aktivasi pengajar, kelas aktif,
  pelajar aktif per lembaga, konversi Gratis → Pro, perpanjangan lembaga.
- Semuanya kueri/tampilan SQL atas tabel yang sudah ada sejak G3 (riwayat tidak hilang karena kejadian dikumpulkan sejak
  G1). Halaman di portal admin, hanya angka agregat tanpa identitas (UU PDP: tidak ada analitik pihak ketiga yang menerima
  data pribadi).
- Bila kueri lambat, baru tampilan termaterialisasi yang disegarkan `pg_cron` harian.

## 3. Rekomendasi perlakuan (D10, spec 5.4c lapis 4; 4–6 hari)

- Fungsi murni `rekomendasiPerlakuan(kelompokKesalahan, katalog)` di `@waris/latihan`: per kelompok pelajar dengan kolom/
  topik yang sama-sama salah → materi bab terkait, tugas susulan dari pola yang sama, soal untuk sesi langsung.
- Berbasis aturan yang terbaca; tiap saran menampilkan alasannya ("7 pelajar salah di kolom Asal masalah akhir pada soal
  'aul"). Pengajar yang memutuskan dan menerapkan dengan satu langkah (membuat draf tugas susulan). Tanpa label bernada
  vonis (spec 5.4c; UU PDP Pasal 10).

## 4. Ticketing dan dukungan (fase P8, R9; 5–8 hari)

Versi malas dulu, layanan pihak ketiga hanya bila volume menuntut:
1. **Laporkan masalah** di aplikasi (tautan di Profil dan di layar galat): layar, versi build, uraian, tangkapan layar
   opsional. Data kasus **tidak** ikut kecuali pengguna mencentang. Tabel `laporan` append-only + status
   (`baru`, `ditangani`, `selesai`) dan balasan.
2. Antrean di portal admin dengan saring status dan paket (lembaga lebih dulu). SLA per paket ditulis di tabel paket.
3. **Basis pengetahuan** memakai jenis konten `faq` yang sudah ada.
4. **Halaman status** memakai layanan halaman status pihak ketiga yang gratis; tidak dibangun sendiri.
5. Bila tiket > ±20 per pekan, pindah ke layanan helpdesk lewat satu modul batas; tabel `laporan` menjadi sumber impor.

## 5. Sesudah G8
Mode cerita AI (urutan pemilik), memakai ulang penghubung LLM, kuota, dan persetujuan `ai_konteks` dari AMIN.
