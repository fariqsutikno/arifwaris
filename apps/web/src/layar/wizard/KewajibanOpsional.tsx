// Bagian bawah langkah Harta: utang, biaya pemakaman, atau wasiat. Hanya sebagian kasus punya ini, jadi bawaannya cuma satu tautan
// pelan "+ Ada utang, biaya pemakaman, atau wasiat?" (tanpa pertanyaan ya/tidak yang menuntut keputusan). Dibuka = isian
// LangkahKewajiban; ditutup lagi saat sudah ada isian: tanya dulu, lalu nolkan ketiganya.

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
  const tutup = () => (adaIsian(kasus) ? setTanyaHapus(true) : setAda(false));
  const hapus = () => {
    setTanyaHapus(false);
    setAda(false);
    ubah(k => ({ ...k, tirkah: { ...k.tirkah, tajhiz: 0n, hutang: 0n, wasiat: 0n } }));
  };
  if (!ada) {
    return (
      <button type="button" className="tautan-tambah" aria-expanded={false} onClick={() => setAda(true)}>
        <span className="plus-tambah" aria-hidden="true">+</span>{t('hitung.kewajiban.tambah')}
      </button>
    );
  }
  return (
    <section className="tumpuk" aria-labelledby="tanya-kewajiban">
      <h2 id="tanya-kewajiban" className="judul-bagian-kecil">{t('hitung.ada_kewajiban_tanya')}</h2>
      <p className="catatan">{t('hitung.kewajiban_pengantar')}</p>
      <LangkahKewajiban kasus={kasus} ubah={ubah} />
      <button type="button" className="tautan-aksi tautan-sebaris" onClick={tutup}>{t('hitung.kewajiban.tutup')}</button>
      {tanyaHapus && (
        <DialogKonfirmasi judul={t('hitung.hapus_kewajiban_judul')} labelLanjut={t('hitung.kosongkan')} saatBatal={() => setTanyaHapus(false)} saatLanjut={hapus}>
          <p>{t('hitung.hapus_kewajiban_isi')}</p>
        </DialogKonfirmasi>
      )}
    </section>
  );
}
