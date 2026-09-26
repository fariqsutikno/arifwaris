// Ringkasan kasus di samping langkah wizard (desktop saja): apa yang sudah diisi sejauh ini,
// supaya layar tidak terasa kosong dan pengguna tahu posisinya. Angka "yang dibagi" dari hitungTirkah engine.

import { hitungTirkah, type IdOrang } from '@waris/engine';
import { hitungIsian } from '../../checklist';
import { formatRupiah } from '../../format';
import type { Kasus } from '../../kasus';
import { labelOrangChecklist } from '../LangkahAhliWaris';
import { t } from '../../terjemah';

export function RingkasanSamping({ kasus }: { kasus: Kasus | null }) {
  const pewaris = kasus?.graf.orang[kasus.graf.idPewaris];
  const tirkah = kasus ? hitungTirkah(kasus.tirkah).jejak : null;
  const ahliWaris = kasus ? Object.values(hitungIsian(kasus.graf, kasus.graf.idPewaris)).flat() as IdOrang[] : [];
  const kondisi = kasus ? kasus.urutanWafat.length + ahliWaris.filter(id => kasus.graf.orang[id]!.agama === 'nonIslam' || kasus.graf.orang[id]!.membunuhPewaris).length : 0;
  return (
    <div className="ringkasan-samping">
      <h2>{t('Ringkasan kasus')}</h2>
      <dl>
        <Baris label={t('Almarhum')} terisi={!!pewaris}>
          {pewaris ? `${pewaris.jenisKelamin === 'L' ? t('Laki-laki') : t('Perempuan')}${pewaris.nama ? ` · ${pewaris.nama}` : ''}` : t('Belum dipilih')}
        </Baris>
        <Baris label={t('Harta peninggalan')} terisi={!!tirkah && tirkah.kotor > 0n}>{tirkah && tirkah.kotor > 0n ? formatRupiah(tirkah.kotor) : t('Belum diisi')}</Baris>
        {tirkah && tirkah.kotor > 0n && (
          <Baris label={t('Yang akan dibagi')} terisi>{formatRupiah(tirkah.bersih)}</Baris>
        )}
        <Baris label={t('Ahli waris')} terisi={ahliWaris.length > 0}>
          {ahliWaris.length === 0 ? t('Belum ada') : (
            <ul>{barisAhliWaris(kasus!).map(teks => <li key={teks}>{teks}</li>)}</ul>
          )}
        </Baris>
        <Baris label={t('Kondisi khusus')} terisi={kondisi > 0}>{kondisi > 0 ? `${kondisi} dicatat` : t('Tidak ada')}</Baris>
      </dl>
    </div>
  );
}

/** Yang tanpa nama dan sepengan digabung ("Anak perempuan ×2"); yang bernama tetap per orang. */
function barisAhliWaris(kasus: Kasus): string[] {
  const { graf } = kasus;
  return Object.entries(hitungIsian(graf, graf.idPewaris)).flatMap(([, ids = []]) => {
    const tanpaNama = ids.filter(id => !graf.orang[id]!.nama && !graf.orang[id]!.penghubung);
    const lainnya = ids.filter(id => !tanpaNama.includes(id)).map(id => labelOrangChecklist(graf, graf.idPewaris, id));
    if (tanpaNama.length === 0) return lainnya;
    const label = labelOrangChecklist(graf, graf.idPewaris, tanpaNama[0]!).replace(/ \d+$/, '');
    return [tanpaNama.length > 1 ? `${label} ×${tanpaNama.length}` : label, ...lainnya];
  });
}

function Baris({ label, terisi, children }: { label: string; terisi: boolean; children: React.ReactNode }) {
  return (
    <div className={terisi ? 'baris-ringkas terisi' : 'baris-ringkas'}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
