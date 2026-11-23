import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import type { Tujuan } from '../preferensi';
import { Hasil } from '../layar/Hasil';
import { semuaTersimpan } from '../tersimpan';
import { tandaiDibagikan } from '../bagikanLokal';
import { jalankan } from '@waris/latihan';
import { dataPeranDari } from '../hasil/ketukan';
import { ringkas } from '../hasil/ringkasan';

// Jangkar soal berbenih idSesi; tes yang butuh sel jangkar tertentu menetapkan nilai acaknya di sini.
const nilaiAcak = vi.hoisted(() => ({ nilai: 0.5 }));
vi.mock('../acakBerbenih', () => ({ acakDariBenih: () => () => nilaiAcak.nilai }));

const buat = (kunci: KunciAhliWaris[], tirkah: Kasus['tirkah']): Kasus => {
  const kasus = kasusBaru('L');
  return { ...kasus, tirkah, graf: kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasus.graf) };
};
// Angka kasus ini sudah dicek lewat engine: tashih 72, ibu 12 saham = Rp 16.666.666, sisa Rp 2.
const prototipe = () => buat(['ISTRI', 'IBU', 'AYAH', 'ANAK_LK', 'ANAK_PR', 'SAUDARA_KANDUNG'],
  { kotor: 110_000_000n, tajhiz: 2_000_000n, hutang: 3_000_000n, wasiat: 5_000_000n });
const c1601 = () => buat(['ISTRI', 'ANAK_LK', 'ANAK_PR'], { kotor: 24_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n });

let aksiTerakhir: Aksi | null = null;
function Uji({ awal, idSesi = 'sesi-uji', tujuan = 'hitung', saatDikerjakan, tanpaSimpan }: { awal: Kasus; idSesi?: string; tujuan?: Tujuan; saatDikerjakan?: (benar: boolean) => void; tanpaSimpan?: boolean }) {
  const [kasus, setKasus] = useState(awal);
  const [janganSimpan, setJanganSimpan] = useState(false);
  const kirim = (aksi: Aksi) => { aksiTerakhir = aksi; if (aksi.jenis === 'UBAH_KASUS') setKasus(aksi.ubah); };
  return <Hasil kasus={kasus} idSesi={idSesi} tujuan={tujuan} kirim={kirim} saatDikerjakan={saatDikerjakan} tanpaSimpan={tanpaSimpan} janganSimpan={janganSimpan} saatJanganSimpan={setJanganSimpan} />;
}
const kotorTersimpan = () => (semuaTersimpan()[0]!.kasus as { tirkah: { kotor: string } }).tirkah.kotor;
const pembagian = () => screen.getByRole('region', { name: /^(Siapa dapat berapa\?|Jawabanmu|Kunci jawaban)$/ });
/** Buka jawaban lewat dialog tekan-tahan. */
const bukaLewatDialog = (namaTombolTahan: RegExp) => {
  vi.useFakeTimers();
  fireEvent.pointerDown(within(screen.getByRole('alertdialog')).getByRole('button', { name: namaTombolTahan }));
  act(() => { vi.advanceTimersByTime(1300); });
  vi.useRealTimers();
};

describe('layar hasil', () => {
  it('pembagian per orang dan yang terhalang beserta alasannya', () => {
    render(<Uji awal={prototipe()} />);
    expect(screen.getByRole('heading', { name: 'Nah, ini pembagiannya' })).toBeTruthy();
    expect(within(pembagian()).getAllByText('Rp 16.666.666').length).toBe(2);   // ibu dan ayah
    expect(within(screen.getByRole('region', { name: /^Tidak mendapat bagian/ })).getByText(/Terhalang oleh Anak laki-laki dan Ayah/)).toBeTruthy();
  });

  it('kartu hanya ada bila kasusnya memuatnya: tanpa yang terhalang dan tanpa potongan, tidak ada kartu Tidak mendapat bagian maupun Harta', () => {
    render(<Uji awal={c1601()} />);
    expect(screen.queryByRole('region', { name: /^Tidak mendapat bagian/ })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Harta yang dibagi' })).toBeNull();
    expect(screen.queryByText('Segera hadir')).toBeNull();
    // Harta tetap bisa diubah dari pensil di "Apa yang dipakai di hitungan ini?".
    fireEvent.click(screen.getByRole('button', { name: 'Ubah harta' }));
    expect(screen.getByRole('dialog', { name: 'Ubah harta peninggalan' })).toBeTruthy();
  });

  it('urutan bento mengikuti acuan: pembagian, jenis masalah, tentang, pohon & tabel, bagikan, selanjutnya, pelajari; aksi sekunder berupa tautan (tanpa bar menempel)', () => {
    render(<Uji awal={prototipe()} />);
    const judul = [...document.querySelectorAll('.tata-hasil h2')].map(isi => isi.textContent);
    expect(judul).toEqual(['Siapa dapat berapa?', 'Kasus ini termasuk apa?', 'Apa yang dipakai di hitungan ini?', 'Bagaimana keluarga ini dibagi?', 'Langkah selanjutnya', 'Pelajari cara menghitungnya']);
    expect(document.querySelector('.bar-bawah')).toBeNull();
    expect(within(document.querySelector('.kaki-hasil')!).getByRole('button', { name: 'Reset skenario' })).toBeTruthy();
    expect(within(document.querySelector('.hero-hasil')!).getByText('Rp 100.000.000')).toBeTruthy();   // ubin Harta dibagi lebar penuh: nominal utuh
  });

  it('pembulatan: kartu muncul bila tidak pas, pilihan Rp 1.000 menghitung ulang lewat engine', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(within(pembagian()).getByRole('button', { name: 'Ubah pembulatan' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: /dibulatkan ke/ })).getByRole('radio', { name: /Rp 1.000/ }));
    expect(screen.queryByRole('dialog', { name: /dibulatkan ke/ })).toBeNull();
    expect(within(pembagian()).getAllByText('Rp 16.666.000').length).toBe(2);
    expect(within(pembagian()).getAllByText('Rp 2.000').length).toBeGreaterThan(0);
  });

  it('baris penjumlahan menyaring daftar; ketuk lagi atau Tampilkan semua mengembalikan', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(within(pembagian()).getByRole('button', { name: /^Tidak mendapat bagian \(1\)/ }));
    expect(within(pembagian()).getByText(/Terhalang oleh/)).toBeTruthy();
    expect(within(pembagian()).queryByText('Rp 16.666.666')).toBeNull();
    fireEvent.click(within(pembagian()).getByRole('button', { name: 'Tampilkan semua' }));
    expect(within(pembagian()).getAllByText('Rp 16.666.666').length).toBe(2);
  });

  it('kasus yang sudah bulat tidak menampilkan kartu pembulatan maupun selisih', () => {
    render(<Uji awal={c1601()} />);
    expect(screen.queryByText(/nggak bulat/)).toBeNull();
    expect(screen.queryByText(/Selisih/)).toBeNull();
  });

  it('ikon mata hanya menyembunyikan nominal', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sembunyikan nominal' }));
    expect(within(pembagian()).queryByText('Rp 16.666.666')).toBeNull();
    expect(within(pembagian()).getAllByText(/^1\/6$/).length).toBeGreaterThan(0);
    expect(within(pembagian()).queryByText(/%/)).toBeNull(); // persen tidak lagi di baris
  });

  it('bentuk pecahan bisa diganti ke penyebut sama', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Saham' }));
    expect(within(pembagian()).getAllByText(/^12\/72$/).length).toBeGreaterThanOrEqual(2);
    expect(within(pembagian()).queryAllByText(/^1\/6$/)).toHaveLength(0);
  });

  it('mode belajar menyembunyikan semua jawaban sampai diminta', () => {
    render(<Uji awal={prototipe()} tujuan="belajar" />);
    expect(screen.queryByText('Rp 16.666.666')).toBeNull();
    expect(screen.queryAllByText('1/6', { selector: 'td, .nama-bagian, .jumlah-bagian *' })).toHaveLength(0);
    expect(screen.queryByText(/Terhalang oleh/)).toBeNull();
    // Soal bertabel: panel tabel faraidh berangka ? tidak ada; langkah perhitungan terkunci sampai jawaban dibuka.
    expect(screen.queryAllByLabelText('disembunyikan')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Pembahasan langkah demi langkah/ }));
    expect(screen.getByText('Jawab soalnya dulu')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
    expect(screen.getByRole('alertdialog').textContent).toMatch(/belum nyoba/);
    bukaLewatDialog(/Tahan untuk buka/);
    expect(within(pembagian()).getAllByText('Rp 16.666.666').length).toBe(2);
  });

  it('mode belajar: tabel salah ditolak; benar membuka jawaban dan dihitung dikerjakan', () => {
    nilaiAcak.nilai = 0; // jangkar = sel "Asal masalah" Istri
    const dikerjakan: boolean[] = [];
    render(<Uji awal={c1601()} tujuan="belajar" saatDikerjakan={benar => { dikerjakan.push(benar); }} />);
    const pilih = (nama: string, nilai: string) => fireEvent.change(screen.getByRole('combobox', { name: `Bagian ${nama}` }), { target: { value: nilai } });
    const ketik = (nama: string, nilai: string) => fireEvent.change(screen.getByRole('textbox', { name: nama }), { target: { value: nilai } });
    pilih('Istri', '1/4'); pilih('Anak laki-laki', 'Ashabah'); pilih('Anak perempuan', 'Ashabah');
    ketik('Asal masalah', '8'); ketik('Asal masalah bersama', '7'); ketik('Asal masalah akhir', '24');
    ketik('Asal masalah akhir Istri', '3'); ketik('Asal masalah akhir Anak laki-laki', '14'); ketik('Asal masalah akhir Anak perempuan', '7');
    fireEvent.click(screen.getByRole('button', { name: 'Periksa' }));
    expect(screen.getByText(/Mulai salah di kolom "Bagian"/)).toBeTruthy();
    expect(dikerjakan).toEqual([]);
    pilih('Istri', '1/8');
    fireEvent.click(screen.getByRole('button', { name: 'Periksa' }));
    expect(dikerjakan).toEqual([true]);
    expect(screen.queryByRole('button', { name: 'Periksa' })).toBeNull();
    expect(screen.getByText('Benar semua.')).toBeTruthy();
    nilaiAcak.nilai = 0.5;
  });

  it('mode belajar: lihat jawaban tanpa pernah mencoba tidak dihitung; setelah mencoba dihitung tapi tidak benar', () => {
    const dikerjakan: boolean[] = [];
    const { unmount } = render(<Uji awal={c1601()} tujuan="belajar" saatDikerjakan={benar => { dikerjakan.push(benar); }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
    bukaLewatDialog(/Tahan untuk buka/);
    expect(dikerjakan).toEqual([]);
    unmount();
    render(<Uji awal={c1601()} tujuan="belajar" saatDikerjakan={benar => { dikerjakan.push(benar); }} />);
    for (const pilihan of screen.getAllByRole('combobox')) fireEvent.change(pilihan, { target: { value: 'Terhalang' } });
    fireEvent.click(screen.getByRole('button', { name: 'Periksa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
    expect(screen.getByRole('alertdialog').textContent).not.toMatch(/belum nyoba/);
    expect(screen.getByRole('alertdialog').textContent).toMatch(/tidak memberi XP/);
    bukaLewatDialog(/Tahan untuk buka/);
    expect(dikerjakan).toEqual([false]);
  });

  it('klik orang di pohon membuka penjelasan dengan ahwal, baris kasus ini disorot', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Layar penuh' })); // pohon hanya bisa diketuk per orang di layar penuh; hero hanya pratinjau
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Pohon keluarga' })).getByRole('button', { name: /^Ibu/ }));
    const dialog = screen.getAllByRole('dialog').find(isi => !isi.classList.contains('pohon-penuh'))!; // modal orang, bukan layar penuh
    const baris = within(dialog).getByText('Ada anak/cucu, atau ada dua saudara atau lebih.').closest('tr')!;
    expect(baris.textContent).toMatch(/kasus ini/);
  });

  it('hero mode hitung memuat statistik; mode belajar yang masih menebak menyembunyikannya; body diberi penanda halaman', () => {
    const { unmount } = render(<Uji awal={prototipe()} />);
    const hero = document.querySelector('.hero-hasil')!;
    expect(hero.textContent).toMatch(/Harta dibagi/);
    expect(hero.textContent).not.toMatch(/Penerima/);
    expect(document.body.classList.contains('layar-hasil')).toBe(true);
    unmount();
    expect(document.body.classList.contains('layar-hasil')).toBe(false);
    render(<Uji awal={prototipe()} tujuan="belajar" />);
    expect(document.querySelector('.hero-hasil')!.textContent).not.toMatch(/Harta dibagi/);
  });

  it('pohon di ubin pohon & tabel; layar penuh menutup dengan Escape', () => {
    render(<Uji awal={prototipe()} />);
    expect(document.querySelector('.hero-hasil .pohon')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Layar penuh' }));
    expect(screen.getByRole('dialog', { name: 'Pohon keluarga' })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Pohon keluarga' })).toBeNull();
  });

  it('tabel faraidh ala kitab: asal masalah dan tashih', () => {
    render(<Uji awal={prototipe()} />);
    const tabel = screen.getByRole('table');
    expect(within(tabel).getByText(/Asal masalah/)).toBeTruthy();
    expect(within(tabel).getByText('24', { selector: 'th small' })).toBeTruthy();
    expect(within(tabel).getByText('72', { selector: 'th small' })).toBeTruthy();
  });

  it('klik baris di tabel faraidh juga membuka penjelasan orang itu', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(within(screen.getByRole('table')).getByText('Ibu').closest('tr')!);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Ibu' })).toBeTruthy();
    expect(dialog.querySelector('.kepala-modal.menerima')?.textContent).toMatch(/Menerima bagian/);
    expect(within(dialog).getByRole('heading', { name: 'Dasar · berlaku untuk semua kasus' })).toBeTruthy(); // alur bernomor: Dasar → Di keluarga ini → Hitungan
  });

  it('Apa yang dipakai di hitungan ini? merinci harta kotor dikurangi potongan sampai harta yang dibagi', () => {
    render(<Uji awal={prototipe()} />);
    const tentang = screen.getByRole('region', { name: 'Apa yang dipakai di hitungan ini?' });
    expect(tentang.textContent).toMatch(/Kotor Rp 110\.000\.000 − jenazah Rp 2\.000\.000 − hutang Rp 3\.000\.000/);
    expect(within(tentang).getAllByText('Rp 100.000.000').length).toBeGreaterThan(0);
  });

  it('ubah harta cepat dari layar hasil: pratinjau, lalu simpan; hutang dan wasiat tidak berubah', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ubah harta' }));
    const dialog = screen.getByRole('dialog', { name: 'Ubah harta peninggalan' });
    fireEvent.change(within(dialog).getByLabelText('Harta peninggalan'), { target: { value: '210000000' } });
    expect(within(dialog).getByText('Rp 200.000.000')).toBeTruthy();   // 210 − 2 − 3 − 5
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan' }));
    expect(within(pembagian()).getByText('Rp 25.000.000')).toBeTruthy();   // istri 1/8 × 200 jt
  });

  it('batal ubah harta mengembalikan nilai semula', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ubah harta' }));
    fireEvent.change(screen.getByLabelText('Harta peninggalan'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(within(pembagian()).getByText('Rp 12.500.000')).toBeTruthy();
  });

  it('dari modal orang: Ubah jumlah membuka modal − n + khusus jenis itu', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(within(pembagian()).getByRole('button', { name: /Anak perempuan/ }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ubah jumlah' }));
    const modal = screen.getByRole('dialog', { name: /Ubah jumlah Anak perempuan/ });
    fireEvent.click(within(modal).getByRole('button', { name: 'Tambah Anak perempuan' }));
    expect(within(pembagian()).getAllByText(/^Anak perempuan/).length).toBe(2);
    fireEvent.click(within(modal).getByRole('button', { name: 'Kurangi Anak perempuan' }));
    fireEvent.click(within(modal).getByRole('button', { name: 'Kurangi Anak perempuan' }));
    expect(within(pembagian()).queryByText(/^Anak perempuan/)).toBeNull();
  });

  it('modal orang: kenapa segitu hanya tentang dia, pengaruhnya ke orang lain dipisah', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(within(pembagian()).getByRole('button', { name: /^Anak laki-laki/ }));
    const dialog = screen.getByRole('dialog');
    const kenapa = dialog.querySelector('.syarat-modal')!;
    expect(kenapa.textContent).toMatch(/sisa/);
    expect(kenapa.textContent).not.toMatch(/Istri mendapat/);
    expect(within(dialog).getByText('Ahli waris lain yang terdampak')).toBeTruthy();
    expect(within(dialog).getByRole('heading', { name: 'Hitungan' })).toBeTruthy();
  });

  it('hanya istri: hasil tetap tampil, sisa ke dzawil arham / baitul mal', () => {
    render(<Uji awal={buat(['ISTRI'], { kotor: 4_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n })} />);
    expect(within(pembagian()).getAllByText(/Sisa: dzawil arham \/ baitul mal/).length).toBeGreaterThan(0);
    expect(within(pembagian()).getAllByText('Rp 3.000.000').length).toBeGreaterThan(0);
  });

  it('dzawil arham (khalah + \'ammah, kasus 16.24) berlabel dzawil arham, bukan ashabah', () => {
    const orang = (id: string, jenisKelamin: 'L' | 'P', lain: object = {}) => ({ id, jenisKelamin, statusHidup: 'hidup' as const, agama: 'islam' as const, ...lain });
    const wafat = { statusHidup: 'wafat' as const, penghubung: true };
    const kasus: Kasus = { ...kasusBaru('L'), tirkah: { kotor: 90_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, graf: {
      idPewaris: 'D', pernikahan: [], orang: {
        D: orang('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
        F1: orang('F1', 'L', { ...wafat, idAyah: 'PGF', idIbu: 'PGM' }), M1: orang('M1', 'P', { ...wafat, idAyah: 'MGF', idIbu: 'MGM' }),
        PGF: orang('PGF', 'L', wafat), PGM: orang('PGM', 'P', wafat), MGF: orang('MGF', 'L', wafat), MGM: orang('MGM', 'P', wafat),
        KL1: orang('KL1', 'P', { idAyah: 'MGF', idIbu: 'MGM' }), AM1: orang('AM1', 'P', { idAyah: 'PGF', idIbu: 'PGM' }),
      } } };
    render(<Uji awal={kasus} />);
    const tabel = screen.getByRole('table');
    expect(within(tabel).getAllByText('Dzawil arham')).toHaveLength(2);
    expect(within(tabel).queryByText('Ashabah')).toBeNull();
    expect(within(tabel).queryByText('sisa')).toBeNull();
    const ringkasan = ringkas(kasus, jalankan(kasus));
    expect(ringkasan.penerima.map(orang => [orang.keterangan, orang.ashabah])).toEqual([['Dzawil arham', false], ['Dzawil arham', false]]);
    const tampil = jalankan(kasus);
    if (tampil.jenis !== 'biasa' || tampil.hasil.status !== 'OK') throw new Error('harus OK');
    expect([...dataPeranDari(kasus.graf, ringkasan, tampil.hasil.tabel, []).pembagian.values()]).toEqual(['dzawilArham', 'dzawilArham']);
  });

  it('dzawil arham: langkah demi langkah memakai linimasa tanpa tabel (semua tahap tampil, tidak error)', () => {
    const orang = (id: string, jenisKelamin: 'L' | 'P', lain: object = {}) => ({ id, jenisKelamin, statusHidup: 'hidup' as const, agama: 'islam' as const, ...lain });
    const wafat = { statusHidup: 'wafat' as const, penghubung: true };
    const kasus: Kasus = { ...kasusBaru('L'), tirkah: { kotor: 90_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, graf: {
      idPewaris: 'D', pernikahan: [], orang: {
        D: orang('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
        F1: orang('F1', 'L', { ...wafat, idAyah: 'PGF', idIbu: 'PGM' }), M1: orang('M1', 'P', { ...wafat, idAyah: 'MGF', idIbu: 'MGM' }),
        PGF: orang('PGF', 'L', wafat), PGM: orang('PGM', 'P', wafat), MGF: orang('MGF', 'L', wafat), MGM: orang('MGM', 'P', wafat),
        KL1: orang('KL1', 'P', { idAyah: 'MGF', idIbu: 'MGM' }), AM1: orang('AM1', 'P', { idAyah: 'PGF', idIbu: 'PGM' }),
      } } };
    render(<Uji awal={kasus} />);
    fireEvent.click(screen.getByRole('button', { name: /Dari 1 sampai selesai/ }));
    const mode = () => screen.getByRole('dialog', { name: 'Langkah demi langkah' });
    fireEvent.click(within(mode()).getByRole('button', { name: 'Lainnya' }));
    fireEvent.click(within(mode()).getByRole('button', { name: 'Tampilkan semua langkah' }));
    expect(within(mode()).getByText('Semua tahap')).toBeTruthy();
    expect(mode().querySelector('.kartu-tahap')).toBeTruthy();
    expect(mode().querySelector('table')).toBeNull();
  });

  it('Atur kolom menyembunyikan kolom tabel; kepala kolom yang disembunyikan tak lagi bisa dipilih', () => {
    render(<Uji awal={prototipe()} />);
    const tabel = screen.getByRole('table');
    expect(within(tabel).getByText(/Asal masalah/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Asal masalah' }));
    expect(within(screen.getByRole('table')).queryByText(/Asal masalah/)).toBeNull();
    expect(screen.getByText(/3 dari 5|4 dari 5/)).toBeTruthy();
  });

  it('pintasan "Ubah ahli waris" membuka langkah ahli waris', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ubah Ahli waris' }));
    expect(aksiTerakhir).toEqual({ jenis: 'KE_LANGKAH', langkah: 3 });
  });

  it('istilah di tabel faraidh punya tooltip', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.focus(within(screen.getByRole('table')).getByText('Tashih'));
    expect(screen.getByRole('tooltip').textContent).toMatch(/pembagi/);
  });

  it('"Ubah data" membuka wizard dari langkah pertama', () => {
    render(<Uji awal={prototipe()} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Ubah data/ }).at(-1)!);
    expect(aksiTerakhir).toEqual({ jenis: 'KE_LANGKAH', langkah: 1 });
  });

  it('langkah demi langkah: pintu membuka mode penuh, maju/mundur, Lainnya, tutup', () => {
    render(<Uji awal={c1601()} />);
    fireEvent.click(screen.getByRole('button', { name: /Dari 1 sampai selesai/ }));
    const mode = () => screen.getByRole('dialog', { name: 'Langkah demi langkah' });
    expect(within(mode()).getByText(/Tahap 1 dari \d+ · Langkah 1 dari/)).toBeTruthy();
    const awal = mode().textContent;
    fireEvent.click(within(mode()).getByRole('button', { name: /Lanjut/ }));
    expect(mode().textContent).not.toBe(awal);
    fireEvent.click(within(mode()).getByRole('button', { name: /Kembali/ }));
    expect(within(mode()).getByText(/Langkah 1 dari/)).toBeTruthy();
    fireEvent.click(within(mode()).getByRole('button', { name: 'Lainnya' }));
    fireEvent.click(within(mode()).getByRole('button', { name: 'Tampilkan semua langkah' }));
    expect(within(mode()).getByText('Semua tahap')).toBeTruthy();
    fireEvent.click(within(mode()).getByRole('button', { name: 'Tutup' }));
    expect(screen.queryByRole('dialog', { name: 'Langkah demi langkah' })).toBeNull();
  });

  it('langkah demi langkah: tabel dibangun bertahap, Selesai di langkah terakhir menutup', () => {
    render(<Uji awal={c1601()} />);
    fireEvent.click(screen.getByRole('button', { name: /Dari 1 sampai selesai/ }));
    const mode = () => screen.getByRole('dialog', { name: 'Langkah demi langkah' });
    expect(within(mode()).getByText(/Kolom tabel bertambah/)).toBeTruthy();
    for (let klik = 0; klik < 80 && !within(mode()).queryByRole('button', { name: 'Selesai' }); klik++) fireEvent.click(within(mode()).getByRole('button', { name: /Lanjut/ }));
    expect(mode().querySelector('table.tabel-langkah')!.textContent).toMatch(/Nominal.*Rp 3\.000\.000/);
    fireEvent.click(within(mode()).getByRole('button', { name: 'Selesai' }));
    expect(screen.queryByRole('dialog', { name: 'Langkah demi langkah' })).toBeNull();
  });

  it('sinema: pindah tampilan menjaga posisi; putar otomatis maju sendiri dan bar memudar', () => {
    localStorage.clear();
    render(<Uji awal={c1601()} />);
    fireEvent.click(screen.getByRole('button', { name: /Dari 1 sampai selesai/ }));
    const mode = () => screen.getByRole('dialog', { name: 'Langkah demi langkah' });
    const posisi = () => mode().querySelector('.judul-ldl p')!.textContent;
    fireEvent.click(within(mode()).getByRole('button', { name: /Lanjut/ }));
    const awal = posisi();
    fireEvent.click(within(mode()).getByRole('button', { name: 'Sinema' }));
    expect(mode().querySelector('.papan-sinema')).toBeTruthy();
    expect(posisi()).toBe(awal);
    vi.useFakeTimers();
    fireEvent.click(within(mode()).getByRole('button', { name: 'Putar otomatis' }));
    act(() => { vi.advanceTimersByTime(3100); });
    expect(mode().classList.contains('diam')).toBe(true);
    act(() => { vi.advanceTimersByTime(8000); });
    vi.useRealTimers();
    expect(posisi()).not.toBe(awal);
    fireEvent.click(within(mode()).getByRole('button', { name: 'Teks' }));
    expect(mode().querySelector('.teks-isi')).toBeTruthy();
    localStorage.clear();
  });

  it('hero kasus sendiri: tanpa tombol, sakelar, chip "1 mayit", ubin Penerima, maupun jalan ke mode tebak', () => {
    render(<Uji awal={c1601()} />);
    const hero = document.querySelector('.hero-hasil')!;
    expect([...hero.querySelectorAll('button')].map(tombol => tombol.textContent?.trim()).filter(Boolean)).toEqual(['Periksa', 'Bagikan']);
    expect(hero.querySelector('.tab-kecil, .pil-hero, .fakta-hero')).toBeNull();
    expect(hero.textContent).toMatch(/Menurut madzhab Syafi'i, dibagi ke 3 orang\./);
    expect(screen.queryByRole('button', { name: /Coba tebak dulu/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Bandingkan madzhab/ })).toBeTruthy();
  });

  it('kasus yang tidak didukung tampil sebagai pesan', () => {
    render(<Uji awal={kasusBaru('L')} />);
    expect(screen.getByRole('alert').textContent).toMatch(/belum bisa dihitung/);
  });

  it('simpan otomatis: kasus baru langsung masuk Tersimpan dan bilah menampilkan jamnya; tanpa tombol Simpan', () => {
    localStorage.clear();
    render(<Uji awal={prototipe()} idSesi="sesi-simpan" />);
    expect(semuaTersimpan()).toHaveLength(1);
    expect(semuaTersimpan()[0]!.id).toBe('sesi-simpan');
    expect(screen.getByText(/^Tersimpan di riwayat · \d{2}\.\d{2}$/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Simpan, lanjut nanti/ })).toBeNull();
  });

  it('simpan otomatis ulang saat kasus berubah (ditunda), dan nama otomatis ikut kasus', () => {
    localStorage.clear();
    vi.useFakeTimers();
    render(<Uji awal={prototipe()} idSesi="sesi-ubah" />);
    const judulAwal = semuaTersimpan()[0]!.judul;
    fireEvent.click(screen.getByRole('button', { name: 'Ubah harta' }));
    fireEvent.change(screen.getByLabelText('Harta peninggalan'), { target: { value: '210000000' } });
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Ubah harta peninggalan' })).getByRole('button', { name: 'Simpan' }));
    expect(kotorTersimpan()).toBe('110000000');
    act(() => { vi.advanceTimersByTime(900); });
    vi.useRealTimers();
    expect(semuaTersimpan()).toHaveLength(1);
    expect(kotorTersimpan()).toBe('210000000');
    expect(semuaTersimpan()[0]!.judul).toBe(judulAwal);
  });

  it('soal latihan dan tautan penerima tidak disimpan otomatis', () => {
    localStorage.clear();
    render(<Uji awal={prototipe()} idSesi="sesi-latihan" tujuan="belajar" tanpaSimpan />);
    expect(semuaTersimpan()).toHaveLength(0);
    render(<Hasil kasus={prototipe()} idSesi="sesi-baca" tujuan="hitung" kirim={() => {}} hanyaBaca />);
    expect(semuaTersimpan()).toHaveLength(0);
  });

  it('lembar Bagikan: pratinjau teks, empat aksi (tanpa tautan bila belum masuk), tanpa PDF/PNG; Esc menutup dan fokus kembali', () => {
    localStorage.clear();
    render(<Uji awal={c1601()} />);
    const tautan = within(document.querySelector('.bilah-hero')!).getByRole('button', { name: 'Bagikan' });
    tautan.focus();
    fireEvent.click(tautan);
    const lembar = screen.getByRole('dialog', { name: 'Bagikan hasil ini' });
    expect(within(lembar).getByText(/Pembagian waris .*\(madzhab Syafi'i\)/)).toBeTruthy();
    expect(within(lembar).getAllByRole('button').map(tombol => tombol.querySelector('b')?.textContent ?? tombol.textContent))
      .toEqual(['Tutup', 'Kirim ke WhatsApp atau aplikasi lain', 'Salin teks', 'Unduh file kasus', 'Jangan simpan kasus ini']);
    expect(lembar.textContent).not.toMatch(/PDF|PNG|Segera hadir/);
    expect(document.activeElement?.textContent).toBe('Tutup');
    fireEvent.keyDown(lembar, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Bagikan hasil ini' })).toBeNull();
    expect(document.activeElement).toBe(tautan);
  });

  it('lembar Bagikan: Salin teks menyalin ringkasan dan menampilkan toast; teks mengikuti nominal tersembunyi', async () => {
    const tulis = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: tulis }, configurable: true });
    render(<Uji awal={c1601()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sembunyikan nominal' }));
    fireEvent.click(within(document.querySelector('.bilah-hero')!).getByRole('button', { name: 'Bagikan' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Salin teks/ })); });
    expect(tulis).toHaveBeenCalledOnce();
    const teks = (tulis.mock.calls[0] as unknown as [string])[0];
    expect(teks).toMatch(/Nominal disembunyikan/);
    expect(teks).not.toMatch(/Rp/);
    expect(screen.getByText('Teks disalin')).toBeTruthy();
  });

  it('Jangan simpan: kasus hilang dari Tersimpan, status "Tidak disimpan"; perubahan sesudahnya tidak menyimpan; Urungkan mengembalikan', () => {
    localStorage.clear();
    render(<Uji awal={prototipe()} idSesi="sesi-jangan" />);
    expect(semuaTersimpan()).toHaveLength(1);
    fireEvent.click(within(document.querySelector('.bilah-hero')!).getByRole('button', { name: 'Bagikan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Jangan simpan kasus ini' }));
    expect(semuaTersimpan()).toHaveLength(0);
    expect(screen.getByText('Tidak disimpan')).toBeTruthy();
    expect(screen.getByText('Kasus dihapus dari riwayat')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ubah harta' }));
    fireEvent.change(screen.getByLabelText('Harta peninggalan'), { target: { value: '210000000' } });
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Ubah harta peninggalan' })).getByRole('button', { name: 'Simpan' }));
    expect(semuaTersimpan()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Urungkan' }));
    expect(semuaTersimpan()).toHaveLength(1);
    expect(screen.getByText(/^Tersimpan di riwayat/)).toBeTruthy();
  });

  it('kasus yang sedang dibagikan lewat tautan tidak menawarkan Jangan simpan', () => {
    localStorage.clear();
    tandaiDibagikan('sesi-dibagikan', true);
    render(<Uji awal={prototipe()} idSesi="sesi-dibagikan" />);
    fireEvent.click(within(document.querySelector('.bilah-hero')!).getByRole('button', { name: 'Bagikan' }));
    expect(screen.queryByRole('button', { name: 'Jangan simpan kasus ini' })).toBeNull();
    expect(screen.getByText(/sedang dibagikan lewat tautan/)).toBeTruthy();
  });
});
