-- supabase/jadwal-push.sql
-- BUKAN migrasi: jadwal pengiriman push berisi alamat proyek dan rahasia, jadi dipasang sekali per lingkungan (staging/produksi)
-- dari SQL Editor, bukan dari `db reset`. Ganti <PROYEK> dan <CRON_RAHASIA> (nilai sama dengan secret CRON_RAHASIA di fungsi).
-- Menjalankan kirim-push tiap 15 menit (cukup untuk jendela jam: streak 17:00-19:59, peringkat Senin 08:00-09:59).
--
-- Prasyarat sekali: aktifkan ekstensi pg_cron dan pg_net (Dashboard > Database > Extensions), lalu
--   supabase secrets set VAPID_PUBLIK=... VAPID_PRIVAT=... VAPID_SUBJEK=mailto:... CRON_RAHASIA=...
--   supabase functions deploy kirim-push
-- Kunci VAPID dibuat sekali dengan: npx web-push generate-vapid-keys

select cron.schedule(
  'kirim-push',
  '*/15 * * * *',
  $$ select net.http_post(
       url := 'https://<PROYEK>.supabase.co/functions/v1/kirim-push',
       headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron', '<CRON_RAHASIA>'),
       body := '{}'::jsonb,
       timeout_milliseconds := 20000
     ) $$
);

-- Menghentikan: select cron.unschedule('kirim-push');
