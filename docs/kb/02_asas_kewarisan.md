---
bab: 02
judul: Asas Kewarisan (Syarat, Rukun, Asbab, Mawani')
tags: [syarat, rukun, sebab, penghalang, beda agama, pembunuhan, perbudakan, murtad]
---

# 02. Asas Kewarisan

## 2.1 Rukun (3) — jika satu hilang, tidak ada waris
1. **Muwarrits**: mayit (hakiki atau hukmi).
2. **Warits**: yang hidup setelah muwarrits dan memiliki sebab waris.
3. **Mauruts**: tirkah.

## 2.2 Syarat (3)
1. **Kematian muwarrits terbukti**: hakiki (disaksikan), hukmi (vonis hakim atas mafqud), atau taqdiri (janin yang gugur karena jinayah).
2. **Hidupnya warits setelah muwarrits terbukti**, meski sesaat, hakiki atau taqdiri (janin).
3. **Diketahui sebab/jihah waris**: suami-istri, kekerabatan (dan derajatnya), atau wala'.

Implikasi langsung syarat 2 → lihat bab 13 (gharqa, haml, mafqud).

## 2.3 Asbab (Sebab) Waris [R02-1] [R02-10] [R02-11] [R02-12]
Menurut [SYF] sebab waris ada **empat**: qarabah, nikah, wala', dan **jihat al-Islam** (baitul mal mewarisi harta orang yang tidak punya ahli waris, sebagai ashabah kaum muslimin) [R02-1]. Tiga sebab pertama disepakati semua madzhab dan dirinci di tabel berikut; sebab keempat relevan untuk bab 09 dan 14.
| Sebab | Cakupan | Catatan |
|------|---------|---------|
| **Nikah** | Akad nikah sah, walau belum dukhul | Tetap berlaku pada **talak raj'i selama iddah**. Talak ba'in tidak mewarisi, kecuali talak dalam maradh al-maut dengan tuhmah (lihat 2.5). Nikah fasid/batil tidak mewarisi. |
| **Nasab (qarabah)** | Ushul, furu', hawasyi | Tiga jalur: ke atas, ke bawah, ke samping. |
| **Wala'** | Kekerabatan hukmi akibat memerdekakan budak | Diwarisi oleh mu'tiq, lalu 'ashabah bi nafsihi-nya (bukan bil ghair/ma'al ghair). Mu'taq tidak mewarisi mu'tiq. |

Dalil wala': «إِنَّمَا الْوَلَاءُ لِمَنْ أَعْتَقَ» dan «الْوَلَاءُ لُحْمَةٌ كَلُحْمَةِ النَّسَبِ».

> **Catatan implementasi**: di konteks modern, wala' praktis tidak terjadi. Sistem boleh menyembunyikannya dari input default, tapi mempertahankannya dalam aturan urutan ashabah.

## 2.4 Mawani' (Penghalang) [R02-2] [R02-4] [R02-7] [R02-8]
Tiga penghalang di tabel ini disepakati semua madzhab. [SYF] menghitung **lima**: (1) beda agama, (2) riqq, (3) qatl, (4) **istibham waqt al-maut** (tidak diketahui siapa yang wafat lebih dulu, lihat bab 13.4), (5) **daur** (pewarisan yang justru meniadakan dirinya sendiri, mis. pengakuan nasab oleh saudara yang membuat anak itu menghijab saudara tsb.) [R02-2].
| Mani' | Hukum | Dalil |
|------|-------|-------|
| **Riqq** (perbudakan) | Budak tidak mewarisi dan tidak diwarisi. | Budak tidak memiliki harta. |
| **Qatl** (pembunuhan) | Pembunuh tidak mewarisi yang dibunuh. | «لَيْسَ لِلْقَاتِلِ مِنَ الْمِيرَاثِ شَيْءٌ» |
| **Ikhtilaf ad-din** (beda agama) | Muslim tidak mewarisi kafir, dan sebaliknya. | «لَا يَرِثُ الْمُسْلِمُ الْكَافِرَ، وَلَا الْكَافِرُ الْمُسْلِمَ» (متفق عليه) |

### Rincian pembunuhan yang menghalangi [R02-9]
> **KHILAF – Jenis pembunuhan**
> - **[SYF] (default)**: **semua bentuk pembunuhan** menghalangi warisan, termasuk yang berhak (qishash, hadd, membela diri, pelaksanaan hukum oleh hakim), karena keumuman hadits «لَيْسَ لِلْقَاتِلِ مِنَ الْمِيرَاثِ شَيْءٌ» tanpa perincian.
> - **Hanabilah**: hanya pembunuhan **tanpa hak** yang mewajibkan qishash, diyat, atau kafarat (termasuk khatha') yang menghalangi.
> - **Malikiyyah**: hanya pembunuhan sengaja ('amd) dan zalim; khatha' tidak menghalangi dari harta, tapi menghalangi dari diyat.
> - Sistem tetap menandai setiap kasus pembunuhan untuk verifikasi manusia/hakim, apa pun mode yang dipakai.

### Rincian beda agama [R02-4] [R02-5] [R02-6]
- Orang kafir dengan sesama kafir beda agama:
  > **KHILAF** — Jumhur (Hanafi, Syafi'i): kekafiran satu millah, saling mewarisi. Hanbali dan Maliki: beda millah (Yahudi, Nasrani, dll.) tidak saling mewarisi. *Tidak relevan bagi platform muslim; cukup ditandai.*
- **Pengecualian yang dibahas ulama** (Hanbali): (1) kafir yang masuk Islam sebelum tirkah dibagi; (2) wala'.
  > **[UTS]**: yang benar, **tidak ada pengecualian**; beda agama menghalangi mutlak, termasuk pada wala', karena keumuman dalil.
  > **Default sistem**: beda agama menghalangi mutlak; status agama dinilai **pada saat kematian** pewaris.
- **Murtad**: tidak mewarisi siapa pun (lihat bab 13).
- **Munafiq**: dihukumi Islam secara zahir. [UTS]: jika kemunafikannya nyata dan diketahui, tidak ada saling mewarisi.

## 2.5 Kasus Talak di Maradh al-Maut (Tuhmah) [R02-3]
Jika suami menalak ba'in istrinya dalam sakit menjelang wafat dengan dugaan hendak menghalanginya dari waris, para ulama berbeda pendapat apakah istri tetap mewarisi.
> **KHILAF — Istri ditalak ba'in tanpa ridhanya saat maradh al-maut**
> - **[SYF] qaul jadid (default)**: istri yang ditalak ba'in **tidak mewarisi**, karena ikatan nikah sudah terputus. Raudhah menyebut pewarisan *al-mabtutah fi maradh al-maut* hanya **"jika kita mengambil qaul qadim"** [R02-3], yang berarti qaul jadid (mu'tamad) menafikannya.
> - **[SYF] qaul qadim** (opsi): istri tetap mewarisi (sejalan dengan jumhur). Fatwa Dar al-Ifta Mesir yang memberi warisan selama masih iddah mengikuti arah ini (dan hukum positif Mesir), bukan qaul jadid.
> - **Hanabilah**: istri tetap mewarisi meski iddah telah selesai, selama belum menikah lagi.
> - **Malik**: tetap mewarisi meski sudah menikah lagi.
> - Kasus ini selalu ditandai untuk verifikasi hakim (pembuktian niat/tuhmah).
Kasus sebaliknya: istri melakukan hal yang memfasakh nikah di maradh al-maut-nya untuk menghalangi suami → suami tetap mewarisi (menurut Hanabilah).

## 2.6 Checklist Validasi Sistem
Untuk setiap calon ahli waris:
- [ ] Hidup saat pewaris wafat?
- [ ] Beragama Islam (jika pewaris muslim)?
- [ ] Bukan pembunuh pewaris (tanpa hak)?
- [ ] Hubungan sah: nikah sah (masih terikat atau iddah raj'i), nasab sah, atau wala'?
Jika gagal di salah satu → dikeluarkan dari daftar dan **tidak ikut menghijab siapa pun** (lihat bab 06, hajb awshaf).

---

## Dasar dan Rujukan Bab Ini
Kode: **[Q]** Al-Qur'an · **[H]** Hadits · **[A]** Atsar sahabat · **[IJ]** Ijma' (beserta penukilnya) · **[RDH]** Raudhah ath-Thalibin, an-Nawawi, Kitab al-Fara'idh (kutipan tanpa harakat) · **[KH]** Kaidah hisab operasional (bukan hukum syar'i). Daftar lengkap sumber: file `17_daftar_rujukan.md`.

| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |
|---|---|---|---|---|
| R02-1 | Sebab waris empat (termasuk jihat al-Islam) | RDH | Bab 1, Fashl Asbab at-Tauris | «أسباب التوريث أربعة: قرابة، ونكاح، وولاء، وجهة الإسلام... كان ماله لبيت المال يرثه المسلمون بالعصوبة... هذا هو الصحيح المشهور» |
| R02-2 | Penghalang waris lima | RDH | Bab 5, Bayan Mani' al-Mirats | «هو خمسة... الأول: اختلاف الدين... الثاني: الرق... الثالث: القتل... الرابع: استبهام وقت الموت... الخامس: الدور» |
| R02-3 | Talak ba'in di maradh al-maut | RDH | Bab 1, akhir Fashl Asbab | «وذلك في المبتوتة في مرض الموت إذا قلنا بالقديم: إنها ترث» → qaul jadid: tidak mewarisi. |
| R02-4 | Muslim dan kafir tidak saling mewarisi | H + RDH | Al-Bukhari no. 6764; Muslim no. 1614, dari Usamah bin Zaid · RDH Bab 5 | H: «لا يرث المسلم الكافر، ولا الكافر المسلم». RDH: «ولا فرق بين النسيب والمعتق والزوج، ولا بين من يسلم قبل القسمة أم لا» |
| R02-5 | Sesama kafir beda millah saling mewarisi | RDH | Bab 5, mas'alah 2 | «يرث الكفار بعضهم بعضا، كاليهودي من النصراني... والصحيح المعروف، هو الأول» |
| R02-6 | Murtad tidak mewarisi dan tidak diwarisi | RDH | Bab 5, mas'alah 3 | «لا يرث المرتد أحدا، ولا يرثه أحد، وماله فيء سواء كسبه في الإسلام أو في الردة» |
| R02-7 | Budak tidak mewarisi dan tidak diwarisi | RDH | Bab 5, mani' 2 | «فلا يرث رقيق وإن عتق قبل القسمة، ولا يورث رقيق إذ لا ملك له» |
| R02-8 | Pembunuh tidak mewarisi | H | At-Tirmidzi no. 2109; Ibnu Majah no. 2645, dari Abu Hurairah | «القاتل لا يرث». Diperkuat riwayat 'Umar dalam Muwaththa' Malik: «ليس لقاتل شيء». |
| R02-9 | Semua jenis pembunuhan menghalangi | RDH | Bab 5, mani' 3 | «والمذهب وظاهر نص الشافعي في الصور كلها: منع الإرث». Termasuk khatha' dan tasabbub: «وسواء كان القتل عمدا أو خطأ» |
| R02-10 | Wala' untuk yang memerdekakan | H | Al-Bukhari no. 2156; Muslim no. 1504, dari 'Aisyah (kisah Barirah) | «إنما الولاء لمن أعتق» |
| R02-11 | Wala' seperti nasab | H | Ibnu Hibban dan al-Hakim, dari Ibnu 'Umar | «الولاء لحمة كلحمة النسب، لا يباع ولا يوهب». `[nomor hadits perlu dicek]` |
| R02-12 | Suami-istri saling mewarisi | Q | An-Nisa' 12 | «ولكم نصف ما ترك أزواجكم...» |
