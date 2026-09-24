---
bab: 12
judul: Munasakhat (Kematian Berantai)
tags: [munasakhat, jamiah, kematian berantai, mayit kedua, ikhtishar]
---

# 12. Munasakhat

## 12.1 Definisi [R12-1]
Seorang ahli waris wafat **sebelum** tirkah mayit pertama dibagi, sehingga bagiannya berpindah ke ahli warisnya sendiri.

## 12.2 Tiga Keadaan [R12-2]

### Tabel Kaidah Pembeda (dari Lahim, hal. 72)

| Kondisi ahli waris mayit kedua | Keadaan |
|---|---|
| Terbatas pada **seluruh sisa** ahli waris mayit pertama, nisbah bagian **sama** | 1 |
| Terbatas pada **seluruh sisa** (*baqiyyah*) ahli waris mayit pertama, nisbah bagian **berbeda** | 3 (sub 1) |
| **Sebagian saja** (*ba'dh*) dari ahli waris mayit pertama | 3 (sub 2) |
| Ahli waris mayit pertama **ditambah** orang lain di luar itu | 3 (sub 3) |
| Ada **mayit ketiga** yang **tidak** mewarisi dari mayit pertama | 3 (sub 4) |
| Ahli waris masing-masing mayit **sepenuhnya terpisah (disjoint)**, DAN ada **>1 mayit** semacam ini | 2 |
| Hanya 1 mayit kedua yang ahli warisnya terpisah total dari mayit pertama | 3 (diproses sebagai kasus 2-mas'alah biasa) |

> **Catatan penting**: perbedaan sub-bentuk 1 Keadaan 3 vs Keadaan 1 ada di satu syarat saja: nisbah bagian. *Baqiyyah* (seluruh sisa) bisa masuk Keadaan 1 atau Keadaan 3 sub 1 tergantung apakah bagiannya berubah. *Ba'dh* (sebagian saja) selalu Keadaan 3.

---

### Keadaan 1 — Seluruh sisa, bagian tidak berbeda

**Kondisi**: ahli waris mayit kedua = **baqiyyah** (seluruh sisa) ahli waris mayit pertama, DAN nisbah bagian mereka **tidak berbeda** di kedua mas'alah.

**Teknik**: ikhtishar al-masa'il — anggap mayit kedua tidak pernah ada; bagi harta langsung ke ahli waris yang hidup saat pembagian. Tidak perlu prosedur jami'ah.

Sub-bentuk (4): ta'shib saja / ta'shib yang tadinya fardh lalu berubah / fardh + ta'shib / fardh saja. Untuk sub-bentuk **fardh saja**: mas'alah mayit pertama harus **'aul dengan nilai yang sama persis** dengan bagian mayit kedua — syarat ini *ghairu muththarid* (tidak selalu berlaku): Lahim hlm. 77 memberi contoh mas'alah 1 'aul **melebihi** bagian mayit kedua (zawj, syaqiqah, umm ab, ukht li-ab; seandainya ukht li-ab dihitung, 6 'aul ke 8 = 'aul 2, sedangkan bagiannya 1), dan ikhtishar tetap dipakai: 6 'aul ke 7. Lihat kasus uji M7.

Contoh: mayit meninggalkan 4 anak lk, lalu salah satunya wafat tanpa ahli waris selain 3 saudaranya → harta dibagi 3 anak lk langsung.

---

### Keadaan 2 — Disjoint, >1 mayit kedua

**Kondisi**: ahli waris **masing-masing** mayit sama sekali tidak mewarisi dari yang lain (fully disjoint), DAN ada **lebih dari satu** mayit seperti itu secara bersamaan.

**Teknik** (Lahim, "بجامعة واحدة"): satu jami'ah bersama, bukan bertahap.
1. Tiap mayit kedua: bandingkan sahamnya di mas'alah 1 dengan mas'alahnya → catat *wafq* mas'alah dan *wafq* saham (tabayun: seluruh mas'alah dan seluruh saham; inqisam: 1 dan hasil bagi).
2. Gabungkan semua *wafq* mas'alah dengan nisab arba' → *juz'* bersama.
3. Jami'ah = mas'alah 1 × *juz'* bersama.
4. Pengali mas'alah tiap mayit = *juz'* bersama ÷ *wafq* mas'alahnya × *wafq* sahamnya.

Hasilnya identik dengan menerapkan metode Keadaan 3 (12.3) mayit per mayit lalu ikhtishar as-siham [R12-3]. Contoh: kasus uji M8 (jami'ah 576).

---

### Keadaan 3 — Semua kasus lain

**Kondisi**: salah satu sub-bentuk di tabel di atas (sub 1–4), atau satu mayit kedua yang disjoint.

**Teknik**: metode jami'ah — lihat bagian 12.3.

---

## 12.3 Metode Jami'ah (Keadaan 2 & 3) [R12-2] [KH]

*Ini adalah cara kerja umum untuk semua keadaan (Amr Keempat Lahim). Keadaan 1 & 2 hanya diberi cara khusus demi ringkas; hasilnya identik jika diproses lewat cara ini [R12-3].*

### Tabel Perbandingan (3 cabang, tidak ada tadakhul) [KH]

Bandingkan **saham mayit kedua di mas'alah 1** dengan **total mas'alah 2**:

| Cabang | Syarat | Aksi |
|---|---|---|
| **Inqisam** (termasuk tamatsul) | `saham % mas'alah2 === 0` | Jami'ah = mas'alah 1; pengali mas'alah 2 = saham ÷ mas'alah 2 |
| **Tawafuq** | `gcd(saham, mas'alah2) > 1` dan tidak inqisam | Jami'ah = mas'alah 1 × wafq mas'alah 2; pengali mas'alah 2 = wafq saham |
| **Tabayun** | `gcd(saham, mas'alah2) === 1` | Jami'ah = mas'alah 1 × mas'alah 2; pengali mas'alah 2 = saham |

> Tidak ada cabang *tadakhul*: posisi "saham" di sini bukan dua bilangan independen yang bisa saling membagi habis. Inqisam mencakup tamatsul sebagai sub-kasusnya (`saham === mas'alah2` adalah kasus khusus `saham % mas'alah2 === 0`).

### Langkah-langkah

1. Buat **mas'alah 1** (mayit pertama), tashih jika perlu.
2. Buat **mas'alah 2** (mayit kedua), tashih jika perlu. Input tirkah mayit 2 = saham-nya dari mayit 1 + harta pribadi (lihat 12.5).
3. Tentukan cabang dari tabel di atas → hitung jami'ah dan pengali.
4. Bagian ahli waris mayit pertama (yang tidak mewarisi mayit kedua) = saham × pengali mas'alah 1.
5. Bagian ahli waris mayit kedua = saham × pengali mas'alah 2.
6. Ahli waris yang mewarisi dari keduanya → jumlahkan.
7. Jika ada mayit ketiga dst: jami'ah yang baru didapat jadi "mas'alah 1" baru, ulangi dari langkah 2.

---

## 12.4 Ikhtishar (Peringkasan) [R12-2]

Tiga jenis ikhtishar yang disebut Lahim (Amr Kedua), bersifat opsional untuk lapisan penyajian:

**Jenis 1 — Ikhtishar al-Masa'il** (ringkas sebelum kerja): gunakan satu mas'alah langsung untuk Keadaan 1. Tiga syarat: (a) ahli waris mayit 2 = seluruh sisa ahli waris mayit 1; (b) nisbah bagian tidak berbeda; (c) khusus bentuk fardh saja: 'aul mas'alah 1 sama persis dengan bagian mayit 2 — *ghairu muththarid*, lihat pengecualian di Keadaan 1 dan kasus M7.

**Jenis 2 — Ikhtishar al-Jawami'** (jami'ah): dipakai Keadaan 2 & 3, sama dengan metode 12.3 di atas.

**Jenis 3 — Ikhtishar as-Siham** (ringkas setelah kerja): setelah dapat jami'ah dan saham-saham akhir, jika semua saham **muwafaqah** (ada FPB > 1 untuk seluruh angka), boleh dibagi FPB bersama untuk tampilan lebih ringkas.

> **Implikasi engine**: jalur hitung selalu metode Keadaan 3 (12.3) — Keadaan 1 & 2 hanya label, bukan cabang kode berbeda. Ikhtishar Jenis 1 & 3 boleh diterapkan di lapisan penyajian setelah hitung selesai. Property test: untuk kasus Keadaan 1, assert hasil jami'ah (+ ikhtishar Jenis 3 jika berlaku) = hasil ikhtishar Jenis 1 langsung.

---

## 12.5 Harta Mayit Kedua

**[Keputusan Penerapan Prinsip Umum — dikonfirmasi pemilik project]**
Tidak ada teks eksplisit di Lahim yang membahas kasus ini langsung dalam konteks munasakhat. Keputusan ini adalah penerapan prinsip umum bab 01 kepada mayit kedua/ketiga/dst dalam rantai munasakhat.

Bagian tirkah mayit pertama yang jatuh ke mayit kedua menjadi hak milik penuh mayit kedua sejak wafatnya mayit pertama. Karena itu:
- **Tirkah mayit kedua** = saham dari mayit pertama **+** harta pribadi mayit kedua (jika ada).
- Tirkah gabungan itu **melewati pipeline bab 01 penuh** (tajhiz → hutang → wasiat → waris) sebelum dibagi ke ahli waris mayit kedua.
- **Default** (keputusan pemilik project): hutang, wasiat, dan harta pribadi mayit kedua dst. dianggap **sudah diselesaikan** sebelum munasakhat dihitung, jadi tidak ditanyakan dan harta dibagi menurut jami'ah. Bila pengguna mengisinya, tirkah gabungan mayit itu melewati bab 01 seperti di atas.

Kalau tidak ada potongan (hutang = 0, wasiat = 0, harta pribadi = 0), hasil pipeline penuh = hasil metode jami'ah langsung — ini dapat dijadikan assertion test.

---

## 12.6 Contoh [R12-4]

**Contoh 1** (Keadaan 3, saham tamatsul/inqisam):
Mayit 1: suami, ibu, saudara lk kandung → ashl 6: suami 3, ibu 2, saudara 1.
Sebelum dibagi, **suami** wafat meninggalkan: anak lk dan anak pr (dari istri lain).
- Mas'alah 2: ashabah 2:1 → ashl 3.
- Saham suami di mas'alah 1 = 3; mas'alah 2 = 3 → **tamatsul** (inqisam, saham = mas'alah 2 persis) → jami'ah = 6.
- Hasil: ibu 2, saudara 1, anak lk 2, anak pr 1.

**Contoh 2** (Keadaan 3, tabayun):
Mayit 1: istri, anak lk, anak pr → ashl 8 → tashih 24: istri 3, anak lk 14, anak pr 7.
**Anak pr** wafat meninggalkan ibu (istri tadi) dan saudara lk (anak lk tadi).
- Mas'alah 2: ibu 1/3, saudara sisa → ashl 3: ibu 1, saudara 2.
- Saham anak pr = 7; mas'alah 2 = 3 → **tabayun** → jami'ah = 24 × 3 = **72**.
- Istri: 3×3 + 1×7 = **16**; anak lk: 14×3 + 2×7 = **56**. Σ = 72 ✓.

---

## 12.7 Aturan Engine
- Proses mayit berurutan sesuai **waktu wafat**.
- Setiap mas'alah melewati pipeline lengkap (mani', hajb, furudh, 'aul/radd, tashih).
- Jalur hitung dasar = metode jami'ah (12.3) untuk semua kasus sesuai Amr Keempat Lahim [R12-3].
- Field `keadaan` (`keadaan_1` / `keadaan_2` / `keadaan_3`) disimpan untuk telusur-balik ke KB dan penjelasan ke pengguna, tapi tidak menentukan jalur kode.
- Ahli waris yang wafat sebelum mayit pertama bukan ahli waris sama sekali (bukan munasakhat).
- Jika urutan wafat tidak diketahui → bab 13 (gharqa).

---

## Dasar dan Rujukan Bab Ini
Kode: **[Q]** Al-Qur'an · **[H]** Hadits · **[A]** Atsar sahabat · **[IJ]** Ijma' (beserta penukilnya) · **[RDH]** Raudhah ath-Thalibin, an-Nawawi, Kitab al-Fara'idh (kutipan tanpa harakat) · **[KH]** Kaidah hisab operasional (bukan hukum syar'i). Daftar lengkap sumber: file `17_daftar_rujukan.md`.

| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |
|---|---|---|---|---|
| R12-1 | Definisi dan kedudukan munasakhat | RDH | Bab 9, Fashl 2, nazhar 2 | «التصحيح إذا مات وارثان فأكثر قبل القسمة، وتعرف: بالمناسخات» |
| R12-2 | Kaidah 3 keadaan, 3 jenis ikhtishar, teknik jami'ah | KH + Lahim | Lahim hal. 72 (kaidah pembeda), hal. 91 Amr 1–3 (ikhtishar), RDH Bab 9 | Lahim: kaidah pembeda pakai istilah *baqiyyah* vs *ba'dh*. Tabel jami'ah: 3 cabang (inqisam/tawafuq/tabayun), tidak ada tadakhul. |
| R12-3 | Jalur hitung dasar = Keadaan 3; Keadaan 1 & 2 ikhtishar opsional | Lahim | Lahim Amr Keempat "Shifatul 'Amal al-'Ammah" | «طريقة العمل العامة لجميع الحالات هي طريقة العمل في الحالة الثالثة... وإلا فلو قسمت المسألة في الحالتين بطريقة الحالة الثالثة، ثم اختصر بعد العمل لكانت النتيجة واحدة» |
| R12-4 | Contoh 12.6 | KH + Lahim | Contoh terverifikasi dari Lahim | Contoh 1: tamatsul (inqisam). Contoh 2: tabayun. |
