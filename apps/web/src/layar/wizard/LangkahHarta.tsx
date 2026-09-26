// Langkah 2: harta peninggalan — total langsung / rinci per jenis, tambah cepat tepat di bawah isian, catatan gono-gini.
// Pembulatan tidak ditanya di sini (bawaan Rp 1); pilihannya muncul di layar hasil hanya bila pembagian menyisakan sisa.

import { useState } from 'react';
import { formatRupiah } from '../../format';
import { KATEGORI_HARTA, type Kasus, type KategoriHarta } from '../../kasus';
import { KATEGORI_HARTA_TEKS, TEKS_HARTA } from '../../konten/harta';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { IsianUang } from './IsianUang';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; ubah: (fungsiUbah: (kasus: Kasus) => Kasus) => void }

const labelTambahCepat = (nilai: bigint) => t('+{jumlah} jt', { jumlah: nilai / 1_000_000n });

export function LangkahHarta({ kasus, ubah }: Props) {
  const [cara, setCara] = useState<'total' | 'rinci'>(kasus.rincianHarta ? 'rinci' : 'total');
  const [tanyaKosongkan, setTanyaKosongkan] = useState(false);
  const aturTotal = (kotor: bigint) => ubah(k => {
    const { rincianHarta: _rincian, ...tanpaRincian } = k;
    return { ...tanpaRincian, tirkah: { ...k.tirkah, kotor } };
  });
  const aturRincian = (kategori: KategoriHarta, jumlah: bigint) => ubah(k => {
    const rincianHarta = { ...k.rincianHarta, [kategori]: jumlah };
    if (jumlah === 0n) delete rincianHarta[kategori];
    const kotor = Object.values(rincianHarta).reduce((total, nilai) => total + nilai, 0n);
    return { ...k, rincianHarta, tirkah: { ...k.tirkah, kotor } };
  });

  return (
    <>
      <section className="grup-isian" aria-labelledby="judul-total-harta">
        <div className="kepala-grup">
          <h2 id="judul-total-harta">{t('Total harta')}</h2>
          <div className="tab-kecil" role="tablist" aria-label={t('Cara mengisi harta')}>
            <button type="button" role="tab" aria-selected={cara === 'total'} onClick={() => setCara('total')}>{t('Total langsung')}</button>
            <button type="button" role="tab" aria-selected={cara === 'rinci'} onClick={() => setCara('rinci')}>{t('Rinci per jenis')}</button>
          </div>
        </div>

        {cara === 'total' ? (
          <div className="tumpuk-rapat">
            <IsianUang id="harta-total" label={t('Total harta peninggalan')} besar nilai={kasus.tirkah.kotor} saatUbah={aturTotal}
              info={TEKS_HARTA.presisi} />
            <div className="tambah-cepat" aria-label={t('Tambah cepat')}>
              <span className="caption-isian">{t('Tambah cepat')}</span>
              {TEKS_HARTA.tambahCepat.map(nilai => (
                <button key={String(nilai)} type="button" className="chip-kecil" onClick={() => aturTotal(kasus.tirkah.kotor + nilai)}>
                  {labelTambahCepat(nilai)}
                </button>
              ))}
              {kasus.tirkah.kotor > 0n && <button type="button" className="chip-kecil hapus" onClick={() => setTanyaKosongkan(true)}>{t('Kosongkan')}</button>}
              {tanyaKosongkan && (
                <DialogKonfirmasi judul={t('Kosongkan total harta?')} labelLanjut={t('Kosongkan')} saatBatal={() => setTanyaKosongkan(false)}
                  saatLanjut={() => { setTanyaKosongkan(false); aturTotal(0n); }}>
                  <p>{t('Total {jumlah} akan dihapus dan perlu diisi ulang.', { jumlah: formatRupiah(kasus.tirkah.kotor) })}</p>
                </DialogKonfirmasi>
              )}
            </div>
          </div>
        ) : (
          <div className="rincian-harta">
            {KATEGORI_HARTA.map(kategori => (
              <IsianUang key={kategori} id={`harta-${kategori}`} label={KATEGORI_HARTA_TEKS[kategori].label}
                nilai={kasus.rincianHarta?.[kategori] ?? 0n} saatUbah={jumlah => aturRincian(kategori, jumlah)}
                info={KATEGORI_HARTA_TEKS[kategori].contoh} />
            ))}
            <div className="total-rincian"><span>{t('Total harta peninggalan')}</span><b>{formatRupiah(kasus.tirkah.kotor)}</b></div>
          </div>
        )}

        <p className="catatan-info">{TEKS_HARTA.gonoGini}</p>
      </section>

    </>
  );
}
