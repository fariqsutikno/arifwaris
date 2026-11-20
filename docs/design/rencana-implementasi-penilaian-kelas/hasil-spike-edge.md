# Hasil spike: engine dan penilaian tabel di Supabase Edge Function (G1 langkah 1)

Tanggal: 2026-11-20. **Hasil: lulus, lewat bundel esbuild.** Letak paket `@waris/latihan` tidak berubah.

## Yang diuji
Fungsi sementara (sudah dihapus, tidak pernah di-deploy) menerima JSON `{ graf, isian }` untuk kasus 16.1 (istri, anak
laki-laki, anak perempuan; tashih 8 → 24), memanggil `hitung` dari `@waris/engine`, menyusun tabel dengan
`susunTabelSoal`, menilai isian dengan `nilaiTabel`, dan mengembalikan kunci tabel + `HasilNilai`.
Dijalankan di dua tempat: Deno 2.9.6 (CLI) dan **runtime Supabase asli** (`supabase/edge-runtime:v1.76.2`, image yang
dipakai `supabase functions serve`, dijalankan langsung lewat Docker dengan repo dipasang baca-saja).

## Cara impor
| Cara | Deno CLI | Edge runtime Supabase | Catatan |
|---|---|---|---|
| a. Impor langsung `packages/*/src/index.ts` lewat `deno.json` | jalan **hanya** dengan `"unstable": ["sloppy-imports"]`; tanpa itu gagal `TS2307` karena `./types.js` padahal berkas `types.ts` | **gagal**: `Module not found … packages/engine/src/pipeline.js` (opsi sloppy-imports di `deno.json` tidak dihormati runtime v1.76.2) | ditolak |
| b. Bundel esbuild satu berkas ESM (`--bundle --format=esm --platform=neutral --target=es2022`) | jalan | **jalan** | **dipakai** |

Keputusan: edge function mengimpor satu berkas bundel hasil esbuild yang dibangun dari `packages/latihan/src/index.ts`
(skrip bundel baru di langkah 5, ikut menyuntik `__VERSI_ENGINE__`). Tidak mengubah akhiran `.js` di impor engine.

## Angka
- Ukuran bundel (engine + math + tabel latihan): 66 KB mentah, 36 KB minify, 12 KB gzip.
- Permintaan pertama sesudah worker baru (dingin): 0,96–1,05 detik, termasuk boot worker dan kompilasi modul.
- Permintaan berikutnya (hangat): 2,5–4,5 ms total; hitung engine + susun + nilai ≈ 0,5–3 ms di dalam fungsi.
- `bigint` terjaga di dalam fungsi (`typeof` = `bigint`); keluaran JSON harus mengubah `bigint` jadi string (pengganti
  `JSON.stringify` yang sama dipakai pemanggil di langkah 5).
- Hasil sama dengan vitest untuk tiga kasus: 16.1 (kepala 8/24; istri 1/8 → 1 → 3; anak lk 7 → 14, anak pr 7 → 7, sel
  bersama kelompok `ASHABAH`), isian salah di Bagian (`salah`, `idBarisSalah: ['W1']`), dan kasus terhalang (saudara
  `Terhalang`, tanpa saham).

## Impor tidak murni di jalur yang dipindah (langkah 2)
| Berkas | Impor/akses tidak murni | Penanganan |
|---|---|---|
| `apps/web/src/hasil/tabelLatihan.ts` | `namaOrang` dari `../format` (menarik `checklist`, `konten/ahliWaris`, `terjemah`), `angkaLatin` dari `../terjemah` (menarik `konten/sumber`, `preferensi`, `@waris/explain`) | `namaDari` dioper dari luar; `angkaLatin` disalin ke `src/angka.ts` |
| `apps/web/src/kasus.ts` | `t` dari `./terjemah` untuk pesan galat (`kasus.ts:101,181,191,199,202,203,223`); `localStorage` (`:158-167`) | galat jadi **kode**; localStorage tinggal di web |
| `apps/web/src/checklist.ts` | `t` dari `./terjemah` untuk label `DAFTAR_JENIS` (`:28-…`), `LABEL_SEHARI` dari `./konten/ahliWaris` | `grafAhliWaris.ts` hanya memuat kunci tanpa label |
| `apps/web/src/jalankan.ts` | tidak ada impor tidak murni (hanya `@waris/engine`, tipe `Kasus`); `VERSI_KB` tetap | dipindah apa adanya; versi engine dioper di langkah 5 |
| `apps/web/src/layar/belajar/contoh.ts` | `ringkas` dari `hasil/ringkasan` (menarik `format`, `terjemah`) untuk `hitungHarapan` | hanya `kasusDariContoh` pindah; `hitungHarapan` tetap di web |

Hal lain yang perlu diingat: `import.meta`/`localStorage`/`window` tidak muncul di jalur yang dipindah selain yang
tercantum di atas (dicek dengan `grep`).

## Cara mengulang
Fungsi spike adalah ±25 baris: `Deno.serve` yang memanggil `hitung`, `susunTabelSoal`, `nilaiTabel`. Untuk runtime asli:
`docker run -v <repo>:/app:ro -v <main>:/main:ro supabase/edge-runtime:v1.76.2 start --main-service /main`, dengan
`main/index.ts` standar `EdgeRuntime.userWorkers.create({ servicePath })`. Langkah 5 menambahkan skrip bundel permanen.
