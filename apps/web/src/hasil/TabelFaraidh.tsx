// Tabel faraidh ala kitab: Ahli waris · Bagian · Asal masalah · ('Aul/Radd) · (Tashih) · Per orang · Nominal.
// Sel kelompok (ashabah bersama) digabung dan rata tengah; orang terhalang di baris bergaris miring. Angka dari tabel engine.

import type { IdOrang, TabelMasalah } from '@waris/engine';
import type { KolomBab } from '@waris/explain';
import { formatRupiah } from '../format';
import type { HasilOk } from '../jalankan';
import type { RingkasanHasil } from './ringkasan';
import { useAtributOrang, useSorot } from './sorot';

interface Props { hasil: HasilOk | null; ringkasan: RingkasanHasil; sembunyiNominal: boolean; saatPilih: (id: IdOrang) => void }

/** Baris bisa diklik atau ditekan Enter untuk membuka penjelasan orang itu. */
const bisaDipilih = (id: IdOrang, saatPilih: (id: IdOrang) => void) => ({
  tabIndex: 0, onClick: () => saatPilih(id),
  onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter') saatPilih(id); },
});

const uangAtau = (nilai: bigint, sembunyi: boolean) => (sembunyi ? 'Rp ••••••' : formatRupiah(nilai));

export function TabelFaraidh({ hasil, ringkasan, sembunyiNominal, saatPilih }: Props) {
  const { langkah } = useSorot();
  const sorot = (kolom: KolomBab) => (langkah?.kolom === kolom ? 'kolom-sorot' : undefined);
  return hasil ? <TabelBiasa tabel={hasil.tabel} ringkasan={ringkasan} sembunyi={sembunyiNominal} sorot={sorot} saatPilih={saatPilih} />
    : <TabelMunasakhat ringkasan={ringkasan} sembunyi={sembunyiNominal} saatPilih={saatPilih} />;
}

function TabelBiasa({ tabel, ringkasan, sembunyi, sorot, saatPilih }: {
  tabel: TabelMasalah; ringkasan: RingkasanHasil; sembunyi: boolean; sorot: (kolom: KolomBab) => string | undefined; saatPilih: (id: IdOrang) => void;
}) {
  const atribut = useAtributOrang();
  const nama = new Map(ringkasan.penerima.map(orang => [orang.id, orang]));
  const { ashl, aul, radd, tashih } = tabel.totalKolom;
  const penyesuaian = aul !== undefined ? { judul: "'Aul", nilai: aul, kunci: 'aul' } : radd !== undefined ? { judul: 'Radd', nilai: radd, kunci: 'radd' } : null;
  const totalNominal = ringkasan.penerima.reduce((jumlah, orang) => jumlah + orang.nominal, 0n);

  return (
    <table className="faraidh">
      <thead>
        <tr>
          <th className={['kiri', sorot('ahliWaris')].filter(Boolean).join(' ')}>Ahli waris</th>
          <th className={sorot('bagian')}>Bagian</th>
          <th className={sorot('ashl')}>Asal masalah<small>{String(ashl)}</small></th>
          {penyesuaian && <th className={sorot('penyesuaian')}>{penyesuaian.judul}<small>{String(penyesuaian.nilai)}</small></th>}
          {tashih !== undefined && <th className={sorot('tashih')}>Tashih<small>{String(tashih)}</small></th>}
          <th>Per orang<small>saham</small></th>
          <th className={sorot('nominal')}>Nominal<small>{uangAtau(ringkasan.tirkah.bersih, sembunyi)}</small></th>
        </tr>
      </thead>
      <tbody>
        {tabel.baris.flatMap(baris => {
          const anggota = Object.keys(baris.perOrang);
          return anggota.map((id, indeks) => {
            const orang = nama.get(id);
            const { className, ...pemicu } = atribut(id);
            return (
              <tr key={id} {...pemicu} className={className || undefined} {...bisaDipilih(id, saatPilih)}>
                <td className={['kiri', sorot('ahliWaris')].filter(Boolean).join(' ')}>
                  <span className="orang-sel"><span className={`titik g-${orang?.kelompok ?? 'saudara'}`} />{orang?.nama ?? id}</span>
                </td>
                {indeks === 0 && <>
                  <td rowSpan={anggota.length} className={sorot('bagian')}>
                    <span className="bagian-sel">{baris.fardh ? `${baris.fardh.n}/${baris.fardh.d}` : 'Ashabah'}
                      <small>{baris.fardh ? (baris.ashabah ? 'bagian tertentu + sisa' : 'bagian tertentu') : anggota.length > 1 ? 'sisa, dibagi bersama' : 'sisa'}</small></span>
                  </td>
                  <td rowSpan={anggota.length} className={['angka', sorot('ashl')].filter(Boolean).join(' ')}>{String(baris.sel.ashl ?? '—')}</td>
                  {penyesuaian && <td rowSpan={anggota.length} className={['angka', sorot('penyesuaian')].filter(Boolean).join(' ')}>{String(baris.sel[penyesuaian.kunci] ?? '—')}</td>}
                  {tashih !== undefined && <td rowSpan={anggota.length} className={['angka', sorot('tashih')].filter(Boolean).join(' ')}>{String(baris.sel.tashih ?? '—')}</td>}
                </>}
                <td className="angka">{String(baris.perOrang[id]!.saham)}</td>
                <td className={['uang', sorot('nominal')].filter(Boolean).join(' ')}>{uangAtau(baris.perOrang[id]!.nominal, sembunyi)}</td>
              </tr>
            );
          });
        })}
        {ringkasan.terhalang.map(orang => <BarisTerhalang key={orang.id} saatPilih={saatPilih} id={orang.id} nama={orang.nama} kelompok={orang.kelompok} alasan={orang.alasan}
          kolom={4 + (penyesuaian ? 1 : 0) + (tashih !== undefined ? 1 : 0)} />)}
      </tbody>
      <tfoot>
        <tr>
          <td className="kiri">Jumlah</td>
          <td>—</td>
          <td className="angka">{String(ashl)}</td>
          {penyesuaian && <td className="angka">{String(penyesuaian.nilai)}</td>}
          {tashih !== undefined && <td className="angka">{String(tashih)}</td>}
          <td className="angka">{String(ringkasan.penyebut)}</td>
          <td className="uang">{uangAtau(totalNominal, sembunyi)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function TabelMunasakhat({ ringkasan, sembunyi, saatPilih }: { ringkasan: RingkasanHasil; sembunyi: boolean; saatPilih: (id: IdOrang) => void }) {
  const atribut = useAtributOrang();
  return (
    <table className="faraidh">
      <thead>
        <tr><th className="kiri">Ahli waris</th><th>Saham jami'ah<small>{String(ringkasan.penyebut)}</small></th><th>Nominal<small>{uangAtau(ringkasan.tirkah.bersih, sembunyi)}</small></th></tr>
      </thead>
      <tbody>
        {ringkasan.penerima.map(orang => {
          const { className, ...pemicu } = atribut(orang.id);
          return (
            <tr key={orang.id} {...pemicu} className={className || undefined} {...bisaDipilih(orang.id, saatPilih)}>
              <td className="kiri"><span className="orang-sel"><span className={`titik g-${orang.kelompok}`} />{orang.nama}</span></td>
              <td className="angka">{String(orang.saham)}</td>
              <td className="uang">{uangAtau(orang.nominal, sembunyi)}</td>
            </tr>
          );
        })}
        {ringkasan.terhalang.map(orang => <BarisTerhalang key={orang.id} saatPilih={saatPilih} id={orang.id} nama={orang.nama} kelompok={orang.kelompok} alasan={orang.alasan} kolom={2} />)}
      </tbody>
    </table>
  );
}

function BarisTerhalang({ id, nama, kelompok, alasan, kolom, saatPilih }: { id: IdOrang; nama: string; kelompok: string; alasan: string; kolom: number; saatPilih: (id: IdOrang) => void }) {
  const atribut = useAtributOrang();
  const { className, ...pemicu } = atribut(id);
  return (
    <tr {...pemicu} className={['mahjub', className].filter(Boolean).join(' ')} {...bisaDipilih(id, saatPilih)}>
      <td className="kiri"><span className="orang-sel"><span className={`titik putus g-${kelompok}`} />{nama}</span></td>
      <td colSpan={kolom} className="ket-mahjub">{alasan}</td>
    </tr>
  );
}
