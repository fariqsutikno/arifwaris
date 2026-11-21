// Uji integrasi manual edge function catat-percobaan pada tumpukan Supabase LOKAL (runtime edge asli).
// Persiapan: `pnpm db:mulai && pnpm fungsi:bundel`, di terminal lain `supabase functions serve catat-percobaan`, lalu
// `node scripts/uji-integrasi-catat-percobaan.mjs`. Tidak menyentuh produksi; membuat satu pengguna dan satu soal uji lokal.
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
const env = Object.fromEntries(execSync('supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n').map(b => { const [k, ...v] = b.split('='); return [k, v.join('=').replace(/^"|"$/g, '')]; }));
const H = (kunci, extra = {}) => ({ apikey: kunci, Authorization: `Bearer ${kunci}`, 'Content-Type': 'application/json', ...extra });
const rest = (jalur, opsi) => fetch(`${env.API_URL}${jalur}`, opsi);
const email = `uji${Date.now()}@tes.local`;
let r = await rest('/auth/v1/admin/users', { method: 'POST', headers: H(env.SERVICE_ROLE_KEY), body: JSON.stringify({ email, password: 'Uji-12345!', email_confirm: true }) });
const user = await r.json();
r = await rest('/auth/v1/token?grant_type=password', { method: 'POST', headers: H(env.ANON_KEY), body: JSON.stringify({ email, password: 'Uji-12345!' }) });
const jwt = (await r.json()).access_token;
const isi = { kode: 'H-99', bab: 5, tingkat: 'dasar', judul: 'uji', topik: 't', sumber: 's', bobotXp: 15,
  kasus: { pewaris: 'L', ahliWaris: ['ISTRI', 'ANAK_LK', 'ANAK_PR'], harta: '24000000', harapan: { saham: {}, ashlAkhir: '24' } } };
const entri = (await (await rest('/rest/v1/entri_konten', { method: 'POST', headers: H(env.SERVICE_ROLE_KEY, { Prefer: 'return=representation' }), body: JSON.stringify({ jenis: 'soal_hitung', slug: `H-99-${Date.now()}` }) })).json())[0];
const revisi = (await (await rest('/rest/v1/revisi', { method: 'POST', headers: H(env.SERVICE_ROLE_KEY, { Prefer: 'return=representation' }), body: JSON.stringify({ entri_id: entri.id, isi, refs: ['R01-1'], status: 'disetujui', dibuat_oleh: user.id }) })).json())[0];
const uuid = () => crypto.randomUUID();
const panggil = async (badan, kunci = jwt) => { const x = await fetch(`${env.API_URL}/functions/v1/catat-percobaan`, { method: 'POST', headers: H(env.ANON_KEY, { Authorization: `Bearer ${kunci}` }), body: JSON.stringify(badan) }); return [x.status, await x.json().catch(() => null)]; };
const sesi = uuid();
const dasar = { idSesiSoal: sesi, soalId: 'H-99', revisiSoal: revisi.id, mode: 'latihan', dimulaiPada: new Date().toISOString() };
const idBuka = uuid();
const cek = async (nama, janji, status, kode) => {
  const [st, isi] = await janji;
  assert.equal(st, status, `${nama}: status ${st} ${JSON.stringify(isi)}`);
  if (kode) assert.equal(isi.galat, kode, nama);
  console.log('ok', nama);
  return isi;
};
await cek('tanpa sesi', panggil({ ...dasar, id: uuid(), aksi: 'buka' }, env.ANON_KEY), 401);
await cek('buka', panggil({ ...dasar, id: idBuka, aksi: 'buka' }), 200);
assert.equal((await cek('buka ulang idempoten', panggil({ ...dasar, id: idBuka, aksi: 'buka' }), 200)).duplikat, true);
await cek('user_id di badan', panggil({ ...dasar, id: uuid(), aksi: 'buka', user_id: uuid() }), 400, 'USER_ID_DILARANG');
await cek('revisi tak terbit', panggil({ ...dasar, id: uuid(), aksi: 'buka', revisiSoal: uuid() }), 400, 'REVISI_TIDAK_TERBIT');
await cek('baris karangan', panggil({ ...dasar, id: uuid(), aksi: 'periksa', isian: { kepala: {}, sel: { ZZZ: { bagian: '1/8' } } }, jangkar: null }), 400, 'BARIS_TIDAK_ADA');
const salah = await cek('periksa salah dinilai server', panggil({ ...dasar, id: uuid(), aksi: 'periksa', isian: { kepala: {}, sel: {} }, jangkar: null }), 200);
assert.equal(salah.benarSemua, false);
await cek('kuis tak terbit', panggil({ jenis: 'kuis', id: uuid(), slug: 'tidak-ada', indeksPilihan: 0 }), 400, 'KONTEN_TIDAK_TERBIT');
const klien = await rest('/rest/v1/percobaan_soal', { method: 'POST', headers: H(env.ANON_KEY, { Authorization: `Bearer ${jwt}` }), body: JSON.stringify({ id: uuid(), user_id: user.id }) });
assert.equal(klien.status, 403, 'klien tidak bisa menulis langsung');
console.log('semua lulus');
