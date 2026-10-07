# Push notifikasi dari server

Tanggal: 2026-10-02 · Status: **disetujui pemilik 2026-10-02; P1–P3 sudah dikodekan dan terpasang di proyek Supabase (2026-10-07); P4 uji perangkat nyata belum** (lihat "Keputusan" dan "Pemasangan" di bawah).

Menyambung kebijakan notifikasi 2026-10-02 (`apps/web/src/notifikasi/SumberNotifikasi.tsx`). Kotak masuk lokal
dan notifikasi perangkat saat aplikasi terbuka di latar sudah jalan. Yang kurang: kabar yang harus sampai
**walau aplikasi tertutup**. Untuk itu server yang mengirim (Web Push).

## 1. Yang dikirim lewat push, dan yang tidak

Prinsip yang sama dengan klien: mendesak, bisa ditindaklanjuti, belum terlihat di layar.

| Kabar | Push? | Alasan |
|---|---|---|
| Streak terancam putus (streak ≥ 3, hari ini belum aktif) | **Ya, mendesak** | Batas waktunya malam ini; satu-satunya yang butuh push untuk berguna. |
| Ringkasan peringkat mingguan | **Ya** | Server punya riwayat XP, jadi angkanya akurat (klien hanya menebak dari kunjungan terakhir). |
| Materi baru di modul yang sedang dipelajari | **Ya** | Server tahu siapa yang mengikuti modul itu (tabel progres belajar). |
| Modul tamat, tonggak streak | Tidak | Terjadi saat aplikasi terbuka; notifikasi lokal cukup. |
| Kasus waris menggantung | Tidak | Kasus hanya ada di perangkat; mengirimnya ke server melanggar prinsip "berjalan di perangkat". |

Batas harian di server: kabar biasa maksimal 1 per pengguna per hari; kabar mendesak **tanpa batas** (keputusan pemilik). Isi push tidak memuat data kasus, nama keluarga, atau nominal.

## 2. Data (migrasi baru, satu berkas)

```sql
-- Langganan push: satu baris per perangkat/browser. endpoint adalah rahasia (siapa pun yang memegangnya bisa mengirim).
create table langganan_push (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  bahasa text not null default 'id' check (bahasa in ('id','ar')),
  dibuat_pada timestamptz not null default now(),
  gagal_berturut int not null default 0
);
-- RLS: pemilik boleh insert/select/delete barisnya sendiri; anon tidak punya akses.

-- Log kiriman: mencegah dobel (unique) dan menjadi sumber "kabar yang terlewat" untuk kotak masuk lokal.
create table kirim_push (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  jenis text not null check (jenis in ('streak_terancam','peringkat_pekan','materi_baru')),
  kunci text not null,                       -- mis. 'streak_terancam:2026-10-02', 'peringkat_pekan:2026-09-28', 'materi_baru:3:rev…'
  judul text not null, isi text not null, tautan text,
  mendesak boolean not null,
  dikirim_pada timestamptz not null default now(),
  unique (user_id, kunci)
);
-- RLS: pemilik boleh select; insert hanya service role.

alter table profil add column push_streak boolean not null default true,
                   add column push_peringkat boolean not null default true,
                   add column push_materi boolean not null default true;
```

`zona_waktu` sudah ada di `profil` (dipakai streak) dan dipakai lagi untuk jendela jam kirim.

## 3. Memilih siapa yang dikirimi (SQL, bisa diuji)

Satu fungsi murni terhadap waktu, mengikuti pola `ringkasan_pada(p_user, p_sekarang)` yang sudah ada:

```
kandidat_push(p_sekarang timestamptz) → (user_id, jenis, kunci, kunci_diksi_judul, kunci_diksi_isi, parameter jsonb, tautan, mendesak)
```

- **streak_terancam**: `streak_sekarang >= 3`, tidak aktif hari ini (zona pengguna), jam lokal 17:00–19:59,
  `push_streak`, punya langganan. Kunci per tanggal lokal: satu kali per hari.
- **peringkat_pekan**: Senin 08:00–09:59 lokal, `push_peringkat`. Menghitung peringkat dan XP pekan lalu dari
  `peristiwa_xp` (`senin_wib(p_sekarang)` mengurangi 7 hari); bandingkan dengan pekan sebelumnya untuk naik/turun/sama.
  Pengguna tanpa XP pekan lalu tidak dikirimi.
- **materi_baru**: dipicu publikasi: untuk setiap materi yang revisinya terbit sejak push terakhir dan modulnya
  sedang dipelajari pengguna (ada pelajaran selesai, belum semua). Kunci memuat modul dan revisi.

Teks diambil dari diksi terbit (kunci `notifikasi.*` yang sudah ada di klien), jadi tim keilmuan bisa
menyuntingnya dari portal, dan bahasa mengikuti `langganan_push.bahasa`. Parameter (`{jumlah}`, `{peringkat}`)
disisipkan di function.

## 4. Pengirim: Edge Function `kirim-push`

- Dipanggil **tiap 15 menit** oleh `pg_cron` + `pg_net` (header rahasia `X-Cron`). Sekitar 2.900 pemanggilan per
  bulan, aman untuk kuota gratis.
- Alur: panggil `kandidat_push(now())` → `insert … on conflict (user_id, kunci) do nothing returning` (yang
  gagal insert sudah pernah dikirim) → terapkan batas harian (bagian 1) → kirim ke semua langganan pengguna
  dengan `npm:web-push` (VAPID) → catat hasil.
- Kegagalan: HTTP 404/410 = langganan mati, hapus barisnya. Kegagalan lain menambah `gagal_berturut`; di atas 5,
  hapus. Satu langganan lambat tidak boleh menahan yang lain (kirim paralel dengan batas, timeout 5 detik).
- Secret: `VAPID_PRIVAT`, `VAPID_PUBLIK`, `VAPID_SUBJEK` (`mailto:`), `CRON_RAHASIA`. Service role hanya di function ini.

Logika murni (jendela jam, batas harian, penyisipan teks) ditaruh di `logika.ts` di samping `index.ts`, seperti
`ai-bantu`, supaya bisa diuji tanpa jaringan.

## 5. Klien

- `perangkat.ts`: sesudah izin diberikan dan pengguna sudah masuk, `pushManager.subscribe({ userVisibleOnly: true,
  applicationServerKey: VITE_VAPID_PUBLIK })`, lalu simpan ke `langganan_push` lewat repositori pengguna (satu
  metode baru di `RepositoriPengguna`, bersama versi lokal untuk tes). Tanpa login, push tidak ditawarkan.
- Keluar akun: `unsubscribe()` dan hapus barisnya. `sw.js` sudah punya handler `push` dan `notificationclick`;
  tambah `pushsubscriptionchange` yang mendaftar ulang.
- Preferensi per jenis (tiga sakelar) di Profil, di samping sakelar yang sudah ada.
- Kabar yang tiba saat aplikasi tertutup tidak masuk kotak masuk lokal. Saat aplikasi dibuka, klien memanggil RPC
  `kabar_push_saya(sejak)` (baca `kirim_push` milik sendiri) dan mencatatnya ke gudang dengan id yang sama,
  sehingga tidak dobel dan lonceng tetap lengkap.
- Notifikasi lokal untuk jenis yang sama (streak terancam, peringkat) dimatikan pada perangkat yang sudah
  berlangganan push, supaya tidak muncul dua kali.

## 6. Perangkat

- Android Chrome/Edge: berfungsi setelah izin diberikan.
- **iOS Safari (16.4+): push hanya bekerja bila aplikasi dipasang ke layar utama.** Tawaran "Pasang aplikasi"
  di panel notifikasi sudah ada; di iOS teksnya perlu menjelaskan langkah manual (Bagikan → Tambahkan ke Layar Utama),
  karena iOS tidak punya `beforeinstallprompt`.
- Desktop: berfungsi; notifikasi tampil walau tab tertutup selama browser berjalan.

## 7. Pengujian

- SQL: tes untuk `kandidat_push` di `supabase/tests`, mengikuti gaya tes peringkat (waktu dioper sebagai
  argumen): jendela jam tiap zona, streak 2 vs 3, sudah aktif, `push_*` mati, tanpa langganan, kunci unik.
- Function: tes `logika.ts` (batas harian, penyisipan teks, penghapusan langganan mati) dengan pengirim tiruan.
- Klien: tes gudang untuk id yang sama dari push dan lokal; tes langganan dengan `PushManager` tiruan.
- Manual: satu perangkat Android dan satu iPhone (PWA terpasang), kirim lewat function dengan waktu dipaksa.

## 8. Tahapan

Tahap (masing-masing dapat dirilis sendiri): **P1** migrasi + `kandidat_push` + tes SQL · **P2** function +
cron, dengan daftar penerima dibatasi ke akun pemilik lebih dulu · **P3** langganan di klien + `kabar_push_saya` ·
**P4** uji perangkat nyata, lalu buka untuk semua.

## Keputusan (pemilik, 2026-10-02)

1. Kabar mendesak tanpa batas harian; kabar biasa satu per hari.
2. Jendela jam disetujui: streak terancam 17:00–19:59, peringkat mingguan Senin 08:00–09:59 (waktu lokal profil).
3. `VAPID_SUBJEK`: pemilik mengisi sendiri alamat `mailto:` sebagai secret (belum diberikan; email akun tidak dipakai).
4. Push "materi baru" **menyusul**: tidak ada `push_materi`, jenis `materi_baru`, atau pelacakan revisi di rilis ini.

## Yang sudah dikodekan (menyimpang dari rancangan awal)

- Migrasi `20261002000001_push.sql`: `langganan_push`, `kirim_push`, `profil.push_streak/push_peringkat`, `peringkat_minggu`, `kandidat_push`.
  Batas harian dan dedup sudah di SQL (diuji `14_push.test.sql`, 21 tes), bukan di function.
- Edge Function `kirim-push` (+ `logika.ts` murni, diuji vitest). Log kiriman hanya ditulis bila minimal satu perangkat menerima.
- Klien memakai tabel langsung lewat RLS (`simpanLangganan`, `hapusLangganan`, `bacaKabarPush`), **bukan** RPC `kabar_push_saya`.
- Perangkat yang sudah berlangganan tidak menampilkan notifikasi lokal streak/peringkat (id kotak masuk sama dengan kabar push, jadi tidak dobel).
- `zona_waktu`: profil yang belum pernah disimpan memakai bawaan `Asia/Jakarta`; Profil menawarkan zona perangkat saat pertama disimpan.

## Pemasangan (langkah 1–4 sudah dilakukan per 2026-10-07; tersisa langkah 5)

1. `npx web-push generate-vapid-keys`; `supabase secrets set VAPID_PUBLIK=… VAPID_PRIVAT=… VAPID_SUBJEK=mailto:… CRON_RAHASIA=…`.
2. Terapkan migrasi ke proyek, lalu `supabase functions deploy kirim-push`.
3. Isi `VITE_VAPID_PUBLIK` di build web.
4. Jalankan `supabase/jadwal-push.sql` (ganti `<PROYEK>` dan `<CRON_RAHASIA>`) setelah mengaktifkan `pg_cron` dan `pg_net`.
5. Uji dulu pada akun sendiri (P2), baru lewat perangkat nyata (P4: Android dan iPhone dengan PWA terpasang).

Catatan 2026-10-07: setelah terpasang, tiap panggilan cron gagal 500 `permission denied for table users` karena
`peringkat_minggu` membaca `auth.users` sebagai service role. Diperbaiki migrasi `20261007002229_push_service_role.sql`
(security definer) dan dijaga tes service role di `14_push.test.sql`.

## 9. Risiko

- Pengguna menolak izin atau mematikan notifikasi browser: tidak ada yang dikirim, dan itu benar. Kotak masuk lokal tetap jalan.
- Zona waktu salah (profil tidak pernah diatur, bawaan `Asia/Jakarta`): pengingat bisa datang di jam yang kurang
  pas bagi pengguna di luar WIB. Klien perlu mengisi `zona_waktu` dari `Intl.DateTimeFormat().resolvedOptions().timeZone`
  saat langganan pertama.
- `endpoint` bocor = pihak lain bisa mengirim push ke perangkat itu. Disimpan hanya di tabel dengan RLS pemilik, tidak
  pernah dikirim ke klien lain atau ditulis ke log.
- Banjir bila `kandidat_push` salah: dobel dicegah `unique (user_id, kunci)`, dan function menolak mengirim lebih dari
  batas harian walau kandidatnya banyak.
