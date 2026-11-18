// Bagian layar Hasil khusus munasakhat (acuan-hasil-final.html, kasus berlapis/rantai): kotak "Yang dibagi sekarang",
// kelompok "Meninggal sebelum dibagi" di daftar, ubin "Urutan pembagian" (rute ringkas + tabel per langkah), dan tabel
// munasakhat ala kitab (kolom mas'alah tiap mayit, pengali, kolom jami'ah). Data dari rantaiMunasakhat (engine).

import { useState } from 'react';
import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { formatRupiah, formatRupiahRingkas, namaOrang } from '../format';
import { Istilah } from '../ui/Tooltip';
import { angka, t } from '../terjemah';
import { BarisOrang, JudulKelompok } from './KartuPembagian';
import type { LangkahRantai } from './munasakhat';
import { kunciDari, type RingkasanHasil } from './ringkasan';
import { useAtributOrang } from './sorot';

/** Rute ringkas lebih dari ini: langkah tengah disembunyikan dulu. */
const BATAS_RUTE_PENUH = 5;

interface Umum { graf: GrafKeluarga; ringkasan: RingkasanHasil; rantai: LangkahRantai[]; sembunyiNominal: boolean }

const uangAtau = (nilai: bigint, sembunyi: boolean) => (sembunyi ? t('hitung.rp') : formatRupiah(nilai));
/** Mayit pertama tidak punya status di statusOrang (ia pewaris), jadi namanya diambil langsung dari graf. */
const namaDi = (graf: GrafKeluarga, ringkasan: RingkasanHasil, id: IdOrang) =>
  (id === graf.idPewaris ? graf.orang[id]?.nama?.trim() || t('hitung.almarhum') : namaOrang(graf, ringkasan.statusOrang, id));

export function KotakYangDibagi({ graf, ringkasan }: { graf: GrafKeluarga; ringkasan: RingkasanHasil }) {
  return (
    <p className="kotak-dibagi">
      <b>{t('hasil.munasakhat.yang_dibagi_sekarang')}</b>{' '}
      {t('hasil.munasakhat.yang_dibagi_isi', { nama: graf.orang[graf.idPewaris]?.nama?.trim() || t('hitung.almarhum'), jumlah: angka(String(ringkasan.penerima.length)) })}
    </p>
  );
}

export function KelompokMeninggal({ graf, ringkasan, rantai, sembunyiNominal, saatPilih }: Umum & { saatPilih: (id: IdOrang) => void }) {
  const meninggal = rantai.slice(1);
  if (!meninggal.length) return null;
  return (
    <section aria-labelledby="judul-meninggal">
      <JudulKelompok id="judul-meninggal" judul={t('hasil.munasakhat.meninggal_sebelum_dibagi')} jumlah={meninggal.length} />
      <ul className="daftar-bagian">
        {meninggal.map((langkah, indeks) => (
          <BarisOrang key={langkah.mayit} redup saatPilih={saatPilih} uang={uangAtau(langkah.nominalMasuk, sembunyiNominal)}
            orang={{ id: langkah.mayit, nama: namaOrang(graf, ringkasan.statusOrang, langkah.mayit), kunci: kunciDari(ringkasan.statusOrang[langkah.mayit]) }}
            pecahan={t('hasil.munasakhat.dibagi_lagi_di_langkah', { langkah: angka(String(indeks + 2)) })} />
        ))}
      </ul>
    </section>
  );
}

export function UbinUrutanPembagian({ graf, ringkasan, rantai, sembunyiNominal, saatPilih }: Umum & { saatPilih: (id: IdOrang) => void }) {
  const [aktif, setAktif] = useState(0);
  const [ruteTerbuka, setRuteTerbuka] = useState(rantai.length <= BATAS_RUTE_PENUH);
  const nama = (id: IdOrang) => namaDi(graf, ringkasan, id);
  const langkah = rantai[aktif]!;
  const tombolRute = (indeks: number) => (
    <button key={indeks} type="button" aria-pressed={indeks === aktif} onClick={() => setAktif(indeks)}>
      {angka(`${indeks + 1}. `)}{nama(rantai[indeks]!.mayit)} · {sembunyiNominal ? t('hitung.rp') : formatRupiahRingkas(rantai[indeks]!.nominalMasuk)}
    </button>
  );
  const indeksTampil = ruteTerbuka ? rantai.map((_, indeks) => indeks) : [0, 1, rantai.length - 1];
  return (
    <section className="ubin bento-s12 ubin-urutan" aria-labelledby="judul-urutan">
      <h2 id="judul-urutan">{t('hasil.munasakhat.urutan_pembagian')}</h2>
      <p className="sub-kartu">{t('hasil.munasakhat.urutan_sub')}</p>
      <div className="rute-munasakhat">
        {indeksTampil.map((indeks, urutan) => (
          <span key={indeks} className="rute-langkah">
            {urutan > 0 && <span className="ke" aria-hidden="true">→</span>}
            {!ruteTerbuka && urutan === 2 && (
              <><button type="button" className="tautan-aksi" onClick={() => setRuteTerbuka(true)}>{t('hasil.munasakhat.langkah_lain', { jumlah: angka(String(rantai.length - 3)) })}</button><span className="ke" aria-hidden="true">→</span></>
            )}
            {tombolRute(indeks)}
          </span>
        ))}
      </div>
      <div className="blok-langkah">
        <h3>{t('hasil.munasakhat.nama_meninggal', { nama: nama(langkah.mayit) })}</h3>
        <p className="masuk-langkah">
          {aktif === 0 ? t('hasil.munasakhat.harta_peninggalan') : t('hasil.munasakhat.bagian_dari', { nama: langkah.dari.map(nama).join(t('umum.dan')) })}{' '}
          <b>{uangAtau(langkah.nominalMasuk, sembunyiNominal)}</b>
        </p>
        <div className="wadah-tabel">
          <table className="tabel-langkah">
            <thead><tr><th>{t('hasil.munasakhat.diberikan_ke')}</th><th className="uang">{t('hitung.nominal')}</th><th>{t('hasil.munasakhat.keterangan')}</th></tr></thead>
            <tbody>
              {langkah.daftarBagian.map(bagian => (
                <tr key={bagian.id} tabIndex={0} onClick={() => saatPilih(bagian.id)} onKeyDown={event => { if (event.key === 'Enter') saatPilih(bagian.id); }}>
                  <td><b>{nama(bagian.id)}</b><small>{bagian.fardh ? t('hitung.bagian_tertentu_fardh', { fardh: angka(`${bagian.fardh.n}/${bagian.fardh.d}`) }) : t('hitung.sisa_ashabah')}</small></td>
                  <td className="uang">{uangAtau(bagian.nominal, sembunyiNominal)}</td>
                  <td>{bagian.diteruskanDiLangkah
                    ? <span className="terus">{t('hasil.munasakhat.dibagi_lagi_di_langkah', { langkah: angka(String(bagian.diteruskanDiLangkah)) })}</span>
                    : <span className="selesai">{t('hasil.munasakhat.diterima')}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/** Tabel munasakhat ala kitab (KB 12.3): kolom mas'alah tiap mayit (pengali di atasnya) lalu kolom jami'ah sesudahnya. */
export function TabelMunasakhatKitab({ graf, ringkasan, rantai, nominal, sembunyiNominal, saatPilih }: Umum & { nominal: Record<IdOrang, bigint>; saatPilih: (id: IdOrang) => void }) {
  const atribut = useAtributOrang();
  const mayit = new Set(rantai.map(langkah => langkah.mayit));
  const daftarId = [...new Set(rantai.flatMap(langkah => langkah.daftarBagian.map(bagian => bagian.id)))];
  const judulSisa = new Map(ringkasan.daftarSisaKeluar.map(sisa => [sisa.id, `${sisa.judul} ${sisa.keterangan}`]));
  const idSisa = [...new Set(rantai.flatMap(langkah => Object.keys(langkah.gabung?.rincian ?? {}).filter(id => judulSisa.has(id))))];
  const nama = (id: string) => judulSisa.get(id) ?? namaDi(graf, ringkasan, id);
  const sahamMasalah = (langkah: LangkahRantai, id: string) => langkah.daftarBagian.find(bagian => bagian.id === id)?.saham;
  const angkaSel = (nilai: bigint | undefined) => (nilai === undefined ? '' : angka(String(nilai)));
  return (
    <table className="faraidh tabel-munasakhat">
      <thead>
        <tr>
          <th rowSpan={2} className="kiri">{t('hitung.ahli_waris')}</th>
          {rantai.map((langkah, indeks) => [
            <th key={`m${indeks}`}>{t('hasil.munasakhat.masalah_nama', { nama: nama(langkah.mayit) })}
              {langkah.gabung && <span className="pengali"> × {angka(String(langkah.gabung.wafqSaham))}</span>}</th>,
            langkah.gabung && <th key={`j${indeks}`} className="jami"><Istilah id="jamiah">{indeks === rantai.length - 1 ? t('hasil.munasakhat.jamiah_akhir') : t('hitung.jami_ah')}</Istilah>
              <span className="pengali"> {t('hasil.munasakhat.lama_kali', { kali: angka(String(langkah.gabung.wafqMasalah)) })}</span></th>,
          ])}
          <th rowSpan={2}>{t('hitung.nominal')}</th>
        </tr>
        <tr>
          {rantai.map((langkah, indeks) => [
            <th key={`m${indeks}`}><small>{angka(String(langkah.masalah))}</small>
              {langkah.gabung && <span className="ket">{angka(`${langkah.gabung.saham} : ${langkah.masalah}`)} · {langkah.gabung.hubungan === 'habis' ? t('hitung.sudah_habis_dibagi') : <Istilah id={langkah.gabung.hubungan}>{langkah.gabung.hubungan}</Istilah>}</span>}</th>,
            langkah.gabung && <th key={`j${indeks}`} className="jami"><small>{angka(String(langkah.gabung.jamiah))}</small></th>,
          ])}
        </tr>
      </thead>
      <tbody>
        {[...daftarId, ...idSisa].map(id => {
          const { className, ...pemicu } = atribut(id);
          const terima = nominal[id];
          return (
            <tr key={id} {...pemicu} className={className || undefined} tabIndex={0} onClick={() => saatPilih(id)} onKeyDown={event => { if (event.key === 'Enter') saatPilih(id); }}>
              <td className="kiri">{nama(id)}</td>
              {rantai.map((langkah, indeks) => [
                <td key={`m${indeks}`} className="angka">{angkaSel(sahamMasalah(langkah, id))}</td>,
                langkah.gabung && <td key={`j${indeks}`} className="angka jami">{langkah.mayit === id ? '—' : angkaSel(langkah.gabung.rincian[id]?.sesudah)}</td>,
              ])}
              <td className="uang">{mayit.has(id) && !terima ? '—' : uangAtau(terima ?? ringkasan.daftarSisaKeluar.find(sisa => sisa.id === id)?.nominal ?? 0n, sembunyiNominal)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
