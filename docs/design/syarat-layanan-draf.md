# Syarat layanan (konsep, belum final)

Status: sudah dipasang di aplikasi sebagai layar `#/syarat` (diksi `syarat.*`), ditautkan dari dialog persetujuan (versi kebijakan 3). Teks resmi = diksi; berkas ini hanya catatan. Diperkaya dari referensi pemilik.

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
- Materi, soal, penjelasan, dan tampilan milik pengelola atau pemberi lisensinya. Kamu boleh memakainya untuk belajar pribadi. Menyalin massal atau menjual ulang memerlukan izin. Seluruh hak cipta dilindungi..
- Kasus yang kamu simpan atau bagikan tetap milikmu. Dengan membagikan lewat tautan, kamu mengizinkan layanan menampilkannya kepada orang yang punya akses sesuai pilihanmu (tautan, atau email tertentu).

## 6. Papan peringkat, notifikasi, dan fitur opsional
Ikut papan peringkat dan notifikasi bersifat pilihan dan bisa kamu matikan kapan saja di Profil (lihat Kebijakan Privasi).

## 7. Ketersediaan dan perubahan layanan
Layanan diberikan apa adanya. Kami berusaha menjaganya tetap tersedia dan benar, tetapi dapat ada gangguan, pemeliharaan, atau perubahan fitur. Fitur dapat ditambah, diubah, atau dihentikan. Bila ada perubahan besar yang memengaruhi datamu, kami memberi tahu lebih dulu. Layanan masih berstatus beta dan gratis; fitur dan data dapat berubah, dan kami tidak menjamin ketersediaan terus-menerus. Fitur berbayar akan ditawarkan kemudian sesuai ketentuan yang berlaku: harga dan syaratnya diumumkan sebelum berlaku, dan kamu tidak dikenai biaya tanpa persetujuanmu. Pengembalian dana mengikuti ketentuan yang diumumkan saat paket dibuka dan hukum yang berlaku..

## 8. Batas tanggung jawab
Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung, kehilangan data akibat gangguan di luar kendali kami, atau akibat keputusan berdasarkan hasil hitung. Ini tidak menghilangkan hak yang tidak bisa dikesampingkan menurut hukum, termasuk hak pelindungan data pribadi (UU No. 27 Tahun 2022) dan hak konsumen.

## 9. Perubahan syarat
Bila syarat berubah bermakna, kamu diminta menyetujui versi baru sebelum melanjutkan (mekanisme versi seperti kebijakan privasi). Menolak berarti berhenti memakai akun; kamu tetap bisa menghapus akun dan datamu.

## 10. Hukum dan sengketa
Syarat ini tunduk pada hukum Republik Indonesia. Sengketa diupayakan selesai secara musyawarah lebih dulu. Bila musyawarah gagal, sengketa diselesaikan di pengadilan negeri yang berwenang menurut hukum Indonesia..

## 11. Kontak
ArifWaris Team, cs@arifwaris.com (sama dengan kontak di Kebijakan Privasi)..

## Catatan untuk peninjau
- Klausul kuota dan Ujian di bagian 4 dicocokkan ke `supabase/migrations/20261121000002_catat_percobaan.sql`; ubah teks bila angka berubah.
- Pengelola masih "ArifWaris Team" (belum badan hukum); ganti nama pengendali di bagian 11 dan di Kebijakan Privasi bila nanti berbadan hukum.
- Klausul penangguhan dan reset XP belum punya mekanisme di kode (manual lewat admin); jangan dijanjikan otomatis.
