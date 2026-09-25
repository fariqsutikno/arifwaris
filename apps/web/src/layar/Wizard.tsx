// Wizard 5 langkah, satu pertanyaan per layar. Menerima keadaan + kirim(aksi);
// menyerahkan Kasus yang sudah lengkap ke layar hasil lewat KE_LAYAR 'hasil'.

import type { Kasus } from '../kasus';
import { TOTAL_LANGKAH, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { Pilihan } from '../ui/komponen';
import { LangkahAhliWaris } from './LangkahAhliWaris';
import { LangkahKondisi } from './LangkahKondisi';
import { LangkahHarta } from './wizard/LangkahHarta';
import { LangkahKewajiban } from './wizard/LangkahKewajiban';
import { BarBawah } from './wizard/BarBawah';
import { KerangkaLangkah } from './wizard/KerangkaLangkah';
import { LangkahPewaris } from './wizard/LangkahPewaris';
import { RingkasanSamping } from './wizard/RingkasanSamping';
import { Stepper } from './wizard/Stepper';
import { alasanBelumLengkap, langkahTerjauh, LANGKAH_HASIL } from './wizard/validasi';


export function Wizard({ keadaan, kirim }: { keadaan: KeadaanAplikasi; kirim: (aksi: Aksi) => void }) {
  const { kasus, langkah } = keadaan;
  const ubah = (fungsiUbah: (kasus: Kasus) => Kasus) => kirim({ jenis: 'UBAH_KASUS', ubah: fungsiUbah });
  const alasan = alasanBelumLengkap(kasus, langkah);
  return (
    <main className="halaman halaman-wizard">
      <Stepper langkahAktif={langkah} terjauh={langkahTerjauh(kasus)}
        saatPilih={tujuan => kirim(tujuan === LANGKAH_HASIL ? { jenis: 'KE_LAYAR', layar: 'hasil' } : { jenis: 'KE_LANGKAH', langkah: tujuan })} />
      <KerangkaLangkah langkah={langkah} ringkasan={<RingkasanSamping kasus={kasus} />}>
        {langkah === 1 && <LangkahPewaris kasus={kasus} saatPilih={jenisKelamin => kirim({ jenis: 'PILIH_PEWARIS', jenisKelamin })}
          saatUbahNama={nama => ubah(k => ubahNamaPewaris(k, nama))} />}
        {kasus && langkah === 2 && <LangkahHarta kasus={kasus} ubah={ubah} />}
        {kasus && langkah === 3 && <LangkahKewajiban kasus={kasus} ubah={ubah} />}
        {kasus && langkah === 4 && <LangkahAhliWaris graf={kasus.graf} idMayit={kasus.graf.idPewaris} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />}
        {kasus && langkah === 5 && <LangkahKondisi kasus={kasus} ubah={ubah} />}
      </KerangkaLangkah>
      <BarBawah langkah={langkah} alasan={alasan}
        saatKembali={() => kirim(langkah === 1 ? { jenis: 'KE_LAYAR', layar: 'beranda' } : { jenis: 'KE_LANGKAH', langkah: langkah - 1 })}
        saatLanjut={() => kirim(langkah === TOTAL_LANGKAH ? { jenis: 'KE_LAYAR', layar: 'hasil' } : { jenis: 'KE_LANGKAH', langkah: langkah + 1 })} />
    </main>
  );
}

function ubahNamaPewaris(kasus: Kasus, nama: string): Kasus {
  const { nama: _lama, ...tanpaNama } = kasus.graf.orang[kasus.graf.idPewaris]!;
  const pewaris = nama ? { ...tanpaNama, nama } : tanpaNama;
  return { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [kasus.graf.idPewaris]: pewaris } } };
}
