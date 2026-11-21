import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KejadianPercobaan } from '@waris/latihan';
import { buatMemori, buatMemoriPengguna } from '@waris/data';
import { antre, aturAkunLokal, bacaAntrean, bacaAntreanGagal, kirimAntrean } from '../akun/antrean';
import { GalatPercobaan } from '@waris/data';
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
  it('berkunci id sendiri (tidak menimpa) dan dibatasi 500', () => {
    aturAkunLokal('u');
    for (let urut = 0; urut < BATAS_PERCOBAAN_LOKAL + 3; urut++) antre({ tabel: 'percobaan', baris: kejadian(`k${urut}`) });
    const antrean = bacaAntrean();
    expect(antrean.filter(entri => entri.tabel === 'percobaan')).toHaveLength(BATAS_PERCOBAAN_LOKAL);
    expect((antrean.find(entri => entri.tabel === 'percobaan') as { baris: { id: string } }).baris.id).toBe('k3');
  });

  it('terkirim berurutan ke server tanpa hasil/benar dari klien', async () => {
    aturAkunLokal('u');
    antre({ tabel: 'percobaan', baris: kejadian('k1', { benarSemua: true, hasilKolom: [], aksi: 'periksa', isian: { kepala: {}, sel: {} } }) });
    const { pengguna } = buatMemoriPengguna(buatMemori({ sesi: { userId: 'u', email: 'u@tes.local' } }));
    const kirim = vi.spyOn(pengguna, 'kirimPercobaan');
    expect(await kirimAntrean(pengguna)).toBe(0);
    expect(Object.keys(kirim.mock.calls[0]![0]).sort()).toEqual(['aksi', 'dimulaiPada', 'id', 'idSesiSoal', 'isian', 'jangkar', 'mode', 'revisiSoal', 'soalId']);
  });

  it('entri racun (400/409) pindah ke antrean-gagal dan tidak menyumbat; 429/jaringan tetap menunggu', async () => {
    aturAkunLokal('u');
    antre({ tabel: 'percobaan', baris: kejadian('racun') });
    antre({ tabel: 'percobaan', baris: kejadian('sehat') });
    const { pengguna } = buatMemoriPengguna(buatMemori({ sesi: { userId: 'u', email: 'u@tes.local' } }));
    const asli = pengguna.kirimPercobaan.bind(pengguna);
    vi.spyOn(pengguna, 'kirimPercobaan').mockImplementation(async kiriman => { if (kiriman.id === 'racun') throw new GalatPercobaan(409, 'ID_BENTROK'); return asli(kiriman); });
    expect(await kirimAntrean(pengguna)).toBe(0);
    expect(bacaAntreanGagal()).toHaveLength(1);

    antre({ tabel: 'percobaan', baris: kejadian('tertahan') });
    vi.spyOn(pengguna, 'kirimPercobaan').mockRejectedValue(new GalatPercobaan(429, 'LAJU_TERLAMPAUI'));
    expect(await kirimAntrean(pengguna)).toBe(1);
    expect(bacaAntreanGagal()).toHaveLength(1);
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
function Uji({ awal, saatDikerjakan, urutanLatihan }: { awal: Kasus; saatDikerjakan?: (benar: boolean) => void; urutanLatihan?: React.ComponentProps<typeof Hasil>['urutanLatihan'] }) {
  const [kasus] = useState(awal);
  return <Hasil kasus={kasus} idSesi="s" tujuan="belajar" kirim={(_: Aksi) => {}} saatDikerjakan={saatDikerjakan} tanpaSimpan terkunci
    soal={{ id: 'H-99', revisiId: 'rev-1' }} urutanLatihan={urutanLatihan} />;
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

describe('hero soal latihan (B8)', () => {
  const hero = { nomor: 2, jumlah: 5, bab: 'Aul dan radd', judul: 'Istri dan dua anak' };

  it('bilah Latihan + posisi soal; h1 Isi tabel; tombol Soal berikutnya hanya sesudah jawaban dibuka', () => {
    const berikutnya = vi.fn();
    render(<Uji awal={c1601()} urutanLatihan={{ ...hero, saatBerikutnya: berikutnya }} />);
    expect(screen.getByRole('link', { name: 'Latihan' }).getAttribute('href')).toBe('#/latihan');
    expect(screen.getByText('Soal 2 dari 5 · Aul dan radd')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Isi tabel pembagiannya');
    expect(screen.queryByRole('button', { name: /Soal berikutnya/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
    bukaLewatDialog();
    fireEvent.click(screen.getByRole('button', { name: /Soal berikutnya/ }));
    expect(berikutnya).toHaveBeenCalledTimes(1);
  });

  it('soal terakhir: tombol utama kembali ke daftar soal', () => {
    render(<Uji awal={c1601()} urutanLatihan={{ ...hero, nomor: 5 }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
    bukaLewatDialog();
    expect(screen.queryByRole('button', { name: /Soal berikutnya/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Kembali ke daftar soal' }).getAttribute('href')).toBe('#/latihan');
  });
});
