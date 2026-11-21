# Laporan verifikasi konten (bagian B, mulai 2026-11-22)

Spec: `docs/design/spec-verifikasi-madzhab-dan-konten.md` bagian 4. Sumber: ekspor `docs/lampiran-konten/` yang ada di repo
(belum diekspor ulang; ekspor butuh `scripts/.env`, dijalankan pemilik). Konten disunting di portal admin, **bukan** di berkas
ekspor. Semua usulan di bawah menunggu persetujuan pemilik/tim keilmuan sebelum disunting.

Golongan: ✔ cocok · ⚠ lafaz/kondisi/kode salah, hukum tetap · ⚑ hukum berbeda dari KB · ⓘ catatan, tanpa tindakan.
Pemetaan oleh agen sonnet; golongan dan usulan teks oleh penyunting (opus).

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
