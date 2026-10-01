// Layar keadaan khusus keluarga (langkah Keluarga, bagian 'keadaan'): SATU keputusan, bukan tiga pertanyaan ya/tidak berurutan.
// "Ada keadaan khusus?" ditawarkan sebagai kartu yang boleh dicentang (wafat/hilang, hamil, beda agama); tak ada yang dicentang = kasus
// biasa, langsung lanjut. Kartu yang tidak mungkin berlaku tidak ditampilkan (hamil tanpa perempuan yang bisa hamil; beda agama
// ditanyakan sekali, di babak terakhir, karena berlaku untuk semua ahli waris). Isi kartu memakai komponen lama dalam mode `tanpaTanya`.
// Mencentang ulang (menutup) kartu yang sudah berisi mengosongkannya, dengan konfirmasi bila ada yang ikut terhapus.

import { useState, type ReactNode } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { calonIbuJanin, namaSingkat } from '../../keadaanOrang';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { LangkahKondisi, adaKondisiTerisi, kosongkanKondisi } from '../LangkahKondisi';
import { PertanyaanHamil, janinBabakDari, tanpaJaninBabak } from './PertanyaanHamil';
import { PertanyaanPenutup, adaKeadaanTerisi, kosongkanKeadaan } from './PertanyaanPenutup';
import { t } from '../../terjemah';

interface Props {
  kasus: Kasus;
  idMayit: IdOrang;
  /** Babak terakhir: hanya di sini kartu beda agama/terlibat wafat tampil (satu kali untuk semua babak). */
  akhir: boolean;
  ubah: (f: (k: Kasus) => Kasus) => void;
}

type Jenis = 'wafat' | 'hamil' | 'agama';
interface RencanaHapus { jenis: Jenis; kasusBaru: Kasus; nama: string[] }

export function KeadaanKeluarga({ kasus, idMayit, akhir, ubah }: Props) {
  const mayit = namaSingkat(kasus, idMayit);
  const terisi: Record<Jenis, boolean> = { wafat: adaKeadaanTerisi(kasus, idMayit), hamil: janinBabakDari(kasus, idMayit).length > 0, agama: adaKondisiTerisi(kasus) };
  const [dibuka, setDibuka] = useState<Record<Jenis, boolean>>(terisi);
  const [rencanaHapus, setRencanaHapus] = useState<RencanaHapus | null>(null);
  const bukaKartu = (jenis: Jenis, buka: boolean) => setDibuka(kini => ({ ...kini, [jenis]: buka }));

  const alihkan = (jenis: Jenis) => {
    if (!dibuka[jenis]) return bukaKartu(jenis, true);
    if (!terisi[jenis]) return bukaKartu(jenis, false);
    if (jenis === 'agama') { ubah(kosongkanKondisi); return bukaKartu(jenis, false); }
    if (jenis === 'hamil') return setRencanaHapus({ jenis, kasusBaru: tanpaJaninBabak(kasus, idMayit), nama: [] });
    const { kasusBaru, terputus } = kosongkanKeadaan(kasus, idMayit);
    if (terputus.length === 0) { ubah(() => kasusBaru); return bukaKartu(jenis, false); }
    setRencanaHapus({ jenis, kasusBaru, nama: terputus.map(id => namaSingkat(kasus, id)) });
  };
  const sepakatHapus = () => {
    if (!rencanaHapus) return;
    ubah(() => rencanaHapus.kasusBaru);
    bukaKartu(rencanaHapus.jenis, false);
    setRencanaHapus(null);
  };

  const tampilHamil = calonIbuJanin(kasus, idMayit).length > 0 || terisi.hamil;
  const tampilAgama = akhir || terisi.agama;
  return (
    <div className="keadaan-khusus" role="group" aria-labelledby="pertanyaan-utama">
      <Kartu buka={dibuka.wafat} label={t('hitung.keadaan_khusus.wafat')} ket={t('hitung.keadaan_khusus.wafat_ket', { nama: mayit })} saatAlih={() => alihkan('wafat')}>
        <PertanyaanPenutup kasus={kasus} idMayit={idMayit} ubah={ubah} tanpaTanya />
      </Kartu>
      {tampilHamil && (
        <Kartu buka={dibuka.hamil} label={t('hitung.keadaan_khusus.hamil')} ket={t('hitung.keadaan_khusus.hamil_ket')} saatAlih={() => alihkan('hamil')}>
          <PertanyaanHamil kasus={kasus} idMayit={idMayit} ubah={ubah} tanpaTanya />
        </Kartu>
      )}
      {tampilAgama && (
        <Kartu buka={dibuka.agama} label={t('hitung.keadaan_khusus.agama', { nama: namaSingkat(kasus, kasus.graf.idPewaris) })} ket={t('hitung.keadaan_khusus.agama_ket')} saatAlih={() => alihkan('agama')}>
          <LangkahKondisi kasus={kasus} ubah={ubah} tanpaTanya />
        </Kartu>
      )}
      {rencanaHapus && (
        <DialogKonfirmasi judul={rencanaHapus.jenis === 'hamil' ? t('hitung.janin.hapus_judul') : t('hitung.penutup.hapus_judul')}
          labelLanjut={t('hitung.penutup.ya_hapus')} saatBatal={() => setRencanaHapus(null)} saatLanjut={sepakatHapus}>
          <p>{rencanaHapus.jenis === 'hamil' ? t('hitung.janin.hapus_isi') : t('hitung.penutup.hapus_isi', { daftar: rencanaHapus.nama.join(', ') })}</p>
        </DialogKonfirmasi>
      )}
    </div>
  );
}

function Kartu({ buka, label, ket, saatAlih, children }: { buka: boolean; label: string; ket: string; saatAlih: () => void; children: ReactNode }) {
  return (
    <div className={buka ? 'kartu-keadaan terbuka' : 'kartu-keadaan'}>
      <button type="button" role="checkbox" aria-checked={buka} className="kartu-keadaan-kepala" onClick={saatAlih}>
        <span className="kotak-centang" aria-hidden="true">
          {buka && <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>}
        </span>
        <span className="kartu-keadaan-teks"><b>{label}</b><small>{ket}</small></span>
      </button>
      {buka && <div className="kartu-keadaan-isi">{children}</div>}
    </div>
  );
}
