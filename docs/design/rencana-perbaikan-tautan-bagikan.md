# Rencana perbaikan tautan bagikan kasus

Sumber: [audit-tautan-bagikan-2026-11-23.md](audit-tautan-bagikan-2026-11-23.md) (T1–T8). Status: **disetujui 2026-11-23, bentuk slug B (acak murni)**.
Urutan di bawah = urutan kerja. Langkah 1 adalah inti; langkah lain kecil dan bisa ikut di PR yang sama.

## Keputusan yang perlu pemilik ambil dulu

1. **Bentuk slug untuk akses "siapa pun yang punya tautan"** (T1):
   - **A (disarankan):** nama bebas boleh tetap ada sebagai awalan, tetapi selalu diikuti 16 karakter acak yang tidak bisa
     diubah. Contoh: `waris-ayah-k3f9q2xm7d1b0z4p`. Pemilik tetap bisa memberi nama yang dikenali, dan tautan tidak bisa ditebak.
   - B: akses tautan selalu slug acak murni, tanpa nama. Nama bebas hanya untuk akses email/privat.
2. **Slug email/privat**: tetap boleh nama bebas (disarankan; yang membuka tetap harus lolos cek email/pemilik).

**Diputuskan pemilik: B.** Akses tautan = slug acak murni 16 karakter; input nama dinonaktifkan untuk akses tautan.

## Langkah 1. Slug akses tautan wajib acak dan aman (T1, T2)

**Klien** — `apps/web/src/layar/DialogBagikan.tsx`
- Ganti `slugAcak` (baris 225, `Math.random`) dengan `crypto.getRandomValues`. Konstanta `PANJANG_SLUG_ACAK = 16` (baris 19)
  dengan alfabet `a-z0-9` (≈ 82 bit). Pakai rejection sampling atau alfabet 32 karakter supaya tidak bias.
- Saat akses = tautan: slug acak ditampilkan hanya-baca (tidak bisa diketik). Slug dibuat sekali per kasus dan dipertahankan.
- Saat akses berubah dari email/privat ke tautan dan slug lama bukan acak 16 karakter: buat slug acak baru, dan
  tunjukkan peringatan "tautan lama (`…`) berhenti bekerja" yang sudah ada (`konf_tautan_diganti`, baris 180).
- Pola slug yang sah satu sumber: tambahkan `SLUG_BAGIKAN_TAUTAN` di `apps/web/src/rute.ts` di sebelah `SLUG_BAGIKAN` (baris 62):
  `/^[a-z0-9]{16}$/` (tetap lolos check lama).
- Kalimat UI baru (keterangan sufiks, peringatan) lewat kamus terjemah, bukan hardcode.

**Database** — migrasi baru `supabase/migrations/20261123000001_slug_tautan_acak.sql`
```sql
-- T1 (audit 2026-11-23): akses 'tautan' hanya dijaga slug, jadi slug wajib berakhir 16 karakter acak.
alter table kasus_dibagikan add constraint slug_tautan_acak
  check (akses <> 'tautan' or slug ~ '^[a-z0-9]{16}$');
```
- Check ini tidak bisa membuktikan sufiks benar-benar acak (klien yang curang bisa mengirim `aaaa…`), tetapi pengguna yang
  curang hanya membahayakan kasusnya sendiri. Tujuannya mencegah slug pendek/tebak-able karena UI lama atau kekeliruan.
- Sebelum menerapkan di produksi: `select count(*) from kasus_dibagikan where akses = 'tautan'` — saat audit tabel kosong.
  Bila ada baris yang melanggar, ubah dulu aksesnya ke `privat` (pemilik bisa membagikan ulang), jangan dihapus.

**Uji**
- `supabase/tests/database/15_bagikan.test.sql`: slug `kasus-umum` untuk akses tautan diganti slug acak 16 karakter;
  tambah `throws_ok` untuk akses tautan dengan slug nama bebas (`23514`), dan `lives_ok` untuk akses email dengan nama bebas.
- Unit test klien kecil untuk pembuat slug: panjang 16, hanya `a-z0-9`, dan slug akhir lolos `SLUG_BAGIKAN_TAUTAN`.

## Langkah 2. Cabut hak tabel yang tidak dipakai (T7)

Di migrasi yang sama:
```sql
-- T7: TRUNCATE tidak tunduk RLS; aplikasi tidak butuh TRUNCATE/REFERENCES/TRIGGER.
revoke truncate, references, trigger on kasus_dibagikan from authenticated;
```
Uji: `ok(not has_table_privilege('authenticated', 'kasus_dibagikan', 'TRUNCATE'))`.

## Langkah 3. Perbaiki komentar yang menyesatkan (T4)

Oracle keberadaan slug diterima sebagai risiko yang disadari: pembuat memang harus diberi tahu bila nama bentrok, dan setelah
Langkah 1 slug tautan tidak bisa ditebak. Cukup tulis di migrasi baru (komentar migrasi lama tidak diubah):
```sql
comment on function tautan_bagikan_tersedia(text, text) is
  'Memberi tahu apakah slug sudah dipakai siapa pun (termasuk privat). Keberadaan slug bocor ke pengguna masuk; isi tidak.';
```

## Langkah 4. Cek pengaturan Auth produksi (T6) — tanpa kode

Di dasbor Supabase → Authentication → Providers → Email: pastikan **Secure email change** aktif dan pendaftaran email/password
**nonaktif** (aplikasi hanya Google). Catat hasilnya di laporan audit. Bila tidak bisa dipastikan, lanjutan opsional:
`baca_kasus_dibagikan` mencocokkan email ke `auth.identities` (`provider = 'google'`, `identity_data ->> 'email'`) alih-alih klaim JWT.

## Langkah 5. Daftar tautan aktif di halaman akun (T5) — sesudah PR #53

PR #53 (muat ulang) menghentikan tautan saat kasus dihapus. Sisa celahnya: kasus yang hilang dari perangkat tanpa lewat hapus
(perangkat lain, `localStorage` dibersihkan). Tambah `RepositoriBagikan.daftarMilikSaya()` → `select slug, akses, diubah_pada`
(RLS sudah membatasi ke milik sendiri) dan bagian "Tautan yang sedang dibagikan" di halaman akun dengan tautan teks
"Hentikan" per baris (aksi sekunder = tautan, sesuai konvensi UI). Ini fitur kecil tersendiri; boleh PR terpisah.

## Tidak dikerjakan

- **Pembatasan laju (T3):** setelah Langkah 1, menyisir 82 bit tidak masuk akal walau tanpa pembatas. Tinjau ulang hanya bila
  keputusan slug berubah ke nama bebas untuk akses tautan.
- **Pesan galat mentah ke pemilik (T8):** hanya ke pemilik sendiri, tanpa data orang lain.

## Selesai bila

- [ ] Slug akses tautan baru selalu 16 karakter acak dari `crypto.getRandomValues`; tidak ada lagi `Math.random` di jalur bagikan.
- [ ] Check `slug_tautan_acak` dan `revoke` aktif di produksi; `pnpm` test DB (pgTAP) hijau.
- [ ] Pengaturan Auth produksi T6 dicek dan dicatat.
- [ ] (Opsional, PR terpisah) daftar tautan aktif di halaman akun.
