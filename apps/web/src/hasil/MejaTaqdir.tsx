// Meja kemungkinan untuk taqdir (haml, mafqud, khuntsa): tiap "dunia" (jika terbukti X) = satu batang berisi saham tiap orang
// pada jami'ah yang sama; dunia yang sedang dibahas disorot. Warna orang = warna di pohon/kotak (warnaOrang).

import type { Visual } from '@waris/explain';
import type { RingkasanHasil } from './ringkasan';
import { warnaPeraga } from './warnaOrang';
import { angka, t } from '../terjemah';

type VisualMeja = Extract<Visual, { jenis: 'meja' }>;

export function MejaTaqdir({ visual, ringkasan, sebutan }: { visual: VisualMeja; ringkasan: RingkasanHasil; sebutan?: Record<string, string> | undefined }) {
  const jamiah = Number(visual.jamiah);
  const nama = (id: string) => sebutan?.[id] ?? ringkasan.penerima.find(orang => orang.id === id)?.nama ?? id;
  return (
    <div className="meja-taqdir">
      {visual.dunia.map((dunia, urut) => (
        <div key={urut} className={['dunia', visual.sorot === urut && 'sorot'].filter(Boolean).join(' ')} aria-current={visual.sorot === urut || undefined}>
          <b>{t('langkah.dunia_ke', { nomor: angka(String(urut + 1)) })}</b>
          <div className="batang-dunia" role="img" aria-label={dunia.isi.map(isi => t('langkah.isi_kotak', { nama: nama(isi.anggota[0]!), jumlah: angka(`${isi.jumlah}/${visual.jamiah}`) })).join(', ')}>
            {dunia.isi.map(isi => (
              <i key={isi.kelompok} data-orang={isi.anggota.join(' ')} title={nama(isi.anggota[0]!)}
                className={isi.kelompok === 'ditahan' ? 'ditahan' : undefined}
                style={{ flex: Number(isi.jumlah) / jamiah, background: warnaPeraga(ringkasan, isi.anggota[0]!, nama(isi.anggota[0]!)) }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
