// Hasil versi minimal bab 13 (spec 3): taqdir (janin/hilang/khuntsa), gharqa, dan menunggu kelahiran.
// Semua angka dari engine; pecahan/persen hanya penyajian (ringkasan.ts). Tanpa tabel faraidh per dunia (di luar cakupan).
// Semua varian memakai KerangkaHasilKhusus (hero + lembar yang sama dengan Hasil biasa); di sini hanya isi kartunya.

import { useEffect } from 'react';
import type { HartaGharqa, HasilGharqa, HasilTaqdir, IdOrang, NilaiTaqdir, Pertanyaan } from '@waris/engine';
import { formatRupiah, formatRupiahRingkas } from '../format';
import type { HasilTampil } from '../jalankan';
import type { Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { namaSingkat } from '../keadaanOrang';
import { Baris, daftarBabDari } from '../layar/Penjelasan';
import { simpanKasus } from '../tersimpan';
import { Ikon } from '../ui/Ikon';
import { t } from '../terjemah';
import { KerangkaHasilKhusus } from './KerangkaHasilKhusus';
import { Lipat } from './Lipat';
import { pecahanTeks, persenTeks } from './ringkasan';

type TampilKhusus = Extract<HasilTampil, { jenis: 'taqdir' | 'gharqa' | 'menunggu' }>;
type TaqdirOk = Extract<HasilTaqdir, { status: 'OK' }>;
type GharqaSelesai = Extract<HasilGharqa, { status: 'OK' | 'MAUQUF' }>;
interface Props { kasus: Kasus; tampil: TampilKhusus; kirim: (aksi: Aksi) => void; idSesi: string }

export function HasilKasusKhusus({ kasus, tampil, kirim, idSesi }: Props) {
  if (tampil.jenis === 'menunggu') return <Menunggu kasus={kasus} kirim={kirim} idSesi={idSesi} />;
  const hasil = tampil.hasil;
  if (hasil.status === 'PERLU_INPUT') return <PerluInput kasus={kasus} pertanyaan={hasil.pertanyaan} kirim={kirim} />;
  if (hasil.status === 'TIDAK_DIDUKUNG' || hasil.status === 'MAUQUF_SEMUA') {
    return <Pesan kasus={kasus} kirim={kirim} judul={t('hitung.kasus_ini_belum_bisa_dihitung_di')} isi={hasil.alasan} />;
  }
  const daftarBab = daftarBabDari(kasus, tampil);
  const taqdir = tampil.jenis === 'taqdir' && tampil.hasil.status === 'OK' ? tampil.hasil : null;
  const ditahan = taqdir && taqdir.mauquf > 0n;
  return (
    <KerangkaHasilKhusus kasus={kasus} kirim={kirim}
      judul={tampil.jenis === 'gharqa' ? t('hasil.titipan.judul_gharqa') : ditahan ? t('hasil.titipan.judul_sementara') : t('hasil.titipan.judul_pembagian')}
      keterangan={tampil.jenis === 'gharqa' ? t('hasil.titipan.gharqa_pembuka') : ditahan ? t('hasil.titipan.keterangan_sementara') : undefined}
      statistik={ditahan ? [{ nilai: formatRupiahRingkas(taqdir.nominalMauquf), label: t('hasil.titipan.stat_ditahan') }] : []}>
      {taqdir && <Taqdir kasus={kasus} hasil={taqdir} />}
      {tampil.jenis === 'gharqa' && (tampil.hasil.status === 'OK' || tampil.hasil.status === 'MAUQUF') && <Gharqa kasus={kasus} hasil={tampil.hasil} />}
      {daftarBab.length > 0 && (
        <Lipat judul={t('hasil.titipan.langkah_perhitungan')}>
          {daftarBab.map(({ judulBagian, bab }, indeks) => (
            <section key={indeks}>
              {judulBagian && <h3>{judulBagian}</h3>}
              <h4>{bab.judul}</h4>
              <ul>{bab.daftarBaris.map((baris, urutan) => <li key={urutan}><Baris baris={baris} /></li>)}</ul>
            </section>
          ))}
        </Lipat>
      )}
    </KerangkaHasilKhusus>
  );
}

// ─── Taqdir ───────────────────────────────────────────────────────────────────

/** Janin disebut "Bayi dalam kandungan {ibu}", bukan "Anak laki-laki 2" yang terbaca seperti anak yang sudah lahir. */
const namaDiHasil = (kasus: Kasus, id: IdOrang): string => {
  const orang = kasus.graf.orang[id]!;
  return orang.statusHidup === 'dalamKandungan' && !orang.nama && orang.idIbu ? t('hitung.janin.baris', { ibu: namaSingkat(kasus, orang.idIbu) }) : namaSingkat(kasus, id);
};

function Taqdir({ kasus, hasil }: { kasus: Kasus; hasil: TaqdirOk }) {
  const { orang } = kasus.graf;
  const orangNyata = (id: string) => !!orang[id];
  const diterima = Object.entries(hasil.nominal).filter(([id, nominal]) => orangNyata(id) && nominal > 0n).sort(([, a], [, b]) => (a < b ? 1 : -1));
  // Yang ditahan: alasan 'ditahan' / 'kelasD' dari jejak [R13-15], atau node belum pasti yang belum menerima apa pun.
  const menunggu = new Set<IdOrang>([
    ...hasil.jejak.flatMap(langkah => (langkah.jenis === 'TAQDIR_PEMBERIAN' && langkah.alasan !== 'aqall' ? [langkah.idOrang] : [])),
    ...Object.keys(hasil.daftarDunia[0]?.taqdir ?? {}).filter(id => orang[id]?.statusHidup === 'dalamKandungan' || orang[id]?.statusHidup === 'mafqud'),
  ]);
  const teksMenunggu = (id: IdOrang) => (orang[id]?.statusHidup === 'mafqud' ? t('hasil.titipan.menunggu_kabar')
    : orang[id]?.statusHidup === 'dalamKandungan' ? t('hasil.titipan.menunggu_bayi') : t('hasil.titipan.menunggu_kepastian'));
  return (
    <>
      <section className="kartu-sisi kartu-isi">
        <h2>{t('hasil.titipan.pembagian_sekarang')}</h2>
        <ul className="daftar-keadaan">
          {diterima.map(([id, nominal]) => <li key={id} className="baris-kerabat"><b>{namaDiHasil(kasus, id)}</b><span>{formatRupiah(nominal)}</span></li>)}
          {[...menunggu].filter(id => orangNyata(id) && !(hasil.nominal[id]! > 0n)).map(id => (
            <li key={id} className="baris-kerabat nonaktif"><b>{namaDiHasil(kasus, id)}</b><span>{teksMenunggu(id)}</span></li>
          ))}
        </ul>
      </section>
      {hasil.mauquf > 0n && <KartuTitipan nominal={hasil.nominalMauquf} />}
      <Lipat judul={t('hasil.titipan.kalau_terbukti')}>
        {hasil.daftarDunia.map((dunia, indeks) => (
          <section key={indeks}>
            <h3>{Object.entries(dunia.taqdir).map(([id, nilai]) => `${namaDiHasil(kasus, id)}: ${teksTaqdir(nilai, !!orang[id]?.khuntsa)}`).join(' · ')}</h3>
            <ul>
              {Object.entries(dunia.saham).filter(([id, saham]) => orangNyata(id) && saham > 0n).map(([id, saham]) => (
                <li key={id}>{namaDiHasil(kasus, id)}: {pecahanTeks(saham, hasil.jamiah, 'sederhana')} ({persenTeks(saham, hasil.jamiah)})</li>
              ))}
            </ul>
          </section>
        ))}
      </Lipat>
    </>
  );
}

function teksTaqdir(nilai: NilaiTaqdir, khuntsa: boolean): string {
  switch (nilai) {
    case 'mati': return t('hasil.titipan.taqdir_mati');
    case 'hidup': return t('hasil.titipan.taqdir_hidup');
    case 'lk': return khuntsa ? t('hasil.titipan.taqdir_khuntsa_lk') : t('hasil.titipan.taqdir_lk');
    case 'pr': return khuntsa ? t('hasil.titipan.taqdir_khuntsa_pr') : t('hasil.titipan.taqdir_pr');
    case 'duaLk': return t('hasil.titipan.taqdir_dua_lk');
    case 'duaPr': return t('hasil.titipan.taqdir_dua_pr');
    case 'lkPr': return t('hasil.titipan.taqdir_lk_pr');
  }
}

function KartuTitipan({ nominal }: { nominal: bigint }) {
  return (
    <section className="kartu-sisi kartu-isi kartu-titipan">
      <h2><Ikon nama="berkas" />{t('hasil.titipan.judul')} <small>{t('hasil.titipan.istilah')}</small></h2>
      <p className="angka-besar">{formatRupiah(nominal)}</p>
      <p>{t('hasil.titipan.alasan')}</p>
      <p className="keterangan">{t('hasil.titipan.setelah_jelas')}</p>
    </section>
  );
}

// ─── Gharqa ───────────────────────────────────────────────────────────────────

function Gharqa({ kasus, hasil }: { kasus: Kasus; hasil: GharqaSelesai }) {
  const kartuHarta = (harta: HartaGharqa) => (
    <section key={harta.mayit} className="kartu-sisi kartu-isi">
      <h2>{t('hasil.titipan.harta_nama', { nama: namaSingkat(kasus, harta.mayit) })}</h2>
      <ul className="daftar-keadaan">
        {Object.entries(harta.nominal).filter(([id, nominal]) => kasus.graf.orang[id] && nominal > 0n).map(([id, nominal]) => (
          <li key={id} className="baris-kerabat"><b>{namaSingkat(kasus, id)}</b><span>{formatRupiah(nominal)}</span></li>
        ))}
      </ul>
      {harta.mauquf > 0n && <KartuTitipan nominal={harta.nominalMauquf} />}
      {harta.mauqufSemua && <p>{harta.mauqufSemua.alasan}</p>}
    </section>
  );
  return (
    <>
      {hasil.status === 'OK' ? hasil.harta.map(kartuHarta) : (
        <>
          <section className="kartu-sisi kartu-isi kartu-titipan"><h2>{t('hasil.titipan.gharqa_ditahan')}</h2></section>
          <Lipat judul={t('hasil.titipan.skenario')}>
            {hasil.skenario.map((skenario, indeks) => (
              <section key={indeks}>
                <h3>{t('hasil.titipan.kalau_duluan', { nama: namaSingkat(kasus, skenario.urutan[0]!) })}</h3>
                {skenario.harta.map(kartuHarta)}
              </section>
            ))}
          </Lipat>
        </>
      )}
    </>
  );
}

// ─── Menunggu, PERLU_INPUT, pesan ─────────────────────────────────────────────

function Menunggu({ kasus, kirim, idSesi }: { kasus: Kasus; kirim: Props['kirim']; idSesi: string }) {
  useEffect(() => simpanKasus(idSesi, kasus), [idSesi, kasus]);
  return (
    <KerangkaHasilKhusus kasus={kasus} kirim={kirim} bolehEkspor={false} judul={t('hasil.titipan.menunggu_judul')} keterangan={t('hasil.titipan.menunggu_isi')}>
      <section className="kartu-sisi kartu-isi kartu-titipan" role="status">
        <h2>{t('hasil.titipan.tidak_mau_menunggu')}</h2>
        <button type="button" className="tautan-aksi" onClick={() => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, pilihanJanin: 'hitungSekarang' }) })}>
          {t('hasil.titipan.hitung_sekarang_saja')}
        </button>
      </section>
    </KerangkaHasilKhusus>
  );
}

// Batas kemungkinan (BATAS_DUNIA) datang sebagai satu pertanyaan statusHidup per sumber: tampil sebagai daftar orang, bukan pesan teknis.
function PerluInput({ kasus, pertanyaan, kirim }: { kasus: Kasus; pertanyaan: Pertanyaan[]; kirim: Props['kirim'] }) {
  const terlaluBanyak = pertanyaan.length > 1 && pertanyaan.every(p => p.isian === 'statusHidup' && p.idOrang);
  return (
    <KerangkaHasilKhusus kasus={kasus} kirim={kirim} bolehEkspor={false} judul={terlaluBanyak ? t('hasil.titipan.terlalu_banyak') : t('hitung.hasil.perlu_input_judul')}
      keterangan={terlaluBanyak ? t('hasil.titipan.terlalu_banyak_ket') : undefined}>
      <section className="kartu-sisi kartu-isi" role="alert">
        {terlaluBanyak ? (
          <ul className="daftar-keadaan">
            {pertanyaan.map(p => (
              <li key={p.idOrang} className="baris-kerabat">
                <b>{namaSingkat(kasus, p.idOrang!)}</b>
                <button type="button" className="tautan" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 3 })}>{t('hasil.titipan.pastikan')}</button>
              </li>
            ))}
          </ul>
        ) : <ul>{pertanyaan.map((p, indeks) => <li key={indeks}>{p.alasan}</li>)}</ul>}
      </section>
    </KerangkaHasilKhusus>
  );
}

function Pesan({ kasus, kirim, judul, isi }: { kasus: Kasus; kirim: Props['kirim']; judul: string; isi: string }) {
  return (
    <KerangkaHasilKhusus kasus={kasus} kirim={kirim} bolehEkspor={false} judul={judul}>
      <section className="kartu-sisi kartu-isi" role="alert"><p>{isi}</p></section>
    </KerangkaHasilKhusus>
  );
}
