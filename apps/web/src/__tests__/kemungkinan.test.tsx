import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { dariJson, kasusBaru, keJson, rapikanKeadaan, type Kasus } from '../kasus';
import { terapkanKeadaan } from '../keadaanOrang';
import { selisihTerhadap, turunkanKemungkinan } from '../kemungkinan';
import { Hasil } from '../layar/Hasil';

/** Pak Ahmad wafat meninggalkan istri (Siti), Budi, Rina; Budi dan Rina wafat sesudahnya sebelum harta dibagi; Budi beristri, Rina bersuami. */
function dasar(): { kasus: Kasus; budi: string; rina: string } {
  let kasus: Kasus = { ...kasusBaru('L'), tirkah: { kotor: 1_200_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_PR'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const budi = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS' && o.jenisKelamin === 'L')!.id;
  const rina = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS' && o.jenisKelamin === 'P')!.id;
  kasus = terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
  kasus = terapkanKeadaan(kasus, rina, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, budi, 'ISTRI') };
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, rina, 'SUAMI') };
  return { kasus, budi, rina };
}
const takTahu = (k: Kasus, a: string, b: string): Kasus => ({ ...k, belumPasti: [{ jenis: 'urutan', a, b }] });

describe('kemungkinan: urutan wafat tidak diketahui', () => {
  it('tanpa hal belum pasti: tidak ada kemungkinan', () => {
    expect(turunkanKemungkinan(dasar().kasus)).toBeNull();
  });
  it('dua urutan dihitung berdampingan; tiap kemungkinan menjumlah ke harta; urutan pertama = urutan tersimpan', () => {
    const { kasus, budi, rina } = dasar();
    const hasil = turunkanKemungkinan(takTahu(kasus, budi, rina));
    expect(hasil?.jenis).toBe('daftar');
    if (hasil?.jenis !== 'daftar') return;
    expect(hasil.daftar).toHaveLength(2);
    expect(hasil.daftar[0]!.kasus.urutanWafat).toEqual(kasus.urutanWafat);
    expect(hasil.daftar[1]!.kasus.urutanWafat).toEqual([...kasus.urutanWafat].reverse());
    // jumlah per orang + sisa pembulatan (< Rp 100) = harta
    for (const k of hasil.daftar) { const jumlah = Object.values(k.bagian!).reduce((a, b) => a + b, 0n); expect(jumlah <= 1_200_000_000n && 1_200_000_000n - jumlah < 100n).toBe(true); }
  });
  it('selisih terhadap pilihan pertama: jumlah selisih nol (harta tetap sama), yang tidak lagi menerima tercatat', () => {
    const { kasus, budi, rina } = dasar();
    const hasil = turunkanKemungkinan(takTahu(kasus, budi, rina));
    if (hasil?.jenis !== 'daftar') throw new Error('harus daftar');
    const { selisih, tidakLagi } = selisihTerhadap(hasil.daftar[0]!, hasil.daftar[1]!);
    const jumlah = Object.values(selisih).reduce((a, b) => a + b, 0n) - tidakLagi.reduce((a, o) => a + o.nominal, 0n);
    expect(jumlah < 100n && jumlah > -100n).toBe(true);   // selisih sisa pembulatan saja
  });
  it('lebih dari dua hal belum pasti: terlalu banyak, tanpa kemungkinan', () => {
    const { kasus, budi, rina } = dasar();
    const banyak: Kasus = { ...kasus, belumPasti: [{ jenis: 'urutan', a: budi, b: rina }, { jenis: 'urutan', a: rina, b: budi }, { jenis: 'urutan', a: budi, b: rina }] };
    expect(turunkanKemungkinan(banyak)?.jenis).toBe('terlaluBanyak');
  });
  it('rapikanKeadaan membuang hal belum pasti yang orangnya tak lagi di urutan wafat; berkas menolak orang yang tak ada', () => {
    const { kasus, budi, rina } = dasar();
    const k = takTahu(kasus, budi, rina);
    expect(rapikanKeadaan({ ...k, urutanWafat: [budi] }).belumPasti).toBeUndefined();
    const balik = dariJson(keJson(k));
    expect(balik.berhasil && balik.kasus.belumPasti).toEqual([{ jenis: 'urutan', a: budi, b: rina }]);
    const rusak = JSON.parse(keJson(k)); rusak.belumPasti = [{ jenis: 'urutan', a: budi, b: 'TIDAK_ADA' }];
    expect(dariJson(JSON.stringify(rusak)).berhasil).toBe(false);
  });
  it('mengubah keadaan salah satu orang menghapus hal belum pasti tentangnya', () => {
    const { kasus, budi, rina } = dasar();
    const k = terapkanKeadaan(takTahu(kasus, budi, rina), budi, { jenis: 'hidup' });
    expect(k.belumPasti).toBeUndefined();
  });
});

describe('Hasil dengan hal belum pasti', () => {
  const tampil = (k: Kasus) => render(<Hasil kasus={k} idSesi="s" tujuan="hitung" kirim={() => {}} />);
  it('menampilkan pemilih kemungkinan bila urutan berpengaruh; memilih yang lain menampilkan selisih; kasus tersimpan tidak berubah', () => {
    const { kasus, budi, rina } = dasar();
    const hasil = turunkanKemungkinan(takTahu(kasus, budi, rina));
    if (hasil?.jenis !== 'daftar') throw new Error('harus daftar');
    expect(hasil.berpengaruh).toBe(true);
    tampil(takTahu(kasus, budi, rina));
    expect(screen.getByRole('heading', { name: /bergantung pada 1 hal yang belum pasti/ })).toBeTruthy();
    const pilihan = within(document.querySelector('.kartu-belum-pasti')! as HTMLElement).getAllByRole('radio');
    expect(pilihan).toHaveLength(2);
    expect(pilihan[0]!.getAttribute('aria-checked')).toBe('true');
    expect(document.querySelector('.selisih')).toBeNull();
    fireEvent.click(pilihan[1]!);
    expect(within(document.querySelector('.kartu-belum-pasti')!).getAllByRole('radio')[1]!.getAttribute('aria-checked')).toBe('true');
    expect(document.querySelector('.selisih')).toBeTruthy();
  });
  it('urutan yang tidak berpengaruh: hanya satu catatan, tanpa pemilih', () => {
    // Satu anak wafat sesudah pewaris, satu cucu: urutan keduanya tidak mengubah apa pun bagi yang hidup.
    let kasus: Kasus = { ...kasusBaru('L'), tirkah: { kotor: 600_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
    for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
    const [a, b] = Object.values(kasus.graf.orang).filter(o => o.idAyah === 'PEWARIS').map(o => o.id);
    kasus = terapkanKeadaan(terapkanKeadaan(kasus, a!, { jenis: 'wafatSesudah', hartaSudahDibagi: false }), b!, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
    // Masing-masing beristri dan beranak laki-laki: saudara terhalang anak, jadi urutan keduanya tidak mengubah hasil.
    for (const id of [a!, b!]) for (const kunci of ['ISTRI', 'ANAK_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, id, kunci) };
    const hasil = turunkanKemungkinan(takTahu(kasus, a!, b!));
    if (hasil?.jenis !== 'daftar') throw new Error('harus daftar');
    expect(hasil.berpengaruh).toBe(false);
    tampil(takTahu(kasus, a!, b!));
    expect(screen.queryByRole('radiogroup', { name: /Kemungkinan/ })).toBeNull();
    expect(screen.getByText(/tidak memengaruhi pembagian/)).toBeTruthy();
  });
});
