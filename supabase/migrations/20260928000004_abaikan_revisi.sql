-- supabase/migrations/20260928000004_abaikan_revisi.sql
-- Revisi yang dikembalikan boleh dibuang tanpa disunting: pembuat (atau admin) menandainya `diabaikan`. Revisinya tetap
-- ada di riwayat; entri kembali memakai versi tayang. Aturan sama dengan bolehAbaikanRevisi (packages/content/src/editorial.ts).

alter table revisi add column diabaikan boolean not null default false;

-- Tanda diabaikan bukan perubahan isi, jadi boleh diubah pada revisi yang sudah lewat draf.
create or replace function bekukan_revisi() returns trigger
language plpgsql as $$
begin
  if old.status <> 'draf' and (to_jsonb(new) - array['status', 'diperiksa_oleh', 'catatan_review', 'diperiksa_pada', 'diabaikan'])
                              is distinct from (to_jsonb(old) - array['status', 'diperiksa_oleh', 'catatan_review', 'diperiksa_pada', 'diabaikan']) then
    raise exception 'revisi yang sudah diajukan tidak bisa diubah';
  end if;
  return new;
end $$;

create function abaikan_revisi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  select * into r from revisi where id = p_id and status = 'dikembalikan' and not diabaikan for update;
  if not found or peran_saya() is null or peran_saya() = 'reviewer' or (r.dibuat_oleh <> auth.uid() and peran_saya() <> 'admin') then
    raise exception 'revisi % tidak bisa dibuang', p_id;
  end if;
  update revisi set diabaikan = true where id = p_id;
end $$;

revoke execute on function abaikan_revisi(uuid) from public, anon;
