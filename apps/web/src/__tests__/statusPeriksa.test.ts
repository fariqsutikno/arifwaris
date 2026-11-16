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
      aksi: { jenis: 'urutan', a: sumi, b: budi }, status: 'Pastikan dulu urutan wafat Mbah Sumi dan Budi.' });
  });

  it('hanya belum tahu: hitung dengan kemungkinan; tidak ada: hitung', () => {
    const { kasus } = keluargaKarto();
    expect(statusPeriksa(kasus)).toEqual({ aksi: { jenis: 'hitung' }, status: null });
    const { kasus: denganIbu } = tambah(kasus, 'PEWARIS', 'IBU', { statusHidup: 'tidakDiketahui' });
    expect(statusPeriksa(denganIbu)).toEqual({ aksi: { jenis: 'kemungkinan' }, status: '1 hal belum dipastikan.' });
  });

  it('Keluarga belum lengkap menang atas yang lain', () => {
    keluarga.pertama = { id: 'pasangan:PEWARIS', milik: 'PEWARIS', jenis: 'pasangan' };
    expect(statusPeriksa(keluargaKarto().kasus).aksi).toEqual({ jenis: 'keluarga', idBagian: 'pasangan:PEWARIS' });
  });
});
