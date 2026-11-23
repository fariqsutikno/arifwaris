# Audit keamanan tautan bagikan kasus (`#/k/<slug>`), 2026-11-23

Cakupan: tabel `kasus_dibagikan`, RPC `baca_kasus_dibagikan` dan `tautan_bagikan_tersedia`, `RepositoriBagikan`
(`packages/data/src/supabase/index.ts:299-322`), `KasusDibagikan.tsx`, `DialogBagikan.tsx`, `bagikanLokal.ts`.
Audit read-only. Database produksi dibaca lewat MCP Supabase (hanya `select` ke katalog `pg_policies`, `pg_proc`,
`information_schema`). Tidak ada kode yang diubah.

**Kesimpulan singkat:** tidak ada IDOR. Pengguna tidak bisa membaca, mengubah, atau menghapus baris milik orang lain.
Risiko yang tersisa ada di sisi *tautan sebagai rahasia*: slug pilihan sendiri mudah ditebak, slug acak dibuat dengan
`Math.random`, dan tidak ada pembatasan laju. Semua temuan di bawah berkeparahan sedang ke bawah.

## Yang sudah benar (terverifikasi)

| Hal | Bukti |
|---|---|
| RLS aktif; satu policy `milik_sendiri` untuk ALL, `using` dan `with check` = `pemilik = auth.uid()`. Pengguna hanya bisa SELECT/INSERT/UPDATE/DELETE barisnya sendiri dan tidak bisa memindah `pemilik` ke orang lain. | `supabase/migrations/20261003000001_bagikan_kasus.sql:18-20`; produksi: `pg_policies` sama persis |
| `anon` tidak punya hak apa pun di tabel. | `…000001_bagikan_kasus.sql:21`; produksi: grant hanya `authenticated`, `postgres`, `service_role` |
| `bacaPengaturan`/`perbaruiKasus`/`berhenti` hanya memfilter `id_riwayat` (tanpa `pemilik`), tetapi RLS memaksa `pemilik = auth.uid()`, jadi menebak `id_riwayat` orang lain menghasilkan 0 baris. | `packages/data/src/supabase/index.ts:301,312,314` |
| `upsert` di `simpan` memakai `onConflict: 'pemilik,id_riwayat'`; slug bentrok milik orang lain menghasilkan galat unik `23505`, bukan menimpa barisnya. | `index.ts:305-309`, `…000001:10` (`slug unique`) |
| Penerima hanya lewat RPC per slug (security definer, `search_path` tetap). Tabel tidak bisa disisir. | `…000001:25-45` |
| RPC tidak mengembalikan `email[]`, `id_riwayat`, maupun uuid pemilik. `pemilik` dikembalikan hanya sebagai boolean "milik sendiri". | `…20261120000001_email_terverifikasi.sql:21-22` |
| Akses `email` hanya mempercayai klaim email bila penyedia = Google (perbaikan K1). Versi ini yang aktif di produksi. | `…20261120000001:8-9,17`; produksi: badan fungsi berisi pengecekan `provider` |
| `tautan_bagikan_tersedia` tidak bisa dipanggil `anon`. | `…20261120000003_pengerasan.sql:11-12`; produksi ACL tanpa `anon` |
| Isi kasus divalidasi ulang di klien (`dariJson` → `bacaBerkasKasus`) sebelum dirender; JSON rusak jadi "tidak ada". React meng-escape teks. Tidak ada `dangerouslySetInnerHTML`/`innerHTML` di `apps/web/src`. | `apps/web/src/layar/KasusDibagikan.tsx:28-30`; `grep` |
| Jangkar `saya` dibuang sebelum diunggah. | `packages/latihan/src/kasus.ts:91-94` |
| Galat di layar penerima hanya pesan umum ("tidak terhubung"); pesan Postgres tidak ditampilkan ke penerima. | `KasusDibagikan.tsx:31,35` |

## Temuan

### T1. Slug pilihan sendiri bisa ditebak untuk kasus berakses `tautan` (sedang, terverifikasi dari kode)

**Sebab.** Untuk akses `tautan`, slug adalah satu-satunya kunci. Pemilik boleh mengganti slug acak dengan nama bebas
yang sah menurut `^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$` (minimal 3 karakter). UI malah mendorong nama yang mudah diingat
(status "tersedia / sudah dipakai").
**Skenario.** Penyerang anonim memanggil `rpc('baca_kasus_dibagikan', {p_slug})` dengan daftar kata: `warisan`,
`waris-ayah`, `kasus-bapak`, `keluarga-<marga>`, `abc`, dan seterusnya. Setiap tebakan yang kena mengembalikan isi
kasus utuh: nama anggota keluarga, siapa yang wafat kapan, nilai harta. Ini data pribadi menurut UU PDP.
**Bukti.** `apps/web/src/layar/DialogBagikan.tsx:145-146` (input slug bebas), `apps/web/src/rute.ts:62`,
`…000001_bagikan_kasus.sql:10,36`.
**Usulan (pilih salah satu atau gabungan).**
- Paling murah: untuk akses `tautan`, wajibkan sufiks acak yang tidak bisa diubah (mis. `waris-ayah-k3f9q2xm`);
  bagian nama hanya hiasan. Tambah check di DB, bukan hanya di UI.
- Atau: nama bebas hanya diizinkan untuk akses `email`/`privat`; `tautan` selalu slug acak panjang.
- Peringatan di dialog bahwa nama yang mudah ditebak bisa dibuka orang lain.

### T2. Slug acak dibuat dengan `Math.random`, 8 karakter base36 (rendah–sedang, terverifikasi)

**Sebab.** `slugAcak` memakai `Math.random()` (bukan CSPRNG) untuk 8 karakter base36 ≈ 41 bit.
41 bit belum bisa disisir lewat HTTP biasa, tetapi `Math.random` dapat diprediksi bila keadaan PRNG peramban bocor,
dan ruangnya di bawah anjuran umum untuk tautan rahasia (≥ 96–128 bit).
**Bukti.** `apps/web/src/layar/DialogBagikan.tsx:19,225`.
**Usulan.** `crypto.getRandomValues` dengan 16 karakter base36 (≈ 82 bit) atau 22 karakter base64url (128 bit). Satu baris;
batas `{1,38}` di check DB masih cukup.

### T3. Tidak ada pembatasan laju di RPC baca dan cek ketersediaan (sedang sebagai pengali T1, dugaan untuk produksi)

**Sebab.** Kedua RPC adalah fungsi SQL biasa lewat PostgREST. Di repo tidak ada pembatas laju per IP/pengguna. Supabase
tidak membatasi laju PostgREST secara bawaan (batas bawaannya hanya di endpoint Auth).
**Skenario.** Menyisir ribuan tebakan T1 per menit dengan kunci anon publik.
**Bukti.** Tidak ada tabel/trigger pembatas di `supabase/migrations`; `config.toml [auth.rate_limit]` hanya untuk Auth.
Belum dicek apakah ada WAF/Cloudflare di depan produksi, jadi untuk produksi berstatus **dugaan**.
**Usulan.** Kalau T1 diperbaiki (slug acak wajib), T3 hampir tidak berarti dan bisa dibiarkan. Kalau nama bebas tetap
diizinkan: catat percobaan gagal per IP (`request.headers` → `x-forwarded-for`) di fungsi, atau pindahkan baca ke Edge
Function dengan pembatas laju.

### T4. Oracle keberadaan slug (rendah, terverifikasi)

**Sebab dan skenario.**
- `tautan_bagikan_tersedia` mengembalikan `false` untuk slug yang sudah dipakai siapa pun, termasuk kasus `privat`.
  Pengguna terautentikasi (cukup akun Google gratis) bisa mengetahui bahwa slug ada, walau `baca` menyamarkannya
  sebagai `tidak_ada`. Ini membuat komentar "keberadaannya tidak bocor" di `…000001:24` tidak sepenuhnya benar.
- `baca_kasus_dibagikan` membedakan `perlu_masuk`/`tidak_boleh` (slug ada, akses email) dari `tidak_ada`. Anonim jadi
  tahu slug itu ada dan dibatasi email.
- Tidak ada yang membocorkan *milik siapa* (uuid/email pemilik tidak pernah dikembalikan).
**Bukti.** `…20261003000002_tautan_bagikan_tersedia.sql:49-55`; `…20261120000001:13-19`.
**Dampak.** Hanya keberadaan, bukan isi. Berguna bagi penyerang sebagai pemandu T1 (tahu nama mana yang dipakai), dan
bisa membocorkan informasi lewat nama slug itu sendiri (mis. `warisan-keluarga-<nama>` ada).
**Usulan.** Terima sebagai risiko yang disadari (bentrok slug memang harus diberitahukan ke pembuat), dan perbaiki
komentar di migrasi. Bila T1 diperbaiki dengan sufiks acak, oracle ini tak lagi berguna.

### T5. Kasus tetap terbaca selama baris ada, termasuk sesudah pemilik menghapus kasus lokal (rendah, terverifikasi dari kode)

`bagikanLokal.ts` hanya penanda di perangkat; sumber kebenarannya baris server. Bila kasus dihapus di perangkat lain
atau `localStorage` dibersihkan, baris `kasus_dibagikan` tetap ada dan tautan tetap hidup tanpa jalan UI untuk
menghentikannya kecuali membuka dialog bagikan untuk `id_riwayat` yang sama. Sesi `muat-ulang`
(branch `claude/perbaikan-muat-ulang-94ae05`) sedang menambahkan penghentian tautan saat kasus dihapus; itu menutup
sebagian. Usulan tambahan: daftar "tautan yang sedang aktif" di halaman akun (cukup `select slug, akses` milik sendiri).
**Bukti.** `apps/web/src/bagikanLokal.ts:1-2`, `index.ts:314`.

### T6. Penyedia `google` diperiksa dari `app_metadata.provider` (rendah, dugaan)

`app_metadata.provider` adalah penyedia *pertama* akun dan tidak bisa diubah pengguna. Celah yang mungkin: pengguna
yang mendaftar dengan Google lalu memanggil `auth.updateUser({ email: korban })`. Klaim `email` di JWT baru berubah
setelah konfirmasi; bila "Secure email change" di produksi aktif (bawaan), harus dikonfirmasi dari kotak masuk korban
sehingga aman. `config.toml:223` (`double_confirm_changes = true`) hanya berlaku lokal; pengaturan produksi **belum
diverifikasi**. Usulan: pastikan di dasbor Auth produksi "Secure email change" aktif, atau lebih kuat: cocokkan email
ke `auth.identities` dengan `provider = 'google'` alih-alih klaim JWT.

### T7. `authenticated` punya hak `TRUNCATE` di tabel (informasi, terverifikasi)

`TRUNCATE` tidak tunduk pada RLS. Ini grant bawaan Supabase untuk semua tabel `public`, dan PostgREST tidak menyediakan
TRUNCATE, jadi tidak bisa dieksploitasi lewat API. Disebut hanya untuk pertahanan berlapis: `revoke truncate, references,
trigger on kasus_dibagikan from authenticated;` tanpa efek samping bagi aplikasi.
**Bukti.** produksi `information_schema.role_table_grants`.

### T8. Penanganan galat di dialog pemilik meneruskan pesan Postgres mentah (informasi)

`simpan` melempar `error.message` asli untuk galat selain `23505` (`index.ts:309`), yang bisa tampil di dialog pemilik.
Ini hanya ke pemilik sendiri, isinya nama constraint/check, bukan data orang lain. Tidak perlu tindakan kecuali demi
UX.

## Hal yang dicek dan tidak bermasalah

- XSS: isi kasus dirender lewat komponen React, tidak ada sink HTML; `href` yang dinamis di repo tidak berasal dari isi
  kasus. Slug masuk ke URL lewat `encodeURIComponent` (`rute.ts:63`).
- Ukuran: `pg_column_size(kasus) < 200000` dan `cardinality(email) <= 50` membatasi penyalahgunaan penyimpanan per baris.
  Jumlah baris per pengguna tidak dibatasi (penimbunan slug/penyimpanan); risiko kecil, catat saja.
- Produksi saat audit: tabel `kasus_dibagikan` kosong, jadi belum ada data yang pernah terekspos.
- Advisor Supabase tidak dijalankan di audit ini (cukup katalog policy/grant di atas).

## Urutan perbaikan yang disarankan

1. T1 + T2 sekaligus: slug akses `tautan` = acak CSPRNG ≥ 16 karakter (dengan atau tanpa awalan nama), dijaga check DB.
2. T6: cek "Secure email change" di dasbor produksi (5 menit, tanpa kode).
3. T7: satu `revoke` di migrasi berikutnya.
4. T4/T3: setelah 1, cukup perbaiki komentar; tidak perlu pembatas laju.
5. T5: daftar tautan aktif di halaman akun, setelah perbaikan muat ulang masuk.
