// Mengubah packages/latihan/src/__tests__/xp-kasus.json menjadi uji pgTAP supabase/tests/database/22_xp_kasus.test.sql:
// `pnpm db:xp-kasus`. Berkas SQL dibuat ulang tiap kali; jangan disunting tangan.
import { readFileSync, writeFileSync } from 'node:fs';

interface Kejadian { aksi: string; mode: string; benar?: boolean; kolomBenar?: number; kolomTotal?: number }
interface Kasus { nama: string; bobot: number; xp: number; kejadian: Kejadian[] }
const kasus: Kasus[] = JSON.parse(readFileSync('packages/latihan/src/__tests__/xp-kasus.json', 'utf8'));
const snake = (aksi: string) => aksi.replace(/[A-Z]/g, huruf => `_${huruf.toLowerCase()}`);
const uuid = (awalan: number, nomor: number) => `'00000000-0000-0000-${String(awalan).padStart(4, '0')}-${String(nomor).padStart(12, '0')}'`;
const USER = "'00000000-0000-0000-0000-0000000000e1'";

const baris: string[] = [];
kasus.forEach((k, i) => {
  const entri = uuid(1, i + 1), revisi = uuid(2, i + 1);
  baris.push(`insert into entri_konten (id, jenis, slug) values (${entri}, 'soal_hitung', 'X-${i + 1}');`);
  baris.push(`insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values (${revisi}, ${entri}, '{"bobotXp": ${k.bobot}}', '{R01-1}', ${USER});`);
  k.kejadian.forEach((e, j) => {
    const total = e.kolomTotal;
    const hasil = total === undefined ? 'null'
      : `'${JSON.stringify(Array.from({ length: total }, (_, n) => ({ status: n < (e.kolomBenar ?? 0) ? 'benar' : 'salah' })))}'::jsonb`;
    const benarSemua = total === undefined ? (e.benar === undefined ? 'null' : String(e.benar)) : String(e.kolomBenar === total);
    baris.push(`insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, hasil_kolom, benar_semua, diterima_pada, versi)
  values (${uuid(3, i * 100 + j + 1)}, ${USER}, ${uuid(4, i * 100 + (e.mode === 'ujian' && e.aksi === 'kirim' ? j + 1 : 0) + 1)}, 'X-${i + 1}', ${revisi}, 'biasa', '${e.mode}', '${snake(e.aksi)}', ${hasil}, ${benarSemua}, timestamptz '2026-11-01 10:00+00' + interval '${j + 1} minute', '{}');`);
  });
  baris.push(`select is(coalesce((select sum(xp) from xp_soal_baru(${USER}) where soal_id = 'X-${i + 1}'), 0)::int, ${k.xp}, '${k.nama.replace(/'/g, "''")}');`);
});

writeFileSync('supabase/tests/database/22_xp_kasus.test.sql', `-- supabase/tests/database/22_xp_kasus.test.sql
-- DIBUAT OTOMATIS dari packages/latihan/src/__tests__/xp-kasus.json oleh scripts/xp-kasus-ke-sql.ts (pnpm db:xp-kasus).
begin;
select plan(${kasus.length});
insert into auth.users (id, email) values (${USER}, 'xp@tes.local');
${baris.join('\n')}
select * from finish();
rollback;
`);
