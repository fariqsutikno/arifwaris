# CLAUDE.md — Platform Waris (Faraidh Engine)

Kamu adalah kolaborator teknis untuk membangun kalkulator waris (faraidh) + edukasi, TypeScript.
Nama variabel/fungsi/tipe, komentar, dan diskusi dalam **bahasa Indonesia**; istilah fikih
pakai transliterasi baku sesuai `docs/kb/15_glosarium.md`. Keyword bahasa dan API pustaka tetap apa adanya.

## Sumber kebenaran
- `docs/kb/00–17_*.md` adalah SATU-SATUNYA sumber hukum fikih. Jangan ambil aturan dari pengetahuan umum.
- Madzhab: **Syafi'i [SYF] saja**. Pendapat lain di KB (Ibnu 'Utsaimin, Al-Fara'idh al-Muyassar, Hanbali, dst.) hanya perbandingan, tidak diimplementasikan.
- Setiap cabang kode fikih WAJIB diberi anotasi rujukan, contoh: `// [R09-7] radd, bab 9.4`.
- Aturan yang tidak ada di KB, atau berstatus `[perlu verifikasi lanjut]` (bab 17.4), JANGAN dikarang.
  Kembalikan `UNSUPPORTED` / tandai `blocked` dan beri tahu pengguna.
- KHI = fase 4, ruleset terpisah (`docs/kb-khi/`), selalu ditandai "hukum positif, bukan fikih [SYF]".
  Jangan campur ke ruleset `syafii`.

## Prinsip engine (tidak boleh dilanggar)
1. **Deterministik**: fungsi murni, tanpa I/O, `Date`, `Math.random`.
2. **Eksak**: `Fraction` berbasis `bigint`, ternormalisasi, `d > 0`. Dilarang `number` di jalur hitung.
   Uang = `bigint` satuan terkecil. Pembulatan: tiap orang dibulatkan ke bawah ke kelipatan
   `RoundingConfig.unit` (dipilih pengguna: 1 / 100 / 1000), sisa total dilaporkan terpisah sebagai
   "selisih pembulatan" (tidak dibagikan diam-diam). Lihat engine-contract Tahap 6.
3. **Pisahkan hukum vs hisab**: `packages/math` hanya kaidah hisab [KH]; aturan fikih di `packages/engine`.
4. **Pipeline wajib** (bab 00.2), tiap tahap = fungsi terpisah yang diuji sendiri:
   tirkah → validasi & mawani' → hajb → furudh/ashabah (+bab 07/08) → ashl → 'aul/radd → tashih → nominal.
   Munasakhat (12), kasus khusus (13), dzawil arham (14) = orkestrator di atas pipeline, bukan cabang di dalamnya.
5. **Data kurang → tanya**, jangan asumsi (bab 00 konvensi 4): kembalikan `NEEDS_INPUT`.
6. **Trace terstruktur**: setiap keputusan memancarkan `TraceStep` (data, bukan kalimat) + `refs`.
   Narasi dibuat di `packages/explain`.
7. **Invarian sebagai assertion**: 'aul hanya 6→7..10, 12→13/15/17, 24→27 [R09-4]; inkisar ≤ 4 kelompok [R10-3];
   Σ saham individu = tashih; semua saham bulat; rasio 2:1 pada ashabah bil ghair (bab 10.5).
   Pelanggaran = throw error, bukan lanjut diam-diam.

## Struktur repo
```
packages/math      Fraction, gcd/lcm, nisab arba' [KH]
packages/engine    types, rulesets/syafii, pipeline stages, orchestrators
packages/content   RefEntry dari tabel "Dasar dan Rujukan" KB, glosarium, materi, bank soal
packages/explain   TraceStep → narasi Indonesia
apps/web           (belakangan) UI
docs/kb            knowledge base fikih 00–17
docs/design        dokumen desain (baca engine-contract.md sebelum menulis kode engine)
```

## Testing
- Kasus bab 16 (termasuk uji nominal & uji negatif) = regression suite wajib, dibuat SEBELUM logika.
- Kasus dari `waris-main` boleh diadopsi hanya setelah dicocokkan ke KB [SYF]; yang bertentangan dicatat, bukan disalin.
- Tiap tahap pipeline punya unit test sendiri; tambahkan property test untuk invarian di atas.

## Cara kerja dengan pengguna
- Konfirmasi dulu asumsi penting sebelum menulis banyak kode; cukup yang relevan.
- Urutan project: engine dulu, UI belakangan.

## Standar kode

**Struktur** — bukan service/repository (itu pola untuk I/O; engine ini fungsi murni tanpa I/O),
tapi tiap pipeline stage adalah satu fungsi dengan satu pintu masuk (`input, config) => output`.
Dependency hanya lewat argumen, satu arah mengikuti urutan pipeline (bab 00.2), tanpa shared mutable
state dan tanpa circular import. `packages/math`, `engine`, `content`, `explain` masing-masing bisa
dites sendiri tanpa mengimpor yang lain kecuali `math` → dipakai `engine` (satu arah).

**SRP & function pendek** — satu fungsi, satu keputusan fikih atau satu operasi matematis. Kalau
sebuah fungsi menangani hajb *dan* menghitung fardh, pecah jadi dua. Fungsi yang mulai butuh
komentar "## bagian 2" adalah sinyal untuk dipecah.

**DRY tapi jangan dipaksakan (lihat KISS/YAGNI)** — nisab arba' (tamatsul/tadakhul/tawafuq/tabayun)
dipakai di 3 tempat (ashl, radd, tashih) → satu fungsi di `packages/math`. Tapi jangan bikin abstraksi
generik untuk pola yang kebetulan mirip sekali pakai; itu over-engineering.

**Konfigurasi vs konstanta** — yang WAJIB jadi parameter: field `MadhhabConfig` (khilaf internal
Syafi'iyyah), `ruleset`. Yang BOLEH jadi konstanta bernama dengan anotasi rujukan: angka-angka yang
memang tetap secara fikih, contoh `const VALID_USUL = [2, 3, 4, 6, 8, 12, 24] as const; // [R09-1]`.
Bedanya: konfigurasi = titik khilaf yang bisa berubah menurut pendapat; konstanta = fakta fikih yang tidak berubah.

**Penamaan** — nama mengikuti istilah bab 3–15 (glosarium), bukan disingkat sendiri:
`ashlulMasalah` bukan `am`, `sisaHartaSetelahFardh` bukan `sisa2`. Boleh transliterasi Arab kalau
istilahnya baku (`fardh`, `ashabah`, `hajb`). Yang bukan istilah fikih pakai Indonesia
(`ahliWaris` bukan `heir`, `pecahan` bukan `fraction`). Kunci ahli waris juga Indonesia
(`CUCU_LK_DARI_ANAK_LK`, bukan `IBN_IBN`). Tidak ada nama 1-huruf kecuali index loop generik.

**Kode sebagai cerita** — tiap file dibuka dengan komentar pendek: tahap ini menerima apa,
memutuskan apa, menyerahkan apa ke tahap berikutnya. Fungsi utama diletakkan di atas, helper di
bawah, supaya file bisa dibaca dari atas ke bawah. Angka urutan/prioritas diberi nama konstanta.

**Komentar** — hanya untuk *mengapa* atau alur, bukan *apa* per baris. Kode sudah menjelaskan apa yang terjadi lewat
nama variabel/fungsi. Komentar wajib berisi rujukan `[Rxx-y]` ketika logikanya berasal dari
keputusan fikih, supaya reviewer syariah bisa mencocokkan. Contoh baik:
`// [R08-5] akdariyyah: kakek dapat 1/6 fardh, bukan muqasamah, meski ada far'u warits pr`.
Contoh buruk: `// tambah 1 ke total` di atas `total += 1`.

**Prioritas kalau ada yang bentrok**: benar secara fikih (bisa ditelusuri ke KB) > determinisme/eksak
> keterbacaan > DRY. Jangan korbankan kejelasan atau ketertelusuran demi kode yang lebih "elegan".

## Titik blocked (jangan diimplementasikan sebagai default)
- R13-5 (batas kehamilan), R13-14 (laqith), R01-7 (ijazah wasiat), R11-3 (takharuj): perlu verifikasi.
- Bab 13 haml & mafqud: default di KB bukan [SYF]; rincian [SYF] belum ada. Tunggu KB dilengkapi (fase 2).
