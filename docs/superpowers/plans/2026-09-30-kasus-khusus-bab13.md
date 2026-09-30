# Kasus Khusus bab 13 (haml, mafqud, khuntsa, gharqa) — Rencana

**Goal:** kasus dengan ahli waris yang statusnya belum pasti dihitung dengan taqdir → jami'ah → pemberian
menurut madzhab → mauquf; gharqa dihitung per mayit (jumhur) atau tilad–tharif ([HNB]).

**Keputusan pengguna (2026-09-30):** cakupan haml + mafqud + khuntsa + gharqa, semua madzhab (murtad, li'an/zina,
laqith menyusul) · penanda di field `Orang` · kombinasi dengan munasakhat/dzawil arham didukung sejak awal.

## Desain

### Input (field `Orang`)
- `statusHidup: 'dalamKandungan'` — satu node haml mewakili seluruh janin dari ibu itu (`idIbu` wajib, `idAyah`
  menentukan jihah). `jenisKelamin` diabaikan.
- `statusHidup: 'mafqud'`.
- `khuntsa?: 'diharapkanJelas' | 'tidakDiharapkanJelas'` — `jenisKelamin` diabaikan. Tidak boleh menjadi
  pasangan atau orang tua di graf [R13-9] → `PERLU_INPUT`.
- `hitung()` yang menemui node itu mengembalikan `TIDAK_DIDUKUNG` kode `PERLU_TAQDIR` (bukan diam-diam dianggap wafat).

### Orkestrator `hitungTaqdir(input, opsi?)` — `packages/engine/src/taqdir.ts`
1. Kumpulkan sumber ketidakpastian dan taqdir per madzhab:
   - haml: [SYF]/[HNB] 6 taqdir (13a.5), [HNF] mati/1 lk/1 pr, [MLK] → `MAUQUF_SEMUA` (K13a-2).
   - mafqud: hidup / mati (13b.5).
   - khuntsa: lk / pr (13c.3).
2. Dunia = hasil kali kartesius; lewat `BATAS_DUNIA` → `PERLU_INPUT`.
3. Tiap dunia: graf pasti (janin kembar = node klon `id~2`, sahamnya digabung ke `id`), dihitung dengan
   `hitungDzawilArham` atau, bila `opsi.urutanWafat` ada, `hitungMunasakhat` (13.0b butir 2).
4. Pemberian (13.0b butir 5): sumber "dalam" dulu per dunia luar —
   setengah-setengah ([MLK] khuntsa, [HNB] khuntsa tidak diharapkan jelas: J = KPK × jumlah taqdir, jumlah nashib)
   atau paling merugikan khuntsa ([HNF], satu khuntsa saja; >1 → `TIDAK_DIDUKUNG`).
   Lalu sumber "luar" (haml, mafqud, khuntsa aqall): J = KPK mas'alah, tiap orang aqall; yang 0 di satu dunia → 0.
5. Haml dan mafqud tidak menerima apa pun sekarang; bagiannya bagian dari mauquf.
6. [SYF] kelas D [R13-15]: berbagi ashabah dengan haml di salah satu taqdir → 0. Berbagi fardh sekelompok
   dengan haml (mis. saudara seibu + janin ibu) tidak ada di KB → `TIDAK_DIDUKUNG` (masuk daftar keputusan tim).
7. Mauquf = J − Σ diberikan. Tabel "jika terbukti X" = saham tiap dunia pada J.
8. Invarian: Σ diberikan + mauquf = J; diberikan ≤ saham orang itu di tiap dunia luar; semua ≥ 0.

### Gharqa `hitungGharqa(input, anggota, keadaan)` — `packages/engine/src/gharqa.ts`
- `serentak` (ijma') dan, di luar [HNB], `berurutanTakDiketahui`/`tidakDiketahui`: tiap anggota dihitung
  sebagai pewaris tersendiri, anggota lain wafat; jejak `MANI istibham` [R13-10].
- `terlupakan`: [SYF] `MAUQUF` + skenario tiap urutan (≤ 4 anggota) [R13-10]; [HNF]/[MLK] seperti jumhur.
- [HNB] keadaan 3–5: tilad–tharif [R13-19] — mas'alah tilad (rekan musibah dianggap hidup), tiap rekan →
  mas'alah tharif (semua anggota wafat), digabung dengan `gabungkan` (bab 12.3).

## Task
1. Tipe + penjaga pipeline + fixture bab 13 (H1–H3, F1–F3, X1–X8, G1) — tes merah.
2. `taqdir.ts`: pembentukan dunia + graf pasti per dunia (unit test).
3. `taqdir.ts`: pemberian aqall / setengah / terburuk + mauquf + nominal; regression hijau.
4. Kombinasi munasakhat & dzawil arham; batas dunia; kasus negatif.
5. `gharqa.ts` + G1 [HNB] dan [SYF].
6. Jejak → narasi templat (`packages/explain`, `pnpm diksi:tambah`).
7. Catat titik KB yang kosong ke daftar keputusan tim keilmuan.
