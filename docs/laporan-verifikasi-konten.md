# Laporan verifikasi konten (bagian B, mulai 2026-11-22)

Spec: `docs/design/spec-verifikasi-madzhab-dan-konten.md` bagian 4. Sumber: ekspor `docs/lampiran-konten/` yang ada di repo
(belum diekspor ulang; ekspor butuh `scripts/.env`, dijalankan pemilik). Konten disunting di portal admin, **bukan** di berkas
ekspor. Semua usulan di bawah menunggu persetujuan pemilik/tim keilmuan sebelum disunting.

Golongan: ✔ cocok · ⚠ lafaz/kondisi/kode salah, hukum tetap · ⚑ hukum berbeda dari KB · ⓘ catatan, tanpa tindakan.
Pemetaan oleh agen sonnet; golongan dan usulan teks oleh penyunting (opus).

## Daftar centang persetujuan (2026-11-25)

Centang yang disetujui; tempel di portal admin. Detail teks ada di tabel bagian bawah. `[ ]` = menunggu keputusan.

**Ganti teks (hukum/kondisi terlalu mutlak atau usang)**
- [ ] materi:370 syarat saudari kandung: tambah «kakek»
- [ ] materi:57, 78 wasiat ke ahli waris: «kecuali disetujui ahli waris lain» [R01-5]
- [ ] materi:95 jenis kematian: hakiki, hukmi, taqdiri
- [ ] teks_edukasi:595 dan ~973 batas 1/3: tambah soal ijazah ahli waris
- [ ] teks_edukasi:346–351 «belum didukung»: pakai pengganti tanzil di bawah
- [ ] ahwal:175 ANAK_LK: «tidak pernah terhalang oleh ahli waris lain (hajb hirman) [R06-2]»
- [ ] faq:70 dan faq:82: pakai dua pengganti di bagian «Teks basi»

**Perbaiki kode rujukan saja**
- [ ] materi:194 R03-7 → R14-4
- [ ] materi:319 tambah [R06-3]; materi:403–405 tambah [R06-7]
- [ ] teks_edukasi:331–343 tambah [R14-4]
- [ ] faq:56 Rujukan → R14-4, R14-5; faq:60 lengkapi R13-3, R13-15, R13-6
- [ ] faq:17 R02-1 → R02-12 (atau hapus kode)

**Keputusan tim keilmuan (bukan koreksi)**
- [ ] teks_edukasi:~991 «nilai barang saat dibagi»: pertahankan sebagai saran praktis, atau masukkan KB dulu
- [ ] faq:42 label «terjemah Kemenag RI» juga di kutipan 4:176 (opsional)

Sudah dikerjakan di kode: label dialog madzhab (commit `29c5fdb`).

## B2 · materi.md

96 klaim dicek, 83 cocok. Tidak ada ⚑.

| Baris | Gol. | Temuan | Usulan teks / tindakan |
|---|---|---|---|
| 370 | ⚠ | Syarat saudari kandung 1/2 dan 2/3 hanya menyebut «ayah», padahal KB 4.12 mensyaratkan tanpa *ashl mudzakkar* (ayah **atau kakek**); bersama kakek berlaku bab 08 | «Kalau tidak ada anak/cucu, ayah, kakek, dan saudara laki-laki: ... [R04-14]. Bila ada kakek, lihat bab kakek bersama saudara.» |
| 57, 78 | ⚠ | «tidak boleh untuk ahli waris» terlalu mutlak; KB 1.5: wasiat kepada ahli waris tidak sah **tanpa ijazah** ahli waris lain | baris 57: «dan tidak sah untuk ahli waris kecuali disetujui ahli waris lain [R01-5]»; baris 78: «(maks. 1/3; untuk ahli waris hanya bila disetujui)» |
| 95 | ⚠ | «atau dianggap wafat» kabur; KB 2.2 membagi kematian hakiki, hukmi (putusan hakim, mis. mafqud), taqdiri (janin gugur karena jinayah) | «disaksikan (hakiki), diputus hakim seperti orang hilang (hukmi), atau dihukumi wafat seperti janin yang gugur karena tindak pidana (taqdiri).» |
| 194 | ⚠ | Kode R03-7 berisi kaidah «tidak ada laki-laki yang mewarisi lewat perempuan kecuali saudara seibu», bukan definisi dzawil arham | ganti [R03-7] → [R14-4] |
| 413 | ⓘ | Bi nafsihi tanpa mu'tiqah (KB 5.2 menyebutnya); materi memang menyatakan wala' praktis tidak terjadi | biarkan; atau tambah «(dan pembebas budak, laki-laki maupun perempuan)» bila bab wala' ditampilkan |
| 319 | ⚠ | «Ibu menghalangi semua nenek» tanpa kode; KB punya baris tabel 6.5 | tambah [R06-3] |
| 403–405 | ⚠ | Ashabah tidak dapat apa-apa bila furudh menghabiskan harta, tanpa kode | tambah [R06-7] |
| 512 | ⓘ | Pengecualian «saudara seibu tetap mewarisi bersama ibu» tanpa kode; isi cocok dengan KB 6.4, tetapi tidak ada baris R06 yang khusus memuatnya (R06-4 = saudara kandung gugur oleh ayah, bukan ini) | tidak ada tindakan |
| 48, 56, 105, 243, 261 | ⓘ | Klaim tanpa kode, isi cocok, tetapi bagian KB-nya (1.3, 1.4, 2.3, 4.2, prosa 4.4) memang tidak berkode | tidak ada tindakan di konten; kandidat kode baru di KB bila ingin |
| 22, 34 | ⓘ | Hadits dalam prosa tanpa nomor: «Pelajarilah faraidh» (R01-8, Ibnu Majah 2719, dha'if) dan «Berikan bagian pasti kepada pemiliknya» (R01-3, al-Bukhari 6732, Muslim 1615) | cocok dengan KB; tambah kode [R01-8]/[R01-3] bila belum tampil, dan label dha'if pada R01-8 |

## B0–B1 · cek mesin dan soal_hitung

- `periksaKonsistensi` atas snapshot terbit: kosong (lolos); tes content 90/90.
- Tes permanen baru `apps/web/src/__tests__/soalHitung.test.ts`: **23 dari 23 soal hitung cocok dengan engine** (saham per ahli waris dan ashl akhir). Soal tidak menyimpan nominal, jadi nominal tidak dibandingkan.

## B3 · teks_edukasi.md

1–512: sebagian besar label (nama ahli waris, padanan Arab, jenis harta), semuanya sesuai glosarium. 513–1025: 46 entri, 39 UI murni. Klaim fikih yang dinilai: 20. Tidak ada ⚑.

| Baris / kunci | Gol. | Temuan | Usulan teks / tindakan |
|---|---|---|---|
| 346–351 (`ahli_waris.mereka_*`) | ⚠ | «perhitungannya belum didukung aplikasi» untuk dzawil arham sudah usang: engine menghitung dzawil arham [SYF] (tanzil) dan dipakai taqdir/munasakhat/gharqa | hapus kalimat itu, atau ganti «Aplikasi menghitungnya dengan metode tanzil.» setelah pemilik memastikan UI menampilkannya |
| 346–351 | ⓘ | Syarat dzawil arham mewarisi tidak menyebut kondisi baitul mal; isinya sesuai fatwa muta'akhkhirin yang dipakai engine (R14-1, R14-5) | biarkan |
| 595 (`harta.*` wasiat), ~973 (`selanjutnya.langkah_2_isi`) | ⚠ | «Maksimal 1/3 ... kalau lebih, otomatis dipangkas» tanpa menyebut ijazah; KB: kelebihan 1/3 *mauquf* pada persetujuan ahli waris setelah wafat (K01-1, R01-7); pemangkasan otomatis hanyalah batas cakupan engine (R01-9) | tambah «kecuali seluruh ahli waris menyetujuinya setelah almarhum wafat [R01-4]»; langkah_2 juga diberi [R01-4] dan «tidak untuk ahli waris tanpa persetujuan ahli waris lain [R01-5]» |
| 331–343 | ⚠ | Definisi dan contoh dzawil arham benar, tanpa kode | tambah [R14-4] |
| ~991 (`selanjutnya.langkah_4_isi`), 509–510 | ⓘ | «nilai barang dengan harga saat dibagi»: KB diam. Praktik, bukan hukum | tim keilmuan memutuskan: pertahankan sebagai saran praktis, atau tambahkan ke KB dulu |
| 518–519 | ⓘ | Gono-gini «diatur KHI»: di luar KB fikih; KHI = fase 4, ruleset terpisah | biarkan sebagai pemberitahuan cakupan |
| 478–485, ~829 | ⓘ | Piutang yang bisa ditagih termasuk tirkah: sesuai definisi tirkah KB 1.3 (harta dan hak bernilai harta), walau KB tidak menyebut piutang eksplisit | biarkan |

## B4 · soal_kuis.md

11 soal: kunci, pengecoh, penjelasan, dan kode semuanya ✔ (dua soal hitung, K-06 dan K-07, dihitung ulang dan cocok).

## B5 · faq, ahwal, modul, cheatsheet

faq 40 klaim (36 cocok), ahwal 18 (17), modul 10 (10), cheatsheet 0 (judul saja, deskripsi kosong). Tidak ada ⚑.

| Berkas:baris | Gol. | Temuan | Usulan teks / tindakan |
|---|---|---|---|
| faq:17 | ⚠ | Talak raj'i dalam iddah tetap mewarisi, dirujuk [R02-1] (R02-1 = empat sebab waris); isi cocok dengan KB 2.3, tetapi KB tak punya kode khusus raj'i | ganti [R02-1] → [R02-12] bila tim keilmuan setuju (akad nikah sah) atau hapus kodenya; kandidat kode baru di KB |
| faq:42 | ✔ | Terjemah QS 4:11 dan 4:176 identik kata per kata dengan Kemenag RI (MCP Quran, edisi id-id) | opsional: beri label «terjemah Kemenag RI» juga pada kutipan 4:176 |
| faq:56 | ⚠ | Isi memakai [R14-5] tetapi baris «Rujukan» hanya R03-7 (R03-7 bukan definisi dzawil arham) | Rujukan: R14-4, R14-5 |
| faq:60 | ⚠ | Isi memakai [R13-3], [R13-15], [R13-6] tetapi baris «Rujukan» hanya R13-1 | lengkapi daftar Rujukan |
| faq:70, 82 | ⚠ | «Madzhab apa yang dipakai?» dan «Kasus apa yang belum bisa dihitung?» adalah status produk; kemungkinan basi (multi-madzhab, haml/mafqud/khuntsa/gharqa sudah jalan) | pemilik mencocokkan dengan status aplikasi sekarang |
| ahwal:175 (ANAK_LK) | ⚠ | «tidak pernah terhalang» terlalu luas: R06-2 hanya hajb hirman; mawani' (pembunuhan, beda agama) tetap berlaku | «tidak pernah terhalang oleh ahli waris lain (hajb hirman) [R06-2]» |

## Teks basi: pengganti siap tempel di portal (2026-11-22)

Status aplikasi dicek dari kode (bukan dari KB): empat madzhab bisa dipilih (`DialogMadzhab.tsx:9`); dzawil arham [SYF]
dihitung dengan tanzil (`latihan/jalankan.ts:58`, `TabelFaraidh.tsx:174`); haml, mafqud, khuntsa lewat taqdir; gharqa dan
munasakhat punya jalur hasil sendiri. Batas yang masih ditolak engine diambil dari alasan `TIDAK_DIDUKUNG` yang ada.

**faq · «Madzhab apa yang dipakai?»** (ganti seluruhnya)
> Bawaannya madzhab Syafi'i. Kamu bisa beralih ke Hanbali, Hanafi, atau Maliki lewat tautan «ganti madzhab» di layar hasil.
> Yang berubah hanya titik-titik yang memang diperselisihkan (dicatat di matriks khilaf), dan tiap titik menyebut sumbernya:
> kitab madzhab itu sendiri, atau nukilan Lahim dan Ithraa bila belum ditemukan di kitab madzhabnya. Kalau sebuah kasus
> menyentuh titik yang belum dikaji untuk madzhab pilihanmu, kalkulator memberi tahu dan tidak menebak. Kompilasi Hukum Islam
> (hukum positif) belum dipakai.

**faq · «Kasus apa yang belum bisa dihitung?»** (ganti seluruhnya)
> Kebanyakan kasus sudah bisa dihitung, termasuk anak dalam kandungan, orang hilang, khuntsa, korban yang wafat bersamaan,
> kematian berlapis (munasakhat), dan dzawil arham. Untuk anak dalam kandungan, orang hilang, dan khuntsa, kalkulator
> menghitung semua kemungkinan lalu menahan bagian yang belum pasti. Yang masih ditolak antara lain: kerabat yang punya dua
> hubungan sekaligus (misalnya suami yang juga sepupu), kakek bersama saudari yang menjadi ashabah karena anak perempuan,
> beberapa cara pembagian dzawil arham di luar madzhab Syafi'i, dan janin yang berbagi bagian pasti dengan ahli waris
> sekelompok. Kalau kasusmu termasuk di sini, kalkulator memberi tahu alasannya.

**teks_edukasi · `ahli_waris.mereka_baru_mewarisi_kalau_tidak_ada`** (ganti)
> Mereka baru mewarisi kalau tidak ada ashabah dan tidak ada ahli waris berbagian pasti selain suami/istri. Aplikasi
> menghitung bagian mereka dengan metode tanzil (madzhab Syafi'i) [R14-6].

**Di luar portal (kode UI, bukan konten):** `apps/web/src/layar/DialogMadzhab.tsx` baris 2 dan 29 menandai tiga madzhab
non-Syafi'i sebagai «nukilan Lahim». Per 2026-11-22 sebagian besar sel bab 18 sudah primer, jadi label itu tidak lagi akurat.
Usulan: «sumber disebut per titik» atau hapus label. Perlu keputusan pemilik karena menyentuh UI.
