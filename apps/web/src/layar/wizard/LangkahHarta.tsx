// Langkah 2: harta peninggalan — total langsung / rinci per jenis, tambah cepat tepat di bawah isian, catatan gono-gini.
// Pembulatan tidak ditanya di sini (bawaan Rp 1); pilihannya muncul di layar hasil hanya bila pembagian menyisakan sisa.

import { useState } from 'react';
import { formatRupiah } from '../../format';
import { KATEGORI_HARTA, type Kasus, type KategoriHarta } from '../../kasus';
import { KATEGORI_HARTA_TEKS, TEKS_HARTA } from '../../konten/harta';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { IsianUang } from './IsianUang';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; ubah: (fungsiUbah: (kasus: Kasus) => Kasus) => void; tandaiKurang?: boolean }

const labelTambahCepat = (nilai: bigint) => t('hitung.jumlah_jt', { jumlah: nilai / 1_000_000n });

export function LangkahHarta({ kasus, ubah, tandaiKurang = false }: Props) {
  const [cara, setCara] = useState<'total' | 'rinci'>(kasus.rincianHarta ? 'rinci' : 'total');
  const [tanyaKosongkan, setTanyaKosongkan] = useState(false);
  const [ketukan, setKetukan] = useState<{ kali: number; tambahan: bigint; total: bigint }>();
  const galatTotal = tandaiKurang && kasus.tirkah.kotor <= 0n ? t('hitung.harta_wajib_isi') : undefined;
  // Ketikan atau kosongkan membuat baris "sekarang ..." basi, jadi dibuang.
  const ketikTotal = (kotor: bigint) => { setKetukan(undefined); aturTotal(kotor); };
  const tambahCepat = (nilai: bigint) => {
    const total = kasus.tirkah.kotor + nilai;
    setKetukan(sebelumnya => ({ kali: (sebelumnya?.kali ?? 0) + 1, tambahan: nilai, total }));
    aturTotal(total);
  };
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
          <h2 id="judul-total-harta">{t('hitung.total_harta')}</h2>
          <div className="tab-kecil" role="tablist" aria-label={t('hitung.cara_mengisi_harta')}>
            <button type="button" role="tab" aria-selected={cara === 'total'} onClick={() => setCara('total')}>{t('hitung.total_langsung')}</button>
            <button type="button" role="tab" aria-selected={cara === 'rinci'} onClick={() => setCara('rinci')}>{t('hitung.rinci_per_jenis')}</button>
          </div>
        </div>

        {cara === 'total' ? (
          <div className="tumpuk-rapat">
            <IsianUang id="harta-total" label={t('hitung.total_harta_peninggalan')} besar nilai={kasus.tirkah.kotor} saatUbah={ketikTotal}
              info={TEKS_HARTA.presisi} galat={galatTotal} ketukan={ketukan && { kali: ketukan.kali, label: labelTambahCepat(ketukan.tambahan) }} />
            <div className="tambah-cepat" aria-label={t('hitung.tambah_cepat')}>
              <span className="caption-isian">{t('hitung.tambah_cepat')}</span>
              {TEKS_HARTA.tambahCepat.map(nilai => (
                <button key={String(nilai)} type="button" className="chip-kecil" onClick={() => tambahCepat(nilai)}>
                  {labelTambahCepat(nilai)}
                </button>
              ))}
              {kasus.tirkah.kotor > 0n && <button type="button" className="chip-kecil hapus" onClick={() => setTanyaKosongkan(true)}>{t('hitung.kosongkan')}</button>}
              {ketukan && <p className="caption-isian baris-ketukan" role="status" aria-live="polite">
                {t('hitung.tambah_cepat_info', { tambahan: t('hitung.tambahan_jt', { jumlah: ketukan.tambahan / 1_000_000n }), total: formatRupiah(ketukan.total) })}</p>}
              {tanyaKosongkan && (
                <DialogKonfirmasi judul={t('hitung.kosongkan_total_harta')} labelLanjut={t('hitung.kosongkan')} saatBatal={() => setTanyaKosongkan(false)}
                  saatLanjut={() => { setTanyaKosongkan(false); ketikTotal(0n); }}>
                  <p>{t('hitung.total_jumlah_akan_dihapus_dan_perlu', { jumlah: formatRupiah(kasus.tirkah.kotor) })}</p>
                </DialogKonfirmasi>
              )}
            </div>
          </div>
        ) : (
          <div className="rincian-harta">
            {KATEGORI_HARTA.map((kategori, indeks) => (
              <IsianUang key={kategori} galat={indeks === 0 ? galatTotal : undefined} id={`harta-${kategori}`} label={KATEGORI_HARTA_TEKS[kategori].label}
                nilai={kasus.rincianHarta?.[kategori] ?? 0n} saatUbah={jumlah => aturRincian(kategori, jumlah)}
                info={KATEGORI_HARTA_TEKS[kategori].contoh} />
            ))}
            <div className="total-rincian"><span>{t('hitung.total_harta_peninggalan')}</span><b>{formatRupiah(kasus.tirkah.kotor)}</b></div>
          </div>
        )}

        <p className="catatan-info">{TEKS_HARTA.gonoGini}</p>
      </section>

    </>
  );
}
