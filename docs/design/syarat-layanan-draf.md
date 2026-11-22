# Syarat layanan (konsep, belum final)

Status: konsep untuk ditinjau pemilik dan penasihat hukum. Belum terhubung ke UI. Bila disetujui, pasang sebagai layar `Syarat` dan jenis persetujuan baru (saat ini tabel `persetujuan` hanya mengenal `kebijakan_privasi`, `papan_peringkat`, `push`, `ai_konteks`, `usia_18`, `kelas_berbagi_nilai`; syarat layanan bisa digabung ke dialog kebijakan privasi, atau tambah jenis `syarat_layanan` lewat migrasi). Bagian bertanda `[DIISI PEMILIK]` tidak boleh dikarang.

## 1. Tentang layanan
Platform Waris adalah alat bantu hitung dan belajar faraidh. Menggunakan layanan, termasuk masuk dengan akun Google, berarti kamu menyetujui syarat ini dan Kebijakan Privasi.

## 2. Hasil hitung bukan fatwa dan bukan putusan hukum
- Hasil mengikuti madzhab yang kamu pilih (default Syafi'i) dan sumber yang ditampilkan di tiap langkah. Itu alat bantu belajar dan perhitungan awal, bukan fatwa, bukan putusan pengadilan, bukan nasihat hukum.
- Untuk pembagian waris yang sebenarnya, rujuk ulama atau lembaga fatwa, serta pengadilan agama atau notaris sesuai hukum yang berlaku bagimu. Hukum positif (mis. KHI) ditandai terpisah dari fikih.
- Kasus yang aturannya belum didukung atau datanya kurang akan ditandai (bukan ditebak). Hasilmu hanya sebaik data yang kamu isi.
- Kami tidak bertanggung jawab atas keputusan yang kamu ambil hanya berdasarkan hasil aplikasi tanpa memeriksanya ke pihak berwenang.

## 3. Akun
- Masuk lewat Google. Kamu bertanggung jawab atas aktivitas di akunmu dan menjaga akses akun Google-mu.
- Usia: lihat bagian Anak di Kebijakan Privasi (di bawah 18 tahun perlu persetujuan orang tua atau wali).
- Kamu bisa menghapus akun kapan saja di menu Profil. Akun penulis atau pemeriksa konten dihapus lewat pengelola.

## 4. Pemakaian yang wajar
Kamu setuju tidak:
- meretas, menguji kerentanan tanpa izin, atau mengganggu layanan;
- memakai skrip atau otomasi untuk mengirim percobaan soal, XP, atau streak (server membatasi 30 percobaan per menit dan 2000 per hari per akun, dan Ujian hanya menerima satu Kirim per sesi);
- memakai akun orang lain, atau mengakali papan peringkat;
- memakai nama tampilan yang menyinggung, mengandung SARA, atau menyamar sebagai orang lain;
- membagikan lewat tautan kasus yang memuat data pribadi orang lain tanpa hak untuk itu.

Kami dapat menyetel ulang XP atau streak yang diperoleh dengan cara di atas, mengganti nama tampilan yang melanggar, atau menangguhkan akun. Bila akun ditangguhkan, kamu tetap bisa meminta unduhan data dan penghapusan akun lewat kontak.

## 5. Konten kami dan konten kamu
- Materi, soal, penjelasan, dan tampilan milik pengelola atau pemberi lisensinya. Kamu boleh memakainya untuk belajar pribadi. Menyalin massal atau menjual ulang memerlukan izin. `[DIISI PEMILIK: lisensi konten, mis. hak cipta penuh atau CC BY-NC-SA, dan rujukan kitab yang dikutip]`.
- Kasus yang kamu simpan atau bagikan tetap milikmu. Dengan membagikan lewat tautan, kamu mengizinkan layanan menampilkannya kepada orang yang punya akses sesuai pilihanmu (tautan, atau email tertentu).

## 6. Papan peringkat, notifikasi, dan fitur opsional
Ikut papan peringkat dan notifikasi bersifat pilihan dan bisa kamu matikan kapan saja di Profil (lihat Kebijakan Privasi).

## 7. Ketersediaan dan perubahan layanan
Layanan diberikan apa adanya. Kami berusaha menjaganya tetap tersedia dan benar, tetapi dapat ada gangguan, pemeliharaan, atau perubahan fitur. Fitur dapat ditambah, diubah, atau dihentikan. Bila ada perubahan besar yang memengaruhi datamu, kami memberi tahu lebih dulu. `[DIISI PEMILIK: apakah layanan gratis seterusnya atau ada paket berbayar; bila ada, tambahkan bagian harga dan pengembalian dana]`.

## 8. Batas tanggung jawab
Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung, kehilangan data akibat gangguan di luar kendali kami, atau akibat keputusan berdasarkan hasil hitung. Ini tidak menghilangkan hak yang tidak bisa dikesampingkan menurut hukum, termasuk hak pelindungan data pribadi (UU No. 27 Tahun 2022) dan hak konsumen.

## 9. Perubahan syarat
Bila syarat berubah bermakna, kamu diminta menyetujui versi baru sebelum melanjutkan (mekanisme versi seperti kebijakan privasi). Menolak berarti berhenti memakai akun; kamu tetap bisa menghapus akun dan datamu.

## 10. Hukum dan sengketa
Syarat ini tunduk pada hukum Republik Indonesia. Sengketa diupayakan selesai secara musyawarah lebih dulu. `[DIISI PEMILIK: pengadilan negeri yang berwenang, atau badan penyelesaian lain]`.

## 11. Kontak
`[DIISI PEMILIK: nama pengelola/lembaga dan email; sama dengan kontak di Kebijakan Privasi]`.

## Catatan untuk peninjau
- Klausul kuota dan Ujian di bagian 4 dicocokkan ke `supabase/migrations/20261121000002_catat_percobaan.sql`; ubah teks bila angka berubah.
- Keputusan pemilik yang belum ada: lisensi konten, model harga, pengadilan, kontak, batas usia (18 diusulkan).
- Klausul penangguhan dan reset XP belum punya mekanisme di kode (manual lewat admin); jangan dijanjikan otomatis.
