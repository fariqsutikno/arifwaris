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
| K01-1 | Ijazah wasiat > 1/3 | hanya setelah wafat (Bahr al-Madzhab) | hanya setelah wafat (Mughni 6/147) | hanya setelah wafat (Mabsuth 27/154) | di masa sehat boleh ditarik; di maradh al-maut mengikat (Mughni) | 01 |
| K02-1 | Pembunuhan yang menghalangi | semua bentuk | tanpa hak yang mewajibkan qishash/diyat/kafarat (Mughni 6/365 · shamela:8463/2687) | yang mewajibkan qawad atau kafarat, atau dianjurkan kafarat (Mabsuth 30/46–47 · shamela:5423/6014 shamela:5423/6015) | hanya 'amd zalim; khatha' tidak menghalangi dari harta ('Iqd 3/1249 · shamela:14594/1247; batasan «zalim» tidak disebut di 'Iqd) | 02 |
| K02-2 | Beda millah antar kafir | satu millah | dua riwayat Ahmad: kufur satu millah (Harb, al-Khallal) atau banyak millah (Abu Bakr); Ibnu Qudamah menilai «banyak millah» sebagai al-ashah, sehingga beda millah menghalangi (Mughni 6/368 · shamela:8463/2690) | satu millah — «أهل الكفر يتوارثون فيما بينهم وإن اختلفت مللهم» (Mabsuth 30/31 · shamela:5423/5999) | beda millah menghalangi ('Iqd 3/1247 · shamela:14594/1245) | 02 (tidak relevan platform) |
| K02-3 | Istri ditalak ba'in saat maradh al-maut | tidak mewarisi · opsi: qaul qadim mewarisi | mewarisi selama belum menikah lagi — «المشهور عن أحمد أنها ترثه في العدة وبعدها ما لم تتزوج» (Mughni 6/395 · shamela:8463/2717) | mewarisi bila suami wafat saat ia masih dalam iddah (Mabsuth 30/60 · shamela:5423/6028) | mewarisi walau sudah menikah lagi — «فلا ينقطع ميراثها بأن تتزوج غيره» ('Iqd 2/523–524 · shamela:14594/521 shamela:14594/522) | 02 |
| K02-4 | Ikhtilaf ad-dar antar kafir | dzimmi–harbi tidak saling mewarisi (al-madzhab); sesama harbi mewarisi walau beda dar (Raudhah 6/29 · shamela:499/2318) | bukan mani' — «قياس المذهب عندي أن الملة الواحدة يتوارثون وإن اختلفت ديارهم» (Ibnu Qudamah); al-Qadhi: dzimmi–harbi tidak saling mewarisi (Mughni 6/369 · shamela:8463/2691) | mani' pada tiga bentuk: dzimmi–harbi, musta'min–dzimmi, sesama harbi yang beda mana'ah/mulk (Mabsuth 30/33 · shamela:5423/6001) | bukan mani' (s) | 02 (tidak relevan platform) |
| K02-5 | Iqrar nasab oleh ahli waris yang lalu terhijab (daur hukmi) | nasab tetap, yang diakui tidak mewarisi — «أقر الأخ بابن لأخيه الميت ثبت نسبه ولا يرث» (Raudhah 6/33 · shamela:499/2322) | yang diakui ikut mewarisi dan pengaku gugur — «أقر وارث بمن لا يرث ويسقط به ميراثه... سقط ميراثها» (Mughni 6/363 · shamela:8463/2685) | belum ada nash sharih; «ظاهر كلامهم نعم» (iqrar sah) (Ibnu 'Abidin 5/619 · shamela:21613/3352) | mewarisi, nasab tidak tetap kecuali 2 saksi adil dari ahli waris (s) | 02 |
| K13-1 | Harta murtad | fai' baitul mal | fai' (Mughni 6/372–373 · shamela:8463/2694 shamela:8463/2695) | Abu Hanifah: harta semasa Islam untuk ahli waris muslim, semasa riddah fai'; harta murtaddah seluruhnya untuk ahli waris muslim (Mabsuth 10/101–107 memuat pembedaan kasb Islam/riddah; klaim harta murtaddah belum diperiksa · shamela:5423/2111 shamela:5423/2112) | fai' ('Iqd 3/1247 · shamela:14594/1245) | 13 |
| K13-2 | Ashabah anak li'an/zina | tidak ada; radd ke ibu/saudara seibu | ibu dan 'ashabah ibu mewarisinya (Mughni 6/340, matan al-Kharaqi «ترثه أمه وعصبتها» · shamela:8463/2662) | seperti orang yang tidak punya kerabat dari pihak ayah, hanya dari pihak ibu — «بمنزلة من لا قرابة له من قبل أبيه وله قرابة من قبل أمه»; «ashabah ibu» adalah pendapat lain (Ibnu Mas'ud, Ibnu 'Umar) (Mabsuth 29/198 · shamela:5423/5955) | tidak ada ('Iqd 3/1249: sisa ke mawali ibu bila ibu mu'taqah, selain itu baitul mal · shamela:14594/1247) | 13 |

### Ahli waris dan furudh
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K03-1 | Nenek lewat ayah di atas kakek (umm abil jadd) | ahli waris | hanya 3 nenek; ini dzawil arham (Mughni 6/300–301: tiga nenek — ummul umm, ummul ab, ummul jadd; ummu abil jadd tidak mewarisi · shamela:8463/2622 shamela:8463/2623) | ahli waris (Mabsuth 29/167 · shamela:5423/5924) | hanya nenek yang disepakati (ummul umm, ummul ab dan ke atas lewat perempuan); ini dzawil arham ('Iqd 3/1239–1240 · shamela:14594/1237 shamela:14594/1238) | 03 |
| K04-1 | Nenek dekat pihak ayah vs nenek jauh pihak ibu | tidak menghijab (yang dekat pihak ibu menghijab) | dekat menghijab mutlak (Mughni 6/302: satu dari dua riwayat Ahmad, pilihan Ibnu Qudamah · shamela:8463/2624) | dekat menghijab mutlak — «البعدى لا ترث مع القربى» (Mabsuth 29/169 · shamela:5423/5926) | = [SYF] — «والقربى من جهة الأم البعدى من جهة الأب، وإلا اشتركتا» (Khalil, dalam Minah al-Jalil 9/612 · shamela:21614/4810) | 04 |
| K04-2 | Ummul ab bersama ayah | terhijab | tidak terhijab (zhahir madzhab; riwayat lain: terhijab) (Mughni 6/303 · shamela:8463/2625) | terhijab — «الجدة التي من قبل الأب تدلي بالأب ولا ترث معه» (Mabsuth 29/170 · shamela:5423/5927) | terhijab — «وتسقط الجدات من أي جهة كن بالأم، وتسقط التي من جهة الأب [به]» ('Iqd 3/1242 · shamela:14594/1240) | 04 |
| K07-1 | Musyarrakah | tasyrik | tanpa tasyrik (Mughni 6/280 · shamela:8463/2602) | tanpa tasyrik — «إذا جعلنا أباكم حمارا فإنا نجعل أمكم أتانا فلا يستحق بالإدلاء بها شيء» (Mabsuth 29/155 · shamela:5423/5912) | tasyrik ('Iqd 3/1243–1244 · shamela:14594/1241 shamela:14594/1242) | 07 |

### Ashabah, jadd, radd
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K05-1 | Urutan jihah; kakek vs saudara | kakek sejajar saudara | = [SYF] — «مذهب أبي عبد الله في الجد قول زيد بن ثابت... قاسمهم الجد بمنزلة أخ» (Mughni 6/309 · shamela:8463/2631) | kakek = ayah, menghijab saudara (Mabsuth 29/180 · shamela:5423/5937) | = [SYF] — «فإنه يأخذ معهم الأفضل من الثلث أو المقاسمة لهم» ('Iqd 3/1245 · shamela:14594/1243) | 05, 08 |
| K05-2 | Furudh dalam wala' | tidak ada | ayah mu'tiq 1/6, sisanya untuk anak lk mu'tiq — «فلأبي معتقه السدس وما بقي فللابن» (nash Ahmad; Mughni 6/429 · shamela:8463/2751) | tidak ada — semua untuk anak lk mu'tiq (Mabsuth 30/39; Abu Yusuf akhir: ayah 1/6, marjuh) | tidak ada (Ibnu Syas, 'Iqd al-Jawahir 3/1197) | 05 |
| K08-1 | Rincian muqasamah/akdariyyah | madzhab Zaid (bab 08) | = [SYF] — muqasamah dengan mu'addah dan akdariyyah 27 (Mughni 6/309, 6/313 · shamela:8463/2631 shamela:8463/2635) | tidak berlaku (K05-1) | = [SYF] — mu'addah, dan «ولا يفرض للأخوات مع الجد شيئ مسمى إلا في الأكدرية» ('Iqd 3/1243–1246 · shamela:14594/1241 shamela:14594/1243 shamela:14594/1244) | 08 |
| K09-1 | Sisa harta tanpa ashabah | radd bila baitul mal tidak tegak · opsi: `kebijakanSisa` | radd mutlak, kecuali pasangan (Mughni 6/295 · shamela:8463/2617) | wala' → radd (kecuali pasangan) → dzawil arham (Mabsuth 29/175) | baitul mal bila imam adil; bila imam tidak adil «ينبغي أن يورث ذوو الأرحام، وأن يرد ما فضل عن ذوي السهام عليهم» ('Iqd 3/1247, nukilan dari ashhab · shamela:14594/1245) | 09 |

### Kasus khusus
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K13a-1 | Batas maksimal kehamilan | 4 th (Raudhah 8/377, Kitab al-'Iddah · shamela:499/3487) | 4 th — «في أصح الروايتين، وفي الأخرى سنتان» (Mughni 6/384 · shamela:8463/2706) | 2 th (Mabsuth 30/50 · shamela:5423/6018) | riwayat: 4 th (al-Qadhi menilainya masyhur), 5 th (Ibnu al-Qasim dan Sahnun; dasar hitungan al-Mudawwanah), ada yang 7 (Minah al-Jalil 4/308 · shamela:21614/1872) | 13a |
| K13a-2 | Dibagi sebelum haml lahir | boleh | boleh dibagi sebagian: yang tidak berkurang mendapat penuh, yang berkurang mendapat bagian minimum, yang gugur tidak diberi (Mughni 6/382 · shamela:8463/2704) | boleh dibagi sebagian — «من لا تتغير فريضته بالحمل فإنه يعطى فريضته» (Mabsuth 30/52 · shamela:5423/6020) | tidak dibagi sebelum haml lahir — «وأخرت لحمل» (Khalil, dalam Mawahib al-Jalil 5/352 · shamela:569/2550 shamela:569/2551) | 13a |
| K13a-3 | Yang ditahan untuk haml | jumlah tak dibatasi; mitra ashabah haml 0 (Raudhah 6/39 · shamela:499/2328) | ditahan bagian dua anak lk atau dua anak pr, mana yang lebih besar (riwayat Ahmad); pilihan Ibnu Qudamah: «ولادة التوأمين كثير معتاد... وما زاد عليهما نادر» (Mughni 6/383 · shamela:8463/2705) | fatwa: bagian **1 anak lk** (Abu Yusuf); kafil diambil dari ahli waris lain bila di antara mereka ada anak (Takmilah ath-Thuri 'ala al-Bahr ar-Ra'iq 8/574; Lahim: lk atau pr mana yang lebih besar) (Mabsuth 30/52: Abu Yusuf riwayat al-Khashshaf 1 anak lk, «هذا هو الأصح وعليه الفتوى» · shamela:5423/6020) | — | 13a |
| K13b-1 | Masa tunggu mafqud | ijtihad hakim | 4 th (yang umumnya binasa); yang umumnya selamat: dua riwayat — ijtihad hakim, atau 90 th (Mughni 6/389 · shamela:8463/2711) | «على ظاهر الرواية: إذا لم يبق أحد من أقرانه»; riwayat al-Hasan dari Abu Hanifah: 120 th dari kelahiran; riwayat lain 100 th (Mabsuth 30/54 · shamela:5423/6022) | «سبعون، وقيل ثمانون، وتسعون» — 70 th, ada yang 80, ada yang 90 ('Iqd 3/1249 · shamela:14594/1247) | 13b |
| K13b-2 | Ahli waris hadir bersama mafqud | al-aswa' (aqall) | bagian mafqud ditahan bersama «ما يشك في مستحقه», sisanya dibagi (Mughni 6/389 · shamela:8463/2711) | mafqud dianggap hidup untuk hartanya dan mati untuk harta orang lain; bagiannya ditahan seperti bagian haml (Mabsuth 30/54 · shamela:5423/6022) | al-aswa' ('Iqd 3/1250 · shamela:14594/1248) | 13b |
| K13c-1 | Khuntsa musykil | aqall semua + mauquf sampai jelas/ishtilah | ditahan sampai baligh: «أعطي هو ومن معه اليقين ووقف الباقي إلى حين بلوغه»; bila tetap musykil: setengah bagian lk dan setengah bagian pr (Mughni 6/335–336 · shamela:8463/2657 shamela:8463/2658) | Abu Hanifah dan Muhammad: «له شر الحالين وأقل النصيبين»; Abu Yusuf (akhir): setengah bagian lk dan setengah bagian pr (Mabsuth 30/92 · shamela:5423/6060) | setengah-setengah ('Iqd 3/1250 · shamela:14594/1248) | 13c |
| K13d-1 | Gharqa keadaan 3–5 | tidak saling mewarisi; keadaan 3 ditahan | saling mewarisi dari tilad (Mughni 6/378 · shamela:8463/2700) | tidak saling mewarisi (Mabsuth 30/27 · shamela:5423/5995) | tidak saling mewarisi ('Iqd 3/1249 · shamela:14594/1247) | 13d |
| K14-1 | Dzawil arham mewarisi | bila baitul mal tidak tegak | ya (Mughni 6/318–319 · shamela:8463/2641) | ya (Mabsuth 30/2 · shamela:5423/5970) | tidak mewarisi bila imam adil (harta ke baitul mal); bila imam tidak adil «ينبغي أن يورث ذوو الأرحام» ('Iqd 3/1247, nukilan dari ashhab · shamela:14594/1245) | 14 |
| K14-2 | Metode dzawil arham | tanzil | tanzil (Mughni 6/319 · shamela:8463/2641) | qarabah, 7 shinf (14.11; Mabsuth 30/6–7). Satu orang dua jalur belum ada nash | — | 14 |
| K14-3 | lk vs pr dalam dzawil arham | 2:1 kecuali cabang perantara seibu | sama rata bila ayah dan ibunya sama, kecuali khal (2/3) dan khalah (1/3) (Mughni 6/324 · shamela:8463/2646) | 2:1 dihitung per tingkat ushul (qaul Muhammad, zhahir madzhab) | — | 14 |

## 18.3 Yang Belum Ada (per 2026-09-29, setelah pencarian Shamela)
| Titik | Madzhab | Dampak ke engine |
|---|---|---|
| Satu dzawil arham lewat dua jalur menurut qarabah | [HNF] | kecil — kasus dua jalur mode [HNF] = `TIDAK_DIDUKUNG`, sisanya jalan |
| Posisi baitul mal dalam urutan [HNF] | [HNF] | tidak ada — engine tidak mengirim harta ke baitul mal selama ada dzawil arham |
| Nash eksplisit "tidak ada khilaf" untuk munasakhat/'aul/tashih | semua | tidak ada — dianggap [KH] sama: bab munasakhat/tashih ada di keempat madzhab dengan cara hitung sama ('Iqd al-Jawahir, al-Wasith, al-Hawi, al-Hidayah Abu al-Khaththab), dan 'aul disepakati kecuali Ibnu 'Abbas |
| Contoh kitab gabungan haml + khuntsa + mafqud | semua | 13.0b tetap aturan susunan kita; tidak ditemukan di 8.598 kitab Shamela lokal |

Daftar pencarian lengkap dengan kata kunci Arab: [`docs/referensi-dicari.md`](../referensi-dicari.md).

Rujukan yang bisa menutup: [HNF] *as-Sirajiyyah* + syarahnya; [MLK] *Mukhtashar Khalil* + *Syarh ad-Dardir*; [HNB] *al-Mughni* / *Kasysyaf al-Qina'*.
