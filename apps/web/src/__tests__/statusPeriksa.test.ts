import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tundaUrutan } from '../antreanUrutan';
import { statusPeriksa } from '../statusPeriksa';
import { keluargaKarto, tambah } from './fixtures/kanvas';

// Karto penuh sulit dilengkapi lewat wawancara; kelengkapan Keluarga diuji di wizardPeriksa, di sini hanya urutan prioritasnya.
const keluarga = vi.hoisted(() => ({ pertama: null as { id: string; milik: string; jenis: string } | null }));
vi.mock('../statusKeluarga', () => ({ statusKeluarga: () => ({ sisa: keluarga.pertama ? 1 : 0, pertama: keluarga.pertama, status: '' }) }));
beforeEach(() => { keluarga.pertama = null; });

describe('statusPeriksa (rencana 4, P1)', () => {
  it('urutan tertunda: aksi menunjuk urutannya, status menyebut pasangan, tidak ada "hitung dengan kemungkinan"', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    expect(statusPeriksa(tundaUrutan(kasus, sumi, budi))).toEqual({
      aksi: { jenis: 'urutan', a: sumi, b: budi }, status: 'Pastikan dulu urutan meninggal Mbah Sumi dan Budi.' });
  });

  it('tidak ada yang belum pasti: hitung; hilang (mafqud): hitung dengan kemungkinan', () => {
    const { kasus } = keluargaKarto();
    expect(statusPeriksa(kasus)).toEqual({ aksi: { jenis: 'hitung' }, status: null });
    const { kasus: denganHilang } = tambah(kasus, 'PEWARIS', 'IBU', { statusHidup: 'mafqud' });
    expect(statusPeriksa(denganHilang)).toEqual({ aksi: { jenis: 'kemungkinan' }, status: '1 hal belum dipastikan.' });
  });

  it('belum tahu masih hidup: engine minta input, jadi aksinya menunjuk orang itu, bukan hitung dengan kemungkinan', () => {
    const { kasus } = keluargaKarto();
    const { kasus: denganIbu, id: ibu } = tambah(kasus, 'PEWARIS', 'IBU', { statusHidup: 'tidakDiketahui', nama: 'Ibu Tini' });
    expect(statusPeriksa(denganIbu)).toEqual({ aksi: { jenis: 'pastikan', orang: ibu }, status: 'Ibu Tini: belum dipastikan masih hidup atau tidak.' });
  });

  it('Keluarga belum lengkap menang atas yang lain', () => {
    keluarga.pertama = { id: 'pasangan:PEWARIS', milik: 'PEWARIS', jenis: 'pasangan' };
    expect(statusPeriksa(keluargaKarto().kasus).aksi).toEqual({ jenis: 'keluarga', idBagian: 'pasangan:PEWARIS' });
  });
});
