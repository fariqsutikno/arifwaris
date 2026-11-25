// Kartu "Sudah ada yang menerima sebagian?" di bawah daftar pembagian (bab 11.3 [KH], mockup-harta-sebagian.html).
// Menerima: hasil engine OK, tirkah bersih awal, dan daftar penerima. Isian per ahli waris disimpan di `Kasus.sudahDiterima` (spec 7b bagian 6),
// jadi bertahan setelah muat ulang dan ganti madzhab; kartu hanya menampilkan hasil hitungSisaHak dari Hasil. Hanya "bagian warisan di muka" yang dihitung; hibah dan pinjaman tidak
// didukung (riset-harta-sebagian.md), jadi petunjuknya melarang mengisinya. Kelebihan hanya ditampilkan, tanpa saran pengembalian.

import type { hitungSisaHak, IdOrang, SisaHak } from '@waris/engine';
import { useState } from 'react';
import { formatRupiah } from '../format';
import type { Kasus } from '../kasus';
import { Ikon } from '../ui/Ikon';
import { t } from '../terjemah';

interface Props {
  /** Hasil hitungSisaHak (dihitung di Hasil agar jejaknya bisa ke Periksa). */
  sisa: ReturnType<typeof hitungSisaHak>;
  sudahDiterima: Record<IdOrang, bigint>;
  /** `jumlah` 0n = hapus isian. */
  saatUbah: (id: IdOrang, jumlah: bigint) => void;
  penerima: Array<{ id: string; nama: string }>;
}

/** Ganti satu isian; kosong dibuang, dan bila tak ada isian sama sekali bidangnya hilang (perilaku lama tanpa regresi). */
export function ubahDiterima(lama: Record<IdOrang, bigint> | undefined, id: IdOrang, jumlah: bigint): Record<IdOrang, bigint> | undefined {
  const { [id]: _dibuang, ...sisaIsian } = lama ?? {};
  const baru = jumlah > 0n ? { ...sisaIsian, [id]: jumlah } : sisaIsian;
  return Object.keys(baru).length > 0 ? baru : undefined;
}

/** Terapkan ke Kasus tanpa meninggalkan `sudahDiterima: undefined` (exactOptionalPropertyTypes). */
export function ubahKasusDiterima(kasus: Kasus, id: IdOrang, jumlah: bigint): Kasus {
  const { sudahDiterima: lama, ...lain } = kasus;
  const baru = ubahDiterima(lama, id, jumlah);
  return baru ? { ...lain, sudahDiterima: baru } : lain;
}

export function SisaHakKartu({ sisa, sudahDiterima, saatUbah, penerima }: Props) {
  const [terbuka, setTerbuka] = useState(false);
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
                  <input id={`sisa-hak-${orang.id}`} inputMode="numeric" placeholder="0" value={tampilkan(sudahDiterima[orang.id])}
                    onChange={event => saatUbah(orang.id, BigInt(event.target.value.replace(/\D/g, '') || '0'))} />
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

/** Jumlah → tampilan dengan titik ribuan; kosong tetap kosong. */
const tampilkan = (jumlah: bigint | undefined): string => (jumlah ? jumlah.toLocaleString('id-ID') : '');
