import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { jawabHalLain } from '../halLain';
import { isiBarisTetap, jawabAdaTidak, jawabKamu, slotTetap, tambahBaris } from '../isianBagian';
import { kasusBaru, type Kasus } from '../kasus';
import { bagianLengkap, daftarBagian } from '../kelompok';
import { keadaanAwal, pengurangKeadaan, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { Wizard } from '../layar/Wizard';
import { t } from '../terjemah';

beforeEach(() => { localStorage.clear(); localStorage.setItem('arif-waris:tur:wizard', '1'); });

const denganHarta = (kasus: Kasus): Kasus => ({ ...kasus, pintu: 'baru', tirkah: { ...kasus.tirkah, kotor: 1_000_000n } });

/** Menjawab semua bagian tanpa isi, kecuali Ayah dan Ibu hidup supaya ada ahli waris. */
function lengkapi(awal: Kasus): Kasus {
  let kasus = awal;
  for (let putaran = 0; putaran < 30; putaran++) {
    const bagian = daftarBagian(kasus).find(satu => !bagianLengkap(kasus, satu));
    if (!bagian) return kasus;
    const sebelum = kasus;
    if (bagian.jenis === 'orangTua' || bagian.jenis === 'kakekNenek') {
      for (const kunci of slotTetap(kasus, bagian)) kasus = isiBarisTetap(kasus, bagian, kunci, 'hidup');
    } else if (bagian.jenis === 'halLain') kasus = jawabHalLain(kasus, bagian.milik, false);
    else if (bagian.jenis === 'kamu') kasus = jawabKamu(kasus, null);
    else kasus = jawabAdaTidak(kasus, bagian, false);
    if (kasus === sebelum) throw new Error(`bagian ${bagian.id} tidak bisa dilengkapi`);
  }
  throw new Error('tidak konvergen');
}

function Papan({ kasus, langkah = 3 }: { kasus: Kasus; langkah?: number }) {
  const [keadaan, setKeadaan] = useState<KeadaanAplikasi>(() => pengurangKeadaan(keadaanAwal(kasus, null), { jenis: 'KE_LANGKAH', langkah }));
  return <Wizard keadaan={keadaan} kirim={(aksi: Aksi) => setKeadaan(k => pengurangKeadaan(k, aksi))} />;
}
const status = () => document.querySelector('.bar-bawah [role=status]')!.textContent;

describe('Wizard memakai kanvas untuk kasus nyata (spec kanvas 5, K1)', () => {
  it('nyata di langkah 3 merender kanvas (kartu Pasangan), bukan daftar jumlah', () => {
    render(<Papan kasus={denganHarta(kasusBaru('L'))} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Waktu almarhum wafat, apakah beliau punya istri?' })).toBeTruthy();
    expect(screen.queryByText(t('hitung.keluarga_inti'))).toBeNull();
    expect(status()).toMatch(/^Keluarga: \d+ bagian lagi\.$/);
  });

  it('latihan di langkah 3 tetap merender LangkahAhliWaris', () => {
    render(<Papan kasus={denganHarta(kasusBaru('L', 'latihan'))} />);
    expect(screen.getByText(t('hitung.keluarga_inti'))).toBeTruthy();
    expect(screen.queryByText(/punya istri/)).toBeNull();
  });

  it('Lanjut saat ada bagian kurang: tidak pindah, status menyebut sisa bagian, baris yang kurang ditandai dan difokuskan', () => {
    const pasangan = daftarBagian(kasusBaru('L'))[0]!;
    render(<Papan kasus={denganHarta(tambahBaris(kasusBaru('L'), pasangan, 'ISTRI'))} />);
    fireEvent.click(screen.getByRole('button', { name: /Lanjut: Periksa/ }));
    expect(status()).toMatch(/^Masih \d+ bagian, lanjutkan dari Istri\.$/);
    expect(document.querySelector('.grup h2')!.textContent).toBe('Waktu almarhum wafat, apakah beliau punya istri?');
    const baris = document.querySelector('[data-baris-orang]') as HTMLElement;
    expect(baris.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(baris);
  });

  it('semua bagian lengkap: Lanjut membuka Periksa', () => {
    render(<Papan kasus={lengkapi(denganHarta(kasusBaru('L')))} />);
    expect(status()).toBe('Keluarga sudah lengkap.');
    fireEvent.click(screen.getByRole('button', { name: /Lanjut: Periksa/ }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(t('hitung.periksa_pertanyaan'));
  });

  it('Periksa nyata tidak menampilkan LangkahKondisi', () => {
    render(<Papan kasus={lengkapi(denganHarta(kasusBaru('L')))} langkah={4} />);
    expect(screen.queryByText(t('hitung.kondisi_tanya_baru'))).toBeNull();
  });
});
