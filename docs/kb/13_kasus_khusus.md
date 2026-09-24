---
bab: 13
judul: Kasus Khusus (Haml, Mafqud, Khuntsa, Gharqa, Murtad, Anak Li'an/Zina, Laqith)
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

## 13.1 Haml (Janin) [R13-1] [R13-2] [R13-3] [R13-4] [R13-5]

### Dua Syarat Haml Diwarisi [R13-1] [R13-2]

**Syarat 1 — Terbukti ada di rahim saat wafatnya muwarrits**, walau baru nuthfah. Dibuktikan dengan **salah satu** kondisi:
- Lahir hidup (hayah mustaqirrah) **kurang dari 6 bulan** sejak wafat muwarrits — berlaku baik ibu berstatus firasy sah maupun tidak.
- Lahir hidup **dalam masa kehamilan yang tidak melebihi batas maksimal** sejak wafat muwarrits, **dengan syarat** ibu tidak digauli dan tidak menjadi firasy pihak lain sejak wafat muwarrits sampai wiladah.

**Syarat 2 — Lahir hidup dengan hayah mustaqirrah**, dibuktikan dengan tanda hidup: istihlal (teriak/menangis), bersin, menyusu, gerak signifikan, nafas signifikan. Dalil: hadits *"Idza istahalla al-maulud wuritsa"* [R13-2].

> **KHILAF – Batas maksimal masa kehamilan** [R13-5]
> - **[SYF] (default)**: **tidak ada angka pasti**, diserahkan ke ijtihad hakim/pengadilan agama per kasus — karena "masa kehamilan maksimal" di Kitab al-Fara'idh hanya disebut «أكثر مدة الحمل» tanpa angka. R13-5 `[perlu verifikasi lanjut]`.
> - Hanabilah (masyhur): 4 tahun. Hanafiyyah: 2 tahun. Malikiyyah: 4–5 tahun.
> - **Implikasi engine**: parameter `batas_kehamilan_maksimal` untuk mode [SYF] = input manual/ijtihad, bukan konstanta numerik. Batas minimal: **6 bulan** sejak akad (ijma', QS 46:15 + 31:14).

### Enam Taqdir (Skenario) Wajib [R13-3] [R13-4]

Jika ahli waris menuntut pembagian sebelum lahir, hitung **semua 6 taqdir** berikut (skip taqdir yang mustahil secara logis untuk kasus konkrit):

1. Lahir mati → haml tidak dapat warisan
2. Lahir 1 laki-laki
3. Lahir 1 perempuan
4. Lahir 2 laki-laki
5. Lahir 2 perempuan
6. Lahir 1 laki-laki + 1 perempuan

> Lebih dari 2 anak dianggap **nadir** (sangat jarang) → tidak perlu dihitung sebagai taqdir tersendiri [R13-3].

> **KHILAF – Berapa kemungkinan janin diperhitungkan**
> - **[SYF] (default, jumhur)**: 6 taqdir di atas (termasuk lahir mati), ditahan bagian terbesar antara skenario 2 lk atau 2 pr, karena kembar 2 bukan nadir. Ini jumhur tanpa khilaf [R13-4].
> - Hanabilah: 2 laki-laki atau 2 perempuan (mana yang lebih besar), plus kemungkinan tunggal.
> - Hanafiyyah: 1 laki-laki (fatwa Abu Yusuf).

### Klasifikasi Ahli Waris (3 Kelas) [R13-4]

Untuk setiap ahli waris (bukan haml):
- **Kelas A — tidak berubah** di semua taqdir → dapat bagian penuh sekarang, tidak ditahan.
- **Kelas B — bisa berkurang** (tapi tidak gugur) di sebagian taqdir → dapat bagian **terkecil (al-aqall)** dari semua taqdir; sisa ditahan.
- **Kelas C — bisa gugur total** di sebagian taqdir → tidak dapat apa pun sekarang (0); seluruh haknya ditahan.

### Algoritma Hitung (8 Langkah) [KH]

1. Buat *ashlul mas'alah* terpisah untuk tiap taqdir yang relevan; tashih tiap mas'alah jika perlu.
2. Cari **KPK** (*al-jami'ah*) dari seluruh ashlul mas'alah.
3. Bagi al-jami'ah dengan tiap ashlul mas'alah → dapat *juz'us sahm* per taqdir.
4. Kalikan nashib tiap ahli waris di tiap taqdir dengan juz'us sahm taqdir itu.
5. Untuk tiap ahli waris (bukan haml): bandingkan hasil kalinya di **semua** taqdir → ambil **yang terkecil** sebagai porsi definitif sementara (al-aqall).
6. Ahli waris yang gugur di sebagian taqdir → beri 0 (Kelas C).
7. Hitung sisa dari al-jami'ah (setelah dikurangi semua yang sudah dibagikan definitif) → **ditahan (mauquf)**.
8. Setelah haml lahir dan taqdir sebenarnya diketahui: bagikan mauquf sesuai taqdir yang terjadi — porsi tambahan untuk ahli waris yang tadinya dapat kurang, dan porsi penuh untuk haml sendiri (atau ke ahli waris lain jika lahir mati).

**Catatan**: modul jami'ah/juz'us sahm/al-aqall ini **identik** dengan algoritma mafqud (13.2) dan munasakhat (12) → gunakan modul `[KH]` yang sama dari `packages/math`.

## 13.2 Mafqud (Orang Hilang) [R13-6] [R13-7] [R13-8]
**Definisi**: orang yang hilang, putus kabarnya, tidak diketahui hidup atau matinya.
**Hukum asal**: dianggap **hidup** (istishhab) sampai terbukti mati atau divonis mati.

> **KHILAF – Masa menunggu**
> - **[SYF] (default, *ash-shahih min madzhab asy-Syafi'iyyah*)**: **diserahkan kepada ijtihad hakim**, tidak ada angka pasti. Tiga hujjah: (1) hukum asal adalah hidup — tidak boleh dihukumi mati hanya karena lewatnya waktu tanpa bayyinah; (2) masa ghalabatuzh-zhann berbeda menurut orang, keadaan, zaman, dan tempat → diserahkan ke ijtihad; (3) tidak ada nash syara' yang menentukan durasi pasti. (Sumber: Lahim, hlm. 169; juga [R13-6].)
> - Masyhur Hanabilah: kondisi **biasanya binasa** (perang, kapal tenggelam) → 4 tahun; kondisi **biasanya selamat** (bepergian, dagang) → sampai 90 tahun dari kelahiran.
> - Pendapat lain: 70 tahun, 90 tahun, wafatnya semua sebayanya.
> - **Implikasi engine**: parameter `masa_tunggu_mafqud` untuk mode [SYF] = input manual/ijtihad hakim per kasus, **bukan konstanta numerik bawaan**. Mode Hanabilah boleh punya konstanta (4 tahun / 90 tahun) karena ada nash madzhab yang menentukan.

**Dua sisi kasus**:
1. **Mafqud sebagai muwarrits**: hartanya tidak dibagi sampai vonis mati; dibagi kepada ahli waris yang hidup **pada saat vonis** [R13-7].
2. **Mafqud sebagai warits** (kerabatnya wafat saat ia hilang) [R13-8]: gunakan algoritma 2-taqdir di bawah.
   - Jika mafqud adalah satu-satunya ahli waris → seluruh tirkah ditangguhkan.
   - Jika terbukti/divonis mati → bagiannya dikembalikan kepada ahli waris pewaris pertama (bukan ke ahli waris mafqud).
   - [UTS / Hanbali]: jika masa tunggu habis tanpa kabar, harta yang ditahan menjadi **tirkah mafqud** dan diwarisi ahli warisnya. *(Default sistem: ikuti vonis hakim.)*

### Algoritma 2-Taqdir (Mafqud sebagai Warits) [KH]

1. Buat mas'alah dengan mafqud dianggap **mati**, tashih jika perlu.
2. Buat mas'alah dengan mafqud dianggap **hidup**, tashih jika perlu.
3. Bandingkan kedua mas'alah dengan nisab arba' → dapat *al-jami'ah*.
4. Bagi jami'ah dengan tiap mas'alah → *juz'us sahm* masing-masing.
5. Kalikan nashib tiap ahli waris di tiap mas'alah dengan juz'us sahm-nya.
6. Bandingkan nashib tiap ahli waris di 2 mas'alah → ambil yang **terkecil (al-aqall)** sebagai porsi definitif sementara.
7. Sisa ditahan sampai status mafqud jelas (terbukti hidup, terbukti/divonis mati sebelum/sesudah wafatnya muwarrits) → bagikan sesuai kondisi riil.

**Catatan**: struktur algoritma ini **identik** dengan algoritma haml (13.1), hanya beda jumlah taqdir (2 vs 6) dan sumber ketidakpastian — gunakan modul `[KH]` yang sama dari `packages/math`.

## 13.3 Khuntsa Musykil [R13-9]
**Definisi**: orang yang memiliki alat kelamin laki-laki dan perempuan sekaligus, atau tidak memiliki keduanya. **Musykil** = belum jelas kecenderungannya.

**Penentuan status (dilakukan sebelum musykil)**:
- Sebelum baligh: dari **tempat keluarnya air seni** (mana yang lebih dulu, lalu mana yang lebih banyak).
- Setelah baligh: tanda-tanda (tumbuh janggut, mimpi basah dari alat laki-laki → lk; haid, tumbuh payudara, hamil → pr).
- Di era modern: pemeriksaan medis (kromosom, hormon, organ dalam) diterima sebagai qarinah kuat. *Catatan sistem*: minta verifikasi medis/hakim.

**Ahli waris yang mungkin khuntsa** hanya dari jalur yang bisa lk/pr: anak, cucu, saudara, anak saudara, paman, anak paman, mu'tiq. (Tidak mungkin: ayah, ibu, kakek, nenek, suami, istri, karena akad nikah/keturunan menetapkan jenisnya.)

> **KHILAF – Cara mewarisi khuntsa musykil**
> - **Jika masih diharapkan jelas** (kecil): sepakat mayoritas → setiap orang diberi bagian terkecil, sisanya ditangguhkan.
> - **Jika tidak diharapkan jelas** (meninggal/baligh tetap musykil):
>   - **Hanabilah**: khuntsa dan orang lain diberi **setengah bagian lk + setengah bagian pr** (rata-rata dua taqdir).
>   - **Hanafiyyah**: khuntsa diberi yang terkecil; yang lain yang terbesar.
>   - **Syafi'iyyah [SYF]** (juga Al-Fara'idh al-Muyassar): setiap orang diberi terkecil yang yakin, sisanya ditahan sampai jelas atau berdamai.

**Langkah (default)**: buat mas'alah dengan asumsi lk dan asumsi pr → jami'ah (KPK) → setiap orang mendapat bagian terkecil dari keduanya → sisanya mauquf.

## 13.4 Gharqa, Hadma, Harqa (Mati Bersamaan) [R13-10]
**Pola**: sekelompok orang yang saling mewarisi wafat dalam satu musibah umum (tenggelam, runtuh, terbakar, kecelakaan).

**Lima keadaan** (pembagian dari Ibnu 'Utsaimin):
1. Diketahui siapa yang wafat belakangan secara pasti → ia mewarisi yang lebih dulu, tidak sebaliknya.
2. Diketahui wafat serentak → tidak saling mewarisi.
3. Tidak diketahui berurutan atau serentak.
4. Diketahui berurutan tapi tidak diketahui siapa yang terakhir.
5. Diketahui yang terakhir, lalu terlupakan.

> **KHILAF – Keadaan 3, 4, 5**
> - **[SYF], jumhur (Abu Hanifah, Malik), juga Ibnu 'Utsaimin**: **tidak saling mewarisi**; harta masing-masing untuk ahli warisnya yang masih hidup, karena syarat hidupnya warits setelah muwarrits tidak terbukti.
> - **[SYF] — tambahan khusus keadaan 5** (diketahui yang terakhir lalu terlupakan): ditunggu sampai ingat atau para ahli waris berdamai (ishtilah), sebelum harta dibagi.
> - **Masyhur Hanabilah**: jika ahli waris mereka tidak berselisih, masing-masing mewarisi dari **tilad** (harta asli) yang lain, bukan dari harta yang diwarisi darinya (menghindari daur). Jika berselisih tanpa bukti → saling bersumpah, lalu tidak saling mewarisi. Disediakan sebagai opsi.

## 13.5 Murtad [R13-13]
- Murtad **tidak mewarisi** siapa pun, muslim maupun kafir.
- Harta murtad yang mati dalam kemurtadannya:
  > **KHILAF**
  > - **Malik, Syafi'i, masyhur Hanabilah (default)**: menjadi **fai'** untuk baitul mal.
  > - Abu Hanifah: harta yang diperoleh saat masih Islam diwarisi ahli waris muslimnya.
  > - **Ibnu 'Utsaimin**: beda agama menghalangi mutlak tanpa pengecualian, sehingga ahli waris muslim tidak mewarisinya (sejalan dengan default).
- Sistem: status murtad membutuhkan **putusan resmi**; tanpa itu, sistem tidak boleh menghukumi seseorang murtad.

## 13.6 Anak Li'an dan Anak Zina [R13-11] [R13-12]
- Nasab dari ayah **terputus**; nasab dari ibu tetap.
- Tidak ada saling mewarisi dengan **ayah biologis** dan kerabat ayah.
- Saling mewarisi dengan **ibu** dan kerabat ibu. Saudara-saudara dari ibunya adalah saudara seibu baginya.
- Ashabah-nya:
  > **KHILAF** — **[SYF] dan Malik (default, konsisten dengan bab 09)**: tidak ada ashabah baginya; sisa harta dikembalikan dengan **radd** kepada ibu/saudara seibu (mengikuti kaidah radd Syafi'i untuk kondisi baitul mal tidak teratur), atau ke baitul mal jika baitul mal syar'i berjalan.
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
| R13-1 | Syarat janin mewarisi | RDH | Bab 6, sabab 3 (al-Haml) | «وإنما يرث بشرطين. أحدهما: أن يعلم وجوده عند الموت... الشرط الثاني: أن ينفصل حيا» |
| R13-2 | Tanda hidup | H + RDH | Abu Dawud no. 2920, dari Abu Hurairah · RDH | H: «إذا استهل المولود ورث». RDH: «بصراخه، وكذا بالبكاء، أو العطاس، أو التثاؤب، أو امتصاص الثدي» |
| R13-3 | >2 janin = nadir; 6 taqdir wajib | RDH + Lahim | RDH Idem; Lahim "المطلب الثالث" & "المطلب الثامن" | RDH: «الأصح أو الصحيح: أنه لا ضبط له». Lahim menetapkan 6 taqdir operasional; >2 anak = nadir, tidak perlu jadi taqdir tersendiri. |
| R13-4 | 3 kelas ahli waris + al-aqall | RDH + Lahim | RDH Idem; Lahim idem | RDH: «فمن احتمل حجبه بالحمل، لم يدفع إليه شيء ومن لا يحجبه الحمل بحال وله مقدر لا ينقص دفع إليه. وإن أمكن العول، دفع إليه ذلك القدر عائلا». Algoritma 8 langkah dari Lahim. |
| R13-5 | Batas kehamilan [SYF] = ijtihad hakim | RDH (bab lain) | Raudhah, Kitab al-'Idad — di luar file | `[perlu verifikasi lanjut]`. Di Kitab al-Fara'idh hanya disebut «أكثر مدة الحمل» tanpa angka. Default [SYF] = tidak ada angka pasti; 4 tahun = Hanabilah masyhur. |
| R13-6 | Masa tunggu mafqud [SYF] = ijtihad hakim | RDH + Lahim | RDH Bab 6, sabab 1; Lahim hlm. 169 | RDH: «وهذه المدة ليست مقدرة عند الجمهور». Lahim hlm. 169 eksplisit: «وهذا هو الصحيح من مذهب الشافعية» — ash-shahih Syafi'iyyah tidak menetapkan angka, diserahkan ijtihad hakim. |
| R13-7 | Harta mafqud untuk ahli waris saat vonis | RDH | Idem | «ثم إنا ننظر إلى من يرثه حين حكم الحاكم بموته» |
| R13-8 | Mafqud sebagai ahli waris: diambil yang terburuk | RDH | Idem | «وأخذنا في حق كل واحد من الحاضرين بالأسوأ» |
| R13-9 | Khuntsa: yakin dan mauquf | RDH | Bab 6, sabab 4 | «أخذ في حق الخنثى ومن معه من الورثة باليقين، ويوقف المشكوك فيه». Pengakuan khuntsa diterima: «قطع الإمام بأنه يقضى بقوله» |
| R13-10 | Gharqa: tidak saling mewarisi; keadaan 5 ditunggu | RDH | Bab 5, mani' 4 | «ففي هذه الصور الثلاث لا نورث أحدهما من صاحبه... الخامسة: أن يعلم سبق موته، ثم يلتبس فيوقف الميراث حتى يتبين أو يصطلحا» |
| R13-11 | Li'an memutus waris dengan ayah; tidak ada ashabah dari pihak ibu | RDH | Bab 7, fashl 1 | «اللعان يقطع التوارث بين الملاعن والولد... فلا عصبة للمنفي إلا من صلبه، أو بالولاء... وعصبة الأم لا يكونون عصبة له» |
| R13-12 | Anak zina seperti anak li'an | RDH | Bab 7, fashl 2 | «ولد الزنا كالمنفي باللعان إلا في ثلاثة أشياء»; tidak bisa di-istilhaq. |
| R13-13 | Harta murtad menjadi fai' | RDH | Bab 5 | Lihat R02-6. |
| R13-14 | Laqith | RDH (bab lain) | Raudhah, Kitab al-Laqith — di luar file | `[perlu verifikasi lanjut]` |
