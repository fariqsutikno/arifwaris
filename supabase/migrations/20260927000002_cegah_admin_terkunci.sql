-- supabase/migrations/20260927000002_cegah_admin_terkunci.sql
-- Cegah admin mengunci diri sendiri: atur_peran_email menolak jika targetnya diri sendiri (auth.uid())
-- dan peran baru bukan 'admin' (mencabut atau menurunkan peran sendiri).

create or replace function atur_peran_email(p_email text, p_peran peran) returns void
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if peran_saya() is distinct from 'admin' then raise exception 'hanya admin yang bisa mengatur peran'; end if;
  select id into v_id from auth.users where lower(email) = lower(btrim(p_email));
  if v_id is null then raise exception 'akun belum pernah masuk: %', p_email; end if;
  if v_id = auth.uid() and p_peran is distinct from 'admin' then
    raise exception 'admin tidak bisa mencabut atau menurunkan perannya sendiri';
  end if;
  if p_peran is null then delete from peran_pengguna where user_id = v_id;
  else insert into peran_pengguna (user_id, peran) values (v_id, p_peran)
       on conflict (user_id) do update set peran = excluded.peran;
  end if;
end $$;
