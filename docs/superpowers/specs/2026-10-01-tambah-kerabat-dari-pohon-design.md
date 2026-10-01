# Tambah kerabat dari pohon (Tahap 4)

Memotong bagian 5.1 dan 5.2 dari `2026-10-01-perjalanan-keresahan-design.md` menjadi satu pekerjaan yang bisa
dibangun sekarang. Rencana tahapnya: `docs/design/rencana-pengalaman-dan-fitur.md`, Tahap 4.

## 1. Tujuan dan batas

Pengguna mengisi keluarga dengan **mengetuk orang di pohon**, tidak hanya lewat daftar ±. Pohon di langkah
Keluarga berubah dari hanya-baca menjadi jalur input. Daftar ± tetap ada; keduanya mengubah graf yang sama.

**Masuk cakupan**
- Menu per orang: + Orang tua, + Pasangan, + Anak, + Saudara, Ubah, Hapus (spec 5.1).
- Tautan untuk menambah mertua, menantu, ipar, dst.: nama hubungan yang dicari, jalurnya disusun dari aksi dasar (spec 5.2).
- Tempat: langkah **Keluarga** wizard, untuk almarhum pertama maupun keluarga lanjutan.

**Di luar cakupan** (dan alasannya)
- Anak angkat/asuh (spec 5.3): butuh `Kasus.hubunganLain`, yang lahir di Tahap 5.
- `sebutanHubungan` di semua tempat dan tata letak berlapis dengan simpul nikah (P1–P9): Tahap 3.
- Tambah dari Hasil, "Batalkan perubahan terakhir", mode coba-coba: Tahap 7.
- Engine **tidak diubah**. Sudah dicek: graf dengan mertua (orang tua istri) menghasilkan `OK`.

Konsekuensi dari batas Tahap 3: pohon memakai tata letak yang ada, jadi jaminan "pohon tidak lompat" (P7) tidak
diuji formal di sini. Yang dijaga: urutan orang yang sudah ada tidak diacak oleh penambahan.

## 2. Modul fungsi murni: `apps/web/src/kerabatPohon.ts`

Tanpa React, tanpa I/O. Hanya menyusun graf lewat pembangun yang sudah ada: `tambahKerabat`, `opsiRelasi`
(engine `graf.ts`), serta `pastikanOrangTua`, `tambahSaudara`, `tambahOrang`, `hapusAhliWaris`, `ubahNama`
(`checklist.ts`; yang belum diekspor diekspor). Tidak ada aturan fikih di sini.

```ts
type Aksi = 'orangTua' | 'pasangan' | 'anak' | 'saudara';
aksiTersedia(graf, idOrang): Aksi[]                       // + Orang tua hilang bila ayah dan ibu sudah terisi, dst.
tambahDariOrang(graf, idOrang, aksi, masukan): { graf, idBaru }
dampakHapus(graf, idOrang): { ikutTerhapus: IdOrang[]; jadiPenghubung: IdOrang[] }
```

`masukan` per aksi (satu layar, spec 5.1):

| Aksi | Masukan | Pertanyaan tambahan (hanya bila perlu) |
|---|---|---|
| orangTua | `ayah` atau `ibu` (yang masih kosong) | tidak ada |
| pasangan | nama opsional; jenis kelamin dari orangnya | batas 4 istri [R04-3] dipatuhi `opsiRelasi` |
| anak | nama opsional, jenis kelamin | "Dari istri/suami yang mana?" bila pasangan > 1, tambah pilihan "lainnya, tidak dicatat" |
| saudara | nama opsional, jenis kelamin | "Satu ayah dan ibu / satu ayah saja / satu ibu saja" (`jalur`) |

Kesalahan masukan (relasi tak tersedia, batas istri) = `throw`, sama seperti `tambahAhliWaris`; UI menampilkannya
lewat pola `coba()` yang sudah dipakai `LangkahAhliWaris`.

## 3. Nama hubungan sebagai jalur

`HUBUNGAN: Record<KunciHubungan, Jalur>` di `kerabatPohon.ts`. Satu jalur = deretan langkah aksi dasar dari
pusat P. Langkah yang melewati orang yang belum ada membuat **penghubung** (orang wafat tanpa nama, sudah
dikenal engine dan UI). Langkah yang melewati orang yang ada dan bisa lebih dari satu bertanya **jangkar**.

| Nama hubungan | Jalur | Jangkar ditanyakan |
|---|---|---|
| Kakek, nenek (dari ayah / ibu) | orangTua → orangTua | tidak |
| Buyut | orangTua ×3 | sisi |
| Cucu, cicit | anak ×2 / ×3 | anak/cucu yang mana |
| Saudara kandung / seayah / seibu | saudara (`jalur`) | tidak |
| Paman, bibi (dari ayah / ibu) | orangTua → saudara | tidak |
| Keponakan | saudara → anak | saudara yang mana |
| Sepupu | orangTua → saudara → anak | paman/bibi yang mana |
| **Mertua** | pasangan → orangTua | pasangan yang mana (bila > 1) |
| **Menantu** | anak → pasangan | anak yang mana |
| **Besan** | anak → pasangan → orangTua | menantu yang mana |
| **Ipar** | pasangan → saudara, atau saudara → pasangan | "saudara dari pasangan" / "pasangan dari saudara", lalu orangnya |
| Cucu menantu | cucu → pasangan | cucu yang mana |
| **Anak tiri** | pasangan → anak (orang tua lain bukan P) | pasangan yang mana |
| Ayah/ibu tiri | orangTua → pasangan (bukan orang tua P yang lain) | orang tua yang mana |
| **Saudara tiri** | lihat catatan | ditanya dulu |
| Mantan istri/suami | pasangan, status `talakBain` | tidak |

Catatan **saudara tiri**: di Indonesia kata ini sering dipakai untuk saudara seayah atau seibu, dan mereka
**ahli waris**. Selalu tanya "Ada ayah atau ibu yang sama?" dulu. Ya → saudara seayah/seibu. Tidak → ayah/ibu
tiri → anak.

Jangkar diambil dari graf; pilihan terakhir selalu "orang lain, belum dicatat" (dibuat sebagai penghubung).

`selesaikanJalur(graf, idPusat, kunciHubungan, jawaban): { graf, idBaru } | { perluJangkar: Pertanyaan }`:
fungsi murni; UI memanggilnya berulang sampai tidak ada pertanyaan.

**Nama wajib untuk non-ahli-waris.** Sebutan umum (`sebutanHubungan`) belum ada (Tahap 3), jadi kotak mertua,
besan, ipar, anak tiri, dst. akan tampil "Kerabat" bila tanpa nama. Karena itu dialog menandai nama **wajib**
untuk hubungan yang hasilnya bukan ahli waris; untuk ahli waris tetap opsional. Daftar "non-ahli-waris" ditulis
sebagai properti tiap jalur di `HUBUNGAN` (data penyajian, bukan hukum): `adaWaris: boolean`, dites terhadap engine.
Saat Tahap 3 datang, wajib-nama ini bisa dilonggarkan.

## 4. Tampilan

- **Pohon interaktif di langkah Keluarga.** `PanggungPohon` memakai `PohonDasar` dengan `saatPilih`
  (sudah mendukung node berupa tombol). Di langkah lain pohon tetap hanya-baca. Node penghubung bisa diketuk
  untuk diberi nama (P8).
- **Menu orang** (`MenuOrang.tsx`): panel kecil yang naik dari kotak yang diketuk, berisi tautan teks
  (keputusan pengguna 2026-09-28: aksi sekunder = teks/tautan, bukan tombol berbingkai). Ditutup dengan Esc
  atau ketuk di luar. Fokus kembali ke kotaknya.
- **Dialog tambah** (`DialogTambahOrang.tsx`): satu layar, pola `DialogKeadaan`. Tombol hanya Simpan/Batal.
  Pertanyaan tambahan (istri mana, jalur saudara, jangkar) tampil sebagai pilihan di layar yang sama bila perlu.
- **Ubah**: nama dan jenis kelamin (bila `bolehUbahJenisKelamin`), dan keadaan lewat `DialogKeadaan` yang sudah ada.
- **Hapus**: konfirmasi yang menyebut `dampakHapus`: siapa yang ikut terhapus, siapa yang tetap sebagai
  penghubung karena masih punya keturunan.
- **Tautan "Tambah mertua, menantu, ipar, dll."**: di bawah pohon, membuka daftar nama hubungan yang bisa
  dicari; pusatnya orang yang terakhir diketuk, bawaannya almarhum bagian yang sedang diisi.
- **Orang baru** muncul memudar masuk (CSS, mati bila gerak dikurangi); garis mengikuti. Tanpa suara (Tahap 0
  belum memutuskan sakelar suara).
- **Aksesibilitas**: kotak pohon fokus-keyboard, Enter membuka menu; menu bisa dinavigasi panah. Daftar ±
  menjadi padanan untuk pembaca layar (sudah ada).
- **Kata**: teks baru tidak memakai kata "kerabat" (membingungkan bila berulang). Pakai "orang", "keluarga",
  atau nama hubungan yang konkret (mertua, ipar, anak tiri). Judul menu dan dialog menyebut orangnya
  ("Tambah anak untuk Budi"). Teks lama yang memuat "kerabat" di luar fitur ini (mis. tombol "Kerabat lain" di
  daftar ±, label cadangan "Kerabat") tidak diubah di sini; dicatat untuk keputusan terpisah.
- **Teks**: semua kalimat baru lewat `pnpm diksi:tambah`, bukan hardcode; kunci diawali `hitung.pohon.`.

## 4a. Keseimbangan pohon (lebar ke samping dibatasi)

Menambah mertua, besan, dan ipar melebarkan baris generasi. Pohon harus **tumbuh ke bawah dan terbagi dua sisi,
bukan memanjang ke samping**. Syarat ini tertulis sebagai invarian pada `tataLetak()` (fungsi murni) dan dites
pada fixture; bukan hanya dinilai dari tampilan.

| # | Syarat | Cara |
|---|---|---|
| B1 | Tidak ada baris tampilan lebih lebar dari `BATAS_PER_BARIS` (6) node. | Pembungkus rata yang kini hanya untuk anak berlaku untuk **semua** baris; 7 → 4+3, 12 → 6+6. |
| B2 | Dua sisi seimbang. Keluarga asal pasangan (mertua, besan, ipar) ditaruh di **sisi pasangannya**, keluarga sedarah di sisi lain; selisih jumlah node kiri dan kanan pusat ≤ 2 bila memungkinkan. | Urutan dalam baris: sedarah, pusat, pasangan, lalu keluarga asal pasangan; bukan sekadar rata-rata indeks. |
| B3 | Anak berpusat di bawah orang tuanya; satu keluarga tidak terpecah oleh keluarga lain di barisnya. | Kelompok keluarga diurutkan sebagai satu blok. |
| B4 | Lebar total pohon tidak melebihi lebar panggung: bila lebih, diperkecil sampai batas keterbacaan (skala ≥ 0.6), lalu bagian terluar dilipat ("+3 orang", ketuk untuk membuka). | Memakai `PratinjauPohon`; lipatan hanya untuk cabang yang seluruhnya tidak dapat diketuk untuk ditambah. |
| B5 | Menambah satu orang tidak mengubah urutan relatif orang lain di baris yang sama. | Tes: urutan sebelum ⊆ urutan sesudah. |

Yang **tidak** dijanjikan di sini: nol garis bersilangan dan tata letak simpul nikah (Tahap 3, P5/P6). Tes B1–B5
memakai galeri fixture kecil: keluarga biasa, poligami 2 istri, mertua dua sisi, besan, 7 saudara, dan 4
generasi. Hasilnya juga dilihat di lebar HP (375) dan desktop lewat tangkapan layar sebelum dinyatakan selesai.

## 5. Tes

1. `kerabatPohon.test.ts`: tiap aksi dasar menghasilkan graf yang benar; batas istri; `dampakHapus` untuk orang
   dengan dan tanpa keturunan.
2. **Satu tes per baris tabel di bagian 3** (di luar anak angkat): graf hasil + `jalankan()` tetap `OK`, dan
   `adaWaris` cocok dengan apakah orangnya muncul di penerima engine (contoh: mertua tidak menerima; saudara
   seayah menerima bila syaratnya terpenuhi).
3. Ekuivalensi: menambah anak lewat menu = menambah anak lewat daftar ± (`tambahAhliWaris`) pada graf yang sama.
4. Komponen: ketuk kotak membuka menu; Esc menutup dan mengembalikan fokus; Hapus meminta konfirmasi yang
   menyebut penghubung; nama wajib menahan Simpan untuk non-ahli-waris.
5. `tataLetak` B1–B5 pada galeri fixture di atas.
6. Regresi: fixture bab 16 dan tes wizard yang ada tidak berubah.

## 6. Urutan kerja

1. `kerabatPohon.ts` + tes 1–3 (tabel jalur dulu, fixture sebelum UI).
1a. Keseimbangan `tataLetak` (4a) + tes 5, sebelum pohon dibuat interaktif.
2. `MenuOrang`, `DialogTambahOrang`, pohon interaktif di `PanggungPohon` + tes 4.
3. Tautan dan daftar nama hubungan.
4. Kunci diksi, lalu `pnpm konten:pulihkan`.

## 7. Risiko dan yang belum pasti

- `PohonDasar` mengukur posisi node saat tata letak berubah; bila menu menumpuk di tepi layar HP, panelnya
  harus berbalik arah. Dicek di tes tampilan HP.
- Jalur yang melewati penghubung bisa menumpuk penghubung baru bila dipanggil dua kali; `selesaikanJalur` harus
  memakai penghubung yang sudah ada (pola `pilihInduk`/`orangTuaLain` di `checklist.ts`). Dites khusus.
- Wajib-nama adalah kompromi sampai Tahap 3; kalau terasa mengganggu, jalan keluarnya `sebutanHubungan` yang lebih
  dulu, bukan melonggarkan aturan di sini.
