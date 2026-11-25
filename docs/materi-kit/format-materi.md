# Format kiriman materi

Satu pelajaran = satu berkas Markdown di `konten/materi/modul-NN/<slug>.md`. Berkas ini dibaca parser aplikasi
(`packages/content/src/materi.ts`), jadi sintaksnya **ketat**: yang tidak ada di dokumen ini tidak akan tampil
atau membuat pemeriksa gagal. Setelah menulis, jalankan:

```bash
pnpm materi:cek konten/materi/modul-05/5-1-hajb.md
```

Pemeriksa melaporkan sintaks yang salah, istilah yang tidak ada di glosarium, tautan ke pelajaran atau bagian
yang tidak ada, kode rujukan yang tidak ada di KB, dan **angka contoh yang tidak sama dengan engine**.

## 1. Kepala berkas (wajib)

```markdown
---
slug: 5-1-hajb
modul: 5
urutan: 1
judul: Hajb, siapa tetap mendapat dan siapa tergeser
tujuan: Setelah pelajaran ini kamu bisa menentukan siapa yang gugur dan siapa yang bagiannya mengecil dalam satu kasus.
durasi: 20
tahap: hajb
prasyarat: 2-3-daftar-ahli-waris, 3-1-enam-bagian-pasti
singgung: 2-2-penghalang-waris, 10-1-kakek-dan-saudara
---
```

| Kunci | Isi |
|---|---|
| `slug` | Ambil dari `kerangka-kurikulum.md`. Jangan mengubah slug yang sudah ada. |
| `modul`, `urutan` | Angka, sesuai kerangka. |
| `judul` | Judul pelajaran, maksimal sekitar 60 huruf. |
| `tujuan` | Satu kalimat berawalan "Setelah pelajaran ini kamu bisa ...", berisi **kemampuan** (menentukan, membedakan, menghitung), bukan "mengenal". |
| `durasi` | Perkiraan menit baca (10–25). |
| `tahap` | Tahap alur pembagian yang dilatih pelajaran ini (lihat bagian 4, blok `alur`). |
| `prasyarat` | Slug pelajaran yang harus sudah dibaca. Boleh kosong untuk pelajaran pertama. |
| `singgung` | Slug pelajaran lain yang bersinggungan; tampil sebagai chip di atas pelajaran. |

## 2. Judul dan nomor bagian

- `## Judul` = bagian utama. Nomornya **otomatis** (01, 02, ...). Jangan menulis nomor sendiri.
- `### Judul` = sub-bagian. Nomornya otomatis mengikuti induknya (1a, 1b, 2a, ...).
- Tidak ada `#` (judul pelajaran sudah dari kepala berkas) dan tidak ada `####`.
- Dua bagian penutup selalu bernama persis `## Cek pemahaman` lalu `## Ringkasnya`, di urutan paling akhir.

## 3. Teks sebaris

| Tulis | Hasil |
|---|---|
| `**tebal**` | tebal, untuk kata kunci yang harus diingat. Hemat: paling banyak satu atau dua per paragraf. |
| `*miring*` | miring, untuk istilah Arab yang belum punya tooltip atau penekanan ringan. |
| `[[hajb]]` atau `[[hajb\|terhalang]]` | istilah bertooltip dari glosarium KB bab 15. Id = slug istilah di glosarium (huruf kecil, tanda hubung). Pakai di **kemunculan pertama** istilah di tiap pelajaran. |
| `[[>3-1-enam-bagian-pasti]]` | chip tautan ke pelajaran lain (nomor + judul tampil otomatis). |
| `[[>5-1-hajb#4b\|dua saudara]]` | chip tautan ke sub-bagian 4b pelajaran lain, dengan teks sendiri. |
| `[[#4b]]` | chip tautan ke bagian 4b di pelajaran yang sama. |

Tidak boleh: tautan web `[teks](url)`, HTML, emoji, kode rujukan `[R06-2]` di paragraf (kode rujukan hanya di
blok `dasar`, lihat bawah). Kalau istilah belum ada di glosarium, tulis biasa dengan `*miring*` dan catat di
bagian "Istilah usulan" di laporan kiriman.

## 4. Blok

Semua blok di bawah ini ditulis dalam pagar tiga backtick dengan nama blok. Isinya baris `kunci: nilai`
kecuali disebut lain. Baris kosong di dalam blok diabaikan. Teks sebaris (bagian 3) berlaku di nilai yang berupa
kalimat.

### Blok biasa (Markdown)

- **Paragraf**: baris-baris berurutan; baris kosong memisahkan paragraf.
- **Daftar**: `- butir` atau `1. butir`. Butir boleh bersambung ke baris berikutnya yang menjorok.
- **Catatan**: baris yang diawali `> `. Kalau diawali frasa tebal, frasa itu jadi judul catatan:
  `> **Jebakan yang sering muncul** Saudara yang gugur karena ayah tetap ...`
- **Tabel**: tabel Markdown biasa dengan baris pemisah `|---|---|`. Teks sebaris boleh di sel.

### `alur` (wajib, sekali di awal setiap pelajaran)

Menunjukkan di mana pelajaran ini berada dalam alur pembagian warisan, pertanyaan yang harus diajukan di tahap
itu, dan apa yang diserahkan ke tahap berikutnya. Inilah benang merah yang menyiapkan pelajar untuk menghitung.

````markdown
```alur
tahap: hajb
tanya: Dari ahli waris yang tersisa, siapa yang gugur karena ada orang lain, dan siapa yang bagiannya mengecil?
bekal: daftar ahli waris yang sah ([[>2-3-daftar-ahli-waris]]) dan bagian pasti mereka ([[>3-1-enam-bagian-pasti]])
hasil: daftar ahli waris yang benar-benar mendapat, siap ditentukan bagiannya
```
````

Nilai `tahap` (urutan tetap, sesuai pipeline engine bab 00.2):

| Kunci | Label di layar |
|---|---|
| `harta` | Harta bersih |
| `ahli-waris` | Siapa ahli waris |
| `penghalang` | Penghalang waris |
| `hajb` | Hajb |
| `bagian` | Bagian pasti dan sisa |
| `ashl` | Penyebut bersama |
| `aul-radd` | 'Aul atau radd |
| `tashih` | Tashih |
| `nominal` | Ke rupiah |
| `semua` | Seluruh alur (pelajaran ringkasan) |
| `lanjutan` | Di atas alur (munasakhat, dzawil arham, kasus belum pasti) |

### `cara-berpikir`

Urutan pertanyaan yang dipakai pelajar untuk memutuskan sesuatu di tahap ini. Ini bukan langkah aritmetika
(itu tugas Lab), tetapi urutan **keputusan**. Satu baris = satu pertanyaan; `->` memisahkan pertanyaan dan
akibatnya.

````markdown
```cara-berpikir
judul: Urutan memeriksa siapa yang gugur
Ada anak atau cucu laki-laki? -> semua saudara, keponakan, paman gugur
Ada ayah? -> semua saudara, keponakan, paman gugur; kakek dan nenek dari pihak ayah juga
Ada anak atau cucu, laki-laki maupun perempuan? -> saudara seibu gugur
Sisanya: bandingkan dekat dan jauh dalam satu jenis -> yang lebih jauh gugur
```
````

### `kasus` (studi kasus bertabel)

Tabel dihitung engine di aplikasi. `harapan` adalah angka yang kamu tulis di cerita; pemeriksa mencocokkannya
dengan engine. Kalau beda, angkamu yang salah.

````markdown
```kasus
judul: Studi kasus
cerita: Pak Rahmat wafat meninggalkan istri, satu anak laki-laki, ibu, dan seorang kakak laki-laki kandung.
pewaris: L
ahli waris: ISTRI, ANAK_LK, IBU, SAUDARA_KANDUNG
harta: 120.000.000
harapan: ISTRI 3, IBU 4, ANAK_LK 17; ashl 24
keterangan: SAUDARA_KANDUNG gugur karena ada anak laki-laki ([[#5c]])
keterangan: ISTRI turun dari 1/4 ke 1/8 karena ada anak ([[#4a]])
```
````

| Kunci | Wajib | Isi |
|---|---|---|
| `judul` | tidak | Label kecil di atas kotak (bawaan: "Studi kasus"). |
| `cerita` | tidak | Satu sampai tiga kalimat yang tampil di atas tabel. |
| `pewaris` | ya | `L` atau `P`. |
| `ahli waris` | ya | Kunci dipisah koma; jumlah di depan: `2 ANAK_PR`. Daftar kunci ada di bawah. |
| `harta` | ya | Rupiah, titik ribuan boleh. |
| `harapan` | ya | Saham akhir per kunci (yang > 0 saja), lalu `; ashl N` dengan N = penyebut akhir (sesudah 'aul atau tashih). |
| `keterangan` | tidak | Boleh berulang: `KUNCI teks`. Mengisi kolom Keterangan di tabel. |

Di bawah tabel otomatis ada tautan "Lihat langkah lengkapnya di Lab" yang membuka kasus ini di Lab dalam mode
contoh jadi (tanpa isian).

Kunci ahli waris: `ANAK_LK`, `ANAK_PR`, `CUCU_LK`, `CUCU_PR`, `AYAH`, `IBU`, `KAKEK`, `NENEK_DARI_IBU`,
`NENEK_DARI_AYAH`, `SUAMI`, `ISTRI`, `SAUDARA_KANDUNG`, `SAUDARI_KANDUNG`, `SAUDARA_SEBAPAK`, `SAUDARI_SEBAPAK`,
`SAUDARA_SEIBU`, `SAUDARI_SEIBU`, `KEPONAKAN_KANDUNG`, `KEPONAKAN_SEBAPAK`, `PAMAN_KANDUNG`, `PAMAN_SEBAPAK`,
`SEPUPU_KANDUNG`, `SEPUPU_SEBAPAK`, `MUTIQ`, `MUTIQAH`. Blok `kasus` hanya untuk kasus satu mayit; munasakhat,
haml, mafqud, khuntsa, gharqa, dan dzawil arham memakai blok `kasus-berkas` (bagian 5).

### `peraga` (kotak harta yang bisa diganti keadaannya)

Kotak harta seperti di Lab: satu kotak = satu bagian dari penyebut. Semua angka dihitung engine dari susunan ahli
waris tiap keadaan, jadi kamu tidak menulis angka. Pakai untuk memperlihatkan **akibat** sebuah kaidah.

````markdown
```peraga
judul: Coba bandingkan
pengantar: Lihat apa yang terjadi pada istri dan kakak ketika ada anak laki-laki.
pewaris: L
tampil: kotak
keadaan: Tanpa anak
ahli waris: ISTRI, SAUDARA_KANDUNG
penjelasan: Istri mendapat 1/4, kakak mengambil sisanya.
keadaan: Ada anak laki-laki
ahli waris: ISTRI, ANAK_LK, SAUDARA_KANDUNG
penjelasan: Istri turun ke 1/8 (**nuqshan**). Kakak kehilangan semuanya (**hirman**).
```
````

- `keadaan` membuka keadaan baru; `ahli waris` dan `penjelasan` milik keadaan di atasnya. 2–4 keadaan.
- `tampil`: `kotak` (kotak saja), `kotak-tabel` (kotak dan tabel), atau `aul` (kotak sebelum 'aul dengan kotak
  yang meluap, lalu tombol "Terapkan 'aul"; hanya untuk kasus yang memang 'aul).
- `pewaris` berlaku untuk semua keadaan; boleh ditimpa per keadaan.
- Jumlah kotak tiap keadaan disamakan otomatis (kelipatan persekutuan terkecil penyebutnya), supaya perubahan
  bagian terlihat pada harta yang sama besar. Contoh di atas: tanpa anak penyebutnya 4, dengan anak 8, jadi
  keduanya digambar dengan 8 kotak.

### `bandingan` (batang pecahan, nilai ditulis tangan)

Untuk membandingkan bagian orang-orang yang **tidak mungkin hadir bersamaan** (misalnya suami dan istri), sehingga
tidak bisa dihitung engine. Pemeriksa hanya mengecek bentuk pecahannya, jadi tulis dengan teliti dari KB.

````markdown
```bandingan
judul: Coba ganti keadaannya
kolom: Tidak punya anak | Ada anak perempuan saja | Ada anak laki-laki
Suami | 1/2 | 1/4 | 1/4
Istri | 1/4 | 1/8 | 1/8
Ibu | 1/3 | 1/6 | 1/6
Ayah | sisa | 1/6 + sisa | 1/6
catatan: Bagian ibu dianggap tanpa dua saudara. Suami dan istri tidak hadir bersamaan; keduanya ditampilkan untuk perbandingan.
```
````

Nilai sel: pecahan `a/b`, `sisa`, `a/b + sisa`, `gugur`, atau `1/3 sisa`.

### `simulasi` (coba sendiri dengan engine)

Pelajar mencentang kerabat yang hadir; engine menentukan siapa gugur, siapa mendapat berapa, dan alasannya.

````markdown
```simulasi
judul: Coba sendiri: siapa yang gugur?
pewaris: L
pilihan: AYAH, ANAK_LK, ANAK_PR, CUCU_LK, KAKEK, SAUDARA_KANDUNG, SAUDARA_SEIBU, PAMAN_KANDUNG
awal: AYAH, SAUDARA_KANDUNG, SAUDARA_SEIBU, PAMAN_KANDUNG
tampil: status
```
````

`tampil`: `status` (mendapat atau gugur, dengan alasan) atau `bagian` (juga bagiannya). Maksimal 10 pilihan.

### `peta` (peta bab)

Pohon konsep di awal pelajaran. Satu baris = satu simpul. Menjorok 2 spasi = anak dari simpul di atasnya.
Format simpul: `Judul | keterangan singkat -> #nomor-bagian` (keterangan dan tujuan boleh dihilangkan).

````markdown
```peta
Hajb | terhalang dari seluruh atau sebagian bagian
  Karena sifat | terkena penghalang waris, dianggap tidak ada -> #2b
  Karena orang lain | ada ahli waris yang lebih kuat -> #2b
    Nuqshan | bagian mengecil, 4 pemicu -> #4
    Hirman | gugur total, 5 kaidah -> #5
      6 yang tidak pernah gugur -> #3
      Gugur, tapi tetap mengurangi -> #6
```
````

Satu akar, paling dalam 4 tingkat, paling banyak 12 simpul.

### `ingat` (cara mengingat)

````markdown
```ingat
judul: Cara mengingat: tiga kata
- Lewat | perantaramu menutup jalanmu (5a)
- Dekat | yang lebih dekat didahulukan (5b)
- Lurus | garis lurus menutup garis samping (5c–5e)
penutup: Saudara seibu paling rapuh: **anak perempuan pun cukup** untuk menggugurkannya.
```
````

`judul` boleh dihilangkan (bawaan: "Cara mengingat"). Butir `- Kata kunci | penjelasan pendek`, 2–4 butir.
Kata kunci maksimal 4 kata.

### `dasar` (sumber, pengganti kode rujukan)

````markdown
```dasar
Disepakati empat madzhab: Raudhah ath-Thalibin (Syafi'i), al-Mughni (Hanbali), Tuhfat al-Muluk (Hanafi), dan 'Iqd al-Jawahir (Maliki).
rujukan: R06-2
```
````

Baris pertama = kalimat yang dibaca pelajar (sebut kekuatannya: ijma', disepakati empat madzhab, pendapat
jumhur, pendapat madzhab Syafi'i, ada khilaf). `rujukan` = kode dari tabel "Dasar dan Rujukan" bab KB terkait;
tidak tampil sebagai kode, tetapi membuka lembar dalil saat diketuk. Taruh di akhir bagian yang memuat klaim
fikih penting. Kira-kira 3–6 per pelajaran.

### `tebak` (pertanyaan sebelum penjelasan)

````markdown
```tebak
tanya: Menurutmu, apakah kedua saudara Pak Hasan mendapat warisan?
jawab: Tidak. Selama ayah masih ada, semua saudara gugur ([[#5d]]).
```
````

### `lipat` (isi yang dilipat)

````markdown
```lipat
judul: Tabel lengkap siapa menghalangi siapa
| Yang terhalang | Terhalang oleh |
|---|---|
| Cucu laki-laki | Anak laki-laki; cucu laki-laki yang lebih dekat |
```
````

Baris `judul:` wajib di baris pertama. Sisanya Markdown biasa (paragraf, daftar, tabel, catatan), tanpa blok
berpagar di dalamnya.

### `matriks` (kisi 2×2 atau 2×3)

````markdown
```matriks
kolom: Bisa menggugurkan | Tidak menggugurkan
Tidak bisa gugur | **Ayah, ibu, anak lk, anak pr** penghalang yang tidak pernah terhalang | **Suami, istri** tidak keduanya
Bisa gugur | **Cucu, kakek, nenek, saudara kandung dan sebapak** bisa keduanya | **Saudara seibu** bisa gugur, tidak menggugurkan
```
````

### `video`

````markdown
```video
https://www.youtube.com/watch?v=XXXXXXXXXXX
judul: Lima kaidah hajb hirman
```
````

Kalau videonya belum ada, tulis rencananya saja; blok ini disembunyikan di aplikasi sampai tautan diisi:

````markdown
```video
menyusul: Video 5 menit, lima kaidah hajb hirman dengan pohon keluarga.
```
````

### `soal` (cek pemahaman)

Ditulis di bagian `## Cek pemahaman`, 2–4 soal per pelajaran. Saat diimpor, tiap blok menjadi soal kuis di bank
soal dan bisa dipakai ulang di Latihan.

````markdown
```soal
kode: K-5.1-1
tingkat: dasar
tanya: Ahli waris: ayah, ibu, dan dua saudara kandung. Berapa bagian ibu?
- 1/3 | Belum. Saudara memang gugur oleh ayah, tetapi tetap dihitung untuk menurunkan ibu ([[#6]]).
* 1/6 | Benar. Dua saudara menurunkan ibu ke 1/6 walaupun mereka sendiri gugur.
- Tidak dapat | Belum. Ibu termasuk enam yang tidak pernah gugur ([[#3]]).
pembahasan: Yang gugur karena orang lain tetap bisa mengurangi bagian ahli waris lain; yang terkena penghalang waris tidak.
rujukan: R06-6
```
````

| Kunci | Isi |
|---|---|
| `kode` | `K-<modul>.<urutan>-<nomor>`, unik. |
| `tingkat` | `dasar`, `menengah`, atau `sulit`. |
| `tanya` | Pertanyaan. |
| `- pilihan \| alasan` | Pilihan salah dan alasannya. `* pilihan \| alasan` = satu-satunya pilihan benar. 3–4 pilihan. |
| `pembahasan` | Kenapa jawaban benar itu benar. |
| `rujukan` | Kode rujukan KB (wajib, minimal satu). |

Pilihan salah harus mewakili **salah paham yang nyata** (lihat `konsep-materi.md` bagian 6), bukan asal salah.

## 5. Blok untuk pelajaran lanjutan

`kasus-berkas` dipakai untuk munasakhat, haml, mafqud, khuntsa, gharqa, dan dzawil arham. Isinya nama berkas
kasus Lab (`.waris.json`, versi ≥ 4) yang disimpan di `konten/materi/kasus/`, ditambah harapan:

````markdown
```kasus-berkas
judul: Studi kasus munasakhat
cerita: Seorang suami wafat, lalu sebelum harta dibagi salah satu anaknya ikut wafat.
berkas: 11-1-munasakhat-dua-mayit.waris.json
harapan: lihat berkas
```
````

Buat berkasnya di Lab (Simpan ke berkas), atau minta pengembang. Pemeriksa menjalankan engine pada berkas itu
dan menampilkan hasilnya; tulis angka di cerita sesuai hasil tersebut.

## 6. Laporan kiriman

Setiap kali menyelesaikan satu modul, tambahkan `konten/materi/modul-NN/LAPORAN.md`:

```markdown
# Modul 5: laporan

## Pelajaran
- 5-1-hajb: selesai, `pnpm materi:cek` lolos
- 5-2-tabel-hajb: selesai, lolos

## Istilah usulan (belum ada di glosarium)
- muzahamah: berkurangnya bagian karena berdesakan (sumber KB 6.3 butir 7)

## Hal yang tidak ditemukan di KB
- (kosong, atau sebutkan apa yang ingin ditulis tetapi tidak ada dasarnya)
```
