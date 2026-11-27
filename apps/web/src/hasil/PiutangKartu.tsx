// Kartu "Ada ahli waris yang punya hutang ke almarhum?" di bawah kartu sisa hak (bab 11.4 [R11-4], hanya [SYF]).
// Menerima: hasil engine OK yang dihitung atas tirkah bersih (sudah termasuk piutang) dan daftar penerima.
// Pengguna mengisi hutang per ahli waris dan apakah ia setuju dipotong; piutang total = Σ hutang, barang = tirkah − piutang.
// Isian lokal dan terpisah dari kartu sisa hak: itu uang diterima di muka, ini utang. Keadaan S dan H dijelaskan dalam bahasa awam.

import { hitungPiutangAhliWaris, type PenghutangAhliWaris, type PersetujuanPemotongan } from '@waris/engine';
import type { HasilOk } from '@waris/latihan';
import { useMemo, useState } from 'react';
import { formatRupiah } from '../format';
import { Ikon } from '../ui/Ikon';
import { t } from '../terjemah';

interface Props {
  hasil: HasilOk;
  /** Tirkah bersih yang dihitung hasil: barang + piutang. */
  bersih: bigint;
  penerima: Array<{ id: string; nama: string }>;
}

// Kunci diksi ditulis literal (tes diksi melarang t() dinamis).
const OPSI: Array<{ nilai: PersetujuanPemotongan; teks: () => string }> = [
  { nilai: 'setuju', teks: () => t('hasil.piutang.opsi_setuju') },
  { nilai: 'menolakAtauPailit', teks: () => t('hasil.piutang.opsi_menolak') },
  { nilai: 'mengakuiMampuTidakSetuju', teks: () => t('hasil.piutang.opsi_tidak_setuju') },
];

export function PiutangKartu({ hasil, bersih, penerima }: Props) {
  const [terbuka, setTerbuka] = useState(false);
  const [isian, setIsian] = useState<Record<string, string>>({});
  const [persetujuan, setPersetujuan] = useState<Record<string, PersetujuanPemotongan>>({});
  const penghutang = useMemo<PenghutangAhliWaris[]>(() => penerima
    .filter(({ id }) => isian[id] && BigInt(isian[id]!) > 0n)
    .map(({ id }) => ({ idOrang: id, hutangKePewaris: BigInt(isian[id]!), ...(persetujuan[id] && { persetujuan: persetujuan[id] }) })), [penerima, isian, persetujuan]);
  const piutang = penghutang.reduce((jumlah, orang) => jumlah + orang.hutangKePewaris, 0n);
  const hasilPiutang = useMemo(
    () => (penghutang.length > 0 && piutang <= bersih ? hitungPiutangAhliWaris(hasil, bersih - piutang, piutang, penghutang) : null),
    [hasil, bersih, piutang, penghutang]);
  const namaDari = (id: string) => penerima.find(orang => orang.id === id)?.nama ?? id;

  if (penerima.length === 0) return null;
  return (
    <section className="ubin-h piutang-ahli-waris" aria-labelledby="judul-piutang">
      <button type="button" className="tautan-aksi" aria-expanded={terbuka} onClick={() => setTerbuka(!terbuka)}>
        <span id="judul-piutang">{t('hasil.piutang.tautan')}</span><Ikon nama="bawah" ukuran={16} />
      </button>
      {terbuka && (
        <div className="isi-sisa-hak">
          <p className="sub-kartu">{t('hasil.piutang.petunjuk')}</p>
          <ul className="isian-sisa-hak">
            {penerima.map(({ id, nama }) => (
              <li key={id} className="isian-piutang">
                <label htmlFor={`hutang-${id}`}>{t('hasil.piutang.label_hutang', { nama })}</label>
                <span className="kotak-rupiah"><span aria-hidden="true">Rp</span>
                  <input id={`hutang-${id}`} inputMode="numeric" placeholder="0" value={tampilkan(isian[id])}
                    onChange={event => setIsian({ ...isian, [id]: event.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '') })} />
                </span>
                {penghutang.some(orang => orang.idOrang === id) && (
                  <fieldset className="setuju-piutang">
                    <legend>{t('hasil.piutang.tanya_setuju', { nama })}</legend>
                    {OPSI.map(({ nilai, teks }) => (
                      <label key={nilai}><input type="radio" name={`setuju-${id}`} checked={persetujuan[id] === nilai}
                        onChange={() => setPersetujuan({ ...persetujuan, [id]: nilai })} />{teks()}</label>
                    ))}
                  </fieldset>
                )}
              </li>
            ))}
          </ul>
          {penghutang.length > 0 && hasilPiutang === null && <p role="alert" className="galat-sisa-hak">{t('hasil.piutang.galat_harta')}</p>}
          {hasilPiutang?.status === 'PERLU_INPUT' && (
            <ul role="alert" className="galat-sisa-hak">
              {hasilPiutang.pertanyaan.map((pertanyaan, indeks) => (
                <li key={indeks}>{pertanyaan.isian === 'persetujuanPiutang' && pertanyaan.idOrang ? t('hasil.piutang.perlu_setuju', { nama: namaDari(pertanyaan.idOrang) }) : pertanyaan.alasan}</li>
              ))}
            </ul>
          )}
          {hasilPiutang?.status === 'TIDAK_DIDUKUNG' && <p role="alert" className="galat-sisa-hak">{hasilPiutang.alasan}</p>}
          {hasilPiutang?.status === 'OK' && <HasilPiutang hasil={hasilPiutang} penerima={penerima} namaDari={namaDari} />}
        </div>
      )}
    </section>
  );
}

function HasilPiutang({ hasil, penerima, namaDari }: { hasil: Extract<ReturnType<typeof hitungPiutangAhliWaris>, { status: 'OK' }>; penerima: Props['penerima']; namaDari: (id: string) => string }) {
  return (
    <>
      <ul className="keadaan-piutang">
        {hasil.jejak.map(langkah => {
          if (langkah.jenis !== 'PIUTANG_AHLI_WARIS') return null;
          const nama = namaDari(langkah.idOrang);
          const sisipan = { nama, bagian: formatRupiah(langkah.bagian), hutang: formatRupiah(langkah.hutang), sisa: formatRupiah(langkah.uangDiterima), kurang: formatRupiah(langkah.membayar) };
          return <li key={langkah.idOrang} className="catatan-sisa-hak">{catatanKeadaan(langkah.keadaan, sisipan)}</li>;
        })}
      </ul>
      <table className="tabel-sisa-hak">
        <thead><tr><th scope="col">{t('hasil.sisa_hak.kolom_orang')}</th><th scope="col" className="kolom-bagian">{t('hasil.sisa_hak.kolom_bagian')}</th>
          <th scope="col">{t('hasil.piutang.kolom_diterima')}</th><th scope="col">{t('hasil.piutang.kolom_membayar')}</th></tr></thead>
        <tbody>
          {penerima.map(({ id, nama }) => {
            const baris = hasil.perOrang[id];
            if (!baris) return null;
            return (
              <tr key={id}>
                <th scope="row">{nama}</th><td className="kolom-bagian">{formatRupiah(baris.bagian)}</td><td className="sisa">{formatRupiah(baris.uangDiterima)}</td>
                <td>{baris.membayar > 0n ? formatRupiah(baris.membayar) : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/** Digit mentah → tampilan dengan titik ribuan; kosong tetap kosong. */
const tampilkan = (digit: string | undefined): string => (digit ? BigInt(digit).toLocaleString('id-ID') : '');

const catatanKeadaan = (keadaan: 'sama' | 'lebih' | 'kurang', sisipan: Record<string, string>): string =>
  keadaan === 'sama' ? t('hasil.piutang.keadaan_sama', sisipan)
    : keadaan === 'lebih' ? t('hasil.piutang.keadaan_lebih', sisipan)
      : t('hasil.piutang.keadaan_kurang', sisipan);
