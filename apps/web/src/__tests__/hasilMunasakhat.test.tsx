import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { jalankan, type HasilMunasakhatOk } from '../jalankan';
import { kasusBaru, type Kasus } from '../kasus';
import { Hasil } from '../layar/Hasil';
import { rantaiMunasakhat } from '../hasil/munasakhat';

const HARTA = 300_000_000n;

/** Pewaris: istri, anak lk (Budi), anak pr (Siti). Budi wafat sebelum pembagian, meninggalkan istri dan anak pr. */
function kasusBerlapis(): Kasus {
  const awal = kasusBaru('L');
  let graf = ['ISTRI', 'ANAK_LK', 'ANAK_PR'].reduce((g, kunci) => tambahAhliWaris(g, 'PEWARIS', kunci as 'ISTRI'), awal.graf);
  const idBudi = hitungIsian(graf, 'PEWARIS').ANAK_LK![0]!;
  // Seperti di aplikasi: mayit munasakhat tetap 'hidup' di graf dan dicatat di urutanWafat (rapikanKeadaan).
  graf = { ...graf, orang: { ...graf.orang, [idBudi]: { ...graf.orang[idBudi]!, nama: 'Budi' } } };
  graf = tambahAhliWaris(tambahAhliWaris(graf, idBudi, 'ISTRI'), idBudi, 'ANAK_PR');
  return { ...awal, graf, urutanWafat: [idBudi], tirkah: { kotor: HARTA, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
}

describe('hasil munasakhat', () => {
  it('rantai: kolom jami\'ah terakhir sama dengan engine, harta mengalir ke mayit kedua lalu diteruskan', () => {
    const kasus = kasusBerlapis();
    const tampil = jalankan(kasus);
    expect(tampil.jenis).toBe('munasakhat');
    const hasil = (tampil as { hasil: HasilMunasakhatOk }).hasil;
    expect(hasil.status).toBe('OK');
    const rantai = rantaiMunasakhat(hasil, HARTA, 1n);
    const idBudi = kasus.urutanWafat[0]!;
    expect(rantai.map(langkah => langkah.mayit)).toEqual(['PEWARIS', idBudi]);
    expect(rantai[0]!.nominalMasuk).toBe(HARTA);
    const keBudi = rantai[0]!.daftarBagian.find(bagian => bagian.id === idBudi)!;
    expect(keBudi.diteruskanDiLangkah).toBe(2);
    expect(rantai[1]!.nominalMasuk).toBe(keBudi.nominal);
    expect(rantai[1]!.dari).toEqual(['PEWARIS']);
    // Jumlah yang dibagikan di langkah Budi tidak melebihi yang masuk kepadanya.
    expect(rantai[1]!.daftarBagian.reduce((jumlah, bagian) => jumlah + bagian.nominal, 0n)).toBeLessThanOrEqual(rantai[1]!.nominalMasuk);
  });

  it('layar: yang dibagi sekarang, meninggal sebelum dibagi, urutan pembagian, tabel munasakhat', () => {
    render(<Hasil kasus={kasusBerlapis()} idSesi="uji-munasakhat" tujuan="hitung" kirim={() => {}} />);
    expect(screen.getByText(/Yang dibagi sekarang/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Meninggal sebelum dibagi/ })).toBeTruthy();
    const urutan = screen.getByRole('region', { name: 'Urutan pembagian' });
    fireEvent.click(within(urutan).getByRole('button', { name: /^2\. Budi/ }));
    expect(within(urutan).getByRole('heading', { name: /Budi .*meninggal/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tabel munasakhat' })).toBeTruthy();
    expect(screen.getAllByText(/Jami'ah akhir/).length).toBeGreaterThan(0);
  });
});
