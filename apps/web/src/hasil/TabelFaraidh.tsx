// Tabel faraidh ala kitab: Ahli waris · Bagian · Asal masalah · ('Aul/Radd) · (Tashih) · Per orang · Nominal.
// Sel kelompok (ashabah bersama) digabung dan rata tengah; orang terhalang di baris bergaris miring. Angka dari tabel engine.
// Saat langkah perhitungan diputar, sel milik orang yang dibahas menyala dengan warna perannya dan angka kolom yang
// sedang dihitung "masuk" ke kotaknya. Mode fokus membangun tabel bertahap: kolom yang babnya belum dilewati berisi "?",
// dan di kolom yang sedang dibahas, sel orang yang belum dibahas juga masih "?".
// Mode Belajar sebelum jawaban terbuka: struktur tabel tetap tampil, semua angka "?" (TabelSoal).

import { useState } from 'react';
import type { IdOrang, TabelMasalah } from '@waris/engine';
import type { KolomBab } from '@waris/explain';
import { formatRupiah } from '../format';
import type { HasilOk } from '@waris/latihan';
import { adalahDzawilArham, teksKelompok, urutkanBaris, type RingkasanHasil } from './ringkasan';
import type { Kelompok } from '../checklist';
import { AngkaMasuk } from '../ui/AngkaMasuk';
import { Istilah } from '../ui/Tooltip';
import { useAtributOrang, useSorot } from './sorot';
import { angka as angkaTampil, panah, t } from '../terjemah';

type KolomHitungan = 'bagian' | 'ashl' | 'penyesuaian' | 'tashih';
/** Semua kolom yang bisa disembunyikan lewat "Atur kolom"; Ahli waris selalu tampil. */
type KolomTabel = KolomHitungan | 'perOrang' | 'nominal';

interface Props { hasil: HasilOk | null; ringkasan: RingkasanHasil; sembunyiNominal: boolean; sedangMenebak: boolean; saatPilih: (id: IdOrang) => void }

/** Baris bisa diklik atau ditekan Enter untuk membuka penjelasan orang itu. */
const bisaDipilih = (id: IdOrang, saatPilih: (id: IdOrang) => void) => ({
  tabIndex: 0, onClick: () => saatPilih(id),
  onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter') saatPilih(id); },
});

const uangAtau = (nilai: bigint, sembunyi: boolean) => (sembunyi ? t('hitung.rp') : formatRupiah(nilai));
/** Nama + keterangan kelompok di bawahnya (acuan mockup: "Aminah / Istri almarhum"); tanpa kotak warna. */
const Orang = ({ nama, kelompok }: { nama: string; kelompok?: Kelompok | undefined }) => (
  <span className="orang-sel"><span>{nama}</span>{kelompok && <small>{teksKelompok(kelompok)}</small>}</span>
);
const RAHASIA = <span className="rahasia" aria-label={t('hitung.disembunyikan')}>?</span>;
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
  const penyesuaian = aul !== undefined ? { judul: t('hitung.aul'), nilai: aul, kunci: 'aul' } : radd !== undefined ? { judul: t('hitung.radd'), nilai: radd, kunci: 'radd' } : null;
  // Tabel hanya untuk kasus biasa: paling banyak satu baris sisa.
  const [sisaKeluar] = ringkasan.daftarSisaKeluar;
  const totalNominal = ringkasan.penerima.reduce((jumlah, orang) => jumlah + orang.nominal, sisaKeluar?.nominal ?? 0n);
  const angka = (kolom: KolomBab | 'perOrang', nilai: bigint | undefined, daftarId?: IdOrang[]) =>
    tertutup(kolom, daftarId) ? RAHASIA : nilai === undefined ? '-' : kolom === 'perOrang' ? angkaTampil(String(nilai))
      : <AngkaMasuk teks={angkaTampil(String(nilai))} pemicu={pemicu(kolom as KolomBab, daftarId)} tunda={tunda(daftarId)} />;
  const uang = (nilai: bigint, daftarId?: IdOrang[]) =>
    tertutup('nominal', daftarId) ? RAHASIA : sembunyi ? uangAtau(nilai, true)
      : <AngkaMasuk teks={formatRupiah(nilai)} pemicu={pemicu('nominal', daftarId)} tunda={tunda(daftarId)} />;
  const dasarTashih = penyesuaian?.nilai ?? ashl;
  const [kolomDipilih, setKolomDipilih] = useState<KolomHitungan | null>(null);
  const [tersembunyi, setTersembunyi] = useState<ReadonlySet<KolomTabel>>(new Set());
  const ada = (kolom: KolomTabel) => !tersembunyi.has(kolom);
  const pilih = (kolom: KolomHitungan) => (kolomDipilih === kolom ? 'dipilih-sel' : false);
  const daftarKolom: Array<{ kunci: KolomTabel; judul: string }> = [
    { kunci: 'bagian', judul: t('hitung.bagian') }, { kunci: 'ashl', judul: t('hitung.asal_masalah') },
    ...(penyesuaian ? [{ kunci: 'penyesuaian' as const, judul: penyesuaian.judul }] : []), ...(tashih !== undefined ? [{ kunci: 'tashih' as const, judul: t('hitung.tashih') }] : []),
    { kunci: 'perOrang', judul: t('hitung.per_orang') }, { kunci: 'nominal', judul: t('hitung.nominal') },
  ];
  const jumlahTampil = daftarKolom.filter(kolom => ada(kolom.kunci)).length;
  const alihKolom = (kolom: KolomTabel) => {
    setTersembunyi(lama => { const baru = new Set(lama); if (!baru.delete(kolom)) baru.add(kolom); return baru; });
    if (kolomDipilih === kolom) setKolomDipilih(null);
  };
  const ketukKolom = (kolom: KolomHitungan) => ({
    onClick: () => setKolomDipilih(kolomDipilih === kolom ? null : kolom), 'aria-pressed': kolomDipilih === kolom, tabIndex: 0, role: 'button' as const,
    onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter') setKolomDipilih(kolomDipilih === kolom ? null : kolom); },
  });
  const hitungan = (kolom: KolomHitungan) => {
    const bagian = urutkanBaris(tabel.baris, ringkasan.statusOrang).map(baris => {
      const daftar = Object.keys(baris.perOrang).map(id => nama.get(id)?.nama ?? id).join(' + ');
      return `${daftar}: ${baris.fardh ? angkaTampil(`${baris.fardh.n}/${baris.fardh.d}`) : t('hitung.sisa_2')}`;
    });
    if (kolom === 'bagian') return bagian.join(' · ');
    if (kolom === 'ashl') return `${t('hitung.asal_masalah')} = ${angkaTampil(String(ashl))}`;
    if (kolom === 'penyesuaian') return `${angkaTampil(String(ashl))} ${panah()} ${angkaTampil(String(penyesuaian!.nilai))}`;
    return dasarTashih && tashih! % dasarTashih === 0n ? `${angkaTampil(String(dasarTashih))} × ${angkaTampil(String(tashih! / dasarTashih))} = ${angkaTampil(String(tashih))}` : angkaTampil(String(tashih));
  };

  // Dasar = kaidah dari KB (bagian [R04-1][R05-1], ashl [R09-1], 'aul [R09-3], radd [R09-7][R09-9], tashih [R10-2]); tanpa kode rujukan di layar.
  const dasarKolom = { bagian: t('hitung.dasar_bagian'), ashl: t('hitung.dasar_ashl'), tashih: t('hitung.dasar_tashih'),
    penyesuaian: penyesuaian?.kunci === 'radd' ? t('hitung.dasar_radd') : t('hitung.dasar_aul') };
  // Di kasus ini = angka kasus ini saja; kolom tanpa hal khusus tidak menampilkan baris ini.
  const diKasusIni = (kolom: KolomHitungan): string | null => {
    if (kolom === 'ashl') {
      const penyebut = [...new Set(tabel.baris.flatMap(baris => (baris.fardh ? [baris.fardh.d] : [])))].sort((a, b) => Number(a - b));
      return penyebut.length ? t('hitung.kasus_ashl', { penyebut: penyebut.map(besar => angkaTampil(String(besar))).join(t('umum.dan')), ashl: angkaTampil(String(ashl)) }) : null;
    }
    if (kolom === 'penyesuaian' && penyesuaian) {
      const sisipan = { jumlah: angkaTampil(String(penyesuaian.nilai)), ashl: angkaTampil(String(ashl)) };
      return penyesuaian.kunci === 'radd' ? t('hitung.kasus_radd', sisipan) : t('hitung.kasus_aul', sisipan);
    }
    if (kolom === 'tashih' && dasarTashih && tashih! % dasarTashih === 0n) return t('hitung.kasus_tashih', { pengali: angkaTampil(String(tashih! / dasarTashih)) });
    if (kolom === 'bagian' && ringkasan.terhalang.length) return t('hitung.kasus_terhalang', { jumlah: angkaTampil(String(ringkasan.terhalang.length)) });
    return null;
  };

  return (
    <>
    <details className="atur-kolom">
      <summary>{t('hasil.atur_kolom')}<small>{t('hasil.kolom_tampil', { tampil: angkaTampil(String(jumlahTampil)), total: angkaTampil(String(daftarKolom.length)) })}</small></summary>
      <div role="group" aria-label={t('hasil.atur_kolom')}>
        {daftarKolom.map(kolom => (
          <label key={kolom.kunci}><input type="checkbox" checked={ada(kolom.kunci)} onChange={() => alihKolom(kolom.kunci)} />{kolom.judul}</label>
        ))}
      </div>
    </details>
    <table className="faraidh">
      <thead>
        <tr>
          <th className={kelas('kiri', kepala('ahliWaris'))}>{t('hitung.ahli_waris')}</th>
          {ada('bagian') && <th className={kelas('kolom-ketuk', kolomDipilih === 'bagian' && 'dipilih', kepala('bagian'))} {...ketukKolom('bagian')}>{t('hitung.bagian')}</th>}
          {ada('ashl') && <th className={kelas('kolom-ketuk', kolomDipilih === 'ashl' && 'dipilih', kepala('ashl'))} {...ketukKolom('ashl')}><Istilah id="ashlul-masalah">{t('hitung.asal_masalah')}</Istilah><small>{angka('ashl', ashl)}</small></th>}
          {penyesuaian && ada('penyesuaian') && (
            <th className={kelas('kolom-ketuk', kolomDipilih === 'penyesuaian' && 'dipilih', kepala('penyesuaian'))} {...ketukKolom('penyesuaian')}><Istilah id={penyesuaian.kunci}>{penyesuaian.judul}</Istilah>
              <small>{langkah?.kolom === 'penyesuaian' && ashl !== undefined
                ? <span className="ubah-angka"><s>{angkaTampil(String(ashl))}</s> {panah()} <AngkaMasuk teks={angkaTampil(String(penyesuaian.nilai))} pemicu={langkah.ketukan} /></span>
                : angka('penyesuaian', penyesuaian.nilai)}</small></th>
          )}
          {tashih !== undefined && ada('tashih') && (
            <th className={kelas('kolom-ketuk', kolomDipilih === 'tashih' && 'dipilih', kepala('tashih'))} {...ketukKolom('tashih')}><Istilah id="tashih">{t('hitung.tashih')}</Istilah><small>{angka('tashih', tashih)}</small>
              {langkah?.kolom === 'tashih' && dasarTashih !== undefined && dasarTashih > 0n && tashih % dasarTashih === 0n && <span className="pengali-tashih">{angkaTampil(String(dasarTashih))} × {angkaTampil(String(tashih / dasarTashih))}</span>}</th>
          )}
          {ada('perOrang') && <th>{t('hitung.per_orang')}<small><Istilah arti={t('hitung.bagian_tiap_orang_dihitung_dalam_satuan')}>{t('hitung.saham')}</Istilah></small></th>}
          {ada('nominal') && <th className={kepala('nominal')}>{t('hitung.nominal')}<small>{sembunyi ? uangAtau(ringkasan.tirkah.bersih, true) : <AngkaMasuk teks={formatRupiah(ringkasan.tirkah.bersih)} pemicu={pemicu('nominal', [])} />}</small></th>}
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
                <td className={kelas('kiri', sel('ahliWaris', [id]))}><Orang nama={orang?.nama ?? id} kelompok={orang?.kelompok} /></td>
                {indeks === 0 && <>
                  {ada('bagian') && <td rowSpan={anggota.length} className={kelas(sel('bagian', anggota), pilih('bagian'))} data-anggota={anggota.join(' ')}>
                    {tertutup('bagian', anggota) ? RAHASIA : adalahDzawilArham(ringkasan.statusOrang[id]) ? (
                      <span className="bagian-sel"><Istilah id="dzawil-arham">{t('hitung.dzawil_arham')}</Istilah><small>{t('hitung.menurut_tanzil')}</small></span>
                    ) : (
                      <span className="bagian-sel">{baris.fardh ? angkaTampil(`${baris.fardh.n}/${baris.fardh.d}`) : <Istilah id="ashabah">{t('hitung.ashabah')}</Istilah>}
                        <small>{baris.fardh ? (baris.ashabah ? t('hitung.bagian_tertentu_sisa') : t('hitung.bagian_tertentu')) : anggota.length > 1 ? t('hitung.sisa_dibagi_bersama') : 'sisa'}</small></span>
                    )}
                  </td>}
                  {ada('ashl') && <td rowSpan={anggota.length} className={kelas('angka', sel('ashl', anggota), pilih('ashl'))}>{angka('ashl', baris.sel.ashl, anggota)}</td>}
                  {penyesuaian && ada('penyesuaian') && <td rowSpan={anggota.length} className={kelas('angka', sel('penyesuaian', anggota), pilih('penyesuaian'))}>{angka('penyesuaian', baris.sel[penyesuaian.kunci], anggota)}</td>}
                  {tashih !== undefined && ada('tashih') && <td rowSpan={anggota.length} className={kelas('angka', sel('tashih', anggota), pilih('tashih'))}>{angka('tashih', baris.sel.tashih, anggota)}</td>}
                </>}
                {ada('perOrang') && <td className="angka">{angka('perOrang', baris.perOrang[id]!.saham)}</td>}
                {ada('nominal') && <td className={kelas('uang', sel('nominal', [id]))}>{uang(baris.perOrang[id]!.nominal, [id])}</td>}
              </tr>
            );
          });
        })}
        {sisaKeluar && (
          <tr className="baris-sisa">
            <td className="kiri"><Orang nama={sisaKeluar.judul} /></td>
            {ada('bagian') && <td><span className="bagian-sel">{t('hitung.sisa_3')}<small>{t('hitung.bukan_untuk_ahli_waris')}</small></span></td>}
            {ada('ashl') && <td className="angka">{angka('ashl', sisaKeluar.saham * ashl! / ringkasan.penyebut)}</td>}
            {penyesuaian && ada('penyesuaian') && <td className="angka">-</td>}
            {tashih !== undefined && ada('tashih') && <td className="angka">{angka('tashih', sisaKeluar.saham)}</td>}
            {ada('perOrang') && <td className="angka">{angka('perOrang', sisaKeluar.saham)}</td>}
            {ada('nominal') && <td className="uang">{tertutup('nominal') ? RAHASIA : uangAtau(sisaKeluar.nominal, sembunyi)}</td>}
          </tr>
        )}
        {jumlahTampil > 0 && ringkasan.terhalang.map(orang => <BarisTerhalang key={orang.id} saatPilih={saatPilih} id={orang.id} nama={orang.nama} kelompok={orang.kelompok} alasan={orang.alasan}
          kolom={jumlahTampil} />)}
      </tbody>
      <tfoot>
        <tr>
          <td className="kiri">{t('umum.jumlah')}</td>
          {ada('bagian') && <td>-</td>}
          {ada('ashl') && <td className="angka">{angka('ashl', ashl)}</td>}
          {penyesuaian && ada('penyesuaian') && <td className="angka">{angka('penyesuaian', penyesuaian.nilai)}</td>}
          {tashih !== undefined && ada('tashih') && <td className="angka">{angka('tashih', tashih)}</td>}
          {ada('perOrang') && <td className="angka">{angka('perOrang', ringkasan.penyebut)}</td>}
          {ada('nominal') && <td className="uang">{tertutup('nominal') ? RAHASIA : uangAtau(totalNominal, sembunyi)}</td>}
        </tr>
      </tfoot>
    </table>
    <div className="kotak-kolom" aria-live="polite">
      {kolomDipilih ? <><b>{t('hitung.kolom_label')}</b> {{ bagian: t('hitung.bagian'), ashl: t('hitung.asal_masalah'), penyesuaian: penyesuaian?.judul, tashih: t('hitung.tashih') }[kolomDipilih]}
        <p><b>{t('hitung.kolom_dasar')}</b> {dasarKolom[kolomDipilih]}</p>
        {diKasusIni(kolomDipilih) && <p><b>{t('hitung.kolom_di_kasus')}</b> {diKasusIni(kolomDipilih)}</p>}
        <p><b>{t('hitung.kolom_hitungan')}</b> {hitungan(kolomDipilih)}</p></> : <p>{t('hitung.kolom_petunjuk')}</p>}
    </div>
    </>
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
          <th className="kiri">{t('hitung.ahli_waris')}</th><th>{t('hitung.bagian')}</th><th><Istilah id="ashlul-masalah">{t('hitung.asal_masalah')}</Istilah><small>{RAHASIA}</small></th>
          <th>{t('hitung.per_orang')}<small>{t('hitung.saham')}</small></th><th>{t('hitung.nominal')}<small>{formatRupiah(ringkasan.tirkah.bersih)}</small></th>
        </tr>
      </thead>
      <tbody>
        {daftarOrang.map(orang => {
          const { className, ...pemicu } = atribut(orang.id);
          return (
            <tr key={orang.id} {...pemicu} className={className || undefined} {...bisaDipilih(orang.id, saatPilih)}>
              <td className="kiri"><Orang nama={orang.nama} kelompok={orang.kelompok} /></td>
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
        <tr><th className="kiri">{t('hitung.ahli_waris')}</th><th><Istilah id="jamiah">{t('hitung.saham_jami_ah')}</Istilah><small>{angkaTampil(String(ringkasan.penyebut))}</small></th><th>{t('hitung.nominal')}<small>{uangAtau(ringkasan.tirkah.bersih, sembunyi)}</small></th></tr>
      </thead>
      <tbody>
        {ringkasan.penerima.map(orang => {
          const { className, ...pemicu } = atribut(orang.id);
          return (
            <tr key={orang.id} {...pemicu} className={className || undefined} {...bisaDipilih(orang.id, saatPilih)}>
              <td className="kiri"><Orang nama={orang.nama} kelompok={orang.kelompok} /></td>
              <td className="angka">{angkaTampil(String(orang.saham))}</td>
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
      <td className="kiri"><Orang nama={nama} kelompok={kelompok as Kelompok} /></td>
      <td colSpan={kolom} className="ket-mahjub">{alasan}</td>
    </tr>
  );
}
