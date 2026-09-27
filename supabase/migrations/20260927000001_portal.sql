-- supabase/migrations/20260927000001_portal.sql
-- Peran berbasis email untuk portal (keputusan tahap 3). auth.users tidak terbaca klien, jadi lewat fungsi
-- security definer yang memeriksa admin sendiri. Nama = full_name dari metadata Google.

create function daftar_peran() returns table (user_id uuid, email text, nama text, peran peran)
language plpgsql stable security definer set search_path = public as $$
begin
  if peran_saya() is distinct from 'admin' then raise exception 'hanya admin yang bisa melihat daftar peran'; end if;
  return query
    select p.user_id, u.email::text, (u.raw_user_meta_data->>'full_name')::text, p.peran
      from peran_pengguna p join auth.users u on u.id = p.user_id order by u.email;
end $$;

create function atur_peran_email(p_email text, p_peran peran) returns void
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if peran_saya() is distinct from 'admin' then raise exception 'hanya admin yang bisa mengatur peran'; end if;
  select id into v_id from auth.users where lower(email) = lower(btrim(p_email));
  if v_id is null then raise exception 'akun belum pernah masuk: %', p_email; end if;
  if p_peran is null then delete from peran_pengguna where user_id = v_id;
  else insert into peran_pengguna (user_id, peran) values (v_id, p_peran)
       on conflict (user_id) do update set peran = excluded.peran;
  end if;
end $$;

revoke execute on function daftar_peran(), atur_peran_email(text, peran) from public, anon;
