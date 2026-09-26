-- FAQ kelompok "Pakai aplikasi" menjawab cara pakai aplikasi, bukan klaim fikih: boleh tanpa ref (keputusan 2026-09-26).
-- Aturan yang sama dengan wajibRef/periksaRefs di packages/content.
create or replace function periksa_refs_revisi() returns trigger
language plpgsql set search_path = public as $$
declare
  jenis_entri text;
  tak_dikenal text;
begin
  select string_agg(kode, ', ') into tak_dikenal
    from unnest(new.refs) as kode where kode not in (select d.kode from daftar_refs d);
  if tak_dikenal is not null then raise exception 'ref tidak ada di KB: %', tak_dikenal; end if;
  select jenis into jenis_entri from entri_konten where id = new.entri_id;
  if jenis_entri in ('materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq', 'ahwal', 'syahid')
     and not (jenis_entri = 'faq' and coalesce(new.isi->>'kelompok' = 'Pakai aplikasi', false))
     and cardinality(new.refs) = 0 then
    raise exception '% wajib punya minimal satu ref', jenis_entri;
  end if;
  return new;
end $$;
