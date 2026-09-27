-- supabase/migrations/20260928000001_peringkat_otomatis.sql
-- Keputusan 2026-09-28: papan peringkat opt-out, bukan opt-in. Semua yang login dan ber-XP langsung tampil; yang belum
-- pernah mengatur profil memakai nama depan dari Google (bukan email, supaya alamatnya tidak bocor). Menyembunyikan diri
-- tetap lewat profil.ikut_papan_peringkat = false.

alter table profil alter column ikut_papan_peringkat set default true;
-- Baris lama dibuat saat default masih false; pilihan itu belum pernah benar-benar ditanyakan.
update profil set ikut_papan_peringkat = true;

-- Nama untuk pengguna tanpa baris profil: kata pertama full_name/name dari Google, selain itu "Pengguna".
create function nama_bawaan(p_meta jsonb) returns text language sql immutable as $$
  select coalesce(
    nullif(left(split_part(btrim(coalesce(p_meta ->> 'full_name', p_meta ->> 'name', '')), ' ', 1), 40), ''),
    'Pengguna')
$$;

create or replace function papan_peringkat_pada(p_periode text, p_batas int, p_sekarang timestamptz, p_pemanggil uuid)
returns table (peringkat int, nama_tampilan text, avatar text, xp int, streak_sekarang int, saya boolean)
language sql stable as $$
  with peserta as (
    select au.id as user_id, coalesce(p.nama_tampilan, nama_bawaan(au.raw_user_meta_data)) as nama_tampilan,
      coalesce(p.tampilkan_avatar, false) as tampilkan_avatar, au.raw_user_meta_data ->> 'avatar_url' as avatar
    from auth.users au left join profil p on p.user_id = au.id
    where coalesce(p.ikut_papan_peringkat, true)
  ), skor as (
    select x.user_id, sum(x.xp)::int as xp
    from peristiwa_xp(null) x join peserta p on p.user_id = x.user_id
    where p_periode = 'semua' or x.minggu = senin_wib(p_sekarang)
    group by x.user_id
  ), urut as (
    select s.user_id, s.xp, p.nama_tampilan, p.tampilkan_avatar, p.avatar,
      rank() over (order by s.xp desc)::int as peringkat,
      row_number() over (order by s.xp desc, p.nama_tampilan, s.user_id) as urutan
    from skor s join peserta p on p.user_id = s.user_id
    where s.xp > 0
  )
  select u.peringkat, u.nama_tampilan, case when u.tampilkan_avatar then u.avatar end,
    u.xp, coalesce(st.streak_sekarang, 0), coalesce(u.user_id = p_pemanggil, false)
  from urut u
  left join streak_pada(null, p_sekarang) st on st.user_id = u.user_id
  where u.urutan <= p_batas or u.user_id = p_pemanggil
  order by u.urutan
$$;

revoke execute on function nama_bawaan(jsonb), papan_peringkat_pada(text, int, timestamptz, uuid) from public, anon, authenticated;
