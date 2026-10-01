# Arif Waris (Platform Waris / Faraidh Engine)

**ARIF** = *Aplikasi Representasi Ilmu Faraidh*: kalkulator waris (faraidh) + edukasi, ditulis dalam TypeScript.
Setiap hasil hitung bisa ditelusuri langkah demi langkah sampai ke rujukan kitabnya.
Default madzhab **Syafi'i [SYF]**; Hanbali, Hanafi, dan Maliki tersedia sebagai selisih pendapat per titik khilaf.

> Status: tugas akhir, masih dikembangkan. Engine fase 1–3 selesai; antarmuka kasus berlapis sedang dikerjakan.

## Mencoba cepat

Butuh Node.js dan pnpm. Web berjalan penuh tanpa internet dan tanpa Supabase (konten memakai snapshot bawaan).

```bash
pnpm install
```

```bash
pnpm --filter @waris/web dev
```

Lalu buka alamat yang dicetak Vite (biasanya http://localhost:5173). Untuk mengecek mesin hitungnya saja:

```bash
pnpm test
```

## Fitur

- **Kalkulator**: isi pewaris, harta, kewajiban, ahli waris, dan kondisi khusus lewat pertanyaan satu per satu; hasilnya bagian tiap orang (pecahan + nominal).
- **Kasus rumit**: kematian berlapis (munasakhat), janin (haml), mafqud, khuntsa, wafat bersamaan (gharqa), dzawil arham, takharuj, jadd wal ikhwah.
- **Multi-madzhab**: [SYF] default; [HNB], [HNF], [MLK] sebagai overlay, tiap titik khilaf tercatat di `docs/kb/18_matriks_khilaf.md`.
- **Pembahasan per kasus**: tiap keputusan (hajb, fardh, ashabah, 'aul/radd, tashih) dijelaskan beserta dalil/rujukannya; tampilan Indonesia atau Indonesia + Arab.
- **Belajar**: materi bertahap, glosarium, latihan, dan kuis (kunci jawaban dihitung engine). Akun Google opsional untuk riwayat, progres, dan streak.
- **Eksak**: semua hitungan pakai pecahan `bigint`, tanpa floating point. Selisih pembulatan uang dilaporkan terpisah.

## Struktur repo

```
packages/math      Pecahan, FPB/KPK, nisab arba' (kaidah hisab)
packages/engine    Tipe, ruleset syafii, tahap pipeline, orkestrator
packages/content   Rujukan, glosarium, materi, bank soal
packages/data      Akses konten dan akun (Supabase)
packages/explain   Jejak langkah → narasi bahasa Indonesia
apps/web           Antarmuka web Arif Waris (Vite + React)
apps/admin         Portal admin: sunting, review, dan terbitkan konten (Vite + React)
docs/kb            Knowledge base fikih bab 00–18 (sumber kebenaran)
docs/design        Dokumen desain (engine-contract.md, mockup)
docs/superpowers   Spec dan rencana implementasi per fitur
supabase           Migrasi, seed, dan edge function (ai-bantu)
docs/lampiran-konten  Ekspor Markdown konten terbit (isi aslinya di database)
```

## Alur hitung (pipeline)

```
tirkah → validasi & mawani' → hajb → furudh/ashabah → ashl → 'aul/radd → tashih → nominal
```

Tiap tahap adalah fungsi murni yang diuji sendiri. Detail: [docs/design/engine-contract.md](docs/design/engine-contract.md).

## Menjalankan lebih lengkap

Perintah dasar ada di "Mencoba cepat" di atas. Env web (opsional, untuk akun dan sinkron konten) ada di `apps/web/.env.example`.

### Portal admin

Portal admin (`apps/admin`) dipakai tim keilmuan untuk menyunting, mereview, dan menerbitkan konten
(lihat [docs/panduan-tim-keilmuan.md](docs/panduan-tim-keilmuan.md)). Perlu Supabase (lokal atau proyek Supabase):

```bash
pnpm admin
```

Env yang dibutuhkan (`apps/admin/.env` atau env shell):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Login memakai Google lewat Supabase Auth: di dashboard Supabase, aktifkan provider Google lalu daftarkan redirect
URL `<origin portal>` (mis. `http://localhost:5173` untuk dev) di pengaturan Auth > URL Configuration.

### Skrip konten

`pnpm konten:ekspor` (database → snapshot web) dan `pnpm konten:pulihkan` (snapshot → database, mis. memasukkan diksi
baru) membaca `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan untuk pulihkan `SUPABASE_SERVICE_ROLE_KEY`. Isi sekali di
`scripts/.env` (salin dari `scripts/.env.example`; file ini diabaikan git), atau set di shell (shell menang).

## Prinsip

1. **Sumber hukum hanya `docs/kb/`**. Aturan di luar KB atau yang belum terverifikasi tidak diimplementasikan (`TIDAK_DIDUKUNG`).
2. **Deterministik & eksak**: tanpa I/O, tanpa `number` di jalur hitung.
3. **Data kurang → tanya** (`PERLU_INPUT`), bukan menebak.
4. **Invarian dijaga**: 'aul hanya pada ashl yang sah, saham selalu bulat, Σ saham = tashih. Pelanggaran = error.
5. **Uji dulu**: kasus bab 16 KB menjadi regression suite wajib.

## Cakupan

| Fase | Cakupan | Status |
|---|---|---|
| 1 | Tirkah s.d. tashih, jadd wal ikhwah, takharuj (bab 01–11) | selesai |
| 2 | Munasakhat, kasus khusus: haml, mafqud, khuntsa, gharqa (bab 12–13) | engine selesai; UI babak berlapis berjalan |
| 3 | Dzawil arham (bab 14) | selesai |
| 4 | Ruleset KHI (hukum positif, terpisah) | belum |

Titik yang belum terverifikasi (mis. laqith R13-14) sengaja dikembalikan sebagai `TIDAK_DIDUKUNG`, bukan ditebak.

## Rujukan

Daftar kitab: [docs/kb/17_daftar_rujukan.md](docs/kb/17_daftar_rujukan.md).

## Disclaimer

Hasil aplikasi ini untuk edukasi. Untuk pembagian waris sungguhan, konsultasikan dengan ahli faraidh atau lembaga berwenang.
