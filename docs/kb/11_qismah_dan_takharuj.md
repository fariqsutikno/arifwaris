---
bab: 11
judul: Pembagian Tirkah (Qismah) dan Takharuj
tags: [qismah tirkah, nominal, takharuj, shulh]
---

# 11. Qismah at-Tirkah dan Takharuj

## 11.1 Konversi Saham ke Nominal [R11-1]
Metode utama (paling aman untuk komputasi):
> **Bagian ahli waris = (saham ahli waris ÷ tashih/ashl) × tirkah bersih**

Tirkah bersih = tirkah − tajhiz − hutang − wasiat (bab 01).

Metode alternatif klasik (hasilnya sama):
1. **Nisbah**: saham ÷ ashl, dikalikan tirkah.
2. **Qirath**: tirkah dibagi 24 qirath (tidak perlu untuk sistem modern).
3. **Qismah tirkah ÷ ashl** lalu × saham masing-masing.

**Aturan pembulatan (implementasi)**: hitung dalam pecahan eksak (rasional), bulatkan hanya pada tampilan akhir; selisih pembulatan dialokasikan secara tertulis agar Σ = tirkah bersih.

Contoh: tirkah bersih Rp 120.000.000; suami, ibu, ayah (Umariyyah, ashl 6: 3, 1, 2).
Suami 60.000.000; ibu 20.000.000; ayah 40.000.000.

## 11.2 Takharuj [R11-2] [R11-3]
**Definisi**: kesepakatan ahli waris agar salah satu (atau beberapa) dari mereka **keluar** dari pembagian dengan menerima imbalan tertentu, baik dari tirkah maupun dari harta ahli waris lain. Dasar: atsar 'Utsman bin 'Affan — 'Abdurrahman bin 'Auf menalak Tumadhir di sakit maut lalu wafat dalam masa 'iddah, 'Utsman mewariskannya, dan ahli waris berdamai dengannya atas 1/4 dari 1/8 dengan imbalan 80.000 (riwayat lain menyebut angka berbeda); hukumnya shulh (perdamaian) yang sah dengan kerelaan.

**Tiga bentuk**:
| Bentuk | Cara hitung |
|-------|------------|
| Keluar dengan imbalan **dari tirkah** (dibayar oleh semua ahli waris) | Bagi mas'alah normal, lalu **hapus saham** yang keluar dari tashih; sisa saham = ashl baru untuk sisa tirkah (setelah dikurangi imbalan). Bagian yang lain tetap sebanding saham asal mereka. |
| Keluar dengan imbalan **dari harta seorang ahli waris** | Saham yang keluar **ditambahkan** ke saham pembayar. Ashl tetap. |
| Keluar dengan imbalan **dari harta beberapa ahli waris** | Saham yang keluar dibagi di antara pembayar sesuai kesepakatan (atau sesuai porsi mereka); ashl tetap. |

Contoh: suami, ibu, paman. Ashl 6: suami 3, ibu 2, paman 1. Suami keluar dengan mengambil rumah dari tirkah → saham tersisa ibu 2 + paman 1 = **3**; sisa tirkah dibagi: ibu 2/3, paman 1/3.

**Syarat sistem**: takharuj adalah transaksi kesepakatan, bukan perhitungan otomatis; sistem hanya menghitung setelah input kesepakatan, dan menandai perlunya kerelaan semua pihak yang **baligh dan rasyid** (tidak sah atas nama anak kecil kecuali oleh wali dengan maslahat).

## 11.3 Penerimaan di Muka (Sebagian Sudah Diserahkan) [KH] [R11-5]
Keadaan: sebagian tirkah sudah diserahkan kepada ahli waris **sebagai bagian warisannya** sebelum pembagian selesai.
Saham, ashl, dan tashih **tidak berubah**; yang berubah hanya sisa yang masih harus diserahkan.
Misal `T` = tirkah bersih **awal** (termasuk yang sudah diserahkan), `n` = nominal menurut 11.1, `d` = yang sudah diterima:
> **Sisa hak = n − d**; **sisa kas = T − Σ d**; Σ sisa hak + selisih pembulatan = sisa kas.

- Kaidah ini aritmetika [KH], bukan hukum baru, sehingga tidak ada khilaf madzhab.
- `d > n` = **kelebihan**; `Σ d > T` = input salah. Tidak ada nash tentang pengembalian kelebihan atau siapa menanggung kekurangan kas: sistem hanya **menampilkan**, tidak memutuskan.
- Hutang yang baru muncul setelah sebagian dibagi tetap didahulukan atas waris, dan yang dihitung adalah tirkah awal [R11-5].
- Hibah semasa hidup bukan penerimaan di muka (bab 01.6); munasakhat dengan penerimaan sebagian: tidak ada nash, hitung nominal tidak berubah (bab 12.3), penyajian saja.
- Pencarian di Raudhah (2026-11-25) untuk *ta'jil* bagian waris, ahli waris wafat setelah sebagian dibagi, dan pengembalian kelebihan: **tidak ditemukan**.

## 11.4 Piutang Pewaris pada Ahli Waris [R11-4]
Piutang pewaris pada seorang ahli waris termasuk tirkah, dan bagian si penghutang dikurangi hutangnya.
Misal `S` = bagian si penghutang dari **seluruh** tirkah (barang + piutang) menurut 11.1, `H` = hutangnya:
| Keadaan | Hasil |
|---|---|
| `S = H` | Bagian si penghutang jatuh qishash; barang dibagi atas saham ahli waris lain; si penghutang tidak menerima dan tidak membayar |
| `S > H` | Dari bagiannya dikurangi `H`; sisanya (`S − H`) diberikan dari barang |
| `S < H` | Barang dibagi atas saham ahli waris lain; si penghutang membayar `H − S`, dibagi ke ahli waris lain sesuai saham mereka |
Contoh (setara dengan langkah Raudhah, bukan salinan langkahnya): empat anak lk sama saham, tirkah = barang 12 + piutang 8 pada satu anak. `S` = 5, `H` = 8. Tiga anak lain menerima 4 dari barang; si penghutang membayar 8 − 5 = 3, satu per anak; tiap anak lain total 5.
- **Syarat**: pemotongan sepihak hanya bila si penghutang rela, menolak mengakui, atau pailit; bila ia mengakui dan mampu, ahli waris lain tidak boleh mengambil sepihak, harus saling rela [R11-4].
- Status madzhab: hanya [SYF] terverifikasi; [HNB], [HNF], [MLK] belum dikaji → non-[SYF] `TIDAK_DIDUKUNG` (bab 18.4).
- Engine: bila hutang ahli waris diinput tanpa persetujuan jelas, kembalikan `PERLU_INPUT` (pertanyaan "penghutang setuju dipotong?"), bukan asumsi.

---

## Dasar dan Rujukan Bab Ini
Kode: **[Q]** Al-Qur'an · **[H]** Hadits · **[A]** Atsar sahabat · **[IJ]** Ijma' (beserta penukilnya) · **[RDH]** Raudhah ath-Thalibin, an-Nawawi, Kitab al-Fara'idh (kutipan tanpa harakat) · **[KH]** Kaidah hisab operasional (bukan hukum syar'i). Daftar lengkap sumber: file `17_daftar_rujukan.md`.

| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |
|---|---|---|---|---|
| R11-1 | Qismah at-tirkah | RDH | Raudhah 6/75 (Bab 9, al-maqshud ats-tsani «قسمة التركات») · shamela:499/2364 | Metode konversi saham ke nominal; implementasi desimal adalah [KH]. |
| R11-2 | Kebolehan shulh/tawahub di antara ahli waris | RDH | Raudhah 6/41 (Bab 6, far' khuntsa) · shamela:499/2330 | «لو اصطلح الذين وقف المال بينهم على تساو أو تفاوت جاز... ولو أخرج بعضهم نفسه من البين، ووهبه لهم... جاز أيضا». Menjadi dasar fikih takharuj. |
| R11-3 | Atsar 'Abdurrahman bin 'Auf dan Tumadhir | A | Sa'id bin Manshur, Sunan (Fara'idh) 2/66 no. 1959 · shamela:13122/1984; al-Baihaqi, Kubra 6/107 no. 11355 · shamela:7861/13096 (ed. Turki 11/527 no. 11467 · shamela:148486/6509); 'Abdurrazzaq, Mushannaf 7/62 no. 12193 (hanya putusan 'Utsman mewariskan, tanpa shulh) · shamela:13174/13198. Ibnu Sa'd, Thabaqat 3/136 menyebut 100.000 · shamela:9351/1018. Tidak ditemukan di Mushannaf Ibnu Abi Syaibah maupun Nashb ar-Rayah. | «صولحت امرأة عبد الرحمن من نصيبها ربع الثمن على ثمانين ألفا». Atsar terverifikasi; status blocked dicabut (keputusan pengguna 2026-09-29). Nilai sanad belum diteliti. |
| R11-4 | Piutang pewaris pada ahli waris: bagian si penghutang dikurangi hutangnya; tiga keadaan `S=H`, `S>H`, `S<H`; syarat rela, menolak, atau pailit | RDH | Raudhah 6/299–301 (Kitab al-Washaya, ath-tharaf al-khamis, «مسائل العين والدين») · shamela:499/2588, shamela:499/2589, shamela:499/2590 | «بَرِئَ مَنْ عَلَيْهِ مِنْ حِصَّتِهِ... لِأَنَّ الْمِلْكَ بِالْإِرْثِ لَا يَتَأَخَّرُ»; «فَنَصِيبُهُ مِنْ جُمْلَةِ التَّرِكَةِ»; «هَذَا مَحْمُولٌ عَلَى مَا إِذَا رَضِيَ الْمَدِينُ بِذَلِكَ، أَوْ كَانَ جَاحِدًا، أَوْ مُعْسِرًا» (6/300, dari Imam al-Haramain). Dibaca dari halaman 2026-11-25. Redaksi tabel 11.4 adalah ringkasan penyusun. |
| R11-5 | Hutang yang muncul setelah tirkah dibagi tetap diselesaikan dari bagian ahli waris | RDH | Raudhah 11/209 (Kitab al-Qismah, fashl) · shamela:499/4527 | «إِذَا قُسِّمَتِ التَّرِكَةُ بَيْنَ الْوَرَثَةِ، ثُمَّ ظَهَرَ دَيْنٌ، فَإِنْ قُلْنَا: الْقِسْمَةُ إِفْرَازٌ، فَهِيَ صَحِيحَةٌ، ثُمَّ تُبَاعُ الْأَنْصِبَاءُ فِي الدَّيْنِ إِنْ لَمْ يُوَفُّوهُ». Bila qismah dipandang bay', ada dua wajh (tidak dimodelkan). Aturan 11.3 sendiri [KH]. |
