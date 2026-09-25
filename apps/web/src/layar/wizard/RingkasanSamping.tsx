// Ringkasan kasus di samping langkah wizard (desktop saja): apa yang sudah diisi sejauh ini,
// supaya layar tidak terasa kosong dan pengguna tahu posisinya. Angka "yang dibagi" dari hitungTirkah engine.

import { hitungTirkah, type IdOrang } from '@waris/engine';
import { hitungIsian } from '../../checklist';
import { formatRupiah } from '../../format';
import type { Kasus } from '../../kasus';
import { labelOrangChecklist } from '../LangkahAhliWaris';

export function RingkasanSamping({ kasus }: { kasus: Kasus | null }) {
  const pewaris = kasus?.graf.orang[kasus.graf.idPewaris];
  const tirkah = kasus ? hitungTirkah(kasus.tirkah).jejak : null;
  const ahliWaris = kasus ? Object.values(hitungIsian(kasus.graf, kasus.graf.idPewaris)).flat() as IdOrang[] : [];
  const kondisi = kasus ? kasus.urutanWafat.length + ahliWaris.filter(id => kasus.graf.orang[id]!.agama === 'nonIslam' || kasus.graf.orang[id]!.membunuhPewaris).length : 0;
  return (
    <div className="ringkasan-samping">
      <h2>Ringkasan kasus</h2>
      <dl>
        <Baris label="Pewaris" terisi={!!pewaris}>
          {pewaris ? `${pewaris.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}${pewaris.nama ? ` · ${pewaris.nama}` : ''}` : 'Belum dipilih'}
        </Baris>
        <Baris label="Harta peninggalan" terisi={!!tirkah && tirkah.kotor > 0n}>{tirkah && tirkah.kotor > 0n ? formatRupiah(tirkah.kotor) : 'Belum diisi'}</Baris>
        {tirkah && tirkah.kotor > 0n && (
          <Baris label="Yang akan dibagi" terisi>{formatRupiah(tirkah.bersih)}</Baris>
        )}
        <Baris label="Ahli waris" terisi={ahliWaris.length > 0}>
          {ahliWaris.length === 0 ? 'Belum ada' : (
            <ul>{ahliWaris.map(id => <li key={id}>{labelOrangChecklist(kasus!.graf, kasus!.graf.idPewaris, id)}</li>)}</ul>
          )}
        </Baris>
        <Baris label="Kondisi khusus" terisi={kondisi > 0}>{kondisi > 0 ? `${kondisi} dicatat` : 'Tidak ada'}</Baris>
      </dl>
    </div>
  );
}

function Baris({ label, terisi, children }: { label: string; terisi: boolean; children: React.ReactNode }) {
  return (
    <div className={terisi ? 'baris-ringkas terisi' : 'baris-ringkas'}>
      <dt><span className="tanda-ringkas" aria-hidden="true">{terisi ? '✓' : ''}</span>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
