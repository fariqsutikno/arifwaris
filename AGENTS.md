# AGENTS.md — Platform Waris (Faraidh Engine)

Instruksi untuk agen AI apa pun (opencode, Codex, Cursor, Claude Code, dll.).
Proyek: kalkulator waris (faraidh) + edukasi, TypeScript, monorepo pnpm.

## Bahasa
- Nama variabel/fungsi/tipe, komentar, dan diskusi: **bahasa Indonesia**.
- Istilah fikih pakai transliterasi baku sesuai `docs/kb/15_glosarium.md`.
- Keyword bahasa dan API pustaka tetap apa adanya.

## Sumber kebenaran fikih
- `docs/kb/00–17_*.md` adalah SATU-SATUNYA sumber hukum fikih. Jangan ambil aturan dari pengetahuan umum.
- Madzhab: multi-madzhab. **[SYF] (Syafi'i) = default** dan satu-satunya yang terverifikasi ke teks primer.
  [HNB], [HNF], [MLK] = overlay ruleset yang hanya memuat titik beda; tiap titik ada di `docs/kb/18_matriks_khilaf.md`.
- Nukilan Lahim & Ithraa cukup sebagai dasar implementasi, berstatus `sekunder`, dan UI menyebut sumbernya.
- Tarjih Lahim/Ithraa condong Hanbali: JANGAN dipakai sebagai posisi [SYF].
- Setiap cabang kode fikih WAJIB diberi anotasi rujukan, contoh: `// [R09-7] radd, bab 9.4`.
- Aturan yang tidak ada di KB, atau berstatus `[perlu verifikasi lanjut]` (bab 17.4): JANGAN dikarang.
  Kembalikan `TIDAK_DIDUKUNG` / tandai `blocked`, lalu beri tahu pengguna.
- KHI = fase 4, ruleset terpisah (`docs/kb-khi/`), selalu ditandai "hukum positif, bukan fikih". Bukan overlay madzhab; jangan dicampur ke ruleset fikih.

## Prinsip engine (tidak boleh dilanggar)
1. **Deterministik**: fungsi murni, tanpa I/O, `Date`, `Math.random`.
2. **Eksak**: `Pecahan` berbasis `bigint`, ternormalisasi, `d > 0`. Dilarang `number` di jalur hitung.
   Uang = `bigint` satuan terkecil. Pembulatan: tiap orang dibulatkan ke bawah ke kelipatan
   `KonfigurasiPembulatan.satuan` (1 / 100 / 1000); sisa total dilaporkan terpisah sebagai
   "selisih pembulatan", tidak dibagikan diam-diam (lihat `docs/design/engine-contract.md` Tahap 6).
3. **Pisahkan hukum vs hisab**: `packages/math` hanya kaidah hisab [KH]; aturan fikih di `packages/engine`.
4. **Pipeline wajib** (bab 00.2), tiap tahap = fungsi terpisah yang diuji sendiri:
   tirkah → validasi & mawani' → hajb → furudh/ashabah (+bab 07/08) → ashl → 'aul/radd → tashih → nominal.
   Munasakhat (12), kasus khusus (13), dzawil arham (14) = orkestrator di atas pipeline, bukan cabang di dalamnya.
5. **Data kurang → tanya**, jangan asumsi: kembalikan `PERLU_INPUT`.
6. **Trace terstruktur**: tiap keputusan memancarkan `LangkahJejak` (data, bukan kalimat) + `refs`.
   Narasi dibuat di `packages/explain` sebagai templat diksi `narasi.*` (kamus lewat argumen).
   Kalimat baru ditambah ke snapshot dengan `pnpm diksi:tambah <file.json>`; jangan di-hardcode.
7. **Invarian sebagai assertion** (pelanggaran = throw error, bukan lanjut diam-diam):
   'aul hanya 6→7..10, 12→13/15/17, 24→27 [R09-4]; inkisar ≤ 4 kelompok [R10-3];
   Σ saham individu = tashih; semua saham bulat; rasio 2:1 pada ashabah bil ghair (bab 10.5).

## Struktur repo
```
packages/math      Pecahan, fpb/kpk, nisab arba' [KH]
packages/engine    types, rulesets/syafii, pipeline stages, orchestrators
packages/content   EntriRujukan dari tabel "Dasar dan Rujukan" KB, glosarium, materi, bank soal
packages/explain   LangkahJejak → narasi Indonesia
apps/web           (belakangan) UI
docs/kb            knowledge base fikih 00–18 (18 = matriks khilaf antar-madzhab)
docs/design        dokumen desain (baca engine-contract.md sebelum menulis kode engine)
```
Dependency satu arah: `math` → `engine`. `math`, `engine`, `content`, `explain` dites sendiri-sendiri.

## Perintah
- `pnpm test` — semua test (`pnpm -r test`)
- `pnpm typecheck` — `tsc --noEmit` semua paket
- `pnpm diksi:tambah <file.json>` — tambah kalimat narasi ke snapshot
- `pnpm db:mulai` / `db:reset` / `db:tes` — Supabase lokal

## Testing
- Kasus bab 16 (termasuk uji nominal & uji negatif) = regression suite wajib, dibuat SEBELUM logika.
- Kasus dari `waris-main` hanya diadopsi setelah dicocokkan ke KB [SYF]; yang bertentangan dicatat, bukan disalin.
- Tiap tahap pipeline punya unit test sendiri; tambahkan property test untuk invarian di atas.
- Jalankan `pnpm typecheck` dan `pnpm test` sebelum menyatakan selesai.

## Standar kode
- **Struktur**: tiap pipeline stage = satu fungsi, satu pintu masuk `(input, config) => output`.
  Dependency hanya lewat argumen, tanpa shared mutable state, tanpa circular import. Bukan pola service/repository.
- **SRP**: satu fungsi, satu keputusan fikih atau satu operasi matematis. Fungsi yang menangani hajb *dan* menghitung fardh harus dipecah.
- **DRY secukupnya**: nisab arba' (tamatsul/tadakhul/tawafuq/tabayun) dipakai di ashl, radd, tashih → satu fungsi di `packages/math`.
  Jangan buat abstraksi generik untuk pola yang kebetulan mirip.
- **Konfigurasi vs konstanta**: field `KonfigurasiMadzhab` dan `ruleset` WAJIB parameter (titik khilaf).
  Fakta fikih yang tetap boleh jadi konstanta bernama + rujukan, contoh `const VALID_USUL = [2, 3, 4, 6, 8, 12, 24] as const; // [R09-1]`.
- **Penamaan**: ikuti istilah bab 3–15/glosarium (`ashlulMasalah`, bukan `am`). Istilah baku Arab boleh (`fardh`, `ashabah`, `hajb`);
  non-fikih pakai Indonesia (`ahliWaris`, `pecahan`). Kunci ahli waris Indonesia (`CUCU_LK`, `SAUDARI_SEBAPAK`). Tidak ada nama 1 huruf kecuali index loop.
- **Kode sebagai cerita**: tiap file dibuka komentar pendek (menerima apa, memutuskan apa, menyerahkan apa).
  Fungsi utama di atas, helper di bawah. Angka urutan/prioritas diberi nama konstanta.
- **Komentar**: hanya untuk *mengapa*, bukan *apa*. Wajib memuat rujukan `[Rxx-y]` bila logikanya dari keputusan fikih.
- **Prioritas bila bentrok**: benar secara fikih (tertelusur ke KB) > determinisme/eksak > keterbacaan > DRY.

## Titik blocked (jangan diimplementasikan sebagai default)
- R13-14 (laqith): perlu verifikasi.
- Haml [SYF] (bab 13a): jumlah janin tak dibatasi → ashabah yang berbagi dengan haml tidak diberi apa pun;
  model 6 taqdir hanya untuk [HNB]. Batas kehamilan maksimal [SYF] = 4 tahun (R13-5, Ithraa).
- Kombinatorik taqdir: ada batas keras jumlah "dunia" (engine-contract); lewat batas → `PERLU_INPUT`, bukan macet.
- (R11-3 takharuj sudah terverifikasi, blocked dicabut.)

## Cara kerja dengan pengguna
- Konfirmasi dulu asumsi penting sebelum menulis banyak kode; cukup yang relevan, jangan over-konfirmasi.
- Urutan project: engine dulu, UI belakangan.
- UI web: aksi sekunder/ajakan pakai **teks atau tautan**, bukan tombol berbingkai.
  Tombol hanya untuk aksi utama di form/dialog (Simpan, Batal).
- Jangan membuat frontend/artifact kecuali diminta.
