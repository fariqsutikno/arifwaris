import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KejadianPercobaan } from '@waris/latihan';
import { buatMemori, buatMemoriPengguna } from '@waris/data';
import { antre, aturAkunLokal, bacaAntrean, kirimAntrean } from '../akun/antrean';
import { gabung } from '../akun/gabung';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { Hasil } from '../layar/Hasil';
import { BATAS_PERCOBAAN_LOKAL, bacaPercobaan, catatPercobaan } from '../percobaan';
import { bacaProgresLatihan, catatLatihan } from '../progres';

const kejadian = (id: string, lain: Partial<KejadianPercobaan> = {}): KejadianPercobaan => ({
  id, idSesiSoal: 's1', soalId: 'H-01', revisiSoal: 'r1', jenisSoal: 'biasa', mode: 'latihan', konteks: { jenis: 'mandiri' }, aksi: 'periksa',
  isian: null, jangkar: null, hasilKolom: null, benarSemua: false, dimulaiPada: '2026-11-20T00:00:00.000Z',
  versi: { engine: 'abc1234', ruleset: 'syafii', madzhab: 'bawaan', kunci: '' }, ...lain,
});

beforeEach(() => { localStorage.clear(); aturAkunLokal(null); });

describe('penyimpanan kejadian lokal', () => {
  it('menambah di akhir; batas 500 membuang yang tertua', () => {
    for (let urut = 0; urut < BATAS_PERCOBAAN_LOKAL + 2; urut++) catatPercobaan(kejadian(`k${urut}`));
    const daftar = bacaPercobaan();
    expect(daftar).toHaveLength(BATAS_PERCOBAAN_LOKAL);
    expect(daftar[0]!.id).toBe('k2');
    expect(daftar.at(-1)!.id).toBe(`k${BATAS_PERCOBAAN_LOKAL + 1}`);
  });
});

describe('antrean percobaan', () => {
  it('berkunci id sendiri (tidak menimpa), dibatasi 500, dan dilewati pengirim sampai tabel server ada', async () => {
    aturAkunLokal('u');
    for (let urut = 0; urut < BATAS_PERCOBAAN_LOKAL + 3; urut++) antre({ tabel: 'percobaan', baris: kejadian(`k${urut}`) });
    antre({ tabel: 'kegiatan', baris: { id: 'g1', jenis: 'soal', slug: 'H-01', benar: true } });
    const antrean = bacaAntrean();
    expect(antrean.filter(entri => entri.tabel === 'percobaan')).toHaveLength(BATAS_PERCOBAAN_LOKAL);
    expect((antrean.find(entri => entri.tabel === 'percobaan') as { baris: { id: string } }).baris.id).toBe('k3');
    const { pengguna } = buatMemoriPengguna(buatMemori({ sesi: { userId: 'u', email: 'u@tes.local' } }));
    expect(await kirimAntrean(pengguna)).toBe(BATAS_PERCOBAAN_LOKAL); // kegiatan terkirim, percobaan menunggu
    expect(bacaAntrean().every(entri => entri.tabel === 'percobaan')).toBe(true);
  });
});

describe('gabung saat login', () => {
  it('kejadian digabung per id: dua perangkat tidak menggandakan', () => {
    const kosong = { tersimpan: [], belajar: [], latihan: [], preferensi: null };
    const { hasil, kirim } = gabung({ ...kosong, percobaan: [kejadian('a'), kejadian('b')] }, { ...kosong, percobaan: [kejadian('b'), kejadian('c')] });
    expect(hasil.percobaan!.map(k => k.id).sort()).toEqual(['a', 'b', 'c']);
    expect(kirim.filter(entri => entri.tabel === 'percobaan').map(entri => (entri as { baris: { id: string } }).baris.id)).toEqual(['a']);
  });
});

describe('benar tidak mundur (T3)', () => {
  it('benar lalu salah → tetap benar; jumlah coba bertambah', () => {
    catatLatihan('hitung', 'H-01', true, null);
    catatLatihan('hitung', 'H-01', false, null);
    expect(bacaProgresLatihan('hitung')['H-01']).toMatchObject({ benar: true, jumlahCoba: 2 });
  });
});

const c1601 = (): Kasus => {
  const dasar = kasusBaru('L');
  return { ...dasar, tirkah: { kotor: 24_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, graf: ['ISTRI', 'ANAK_LK', 'ANAK_PR'].reduce((graf, kunci) => tambahAhliWaris(graf, 'PEWARIS', kunci as 'ISTRI'), dasar.graf) };
};
function Uji({ awal, saatDikerjakan }: { awal: Kasus; saatDikerjakan?: (benar: boolean) => void }) {
  const [kasus] = useState(awal);
  return <Hasil kasus={kasus} idSesi="s" tujuan="belajar" kirim={(_: Aksi) => {}} saatDikerjakan={saatDikerjakan} tanpaSimpan terkunci
    soal={{ id: 'H-99', revisiId: 'rev-1' }} />;
}
const bukaLewatDialog = () => {
  vi.useFakeTimers();
  fireEvent.pointerDown(within(screen.getByRole('alertdialog')).getByRole('button', { name: /Tahan untuk buka/ }));
  act(() => { vi.advanceTimersByTime(1300); });
  vi.useRealTimers();
};

describe('Hasil mencatat kejadian percobaan soal latihan', () => {
  it('buka sekali; Periksa yang belum lengkap bukan kejadian; Periksa benar membawa isian, jangkar, hasil semua kolom, versi', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<Uji awal={c1601()} />);
    await waitFor(() => expect(bacaPercobaan().map(k => k.aksi)).toEqual(['buka']));
    fireEvent.click(screen.getByRole('button', { name: 'Periksa' }));
    expect(bacaPercobaan()).toHaveLength(1);
    const pilih = (nama: string, nilai: string) => fireEvent.change(screen.getByRole('combobox', { name: `Bagian ${nama}` }), { target: { value: nilai } });
    const ketik = (nama: string, nilai: string) => fireEvent.change(screen.getByRole('textbox', { name: nama }), { target: { value: nilai } });
    pilih('Istri', '1/8'); pilih('Anak laki-laki', 'Ashabah'); pilih('Anak perempuan', 'Ashabah');
    ketik('Asal masalah', '8'); ketik('Asal masalah bersama', '7'); ketik('Asal masalah akhir', '24');
    ketik('Asal masalah akhir Istri', '3'); ketik('Asal masalah akhir Anak laki-laki', '14'); ketik('Asal masalah akhir Anak perempuan', '7');
    fireEvent.click(screen.getByRole('button', { name: 'Periksa' }));
    const [buka, periksa] = bacaPercobaan() as [KejadianPercobaan, KejadianPercobaan];
    expect(buka).toMatchObject({ soalId: 'H-99', revisiSoal: 'rev-1', jenisSoal: 'biasa', mode: 'latihan', konteks: { jenis: 'mandiri' }, isian: null });
    expect(buka.versi.kunci).toMatch(/^[0-9a-f]{16}$/);
    expect(periksa).toMatchObject({ aksi: 'periksa', benarSemua: true, idSesiSoal: buka.idSesiSoal, jangkar: { idBaris: expect.any(String), idKolom: 'ashl' } });
    expect(periksa.hasilKolom!.every(kolom => kolom.status === 'benar')).toBe(true);
    expect(periksa.isian!.kepala).toMatchObject({ ashl: '8', akhir: '24' });
    expect(periksa.versi.engine).toBeTruthy();
    vi.restoreAllMocks();
  });

  it('Lihat jawaban tanpa pernah mencoba tetap tercatat, tanpa menghitung dikerjakan', async () => {
    const dikerjakan: boolean[] = [];
    render(<Uji awal={c1601()} saatDikerjakan={benar => dikerjakan.push(benar)} />);
    await waitFor(() => expect(bacaPercobaan()).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
    bukaLewatDialog();
    expect(dikerjakan).toEqual([]);
    expect(bacaPercobaan().map(k => k.aksi)).toEqual(['buka', 'lihatJawaban']);
    expect(bacaPercobaan()[1]!.hasilKolom).not.toBeNull();
  });
});

describe('kartu tebak lama', () => {
  it('soal yang belum bertabel: satu kejadian tanpa isian per percobaan', async () => {
    // KB 14.6 #3: kerabat yang kalah jihah belum punya tabel latihan (tanzil biasa dan munasakhat sudah).
    const orang = (id: string, jenisKelamin: 'L' | 'P', lain: object = {}) => ({ id, jenisKelamin, statusHidup: 'hidup' as const, agama: 'islam' as const, ...lain });
    const wafat = { statusHidup: 'wafat' as const, penghubung: true };
    const munasakhat: Kasus = { ...kasusBaru('L'), tirkah: { kotor: 90_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, graf: {
      idPewaris: 'D', pernikahan: [], orang: {
        D: orang('D', 'L', { statusHidup: 'wafat' }),
        AP: orang('AP', 'P', { ...wafat, idAyah: 'D' }), APP: orang('APP', 'P', { ...wafat, idIbu: 'AP' }), X1: orang('X1', 'P', { idIbu: 'APP' }),
        S: orang('S', 'L', { ...wafat, idAyah: 'D' }), SS: orang('SS', 'L', { ...wafat, idAyah: 'S' }), SSD: orang('SSD', 'P', { ...wafat, idAyah: 'SS' }),
        X2: orang('X2', 'P', { idIbu: 'SSD' }),
      } } };
    render(<Uji awal={munasakhat} />);
    await waitFor(() => expect(bacaPercobaan().map(k => k.aksi)).toEqual(['buka']));
    expect(bacaPercobaan()[0]).toMatchObject({ jenisSoal: 'dzawilArham' });
    for (const kotak of document.querySelectorAll('.isian-tebak input')) fireEvent.change(kotak, { target: { value: '1/2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Jawab' }));
    await waitFor(() => expect(bacaPercobaan().map(k => k.aksi)).toEqual(['buka', 'periksa']));
    expect(bacaPercobaan()[1]).toMatchObject({ isian: null, hasilKolom: null, benarSemua: false });
  });
});
