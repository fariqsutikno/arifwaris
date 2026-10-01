import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { dariJson, kasusBaru, keJson, type Kasus } from '../kasus';
import { jalankan } from '../jalankan';
import { cobaRingkas } from '../hasil/ringkasan';
import { aturMadzhab, bandingkanMadzhab, bersihkanSel, madzhabKasus, namaMadzhab } from '../madzhab';
import { ModalBandingMadzhab } from '../hasil/ModalBandingMadzhab';
import { CeritaKasus } from '../layar/PeriksaCerita';

const dengan = (jenis: 'L' | 'P', ...kunci: Array<Parameters<typeof tambahAhliWaris>[2]>): Kasus => {
  const k = kasusBaru(jenis);
  const isi = kunci.reduce((kini, x) => ({ ...kini, graf: tambahAhliWaris(kini.graf, 'PEWARIS', x) }), k);
  return { ...isi, tirkah: { ...isi.tirkah, kotor: 600_000_000n } };
};
const biasa = () => dengan('L', 'ISTRI', 'ANAK_LK', 'ANAK_PR');
const kakekDanSaudara = () => dengan('L', 'KAKEK', 'SAUDARA_KANDUNG', 'SAUDARI_KANDUNG');   // titik khilaf kakek vs saudara (K05-1)
const duaNenek = () => dengan('L', 'NENEK_DARI_AYAH', 'NENEK_DARI_IBU', 'ANAK_PR');           // aturan yang belum dikaji untuk madzhab lain

describe('madzhab di Kasus', () => {
  it('Syafi\'i adalah bawaan dan tidak ditulis ke Kasus; madzhab lain tersimpan dan terbaca ulang', () => {
    const k = aturMadzhab(biasa(), 'hanafi');
    expect(madzhabKasus(biasa())).toBe('syafii');
    expect(madzhabKasus(k)).toBe('hanafi');
    expect('ruleset' in aturMadzhab(k, 'syafii')).toBe(false);
    const balik = dariJson(keJson(k));
    expect(balik.berhasil && madzhabKasus(balik.kasus)).toBe('hanafi');
  });
  it('file dengan madzhab tak dikenal ditolak', () => {
    const rusak = JSON.parse(keJson(biasa()));
    rusak.ruleset = 'wahabi';
    expect(dariJson(JSON.stringify(rusak)).berhasil).toBe(false);
  });
  it('jalankan memakai madzhab kasus (kakek + saudara berbeda menurut Hanafi)', () => {
    const hasil = (k: Kasus) => cobaRingkas(k, jalankan(k))!.penerima.map(o => [o.id, o.nominal]);
    expect(hasil(kakekDanSaudara())).not.toEqual(hasil(aturMadzhab(kakekDanSaudara(), 'hanafi')));
  });
});

describe('bandingkanMadzhab', () => {
  it('kasus yang disepakati keempat madzhab: tidak ada tautan perbandingan', () => {
    const banding = bandingkanMadzhab(biasa());
    expect(banding.hasil.map(h => h.kondisi)).toEqual(['ok', 'ok', 'ok', 'ok']);
    expect(banding.beda).toBe(false);
    expect(banding.baris.size).toBe(0);
  });
  it('kakek bersama saudara: baris yang berbeda ditandai, madzhab sekarang tetap Syafi\'i', () => {
    const banding = bandingkanMadzhab(kakekDanSaudara());
    expect(banding.sekarang).toBe('syafii');
    expect(banding.beda).toBe(true);
    expect(banding.baris.size).toBeGreaterThan(0);
    const hanafi = banding.hasil.find(h => h.ruleset === 'hanafi')!;
    const syafii = banding.hasil.find(h => h.ruleset === 'syafii')!;
    expect(hanafi.bagian).not.toEqual(syafii.bagian);
    // jumlah tiap madzhab sama dengan harta (tidak ada yang hilang)
    for (const h of banding.hasil) expect(Object.values(h.bagian).reduce((a, b) => a + b, 0n)).toBe(600_000_000n);
  });
  it('madzhab yang belum dikaji untuk kasus itu tidak diberi angka', () => {
    const banding = bandingkanMadzhab(duaNenek());
    const lain = banding.hasil.filter(h => h.ruleset !== 'syafii');
    expect(lain.every(h => h.kondisi === 'belumDikaji' && Object.keys(h.bagian).length === 0)).toBe(true);
    expect(banding.beda).toBe(true);
  });
  it('bersihkanSel: notasi internal jadi bahasa biasa, tautan arsip dibuang, kutipan tetap', () => {
    expect(bersihkanSel("= [SYF] — muqasamah (Mughni 6/309 · shamela:8463/2631 shamela:8463/2635)")).toBe("Sama dengan Syafi'i — muqasamah (Mughni 6/309)");
    expect(bersihkanSel('kakek = ayah, menghijab saudara (Mabsuth 29/180 · shamela:5423/5937)')).toBe('kakek = ayah, menghijab saudara (Mabsuth 29/180)');
  });
});

describe('antarmuka madzhab', () => {
  it('Periksa: "ganti" membuka pilihan, memilih Hanafi mengubah kasus', () => {
    let terakhir: Kasus = biasa();
    function Uji() {
      const [kasus, setKasus] = useState(biasa());
      terakhir = kasus;
      return <CeritaKasus kasus={kasus} kirim={aksi => { if (aksi.jenis === 'UBAH_KASUS') setKasus(aksi.ubah); }} />;
    }
    render(<Uji />);
    expect(screen.getByText(/Dihitung menurut madzhab Syafi'i/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'ganti' }));
    const dialog = screen.getByRole('dialog', { name: /Hitung menurut madzhab apa/ });
    expect(within(dialog).getByRole('radio', { name: /Syafi'i/ }).getAttribute('aria-checked')).toBe('true');
    expect(within(dialog).getByText('Diperiksa sampai kitab rujukan utama.')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('radio', { name: /Hanafi/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Pakai' }));
    expect(madzhabKasus(terakhir)).toBe('hanafi');
    expect(screen.getByText(/Dihitung menurut madzhab Hanafi/)).toBeTruthy();
  });
  it('panel perbandingan: kolom tiap madzhab, baris berbeda ditandai, "Pakai madzhab ini" memilih', () => {
    const banding = bandingkanMadzhab(kakekDanSaudara());
    const dipakai: string[] = [];
    render(<ModalBandingMadzhab perbandingan={banding} saatTutup={() => {}} saatPakai={r => dipakai.push(r)} />);
    const tabel = screen.getByRole('table');
    for (const nama of ['Syafi\'i', 'Hanbali', 'Hanafi', 'Maliki']) expect(within(tabel).getByRole('columnheader', { name: new RegExp(nama) })).toBeTruthy();
    expect(tabel.querySelectorAll('tr.beda').length).toBe(banding.baris.size);
    fireEvent.click(screen.getByRole('button', { name: /Pakai madzhab ini Hanafi/ }));
    expect(dipakai).toEqual(['hanafi']);
    expect(namaMadzhab('hanafi')).toBe('Hanafi');
  });
  it('panel perbandingan: madzhab yang belum dikaji ditulis jujur, tanpa angka', () => {
    render(<ModalBandingMadzhab perbandingan={bandingkanMadzhab(duaNenek())} saatTutup={() => {}} saatPakai={() => {}} />);
    expect(screen.getAllByText('Belum dikaji untuk kasus ini').length).toBe(3);
    expect(screen.queryByRole('button', { name: /Pakai madzhab ini/ })).toBeNull();
  });
});
