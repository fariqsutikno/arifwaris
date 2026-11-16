# Riset UX wizard Hitung: 20 kritik pemilik (2026-11-16)

Satu dokumen yang terus tumbuh: tahap 0–4 (kendala, pengguna, JTBD, HMW, audit) di sini; mockup per cluster
ditautkan di akhir tiap cluster setelah disetujui. Sumber: tangkapan layar pemilik di langkah Almarhum → Periksa,
plus pembacaan kode (lokasi disebut per temuan).

## 0. Kendala

- Web React + gaya Logivo (krem, hero hijau gelap, ubin pastel, sudut besar, bayangan lembut). Ikon SVG, bukan emoji.
- Aksi sekunder = tautan teks; tombol berbingkai hanya untuk aksi utama form/dialog.
- Status isian wajib di bar bawah, tombol Lanjut tidak dinonaktifkan (keputusan audit isian sebelumnya).
- Aturan fikih tidak boleh berubah. Pertanyaan yang ditanyakan ditentukan engine (mis. calon ibu janin [R13-1]).
- Teks lewat kamus diksi (`t()`), bukan ditulis langsung di kode.
- Mockup: HTML statis, tanpa backend.

## 1. Pengguna

**Pengguna utama:** anggota keluarga awam (istri atau anak almarhum) yang mengisi kasus nyata, biasanya di HP,
sekali seumur kejadian, dalam keadaan berduka atau sedang rapat keluarga. Bukan ahli faraidh, tidak hafal istilah.
Toleransi rendah terhadap form panjang dan kalimat hukum.

**Pengguna kedua:** pelajar/santri (mode latihan), paham istilah, ingin cepat.

**Kebiasaan sekarang:** bertanya ke ustadz atau ahli waris tertua, menggambar silsilah di kertas, menghitung
dengan kalkulator HP.

**Keluhan dalam kata pemilik (mewakili pengguna):** "bingung mana yang perlu diperbaiki", "kata-kata rumit,
terlalu panjang", "ilustrasi meninggalnya ga jelas", "ga masuk secara UX", "absurd".

**Kosakata pengguna**

| Pakai | Hindari |
|---|---|
| almarhum / almarhumah | pewaris, mayit (di layar awam) |
| istri almarhum, anak almarhum | Istri, Anak laki-laki 1 (tanpa "almarhum") saat menyebut diri sendiri |
| kakek, nenek (dari pihak ayah/ibu) | Kerabat, Belum bernama |
| meninggal lebih dulu / meninggal sesudahnya | wafat sebelum/sesudah dibagi, babak |
| hilang tanpa kabar | mafqud |
| cerai | talak bain |
| sedang hamil | dalamKandungan, janin (boleh di penjelasan) |
| tidak wajib | boleh dikosongkan / boleh kosong (dua istilah untuk hal sama) |

## 2. JTBD

1. **Saat** baru kehilangan anggota keluarga, **saya ingin** memasukkan harta dan keluarga dengan benar,
   **supaya** pembagian adil dan tidak ada yang terlewat. Ukuran: selesai tanpa salah isi, tanpa bertanya.
2. **Saat** ada keluarga yang meninggal berurutan, **saya ingin** menceritakan siapa meninggal lebih dulu,
   **supaya** hitungan berlapis tetap benar. Ukuran: urutan bisa diisi tanpa tahu istilah munasakhat.
3. **Saat** sebuah isian salah atau kurang, **saya ingin** langsung tahu yang mana, **supaya** bisa lanjut.
   Ukuran: dari klik Lanjut ke isian yang salah < 2 detik.
4. **Saat** memeriksa sebelum menghitung, **saya ingin** melihat ringkasan yang bisa saya cocokkan dengan
   ingatan saya, **supaya** yakin hasilnya benar.

## 3. Cluster masalah

Dua puluh kritik dikelompokkan menurut akar masalah, bukan menurut layar. Kode temuan dipakai di mockup.

### C1. Sistem tidak memberi tahu apa yang terjadi (umpan balik & validasi)

| Kode | Temuan | Bukti / akar |
|---|---|---|
| C1-1 | Tambah cepat (+10 jt) tidak terasa menambah; pemilik menekan berkali-kali sampai 50 jt | Angka di kotak berubah tanpa gerak atau keterangan "ditambah 10 jt"; chip tidak menunjukkan total sementara |
| C1-2 | Lanjut di langkah Harta tidak menandai isian yang kosong | Pesan hanya di bar bawah ("Isi total harta…"), kotak tidak merah, tidak digulir/difokus |
| C1-3 | Sama di langkah Keluarga dan sesudahnya | Status "5 bagian lagi" di bar bawah tanpa menunjuk bagian mana |

HMW: Bagaimana agar setiap aksi langsung terlihat akibatnya, dan setiap kekurangan langsung tertunjuk?

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Tandai isian salah: bingkai merah + pesan di bawah isian + gulir dan fokus ke yang pertama; bar bawah tetap | tinggi | tinggi | sedang |
| B. Ringkasan galat di atas form ("2 hal belum diisi" + tautan ke tiap isian) | sedang | tinggi | sedang |
| C. Tambah cepat: angka berdenyut + teks kecil "+10 jt → Rp 50.000.000" sesaat | tinggi | sedang | kecil |
| D. Ganti tambah cepat jadi pilihan nilai ("10 jt / 50 jt / 100 jt") yang menimpa, bukan menambah | tinggi | sedang | kecil |

Rekomendasi: A + C (atau D). Prinsip: **kekurangan ditunjuk di tempatnya, bukan hanya diumumkan.**

### C2. Hierarki visual dan komponen tidak konsisten

| Kode | Temuan | Bukti / akar |
|---|---|---|
| C2-1 | "Ada utang, biaya pemakaman, atau wasiat?" lebih besar dari yang lain | Tombol Tidak ada/Ada memakai `.kartu-pilihan` font 22px display; tidak ada alasan penekanan |
| C2-2 | "Tahun wafatnya" lebih besar dari label lain | **Regresi dari perbaikan saya tadi**: aturan `.isian-tahun>span` 17px berlaku global, bukan hanya di langkah Almarhum |
| C2-3 | Opsional ditulis dua cara: "(boleh dikosongkan)" dan "Boleh kosong." | Dua kunci diksi untuk konsep sama |
| C2-4 | Lebar opsi "sudah dibagi" tidak sama dengan isian di atasnya | `.daftar-pintu` max-width 520px, isian 720px |
| C2-5 | Opsi terpilih berwarna hijau, terlalu ramai | Pemilik ingin cukup bergaris (outline) |
| C2-6 | Navigasi bawah langkah Keluarga beda: "Keluarga: 5 bagian lagi · Ke Periksa ›" berupa tautan, langkah lain tombol "Lanjut: X" | Komponen bar bawah berbeda per langkah |
| C2-7 | Dialog hapus: Batal tombol hitam (utama), Hapus tombol putih; urutan Batal kiri | Aksi merusak tidak ditandai, tombol utama justru Batal |
| C2-8 | Pertanyaan hamil berupa judul kecil huruf kapital abu, berbeda dengan pertanyaan lain | `.judul-bagian-kecil` tanpa override |

HMW: Bagaimana agar ukuran dan warna hanya berbeda bila maknanya berbeda?

Ide: (A) satu set token pertanyaan: semua pertanyaan 17px semibold, semua pilihan ya/tidak = pil kecil yang sama,
semua pilihan ganda = daftar radio yang sama; (B) audit komponen per langkah, ganti varian lokal dengan komponen
bersama; (C) bar bawah satu pola di semua langkah: kiri "Kembali", kanan tombol "Lanjut: X", status di atas tombol.
Dialog hapus: tombol "Hapus" merah di kanan (aksi), "Batal" tautan/teks di kiri; fokus awal ke Batal.
Rekomendasi: A + C, ditambah aturan dialog merusak. Prinsip: **satu makna, satu rupa.**

### C3. Bahasa sistem, bukan bahasa pengguna

| Kode | Temuan | Bukti / akar |
|---|---|---|
| C3-1 | Dialog hapus: "Pernikahannya dengan almarhum ikut dilepas; Almarhum tetap ada." | Kalimat menjelaskan model data |
| C3-2 | "Kerabat" muncul di kisah, dropdown, pohon | `labelOrangChecklist` jatuh ke "Kerabat" untuk orang tanpa kunci peran (kakek/nenek penghubung yang dibuat otomatis saat orang tua meninggal lebih dulu) |
| C3-3 | "Belum bernama" di pohon | Simpul penghubung tanpa nama memakai label kosong, bukan hubungannya |
| C3-4 | "Saya Istri" ambigu (istri siapa?) | Opsi bagian Kamu menyebut peran tanpa "almarhum" |
| C3-5 | Teks putih "Hari ini" menimpa kalimat di kisah | `.tahun-besar` dipakai untuk label non-tahun, ditimpa di atas paragraf |

HMW: Bagaimana agar setiap orang disebut dengan hubungannya ke almarhum, dalam kalimat pendek?

Ide: (A) satu fungsi sebutan: "kakek (ayah dari ayah almarhum)", tidak pernah "Kerabat"; (B) kalimat dialog
dari akibat yang dirasakan pengguna: "Istri 2 akan dihapus dari daftar keluarga."; (C) bagian Kamu:
"Saya istri almarhum", "Saya anak almarhum (Anak laki-laki 1)"; (D) hapus label "Hari ini" bergaya tahun,
ganti penanda linimasa biasa "Sekarang".
Rekomendasi: semua (A–D), murah dan saling lepas. Prinsip: **sebut orang lewat hubungannya ke almarhum.**

### C4. Urutan pertanyaan tidak mengikuti cara orang berpikir

| Kode | Temuan | Bukti / akar |
|---|---|---|
| C4-1 | "Lainnya" (hilang tanpa kabar, cerai) jarang diklik, tapi selalu tampil sebagai pilihan sejajar | Empat pil keadaan + "Lainnya" membuka dua lagi |
| C4-2 | "Tahun wafatnya" lalu "atau pilih: sebelum/sesudah" membingungkan | Dua cara menjawab satu pertanyaan, ditampilkan sekaligus; yang lebih mudah (sebelum/sesudah) justru di bawah |
| C4-3 | Pertanyaan hamil: "ada yang sedang hamil di keluarga ini?" tidak menyebut siapa; tampil walau "cuma punya anak laki-laki" | Engine hanya menanyakan bila ada perempuan hidup yang janinnya mewarisi [R13-1]. Contoh pemilik: istri almarhum tetap calon (janinnya anak almarhum), jadi pertanyaannya sah, tapi kalimatnya tidak menyebut "istri" sehingga terasa acak |
| C4-4 | Materi Belajar yang menyebut "Lainnya"/mafqud perlu ikut disesuaikan bila alur berubah | Perlu dicek di konten |

HMW: Bagaimana agar pertanyaan jarang muncul hanya saat relevan, dan tiap pertanyaan punya satu cara menjawab?

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Keadaan = 3 pil (Masih hidup / Sudah meninggal / Belum tahu); "hilang tanpa kabar" jadi jawaban di bawah "Belum tahu", "cerai" jadi pertanyaan terpisah hanya untuk pasangan | tinggi | tinggi | sedang |
| B. Pertanyaan lanjutan di akhir langkah: "Ada yang hilang tanpa kabar? Ada pasangan yang sudah cerai?" | tinggi | sedang | kecil |
| C. Meninggal: tanya dulu "Lebih dulu atau sesudah almarhum?"; tahun hanya tautan "Ingat tahunnya?" | tinggi | tinggi | kecil |
| D. Hamil: tanya per orang yang mungkin: "Apakah istri almarhum sedang hamil waktu almarhum meninggal?" di kartu istri itu sendiri | tinggi | tinggi | sedang |

Rekomendasi: A (atau B) + C + D. Prinsip: **satu pertanyaan, satu cara menjawab; pertanyaan jarang hanya muncul untuk orang yang mungkin.**

### C5. Pohon keluarga dan ilustrasi tidak terbaca

| Kode | Temuan | Bukti / akar |
|---|---|---|
| C5-1 | Garis dua istri berantakan (garis menembus kotak Istri 1) | Garis pernikahan ditarik lurus dari almarhum ke tiap istri melewati istri pertama |
| C5-2 | Simpul pucat "Belum bernama" saat orang tua meninggal lebih dulu | Simpul penghubung kakek/nenek dibuat otomatis, digambar pucat, label kosong |
| C5-3 | Ilustrasi kisah wafat (nama dicoret, "kakekmu") tidak menggambarkan meninggal | Coretan = "salah/batal", bukan "wafat"; pohon di kisah memakai sebutan dari sudut "kamu" tiba-tiba |

HMW: Bagaimana agar pohon terbaca seperti silsilah di kertas?

Ide: (A) pasangan ganda: almarhum di tengah, istri di kiri-kanan atau berjajar dengan garis bawah bersama;
(B) simpul penghubung disembunyikan kecuali punya anak yang relevan, atau diberi nama hubungan "Kakek (dari ayah)";
(C) wafat = simbol baku silsilah (garis miring/latar abu + "wafat 1990" atau "meninggal lebih dulu"), bukan coretan;
(D) kisah memakai sebutan yang sama dengan pohon (dari almarhum), sudut "kamu" hanya di bagian Kamu.
Rekomendasi: A + B + C + D.

### C6. Layar Periksa: tata letak dan isi

| Kode | Temuan | Bukti / akar |
|---|---|---|
| C6-1 | Form "Tambah peristiwa" rapat, select sempit, tombol dan "Batal" menempel | Gaya form generik tanpa jarak; tiga select tanpa urutan berpikir |
| C6-2 | Dropdown "Siapa?" berisi banyak "Kerabat" | Akibat C3-2 |
| C6-3 | Kisah harta: dua baris "? · Kerabat wafat, sebelum almarhum." | Peristiwa tanpa tahun ditampilkan "?" dan sebutan Kerabat |

HMW: Bagaimana agar Periksa terasa seperti membaca ulang cerita keluarga sendiri?

Ide: (A) kisah = linimasa sederhana, satu kalimat per peristiwa dengan sebutan hubungan, tanpa "?";
(B) Tambah peristiwa sebagai dialog langkah demi langkah ("Apa yang terjadi?" → "Pada siapa?" → "Kapan?") dengan
pilihan berupa daftar radio, bukan select; (C) peristiwa tanpa tahun diurutkan dengan kata "lebih dulu dari…".
Rekomendasi: A + B + C.

## 4. Urutan pengerjaan yang diusulkan

1. **C2-2 (regresi saya)** diperbaiki langsung, tanpa mockup.
2. C3 (bahasa) dan C2 (konsistensi): mockup satu halaman "sebelum/sesudah" per langkah.
3. C1 (validasi & umpan balik): mockup dua alternatif.
4. C4 (urutan pertanyaan keadaan & hamil): mockup dua–tiga alternatif. Paling berdampak, paling perlu keputusanmu.
5. C5 (pohon) dan C6 (Periksa): mockup alternatif.

## 5. Asumsi dan pertanyaan terbuka

- Asumsi: pengguna utama mengisi di HP; mockup dirancang HP dulu, lalu laptop.
- Asumsi: aturan "status di bar bawah, Lanjut tidak dinonaktifkan" tetap; penandaan merah menambah, bukan mengganti.
- Pertanyaan (C4-1): "hilang tanpa kabar" dan "cerai" boleh dipindah jadi pertanyaan lanjutan, atau tetap di kartu orang tapi lebih tersembunyi?
- Pertanyaan (C1-1): tambah cepat tetap menambah (+10 jt), atau diganti pilihan nilai yang menimpa?
