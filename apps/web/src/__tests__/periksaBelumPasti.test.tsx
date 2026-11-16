import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tundaUrutan } from '../antreanUrutan';
import { daftarBelumPasti } from '../belumPasti';
import type { Kasus } from '../kasus';
import { BelumPasti } from '../layar/periksa/BelumPasti';
import { keluargaKarto, tambah } from './fixtures/kanvas';

function kasusIbuBelumTahu() {
  const { kasus: dasar } = keluargaKarto();
  const { kasus, id } = tambah(dasar, 'PEWARIS', 'IBU', { nama: 'Siti', statusHidup: 'tidakDiketahui' });
  return { kasus, ibu: id };
}
function Papan({ awal, lihat = () => {} }: { awal: Kasus; lihat?: (id: string) => void }) {
  const [kasus, setKasus] = useState(awal);
  return <><BelumPasti kasus={kasus} ubah={f => setKasus(f)} saatLihatDiKeluarga={lihat} /><output data-testid="sisa">{daftarBelumPasti(kasus).length}</output></>;
}
afterEach(() => vi.unstubAllGlobals());

describe('BelumPasti di Periksa', () => {
  it('tidak dirender bila tidak ada yang belum pasti', () => {
    const { container } = render(<Papan awal={keluargaKarto().kasus} />);
    expect(container.querySelector('section')).toBeNull();
  });

  it('keadaan belum tahu: tiga pilihan; "Masih hidup" menyimpan dan hal itu hilang dari daftar', () => {
    render(<Papan awal={kasusIbuBelumTahu().kasus} />);
    expect(screen.getAllByRole('radio').map(r => r.textContent)).toEqual(['Masih hidup', 'Wafat sebelum almarhum', 'Wafat sesudah almarhum']);
    fireEvent.click(screen.getByRole('radio', { name: 'Masih hidup' }));
    expect(screen.getByTestId('sisa').textContent).toBe('0');
    expect(screen.getByText('Tersimpan: Siti. Kisah ikut berubah.')).toBeTruthy();
  });

  it('urutan tertunda: "Sebelum Budi" menyimpan urutan dan hal itu hilang', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    render(<Papan awal={tundaUrutan(kasus, sumi, budi)} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Sebelum Budi' }));
    expect(screen.getByTestId('sisa').textContent).toBe('0');
  });

  it('"Lihat di Keluarga" memanggil saatLihatDiKeluarga dengan id orang, berupa tautan', () => {
    const { kasus, ibu } = kasusIbuBelumTahu();
    const lihat = vi.fn();
    render(<Papan awal={kasus} lihat={lihat} />);
    const tautan = screen.getByRole('button', { name: 'Lihat di Keluarga' });
    expect(tautan.className).toContain('tautan');
    fireEvent.click(tautan);
    expect(lihat).toHaveBeenCalledWith(ibu);
  });

  it('salin WA memanggil clipboard dengan pesan berisi semua pertanyaan, lalu pratinjau tampil', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<Papan awal={kasusIbuBelumTahu().kasus} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salin pertanyaan untuk keluarga' }));
    await waitFor(() => expect(screen.getByText(/Pertanyaan disalin/)).toBeTruthy());
    expect(writeText.mock.calls[0]![0]).toContain('1. Waktu almarhum wafat, apakah Siti masih hidup?');
    expect(document.querySelector('.wa')!.textContent).toBe(writeText.mock.calls[0]![0]);
  });

  it('clipboard ditolak → pratinjau + status', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('ditolak')) } });
    render(<Papan awal={kasusIbuBelumTahu().kasus} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salin pertanyaan untuk keluarga' }));
    await waitFor(() => expect(screen.getByText('Belum tersalin. Salin pesan di bawah secara manual.')).toBeTruthy());
    expect(document.querySelector('.wa')).toBeTruthy();
  });
});
