-- Soal kuis hanya terbit lewat dua tahap (spec-soal-kuis-ribuan 5.1): jalur mana pun yang menyetujui revisi soal kuis
-- yang belum 'diperiksa' (termasuk terbitkan_langsung admin) ditolak di sini, bukan di tiap fungsi.
create function jaga_dua_tahap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'disetujui' and old.status is distinct from 'diperiksa' and butuh_dua_tahap(new) then
    raise exception 'soal kuis harus diperiksa dan disetujui keilmuan; tidak bisa diterbitkan langsung';
  end if;
  return new;
end $$;
revoke execute on function jaga_dua_tahap() from public, anon, authenticated;

create trigger jaga_dua_tahap before update of status on revisi for each row execute function jaga_dua_tahap();
