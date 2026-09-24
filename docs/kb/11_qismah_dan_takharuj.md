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
**Definisi**: kesepakatan ahli waris agar salah satu (atau beberapa) dari mereka **keluar** dari pembagian dengan menerima imbalan tertentu, baik dari tirkah maupun dari harta ahli waris lain. Dasar: atsar Abdurrahman bin 'Auf yang berdamai dengan salah satu istrinya (Tumadhir) atas bagiannya; hukumnya shulh (perdamaian) yang sah dengan kerelaan.

**Tiga bentuk**:
| Bentuk | Cara hitung |
|-------|------------|
| Keluar dengan imbalan **dari tirkah** (dibayar oleh semua ahli waris) | Bagi mas'alah normal, lalu **hapus saham** yang keluar dari tashih; sisa saham = ashl baru untuk sisa tirkah (setelah dikurangi imbalan). Bagian yang lain tetap sebanding saham asal mereka. |
| Keluar dengan imbalan **dari harta seorang ahli waris** | Saham yang keluar **ditambahkan** ke saham pembayar. Ashl tetap. |
| Keluar dengan imbalan **dari harta beberapa ahli waris** | Saham yang keluar dibagi di antara pembayar sesuai kesepakatan (atau sesuai porsi mereka); ashl tetap. |

Contoh: suami, ibu, paman. Ashl 6: suami 3, ibu 2, paman 1. Suami keluar dengan mengambil rumah dari tirkah → saham tersisa ibu 2 + paman 1 = **3**; sisa tirkah dibagi: ibu 2/3, paman 1/3.

**Syarat sistem**: takharuj adalah transaksi kesepakatan, bukan perhitungan otomatis; sistem hanya menghitung setelah input kesepakatan, dan menandai perlunya kerelaan semua pihak yang **baligh dan rasyid** (tidak sah atas nama anak kecil kecuali oleh wali dengan maslahat).

---

## Dasar dan Rujukan Bab Ini
Kode: **[Q]** Al-Qur'an · **[H]** Hadits · **[A]** Atsar sahabat · **[IJ]** Ijma' (beserta penukilnya) · **[RDH]** Raudhah ath-Thalibin, an-Nawawi, Kitab al-Fara'idh (kutipan tanpa harakat) · **[KH]** Kaidah hisab operasional (bukan hukum syar'i). Daftar lengkap sumber: file `17_daftar_rujukan.md`.

| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |
|---|---|---|---|---|
| R11-1 | Qismah at-tirkah | RDH | Bab 9, al-maqshud ats-tsani «قسمة التركات» | Metode konversi saham ke nominal; implementasi desimal adalah [KH]. |
| R11-2 | Kebolehan shulh/tawahub di antara ahli waris | RDH | Bab 6, far' khuntsa | «لو اصطلح الذين وقف المال بينهم على تساو أو تفاوت جاز... ولو أخرج بعضهم نفسه من البين، ووهبه لهم... جاز أيضا». Menjadi dasar fikih takharuj. |
| R11-3 | Atsar 'Abdurrahman bin 'Auf dan Tumadhir | A | Diriwayatkan 'Abdurrazzaq dan al-Baihaqi | `[perlu verifikasi lanjut]` — nomor dan lafaz belum dicek. |
