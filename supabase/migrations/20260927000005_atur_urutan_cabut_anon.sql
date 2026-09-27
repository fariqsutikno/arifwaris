-- atur_urutan hanya untuk pengguna masuk; samakan dengan pola fungsi portal lain (20260927000001_portal.sql).
revoke execute on function atur_urutan(uuid[]) from public, anon;
