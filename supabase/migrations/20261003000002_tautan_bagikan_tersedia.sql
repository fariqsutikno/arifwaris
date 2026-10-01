-- supabase/migrations/20261003000002_tautan_bagikan_tersedia.sql
-- Cek nama tautan sebelum disimpan (UI menampilkan "tersedia / sudah dipakai" saat mengetik). Kasus milik pemanggil sendiri
-- (p_id_riwayat) tidak dihitung bentrok. Hanya mengembalikan ya/tidak, tidak membuka isi kasus siapa pun.
create function tautan_bagikan_tersedia(p_slug text, p_id_riwayat text default null) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from kasus_dibagikan
    where slug = p_slug and not (pemilik = auth.uid() and id_riwayat = p_id_riwayat)
  );
$$;
revoke execute on function tautan_bagikan_tersedia(text, text) from public;
grant execute on function tautan_bagikan_tersedia(text, text) to authenticated;
