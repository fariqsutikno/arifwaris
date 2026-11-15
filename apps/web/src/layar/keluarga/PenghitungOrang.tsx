// Penghitung "− jumlah +" satu peran di satu bagian (spec kanvas 5.4). Menerima Kasus + bagian + kunci; menyerahkan Kasus.
// + menambah baris kosong yang belum lengkap sampai keadaannya dipilih; − hanya membuang baris kosong terakhir,
// selain itu mengarahkan ke "Hapus" di baris. Barisnya dirender pemanggil lewat BarisOrang.

import { useState } from 'react';
import type { KunciAhliWaris } from '@waris/engine';
import { daftarInduk, INDUK_BARU_WAFAT, jenisDari } from '../../checklist';
import type { Kasus } from '../../kasus';
import { LABEL_SEHARI, sebutAlmarhum } from '../../konten/ahliWaris';
import { kurangiBarisKosong, orangDenganKunci, tambahBaris } from '../../isianBagian';
import type { Bagian } from '../../kelompok';
import { t } from '../../terjemah';
import { PilihInduk } from './PilihInduk';

interface Props { kasus: Kasus; bagian: Bagian; kunci: KunciAhliWaris; label?: string; ubah: (f: (k: Kasus) => Kasus) => void }

export function PenghitungOrang({ kasus, bagian, kunci, label, ubah }: Props) {
  const [pesan, setPesan] = useState<string | null>(null);
  const [idIndukPilihan, setIdIndukPilihan] = useState<string | undefined>(undefined);
  const jenis = jenisDari(kunci);
  const nama = label ?? sebutAlmarhum(LABEL_SEHARI[kunci] ?? jenis?.label ?? kunci, kasus.graf.orang[bagian.milik]?.jenisKelamin ?? 'L');
  const jumlah = orangDenganKunci(kasus, bagian.milik, kunci).length;
  const calonInduk = jenis?.kunciInduk ? daftarInduk(kasus.graf, bagian.milik, jenis.kunciInduk) : [];
  const indukTerpilih = idIndukPilihan === INDUK_BARU_WAFAT || (idIndukPilihan && calonInduk.includes(idIndukPilihan))
    ? idIndukPilihan : calonInduk[0] ?? INDUK_BARU_WAFAT;

  const tambah = () => {
    try {
      const baru = tambahBaris(kasus, bagian, kunci, jenis?.kunciInduk ? { idInduk: indukTerpilih } : {});
      setPesan(null);
      ubah(() => baru);
    } catch (galat) {
      setPesan(galat instanceof Error ? galat.message : String(galat));
    }
  };
  const kurangi = () => {
    if (jumlah === 0) return;
    const baru = kurangiBarisKosong(kasus, bagian, kunci);
    if (!baru) return setPesan(t('hitung.kanvas.hapus_lewat_baris'));
    setPesan(null);
    ubah(() => baru);
  };

  return (
    <div className="penghitung">
      <div className="hitung-label">
        <span className="nama-kontrol">{nama}</span>
        {jenis?.kunciInduk && <PilihInduk kunci={kunci} graf={kasus.graf} idMayit={bagian.milik} nilai={indukTerpilih} saatUbah={setIdIndukPilihan} />}
        <span className="hitung" role="group" aria-label={nama}>
          <button type="button" aria-label={t('hitung.kurangi_label', { label: nama })} onClick={kurangi}>−</button>
          <b aria-live="polite">{jumlah}</b>
          <button type="button" aria-label={t('hitung.tambah_label', { label: nama })} onClick={tambah}>+</button>
        </span>
      </div>
      {pesan && <p className="kecil redup" role="status">{pesan}</p>}
    </div>
  );
}
