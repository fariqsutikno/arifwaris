import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jawabHalLain } from '../halLain';
import { isiBarisTetap, jawabKamu, slotTetap, tandaiDijawab } from '../isianBagian';
import type { Kasus } from '../kasus';
import { bagianLengkap, daftarBagian } from '../kelompok';
import { keadaanAwal, pengurangKeadaan, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { pilihKeadaan } from '../keadaanBaris';
import { terapkanKeadaan } from '../keadaanOrang';
import { Wizard } from '../layar/Wizard';
import { kasusBaru } from '../kasus';
import { keluargaKarto } from './fixtures/kanvas';

beforeEach(() => { localStorage.clear(); localStorage.setItem('arif-waris:tur:wizard', '1'); });

const denganHarta = (kasus: Kasus): Kasus => ({ ...kasus, pintu: 'baru', tirkah: { ...kasus.tirkah, kotor: 1_000_000n } });

/** Menjawab semua bagian: yang sudah berisi dipertahankan, yang kosong dijawab tidak ada; orang tua dan kakek-nenek diisi hidup. */
function lengkapi(awal: Kasus): Kasus {
  let kasus = awal;
  for (let putaran = 0; putaran < 30; putaran++) {
    const bagian = daftarBagian(kasus).find(satu => !bagianLengkap(kasus, satu));
    if (!bagian) return kasus;
    if (bagian.jenis === 'orangTua' || bagian.jenis === 'kakekNenek') {
      for (const kunci of slotTetap(kasus, bagian)) kasus = isiBarisTetap(kasus, bagian, kunci, 'hidup');
    } else if (bagian.jenis === 'halLain') kasus = jawabHalLain(kasus, bagian.milik, false);
    else if (bagian.jenis === 'kamu') kasus = jawabKamu(kasus, null);
    else if (bagian.jenis === 'urutan') kasus = { ...kasus, urutanDijawab: [...new Set([...(kasus.urutanDijawab ?? []), ...kasus.urutanWafat])] };
    else kasus = tandaiDijawab(kasus, bagian.milik, bagian.jenis, true);
  }
  throw new Error('tidak konvergen');
}
/** Kasus lengkap dengan Ibu "belum tahu". */
function kasusIbuBelumTahu(): Kasus {
  const lengkap = lengkapi(denganHarta(kasusBaru('L')));
  const ibu = Object.values(lengkap.graf.orang).find(o => o.id !== 'PEWARIS' && !o.penghubung && o.jenisKelamin === 'P')!.id;
  return lengkapi(pilihKeadaan(lengkap, ibu, 'belumTahu', 'PEWARIS'));
}

function Papan({ kasus, langkah = 4, paksa = false, saatKirim }: { kasus: Kasus; langkah?: number; paksa?: boolean; saatKirim?: (aksi: Aksi) => void }) {
  const [keadaan, setKeadaan] = useState<KeadaanAplikasi>(() => {
    // paksa: kasus belum lengkap tetap dibuka di Periksa, lewat jalur "Kembali ke Periksa" (dariPeriksa melepas batas langkah).
    const awal = paksa ? pengurangKeadaan(keadaanAwal(kasus, null), { jenis: 'KE_LANGKAH', langkah: 3, dariPeriksa: true }) : keadaanAwal(kasus, null);
    return pengurangKeadaan(awal, { jenis: 'KE_LANGKAH', langkah });
  });
  return <Wizard keadaan={keadaan} kirim={(aksi: Aksi) => { saatKirim?.(aksi); setKeadaan(k => pengurangKeadaan(k, aksi)); }} />;
}
const status = () => document.querySelector('.bar-bawah [role=status]')!.textContent;
const aksiUtama = () => document.querySelector('.bar-bawah-isi')!.lastElementChild as HTMLElement;

describe('Periksa nyata: status dan perpindahan ke Keluarga (rencana 4, tugas 4)', () => {
  it('"Lihat di Keluarga" membuka bagian orang itu dengan barisnya disorot; bar bawah "Kembali ke Periksa"', () => {
    render(<Papan kasus={kasusIbuBelumTahu()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lihat di Keluarga' }));
    expect(document.querySelector('.grup h2')!.textContent).toBe('Orang tua Almarhum');
    expect(document.activeElement?.id).toMatch(/^baris-/);
    expect(status()).toBe('Kamu sedang mengubah dari Periksa.');
    expect(aksiUtama().textContent).toBe('Kembali ke Periksa');
  });

  it('Kembali ke Periksa membuka langkah 4', () => {
    render(<Papan kasus={kasusIbuBelumTahu()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lihat di Keluarga' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke Periksa' }));
    expect(screen.getByRole('heading', { level: 2, name: /Belum dipastikan/ })).toBeTruthy();
  });

  it('jawaban yang menambah cabang mengarahkan ke Keluarga; Periksa menyebut keluarga belum lengkap dengan aksi ke bagian itu', () => {
    render(<Papan kasus={kasusIbuBelumTahu()} />);
    expect(status()).toBe('Ibu: belum dipastikan masih hidup atau tidak.');
    fireEvent.click(screen.getByRole('radio', { name: 'Wafat sesudah Almarhum' }));
    expect(status()).toMatch(/^Keluarga belum lengkap: .+\.$/);
    expect(aksiUtama().textContent).toBe('Lihat di Keluarga');
    fireEvent.click(aksiUtama());
    expect(status()).toBe('Kamu sedang mengubah dari Periksa.');
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke Periksa' }));
    expect(status()).toMatch(/^Keluarga belum lengkap/);
  });

  it('belum tahu: tidak ada "Hitung dengan kemungkinan"; status menyebut orangnya, aksi "Pastikan" menggulir ke kartunya', () => {
    render(<Papan kasus={kasusIbuBelumTahu()} />);
    expect(screen.queryByText('Hitung dengan kemungkinan')).toBeNull();
    expect(status()).toMatch(/: belum dipastikan masih hidup atau tidak\.$/);
    expect(aksiUtama().textContent).toBe('Pastikan');
    const kartu = document.querySelector<HTMLElement>('[id^=belum-keadaan-]')!;
    kartu.scrollIntoView = vi.fn();
    fireEvent.click(aksiUtama());
    expect(kartu.scrollIntoView).toHaveBeenCalled();
  });

  it('hilang (mafqud): tombol "Hitung dengan kemungkinan" tersedia dan membuka hasil', () => {
    const lengkap = lengkapi(denganHarta(kasusBaru('L')));
    const ibu = Object.values(lengkap.graf.orang).find(o => o.id !== 'PEWARIS' && !o.penghubung && o.jenisKelamin === 'P')!.id;
    const terkirim: Aksi[] = [];
    render(<Papan kasus={lengkapi(terapkanKeadaan(lengkap, ibu, { jenis: 'hilang' }))} saatKirim={aksi => terkirim.push(aksi)} />);
    expect(aksiUtama().textContent).toBe('Hitung dengan kemungkinan');
    fireEvent.click(aksiUtama());
    expect(terkirim).toContainEqual({ jenis: 'KE_LAYAR', layar: 'hasil' });
  });
});

describe('Periksa nyata dirangkai (rencana 4, tugas 7)', () => {
  it('urutan bagian: Belum dipastikan, Ada yang keliru?, Kisah, nama kasus', () => {
    render(<Papan kasus={kasusIbuBelumTahu()} />);
    const keliru = screen.getByText(/Ada yang keliru/);
    const kisah = screen.getByRole('heading', { level: 2, name: /Kisah harta/ });
    const belum = screen.getByRole('heading', { level: 2, name: /Belum dipastikan/ });
    const sesudah = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(sesudah(belum, keliru) && sesudah(keliru, kisah)).toBe(true);
  });

  it('Ada yang keliru? → Tahun atau urutan wafat → Budi: babak Budi terbuka dalam mode ubah', () => {
    const { kasus } = keluargaKarto();
    render(<Papan kasus={denganHarta(kasus)} paksa />);
    fireEvent.click(screen.getByRole('button', { name: /Ubah sesuatu/ }));
    fireEvent.click(screen.getByRole('button', { name: /Tahun atau urutan wafat/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Budi/ }));
    const idBudi = Object.values(kasus.graf.orang).find(o => o.nama === 'Budi')!.id;
    expect(document.querySelector(`#babak-${idBudi} .sunting-babak`)).toBeTruthy();
    expect(document.querySelectorAll('.sunting-babak')).toHaveLength(1);
  });
});
