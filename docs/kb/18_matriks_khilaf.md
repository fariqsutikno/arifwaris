---
bab: 18
judul: Matriks Khilaf Antar-Madzhab
tags: [khilaf, madzhab, syafii, hanbali, hanafi, maliki, ruleset, overlay]
---

# 18. Matriks Khilaf Antar-Madzhab

Sumber tunggal untuk ruleset overlay. **[SYF]** = default dan dasar; [HNB], [HNF], [MLK] hanya mengubah titik yang tercantum di sini. Titik yang tidak ada di tabel ini = sama dengan [SYF] untuk semua madzhab **hanya bila** bab asalnya menyebut ijma'/jumhur; selain itu dianggap **belum dikaji** dan engine mode non-[SYF] mengembalikan `TIDAK_DIDUKUNG` untuk kasus yang menyentuhnya.

## 18.1 Konvensi
- **Kode** `Kxx-y` (xx = bab asal; 13a–13d memakai `K13a-y` dst.). Blok `KHILAF` di bab asal memuat dalil dan kutipan; tabel ini hanya ringkasan keputusan.
- **Status sel**: tanpa tanda = `primer` (dicek ke teks madzhab: untuk [SYF] = Raudhah). **(s)** = `sekunder` (nukilan Lahim, Ithraa, Ibnu 'Utsaimin, Al-Muyassar). **?** = belum ada nukilan; engine → `TIDAK_DIDUKUNG`.
- **Opsi**: bila satu madzhab punya khilaf internal yang wajib menjadi parameter, ditulis `opsi:` dan masuk `KonfigurasiMadzhab`.
- Sel (s) dari Lahim atau Ithraa **cukup sebagai dasar implementasi** (keputusan pengguna 2026-09-29); tidak menunggu teks primer. UI tetap menyebut sumbernya ("menurut Lahim/Ithraa").

## 18.2 Matriks

### Syarat, mawani', hak tirkah
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K01-1 | Ijazah wasiat > 1/3 | hanya setelah wafat (Bahr al-Madzhab 8/42 · shamela:16934/3737) | hanya setelah wafat (Mughni 6/147 · shamela:8463/2469) | hanya setelah wafat (Mabsuth 27/154 · shamela:5423/5509) | di masa sehat boleh ditarik; di maradh al-maut mengikat (Mughni) | 01 |
| K01-2 | Urutan hak 'ain vs mu'nah tajhiz | hak yang terkait 'ain (rahn, zakat wajib) dahulu, baru tajhiz (Raudhah 6/3 · shamela:499/2292) | tajhiz dahulu, lalu nadzr mu'ayyan, udhhiyah mu'ayyanah, dain bi rahn, zakat (s) (Dalil ath-Thalib, catatan Hasyiyah al-Lubdi hlm. 117 · shamela:11196/88) | «فأول ما يبدأ به تجهيزه وتكفينه ودفنه بالمعروف»; rahn tidak dibahas ? (Mabsuth 29/136 · shamela:5423/5893) | = [SYF] — «حق تعلق بعين ... ثم مؤنة تجهيزه بالمعروف ثم تقضى ديونه» (Mawahib 6/406–407 · shamela:569/3058 shamela:569/3059) | 01 |
| K02-1 | Pembunuhan yang menghalangi | semua bentuk | tanpa hak yang mewajibkan qishash/diyat/kafarat (Mughni 6/365 · shamela:8463/2687) | yang mewajibkan qawad atau kafarat, atau dianjurkan kafarat (Mabsuth 30/46–47 · shamela:5423/6014 shamela:5423/6015) | hanya 'amd zalim; khatha' tidak menghalangi dari harta ('Iqd 3/1249 · shamela:14594/1247; batasan «zalim» tidak disebut di 'Iqd) | 02 |
| K02-2 | Beda millah antar kafir | satu millah | dua riwayat Ahmad: kufur satu millah (Harb, al-Khallal) atau banyak millah (Abu Bakr); Ibnu Qudamah menilai «banyak millah» sebagai al-ashah, sehingga beda millah menghalangi (Mughni 6/368 · shamela:8463/2690) | satu millah — «أهل الكفر يتوارثون فيما بينهم وإن اختلفت مللهم» (Mabsuth 30/31 · shamela:5423/5999) | beda millah menghalangi ('Iqd 3/1247 · shamela:14594/1245) | 02 (tidak relevan platform) |
| K02-3 | Istri ditalak ba'in saat maradh al-maut | tidak mewarisi · opsi: qaul qadim mewarisi | mewarisi selama belum menikah lagi — «المشهور عن أحمد أنها ترثه في العدة وبعدها ما لم تتزوج» (Mughni 6/395 · shamela:8463/2717) | mewarisi bila suami wafat saat ia masih dalam iddah (Mabsuth 30/60 · shamela:5423/6028) | mewarisi walau sudah menikah lagi — «فلا ينقطع ميراثها بأن تتزوج غيره» ('Iqd 2/523–524 · shamela:14594/521 shamela:14594/522) | 02 |
| K02-4 | Ikhtilaf ad-dar antar kafir | dzimmi–harbi tidak saling mewarisi (al-madzhab); sesama harbi mewarisi walau beda dar (Raudhah 6/29 · shamela:499/2318) | bukan mani' — «قياس المذهب عندي أن الملة الواحدة يتوارثون وإن اختلفت ديارهم» (Ibnu Qudamah); al-Qadhi: dzimmi–harbi tidak saling mewarisi (Mughni 6/369 · shamela:8463/2691) | mani' pada tiga bentuk: dzimmi–harbi, musta'min–dzimmi, sesama harbi yang beda mana'ah/mulk (Mabsuth 30/33 · shamela:5423/6001) | bukan mani' (s) | 02 (tidak relevan platform) |
| K02-5 | Iqrar nasab oleh ahli waris yang lalu terhijab (daur hukmi) | nasab tetap, yang diakui tidak mewarisi — «أقر الأخ بابن لأخيه الميت ثبت نسبه ولا يرث» (Raudhah 6/33 · shamela:499/2322) | yang diakui ikut mewarisi dan pengaku gugur — «أقر وارث بمن لا يرث ويسقط به ميراثه... سقط ميراثها» (Mughni 6/363 · shamela:8463/2685) | belum ada nash sharih; «ظاهر كلامهم نعم» (iqrar sah) (Ibnu 'Abidin 5/619 · shamela:21613/3352) | pengaku menyerahkan seluruh bagiannya kepada yang diakui — «كأخوين أقر أحدهما بابن فيدفع المقر للمقر به جميع نصيبه» (Khalil, dalam Minah al-Jalil 9/684 · shamela:21614/4882) | 02 |
| K13-1 | Harta murtad | fai' baitul mal | fai' (Mughni 6/372–373 · shamela:8463/2694 shamela:8463/2695) | Abu Hanifah: harta semasa Islam untuk ahli waris muslim, semasa riddah fai'; harta murtaddah seluruhnya untuk ahli waris muslim (Mabsuth 10/101–107 memuat pembedaan kasb Islam/riddah; klaim harta murtaddah belum diperiksa · shamela:5423/2111 shamela:5423/2112) | fai' ('Iqd 3/1247 · shamela:14594/1245) | 13 |
| K13-2 | Ashabah anak li'an/zina | tidak ada; radd ke ibu/saudara seibu | ibu dan 'ashabah ibu mewarisinya (Mughni 6/340, matan al-Kharaqi «ترثه أمه وعصبتها» · shamela:8463/2662) | seperti orang yang tidak punya kerabat dari pihak ayah, hanya dari pihak ibu — «بمنزلة من لا قرابة له من قبل أبيه وله قرابة من قبل أمه»; «ashabah ibu» adalah pendapat lain (Ibnu Mas'ud, Ibnu 'Umar) (Mabsuth 29/198 · shamela:5423/5955) | tidak ada ('Iqd 3/1249: sisa ke mawali ibu bila ibu mu'taqah, selain itu baitul mal · shamela:14594/1247) | 13 |

### Ahli waris dan furudh
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K03-1 | Nenek lewat ayah di atas kakek (umm abil jadd) | ahli waris | hanya 3 nenek; ini dzawil arham (Mughni 6/300–301: tiga nenek — ummul umm, ummul ab, ummul jadd; ummu abil jadd tidak mewarisi · shamela:8463/2622 shamela:8463/2623) | ahli waris (Mabsuth 29/167 · shamela:5423/5924) | hanya nenek yang disepakati (ummul umm, ummul ab dan ke atas lewat perempuan); ini dzawil arham ('Iqd 3/1239–1240 · shamela:14594/1237 shamela:14594/1238) | 03 |
| K04-1 | Nenek dekat pihak ayah vs nenek jauh pihak ibu | tidak menghijab (yang dekat pihak ibu menghijab) | dekat menghijab mutlak (Mughni 6/302: satu dari dua riwayat Ahmad, pilihan Ibnu Qudamah · shamela:8463/2624) | dekat menghijab mutlak — «البعدى لا ترث مع القربى» (Mabsuth 29/169 · shamela:5423/5926) | = [SYF] — «والقربى من جهة الأم البعدى من جهة الأب، وإلا اشتركتا» (Khalil, dalam Minah al-Jalil 9/612 · shamela:21614/4810) | 04 |
| K04-2 | Ummul ab bersama ayah | terhijab | tidak terhijab (zhahir madzhab; riwayat lain: terhijab) (Mughni 6/303 · shamela:8463/2625) | terhijab — «الجدة التي من قبل الأب تدلي بالأب ولا ترث معه» (Mabsuth 29/170 · shamela:5423/5927) | terhijab — «وتسقط الجدات من أي جهة كن بالأم، وتسقط التي من جهة الأب [به]» ('Iqd 3/1242 · shamela:14594/1240) | 04 |
| K04-3 | Nenek dengan dua qarabah | satu bagian; 1/6 dibagi dua (Raudhah 6/10 · shamela:499/2299) | mewarisi dengan tiap qarabah — «فوجب أن ترث بكل واحدة منهما» (Mughni 6/303 · shamela:8463/2625) | Muhammad, Zufar, al-Hasan bin Ziyad seperti [HNB]; Abu Yusuf seperti [SYF] (s, dinukil Mughni 6/303; belum ke Mabsuth) ? | «قياس قول مالك» seperti [SYF] (s, dinukil Mughni 6/303; belum ke 'Iqd/Mawahib) ? | 04 |
| K07-1 | Musyarrakah | tasyrik | tanpa tasyrik (Mughni 6/280 · shamela:8463/2602) | tanpa tasyrik — «إذا جعلنا أباكم حمارا فإنا نجعل أمكم أتانا فلا يستحق بالإدلاء بها شيء» (Mabsuth 29/155 · shamela:5423/5912) | tasyrik ('Iqd 3/1243–1244 · shamela:14594/1241 shamela:14594/1242) | 07 |

### Ashabah, jadd, radd
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K05-1 | Urutan jihah; kakek vs saudara | kakek sejajar saudara | = [SYF] — «مذهب أبي عبد الله في الجد قول زيد بن ثابت... قاسمهم الجد بمنزلة أخ» (Mughni 6/309 · shamela:8463/2631) | kakek = ayah, menghijab saudara (Mabsuth 29/180 · shamela:5423/5937) | = [SYF] — «فإنه يأخذ معهم الأفضل من الثلث أو المقاسمة لهم» ('Iqd 3/1245 · shamela:14594/1243) | 05, 08 |
| K05-2 | Furudh dalam wala' | tidak ada | ayah mu'tiq 1/6, sisanya untuk anak lk mu'tiq — «فلأبي معتقه السدس وما بقي فللابن» (nash Ahmad; Mughni 6/429 · shamela:8463/2751) | tidak ada — semua untuk anak lk mu'tiq (Mabsuth 30/39 · shamela:5423/6007; Abu Yusuf akhir: ayah 1/6, marjuh) | belum terverifikasi: 'Iqd 3/1197 · shamela:14594/1195 hanya memuat urutan wala', tidak menyebut fardh [perlu verifikasi lanjut] | 05 |
| K08-1 | Rincian muqasamah/akdariyyah | madzhab Zaid (bab 08) | = [SYF] — muqasamah dengan mu'addah dan akdariyyah 27 (Mughni 6/309, 6/313 · shamela:8463/2631 shamela:8463/2635) | tidak berlaku (K05-1) | = [SYF] — mu'addah, dan «ولا يفرض للأخوات مع الجد شيئ مسمى إلا في الأكدرية» ('Iqd 3/1243–1246 · shamela:14594/1241 shamela:14594/1243 shamela:14594/1244) | 08 |
| K09-1 | Sisa harta tanpa ashabah | radd bila baitul mal tidak tegak · opsi: `kebijakanSisa` | radd mutlak, kecuali pasangan (Mughni 6/295 · shamela:8463/2617) | wala' → radd (kecuali pasangan) → dzawil arham (Mabsuth 29/175 · shamela:5423/5932) | baitul mal bila imam adil; bila imam tidak adil «ينبغي أن يورث ذوو الأرحام، وأن يرد ما فضل عن ذوي السهام عليهم» ('Iqd 3/1247, nukilan dari ashhab · shamela:14594/1245) | 09 |

### Kasus khusus
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K13a-1 | Batas maksimal kehamilan | 4 th (Raudhah 8/377, Kitab al-'Iddah · shamela:499/3487) | 4 th — «في أصح الروايتين، وفي الأخرى سنتان» (Mughni 6/384 · shamela:8463/2706) | 2 th (Mabsuth 30/50 · shamela:5423/6018) | riwayat: 4 th (al-Qadhi menilainya masyhur), 5 th (Ibnu al-Qasim dan Sahnun; dasar hitungan al-Mudawwanah), ada yang 7 (Minah al-Jalil 4/308 · shamela:21614/1872) | 13a |
| K13a-2 | Dibagi sebelum haml lahir | boleh | boleh dibagi sebagian: yang tidak berkurang mendapat penuh, yang berkurang mendapat bagian minimum, yang gugur tidak diberi (Mughni 6/382 · shamela:8463/2704) | boleh dibagi sebagian — «من لا تتغير فريضته بالحمل فإنه يعطى فريضته» (Mabsuth 30/52 · shamela:5423/6020) | tidak dibagi sebelum haml lahir — «وأخرت لحمل» (Khalil, dalam Mawahib al-Jalil 5/352 · shamela:569/2550 shamela:569/2551) | 13a |
| K13a-3 | Yang ditahan untuk haml | jumlah tak dibatasi; mitra ashabah haml 0 (Raudhah 6/39 · shamela:499/2328) | ditahan bagian dua anak lk atau dua anak pr, mana yang lebih besar (riwayat Ahmad); pilihan Ibnu Qudamah: «ولادة التوأمين كثير معتاد... وما زاد عليهما نادر» (Mughni 6/383 · shamela:8463/2705) | fatwa: bagian **1 anak lk** (Abu Yusuf); kafil diambil dari ahli waris lain bila di antara mereka ada anak (Lahim: lk atau pr mana yang lebih besar) (Mabsuth 30/52: Abu Yusuf riwayat al-Khashshaf 1 anak lk, «هذا هو الأصح وعليه الفتوى» · shamela:5423/6020) | — | 13a |
| K13a-4 | Tanda hidup janin | istihlal, tangis, bersin, menyusu (Raudhah 6/37 · shamela:499/2326) | yang masyhur dari Ahmad: hanya istihlal berupa teriak — «فالمشهور عن أحمد أنه لا يرث حتى يستهل» (Mughni 6/385 · shamela:8463/2707); riwayat lain: teriak/bersin/menangis; riwayat ketiga: tiap tanda hidup | teriak, bersin, atau gerak anggota badan (Mabsuth 30/50 · shamela:5423/6018); sebagian besar tubuh keluar cukup (Mughni 6/385, nisbat kepada Abu Hanifah) | istihlal saja (s) (Mughni 6/385 memasukkan Malik; Taudhih al-Ahkam 4/171 · shamela:133369/758) | 13a |
| K13b-1 | Masa tunggu mafqud | ijtihad hakim | 4 th (yang umumnya binasa); yang umumnya selamat: dua riwayat — ijtihad hakim, atau 90 th (Mughni 6/389 · shamela:8463/2711) | «على ظاهر الرواية: إذا لم يبق أحد من أقرانه»; riwayat al-Hasan dari Abu Hanifah: 120 th dari kelahiran; riwayat lain 100 th (Mabsuth 30/54 · shamela:5423/6022) | «سبعون، وقيل ثمانون، وتسعون» — 70 th, ada yang 80, ada yang 90 ('Iqd 3/1249 · shamela:14594/1247) | 13b |
| K13b-2 | Ahli waris hadir bersama mafqud | al-aswa' (aqall) | bagian mafqud ditahan bersama «ما يشك في مستحقه», sisanya dibagi (Mughni 6/389 · shamela:8463/2711) | mafqud dianggap hidup untuk hartanya dan mati untuk harta orang lain; bagiannya ditahan seperti bagian haml (Mabsuth 30/54 · shamela:5423/6022) | al-aswa' ('Iqd 3/1250 · shamela:14594/1248) | 13b |
| K13c-1 | Khuntsa musykil | aqall semua + mauquf sampai jelas/ishtilah | ditahan sampai baligh: «أعطي هو ومن معه اليقين ووقف الباقي إلى حين بلوغه»; bila tetap musykil: setengah bagian lk dan setengah bagian pr (Mughni 6/335–336 · shamela:8463/2657 shamela:8463/2658) | Abu Hanifah dan Muhammad: «له شر الحالين وأقل النصيبين»; Abu Yusuf (akhir): setengah bagian lk dan setengah bagian pr (Mabsuth 30/92 · shamela:5423/6060) | setengah-setengah ('Iqd 3/1250 · shamela:14594/1248) | 13c |
| K13d-1 | Gharqa keadaan 3–5 | tidak saling mewarisi; keadaan 3 ditahan | saling mewarisi dari tilad (Mughni 6/378 · shamela:8463/2700) | tidak saling mewarisi (Mabsuth 30/27 · shamela:5423/5995) | tidak saling mewarisi ('Iqd 3/1249 · shamela:14594/1247) | 13d |
| K14-1 | Dzawil arham mewarisi | bila baitul mal tidak tegak | ya (Mughni 6/318–319 · shamela:8463/2641) | ya (Mabsuth 30/2 · shamela:5423/5970) | tidak mewarisi bila imam adil (harta ke baitul mal); bila imam tidak adil «ينبغي أن يورث ذوو الأرحام» ('Iqd 3/1247, nukilan dari ashhab · shamela:14594/1245) | 14 |
| K14-2 | Metode dzawil arham | tanzil | tanzil (Mughni 6/319 · shamela:8463/2641) | qarabah, 7 shinf (14.11; Mabsuth 30/6 · shamela:5423/5974). Satu orang dua jalur belum ada nash | — | 14 |
| K14-3 | lk vs pr dalam dzawil arham | 2:1 kecuali cabang perantara seibu | sama rata bila ayah dan ibunya sama, kecuali khal (2/3) dan khalah (1/3) (Mughni 6/324 · shamela:8463/2646) | 2:1 dihitung per tingkat ushul (qaul Muhammad, zhahir madzhab) | — | 14 |

## 18.3 Yang Belum Ada (per 2026-09-29, setelah pencarian Shamela)
| Titik | Madzhab | Dampak ke engine |
|---|---|---|
| Furudh dalam wala' (K05-2) | [MLK] | kecil — mode [MLK] = `TIDAK_DIDUKUNG` untuk kasus wala' dengan ayah mu'tiq; 'Iqd 3/1197 belum menyebut fardh |
| Harta murtaddah untuk ahli waris muslim (K13-1) | [HNF] | tidak ada — kasus murtad bukan lingkup platform; klaim belum dicek ke Mabsuth |
| Satu dzawil arham lewat dua jalur menurut qarabah | [HNF] | kecil — kasus dua jalur mode [HNF] = `TIDAK_DIDUKUNG`, sisanya jalan |
| Posisi baitul mal dalam urutan [HNF] | [HNF] | tidak ada — engine tidak mengirim harta ke baitul mal selama ada dzawil arham |
| Nash eksplisit "tidak ada khilaf" untuk munasakhat/'aul/tashih | semua | tidak ada — dianggap [KH] sama: bab munasakhat/tashih ada di keempat madzhab dengan cara hitung sama ('Iqd al-Jawahir, al-Wasith, al-Hawi, al-Hidayah Abu al-Khaththab), dan 'aul disepakati kecuali Ibnu 'Abbas |
| Contoh kitab gabungan haml + khuntsa + mafqud | semua | 13.0b tetap aturan susunan kita; tidak ditemukan di 8.598 kitab Shamela lokal |

Tambahan hasil verifikasi 18.4 (2026-09-29): tidak ketemu pernyataan langsung di kitab yang dicari.

| Token | Madzhab | Keterangan |
|---|---|---|
| R02-1 | [HNB] [HNF] | [HNF] menyebut tiga sebab (Mabsuth 29/138 · shamela:5423/5895), jihat al-Islam bukan sebab; [HNB] belum ada pernyataan setara di Mughni |
| R03-2 | [MLK] | 'Iqd 3/1240 hanya «الأعمام وبنيهم وإن بعدوا»; paman ayah/kakek belum eksplisit |
| R04-6 | [HNF] [MLK] | [HNF] berbeda pada butir 1 (kakek menghijab saudara, K05-1); [MLK] belum ada nukilan 'umariyyatain dengan kakek |
| R06-3 | [HNF] | Tuhfat al-Muluk hlm. 256 · shamela:6173/232 memasukkan kakek sebagai penghalang saudara (K05-1) |
| R09-2 | [HNB] [HNF] | pernyataan «ashl = jumlah kepala» belum ditemukan; hanya rasio 2:1 |
| R13-1 | [MLK] | belum ditemukan pernyataan dua syarat janin di 'Iqd/Mawahib |
| R09-7, R09-8, R09-9 | semua | tidak diverifikasi di sini; ikut K09-1 |

Daftar pencarian lengkap dengan kata kunci Arab: [`docs/referensi-dicari.md`](../referensi-dicari.md).

Rujukan yang bisa menutup: [HNF] *as-Sirajiyyah* + syarahnya; [MLK] *Mukhtashar Khalil* + *Syarh ad-Dardir*; [HNB] *al-Mughni* / *Kasysyaf al-Qina'*.

## 18.4 Keberlakuan Token Engine per Madzhab
Token `Rxx-y` yang dipakai engine. **ya** = keputusan yang sama berlaku untuk madzhab itu; **tidak** = belum dikaji
atau berbeda tanpa overlay → engine mode itu `TIDAK_DIDUKUNG` bila kasus menyentuh token ini. Titik yang punya baris di 18.2
mengikuti barisnya: sel "= [SYF]" → ya; sel berbeda → tidak (overlay memakai kode `Kxx-y`, bukan token ini).
Status: **draf 2026-09-29, menunggu review pengguna.**

| Token | [HNB] | [HNF] | [MLK] | Dasar |
|---|---|---|---|---|
| R01-1 | tidak | tidak | ya | [MLK] ya: Mawahib 6/406–407 (matan Khalil). [HNB]/[HNF] berbeda urutan: K01-2 |
| R01-4 | ya | ya | ya | 01, nukilan lintas-madzhab: Mughni 6/146 «في قول جميع العلماء»; Mabsuth 29/138; 'Iqd 3/1223 |
| R01-7 | ya | ya | tidak | K01-1: [HNB]/[HNF] sama isi dengan [SYF] (hanya setelah wafat); [MLK] berbeda |
| R01-9 | ya | ya | ya | ikut R01-4 (keputusan scope engine) |
| R02-1 | tidak | tidak | ya | [MLK] 'Iqd 3/1239 (jihat al-Islam → baitul mal «على المشهور»). [HNF] tiga sebab; [HNB] belum ditemukan |
| R02-3 | tidak | tidak | tidak | K02-3 berbeda di ketiga madzhab |
| R02-4 | ya | ya | ya | 2.4: «Tiga penghalang di tabel ini disepakati semua madzhab» (beda agama) |
| R02-9 | tidak | tidak | tidak | K02-1 berbeda; ditunda (keputusan 2026-09-29) |
| R03-1 | ya | ya | ya | 03, nukilan: Mughni 6/305 «مجمع على توريثهم»; Mabsuth 29/174; 'Iqd 3/1240. Anggota sama, hitungan berbeda karena pengelompokan |
| R03-2 | ya | ya | tidak | 03, nukilan: Mughni 6/305; Mabsuth 29/174. [MLK] belum eksplisit |
| R03-4 | tidak | ya | tidak | K03-1: [HNF] ahli waris (= [SYF]); [HNB]/[MLK] dzawil arham |
| R03-5 | ya | ya | ya | 3.2: nenek fasidah «disepakati bukan ahli waris furudh» |
| R04-2 | ya | ya | ya | 04, nukilan: Mughni 6/277 «بإجماع أهل العلم»; Mabsuth 29/148; 'Iqd 3/1241–1242 |
| R04-3 | ya | ya | ya | Jenis IJ: ijma' dinukil an-Nawawi (RDH 6/9) dan Ibnu al-Mundzir |
| R04-4 | ya | ya | ya | 4.7 KHILAF: «[SYF] dan jumhur»: ikhwah minimal 2, 1/3 al-baqi |
| R04-5 | ya | ya | ya | 04, nukilan: Mughni 6/276–277 «أجمع أهل العلم على هذا كله»; Tuhfat al-Muluk hlm. 246; 'Iqd 3/1244 |
| R04-6 | ya | tidak | tidak | [HNB] Mughni 6/306 (ijma' IMN, kecuali 3 hal). [HNF] beda (K05-1); [MLK] belum ditemukan |
| R04-7 | ya | ya | ya | 04, nukilan: Mughni 6/299 (ijma' IMN); Mabsuth 29/167; 'Iqd 3/1246 |
| R04-8 | tidak | tidak | tidak | nenek dua qarabah berbeda: K04-3; bagian «berbagi 1/6» sama (Mughni 6/300, Mabsuth 29/167, 'Iqd 3/1246) |
| R04-9 | tidak | tidak | ya | K04-1: [MLK] = [SYF]; [HNB]/[HNF] dekat menghijab mutlak |
| R04-10 | tidak | ya | ya | K04-2: [HNF]/[MLK] terhijab (= [SYF]); [HNB] tidak terhijab |
| R04-11 | ya | ya | ya | Jenis IJ: ijma' dinukil RDH 6/13 dan Ibnu al-Mundzir |
| R04-12 | ya | ya | ya | 04, nukilan: Mughni 6/273 «مجمع عليه»; Mabsuth 29/141; 'Iqd 3/1244 |
| R04-13 | ya | ya | ya | 04, nukilan: Mughni 6/271 «وأجمع أهل العلم»; Mabsuth 29/141, 29/143; 'Iqd 3/1244 |
| R04-14 | ya | ya | ya | 04, nukilan: Mughni 6/274 «مجمع عليها»; Mabsuth 29/155–156; 'Iqd 3/1246 |
| R04-16 | ya | ya | ya | 04, nukilan: Mughni 6/278; Mabsuth 29/154; 'Iqd 3/1246. «Lima kekhususan» tidak dinukil sebagai daftar |
| R05-2 | ya | tidak | ya | K05-1/K08-1: [HNB]/[MLK] = [SYF]; [HNF] kakek = ayah |
| R05-3 | ya | ya | ya | 05, nukilan: Mughni 6/277, 6/306; Tuhfat al-Muluk hlm. 252; 'Iqd 3/1242 |
| R05-4 | ya | ya | ya | 05, nukilan: Tuhfat al-Muluk hlm. 252 (klasifikasi tiga eksplisit); Mughni 6/269, 6/275 dan 'Iqd 3/1240 memuat isinya |
| R05-5 | ya | ya | ya | 05, nukilan: Mughni 6/269 «قول عامة أهل العلم»; Tuhfat al-Muluk hlm. 253; 'Iqd 3/1240 |
| R06-2 | ya | ya | ya | 06, nukilan: Mughni 6/306; Tuhfat al-Muluk hlm. 255; 'Iqd 3/1241 |
| R06-3 | ya | tidak | ya | 06, nukilan: Mughni 6/268, 6/306; 'Iqd 3/1241–1242. [HNF] beda (K05-1) |
| R06-4 | ya | ya | ya | Jenis IJ: «بالإجماع» (RDH 6/27) dan Ibnu al-Mundzir |
| R06-5 | ya | ya | ya | 06, nukilan: Mughni 6/268 «أجمع على هذا أهل العلم»; Mabsuth 29/154; 'Iqd 3/1242 |
| R06-6 | ya | ya | ya | 6.1: yang terhijab tetap hajb nuqshan «menurut jumhur» |
| R07-1 | ya | ya | ya | 7.1: «Hukum (jumhur, keputusan Umar)»; dengan kakek 1/3 penuh «menurut jumhur» |
| R07-2 | tidak | tidak | ya | K07-1: [MLK] tasyrik (= [SYF]); [HNB]/[HNF] tanpa tasyrik |
| R07-3 | tidak | tidak | ya | K07-1: [MLK] tasyrik (= [SYF]); [HNB]/[HNF] tanpa tasyrik |
| R08-2 | ya | tidak | ya | K05-1/K08-1: [HNB]/[MLK] = [SYF]; [HNF] tidak berlaku |
| R08-3 | ya | tidak | ya | K05-1/K08-1: [HNB]/[MLK] = [SYF]; [HNF] tidak berlaku |
| R08-4 | ya | tidak | ya | K05-1/K08-1: [HNB]/[MLK] = [SYF]; [HNF] tidak berlaku |
| R08-5 | ya | tidak | ya | K05-1/K08-1: [HNB]/[MLK] = [SYF]; [HNF] tidak berlaku |
| R09-1 | ya | ya | ya | 09, nukilan: Mughni 6/286; Mabsuth 29/201, 29/203; 'Iqd 3/1253 |
| R09-2 | tidak | tidak | ya | [MLK] 'Iqd 3/1253. [HNB]/[HNF] belum ditemukan |
| R09-3 | ya | ya | ya | 9.3: «ijma' setelahnya menetapkan 'aul»; 18.3 'aul disepakati kecuali Ibnu 'Abbas |
| R09-4 | ya | ya | ya | 9.3: 'aul ijma'; batas 'aul = KH, 18.3 |
| R09-7 | tidak | tidak | tidak | K09-1 berbeda di ketiga madzhab |
| R09-8 | tidak | tidak | tidak | K09-1 berbeda di ketiga madzhab |
| R09-9 | tidak | tidak | tidak | K09-1 berbeda di ketiga madzhab |
| R09-10 | ya | ya | ya | KH, 18.3 baris munasakhat/'aul/tashih |
| R10-1 | ya | ya | ya | KH, 18.3 baris munasakhat/'aul/tashih |
| R10-2 | ya | ya | ya | KH, 18.3 baris munasakhat/'aul/tashih |
| R10-3 | ya | ya | ya | KH, 18.3 baris munasakhat/'aul/tashih |
| R11-1 | ya | ya | ya | KH, 18.3 baris munasakhat/'aul/tashih |
| R12-1 | ya | ya | ya | KH, 18.3 baris munasakhat/'aul/tashih |
| R12-2 | ya | ya | ya | KH, 18.3 baris munasakhat/'aul/tashih |
| R12-3 | ya | ya | ya | KH, 18.3 baris munasakhat/'aul/tashih |
| R13-1 | ya | ya | tidak | 13a, nukilan: Mughni 6/384; Mabsuth 30/50. [MLK] belum ditemukan |
| R13-2 | tidak | tidak | tidak | tanda hidup berbeda: K13a-4 |
| R14-3 | tidak | tidak | tidak | K14-1 berbeda di ketiga madzhab |
| R14-4 | tidak | tidak | tidak | K14-1 berbeda di ketiga madzhab |
| R14-5 | tidak | tidak | tidak | K14-1 berbeda di ketiga madzhab |
