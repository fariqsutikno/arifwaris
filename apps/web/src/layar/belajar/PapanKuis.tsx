// Tab Kuis konsep: RekomendasiKuis (panel di hero: paket yang paling pantas dikerjakan) dan PapanKuis (satu baris per
// paket: nilai terbaik, predikat, target berikutnya, jumlah percobaan). Nilai terbaik dan percobaan dari rekor paket
// (progres.ts); predikat dari skorKuis.ts. Kuis acak tidak punya rekor karena soalnya berganti tiap kali.

import { daftarSoalKuis } from '../../konten/sumber';
import { bacaRekorPaket, type RekorPaket } from '../../progres';
import { tautanLatihan } from '../../rute';
import { angka, t } from '../../terjemah';
import { bacaSkor, persenBulat, predikatDari, TANGGA_PREDIKAT } from '../../skorKuis';
import { teksPredikat, teksTarget } from './teksSkor';
import { judulTopik, JUMLAH_SOAL_ACAK, kodePaketBab, PAKET_ACAK, perBab } from './KuisKonsep';
import { rekomendasiPaket, type PaketKuis } from './rekomendasiKuis';

const daftarPaket = (): PaketKuis[] => perBab(daftarSoalKuis()).map(([bab, soal]) => ({ kode: kodePaketBab(bab), bab, jumlahSoal: soal.length }));
const jumlahAcak = () => Math.min(JUMLAH_SOAL_ACAK, daftarSoalKuis().length);

const persenRekor = (rekor: RekorPaket): number => persenBulat(bacaSkor(rekor.terbaik) ?? { benar: 0, total: 1 });

export function RekomendasiKuis() {
  const rekor = bacaRekorPaket();
  const saran = rekomendasiPaket(daftarPaket(), rekor);
  const tautanAcak = (
    <a className="tautan-terang" href={tautanLatihan('kuis', PAKET_ACAK)}>{t('latihan.kuis_acak_jumlah_soal', { jumlah: angka(String(jumlahAcak())) })}</a>
  );
  if (!saran) {
    return (
      <section className="panel-acak" aria-labelledby="judul-saran">
        <h2 id="judul-saran">{t('latihan.semua_paket_sudah_sangat_baik')}</h2>
        <p className="jumlah-tersedia">{t('latihan.coba_kuis_acak_untuk_menguji_semua_bab')}</p>
        <a className="aw-btn aw-btn-sm tombol-terang" href={tautanLatihan('kuis', PAKET_ACAK)}>{t('latihan.mulai_kuis_acak')}</a>
      </section>
    );
  }
  const catatan = rekor[saran.paket.kode];
  const persen = catatan ? persenRekor(catatan) : null;
  return (
    <section className="panel-acak" aria-labelledby="judul-saran">
      <h2 id="judul-saran">{judulTopik(saran.paket.bab)}</h2>
      <p className="jumlah-tersedia">
        {catatan && persen !== null
          ? t('latihan.nilai_terbaikmu_di_paket_ini_persen_predikat', { persen: angka(String(persen)), predikat: teksPredikat(predikatDari(persen)) })
          : t('latihan.paket_ini_belum_pernah_kamu_coba_jumlah_soal', { jumlah: angka(String(saran.paket.jumlahSoal)) })}
        {persen !== null && teksTarget(persen) && <> {teksTarget(persen)}.</>}
      </p>
      <div className="aksi-acak">
        <a className="aw-btn aw-btn-sm tombol-terang" href={tautanLatihan('kuis', saran.paket.kode)}>{catatan ? t('latihan.kerjakan_lagi') : t('latihan.mulai_kuis')}</a>
        {tautanAcak}
      </div>
    </section>
  );
}

export function PapanKuis() {
  const rekor = bacaRekorPaket();
  return (
    <section className="papan-kuis" aria-labelledby="judul-papan">
      <h2 id="judul-papan" className="judul-bagian">{t('latihan.nilai_terbaik_per_paket')}</h2>
      <p className="lencana-draf">{t('umum.draf_belum_direview_tim_keilmuan')}</p>
      <div className="kepala-papan" aria-hidden="true"><span>{t('latihan.paket')}</span><span>{t('latihan.nilai_terbaik')}</span></div>
      <ul className="daftar-polos">
        {daftarPaket().map(paket => <BarisPaket key={paket.kode} paket={paket} rekor={rekor[paket.kode]} />)}
      </ul>
    </section>
  );
}

function BarisPaket({ paket, rekor }: { paket: PaketKuis; rekor: RekorPaket | undefined }) {
  const persen = rekor ? persenRekor(rekor) : null;
  const predikat = persen === null ? null : predikatDari(persen);
  const target = persen === null ? null : teksTarget(persen);
  return (
    <li className={`baris-paket predikat-${predikat ?? 'belum'}`}>
      <div className="nama-paket">
        <a className="tautan-paket" href={tautanLatihan('kuis', paket.kode)}>{judulTopik(paket.bab)}</a>
        <span className="keterangan">{t('latihan.jumlah_soal', { jumlah: paket.jumlahSoal })}</span>
      </div>
      {persen === null || !rekor ? <p className="nilai-paket belum-dicoba">{t('latihan.belum_dicoba')}</p> : (
        <div className="nilai-paket">
          <span className="sembunyi-visual">{t('latihan.nilai_terbaik')}: </span>
          <span className="baris-nilai">
            <b className="persen-terbaik">{angka(String(persen))}<small>%</small></b>
            <span className="pil-predikat">{teksPredikat(predikat!)}</span>
          </span>
          <span className="bar-nilai" aria-hidden="true"><span style={{ width: `${persen}%` }} /><i style={{ insetInlineStart: `${TANGGA_PREDIKAT[TANGGA_PREDIKAT.length - 1]!.dari}%` }} /></span>
          <span className="keterangan">{[target, t('latihan.jumlah_kali', { jumlah: angka(String(rekor.jumlahCoba)) })].filter(Boolean).join(' · ')}</span>
        </div>
      )}
      <span className="aksi-paket" aria-hidden="true">{rekor ? t('latihan.kerjakan_lagi') : t('latihan.mulai_kuis')}</span>
    </li>
  );
}
