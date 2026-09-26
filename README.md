# Platform Waris (Faraidh Engine)

Kalkulator waris (faraidh) + edukasi berbasis madzhab **Syafi'i [SYF]**, ditulis dalam TypeScript.
Setiap hasil hitung bisa ditelusuri langkah demi langkah sampai ke rujukan kitabnya.

> Status: tugas akhir, masih dikembangkan. Fase 1 (bab 01–11 KB) jadi fokus utama.

## Fitur

- **Kalkulator**: masukkan harta dan ahli waris, dapat bagian tiap orang (pecahan + nominal).
- **Pembahasan per kasus**: tiap keputusan (hajb, fardh, ashabah, 'aul/radd, tashih) dijelaskan beserta dalil/rujukannya.
- **Belajar**: modul materi bertahap, glosarium, dan kuis (kunci jawaban dihitung oleh engine).
- **Eksak**: semua hitungan pakai pecahan `bigint`, tanpa pembulatan floating point. Selisih pembulatan uang dilaporkan terpisah.

## Struktur repo

```
packages/math      Pecahan, FPB/KPK, nisab arba' (kaidah hisab)
packages/engine    Tipe, ruleset syafii, tahap pipeline, orkestrator
packages/content   Rujukan, glosarium, materi, bank soal
packages/explain   Jejak langkah → narasi bahasa Indonesia
apps/web           Antarmuka web (Vite + React)
docs/kb            Knowledge base fikih bab 00–17 (sumber kebenaran)
docs/design        Dokumen desain (engine-contract.md)
docs/lampiran-konten  Ekspor Markdown konten terbit (isi aslinya di database)
```

## Alur hitung (pipeline)

```
tirkah → validasi & mawani' → hajb → furudh/ashabah → ashl → 'aul/radd → tashih → nominal
```

Tiap tahap adalah fungsi murni yang diuji sendiri. Detail: [docs/design/engine-contract.md](docs/design/engine-contract.md).

## Menjalankan

Butuh Node.js dan pnpm.

```bash
pnpm install
```

```bash
pnpm test
```

```bash
pnpm --filter @waris/web dev
```

## Prinsip

1. **Sumber hukum hanya `docs/kb/`**. Aturan di luar KB atau yang belum terverifikasi tidak diimplementasikan (`TIDAK_DIDUKUNG`).
2. **Deterministik & eksak**: tanpa I/O, tanpa `number` di jalur hitung.
3. **Data kurang → tanya** (`PERLU_INPUT`), bukan menebak.
4. **Invarian dijaga**: 'aul hanya pada ashl yang sah, saham selalu bulat, Σ saham = tashih. Pelanggaran = error.
5. **Uji dulu**: kasus bab 16 KB menjadi regression suite wajib.

## Cakupan

| Fase | Cakupan | Status |
|---|---|---|
| 1 | Tirkah s.d. tashih, jadd wal ikhwah, takharuj (bab 01–11) | berjalan |
| 2 | Munasakhat, kasus khusus (bab 12–13) | belum |
| 3 | Dzawil arham (bab 14) | belum |
| 4 | Ruleset KHI (hukum positif, terpisah) | belum |

## Rujukan

Daftar kitab: [docs/kb/17_daftar_rujukan.md](docs/kb/17_daftar_rujukan.md).

## Disclaimer

Hasil aplikasi ini untuk edukasi. Untuk pembagian waris sungguhan, konsultasikan dengan ahli faraidh atau lembaga berwenang.
