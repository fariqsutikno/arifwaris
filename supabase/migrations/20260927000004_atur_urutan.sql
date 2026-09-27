-- Urutan entri diatur dengan seret di portal tanpa membuat revisi (spec portal admin tahap A "Urutan seret").
-- admin & penulis boleh; policy `ubah` entri_konten tetap admin saja, jadi penulis lewat fungsi security definer ini
-- yang hanya menyentuh kolom urutan. Entri yang sedang terbit mendapat versi_terbit baru supaya web mengambil urutannya.
create function atur_urutan(p_entri uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_jumlah_jenis int;
  v_jumlah_ada int;
  v_versi bigint;
begin
  if peran_saya() is null or peran_saya() not in ('admin', 'penulis') then
    raise exception 'perlu peran admin/penulis';
  end if;
  if coalesce(array_length(p_entri, 1), 0) = 0 then raise exception 'daftar entri kosong'; end if;
  if (select count(distinct x) from unnest(p_entri) x) <> array_length(p_entri, 1) then raise exception 'ada entri ganda'; end if;
  select count(distinct jenis), count(*) into v_jumlah_jenis, v_jumlah_ada from entri_konten where id = any(p_entri);
  if v_jumlah_ada <> array_length(p_entri, 1) then raise exception 'ada entri yang tidak dikenal'; end if;
  if v_jumlah_jenis <> 1 then raise exception 'urutan hanya untuk entri satu jenis'; end if;

  if exists (select 1 from entri_konten where id = any(p_entri) and revisi_terbit_id is not null) then
    v_versi := naikkan_versi_konten();
  end if;
  update entri_konten e
    set urutan = u.posisi * 10,
        versi_terbit = case when e.revisi_terbit_id is null then e.versi_terbit else v_versi end
    from unnest(p_entri) with ordinality as u(id, posisi)
    where e.id = u.id;
end $$;
