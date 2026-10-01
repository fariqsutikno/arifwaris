import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { DialogNama } from '../layar/lab/DialogNama';

test('dialog nama terisi judul awal, Simpan mengirim nama yang dipangkas', () => {
  const saatSimpan = vi.fn();
  render(<DialogNama judulAwal="Istri, Ayah" saatSimpan={saatSimpan} saatBatal={() => {}} />);
  const isian = screen.getByLabelText('Nama kasus') as HTMLInputElement;
  expect(isian.value).toBe('Istri, Ayah');
  fireEvent.change(isian, { target: { value: '  Keluarga Pak Budi ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
  expect(saatSimpan).toHaveBeenCalledWith('Keluarga Pak Budi');
});

test('Esc membatalkan', () => {
  const saatBatal = vi.fn();
  render(<DialogNama judulAwal="x" saatSimpan={() => {}} saatBatal={saatBatal} />);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(saatBatal).toHaveBeenCalled();
});
