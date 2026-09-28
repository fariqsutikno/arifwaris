-- supabase/migrations/20260928000005_abaikan_revisi_diksi.sql
-- Sama seperti abaikan_revisi (20260928000004) untuk teks aplikasi: revisi diksi yang dikembalikan boleh dibuang
-- pembuatnya (atau admin); teks tayang tidak berubah dan revisinya tetap di riwayat. bekukan_revisi sudah
-- mengecualikan kolom diabaikan.

alter table revisi_diksi add column diabaikan boolean not null default false;

create function abaikan_revisi_diksi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi_diksi;
begin
  select * into r from revisi_diksi where id = p_id and status = 'dikembalikan' and not diabaikan for update;
  if not found or peran_saya() is null or peran_saya() = 'reviewer' or (r.dibuat_oleh <> auth.uid() and peran_saya() <> 'admin') then
    raise exception 'revisi diksi % tidak bisa dibuang', p_id;
  end if;
  update revisi_diksi set diabaikan = true where id = p_id;
end $$;

revoke execute on function abaikan_revisi_diksi(uuid) from public, anon;
