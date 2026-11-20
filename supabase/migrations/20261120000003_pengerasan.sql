-- supabase/migrations/20261120000003_pengerasan.sql
-- K4–K6 (audit 2026-11-20). Daftar fungsi dari penasihat keamanan produksi.

-- K4: fungsi portal tidak untuk anon. Sengaja tetap terbuka bagi anon: peran_saya (dipakai kebijakan RLS baca),
-- baca_kasus_dibagikan (tautan publik), papan_peringkat (halaman publik).
revoke execute on function
  ajukan_revisi(uuid), ajukan_revisi_diksi(uuid),
  kembalikan_revisi(uuid, text), kembalikan_revisi_diksi(uuid, text),
  setujui_revisi(uuid), setujui_revisi_diksi(uuid),
  terbitkan_ulang_revisi(uuid), terbitkan_ulang_revisi_diksi(uuid),
  tautan_bagikan_tersedia(text, text)
  from public, anon;

-- K5: search_path tetap untuk fungsi yang belum menyetelnya (semua security invoker).
alter function bekukan_revisi() set search_path = public;
alter function tolak_data_lebih_lama() set search_path = public;
alter function xp_konten(text, text) set search_path = public;
alter function xp_hari_aktif() set search_path = public;
alter function batas_toleransi() set search_path = public;
alter function senin(date) set search_path = public;
alter function senin_wib(timestamptz) set search_path = public;
alter function periksa_zona_waktu() set search_path = public;
alter function kegiatan_sah(uuid) set search_path = public;
alter function hari_aktif(uuid) set search_path = public;
alter function peristiwa_xp(uuid) set search_path = public;
alter function streak_pada(uuid, timestamptz) set search_path = public;
alter function ringkasan_pada(uuid, timestamptz) set search_path = public;
alter function nama_bawaan(jsonb) set search_path = public;
alter function papan_peringkat_pada(text, int, timestamptz, uuid) set search_path = public;
alter function sisipan_teks(text) set search_path = public;
alter function jaga_sisipan_diksi() set search_path = public;
alter function kandidat_push(timestamptz) set search_path = public;

-- K6: penulis hanya mengubah isi drafnya; pembuat, entri, dan status tidak boleh dipalsukan lewat update langsung.
-- Perpindahan status hanya lewat fungsi security definer. Kolom lain (hapus, diabaikan, diperiksa_*) juga lewat fungsi.
revoke update on revisi, revisi_diksi from anon, authenticated;
grant update (isi, refs) on revisi to authenticated;
grant update (id_teks, ar_teks, catatan) on revisi_diksi to authenticated;

-- Fungsi platform (event trigger ensure_rls) hanya ada di produksi; tidak untuk dipanggil lewat API.
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
