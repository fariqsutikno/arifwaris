// Bagian bawah langkah Harta: "Ada utang, biaya pemakaman, atau wasiat?". Bawaan "Tidak ada" (kasus biasa tidak bertambah isian);
// "Ada" membuka isian LangkahKewajiban. Kembali ke "Tidak ada" saat sudah ada isian: tanya dulu, lalu nolkan ketiganya.

import { useState } from 'react';
import type { Kasus } from '../../kasus';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { LangkahKewajiban } from './LangkahKewajiban';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; ubah: (fungsiUbah: (kasus: Kasus) => Kasus) => void }

const adaIsian = (kasus: Kasus): boolean => kasus.tirkah.tajhiz > 0n || kasus.tirkah.hutang > 0n || kasus.tirkah.wasiat > 0n;

export function KewajibanOpsional({ kasus, ubah }: Props) {
  const [ada, setAda] = useState(adaIsian(kasus));
  const [tanyaHapus, setTanyaHapus] = useState(false);
  const pilihTidakAda = () => (adaIsian(kasus) ? setTanyaHapus(true) : setAda(false));
  const hapus = () => {
    setTanyaHapus(false);
    setAda(false);
    ubah(k => ({ ...k, tirkah: { ...k.tirkah, tajhiz: 0n, hutang: 0n, wasiat: 0n } }));
  };
  return (
    <section className="tumpuk" aria-labelledby="tanya-kewajiban">
      <h2 id="tanya-kewajiban" className="judul-bagian-kecil">{t('hitung.ada_kewajiban_tanya')}</h2>
      <div className="kartu-pilihan-deret ringkas" role="radiogroup" aria-labelledby="tanya-kewajiban">
        <button type="button" role="radio" aria-checked={!ada} className="kartu-pilihan kecil" onClick={pilihTidakAda}><span>{t('umum.tidak_ada')}</span></button>
        <button type="button" role="radio" aria-checked={ada} className="kartu-pilihan kecil" onClick={() => setAda(true)}><span>{t('umum.ada')}</span></button>
      </div>
      {ada && <p className="pengantar-kewajiban">{t('hitung.kewajiban_pengantar')}</p>}
      {ada && <LangkahKewajiban kasus={kasus} ubah={ubah} />}
      {tanyaHapus && (
        <DialogKonfirmasi judul={t('hitung.hapus_kewajiban_judul')} labelLanjut={t('hitung.kosongkan')} saatBatal={() => setTanyaHapus(false)} saatLanjut={hapus}>
          <p>{t('hitung.hapus_kewajiban_isi')}</p>
        </DialogKonfirmasi>
      )}
    </section>
  );
}
