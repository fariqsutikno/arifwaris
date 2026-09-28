# Rencana Verifikasi Dalil, Rujukan, dan Materi

Per 2026-09-29. Alat yang tersedia di sesi Claude: MCP **Shamela** (8.598 kitab lokal, ada `verify_quote`), **Hadith**, **Quran** (teks, tafsir, terjemah), dan **IslamQA**. Claude bisa menjalankan sendiri semua langkah di bawah; pengguna cukup memutuskan temuan yang ditandai **⚑ keputusan**.

## Prinsip
1. **Cek kutipan ke teks, bukan ke ingatan.** Setiap kutipan «…» di KB dan konten dicek dengan `verify_quote` atau alat sejenis. Hasilnya: `verbatim` / `beda harakat` (lolos) · `partial` / `not_found` (ditandai).
2. **IslamQA = pendukung, bukan sumber hukum.** Dipakai untuk mencari rujukan kitab dan penjelasan awam. Tidak pernah menjadi satu-satunya dasar sebuah klaim, karena fatwanya condong Hanbali.
3. **Tidak ada perubahan hukum diam-diam.** Kalau verifikasi membalik sebuah klaim (seperti haml [SYF] kemarin), Claude berhenti dan melapor sebagai ⚑ keputusan.
4. **Hasil tercatat di KB.** Kolom *Sumber* diisi letak yang bisa diklik (`Shamela 8463/2469`, nomor hadits); jejak koreksi masuk 17.5.

## Cakupan

| Tahap | Isi | Jumlah | Alat | Keluaran |
|---|---|---|---|---|
| **1. Ayat** | Teks ayat bab 1.2 + semua rujukan [Q] | 10 rujukan | Quran | Teks Utsmani dicocokkan huruf per huruf; nomor surah:ayat |
| **2. Hadits** | Tabel 17.3 + semua [H] | 16 rujukan, 15 baris takhrij | Hadith, Shamela | Nomor per kitab, lafaz, derajat + penilai. Hadits dha'if ditandai, tidak dihapus |
| **3. Atsar & ijma'** | [A], [IJ] | 13 | Shamela | Sumber atsar (Mushannaf, Sunan al-Baihaqi); siapa penukil ijma' dan di kitab mana |
| **4. Nash Raudhah** | Semua [RDH] | 88 | Shamela (`verify_quote` di Raudhah) | Tiap kutipan: lolos / beda / tidak ada + juz/halaman |
| **5. Nukilan madzhab** | Bab 18, sel (s) | ±40 sel | Shamela per kategori madzhab | Diupayakan naik ke primer: [HNB] Mughni/Kasysyaf, [HNF] Mabsuth/Ibnu 'Abidin, [MLK] Mukhtashar Khalil/ad-Dardir |
| **6. Materi & konten** | `docs/lampiran-konten/*` (materi, teks_edukasi, faq, syahid, soal, ahwal, cheatsheet, modul) | 3.831 baris | semua | (a) setiap klaim fikih punya `[Rxx-y]` dan sesuai KB; (b) ayat/hadits yang dikutip di konten dicek seperti tahap 1–2; (c) jawaban soal dihitung ulang dengan engine; (d) istilah sesuai glosarium |
| **7. Sisa terbuka** | R11-3 (atsar takharuj), R13-14 (laqith), satu orang dua jalur [HNF] | 3 | Shamela | Tutup kalau ketemu |

Urutan dipilih dari dampak ke pengguna: ayat & hadits dulu (paling sering tampil di layar "dalil"), lalu Raudhah (dasar hitung [SYF]), baru konten.

## Format laporan per tahap
Satu commit per tahap, disertai tabel ringkas:

| Kode | Status | Temuan | Tindakan |
|---|---|---|---|
| R04-2 | ✔ verbatim | — | tambah letak Shamela |
| R0x-y | ⚠ partial | lafaz KB berbeda di 3 kata | lafaz diganti sesuai kitab |
| R0x-y | ⚑ keputusan | kitab menyatakan sebaliknya | menunggu pengguna |

## Yang perlu pengguna putuskan sekarang
1. **Boleh Claude langsung membetulkan lafaz/nomor** (tanpa mengubah hukum) dan melapor sesudahnya? Usulan: **ya**.
2. **Derajat hadits pakai penilai siapa** bila berbeda? Usulan: sebutkan semua penilai yang ditemukan (mis. at-Tirmidzi, al-Albani), jangan pilih satu.
3. **Konten (tahap 6) juga diubah langsung**, atau hanya dilaporkan dulu karena tim keilmuan yang memegangnya? Usulan: **dilaporkan dulu**, lalu diubah setelah disetujui.
