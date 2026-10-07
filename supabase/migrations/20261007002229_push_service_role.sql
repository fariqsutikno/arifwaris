-- supabase/migrations/20261007002229_push_service_role.sql
-- kandidat_push dipanggil Edge Function kirim-push sebagai service_role, tetapi peringkat_minggu membaca auth.users,
-- yang tidak terbaca service_role: setiap panggilan gagal "permission denied for table users". Sama seperti papan_peringkat,
-- fungsi ini dijalankan dengan hak pemiliknya. Hak eksekusi tidak berubah: tetap hanya service_role.
alter function peringkat_minggu(date) security definer set search_path = public;
