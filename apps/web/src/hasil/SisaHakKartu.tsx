// Kartu "Sudah ada yang menerima sebagian?" di bawah daftar pembagian (bab 11.3 [KH], mockup-harta-sebagian.html).
// Menerima: hasil engine OK, tirkah bersih awal, dan daftar penerima. Isian per ahli waris disimpan lokal (tidak tersimpan ke kasus):
// ini alat bantu menghitung sisa, bukan bagian dari hukum. Hanya "bagian warisan di muka" yang dihitung; hibah dan pinjaman tidak
// didukung (riset-harta-sebagian.md), jadi petunjuknya melarang mengisinya. Kelebihan hanya ditampilkan, tanpa saran pengembalian.

import { hitungSisaHak, type SisaHak, type SumberNominal } from '@waris/engine';
import { useMemo, useState } from 'react';
import { formatRupiah } from '../format';
import { Ikon } from '../ui/Ikon';
import { t } from '../terjemah';

interface Props {
  hasil: SumberNominal;
  /** Tirkah bersih AWAL: termasuk yang sudah diserahkan. */
  bersih: bigint;
  penerima: Array<{ id: string; nama: string }>;
}

export function SisaHakKartu({ hasil, bersih, penerima }: Props) {
  const [terbuka, setTerbuka] = useState(false);
  const [isian, setIsian] = useState<Record<string, string>>({});
  const sudahDiterima = useMemo(() => {
    const diterima: Record<string, bigint> = {};
    for (const [id, digit] of Object.entries(isian)) if (digit !== '' && BigInt(digit) > 0n) diterima[id] = BigInt(digit);
    return diterima;
  }, [isian]);
  const sisa = useMemo(() => hitungSisaHak(hasil, bersih, sudahDiterima), [hasil, bersih, sudahDiterima]);
  const namaDari = (id: string) => penerima.find(orang => orang.id === id)?.nama ?? id;

  if (penerima.length === 0) return null;
  return (
    <section className="ubin-h sisa-hak" aria-labelledby="judul-sisa-hak">
      <button type="button" className="tautan-aksi" aria-expanded={terbuka} onClick={() => setTerbuka(!terbuka)}>
        <span id="judul-sisa-hak">{t('hasil.sisa_hak.tautan')}</span><Ikon nama="bawah" ukuran={16} />
      </button>
      {terbuka && (
        <div className="isi-sisa-hak">
          <p className="sub-kartu">{t('hasil.sisa_hak.petunjuk')}</p>
          <ul className="isian-sisa-hak">
            {penerima.map(orang => (
              <li key={orang.id}>
                <label htmlFor={`sisa-hak-${orang.id}`}>{orang.nama}</label>
                <span className="kotak-rupiah"><span aria-hidden="true">Rp</span>
                  <input id={`sisa-hak-${orang.id}`} inputMode="numeric" placeholder="0" value={tampilkan(isian[orang.id])}
                    onChange={event => setIsian({ ...isian, [orang.id]: event.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '') })} />
                </span>
              </li>
            ))}
          </ul>
          {sisa.status === 'OK' ? <TabelSisa sisa={sisa} penerima={penerima} namaDari={namaDari} />
            : <ul role="alert" className="galat-sisa-hak">{sisa.pertanyaan.map((pertanyaan, indeks) => <li key={indeks}>{pertanyaan.alasan}</li>)}</ul>}
        </div>
      )}
    </section>
  );
}

function TabelSisa({ sisa, penerima, namaDari }: { sisa: SisaHak; penerima: Props['penerima']; namaDari: (id: string) => string }) {
  return (
    <>
      <table className="tabel-sisa-hak">
        <thead><tr><th scope="col">{t('hasil.sisa_hak.kolom_orang')}</th><th scope="col">{t('hasil.sisa_hak.kolom_bagian')}</th>
          <th scope="col">{t('hasil.sisa_hak.kolom_diterima')}</th><th scope="col">{t('hasil.sisa_hak.kolom_sisa')}</th></tr></thead>
        <tbody>
          {penerima.map(({ id, nama }) => {
            const baris = sisa.perOrang[id];
            if (!baris) return null;
            const lebih = baris.sisaHak < 0n;
            return (
              <tr key={id}>
                <th scope="row">{nama}</th><td>{formatRupiah(baris.nominal)}</td>
                <td>{baris.sudahDiterima > 0n ? formatRupiah(baris.sudahDiterima) : '-'}</td>
                <td className={lebih ? 'lebih' : 'sisa'}>{lebih ? t('hasil.sisa_hak.kelebihan', { jumlah: formatRupiah(-baris.sisaHak) }) : formatRupiah(baris.sisaHak)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="catatan-sisa-hak">{t('hasil.sisa_hak.sisa_kas', { jumlah: formatRupiah(sisa.sisaKas) })}</p>
      {sisa.kelebihan.length > 0 && <p className="catatan-sisa-hak peringatan">{t('hasil.sisa_hak.catatan_kelebihan', { nama: sisa.kelebihan.map(namaDari).join(', ') })}</p>}
      {sisa.kasKurang && <p className="catatan-sisa-hak peringatan">{t('hasil.sisa_hak.kas_kurang')}</p>}
    </>
  );
}

/** Digit mentah → tampilan dengan titik ribuan; kosong tetap kosong. */
const tampilkan = (digit: string | undefined): string => (digit ? BigInt(digit).toLocaleString('id-ID') : '');
