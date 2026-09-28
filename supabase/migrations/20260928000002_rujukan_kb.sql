-- supabase/migrations/20260928000002_rujukan_kb.sql
-- KB bagian F, lapisan pertama: tabel "Dasar dan Rujukan" jadi jenis konten `rujukan` (slug = kode, mis. R09-7).
-- Rujukan yang terbit otomatis masuk daftar_refs, supaya konten lain boleh merujuknya; sebelum terbit belum bisa dirujuk.
alter table entri_konten drop constraint entri_konten_jenis_check;
alter table entri_konten add constraint entri_konten_jenis_check check (jenis in (
  'modul', 'materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq', 'kitab', 'syahid',
  'glosarium_ar', 'ahwal', 'teks_edukasi', 'cheatsheet', 'rujukan'));
alter table entri_konten add constraint rujukan_slug_kode check (jenis <> 'rujukan' or slug ~ '^R\d{2}-\d+$');

create function daftarkan_rujukan_terbit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.jenis = 'rujukan' and new.revisi_terbit_id is not null then
    insert into daftar_refs (kode, bab) values (new.slug, substring(new.slug from 2 for 2)::int) on conflict (kode) do nothing;
  end if;
  return new;
end $$;
create trigger daftarkan_rujukan after insert or update of revisi_terbit_id on entri_konten
  for each row execute function daftarkan_rujukan_terbit();
