// Tabel faraidh ala kitab: Ahli waris · Bagian · Asal masalah · ('Aul/Radd) · (Tashih) · Per orang · Nominal.
// Sel kelompok (ashabah bersama) digabung dan rata tengah; orang terhalang di baris bergaris miring. Angka dari tabel engine.
// Saat langkah perhitungan diputar, sel milik orang yang dibahas menyala dengan warna perannya dan angka kolom yang
// sedang dihitung "masuk" ke kotaknya. Mode fokus membangun tabel bertahap: kolom yang babnya belum dilewati berisi "?",
// dan di kolom yang sedang dibahas, sel orang yang belum dibahas juga masih "?".
// Mode Belajar sebelum jawaban terbuka: struktur tabel tetap tampil, semua angka "?" (TabelSoal).

import type { IdOrang, TabelMasalah } from '@waris/engine';
import type { KolomBab } from '@waris/explain';
import { formatRupiah } from '../format';
import type { HasilOk } from '../jalankan';
import { urutkanBaris, type RingkasanHasil } from './ringkasan';
import { AngkaMasuk } from '../ui/AngkaMasuk';
import { Istilah } from '../ui/Tooltip';
import { useAtributOrang, useSorot } from './sorot';

interface Props { hasil: HasilOk | null; ringkasan: RingkasanHasil; sembunyiNominal: boolean; sedangMenebak: boolean; saatPilih: (id: IdOrang) => void }

/** Baris bisa diklik atau ditekan Enter untuk membuka penjelasan orang itu. */
const bisaDipilih = (id: IdOrang, saatPilih: (id: IdOrang) => void) => ({
  tabIndex: 0, onClick: () => saatPilih(id),
  onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter') saatPilih(id); },
});

const uangAtau = (nilai: bigint, sembunyi: boolean) => (sembunyi ? 'Rp ••••••' : formatRupiah(nilai));
const RAHASIA = <span className="rahasia" aria-label="disembunyikan">?</span>;
const kelas = (...daftar: Array<string | false | undefined>) => daftar.filter(Boolean).join(' ') || undefined;

export function TabelFaraidh({ hasil, ringkasan, sembunyiNominal, sedangMenebak, saatPilih }: Props) {
  if (sedangMenebak) return <TabelSoal ringkasan={ringkasan} saatPilih={saatPilih} />;
  return hasil ? <TabelBiasa tabel={hasil.tabel} ringkasan={ringkasan} sembunyi={sembunyiNominal} saatPilih={saatPilih} />
    : <TabelMunasakhat ringkasan={ringkasan} sembunyi={sembunyiNominal} saatPilih={saatPilih} />;
}

/** Cara tabel bereaksi terhadap langkah yang sedang diputar. */
function useSorotTabel() {
  const { langkah } = useSorot();
  /** Tanpa daftarId = angka total kolom, baru tampil setelah seluruh sel kolom itu terungkap. */
  const tertutup = (kolom: KolomBab | 'perOrang', daftarId?: IdOrang[]) => {
    if (langkah?.kolomTerbuka && !langkah.kolomTerbuka.has(kolom)) return true;
    const terungkap = langkah?.kolom === kolom ? langkah.terungkap : undefined;
    return !!terungkap && !daftarId?.some(id => terungkap.has(id));
  };
  const tunda = (daftarId: IdOrang[] = []) => Math.max(0, ...daftarId.map(id => langkah?.tundaSel?.get(id) ?? 0));
  const kepala = (kolom: KolomBab) => (langkah?.kolom === kolom ? 'kolom-sorot' : undefined);
  /** Sel milik orang yang sedang dibahas di kolom yang sedang dibahas menyala terang; sel lain di kolom itu cukup ditandai. */
  const sel = (kolom: KolomBab, daftarId: IdOrang[]) => {
    if (langkah?.kolom !== kolom) return undefined;
    const peran = daftarId.map(id => langkah.peran.get(id)).find(Boolean);
    return peran ? `sel-sorot sorot-${peran}` : 'kolom-sorot-lembut';
  };
  const pemicu = (kolom: KolomBab, daftarId?: IdOrang[]) =>
    langkah?.kolom === kolom && (!daftarId || daftarId.some(id => langkah.peran.has(id))) ? langkah.ketukan : null;
  return { langkah, tertutup, kepala, sel, pemicu, tunda };
}

function TabelBiasa({ tabel, ringkasan, sembunyi, saatPilih }: {
  tabel: TabelMasalah; ringkasan: RingkasanHasil; sembunyi: boolean; saatPilih: (id: IdOrang) => void;
}) {
  const atribut = useAtributOrang();
  const { langkah, tertutup, kepala, sel, pemicu, tunda } = useSorotTabel();
  const nama = new Map(ringkasan.penerima.map(orang => [orang.id, orang]));
  const { ashl, aul, radd, tashih } = tabel.totalKolom;
  const penyesuaian = aul !== undefined ? { judul: "'Aul", nilai: aul, kunci: 'aul' } : radd !== undefined ? { judul: 'Radd', nilai: radd, kunci: 'radd' } : null;
  const totalNominal = ringkasan.penerima.reduce((jumlah, orang) => jumlah + orang.nominal, ringkasan.sisaKeluar?.nominal ?? 0n);
  const angka = (kolom: KolomBab | 'perOrang', nilai: bigint | undefined, daftarId?: IdOrang[]) =>
    tertutup(kolom, daftarId) ? RAHASIA : nilai === undefined ? '-' : kolom === 'perOrang' ? String(nilai)
      : <AngkaMasuk teks={String(nilai)} pemicu={pemicu(kolom as KolomBab, daftarId)} tunda={tunda(daftarId)} />;
  const uang = (nilai: bigint, daftarId?: IdOrang[]) =>
    tertutup('nominal', daftarId) ? RAHASIA : sembunyi ? uangAtau(nilai, true)
      : <AngkaMasuk teks={formatRupiah(nilai)} pemicu={pemicu('nominal', daftarId)} tunda={tunda(daftarId)} />;
  const dasarTashih = penyesuaian?.nilai ?? ashl;

  return (
    <table className="faraidh">
      <thead>
        <tr>
          <th className={kelas('kiri', kepala('ahliWaris'))}>Ahli waris</th>
          <th className={kepala('bagian')}>Bagian</th>
          <th className={kepala('ashl')}><Istilah id="ashlul-masalah">Asal masalah</Istilah><small>{angka('ashl', ashl)}</small></th>
          {penyesuaian && (
            <th className={kepala('penyesuaian')}><Istilah id={penyesuaian.kunci}>{penyesuaian.judul}</Istilah>
              <small>{langkah?.kolom === 'penyesuaian' && ashl !== undefined
                ? <span className="ubah-angka"><s>{String(ashl)}</s> → <AngkaMasuk teks={String(penyesuaian.nilai)} pemicu={langkah.ketukan} /></span>
                : angka('penyesuaian', penyesuaian.nilai)}</small></th>
          )}
          {tashih !== undefined && (
            <th className={kepala('tashih')}><Istilah id="tashih">Tashih</Istilah><small>{angka('tashih', tashih)}</small>
              {langkah?.kolom === 'tashih' && dasarTashih !== undefined && dasarTashih > 0n && tashih % dasarTashih === 0n && <span className="pengali-tashih">{String(dasarTashih)} × {String(tashih / dasarTashih)}</span>}</th>
          )}
          <th>Per orang<small><Istilah arti="Bagian tiap orang dihitung dalam satuan kecil yang sama (saham), dari jumlah pada kolom sebelumnya.">saham</Istilah></small></th>
          <th className={kepala('nominal')}>Nominal<small>{sembunyi ? uangAtau(ringkasan.tirkah.bersih, true) : <AngkaMasuk teks={formatRupiah(ringkasan.tirkah.bersih)} pemicu={pemicu('nominal', [])} />}</small></th>
        </tr>
      </thead>
      <tbody>
        {urutkanBaris(tabel.baris, ringkasan.statusOrang).flatMap(baris => {
          const anggota = Object.keys(baris.perOrang);
          return anggota.map((id, indeks) => {
            const orang = nama.get(id);
            const { className, ...pemicuHover } = atribut(id);
            return (
              <tr key={id} {...pemicuHover} className={className || undefined} {...bisaDipilih(id, saatPilih)}>
                <td className={kelas('kiri', sel('ahliWaris', [id]))}>
                  <span className="orang-sel"><span className={`titik g-${orang?.kelompok ?? 'saudara'}`} />{orang?.nama ?? id}</span>
                </td>
                {indeks === 0 && <>
                  <td rowSpan={anggota.length} className={sel('bagian', anggota)} data-anggota={anggota.join(' ')}>
                    {tertutup('bagian', anggota) ? RAHASIA : (
                      <span className="bagian-sel">{baris.fardh ? `${baris.fardh.n}/${baris.fardh.d}` : <Istilah id="ashabah">Ashabah</Istilah>}
                        <small>{baris.fardh ? (baris.ashabah ? 'bagian tertentu + sisa' : 'bagian tertentu') : anggota.length > 1 ? 'sisa, dibagi bersama' : 'sisa'}</small></span>
                    )}
                  </td>
                  <td rowSpan={anggota.length} className={kelas('angka', sel('ashl', anggota))}>{angka('ashl', baris.sel.ashl, anggota)}</td>
                  {penyesuaian && <td rowSpan={anggota.length} className={kelas('angka', sel('penyesuaian', anggota))}>{angka('penyesuaian', baris.sel[penyesuaian.kunci], anggota)}</td>}
                  {tashih !== undefined && <td rowSpan={anggota.length} className={kelas('angka', sel('tashih', anggota))}>{angka('tashih', baris.sel.tashih, anggota)}</td>}
                </>}
                <td className="angka">{angka('perOrang', baris.perOrang[id]!.saham)}</td>
                <td className={kelas('uang', sel('nominal', [id]))}>{uang(baris.perOrang[id]!.nominal, [id])}</td>
              </tr>
            );
          });
        })}
        {ringkasan.sisaKeluar && (
          <tr className="baris-sisa">
            <td className="kiri"><span className="orang-sel"><span className="titik putus" />{ringkasan.sisaKeluar.judul}</span></td>
            <td><span className="bagian-sel">Sisa<small>bukan untuk ahli waris</small></span></td>
            <td className="angka">{angka('ashl', ringkasan.sisaKeluar.saham * ashl! / ringkasan.penyebut)}</td>
            {penyesuaian && <td className="angka">-</td>}
            {tashih !== undefined && <td className="angka">{angka('tashih', ringkasan.sisaKeluar.saham)}</td>}
            <td className="angka">{angka('perOrang', ringkasan.sisaKeluar.saham)}</td>
            <td className="uang">{tertutup('nominal') ? RAHASIA : uangAtau(ringkasan.sisaKeluar.nominal, sembunyi)}</td>
          </tr>
        )}
        {ringkasan.terhalang.map(orang => <BarisTerhalang key={orang.id} saatPilih={saatPilih} id={orang.id} nama={orang.nama} kelompok={orang.kelompok} alasan={orang.alasan}
          kolom={4 + (penyesuaian ? 1 : 0) + (tashih !== undefined ? 1 : 0)} />)}
      </tbody>
      <tfoot>
        <tr>
          <td className="kiri">Jumlah</td>
          <td>-</td>
          <td className="angka">{angka('ashl', ashl)}</td>
          {penyesuaian && <td className="angka">{angka('penyesuaian', penyesuaian.nilai)}</td>}
          {tashih !== undefined && <td className="angka">{angka('tashih', tashih)}</td>}
          <td className="angka">{angka('perOrang', ringkasan.penyebut)}</td>
          <td className="uang">{tertutup('nominal') ? RAHASIA : uangAtau(totalNominal, sembunyi)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/**
 * Tabel soal (mode Belajar sebelum jawaban terbuka): kolom dasar saja, semua angka "?". Kolom 'aul/radd/tashih dan
 * baris terhalang tidak dibedakan, supaya tabel tidak membocorkan jenis kasus atau siapa yang tidak dapat.
 */
function TabelSoal({ ringkasan, saatPilih }: { ringkasan: RingkasanHasil; saatPilih: (id: IdOrang) => void }) {
  const atribut = useAtributOrang();
  const daftarOrang = [...ringkasan.penerima, ...ringkasan.terhalang];
  return (
    <table className="faraidh tabel-soal">
      <thead>
        <tr>
          <th className="kiri">Ahli waris</th><th>Bagian</th><th><Istilah id="ashlul-masalah">Asal masalah</Istilah><small>{RAHASIA}</small></th>
          <th>Per orang<small>saham</small></th><th>Nominal<small>{formatRupiah(ringkasan.tirkah.bersih)}</small></th>
        </tr>
      </thead>
      <tbody>
        {daftarOrang.map(orang => {
          const { className, ...pemicu } = atribut(orang.id);
          return (
            <tr key={orang.id} {...pemicu} className={className || undefined} {...bisaDipilih(orang.id, saatPilih)}>
              <td className="kiri"><span className="orang-sel"><span className={`titik g-${orang.kelompok}`} />{orang.nama}</span></td>
              <td className="rahasia">{RAHASIA}</td><td className="angka rahasia">{RAHASIA}</td><td className="angka rahasia">{RAHASIA}</td><td className="uang rahasia">{RAHASIA}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TabelMunasakhat({ ringkasan, sembunyi, saatPilih }: { ringkasan: RingkasanHasil; sembunyi: boolean; saatPilih: (id: IdOrang) => void }) {
  const atribut = useAtributOrang();
  return (
    <table className="faraidh">
      <thead>
        <tr><th className="kiri">Ahli waris</th><th><Istilah id="jamiah">Saham jami'ah</Istilah><small>{String(ringkasan.penyebut)}</small></th><th>Nominal<small>{uangAtau(ringkasan.tirkah.bersih, sembunyi)}</small></th></tr>
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
