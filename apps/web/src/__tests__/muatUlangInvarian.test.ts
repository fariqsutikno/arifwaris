// Invarian muat ulang: tiap posisi yang bisa dicapai lewat reducer, setelah kasusnya tercatat di riwayat,
// dipulihkan ke layar & langkah yang sama dari URL-nya (menangkap B1 dan regresi serupa). Plus sisa peta uji level U.
import { beforeEach, expect, it } from 'vitest';
import { pulihDariSoal, pulihDariUrl } from '../Aplikasi';
import { kasusDariSusunan, SUSUNAN_CEPAT } from '../lab';
import { kasusBaru, type Kasus } from '../kasus';
import { TOTAL_LANGKAH, keadaanAwal, pengurangKeadaan, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { daftarSoalHitung } from '../konten/sumber';
import { bolehDiHasil } from '../layar/wizard/validasi';
import { catatRiwayat, hapusRiwayat, type SumberRiwayat } from '../riwayat';
import { tautanKasus, tautanSoal } from '../rute';
import { tambahAhliWaris } from '../checklist';

beforeEach(() => { localStorage.clear(); hapusRiwayat(); });

const lengkap = (): Kasus => {
  const dasar = kasusBaru('L', 'latihan');
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: 24_000_000n }, graf: tambahAhliWaris(dasar.graf, 'PEWARIS', 'ISTRI') };
};
const jalankanAksi = (aksi: Aksi[]): KeadaanAplikasi => aksi.reduce(pengurangKeadaan, keadaanAwal(null, null));

/** Posisi yang bisa dicapai pengguna: dibuka di Hasil (bila boleh), tiap langkah wizard, dan layar cerita. */
function posisiTercapai(kasus: Kasus): KeadaanAplikasi[] {
  const muat: Aksi = { jenis: 'MUAT', kasus };
  const daftar = [
    ...(bolehDiHasil(kasus) ? [jalankanAksi([muat])] : []),
    ...Array.from({ length: TOTAL_LANGKAH }, (_, indeks) => jalankanAksi([muat, { jenis: 'KE_LANGKAH', langkah: indeks + 1 }])),
    ...(bolehDiHasil(kasus) ? [jalankanAksi([muat, { jenis: 'KE_LAYAR', layar: 'cerita' }])] : []),
  ];
  return daftar.filter(keadaan => keadaan.layar !== 'awal' && keadaan.layar !== 'pintu');
}

const kasusContoh = (): Array<[string, Kasus, SumberRiwayat]> => [
  ['lengkap', lengkap(), { jenis: 'sendiri' }],
  ['belum lengkap', kasusBaru('P'), { jenis: 'sendiri' }],
  ...SUSUNAN_CEPAT.map((susunan, indeks): [string, Kasus, SumberRiwayat] => [`susunan cepat ${indeks}`, kasusDariSusunan(susunan), { jenis: 'sendiri' }]),
];

it('pulih dari URL memberi layar & langkah yang sama untuk semua posisi tercapai (susunan cepat, belum lengkap)', () => {
  let diperiksa = 0;
  for (const [nama, kasus, sumber] of kasusContoh()) {
    for (const [indeks, keadaan] of posisiTercapai(kasus).entries()) {
      const id = `${nama}-${indeks}`;
      catatRiwayat(id, kasus, indeks + 1, sumber);
      const pulih = pulihDariUrl(tautanKasus(id, { layar: keadaan.layar, langkah: keadaan.langkah, ada: true }), null);
      const label = `${nama} posisi ${indeks} (${keadaan.layar}/${keadaan.langkah})`;
      expect(pulih, label).not.toBeNull();
      expect(pulih!.keadaan.layar, label).toBe(keadaan.layar);
      if (keadaan.layar === 'wizard') expect(pulih!.keadaan.langkah, label).toBe(keadaan.langkah);
      expect(pulih!.sumber, label).toEqual(sumber);
      diperiksa++;
    }
  }
  expect(diperiksa).toBeGreaterThan(20);
});

// Menggantikan "semua soal lewat riwayat" dari #53: soal tidak masuk riwayat (spec siklus kasus dan soal), alamatnya #/latihan/soal/<kode>.
it('tiap soal bank soal pulih dari alamatnya sebagai soal yang ditebak, tanpa riwayat', () => {
  expect(daftarSoalHitung().length).toBeGreaterThan(5);
  for (const soal of daftarSoalHitung()) {
    const pulih = pulihDariSoal(tautanSoal(soal.kode), 'hitung');
    expect(pulih?.soal.kode, soal.kode).toBe(soal.kode);
    expect(pulih!.pembahasan, soal.kode).toBe(false);
    expect(pulih!.keadaan.layar, soal.kode).toBe('hasil');
    expect(pulih!.keadaan.tujuan, soal.kode).toBe('belajar');
  }
  expect(pulihDariSoal('#/latihan/soal/tidak-ada', null)).toBeNull();
  expect(pulihDariSoal('#/hitung/x', null)).toBeNull();
});

it('P3/H8: URL /cerita memulihkan layar cerita; P6: langkah tak sah dibatasi ke langkah sah', () => {
  catatRiwayat('x', lengkap(), 1, { jenis: 'sendiri' });
  expect(pulihDariUrl('#/hitung/x/cerita', null)?.keadaan.layar).toBe('cerita');
  for (const [hash, layar, langkah] of [['abc', 'hasil', undefined], ['99', 'wizard', 4], ['0', 'wizard', 1], ['-1', 'wizard', 1]] as const) {
    const pulih = pulihDariUrl(`#/hitung/x/langkah/${hash}`, null)?.keadaan;
    expect(pulih?.layar, hash).toBe(layar);
    if (langkah) expect(pulih?.langkah, hash).toBe(langkah);
  }
});

it('H5/H6 (diubah): sumber impor ikut pulih; contoh materi tidak masuk riwayat sehingga tidak dipulihkan', () => {
  catatRiwayat('m', lengkap(), 1, { jenis: 'materi' });
  catatRiwayat('i', { ...lengkap(), nama: 'Berkas lain' }, 2, { jenis: 'impor' });
  expect(pulihDariUrl('#/hitung/m', null)).toBeNull();
  expect(pulihDariUrl('#/hitung/i', null)?.sumber).toEqual({ jenis: 'impor' });
});

it('H9: sebelum kasus tercatat (pintu/wizard tanpa pewaris) → tidak ada yang dipulihkan, jatuh ke Awal', () => {
  expect(pulihDariUrl('#/hitung/belum-ada/langkah/1', null)).toBeNull();
});

it('L16: tujuan dari preferensi tetap dipakai saat pulih', () => {
  catatRiwayat('x', lengkap(), 1, { jenis: 'sendiri' });
  expect(pulihDariUrl('#/hitung/x', 'belajar')?.keadaan.tujuan).toBe('belajar');
  expect(pulihDariUrl('#/hitung/x', 'hitung')?.keadaan.tujuan).toBe('hitung');
});
