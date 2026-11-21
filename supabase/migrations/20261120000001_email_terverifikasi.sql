-- supabase/migrations/20261120000001_email_terverifikasi.sql
-- K1 (audit 2026-11-20): klaim email JWT hanya dipercaya bila penyedianya Google (email terverifikasi penyedia).
-- Penyedia Email tanpa konfirmasi memungkinkan orang mendaftar dengan email korban lalu membaca kasus berakses 'email'.
create or replace function baca_kasus_dibagikan(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  baris kasus_dibagikan;
  surel text := case when auth.jwt() -> 'app_metadata' ->> 'provider' = 'google'
    then lower(coalesce(auth.jwt() ->> 'email', '')) else '' end;
  boleh boolean;
begin
  select * into baris from kasus_dibagikan where slug = p_slug;
  if not found or (baris.akses = 'privat' and baris.pemilik is distinct from auth.uid()) then
    return jsonb_build_object('status', 'tidak_ada');
  end if;
  boleh := baris.pemilik is not distinct from auth.uid() or baris.akses = 'tautan'
    or (baris.akses = 'email' and surel <> '' and exists (select 1 from unnest(baris.email) as e where lower(e) = surel));
  if not boleh then
    return jsonb_build_object('status', case when auth.uid() is null then 'perlu_masuk' else 'tidak_boleh' end);
  end if;
  return jsonb_build_object('status', 'ok', 'kasus', baris.kasus, 'akses', baris.akses,
    'pemilik', baris.pemilik is not distinct from auth.uid());
end $$;
