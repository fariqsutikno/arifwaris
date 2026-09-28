---
bab: 00
judul: Indeks dan Konvensi Knowledge Base
sumber: [Al-Faraidh al-Muyassar (Alukah), Tashil al-Faraidh (Ibn Utsaimin)]
---

# 00. Indeks dan Konvensi

## Tujuan
Knowledge base ilmu faraidh untuk sistem AI platform waris. Disusun dari dua sumber: **Al-Faraidh al-Muyassar** (bercorak didaktis, mengikuti jumhur) dan **Tashil al-Faraidh** karya Syaikh Muhammad bin Shalih al-Utsaimin (bercorak tahqiq dan tarjih, bermazhab Hanbali dengan tarjih mandiri). Keduanya kini hanya pembanding; hukum yang dipakai sistem adalah [SYF].

## Konvensi Wajib bagi AI
1. **Default perhitungan = madzhab Syafi'i [SYF]** (konteks mayoritas Indonesia). Sistem juga menjalankan **[HNB]** Hanbali, **[HNF]** Hanafi, **[MLK]** Maliki sebagai *overlay*: hanya titik yang berbeda dari [SYF]. Setiap titik khilaf punya kode `Kxx-y` dan satu baris di **bab 18 (matriks khilaf)**; blok `KHILAF` di bab 01–14 tetap menjelaskan dalilnya. Status tiap sel: `primer` (dicek ke teks madzhab) atau `sekunder` (nukilan kitab lain: Lahim, Ithraa, Ibnu 'Utsaimin). Pendapat perorangan (Ibnu 'Utsaimin dsb.) tetap perbandingan, bukan ruleset.
2. **Rujukan verifikasi madzhab Syafi'i**: disusun dari pernyataan eksplisit kitab mu'tabar — **Raudhah ath-Thalibin wa 'Umdah al-Muftin karya Imam an-Nawawi** (dicek langsung dari teks Kitab al-Fara'idh untuk titik-titik kunci: radd, dzawil arham, wala', jadd wal-ikhwah), serta fatwa lembaga berbasis Syafi'i (Dar al-Ifta Mesir) untuk titik lain (talak di masa sakit). Titik yang belum ditemukan rujukan tegas ditandai `[perlu verifikasi lanjut]`.
2. **Urutan kerja standar** setiap kasus: (a) hak-hak tirkah → (b) validasi syarat dan mawani' → (c) daftar ahli waris → (d) hajb → (e) tentukan furudh dan ashabah → (f) ashlul mas'alah → (g) 'aul atau radd → (h) tashih → (i) konversi ke nominal.
3. **Pecahan dikerjakan dalam bilangan bulat (saham)**, bukan desimal, sampai langkah akhir.
4. Istilah Arab ditulis dalam transliterasi baku; dalil ditulis dalam teks Arab asli.
3. **Setiap bab memiliki tabel "Dasar dan Rujukan"** di bagian akhir. Penanda seperti `[R04-7]` di judul subbab merujuk ke baris tabel tersebut. Kode jenis dalil: [Q] Al-Qur'an, [H] hadits, [A] atsar, [IJ] ijma' beserta penukilnya, [RDH] nash Raudhah ath-Thalibin, [KH] kaidah hisab (bukan hukum syar'i). Metodologi lengkap: bab 17.
4. Jika data kasus tidak lengkap (misalnya status hidup ahli waris, agama, jenis kelamin), AI **wajib bertanya**, bukan berasumsi.
5. **Tautan rujukan**: kolom "Sumber" boleh menyertakan token terverifikasi mesin di samping teks manusiawi (judul kitab, juz/halaman): `shamela:<book_id>/<page_id>`, `hadits:<koleksi>:<nomor-standar>`, `quran:<surah>:<ayat>` (atau `quran:<surah>:<ayat>-<ayat>` untuk rentang), `islamqa:<id>`. IslamQA hanya pendukung, tidak pernah satu-satunya dasar. Format lengkap dan cara parsing: bab 17.1.

## Daftar Bab
| No | File | Isi |
|----|------|-----|
| 01 | 01_pendahuluan_dan_tirkah.md | Definisi, dalil pokok, hak-hak atas tirkah |
| 02 | 02_asas_kewarisan.md | Syarat, rukun, asbab, mawani' |
| 03 | 03_daftar_ahli_waris.md | 15 laki-laki, 10 perempuan, klasifikasi |
| 04 | 04_ashabul_furudh.md | Furudh muqaddarah dan 11 ahli waris |
| 05 | 05_ashabah.md | Tiga jenis ashabah dan urutannya |
| 06 | 06_hajb.md | Hajb dan tabel hajib–mahjub |
| 07 | 07_masalah_khusus_furudh.md | 'Umariyyatain, Musyarrakah |
| 08 | 08_jadd_wal_ikhwah.md | Kakek bersama saudara (khilaf besar) |
| 09 | 09_hisab_ashl_aul_radd.md | Ashlul mas'alah, 'aul, radd |
| 10 | 10_tashih.md | Nisab arba' dan inkisar |
| 11 | 11_qismah_dan_takharuj.md | Konversi ke nominal, takharuj |
| 12 | 12_munasakhat.md | Kematian berantai |
| 13 | 13_kasus_khusus.md | Prinsip taqdir & mauquf, murtad, anak li'an/zina, laqith |
| 13a | 13a_haml.md | Janin |
| 13b | 13b_mafqud.md | Orang hilang |
| 13c | 13c_khuntsa.md | Khuntsa musykil |
| 13d | 13d_gharqa.md | Mati bersamaan (gharqa, hadma, harqa) |
| 14 | 14_dzawil_arham.md | Kerabat non-furudh non-ashabah |
| 15 | 15_glosarium.md | Istilah |
| 16 | 16_kasus_uji.md | Kasus uji dengan jawaban terverifikasi |
| 17 | 17_daftar_rujukan.md | Daftar rujukan, takhrij hadits, metodologi, jejak koreksi |
| 18 | 18_matriks_khilaf.md | Matriks khilaf SYF/HNB/HNF/MLK, kode `Kxx-y` |
