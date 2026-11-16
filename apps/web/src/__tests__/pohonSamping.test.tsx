import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { IdOrang } from '@waris/engine';
import { rapikanKeadaan, type Kasus } from '../kasus';
import { KanvasKeluarga } from '../layar/keluarga/KanvasKeluarga';
import { PanggungPohon } from '../layar/wizard/PanggungPohon';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { keluargaKarto } from './fixtures/kanvas';

describe('pohon samping langkah Keluarga (spec kanvas 5.11, 8)', () => {
  it('mengetuk simpul memanggil saatPilihOrang dan tidak membuka menu tambah', () => {
    const { kasus, budi } = keluargaKarto();
    const saatPilihOrang = vi.fn();
    render(<PanggungPohon kasus={kasus} saatPilihOrang={saatPilihOrang} />);
    fireEvent.click(screen.getByRole('button', { name: /^Ke baris Budi/ }));
    expect(saatPilihOrang).toHaveBeenCalledWith(budi);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.queryByText(/Tambah mertua/)).toBeNull();
  });

  it('label tombol simpul menyebut baris, bukan "Buka menu"', () => {
    const { kasus } = keluargaKarto();
    render(<PanggungPohon kasus={kasus} saatPilihOrang={() => undefined} />);
    const label = screen.getAllByRole('button').map(tombol => tombol.getAttribute('aria-label')).filter(Boolean);
    expect(label.some(nama => nama!.startsWith('Ke baris '))).toBe(true);
    expect(label.some(nama => nama!.startsWith('Buka menu'))).toBe(false);
  });

  it('mengetuk simpul orang di bagian yang sudah selesai membuka bagian itu dan menyorot barisnya', () => {
    const { kasus, rina } = keluargaKarto();
    let ketukan = 0;
    function Papan() {
      const [k, setK] = useState<Kasus>({ ...kasus, kelompokDijawab: { PEWARIS: ['pasangan', 'anak'] } });
      const [fokus, setFokus] = useState<{ id: IdOrang; kali: number }>();
      return (
        <>
          <button type="button" onClick={() => setFokus({ id: rina, kali: ++ketukan })}>ketuk</button>
          <KanvasKeluarga kasus={k} ubah={f => setK(x => rapikanKeadaan(f(x)))} tandaiKurang={false} saatSelesai={() => undefined}
            {...(fokus ? { fokusOrang: fokus } : {})} />
        </>
      );
    }
    render(<Papan />);
    expect(document.querySelector('.grup h2')!.textContent).toBe('Orang tua almarhum');   // bagian pertama yang belum lengkap
    fireEvent.click(screen.getByRole('button', { name: 'ketuk' }));
    expect(document.querySelector('.grup h2')!.textContent).toBe('Almarhum punya anak? Hitung juga yang sudah wafat.');
    const baris = document.getElementById(`baris-${rina}`)!;
    expect(baris.className).toContain('sorot-baris');
    expect(document.activeElement).toBe(baris);
  });

  it('simpul belum tahu, wafat, dan pemilik memakai kelas berbeda', () => {
    const { kasus, rina, slamet } = keluargaKarto();
    const grafBelumTahu = { ...kasus.graf, orang: { ...kasus.graf.orang, [rina]: { ...kasus.graf.orang[rina]!, statusHidup: 'tidakDiketahui' as const } } };
    const { container } = render(<PanggungPohon kasus={{ ...kasus, graf: grafBelumTahu }} saatPilihOrang={() => undefined} />);
    expect(container.querySelector(`[data-orang="${rina}"]`)!.className).toContain('simpul-belum-pasti');
    expect(container.querySelector(`[data-orang="${slamet}"]`)!.className).toContain('simpul-wafat');
    expect(container.querySelector('[data-orang="PEWARIS"]')!.className).toContain('simpul-pemilik');
  });

  it('penghubung dan pewaris bukan tombol (tidak ada tombol nonaktif, tidak ada "Ke baris almarhum")', () => {
    const dasar = kasusBaru('L');
    const kasus = { ...dasar, graf: tambahAhliWaris(dasar.graf, 'PEWARIS', 'PAMAN_KANDUNG') };
    const { container } = render(<PanggungPohon kasus={kasus} saatPilihOrang={() => undefined} />);
    expect(container.querySelector('.node-orang.penghubung')).toBeTruthy();
    expect(container.querySelector('.node-orang.penghubung')!.tagName).toBe('DIV');
    expect(screen.getAllByRole('button').filter(tombol => (tombol as HTMLButtonElement).disabled)).toEqual([]);
    expect(screen.queryByRole('button', { name: /Ke baris almarhum/ })).toBeNull();
    expect(container.querySelector('[data-orang="PEWARIS"]')!.tagName).toBe('DIV');
  });
});
