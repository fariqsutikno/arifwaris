# Spec: Kanvas Silsilah (input keluarga dan munasakhat, Periksa sebagai kisah)

Tanggal: 2026-10-16 · Status: **mockup disetujui pemilik 2026-10-16**, spec menunggu review.
Mockup acuan (sumber kebenaran tampilan): `docs/design/mockup-kanvas-silsilah.html` (v5). Spec ini menambah dua hal yang
belum ada di mockup: bagian **Hal lain** (beda agama / terlibat wafat, 5.2) dan penghitung **Masih dalam kandungan** (5.2, 5.3).
Hasil (langkah 5) **tidak** dibahas di sini. Pemilik akan membahasnya sesudah spec ini selesai.

## 0. Yang digantikan

| Dokumen | Nasib |
|---|---|
| `specs/2026-09-30-babak-kematian-berlapis-design.md` | **Dihapus.** Alur Babak dan jalur silsilah digantikan seluruhnya. Isinya tetap ada di riwayat git. |
| `plans/2026-09-30-babak-kematian-berlapis.md` | **Dihapus** (rencana dari spec di atas, sudah dieksekusi). |
| `specs/2026-09-30-alur-ariflab-terintegrasi-design.md` 2.3, 2.4, 2.5 | Diganti catatan yang menunjuk ke spec ini. |
| `specs/2026-10-01-perjalanan-keresahan-design.md` 5.1 dan field `jalur`/`pintu` di 7 | Diganti catatan yang menunjuk ke spec ini. 5.2–5.5 tetap berlaku. |
| `specs/2026-10-01-tambah-kerabat-dari-pohon-design.md` | Menu orang di pohon tidak lagi menjadi jalan utama mengisi keluarga (bagian 5.11). Logika `kerabatPohon`/`hubunganPohon` dipakai ulang. |
| `docs/design/riset-ux-input-kematian-berlapis.md` | Tetap sebagai riset. Rekomendasi bagian 7 (alur Babak) diberi catatan "digantikan". |
| Keputusan 2026-09-28 "mode biasa + mode lanjutan" | Digantikan: tanpa mode, ada jalan pintas dan linimasa (memori "mode lanjutan munasakhat"). |

## 1. Tujuan

**JTBD utama (Kasus):** "Keluarga mau membagi rumah peninggalan yang tertunda bertahun-tahun. Aku ingin tahu bagian
tiap orang yang hidup sekarang, dengan benar, tanpa harus paham fikih, walau aku tidak hafal semua silsilahnya."

**JTBD kedua (Latihan):** "Aku punya soal dari kitab atau tugas. Aku ingin memasukkannya cepat dan memeriksa tiap tahap
hitungannya."

Selesai bila:
- kasus turun-temurun 3–4 generasi bisa diisi tanpa pengguna pernah diminta "melihat dari sisi" orang lain;
- pengguna bisa berhenti di "belum tahu" tanpa menebak;
- kesalahan diperbaiki dari Periksa tanpa mengulang dari awal;
- input engine yang dihasilkan sama dengan input dari alur lama untuk kasus yang sama.

## 2. Aturan tampilan (dari audit pemilik 2026-10-14..16)

1. **Rancang dari keadaan kosong.** Setiap layar punya keadaan kosong, sebagian terisi, dan lengkap.
2. **Jenis kelamin selalu ditanyakan** (almarhum di langkah 1; orang lain lewat penghitung atau tersirat dari perannya).
3. **Tanpa jawaban bawaan** untuk pertanyaan yang bisa membuat munasakhat atau mawani' terlewat.
4. **Tombol utama tidak pernah nonaktif.** Diklik saat ada yang kurang → baris yang kurang ditandai dan digulir ke
   sana. Tandanya hilang begitu pengguna mengubah isian. Status diumumkan lewat live region.
5. **Tiga peran, tiga tampilan:**
   - garis bawah hanya untuk pindah halaman/langkah;
   - penjelasan memakai pola Details (▸, isi terbuka di bawah, satu baris per pilihan);
   - aksi pada orang atau bagian = ikon + teks yang terlihat ("Ubah", "Hapus").
   - Tidak ada menu ⋯ tersembunyi. Pil hanya untuk pilihan yang bisa diklik.
6. **Halaman isian hanya berisi fakta** dan apa yang perlu diisi. Siapa mendapat apa baru muncul di Hasil.
   Alasan "kenapa tidak ditanyakan" disimpan di balik Details.
7. **Penjelasan ringkas**: apa artinya dan kapan memilihnya, tanpa uraian fikih.
8. **Pilihan menyesuaikan orangnya.** Hanya pilihan yang mungkin untuk orang itu yang tampil.

## 3. Pintu masuk

Layar pertama Lab Hitung (sebelum stepper): **"Mau menghitung apa?"**, berisi dua kartu pilihan.

| Pilihan (teks) | `Kasus.jenisKasus` | Isian keluarga | Periksa | Lainnya |
|---|---|---|---|---|
| Belajar atau latihan soal | `'latihan'` | Isian cepat per ahli waris (bagian 6) | Ringkasan per mayit | Istilah fikih tampil; semua data dianggap pasti; tanpa "Belum tahu" |
| Kasus keluarga sungguhan | `'nyata'` | Kanvas wawancara (bagian 5) | Kisah (bagian 7) | Boleh "Belum tahu"; salin pertanyaan ke WA |

- Ini **pilihan tujuan**, bukan mode yang bisa diganti di tengah jalan. Datanya tetap satu (`Kasus`).
- Nama field `jenisKasus` dan nilai `'latihan'`/`'nyata'` dipilih supaya tidak bentrok dengan state app `tujuan: 'hitung' | 'belajar'`
  dan **mode Belajar (tebakan) di Hasil** yang sudah ada.
- Beranda yang membuka Lab dari situasi (spec perjalanan-keresahan 6.1) langsung mengisi `jenisKasus: 'nyata'`.

## 4. Langkah 1 · Almarhum

- Nama almarhum.
- **Laki-laki atau perempuan?** Tanpa bawaan.
- (Kasus) "Kira-kira tahun berapa {nama} wafat? Boleh kosong."
- (Kasus) **Pertanyaan pintu**, tanpa bawaan: "Sejak {nama} wafat, apakah hartanya sudah dibagi?"
  - Belum, baru saja wafat
  - Belum, sudah bertahun-tahun
  - Sudah pernah dibagi → pesan: yang dihitung adalah harta orang yang wafat sesudahnya; pembagian sebagian di luar cakupan.
  - Tidak tahu
- Ketika tumpukan harta (Tahap 6) dibangun, pertanyaan "masih utuh?" per barang menggantikan jawaban "Sudah pernah dibagi"
  untuk barang tertentu. Pertanyaan pintu tetap ada untuk harta almarhum pertama.

## 5. Langkah 3 · Keluarga (`jenisKasus: 'nyata'`): kanvas wawancara

### 5.1 Susunan layar

- **Kolom kiri:**
  - peta bagian;
  - ringkasan bagian yang selesai;
  - satu **kartu bagian aktif**.
  - Bagian yang belum dicapai tidak dirender.
- **Kolom kanan:** pohon keluarga (hanya tampilan; mengetuk orang menggulir ke barisnya). Di HP, pohon menjadi pita
  ringkas di atas daftar dengan tautan "Pohon lengkap".
- **Bar bawah** (menempel): Kembali (tautan) · status langkah · aksi langkah besar (5.9).

### 5.2 Bagian (kelompok) dan urutannya

Satu bagian = satu pertanyaan tentang satu kelompok milik satu orang. Urutannya untuk almarhum pertama:

| Bagian | Pertanyaan | Isian |
|---|---|---|
| Pasangan | "Waktu {X} wafat, apakah beliau punya istri/suami?" Ya/Tidak | Laki-laki: "Berapa istri?" (≤ 4). Perempuan: satu suami. |
| Anak | "{X} punya anak? Hitung juga yang sudah wafat." Ya/Tidak | Penghitung **Laki-laki**, **Perempuan**, **Masih dalam kandungan** |
| Orang tua | "Orang tua {X}" | Baris tetap: Ayah, Ibu |
| Kakek dan nenek | Muncul bila ayah atau ibu sudah wafat **dan** engine menyatakan berpengaruh | Baris tetap sesuai posisi yang relevan |
| Saudara / kerabat jauh | Muncul hanya bila engine menyatakan bisa mendapat bagian (5.7) | Penghitung per jalur, memakai ulang katalog `KERABAT_LAIN` |
| Hal lain | "Ada yang beda agama dengan {X}, atau terlibat dalam wafatnya?" Tidak ada/Ada, **tanpa bawaan** | "Ada" → centang orang di keluarga {X} untuk tiap hal (logika `LangkahKondisi`) |

Lalu **cabang**: untuk tiap orang yang **wafat sesudah {X}** (sebelum harta dibagi), bagian keluarganya ditambahkan.

- Cabang anak: Pasangan, Anak, Hal lain.
- Cabang pasangan: "Apakah {anak X} juga anak {pasangan}?" (Ya semuanya / Tidak semua → pilih), Orang tua, Hal lain.

Kartu pertama sebuah cabang diawali satu kalimat pengantar: *"{Y} wafat sesudah {X}, sebelum hartanya dibagi. Jadi
bagian {Y} nanti dibagi lagi ke keluarganya."* Kalimat ini menggantikan kartu bertombol "Mengerti".

Sesudah semua cabang: bagian **Urutan wafat** (bila perlu, 5.6) dan bagian **Kamu** (boleh dilewati, 5.8).

### 5.3 Baris orang

Isi satu baris:
1. peran (selalu tampil) + isian nama (boleh kosong; label cadangan "Anak laki-laki 1");
2. **"Keadaannya sekarang?"**;
3. lanjutannya bila perlu;
4. tombol "Hapus".

Pilihan keadaan (aturan 8):

| Orang | Pilihan |
|---|---|
| Leluhur (orang tua, kakek, nenek) | Masih hidup · Sudah wafat · Belum tahu · **Hilang tanpa kabar** |
| Pasangan | Masih hidup · Sudah wafat · Belum tahu · Lainnya → Hilang tanpa kabar / Sudah bercerai |
| Keturunan, saudara | Masih hidup · Sudah wafat · Belum tahu · Lainnya → Hilang tanpa kabar / Kelaminnya belum jelas (hanya untuk kunci di `KHUNTSA_MUNGKIN`) |
| Janin (dari penghitung kandungan) | Alur janin yang ada (`PertanyaanHamil`): siapa ibunya, sudah lahir? |

Kalau pilihan khusus untuk orang itu hanya satu, pilihan itu tampil langsung, bukan "Lainnya".

**Lanjutan per keadaan** (satu pertanyaan di baris; di balik layar memakai `DialogKeadaan`/`terapkanKeadaan`):

| Keadaan | Lanjutan | Ke data |
|---|---|---|
| Sudah wafat | "Tahun wafatnya" (kalau ingat). Bila tahun dan tahun pembanding ada → "Berarti sebelum/sesudah {X} wafat ({tahun})" otomatis. Bila tidak → "Tidak ingat tahunnya? Pilih saja: wafat sebelum atau sesudah {X}?" | `statusHidup`, `urutanWafat` (5.6), `waktu` |
| Belum tahu | Catatan "muncul lagi di Periksa" | `statusHidup: 'tidakDiketahui'` (taqdir engine) |
| Hilang tanpa kabar | "Sudah ada putusan pengadilan bahwa ia dianggap wafat?" | `mafqud`, atau wafat biasa bila sudah ada putusan (celah E3 riset) |
| Sudah bercerai | "Waktu {X} wafat, masa iddahnya sudah selesai?" | `Pernikahan.status` |
| Kelamin belum jelas | "Sudah dewasa (baligh)?" | `Orang.khuntsa` |

Satu Details per bagian: **"Bingung memilih?"**, satu baris per pilihan yang tampil di bagian itu.

### 5.4 Penghitung (siapa pemilik data)

- **+** menambah baris kosong. Baris itu belum lengkap sampai keadaannya dipilih, jadi tidak ada keadaan bawaan.
- **−** hanya membuang baris kosong terakhir (tanpa nama, tanpa keadaan). Kalau tidak ada yang kosong, muncul pesan
  "hapus lewat 'Hapus' di barisnya".
- **Hapus** di baris memakai konfirmasi dampak yang sudah ada (`dampakHapus`, `orangTerputus`), dengan menyebut
  keluarga yang ikut terhapus.
- **Ya → Tidak** pada bagian yang sudah berisi → konfirmasi yang menyebut siapa saja yang akan dihapus.

### 5.5 Peta bagian dan pindah bagian

- Isinya: batang kemajuan (satu ruas per bagian), "{n} dari {m} bagian selesai", dan keterangan "Bagian bisa bertambah
  bila ada yang wafat sesudah {X}".
- Di bawahnya deretan nama bagian sebagai **teks biasa** ("✓ Istri › **Anak** › Orang tua"), bukan pil dan tidak bisa
  diklik.
- Kartu bagian aktif ditutup dengan kaki berisi status bagian + **tombol lanjut lokal**:
  - "Lanjut: {bagian berikutnya}";
  - di bagian terakhir: "Selesai, lanjut ke Periksa".
- Bagian yang terbuka **tidak pindah sendiri**. Pindah hanya lewat tombol lanjut lokal atau "Ubah" pada ringkasan.
- Animasi masuk hanya saat bagian berganti, bukan di setiap ketukan. Tidak ada animasi bila gerak dimatikan.

### 5.6 Urutan wafat

- Dari tahun: bila semua yang wafat sesudah {X} punya tahun yang bisa dibandingkan, tidak ada pertanyaan.
- Sisanya jadi bagian **Urutan wafat**, satu pertanyaan berpasangan per kartu ("{A} wafat sebelum atau sesudah {B}?"),
  dengan pencarian biner (`urutan.ts`). Pilihannya: Sebelum / Sesudah / **Bersamaan, atau tidak tahu** (→ alur gharqa
  yang ada; dua almarhum lanjutan yang bersamaan tetap ditolak dengan jujur, celah E1) / **Belum tahu** (→ `belumPasti`).
- Pertanyaan hanya muncul bila kedua urutan memberi hasil berbeda (uji hipotetis 9.3).

### 5.7 Siapa yang ditanyakan (uji hipotetis)

UI tidak memuat aturan hajb. Keputusan "bagian ini/orang ini perlu ditanyakan?" diambil dari engine (9.3).

- Bagian yang dilewati diberi Details "Kenapa {kelompok} tidak ditanyakan?". Isinya satu kalimat dari templat diksi plus
  jalan pintas **"Tetap isi kerabat lain"**, yang menambahkan bagian itu.
- Anak dari orang yang wafat sebelum {X} juga mendapat Details "Kenapa anak-anak {Y} tidak ditanyakan?" + "Tetap isi".

### 5.8 Bagian "Kamu"

"Kamu ada di keluarga ini?", berupa pilihan dari orang yang masih hidup + "Bukan, saya mengisi untuk orang lain".
Jawabannya disimpan di `saya`, dan semua sebutan memakai sudut pandang itu ("kakekmu"). Boleh dilewati, karena
"orang lain" juga dihitung sebagai jawaban. Saat kasus dibagikan, `saya` dibuang.

### 5.9 Bar bawah langkah Keluarga

| Keadaan | Status | Aksi |
|---|---|---|
| Masih ada bagian | "Keluarga: {n} bagian lagi." | Tautan-aksi "Ke Periksa ›". Bila diklik → pesan "Masih {n} bagian, lanjutkan dari {bagian}" + pindah ke bagian itu |
| Semua lengkap | "Keluarga sudah lengkap." | Tombol "Lanjut: Periksa" |
| Datang dari Periksa | "Kamu sedang mengubah dari Periksa." | Tombol "Kembali ke Periksa" |

### 5.10 Kalau tujuan berubah atau data lama

Kasus v3 dari alur Babak dibuka di kanvas lewat migrasi (9.2). Semua bagian yang datanya ada ditandai sudah dijawab.

### 5.11 Pohon di samping

- Wajib benar menurut bagian 8. Hanya tampilan.
- Mengetuk simpul menggulir ke barisnya dan menyorotnya.
- Menu tambah dari pohon (Tahap 4) tidak dipakai di langkah ini.
- Kerabat bukan ahli waris (mertua, besan, anak tiri) ditambahkan lewat "Tetap isi kerabat lain" → "Tambah dengan nama
  hubungan" (`DialogTambahHubungan`, spec perjalanan-keresahan 5.2).

## 6. Langkah 3 · Ahli waris (`jenisKasus: 'latihan'`)

- Stepper menamai langkah ini "Ahli waris".
- Satu **kartu per mayit**:
  - "Mayit pertama: {nama}" berisi baris "− jumlah +" per peran (`LangkahAhliWaris` yang ada, `KELUARGA_INTI`), dan
    "Ahli waris lain" di balik Details (`KERABAT_LAIN`);
  - tiap orang yang dihitung muncul sebagai chip yang bisa diketuk untuk menandai **"wafat sebelum harta dibagi"**, lalu
    muncul kartu "Mayit ke-{k}: {peran} {i} dari {mayit}". Ahli warisnya diisi sendiri, seperti di soal kitab,
    termasuk orang yang sudah tercatat di kartu lain.
- **Urutan wafat**: daftar dengan tombol naik/turun, muncul bila ada ≥ 2 mayit lanjutan.
- Ke data: tiap mayit = simpul di graf dengan `idPewaris` relatif (`LangkahAhliWaris idMayit`). Orang yang sama di dua
  kartu dicocokkan lewat hubungan yang tersirat. Contoh: ibu dari Anak laki-laki 1 = Istri 1 dari mayit pertama, dan
  ditawarkan otomatis seperti "Dari orang yang sudah ada" di alur lama.
- Periksa latihan: ringkasan per mayit + "Ubah" per mayit. Tanpa kisah.

## 7. Langkah 4 · Periksa (`jenisKasus: 'nyata'`)

Urutan isinya, mengikuti pertanyaan di kepala pengguna:

### 7.1 Belum dipastikan

- Muncul hanya bila ada hal yang belum pasti.
- Tiap hal **dijawab di tempat**:
  - keadaan orang: Masih hidup / Wafat sebelum {X} / Wafat sesudah {X};
  - urutan: Sebelum / Sesudah.
- Sesudah dijawab, kisah di bawahnya ikut berubah.
- "Lihat di Keluarga" membuka bagian yang tepat dengan barisnya disorot, dan bar bawah berubah menjadi "Kembali ke Periksa".
- "Salin pertanyaan untuk keluarga" menyalin pesan WA berisi daftar ini (templat diksi).
- Bar bawah: "{n} hal belum dipastikan" + "Hitung dengan kemungkinan" (bila semua kemungkinan bisa dihitung; batas taqdir
  engine). Bila tidak bisa dihitung → status menyebut hal mana yang harus dipastikan dulu, dan tombolnya menggulir ke sana.

### 7.2 "Ada yang keliru?" (ubah yang dipandu)

Sebuah kartu dengan aksi "Ubah sesuatu". Langkahnya:
1. **Apa** yang diubah: Keadaan seseorang · Tahun atau urutan wafat · Anggota keluarga (tambah, hapus, nama) ·
   Peristiwa.
2. **Siapa** atau **bagian mana**.
3. Diantar ke tempatnya:
   - keadaan dijawab di panel itu juga;
   - tahun/urutan membuka babak yang bersangkutan dalam mode ubah;
   - anggota keluarga membuka bagian di Keluarga + "Kembali ke Periksa";
   - peristiwa membuka form peristiwa.

### 7.3 Kisah harta {X} (linimasa bercerita)

Menggantikan "Periksa cerita" per babak dan rencana Cerita/Linimasa terpisah.

- Garis waktu vertikal. Kematian **sebelum** {X} jadi baris kecil di atas.
- Tiap kematian {X} dan sesudahnya = **babak**, berisi:
  - tahun besar ("Tahun ?" bila kosong) + "{nama} wafat";
  - lencana "urutan belum pasti" bila urutannya berasal dari `belumPasti`;
  - kalimat: siapa yang ditinggalkan saat itu, siapa yang lebih dulu tiada, siapa yang belum dipastikan, dan untuk babak
    lanjutan: "Bagian {Y} dari harta {X} kini menjadi milik keluarganya";
  - **pohon kecil keadaan keluarga saat itu**: almarhum babak di tengah, orang tua di atas, pasangan di sampingnya, anak di
    bawah. Yang sudah wafat dicoret, yang belum pasti bergaris putus-putus.
- **Jeda** antar-babak: "{n} tahun kemudian" (bila dua tahun ada) atau "Beberapa waktu kemudian", ditambah lencana
  **"Harta {X} masih belum dibagi"**.
- Penutup **"Hari ini"**: yang masih hidup sekarang. Tanpa angka dan tanpa siapa-dapat-apa.
- **Ubah di babak** dipandu dengan cara yang sama seperti 7.2:
  1. "Apa yang keliru di babak ini?": Tahun wafat {Y} · Urutan (lebih dulu/lebih akhir) · Keadaan salah satu orang di
     babak ini · Ada yang kurang atau berlebih;
  2. pengguna mengedit di tempat atau diantar ke bagian Keluarga. "Selesai" menutup panel.
- **Tambah peristiwa** (form di tempat): jenis (Kelahiran/Pernikahan/Perceraian) · siapa · "terjadi sesudah siapa wafat"
  → muncul di kisah sebagai baris peristiwa. Ke data:
  - lahir → `dikandungSetelahWafat`;
  - nikah/cerai → status `Pernikahan` pada saat pasangan pertama wafat (memori "mode lanjutan munasakhat").
- Catatan di bawahnya: "Yang dibagi di sini harta {X}. Harta milik orang lain di kisah ini dihitung terpisah."

## 8. Pohon keluarga: syarat wajib

Pemilik menandai ini sebagai perhatian utama: pohon pernah menggambar istri {X} seolah istri saudaranya. Syaratnya
diuji sebagai invarian pada galeri fixture (spec perjalanan-keresahan 5.5, P1–P9), dan ditambah:

- **Pasangan selalu menempel pada orangnya.** Garis nikah tidak pernah melewati simpul lain. Saudara diletakkan di sisi
  yang tidak ditempati pasangan.
- Anak bertumpu di tengah simpul nikah orang tuanya. Anak dari pasangan yang berbeda dikelompokkan per simpul nikah.
- Orang tua berada di atas tengah deret anak-anaknya (si almarhum dan saudara kandungnya).
- Simpul belum diisi atau belum tahu bergaris putus-putus. Simpul wafat bergaris tipis. Pemilik harta bergaris tebal.
- Satu modul tata letak (`hasil/tataLetak.ts`) dipakai bersama oleh pohon samping, pohon Hasil, dan pohon kecil di kisah,
  dengan parameter ukuran. Tidak ada tata letak kedua yang ditulis tangan.

## 9. Data dan logika

### 9.1 `Kasus` v4 (menyempurnakan spec perjalanan-keresahan 7)

```ts
type Kelompok = 'pasangan' | 'anak' | 'orangTua' | 'kakekNenek' | 'saudara' | 'jauh' | 'anakBersama' | 'halLain';
type Peristiwa =
  | { jenis: 'lahir'; idOrang: IdOrang; sesudahWafat: IdOrang }
  | { jenis: 'nikah' | 'cerai'; idOrang: IdOrang; idPasangan: IdOrang; sesudahWafat: IdOrang };
type HalBelumPasti =
  | { jenis: 'urutan'; a: IdOrang; b: IdOrang; bersamaan: boolean }
  | { jenis: 'lahir'; anak: IdOrang; almarhum: IdOrang };

interface Kasus {               // v4; perubahan terhadap spec perjalanan-keresahan 7:
  jenisKasus: 'latihan' | 'nyata';
  // − jalur                     (dihapus: satu kanvas)
  pintu?: 'baru' | 'lama' | 'sudah' | 'tidakTahu';     // tanpa bawaan; kosong = belum dijawab
  /** Bagian yang sudah dijawab per orang ("Tidak" juga jawaban). Khusus UI. */
  kelompokDijawab?: Record<IdOrang, Kelompok[]>;
  /** Baris hasil penghitung yang keadaannya belum dipilih. Khusus UI; menahan lanjut. */
  belumDiisi?: IdOrang[];
  /** Jangkar diri. Khusus UI; dibuang saat dibagikan. undefined = belum dijawab, null = "orang lain". */
  saya?: IdOrang | null;
  waktu?: Record<IdOrang, { wafat?: TanggalKira; lahir?: TanggalKira }>;   // tetap
  peristiwa?: Peristiwa[];
  /** Orang di urutanWafat yang posisinya sudah dipastikan lewat pertanyaan berpasangan atau diatur di kisah. Khusus UI. */
  urutanDijawab?: IdOrang[];
  belumPasti?: HalBelumPasti[];  // "Belum tahu" di urutan masuk ke sini
}
```

- "Sudah wafat" + sebelum/sesudah ditulis langsung ke `statusHidup` + `urutanWafat`. Tahun disimpan di `waktu` lalu
  diturunkan oleh `turunkanDariWaktu` (fungsi murni, dipanggil di `UBAH_KASUS` sebelum `rapikanKeadaan`). Jawaban
  berpasangan tidak ditimpa penurunan.
- Peristiwa diturunkan ke `dikandungSetelahWafat` dan `Pernikahan.status` oleh fungsi yang sama.
  `peristiwa` disimpan supaya kisah bisa menampilkannya.
- Antrean pertanyaan, peta bagian, dan "kenapa tidak ditanyakan" **tidak disimpan**. Semuanya dihitung dari `Kasus`.

### 9.2 Migrasi v3 → v4

- `jenisKasus: 'nyata'`.
- Graf, `urutanWafat`, `dikandungSetelahWafat`, `gharqa`, `wafatSesudahDibagi` dipakai apa adanya.
- `kelompokDijawab` diisi untuk setiap almarhum dan setiap kelompok yang punya anggota. Kelompok tanpa anggota juga
  dianggap dijawab "Tidak", karena checklist lama memang menanyakan semua peran.
- `pintu`: `'lama'` bila `urutanWafat` tidak kosong, selain itu `'baru'`. `saya` tidak diisi.
- `bacaKasus` memeriksa field baru, termasuk: `peristiwa` hanya merujuk orang yang ada, dan `sesudahWafat` adalah almarhum.

### 9.3 Uji hipotetis (UI memanggil engine, fikih tetap di engine)

`ujiHipotetis.ts`, fungsi murni:
- **Bagian/posisi relevan**: tambahkan satu simpul hipotetis (hidup) di posisi itu, jalankan `hitungMunasakhat`. Bila
  simpul itu tidak menerima saham di langkah mana pun, bagian itu dilewati.
- **Urutan relevan**: jalankan kedua urutan. Bila saham akhirnya sama, pertanyaannya dilewati.
- **Kelahiran relevan**: anggap anak sudah ada saat {Y} wafat. Bila ia tidak menerima apa pun dari langkah {Y}, pertanyaan
  dilewati.
- Engine mengembalikan `PERLU_INPUT` atau `TIDAK_DIDUKUNG` → pertanyaannya **tetap ditanyakan** (aman).
- Batas biaya diukur dengan fixture 4 generasi ± 40 orang. Lewat batas → tanyakan tanpa uji.
  `ponytail:` tanpa memo; tambah memo per graf bila terasa lambat.

`kelompok.ts`: urutan bagian (5.2) + bagian mana yang tampil (lewat uji) + kalimat alasan bagian yang dilewati
(templat diksi). `antreanUrutan.ts` (nama `antrean.ts` sudah dipakai modul akun): pertanyaan urutan yang tersisa.

## 10. Unit

| Unit | Tanggung jawab |
|---|---|
| `src/kasus.ts` | `Kasus` v4, migrasi v3→v4, `bacaKasus` |
| `src/silsilah.ts` | `turunkanDariWaktu` (tahun, jawaban berpasangan, peristiwa → data engine) |
| `src/ujiHipotetis.ts`, `src/kelompok.ts`, `src/antreanUrutan.ts` | 9.3 |
| `src/layar/PintuLab.tsx` | Bagian 3 |
| `src/layar/keluarga/KanvasKeluarga.tsx` | 5.1, susunan + peta bagian (`PetaBagian.tsx`) |
| `src/layar/keluarga/KartuBagian.tsx`, `BarisOrang.tsx`, `PenghitungOrang.tsx`, `BagianUrutan.tsx`, `BagianKamu.tsx`, `BagianHalLain.tsx` | 5.2–5.8 |
| `src/layar/keluarga/LatihanAhliWaris.tsx` | Bagian 6 (memakai `LangkahAhliWaris`) |
| `src/layar/periksa/BelumPasti.tsx`, `UbahDipandu.tsx`, `KisahHarta.tsx`, `BabakKisah.tsx`, `FormPeristiwa.tsx` | Bagian 7 |
| `src/hasil/tataLetak.ts` | Bagian 8 (satu modul untuk semua pohon) |
| `src/layar/wizard/BarBawah.tsx` | Tanpa tombol nonaktif (tugas terpisah sudah berjalan; spec ini mengandalkannya) |
| Diksi | Semua kalimat baru lewat `pnpm diksi:tambah` |
| **Dihapus** | `LangkahBabak.tsx`, `PertanyaanPenutup.tsx`, aksi `KE_BABAK`, sub-judul babak, `LangkahKondisi` sebagai langkah (logikanya dipindah ke `BagianHalLain`), `PeriksaCerita` lama |

## 11. Tes (ditulis sebelum logika)

1. **Fixture engine, dicocokkan ke KB dulu:**
   - A, turun-temurun (Mbah Karto → Mbah Sumi → Budi; Slamet wafat lebih dulu dan anaknya terhalang [R12-1]);
   - B, kakak tak menikah (ibu + saudara);
   - B' = B + kakek (muqasamah bab 08);
   - kasus latihan A dengan tabel per mayit + jami'ah 72.
2. **`ujiHipotetis`/`kelompok`:**
   - saudara tidak ditanya bila ada anak laki-laki;
   - kakek ditanya bila ayah wafat (juga ketika ada saudara);
   - paman tidak ditanya bila ada saudara laki-laki;
   - cucu dari anak yang wafat lebih dulu tidak ditanya bila ada anak laki-laki;
   - `PERLU_INPUT` → tetap ditanya.
3. **`antreanUrutan`:** semua tahun ada → 0 pertanyaan urutan; "Belum tahu" → `belumPasti`, bagian dianggap selesai.
4. **`turunkanDariWaktu`:** tahun → sebelum/sesudah; tahun dan jawaban berpasangan memberi `urutanWafat` yang sama;
   peristiwa lahir → `dikandungSetelahWafat`.
5. **Migrasi:** kasus Babak v3 (fixture lama) → v4 menghasilkan **input engine identik**.
6. **Integrasi:** kasus A lewat kanvas, lewat latihan, dan lewat migrasi menghasilkan input engine yang sama.
7. **`tataLetak`:** pasangan bersebelahan, garis nikah tidak memotong simpul, ditambah P1–P9, pada galeri fixture.
8. **Komponen:**
   - pintu tanpa bawaan;
   - tombol utama tidak nonaktif dan menandai yang kurang;
   - − tidak menghapus baris berisi;
   - bagian tidak pindah sendiri;
   - pilihan keadaan sesuai peran;
   - "Kembali ke Periksa";
   - `saya` dibuang saat dibagikan;
   - aksesibilitas: radiogroup berlabel, live region, fokus berpindah ke kartu bagian baru.

## 12. Urutan pengerjaan

1. Fixture 11.1, dicocokkan ke KB.
2. `Kasus` v4 + migrasi (sekaligus Tahap 5).
3. `tataLetak` dengan syarat 8, dibangun dulu karena dipakai tiga tempat.
4. `ujiHipotetis` → `kelompok` → `antrean` → `turunkanDariWaktu`.
5. Pintu + langkah 1.
6. Kanvas Keluarga (`nyata`) → hapus kode babak.
7. Latihan (`latihan`).
8. Periksa: belum pasti → ubah dipandu → kisah → peristiwa.

## 13. Risiko dan di luar cakupan

- **Biaya uji hipotetis** pada graf besar: batas + fallback "tanyakan" (9.3).
- **Pencocokan orang yang sama di latihan** (6) bisa salah tebak. Tawarannya selalu bisa ditolak; bila ditolak, orangnya
  dibuat terpisah.
- **Kalimat** "kenapa tidak ditanyakan", pengantar cabang, dan pesan WA masih draf sampai disahkan tim keilmuan. Kalimat
  yang belum disahkan tidak masuk snapshot diksi.
- **Di luar cakupan:**
  - Hasil (dibahas terpisah);
  - tumpukan harta (Tahap 6);
  - "Bagaimana kalau" (Tahap 7) selain memakai `belumPasti`;
  - dua almarhum lanjutan wafat bersamaan (E1);
  - pembagian sebagian;
  - mode cerita AI.
