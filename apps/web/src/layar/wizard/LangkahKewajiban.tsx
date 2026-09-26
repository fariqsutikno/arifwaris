// Langkah 3: dua kelompok. (1) "Dibayar dulu dari harta": jenazah → hutang → wasiat, berurutan, alasan di balik ikon ⓘ.
// (2) "Yang akan dibagi": hitungan berjalan dari hitungTirkah engine, termasuk pemangkasan wasiat di atas 1/3.

import { hitungTirkah } from '@waris/engine';
import { formatRupiah } from '../../format';
import type { Kasus } from '../../kasus';
import { TEKS_KEWAJIBAN } from '../../konten/harta';
import { IsianUang } from './IsianUang';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; ubah: (fungsiUbah: (kasus: Kasus) => Kasus) => void }

export function LangkahKewajiban({ kasus, ubah }: Props) {
  const { jejak } = hitungTirkah(kasus.tirkah);
  const nilaiUntuk = { tajhiz: jejak.tajhiz, hutang: jejak.hutang, wasiat: jejak.wasiatDipakai };
  return (
    <div className="dua-kolom-isian">
      <section className="grup-isian" aria-labelledby="judul-potongan">
        <div className="kepala-grup">
          <h2 id="judul-potongan">{t('Dibayar dulu dari harta')}</h2>
        </div>
        <p className="caption-isian">{t('Berurutan dari atas.')} {TEKS_KEWAJIBAN.kosong}</p>
        <ol className="urutan-kewajiban">
          {TEKS_KEWAJIBAN.urutan.map(({ kunci, label, alasan }) => (
            <li key={kunci}>
              <IsianUang id={`kewajiban-${kunci}`} label={label} nilai={kasus.tirkah[kunci]} info={alasan}
                {...(kunci === 'wasiat' ? { keterangan: t('Maks. {batas} (1/3 dari sisa setelah hutang).', { batas: formatRupiah(jejak.wasiatBatas) }) } : {})}
                saatUbah={nilai => ubah(k => ({ ...k, tirkah: { ...k.tirkah, [kunci]: nilai } }))} />
              {kunci === 'wasiat' && jejak.wasiatButuhIjazah > 0n && (
                <p className="peringatan-isian" role="status">
                  {t('Wasiat dipangkas jadi {dipakai} (batas 1/3). Kelebihan {lebih} hanya berlaku kalau semua ahli waris setuju.',
                    { dipakai: formatRupiah(jejak.wasiatDipakai), lebih: formatRupiah(jejak.wasiatButuhIjazah) })}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="grup-isian ringkas-hitung" aria-labelledby="judul-dibagi">
        <div className="kepala-grup"><h2 id="judul-dibagi">{t('Yang akan dibagi')}</h2></div>
        <div className="hitungan-berjalan" aria-live="polite">
          <div><span>{t('Harta peninggalan')}</span><span>{formatRupiah(jejak.kotor)}</span></div>
          {TEKS_KEWAJIBAN.urutan.map(({ kunci, label }) => (
            <div key={kunci} className="potongan"><span>{label}</span><span>−{formatRupiah(nilaiUntuk[kunci])}</span></div>
          ))}
          <div className="garis-total"><b>{t('Untuk ahli waris')}</b><b className="hitungan-total">{formatRupiah(jejak.bersih)}</b></div>
        </div>
      </section>
    </div>
  );
}
