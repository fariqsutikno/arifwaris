// Blok materi buku ringkas (F2): kedua contoh kit dirender lewat jalur pratinjau dev tanpa galat, nomor bagian jadi
// jangkar, dan blok yang menjalankan engine (peraga, simulasi) bereaksi pada pilihan pelajar.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Materi } from '../layar/belajar/Materi';

const tampilkan = (slug: string) => render(<Materi slug={`pratinjau-${slug}`} kasusSekarang={null} saatCoba={() => {}} />);

describe('blok materi baru', () => {
  it.each(['5-1-hajb', '6-2-aul'])('%s: semua blok terhitung, tanpa kartu galat', slug => {
    const { container } = tampilkan(slug);
    expect(container.querySelector('.kartu-galat')).toBeNull();
    expect(container.querySelector('.blok-alur')).not.toBeNull();
    expect(container.querySelector('#b-1')?.getAttribute('data-nomor')).toBe('01');
  });

  it('hajb: sub-bagian berjangkar 2b, peraga berganti keadaan, simulasi mengikuti centang', () => {
    const { container } = tampilkan('5-1-hajb');
    expect(container.querySelector('#b-2b .sub-nomor')?.textContent).toBe('2b');
    const peraga = container.querySelector('.peraga') as HTMLElement;
    expect(peraga.querySelector('.ket-peraga')?.textContent).toContain('Istri 1/4');
    fireEvent.click(within(peraga).getByRole('button', { name: 'Ada anak laki-laki' }));
    expect(peraga.querySelector('.ket-peraga')?.textContent).toContain('Istri 1/8');
    const simulasi = container.querySelector('.simulasi') as HTMLElement;
    const status = () => [...simulasi.querySelectorAll('.status-orang div')].map(baris => baris.textContent);
    expect(status().filter(teks => teks?.includes('gugur'))).toHaveLength(3);
    fireEvent.click(within(simulasi).getByRole('checkbox', { name: 'Ayah' }));
    expect(status().filter(teks => teks?.includes('gugur'))).toHaveLength(1);
  });

  it("aul: sebelum 'aul pecahan nash dan kotak meluap, sesudahnya penyebut 7", () => {
    const { container } = tampilkan('6-2-aul');
    const peraga = container.querySelector('.peraga') as HTMLElement;
    expect(peraga.querySelector('.ket-peraga')?.textContent).toContain('Suami 1/2');
    expect(peraga.querySelectorAll('.luap-peraga .kotak')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: "Terapkan 'aul" }));
    expect(peraga.querySelector('.ket-peraga')?.textContent).toContain('Suami 3/7');
    expect(peraga.querySelector('.luap-peraga')).toBeNull();
  });
});
