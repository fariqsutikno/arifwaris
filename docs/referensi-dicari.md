# Referensi yang Dicari

> **Status 2026-09-29 (jawaban Shamela, kutipan dicek ke teks):** A1 ✔ (kecuali satu orang dua jalur), B1 ✔, B2 ✔, B3 ✔ (kecuali posisi baitul mal), B4 ✔, C1 ≈ (inferensi kuat, diterima), C2 ✘ tidak ada di kitab, D1 ✔, D2 ✔, D3 ✘ nomor atsar belum ketemu, D4 ≈ sebagian. Rincian di bab 18.3.

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

---

## Pertanyaan Siap Kirim ke AI Shamela

Satu blok = satu prompt. Pertanyaan ditulis dalam bahasa Arab karena korpus Shamela berbahasa Arab. Tiap prompt meminta **nash beserta nama kitab, juz, dan halaman**, supaya jawabannya bisa langsung dicatat di tabel rujukan.

### A1 — Qarabah dzawil arham [HNF]
```
ما طريقة توريث ذوي الأرحام عند الحنفية (مذهب أهل القرابة) بالتفصيل؟ أريد:
١- ترتيب الأصناف الأربعة، وكيف يُقدَّم الأقرب درجةً داخل الصنف الواحد.
٢- عند استواء الدرجة: هل يُقدَّم ولد الوارث على ولد ذي الرحم؟
٣- عند الاستواء في الدرجة والإدلاء: كيف تُعتبر قوة القرابة (لأبوين، ثم لأب، ثم لأم)؟
٤- إذا اختلفت صفة الأصول ذكورةً وأنوثةً: ما الفرق بين قول أبي يوسف وقول محمد بن الحسن، وبأيهما الفتوى في المذهب؟
٥- في الصنف الرابع (العمومة والخؤولة): هل يكون الثلثان لقرابة الأب والثلث لقرابة الأم؟
٦- حكم من أدلى بجهتين عندهم.
مع ذكر أمثلة محلولة بالأرقام، ونقل النص مع اسم الكتاب والجزء والصفحة (السراجية وشروحها، الاختيار، حاشية ابن عابدين).
```

### B1 — Ijazah wasiat sebelum wafat [HNB], [HNF]
```
ما حكم إجازة الورثة للوصية بما زاد على الثلث أو للوارث إذا وقعت في حياة الموصي (في صحته أو في مرض موته)؟ هل تلزمهم أم لهم الرجوع بعد موته؟ أريد قول الحنابلة وقول الحنفية تحديداً، مع نقل النص واسم الكتاب والجزء والصفحة (المغني، كشاف القناع، الهداية، بدائع الصنائع).
```

### B2 — Ayah mu'tiq bersama anak lk mu'tiq [HNF], [MLK]
```
إذا مات العتيق وخلّف أبا المعتِق وابنَ المعتِق (والمعتِق ميت)، فكيف يُقسم الولاء بينهما؟ هل هو كله للابن، أم للأب السدس والباقي للابن؟ أريد قول الحنفية وقول المالكية تحديداً، مع نقل النص واسم الكتاب والجزء والصفحة (السراجية وشروحها، مختصر خليل، الشرح الكبير للدردير).
```

### B3 — Urutan ashabah [HNF]
```
ما ترتيب جهات العصبة بالنفس عند الحنفية بالتفصيل؟ وأين موضع بني الإخوة من العمومة؟ وهل بيت المال من جهات الإرث عندهم أم يُقدَّم الرد وذوو الأرحام عليه؟ مع نقل النص واسم الكتاب والجزء والصفحة (السراجية وشروحها، حاشية ابن عابدين).
```

### B4 — Kafil dalam pembagian haml [HNF]
```
عند الحنفية: إذا قُسمت التركة قبل وضع الحمل ووُقف له نصيب ابن واحد وأُخذ الكفيل، ثم وُلد أكثر من واحد، فممن يُسترد النقص وكيف؟ مع نقل النص واسم الكتاب والجزء والصفحة.
```

### C1 — Munasakhat, 'aul, dan tashih antar-madzhab
```
هل يوجد خلاف بين المذاهب الأربعة في طريقة العمل في المناسخات (الجامعة والنظر بين السهام والمسائل)، وفي العول، وفي التصحيح؟ أم أن الخلاف إنما يقع في أحكام الورثة داخل كل مسألة فقط؟ أريد نصاً صريحاً ينفي الخلاف أو يثبته، مع اسم الكتاب والجزء والصفحة.
```

### C2 — Gabungan haml, khuntsa, dan mafqud
```
أبحث عن مسائل محلولة يجتمع فيها أكثر من سبب للوقف في مسألة واحدة، مثل: حمل مع خنثى مشكل، أو مفقود مع حمل، أو خنثى مع مفقود. كيف تُعمل التقادير (هل تُضرب تقادير كل سبب في تقادير الآخر؟) وكيف يُعطى كل وارث؟ وعند الحنابلة: إذا اجتمع خنثى لا يُرجى اتضاحه (يُعطى نصف النصيبين) مع حمل (يُعامل بالأضر ويُوقف)، فبأيهما يُبدأ؟ مع نقل النص واسم الكتاب والجزء والصفحة (العذب الفائض شرح عمدة الفارض، التحقيقات المرضية، المغني).
```

### D1 — R01-7: ijazah wasiat [SYF]
```
عند الشافعية: هل تصح إجازة الورثة للوصية الزائدة على الثلث أو للوارث قبل موت الموصي؟ أريد نص روضة الطالبين أو المنهاج وشروحه، مع الجزء والصفحة.
```

### D2 — R02-11: hadits wala'
```
خرّج حديث «الولاء لُحمة كلحمة النسب لا يُباع ولا يُوهب»: رقمه في صحيح ابن حبان وفي المستدرك للحاكم، ومن صححه ومن ضعفه، مع الجزء والصفحة.
```

### D3 — R11-3: atsar takharuj
```
خرّج أثر مصالحة تُماضر امرأة عبد الرحمن بن عوف عن ربع ثمنها (التخارج): في مصنف عبد الرزاق وسنن البيهقي، مع لفظه ورقمه والجزء والصفحة ودرجة إسناده.
```

### D4 — R13-14: laqith [SYF]
```
عند الشافعية: من يرث اللقيط إذا مات ولا وارث له من النسب؟ وهل يرثه الملتقط؟ وما حكم ميراثه إذا استلحقه رجل؟ أريد نص روضة الطالبين (كتاب اللقيط) أو المنهاج وشروحه، مع الجزء والصفحة.
```
