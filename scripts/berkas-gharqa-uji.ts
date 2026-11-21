// Dipakai uji-integrasi-catat-percobaan.mjs: mencetak JSON { berkas, jawabanBenar } untuk soal gharqa KB 13d.2
// (Zaid dan 'Amr wafat bersamaan, tidak diketahui urutannya). jawabanBenar disusun dari tabel yang dibuat penilai,
// jadi skrip integrasi tidak menyalin kunci jawaban. Jalankan: `pnpm exec vite-node scripts/berkas-gharqa-uji.ts`.
import type { GrafKeluarga, Orang } from '@waris/engine';
import { kasusBaru, keJson, nilaiKiriman, type IsianGharqa, type Kiriman } from '../packages/latihan/src/index.js';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });
const wafat = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}) => orang(id, jenisKelamin, { statusHidup: 'wafat', ...lain });
const graf: GrafKeluarga = { idPewaris: 'ZAID', pernikahan: [{ idSuami: 'AMR', idIstri: 'AW', status: 'utuh' }], orang: {
  KAKEK: wafat('KAKEK', 'L'), F: wafat('F', 'L', { idAyah: 'KAKEK' }), PAMAN: orang('PAMAN', 'L', { idAyah: 'KAKEK' }),
  MZ: orang('MZ', 'P'), MA: wafat('MA', 'P'),
  ZAID: wafat('ZAID', 'L', { idAyah: 'F', idIbu: 'MZ' }), ZD: orang('ZD', 'P', { idAyah: 'ZAID' }),
  AMR: wafat('AMR', 'L', { idAyah: 'F', idIbu: 'MA' }), AW: orang('AW', 'P'),
  AD1: orang('AD1', 'P', { idAyah: 'AMR', idIbu: 'AW' }), AD2: orang('AD2', 'P', { idAyah: 'AMR', idIbu: 'AW' }) } };
const harta = { kotor: 24_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n };
const kasus = { ...kasusBaru('L', 'latihan'), graf, tirkah: harta, gharqa: { anggota: ['ZAID', 'AMR'], keadaan: 'tidakDiketahui' as const, tirkah: { AMR: harta } } };
const berkas = JSON.parse(keJson(kasus));

const buka = nilaiKiriman({ aksi: 'buka', isian: null, jangkar: null, gharqa: null } as Kiriman, { kasus: { bentuk: 'berkas', berkas }, revisiId: 'r' }, 'uji');
if (!buka.ok) throw new Error(buka.kode);
const jawabanBenar: IsianGharqa = { keputusan: 'tidakSalingMewarisi', harta: buka.penilaian.daftarTabel.map((tabel, indeks) => ({
  mayit: kasus.gharqa.anggota[indeks]!, jangkar: null,
  isian: { kepala: Object.fromEntries(tabel.kolom.filter(k => k.kepala !== undefined).map(k => [k.id, String(k.kepala)])),
    sel: Object.fromEntries(tabel.baris.map(b => [b.id, { ...b.kunci }])) } })) };
console.log(JSON.stringify({ berkas, jawabanBenar }));
