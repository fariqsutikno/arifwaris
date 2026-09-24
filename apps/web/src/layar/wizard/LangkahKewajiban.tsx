// Langkah 3: potongan sebelum harta dibagi, berurutan (jenazah → hutang → wasiat), masing-masing dengan alasannya.
// Hitungan berjalan "yang akan dibagi" diambil dari hitungTirkah engine, termasuk pemangkasan wasiat di atas 1/3.

import { hitungTirkah } from '@waris/engine';
import { formatRupiah } from '../../format';
import type { Kasus } from '../../kasus';
import { TEKS_KEWAJIBAN } from '../../konten/harta';
import { IsianUang } from './IsianUang';

interface Props { kasus: Kasus; ubah: (fungsiUbah: (kasus: Kasus) => Kasus) => void }

export function LangkahKewajiban({ kasus, ubah }: Props) {
  const { jejak } = hitungTirkah(kasus.tirkah);
  const nilaiUntuk = { tajhiz: jejak.tajhiz, hutang: jejak.hutang, wasiat: jejak.wasiatDipakai };
  return (
    <>
      <ol className="urutan-kewajiban">
        {TEKS_KEWAJIBAN.urutan.map(({ kunci, label, alasan }) => (
          <li key={kunci}>
            <IsianUang id={`kewajiban-${kunci}`} label={label} nilai={kasus.tirkah[kunci]} keterangan={alasan}
              saatUbah={nilai => ubah(k => ({ ...k, tirkah: { ...k.tirkah, [kunci]: nilai } }))} />
            {kunci === 'wasiat' && jejak.wasiatButuhIjazah > 0n && (
              <p className="peringatan-isian" role="status">
                Wasiat dipangkas jadi {formatRupiah(jejak.wasiatDipakai)} (batas 1/3). Kelebihan {formatRupiah(jejak.wasiatButuhIjazah)} hanya
                berlaku kalau semua ahli waris setuju.
              </p>
            )}
          </li>
        ))}
      </ol>
      <p className="caption-isian">{TEKS_KEWAJIBAN.kosong}</p>

      <div className="hitungan-berjalan" aria-live="polite">
        <div><span>Harta peninggalan</span><span>{formatRupiah(jejak.kotor)}</span></div>
        {TEKS_KEWAJIBAN.urutan.map(({ kunci, label }) => (
          <div key={kunci} className="potongan"><span>{label}</span><span>−{formatRupiah(nilaiUntuk[kunci])}</span></div>
        ))}
        <div className="garis-total"><b>Yang akan dibagi ke ahli waris</b><b className="hitungan-total">{formatRupiah(jejak.bersih)}</b></div>
      </div>
    </>
  );
}
