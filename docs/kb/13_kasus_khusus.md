---
bab: 13
judul: Kasus Khusus (Taqdir & Mauquf, Murtad, Anak Li'an/Zina, Laqith)
tags: [haml, janin, mafqud, hilang, khuntsa, gharqa, hadma, murtad, lian, zina, laqith, taqdir, mauquf]
---

# 13. Kasus Khusus

## 13.0 Prinsip Umum: Taqdir dan Mauquf
Untuk ahli waris yang statusnya belum pasti (janin, orang hilang, khuntsa):
1. Buat **mas'alah untuk setiap kemungkinan** status.
2. Cari **jami'ah** (KPK) dari semua mas'alah.
3. Setiap ahli waris yang pasti diberi **bagian terkecil (al-aqall al-mutayaqqan)** dari seluruh kemungkinan.
4. Ahli waris yang gugur di salah satu kemungkinan → tidak diberi sekarang.
5. **Sisanya ditangguhkan (mauquf)** sampai status jelas, atau mereka berdamai (ishtilah).

Nazham ar-Rahbiyyah: *فَاقْسِمْ عَلَى الْأَقَلِّ وَالْيَقِينِ*.

---

## 13.0b Menggabungkan Beberapa Ketidakpastian [KH]
Satu kasus bisa memuat haml, beberapa mafqud, khuntsa, dan kelompok gharqa sekaligus, pada mayit mana pun dalam rantai munasakhat. Aturan umumnya:
1. Setiap sumber ketidakpastian menghasilkan himpunan taqdir menurut madzhab aktif (13a–13d, bab 18). **Taqdir gabungan = hasil kali kartesius** himpunan-himpunan itu (mis. 1 haml [HNB] × 2 mafqud × 1 khuntsa = 6 × 4 × 2 = 48).
2. Di tiap taqdir gabungan kasus menjadi pasti → pipeline biasa + munasakhat (bab 12).
3. Semua taqdir gabungan dijami'ahkan sekaligus; tiap orang diberi aqall; sisanya mauquf beserta tabel "jika terbukti X".
4. Taqdir yang tidak mengubah mas'alah mana pun boleh digabung (hasilnya identik). Ini hanya penghematan hitung, bukan hukum.
5. Aturan pemberian (aqall / setengah-setengah / paling merugikan khuntsa) diterapkan per sumber sesuai madzhab; bila satu kasus mencampur aturan yang tidak bisa digabung dengan aqall (mis. [HNB] khuntsa tak jelas + haml), engine memisahkan: rata-rata dulu untuk khuntsa di dalam tiap taqdir haml, lalu aqall atas taqdir haml. Tidak ada contoh kitab untuk gabungan semacam ini (dicari di 8.598 kitab Shamela, 2026-09-29; *as-Sabikah adz-Dzahabiyyah* hanya membahas ketiganya berurutan). Aturan ini susunan kita, dan sejalan dengan kaidah umum al-aqall.

## 13.1–13.4 Dipindah
Haml → `13a_haml.md` · Mafqud → `13b_mafqud.md` · Khuntsa → `13c_khuntsa.md` · Gharqa → `13d_gharqa.md`. Kode R13-1…R13-10 tetap, tabelnya ikut pindah.

## 13.5 Murtad [R13-13]
- Murtad **tidak mewarisi** siapa pun, muslim maupun kafir.
- Harta murtad yang mati dalam kemurtadannya:
  > **KHILAF K13-1**
  > - **Malik, Syafi'i, masyhur Hanabilah (default)**: menjadi **fai'** untuk baitul mal.
  > - Abu Hanifah: harta yang diperoleh saat masih Islam diwarisi ahli waris muslimnya.
  > - **Ibnu 'Utsaimin**: beda agama menghalangi mutlak tanpa pengecualian, sehingga ahli waris muslim tidak mewarisinya (sejalan dengan default).
- Sistem: status murtad membutuhkan **putusan resmi**; tanpa itu, sistem tidak boleh menghukumi seseorang murtad.

## 13.6 Anak Li'an dan Anak Zina [R13-11] [R13-12]
- Nasab dari ayah **terputus**; nasab dari ibu tetap.
- Tidak ada saling mewarisi dengan **ayah biologis** dan kerabat ayah.
- Saling mewarisi dengan **ibu** dan kerabat ibu. Saudara-saudara dari ibunya adalah saudara seibu baginya.
- Ashabah-nya:
  > **KHILAF K13-2** — **[SYF] dan Malik (default, konsisten dengan bab 09)**: tidak ada ashabah baginya; sisa harta dikembalikan dengan **radd** kepada ibu/saudara seibu (mengikuti kaidah radd Syafi'i untuk kondisi baitul mal tidak teratur), atau ke baitul mal jika baitul mal syar'i berjalan.
  > **Hanabilah (satu riwayat) & Hanafi**: **ashabah ibunya** menjadi ashabahnya, disediakan sebagai opsi.

## 13.7 Laqith (Anak Temuan) [R13-14]
- Dihukumi **merdeka dan muslim** (jika ditemukan di negeri muslim).
- Tidak diketahui kerabatnya → hartanya ke **baitul mal**, kecuali ia punya pasangan/keturunan.
- Penemu (multaqith) **tidak** mewarisinya.
- Jika seseorang mengaku sebagai ayahnya (istilhaq) dan memungkinkan → nasab tetap, saling mewarisi.

---

## Dasar dan Rujukan Bab Ini
Kode: **[Q]** Al-Qur'an · **[H]** Hadits · **[A]** Atsar sahabat · **[IJ]** Ijma' (beserta penukilnya) · **[RDH]** Raudhah ath-Thalibin, an-Nawawi, Kitab al-Fara'idh (kutipan tanpa harakat) · **[KH]** Kaidah hisab operasional (bukan hukum syar'i). Daftar lengkap sumber: file `17_daftar_rujukan.md`.

| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |
|---|---|---|---|---|
| R13-11 | Li'an memutus waris dengan ayah; tidak ada ashabah dari pihak ibu | RDH | Raudhah 6/43 (Bab 7, fashl 1) · shamela:499/2332 | «اللعان يقطع التوارث بين الملاعن والولد... فلا عصبة للمنفي إلا من صلبه، أو بالولاء... وعصبة الأم لا يكونون عصبة له» |
| R13-12 | Anak zina seperti anak li'an | RDH | Raudhah 6/44 (Bab 7, fashl 2) · shamela:499/2333 | «ولد الزنا كالمنفي باللعان إلا في ثلاثة أشياء»; tidak bisa di-istilhaq. |
| R13-13 | Harta murtad menjadi fai' | RDH | Raudhah 6/30 (Bab 5) · shamela:499/2319 | Lihat R02-6. |
| R13-14 | Laqith | RDH (bab lain) | Raudhah, Kitab al-Laqith — di luar file | `[perlu verifikasi lanjut]` |
