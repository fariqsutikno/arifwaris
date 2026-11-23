-- Audit tautan bagikan 2026-11-23 (T1, T7, T4).

-- T1: akses 'tautan' hanya dijaga slug, jadi slug wajib 16 karakter acak. Check tidak bisa membuktikan keacakan; klien yang
-- curang hanya membahayakan kasusnya sendiri. Tujuannya mencegah slug pendek yang bisa ditebak.
alter table kasus_dibagikan add constraint slug_tautan_acak
  check (akses <> 'tautan' or slug ~ '^[a-z0-9]{16}$');

-- T7: TRUNCATE tidak tunduk RLS; aplikasi tidak butuh TRUNCATE/REFERENCES/TRIGGER.
revoke truncate, references, trigger on kasus_dibagikan from authenticated;

-- T4: komentar lama menyiratkan slug tidak bocor; yang bocor justru keberadaannya (diterima: pembuat harus tahu bila bentrok).
comment on function tautan_bagikan_tersedia(text, text) is
  'Memberi tahu apakah slug sudah dipakai siapa pun (termasuk privat). Keberadaan slug bocor ke pengguna masuk; isi tidak.';
