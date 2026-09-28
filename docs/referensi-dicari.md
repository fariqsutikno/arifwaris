# Referensi yang Dicari

Daftar semua titik yang **masih kosong** di knowledge base, per 2026-09-29. Sumber yang sudah disisir: Lahim (bab munasakhat, gharqa, haml, khuntsa, mafqud, dzawil arham), slide Ithraa, Tashil al-Fara'idh (Ibnu 'Utsaimin), Al-Fara'idh al-Muyassar, dan Raudhah (Kitab al-Fara'idh).

Nukilan Lahim atau Ithraa sudah cukup sebagai dasar. Satu nukilan yang jelas menyebut nama madzhabnya sudah bisa menutup satu baris.

Kode `Kxx-y` merujuk ke [bab 18](kb/18_matriks_khilaf.md), sedangkan `Rxx-y` merujuk ke tabel rujukan tiap bab.

---

## Ringkasan per madzhab

| Madzhab | Titik yang masih kosong | Yang menghambat engine |
|---|---|---|
| **[HNF] Hanafi** | 5 (A1, B1, B2, B3, B4) | **Dzawil arham mode Hanafi tidak bisa dihitung** (A1) |
| **[MLK] Maliki** | 1 (B2) | tidak ada |
| **[HNB] Hanbali** | 1 (B1) | tidak ada |
| **[SYF] Syafi'i** | 4 (D, verifikasi lama) | tidak ada |
| Semua madzhab | 2 (C1, C2) | tidak ada (diduga tidak ada khilaf); C2 = aturan gabungan kita sendiri |

---

## A. Menghambat engine

### A1. Rincian metode qarabah dzawil arham — [HNF] · K14-2
Lahim hanya menyebut empat jihah qarabah dan urutannya, lalu berkata «ولهم تفاصيل ... ليس هذا مقام بيانها». Tanpa rincian ini, dzawil arham mode Hanafi = `TIDAK_DIDUKUNG`.

Yang dibutuhkan:
1. Dalam **satu jihah**, bagaimana yang lebih dekat derajatnya ke mayit didahulukan.
2. Bila derajatnya **sama**: kaidah *walad al-warits* (anak dari ahli waris didahulukan atas anak dzawil arham).
3. Bila derajat dan sifatnya sama: **quwwat al-qarabah** (kandung > sebapak > seibu).
4. Cara membagi bila jalurnya berbeda sifat (lk/pr) di tingkat atas. Ini khilaf Abu Yusuf vs Muhammad bin al-Hasan: yang dipakai dalam madzhab yang mana?
5. Jihah 'umumah & khu'ulah: pembagian **2/3 untuk pihak ayah, 1/3 untuk pihak ibu**.
6. Satu orang yang lewat dua jalur (menurut qarabah).
7. Idealnya 3–5 contoh soal dengan angka jadi, untuk kasus uji.

Kata kunci: «مذهب أهل القرابة», «ترتيب ذوي الأرحام عند الحنفية», «الصنف الأول ... الصنف الرابع», «قول أبي يوسف وقول محمد في ذوي الأرحام», «ولد الوارث أولى».
Kitab: **as-Sirajiyyah** (as-Sajawandi) beserta syarahnya (*Syarh as-Sayyid asy-Syarif al-Jurjani*), *al-Ikhtiyar*, *Hasyiyah Ibn 'Abidin* bab dzawil arham.

---

## B. Madzhab yang kosong (tidak menghambat, tapi matriks belum lengkap)

### B1. Ijazah ahli waris atas wasiat > 1/3 atau untuk ahli waris — kapan sah · K01-1
Kosong: **[HNB], [HNF]**. [SYF]: hanya setelah wafat. [MLK]: juga sah saat maradh al-maut.
Kata kunci: «إجازة الورثة الوصية قبل موت الموصي», «الإجازة في مرض الموت».
Kitab: *al-Mughni* (Kitab al-Washaya); *al-Hidayah* / *Badai' ash-Shanai'* (Kitab al-Washaya).

### B2. Ayah/kakek mu'tiq bersama anak lk mu'tiq (furudh dalam wala') · K05-2
Kosong: **[HNF], [MLK]**. [SYF]: murni ashabah (anak lk menghabiskan). [HNB]: ayah dapat 1/6.
Kata kunci: «إذا اجتمع أبو المعتق وابنه», «الولاء للابن دون الأب», «السدس للأب في الولاء».
Kitab: as-Sirajiyyah bab al-wala'; *Syarh ad-Dardir* / *Mukhtashar Khalil* bab al-wala'.

### B3. Urutan ashabah [HNF] selain soal kakek
Ithraa menulis urutan Hanafi: bunuwwah → ubuwwah → ukhuwwah → 'umumah → wala', tanpa rincian. Yang belum pasti:
- Posisi **anak saudara** (bani al-ikhwah): masuk jihah ukhuwwah, didahulukan atas 'umumah?
- Apakah **baitul mal** termasuk di urutan (Ithraa hanya menyebutnya untuk [MLK]/[SYF]).
Kata kunci: «ترتيب العصبات عند الحنفية», «جهات العصوبة».
Kitab: as-Sirajiyyah bab al-'ashabat.

### B4. Nasib bagian mauquf haml yang ternyata milik mitra — [HNF]
Lahim hanya menyebut kafil. Yang belum jelas: jika bayi lahir lebih dari satu, dari siapa kekurangannya ditagih?
Kata kunci: «يؤخذ الكفيل ممن ... الحمل», «إذا ولد أكثر من واحد رجع».

---

## C. Berlaku semua madzhab: diduga tidak ada khilaf, tapi belum ada nukilan yang menyatakannya

### C1. Munasakhat, 'aul, tashih, qismah
Dugaan: cara hitungnya sama di keempat madzhab, dan perbedaan hanya muncul lewat titik-titik khilaf di bab 18. Cukup satu kalimat dari kitab mana pun yang menyatakan "tidak ada khilaf dalam cara kerja munasakhat/tashih".
Kata kunci: «لا خلاف في طريقة العمل في المناسخات», «العول ... قال به الجمهور» (ingat: Ibnu 'Abbas menolak 'aul, tapi tidak diikuti keempat madzhab).

### C2. Gabungan beberapa ketidakpastian dalam satu kasus (bab 13.0b)
Tidak ada contoh kitab untuk haml + khuntsa + mafqud dalam satu kasus. Aturan di 13.0b adalah susunan kita sendiri (hasil kali skenario, lalu aqall). Yang dicari:
- Contoh kitab mana pun tentang **haml bersama khuntsa**, atau **mafqud bersama haml**.
- Untuk [HNB]: kalau khuntsa tak diharapkan jelas (setengah-setengah) bertemu haml (aqall + mauquf), mana yang diterapkan lebih dulu?
Kata kunci: «اجتماع الحمل والخنثى», «اجتماع المفقود والحمل», «مسائل الخنثى مع الحمل».
Kitab: *al-'Adzb al-Fa'idh Syarh 'Umdah al-Faridh* (Ibrahim al-Faridh, Hanbali) memuat banyak masalah gabungan; *at-Tahqiqat al-Mardhiyyah* (Shalih al-Fauzan).

---

## D. [SYF]: sisa verifikasi lama (bab 17.4)

| Kode | Topik | Yang dibutuhkan |
|---|---|---|
| R01-7 | Ijazah wasiat baru sah setelah wafat | Raudhah, Kitab al-Washaya — atau nukilan Lahim/Ithraa |
| R02-11 | Nomor hadits «الولاء لحمة كلحمة النسب» | Shahih Ibnu Hibban / al-Mustadrak al-Hakim |
| R11-3 | Atsar takharuj 'Abdurrahman bin 'Auf (istri Tumadhir) | Mushannaf 'Abdurrazzaq / Sunan al-Baihaqi |
| R13-14 | Hukum laqith (anak temuan) dalam waris | Raudhah, Kitab al-Laqith — atau nukilan lain |

---

## Sudah terisi hari ini (tidak perlu dicari)
- Pembunuhan [HNF], talak di maradh al-maut [HNF], nenek [MLK], radd [MLK], harta murtad [HNF], ikhtilaf ad-dar, iqrar nasab: dari Ithraa.
- Batas maksimal kehamilan: [SYF] 4 tahun, [HNB] 4, [HNF] 2, [MLK] 4 (masyhur) / 5 (diamalkan): dari Ithraa. **R13-5 selesai.**
- Haml [SYF]: mitra ashabah haml diberi 0 (Lahim + Ithraa). **R13-15 selesai.**
