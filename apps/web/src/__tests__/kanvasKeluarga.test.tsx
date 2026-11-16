import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { kasusBaru, rapikanKeadaan, type Kasus, type Kelompok } from '../kasus';
import { KanvasKeluarga } from '../layar/keluarga/KanvasKeluarga';
import { denganBagianTetapTerisi, keluargaKarto } from './fixtures/kanvas';

let terakhir: Kasus;
function Uji({ awal, saatSelesai = () => undefined }: { awal: Kasus; saatSelesai?: () => void }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <KanvasKeluarga kasus={kasus} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} tandaiKurang={false} saatSelesai={saatSelesai} />;
}
const dijawab = (kasus: Kasus, peta: Record<string, Kelompok[]>): Kasus => ({ ...kasus, kelompokDijawab: peta });
const judulAktif = () => screen.getByRole('heading', { level: 2 }).textContent;

describe('KanvasKeluarga (spec kanvas 5.1, 5.5)', () => {
  it('kasus kosong: hanya kartu Pasangan dan peta; bagian lain tidak dirender', () => {
    render(<Uji awal={kasusBaru('L')} />);
    expect(judulAktif()).toBe('Waktu almarhum meninggal, apakah beliau punya istri?');
    expect(screen.queryByText(/punya anak/)).toBeNull();
    expect(screen.getByText(/^0 dari \d+ bagian selesai$/)).toBeTruthy();
  });

  it('menjawab Tidak tidak memindahkan bagian sendiri; Lanjut membuka Anak dan meringkas Pasangan', () => {
    render(<Uji awal={kasusBaru('L')} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Tidak' }));
    expect(judulAktif()).toBe('Waktu almarhum meninggal, apakah beliau punya istri?');
    expect(screen.getByText('Bagian ini sudah lengkap.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Lanjut: Anak/ }));
    expect(judulAktif()).toBe('Almarhum punya anak, termasuk yang sudah meninggal?');
    const ringkasan = screen.getByRole('list', { name: 'Bagian yang sudah selesai' });
    expect(within(ringkasan).getByText('Istri almarhum')).toBeTruthy();
    expect(within(ringkasan).getByText('Tidak ada')).toBeTruthy();
  });

  it('Ubah pada bagian pertama: kartu aktif tetap di tempatnya, ringkasan bagian sesudahnya di bawah', () => {
    render(<Uji awal={kasusBaru('L')} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Tidak' }));
    fireEvent.click(screen.getByRole('button', { name: /Lanjut: Anak/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'Tidak' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ubah Istri almarhum' }));
    const kartu = document.querySelector('section.grup')!;
    const ringkasan = screen.getByRole('list', { name: 'Bagian yang sudah selesai' });
    expect(kartu.compareDocumentPosition(ringkasan) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(ringkasan).getByText('Anak almarhum')).toBeTruthy();
  });

  it('Lanjut saat bagian belum lengkap tidak pindah dan menandai kekurangan', () => {
    render(<Uji awal={kasusBaru('L')} />);
    fireEvent.click(screen.getByRole('button', { name: /Lanjut: Anak/ }));
    expect(judulAktif()).toBe('Waktu almarhum meninggal, apakah beliau punya istri?');
    expect(screen.getByText('Pilihan Ya atau Tidak belum dipilih.')).toBeTruthy();
  });

  it('pulih ke bagian pertama yang belum lengkap (Review Focus 5)', () => {
    const { kasus, rina } = keluargaKarto();
    const awal = { ...dijawab(kasus, { PEWARIS: ['pasangan', 'anak'] }), belumDiisi: [rina] };
    render(<Uji awal={awal} />);
    expect(judulAktif()).toBe('Almarhum punya anak, termasuk yang sudah meninggal?');
  });

  it('Ya → Tidak pada Anak berisi menampilkan konfirmasi yang menyebut seluruh keluarga cabang', () => {
    const { kasus, budi } = keluargaKarto();
    render(<Uji awal={dijawab(kasus, { PEWARIS: ['pasangan', 'anak'], [budi]: ['anak'] })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ubah Anak almarhum' }));
    expect(judulAktif()).toBe('Almarhum punya anak, termasuk yang sudah meninggal?');
    fireEvent.click(screen.getByRole('radio', { name: 'Tidak' }));
    const dialog = screen.getByRole('alertdialog');
    for (const nama of ['Dewi', 'Andi', 'Sari']) expect(dialog.textContent).toContain(nama);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Batal' }));
    expect(terakhir.graf.orang[budi]).toBeDefined();
  });

  it('fokus pindah ke judul kartu baru', () => {
    render(<Uji awal={kasusBaru('L')} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Tidak' }));
    fireEvent.click(screen.getByRole('button', { name: /Lanjut: Anak/ }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2 }));
  });

  it('peta berupa teks: tanpa tombol dan tanpa pil', () => {
    const { container } = render(<Uji awal={kasusBaru('L')} />);
    const peta = container.querySelector('.peta-bagian')!;
    expect(peta.querySelectorAll('button')).toHaveLength(0);
    expect(peta.querySelector('.pil, .aw-chip')).toBeNull();
    expect(peta.textContent).toContain('Bagian ini bisa bertambah kalau ada yang meninggal sesudah almarhum.');
  });

  it('pengantar cabang tampil di kartu pertama cabang dan tidak di bagian pewaris', () => {
    const { kasus, sumi } = keluargaKarto();
    const pewaris = denganBagianTetapTerisi(dijawab(kasus, { PEWARIS: ['pasangan', 'anak', 'orangTua', 'kakekNenek', 'halLain'] }));
    render(<Uji awal={pewaris} />);
    expect(screen.getByText(/Mbah Sumi meninggal sesudah almarhum, sebelum hartanya dibagi/)).toBeTruthy();
    expect(sumi).toBeTruthy();
  });

  it('bagian terakhir menawarkan "Selesai, lanjut ke Periksa" tetapi tidak selesai selama bagiannya belum lengkap', () => {
    const saatSelesai = vi.fn();
    const awal = denganBagianTetapTerisi(dijawab(kasusBaru('L'), { PEWARIS: ['pasangan', 'anak', 'orangTua', 'saudara', 'jauh', 'halLain'] }));
    render(<Uji awal={awal} saatSelesai={saatSelesai} />);
    expect(judulAktif()).toBe('Kamu siapanya almarhum?');
    fireEvent.click(screen.getByRole('button', { name: 'Selesai, lanjut ke Periksa' }));
    expect(saatSelesai).not.toHaveBeenCalled();
    expect(screen.getByText('Pilihan Kamu belum dijawab.')).toBeTruthy();
  });
});
