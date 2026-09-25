import { describe, expect, it } from 'vitest';
import type { BabPenjelasan } from '@waris/explain';
import { kolomTerbukaSampai, sorotKetukan, type DataPeran } from '../hasil/ketukan';

const orang = (id: string) => ({ jenis: 'orang' as const, daftarIdOrang: [id], teks: id });
const teks = (isi: string) => ({ jenis: 'teks' as const, teks: isi });
const data: DataPeran = { idPewaris: 'p', pembagian: new Map([['ibu', 'fardh'], ['anak', 'ashabah']]), terhalang: new Set(['saudara']), bukanAhliWaris: ['sepupu'] };

describe('sorot ketukan', () => {
  const babAhliWaris: BabPenjelasan = { judul: 'Siapa', kolom: 'ahliWaris', daftarBaris: [
    { daftarPotongan: [teks('Ahli waris: '), orang('ibu'), orang('anak')], refs: [] },
    { daftarPotongan: [orang('saudara'), teks(' terhalang oleh '), orang('anak')], refs: [], subjek: ['saudara'] },
  ] };

  it('baris daftar ahli waris: ahli waris biru, yang bukan ahli waris disilang', () => {
    const { peran, panah } = sorotKetukan(babAhliWaris, 0, data, 1);
    expect(Object.fromEntries(peran)).toEqual({ ibu: 'ahliWaris', anak: 'ahliWaris', sepupu: 'bukan' });
    expect(panah).toEqual([]);
  });

  it('baris hajb: yang terhalang merah, penghalang jadi penyebab dengan panah ke yang terhalang', () => {
    const { peran, panah } = sorotKetukan(babAhliWaris, 1, data, 2);
    expect(Object.fromEntries(peran)).toEqual({ saudara: 'mahjub', anak: 'penyebab' });
    expect(panah).toEqual([['anak', 'saudara']]);
  });

  it('seluruh bab: peran spesifik menang atas penyebab', () => {
    expect(sorotKetukan(babAhliWaris, null, data, 3).peran.get('anak')).toBe('ahliWaris');
  });

  it('bab bagian: fardh/ashabah menurut tabel; bab harta tanpa orang menyorot pewaris', () => {
    const babBagian: BabPenjelasan = { judul: 'Bagian', kolom: 'bagian', daftarBaris: [{ daftarPotongan: [orang('ibu'), teks(' 1/6')], refs: [], subjek: ['ibu'] }] };
    expect(sorotKetukan(babBagian, 0, data, 1).peran.get('ibu')).toBe('fardh');
    const babHarta: BabPenjelasan = { judul: 'Harta', kolom: 'nominal', daftarBaris: [{ daftarPotongan: [teks('Rp1')], refs: [] }] };
    expect(Object.fromEntries(sorotKetukan(babHarta, 0, data, 1).peran)).toEqual({ p: 'pewaris' });
  });

  it('tabel dibangun bertahap: nominal dan saham per orang baru terbuka di bab terakhir', () => {
    const daftarBab: BabPenjelasan[] = [
      { judul: 'Harta', kolom: 'nominal', daftarBaris: [] }, { judul: 'Siapa', kolom: 'ahliWaris', daftarBaris: [] },
      { judul: 'Bagian', kolom: 'bagian', daftarBaris: [] }, { judul: 'Hasil', kolom: 'nominal', daftarBaris: [] },
    ];
    expect([...kolomTerbukaSampai(daftarBab, 2)].sort()).toEqual(['ahliWaris', 'bagian']);
    expect(kolomTerbukaSampai(daftarBab, 3).has('nominal')).toBe(true);
  });
});
