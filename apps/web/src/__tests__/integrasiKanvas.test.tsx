// Integrasi kanvas keluarga (spec kanvas 11.6, 11.8): kasus A dibangun hanya lewat fungsi murni kanvas harus sama dengan
// fixture engine; kasus A v3 lewat migrasi memberi input engine yang sama; aksesibilitas kanvas.

import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { IdOrang } from '@waris/engine';
import { ubahNama } from '../checklist';
import { jawabHalLain } from '../halLain';
import { isiBarisTetap, jawabAdaTidak, jawabAnakBersama, jawabKamu, slotTetap, tambahBaris } from '../isianBagian';
import { jalankan, keInputEngine } from '../jalankan';
import { dariJson, kasusBaru, keJson, rapikanKeadaan, type Kasus } from '../kasus';
import { jawabLanjutan, pilihKeadaan, type PilihanKeadaan } from '../keadaanBaris';
import { bagianLengkap, daftarBagian, type Bagian } from '../kelompok';
import { KanvasKeluarga } from '../layar/keluarga/KanvasKeluarga';
import { BarisOrang } from '../layar/keluarga/BarisOrang';
import { PintuLab } from '../layar/PintuLab';
import { Wizard } from '../layar/Wizard';
import { aturTahunWafat, turunkanDariWaktu } from '../silsilah';
import { keadaanAwal, pengurangKeadaan, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { t } from '../terjemah';
import { keluargaKarto } from './fixtures/kanvas';

beforeEach(() => { localStorage.clear(); localStorage.setItem('arif-waris:tur:wizard', '1'); });

const HARTA = 1_200_000_000n;
const TAHUN_AWAL = 1900;   // lebih awal dari semua almarhum di kasus A

/** Sama dengan UBAH_KASUS di reducer: tahun diturunkan, lalu keadaan dirapikan. */
const terap = (kasus: Kasus): Kasus => rapikanKeadaan(turunkanDariWaktu(kasus));
const wafat = (kasus: Kasus, id: IdOrang, milik: IdOrang, tahun: number): Kasus =>
  terap(jawabLanjutan(pilihKeadaan(kasus, id, 'wafat', milik), id, milik, { jenis: 'wafat', tahun: { tahun, kiraKira: false } }));
const orangDi = (kasus: Kasus, nama: string): IdOrang => Object.values(kasus.graf.orang).find(orang => orang.nama === nama)!.id;
const bagianDari = (kasus: Kasus, id: string): Bagian => daftarBagian(kasus).find(bagian => bagian.id === id)!;
const namai = (kasus: Kasus, id: IdOrang, nama: string): Kasus => ({ ...kasus, graf: ubahNama(kasus.graf, id, nama) });

function tambahOrang(kasus: Kasus, bagian: Bagian, kunci: Parameters<typeof tambahBaris>[2], nama: string, keadaan: PilihanKeadaan = 'hidup'): Kasus {
  const sebelum = new Set(Object.keys(kasus.graf.orang));
  const denganBaris = tambahBaris(kasus, bagian, kunci);
  const id = Object.keys(denganBaris.graf.orang).find(satu => !sebelum.has(satu))!;
  return terap(pilihKeadaan(namai(denganBaris, id, nama), id, keadaan, bagian.milik));
}

/** Orang tua (dan kakek-nenek bila ditanya) yang sudah wafat jauh sebelum semua almarhum. */
function orangTuaSudahWafat(kasus: Kasus, bagian: Bagian): Kasus {
  return slotTetap(kasus, bagian).reduce((k, kunci) => {
    const dengan = isiBarisTetap(k, bagian, kunci, 'wafat');
    const id = Object.keys(dengan.graf.orang).find(satu => !k.graf.orang[satu])!;
    return terap(jawabLanjutan(dengan, id, bagian.milik, { jenis: 'wafat', tahun: { tahun: TAHUN_AWAL, kiraKira: false } }));
  }, kasus);
}

/** Kasus A hanya lewat jawaban kanvas: Mbah Karto, istri Sumi, anak Slamet/Budi/Rina, Budi beristri Dewi beranak Andi dan Sari. */
function kasusAViaKanvas(): Kasus {
  let kasus: Kasus = { ...kasusBaru('L'), pintu: 'lama', tirkah: { kotor: HARTA, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  kasus = namai(aturTahunWafat(kasus, 'PEWARIS', { tahun: 1975, kiraKira: false }), 'PEWARIS', 'Mbah Karto');
  kasus = tambahOrang(kasus, bagianDari(kasus, 'pasangan:PEWARIS'), 'ISTRI', 'Mbah Sumi', 'wafat');
  const sumi = orangDi(kasus, 'Mbah Sumi');
  kasus = wafat(kasus, sumi, 'PEWARIS', 1985);
  const anak = bagianDari(kasus, 'anak:PEWARIS');
  kasus = tambahOrang(kasus, anak, 'ANAK_LK', 'Slamet', 'wafat');
  kasus = wafat(kasus, orangDi(kasus, 'Slamet'), 'PEWARIS', 1970);
  kasus = tambahOrang(kasus, anak, 'ANAK_LK', 'Budi', 'wafat');
  kasus = wafat(kasus, orangDi(kasus, 'Budi'), 'PEWARIS', 1998);
  kasus = tambahOrang(kasus, anak, 'ANAK_PR', 'Rina');
  // Selesai mengisi bagian pewaris, lalu bagian lain menurut daftar yang tumbuh seiring jawaban.
  for (let putaran = 0; putaran < 40; putaran++) {
    const bagian = daftarBagian(kasus).find(satu => !bagianLengkap(kasus, satu));
    if (!bagian) break;
    const milik = kasus.graf.orang[bagian.milik]!.nama;
    switch (bagian.jenis) {
      case 'orangTua': case 'kakekNenek': kasus = orangTuaSudahWafat(kasus, bagian); break;
      case 'halLain': kasus = jawabHalLain(kasus, bagian.milik, false); break;
      case 'anakBersama': kasus = jawabAnakBersama(kasus, bagian, true); break;
      case 'kamu': kasus = jawabKamu(kasus, null); break;
      case 'pasangan': case 'anak': case 'saudara': case 'jauh': case 'saudaraKakek':
        if (milik === 'Budi' && bagian.jenis === 'pasangan') kasus = tambahOrang(kasus, bagian, 'ISTRI', 'Dewi');
        else if (milik === 'Budi' && bagian.jenis === 'anak') {
          kasus = tambahOrang(tambahOrang(kasus, bagian, 'ANAK_LK', 'Andi'), bagian, 'ANAK_PR', 'Sari');
        } else kasus = jawabAdaTidak(kasus, bagian, false);
        break;
      case 'urutan': throw new Error('urutan seharusnya terjawab dari tahun');
    }
  }
  return kasus;
}

const fpb = (a: bigint, b: bigint): bigint => (b === 0n ? a : fpb(b, a % b));
function sahamBernama(kasus: Kasus): Record<string, string> {
  const hasil = jalankan(kasus);
  if (hasil.jenis !== 'munasakhat' || hasil.hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
  const total = Object.values(hasil.hasil.saham).reduce((a, b) => a + b, 0n);
  return Object.fromEntries(Object.entries(hasil.hasil.saham).filter(([, s]) => s > 0n).map(([id, s]) => {
    const g = fpb(s, total);
    return [kasus.graf.orang[id]!.nama!, `${s / g}/${total / g}`];
  }));
}
const denganHarta = (kasus: Kasus): Kasus => ({ ...kasus, tirkah: { kotor: HARTA, tajhiz: 0n, hutang: 0n, wasiat: 0n } });

describe('kasus A: kanvas = fixture engine (spec kanvas 11.6)', () => {
  it('kasus A lewat kanvas = kasus A fixture', () => {
    const { kasus: fixture } = keluargaKarto();
    const dariKanvas = kasusAViaKanvas();
    expect(daftarBagian(dariKanvas).every(bagian => bagianLengkap(dariKanvas, bagian))).toBe(true);
    const sahamFixture = sahamBernama(denganHarta(fixture));
    expect(sahamBernama(dariKanvas)).toEqual(sahamFixture);
    expect(sahamFixture).toEqual({ Rina: '1/3', Dewi: '1/12', Andi: '7/18', Sari: '7/36' });
  });

  it('kasus A lewat migrasi v3 menghasilkan input engine yang sama', () => {
    const { kasus } = keluargaKarto();
    const v3 = keJson(denganHarta(kasus)).replace('"versi":4', '"versi":3').replace(/,"jenisKasus":"nyata"/, '');
    const hasil = dariJson(v3);
    if (!hasil.berhasil) throw new Error(hasil.pesan);
    expect(keInputEngine(hasil.kasus)).toEqual(keInputEngine(denganHarta(kasus)));
    expect(hasil.kasus.urutanWafat).toEqual(kasus.urutanWafat);
    expect(sahamBernama(hasil.kasus)).toEqual({ Rina: '1/3', Dewi: '1/12', Andi: '7/18', Sari: '7/36' });
  });
});

describe('aksesibilitas kanvas (spec kanvas 11.8)', () => {
  const Papan = ({ awal }: { awal: Kasus }) => {
    const [kasus, setKasus] = useState(awal);
    return <KanvasKeluarga kasus={kasus} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} tandaiKurang={false} saatSelesai={() => undefined} />;
  };

  it('radiogroup berlabel: Pintu, Ya/Tidak, keadaan', () => {
    const { unmount } = render(<PintuLab saatPilih={() => undefined} />);
    expect(screen.getByRole('radiogroup', { name: t('hitung.kanvas.pintu_judul') })).toBeTruthy();
    unmount();
    render(<Papan awal={kasusBaru('L')} />);
    expect(screen.getByRole('radiogroup', { name: 'Waktu almarhum meninggal, apakah beliau punya istri?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Ya' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Istri' }));
    expect(screen.getByRole('radiogroup', { name: 'Keadaannya sekarang?' })).toBeTruthy();
  });

  it('live region mengumumkan status bagian dan fokus pindah ke judul kartu baru', () => {
    render(<Papan awal={kasusBaru('L')} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Tidak' }));
    expect(within(screen.getAllByRole('status')[0]!).getByText('Bagian ini sudah lengkap.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Lanjut: Anak/ }));
    expect(document.activeElement).toBe(document.querySelector('.grup h2'));
  });

  it('tombol utama tidak nonaktif, di kartu maupun di bar bawah', () => {
    const { unmount } = render(<Papan awal={kasusBaru('L')} />);
    expect(screen.getByRole('button', { name: /Lanjut: Anak/ }).hasAttribute('disabled')).toBe(false);
    unmount();
    const awal = pengurangKeadaan(keadaanAwal({ ...kasusBaru('L'), pintu: 'baru', tirkah: { kotor: 1n, tajhiz: 0n, hutang: 0n, wasiat: 0n } }, null), { jenis: 'KE_LANGKAH', langkah: 3 });
    function Halaman() {
      const [keadaan, setKeadaan] = useState<KeadaanAplikasi>(awal);
      return <Wizard keadaan={keadaan} kirim={(aksi: Aksi) => setKeadaan(k => pengurangKeadaan(k, aksi))} />;
    }
    render(<Halaman />);
    expect(document.querySelector('.bar-bawah .aw-btn, .bar-bawah .tautan-teks:last-of-type')!.hasAttribute('disabled')).toBe(false);
    expect(document.querySelectorAll('.bar-bawah [disabled]')).toHaveLength(0);
  });

  it('tab mencapai tiap kontrol baris tanpa jebakan: tidak ada tabindex positif dan tidak ada kontrol nonaktif', () => {
    const { kasus, budi } = keluargaKarto();
    render(<BarisOrang kasus={kasus} id={budi} kunci="ANAK_LK" milik="PEWARIS" ubah={() => undefined} tandaiKurang={false} disorot={false} />);
    const baris = document.getElementById(`baris-${budi}`)!;
    const kontrol = [...baris.querySelectorAll<HTMLElement>('input, button, select, textarea')];
    expect(kontrol.length).toBeGreaterThan(3);
    for (const satu of kontrol) {
      expect(satu.hasAttribute('disabled')).toBe(false);
      expect(satu.tabIndex).toBeGreaterThanOrEqual(0);
      expect(Number(satu.getAttribute('tabindex') ?? 0)).toBeLessThanOrEqual(0);
    }
  });

  it('kunci diksi kanvas ada di snapshot (bukan jatuh ke nama kunci)', () => {
    for (const kunci of ['hitung.kanvas.tertahan', 'hitung.kanvas.ke_baris', 'hitung.kanvas.lanjut_ke', 'hitung.kanvas.kd_hidup']) {
      expect(t(kunci)).not.toBe(kunci);
    }
  });
});
