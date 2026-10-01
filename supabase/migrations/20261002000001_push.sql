-- supabase/migrations/20261002000001_push.sql
-- Push notifikasi dari server (spec 2026-10-02-push-notifikasi-design): langganan perangkat, log kiriman, preferensi per jenis,
-- dan kandidat_push(p_sekarang) yang memilih siapa dikirimi apa. Pengiriman sendiri ada di Edge Function kirim-push (service role).
-- Seperti fungsi peringkat, hitungan menerima "sekarang" sebagai argumen supaya bisa diuji tanpa bergantung jam.
-- Jenis yang ada: streak_terancam (mendesak, tanpa batas harian) dan peringkat_pekan (biasa, maksimal satu per hari).
-- Materi baru menyusul (keputusan 2026-10-02).

-- Satu baris per perangkat/browser. endpoint rahasia: siapa pun yang memegangnya bisa mengirim push ke perangkat itu.
create table langganan_push (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  bahasa text not null default 'id' check (bahasa in ('id', 'ar')),
  dibuat_pada timestamptz not null default now(),
  gagal_berturut int not null default 0
);
create index langganan_push_user on langganan_push (user_id);
alter table langganan_push enable row level security;
create policy milik_sendiri on langganan_push for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on langganan_push from anon;

-- Log kiriman: unique (user_id, kunci) mencegah dobel; juga sumber "kabar yang terlewat" untuk kotak masuk di klien.
create table kirim_push (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  jenis text not null check (jenis in ('streak_terancam', 'peringkat_pekan')),
  kunci text not null,
  judul text not null,
  isi text not null,
  tautan text,
  mendesak boolean not null,
  dikirim_pada timestamptz not null default now(),
  unique (user_id, kunci)
);
alter table kirim_push enable row level security;
create policy baca_sendiri on kirim_push for select to authenticated using (user_id = auth.uid());
revoke all on kirim_push from anon;
revoke insert, update, delete on kirim_push from authenticated;

alter table profil
  add column push_streak boolean not null default true,
  add column push_peringkat boolean not null default true;

-- Peringkat satu minggu (Senin WIB), dengan aturan peserta dan seri yang sama seperti papan_peringkat_pada:
-- hanya yang ikut papan (bawaan ikut) dan ber-XP > 0; seri berbagi peringkat.
create function peringkat_minggu(p_senin date) returns table (user_id uuid, peringkat int) language sql stable as $$
  with peserta as (
    select au.id as user_id from auth.users au left join profil p on p.user_id = au.id
    where coalesce(p.ikut_papan_peringkat, true)
  ), skor as (
    select x.user_id, sum(x.xp)::int as xp
    from peristiwa_xp(null) x join peserta p on p.user_id = x.user_id
    where x.minggu = p_senin
    group by x.user_id
  )
  select s.user_id, rank() over (order by s.xp desc)::int from skor s where s.xp > 0
$$;

-- Kandidat kiriman pada waktu tertentu. Hanya pengguna yang punya langganan. Jam kirim mengikuti zona waktu profil
-- (bawaan Asia/Jakarta). Kunci sudah pernah dikirim dibuang; kabar biasa dibuang bila hari ini (lokal) sudah ada kabar biasa;
-- kabar mendesak tidak terkena batas harian.
create function kandidat_push(p_sekarang timestamptz)
returns table (user_id uuid, jenis text, kunci text, parameter jsonb, tautan text, mendesak boolean)
language sql stable as $$
  with lokal as (
    select l.user_id, coalesce(p.zona_waktu, 'Asia/Jakarta') as zona,
      coalesce(p.push_streak, true) as streak_ok, coalesce(p.push_peringkat, true) as peringkat_ok,
      p_sekarang at time zone coalesce(p.zona_waktu, 'Asia/Jakarta') as waktu
    from (select distinct ls.user_id from langganan_push ls) l left join profil p on p.user_id = l.user_id
  ), terancam as (
    -- Streak 3 hari atau lebih, hari ini belum aktif, jam 17:00-19:59 lokal.
    select s.user_id, 'streak_terancam'::text as jenis, 'streak_terancam:' || l.waktu::date as kunci,
      jsonb_build_object('jumlah', s.streak_sekarang) as parameter, '#/belajar'::text as tautan, true as mendesak
    from streak_pada(null, p_sekarang) s join lokal l on l.user_id = s.user_id
    where l.streak_ok and s.streak_sekarang >= 3 and not s.aktif_hari_ini and extract(hour from l.waktu) between 17 and 19
  ), pekan as (
    -- Senin 08:00-09:59 lokal: peringkat pekan lalu dan selisihnya dari pekan sebelumnya.
    select l.user_id, 'peringkat_pekan'::text, 'peringkat_pekan:' || senin(l.waktu::date),
      jsonb_build_object('peringkat', lalu.peringkat,
        'arah', case when sebelum.peringkat is null then 'awal' when sebelum.peringkat > lalu.peringkat then 'naik'
                     when sebelum.peringkat < lalu.peringkat then 'turun' else 'sama' end,
        'selisih', abs(coalesce(sebelum.peringkat, lalu.peringkat) - lalu.peringkat)),
      '#/peringkat'::text, false
    from lokal l
    join peringkat_minggu(senin_wib(p_sekarang - interval '7 days')) lalu on lalu.user_id = l.user_id
    left join peringkat_minggu(senin_wib(p_sekarang - interval '14 days')) sebelum on sebelum.user_id = l.user_id
    where l.peringkat_ok and extract(isodow from l.waktu) = 1 and extract(hour from l.waktu) between 8 and 9
  ), semua as (
    select * from terancam union all select * from pekan
  )
  select c.user_id, c.jenis, c.kunci, c.parameter, c.tautan, c.mendesak
  from semua c join lokal l on l.user_id = c.user_id
  where not exists (select 1 from kirim_push k where k.user_id = c.user_id and k.kunci = c.kunci)
    and (c.mendesak or not exists (
      select 1 from kirim_push k
      where k.user_id = c.user_id and not k.mendesak and (k.dikirim_pada at time zone l.zona)::date = l.waktu::date))
$$;

-- Hanya Edge Function (service role) yang boleh memilih kandidat: fungsi ini membaca log dan langganan semua orang.
revoke execute on function peringkat_minggu(date), kandidat_push(timestamptz) from public, anon, authenticated;
grant execute on function peringkat_minggu(date), kandidat_push(timestamptz) to service_role;
