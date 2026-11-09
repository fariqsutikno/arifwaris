# Munasakhat × dzawil arham × gharqa — desain

Status: draf, menunggu persetujuan pengguna. Branch: `rencana/munasakhat-arham-gharqa`.

## Maksud

Engine sekarang menolak dua bentuk kasus nyata yang sering muncul bersama:

1. **Munasakhat dengan dzawil arham** — salah satu mayit dalam rantai (termasuk mayit pertama) hanya
   meninggalkan dzawil arham, atau pasangan + dzawil arham.
2. **Gharqa digabung munasakhat**, dua arah (keputusan pengguna 2026-11-09: "dua-duanya"):
   - (a) *gharqa di tengah rantai*: A wafat; sebelum harta A dibagi, B dan C (ahli waris A yang saling
     mewarisi) wafat bersamaan.
   - (b) *munasakhat sesudah gharqa*: B dan C wafat bersamaan; sebelum harta masing-masing dibagi,
     ahli waris mereka ada yang wafat.
   - campuran keduanya (gharqa → wafat satu orang → gharqa lagi) ikut tercakup.

## Temuan rujukan (Shamela, 2026-11-09)

Tidak ditemukan nash yang membahas gabungan ini secara khusus di pustaka terunduh (pencarian
«المناسخة/المناسخات» × «الغرقى», «ذوي الأرحام» × «مات قبل القسمة», di Lahim, Tashil, al-Kafi, Mughni,
dan seluruh kategori fikih Syafi'i/Hanbali). Yang ada adalah kaidah umum yang cukup untuk menyusunnya:

| Kode usulan | Isi | Sumber | Nukilan |
|---|---|---|---|
| R12-5 | Munasakhat = mayit wafat lalu **ahli warisnya atau sebagian** wafat sebelum dibagi; tidak disyaratkan wafat satu per satu | Lahim · shamela:31238/132 (hlm. 139) | «أن يموت شخص فلا تقسم تركته حتى يموت ورثته أو بعضهم» |
| R12-6 | Bila korban gharqa tidak saling mewarisi, harta tiap korban untuk ahli warisnya yang hidup saat ia wafat, tanpa rekan musibah | Lahim · shamela:31238/157 (hlm. 164) | «يكون ميراث كل واحد منهم لورثته الأحياء حين الحكم بموته دون الذين ماتوا معه» |
| R12-6 | Mas'alah gharqa tanpa saling mewarisi dikerjakan seperti mas'alah lain; dengan saling mewarisi ([HNB]) tharif digabung "seperti munasakhat" | Ibnu 'Utsaimin, *Tashil al-Fara'idh* · shamela:11095/128 (hlm. 133) — **pembanding**, Hanbali | «عمل مسائل الغرقى إذا لم يحكم بالتوارث بينهم لا يختلف عن عمل مسائل غيرها» |

Konsekuensi untuk engine:
- Kelompok gharqa di dalam rantai = satu **langkah** munasakhat berisi beberapa mayit; hukum di antara
  anggotanya tetap R13-10 / K13d-1 / R13-19 (tidak ada aturan baru).
- Dzawil arham pada mayit mana pun = mas'alah mayit itu dihitung lewat `hitungDzawilArham` (bab 14);
  hasilnya tetap saham per orang sehingga cara gabung jami'ah (R12-2) tidak berubah.
- Kedua hal ini adalah **penggabungan** kaidah yang sudah ada, bukan aturan baru. Baris R12-5/R12-6
  ditambahkan ke tabel "Dasar dan Rujukan" bab 12 dan ke bab 12.7 sebagai aturan engine, supaya
  anotasi kode punya rujukan yang bisa dicocokkan reviewer syariah. R12-6 berstatus `sekunder`
  (Lahim + Tashil, bukan Raudhah), dan UI menyebut sumbernya.

## Tujuan

- `hitungMunasakhat` menerima langkah berupa satu orang **atau** satu kelompok gharqa.
- `hitungGharqa` menerima ahli waris yang wafat sesudah musibah dan sebelum pembagian.
- Mayit mana pun dalam rantai boleh hanya meninggalkan dzawil arham.
- Semua madzhab yang sudah didukung gharqa ikut: serentak (ijma'), jumhur (tidak saling mewarisi),
  [SYF] terlupakan (skenario/MAUQUF), [HNB] tilad–tharif.
- Trace terstruktur: langkah gharqa di dalam rantai memancarkan `MANI istibham` + `MUNASAKHAT` per
  anggota, dengan refs R12-5/R12-6 + rujukan gharqa yang berlaku.

## Bukan tujuan

- UI. `apps/web/src/jalankan.ts` sekarang memilih **antara** gharqa dan munasakhat; menggabungkannya di
  kanvas/linimasa Periksa adalah pekerjaan terpisah setelah engine. Web hanya dijaga tetap kompilasi.
- Kombinasi gharqa+munasakhat dengan taqdir (haml/mafqud/khuntsa) di langkah yang sama: kembalikan
  `TIDAK_DIDUKUNG` dengan alasan jelas. Gharqa+taqdir dan munasakhat+taqdir yang sudah jalan tidak disentuh.
- Penyempurnaan [SYF] terlupakan menjadi "bagikan yang pasti, tahan yang diperselisihkan" (pola aqall):
  tetap mengikuti perilaku gharqa saat ini (MAUQUF dengan daftar skenario).

## Anti-tujuan

- Menghitung rekan musibah sebagai ahli waris satu sama lain di madzhab yang tidak saling mewarisi.
- Membagi diam-diam bagian yang semestinya ditahan ([SYF] terlupakan).
- Jalur hitung kedua yang terpisah dari jami'ah R12-2 (dua mesin munasakhat yang bisa berbeda hasil).
- Mengubah hasil kasus munasakhat/gharqa yang sudah lulus regression suite.

## Pendekatan

**A. Perluas dua orkestrator yang ada (dipilih — rekomendasi, menunggu persetujuan).**
`urutanWafat` munasakhat menjadi daftar *kejadian* (`IdOrang | KejadianGharqa`). Gharqa mendapat isian
`wafatSesudahnya` dan, bila terisi, menghitung harta tiap anggota lewat `hitungMunasakhat` alih-alih
`hitungDzawilArham`. Logika langkah gharqa (terpisah / tilad) diekstrak dari `gharqa.ts` sekali dan
dipakai kedua arah.
- \+ Perubahan bentuk kecil, tipe hasil dan konsumen (web, explain) nyaris tetap; regresi mudah dijaga.
- − Dua pintu masuk untuk konsep "linimasa kematian". Diterima: pintu ditentukan oleh siapa yang hartanya
  dibagi (satu mayit → munasakhat; kelompok → gharqa), sesuai bab 12.5 dan 13d.

**B. Satu orkestrator linimasa baru** yang menggantikan keduanya (kejadian pertama boleh orang atau kelompok).
- \+ Satu model, cocok dengan linimasa UI.
- − Refactor besar atas dua orkestrator yang sudah diuji, mengubah tipe hasil, explain, dan web sekaligus.
  Ditunda; A tidak menghalangi B nanti karena logikanya sudah terkumpul di satu modul langkah.

**C. Hanya tambah kasus khusus** (cabang `if` untuk pola A→{B,C}).
- Ditolak: tidak mencakup campuran dan menduplikasi aturan gharqa.

## Rancangan (pendekatan A)

### 1. Dzawil arham dalam munasakhat
- `munasakhat.ts`: `hitung(...)` → `hitungDzawilArham(...)` di loop utama **dan** di `tentukanKeadaan`.
  Tanda tangan sama; `gharqa.ts` dan `taqdir.ts` sudah memakai pola ini.
- Efek: `sisaKeluar` bertujuan `dzawilArham` tidak lagi muncul untuk mayit yang dzawil arham-nya ada di
  graf (sisa diserap bab 14); `baitulMal`/`baitulMalTeratur` tetap jadi baris `sisaKeluar`.
- Uji yang ada di `munasakhat.test.ts` "sisa harta mayit berikutnya keluar ke dzawil arham" perlu ditinjau:
  ekspektasinya berubah bila graf memuat dzawil arham. Kalau grafnya tidak memuat, hasil tetap.

### 2. Tipe
```ts
// types.ts
export interface KejadianGharqa { anggota: IdOrang[]; keadaan: KeadaanGharqa }
export type KejadianWafat = IdOrang | KejadianGharqa;
InputMunasakhat.urutanWafat: KejadianWafat[]          // string lama tetap sah
InputGharqa.wafatSesudahnya?: KejadianWafat[]          // kosong/absen = perilaku lama
HasilMunasakhat |= { status: 'MAUQUF'; skenario: Array<{ urutan: IdOrang[]; hasil: HasilMunasakhatOk }> }
```
`HasilGharqa` tidak berubah bentuk: tiap `HartaGharqa` sudah membawa `daftarStatus` per mayit dan jejak.

### 3. Modul langkah gharqa (ekstrak dari `gharqa.ts`)
Fungsi murni yang, diberi `saham`/`jamiah` saat ini dan satu `KejadianGharqa`, mengembalikan saham baru:
- **serentak / jumhur / [SYF] keadaan non-terlupakan** [R13-10] [K13d-1] [R12-6]: untuk tiap anggota yang
  punya saham, hitung mas'alah-nya dengan graf di mana semua anggota lain berstatus wafat, lalu gabung
  (R12-2) satu per satu. Urutan gabung tidak memengaruhi hasil karena anggota tidak saling mewarisi;
  jadikan ini property test.
- **[HNB] tilad–tharif** [R13-19]: pakai `tiladSatuMayit` yang ada, dengan saham anggota dari langkah
  sebelumnya sebagai "tilad"-nya (bagian dari A sudah dimiliki sebelum musibah).
- **[SYF] terlupakan** [R13-10]: tidak dihitung di modul ini; orkestrator memecahnya jadi skenario (lihat 4).
- Anggota tanpa saham dilewati seperti R12-1. Anggota yang tidak ada di graf atau tidak berstatus wafat →
  `PERLU_INPUT` (pakai `periksaAnggota` yang ada).

### 4. Orkestrator
- **Munasakhat**: loop kejadian. Kejadian orang = perilaku lama. Kejadian kelompok = modul langkah.
  `grafPada` memperlakukan semua anggota kelompok yang sudah terjadi sebagai wafat, kelompok berikutnya
  masih hidup. Bila ada kelompok [SYF] terlupakan: ekspansi tiap permutasi anggotanya menjadi urutan orang
  biasa, jalankan rantai per skenario, kembalikan `MAUQUF` dengan daftar skenario.
- **Gharqa** dengan `wafatSesudahnya`: tiap harta anggota = `hitungMunasakhat({ dasar: anggota sebagai
  pewaris, urutanWafat: wafatSesudahnya })`. Rekan musibah sudah berstatus wafat di graf sehingga otomatis
  bukan ahli waris (R12-6). Untuk [HNB]: hasil tilad satu mayit dilanjutkan ke kejadian sesudahnya
  memakai loop rantai yang sama (bukan salinan).
- **Batas kombinatorik**: total skenario = hasil kali n! semua kelompok terlupakan (termasuk kelompok
  gharqa asal). Lewat 24 (= 4!, setara `MAKS_ANGGOTA_SKENARIO` sekarang) → `PERLU_INPUT`. Konstanta
  dipindah/diganti nama jadi `MAKS_SKENARIO_URUTAN` di satu tempat.
- `tentukanKeadaan` (label 1/2/3) untuk rantai yang memuat kelompok: dihitung seperti sekarang atas
  daftar langkah yang sudah diratakan; label hanya penjelasan [R12-3].

### 5. Explain & web
- `packages/explain/src/munasakhat.ts`: tambah narasi langkah kelompok lewat templat diksi baru
  (`pnpm diksi:tambah`), bukan kalimat hardcode. Status `MAUQUF` munasakhat memakai pola narasi
  skenario gharqa yang ada.
- `apps/web`: hanya tangani varian `MAUQUF` baru supaya kompilasi lolos (tampilkan "ditahan" seperti
  gharqa). Routing gabungan di `jalankan.ts` = tugas UI terpisah.

## Pengujian (dibuat sebelum logika)
Kasus baru masuk `docs/kb/16_kasus_uji.md` lalu fixture, dihitung manual dulu:
1. Munasakhat: mayit kedua hanya meninggalkan bintu ukht + khal (dzawil arham murni).
2. Munasakhat: mayit kedua meninggalkan istri + dzawil arham (gabung zaujiyyah di dalam rantai).
3. Munasakhat: mayit **pertama** hanya dzawil arham, lalu salah satu penerima wafat.
4. (a) [SYF] serentak: A → {B, C} saudara kandung; tiap saham B/C ke ahli warisnya yang hidup saja.
5. (a) [SYF] terlupakan: hasil `MAUQUF` dengan 2 skenario; tiap skenario = munasakhat A→B→C / A→C→B.
6. (a) [HNB]: tilad–tharif di tengah rantai; contoh dua bersaudara Tashil hlm. 133 diadaptasi dengan
   mayit pertama di depannya; cocokkan angka tiap langkah dengan tangan.
7. (b) Contoh Tashil hlm. 133–134 ([HNB], tanpa kejadian sesudahnya) sebagai jangkar regresi, lalu
   versi dengan satu ahli waris (mis. bintu) wafat sesudahnya.
8. (b) [SYF] serentak + satu ahli waris wafat sesudahnya; campuran gharqa → orang → gharqa.
9. Negatif: anggota kelompok hidup → `PERLU_INPUT`; skenario > 24 → `PERLU_INPUT`; taqdir di kelompok
   dalam rantai → `TIDAK_DIDUKUNG`.
Property test: urutan gabung anggota non-tilad tidak mengubah saham; Σ saham = jamiah; rantai tanpa
kelompok memberi hasil identik dengan sebelum perubahan (regression suite lama hijau).

## Urutan kerja
1. KB: tambah R12-5, R12-6 + aturan engine 12.7 + kasus bab 16. Tinjau pengguna.
2. Dzawil arham dalam munasakhat (bagian 1) — kecil, bisa di-commit sendiri.
3. Ekstrak modul langkah gharqa tanpa mengubah perilaku (refactor hijau).
4. Kejadian kelompok dalam munasakhat, termasuk MAUQUF dan batas skenario.
5. `wafatSesudahnya` di gharqa.
6. Explain + penyesuaian kompilasi web.

## Diserahkan ke pelaksana
- Nama fungsi/file modul langkah. Usulan: `langkahGharqa.ts` di samping `gharqa.ts` (orkestrator,
  bukan pipeline stage, jadi tidak di `stages/`).
- Bentuk persis jejak untuk langkah kelompok selama memakai jenis `MANI` + `MUNASAKHAT` yang ada.

## Keputusan yang diambil penulis (mohon dicek)
- Pendekatan A, bukan orkestrator linimasa tunggal.
- [SYF] terlupakan di dalam rantai → seluruh hasil `MAUQUF` dengan skenario (sama seperti gharqa sekarang).
- Batas 24 skenario total.
- Taqdir di dalam kelompok gharqa yang berada di rantai → `TIDAK_DIDUKUNG` dulu.
- R12-6 memakai *Tashil* (pembanding) sebagai penguat cara kerja, bukan sebagai posisi [SYF];
  posisi [SYF]-nya tetap Raudhah via R13-10.
