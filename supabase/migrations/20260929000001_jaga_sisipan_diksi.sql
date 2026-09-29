-- Revisi diksi wajib mempertahankan himpunan {sisipan} teks terbit kuncinya (urutan bebas). Kunci tanpa teks terbit
-- bebas. Explain & t() mengisi sisipan dari kode; sisipan yang hilang/berganti nama merusak halaman di produksi.
create function sisipan_teks(teks text) returns text[] language sql immutable as $$
  select coalesce(array_agg(distinct cocok[1] order by cocok[1]), '{}') from regexp_matches(teks, '\{(\w+)\}', 'g') as cocok
$$;

create function jaga_sisipan_diksi() returns trigger language plpgsql as $$
declare
  teks_terbit text;
  harapan text[];
begin
  select r.id_teks into teks_terbit from diksi d join revisi_diksi r on r.id = d.revisi_terbit_id where d.kunci = new.kunci;
  if teks_terbit is null then return new; end if;
  harapan := sisipan_teks(teks_terbit);
  if sisipan_teks(new.id_teks) <> harapan or (new.ar_teks is not null and sisipan_teks(new.ar_teks) <> harapan) then
    raise exception 'Teks harus tetap memuat bagian otomatis: %',
      (select string_agg('{' || nama || '}', ', ') from unnest(harapan) as nama);
  end if;
  return new;
end $$;

create trigger jaga_sisipan_diksi before insert or update of id_teks, ar_teks on revisi_diksi
  for each row execute function jaga_sisipan_diksi();
