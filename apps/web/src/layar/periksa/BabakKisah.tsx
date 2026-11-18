// Satu babak kisah: tahun besar, judul, narasi fakta (siapa ditinggalkan, siapa sudah tiada, siapa belum pasti), pohon kecil
// saat itu, dan panel "Ubah" bertahap. Tidak menyebut siapa mendapat apa (spec kanvas 7.3). Perubahan lewat ubah()/kirim().

import { useState, type ReactNode } from 'react';
import type { IdOrang } from '@waris/engine';
import { geserUrutan, urutanDariTahun } from '../../antreanUrutan';
import type { Kasus } from '../../kasus';
import type { Aksi } from '../../keadaan';
import { namaSingkat } from '../../keadaanOrang';
import type { BabakKisah as DataBabak } from '../../kisah';
import { daftarBagian } from '../../kelompok';
import { judulBagian } from '../../ringkasanBagian';
import { sebutanDariSaya } from '../../sebutan';
import { aturTahunWafat } from '../../silsilah';
import { t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';
import { IsianTahun } from '../keluarga/IsianTahun';
import { JawabKeadaan } from './JawabKeadaan';
import { PohonKecil } from './PohonKecil';

interface Props {
  kasus: Kasus; babak: DataBabak; ubah: (f: (k: Kasus) => Kasus) => void; kirim: (aksi: Aksi) => void;
  terbuka: boolean; saatBuka: () => void; saatTutup: () => void;
}
type Apa = 'tahun' | 'urutan' | 'keadaan' | 'orang';

export function BabakKisah({ kasus, babak, ubah, kirim, terbuka, saatBuka, saatTutup }: Props) {
  const nama = namaSingkat(kasus, babak.idMayit);
  const pemilik = namaSingkat(kasus, kasus.graf.idPewaris);
  const idJudul = `judul-babak-${babak.idMayit}`;
  return (
    <article className="babak" id={`babak-${babak.idMayit}`} aria-labelledby={idJudul}>
      <div className="kepala">
        <div>
          <div className="tahun-besar">{babak.tahun ? babak.tahun.tahun : t('hitung.periksa.tahun_kosong')}</div>
          <div className="judul-babak" id={idJudul}>{t('hitung.periksa.babak_wafat', { nama })}
            {babak.urutanBelumPasti && !babak.tahun && <> <span className="lencana-urutan">{t('hitung.periksa.urutan_belum_pasti')}</span></>}</div>
        </div>
        {!terbuka && <button type="button" className="aksi-teks" onClick={saatBuka}><Ikon nama="pensil" ukuran={15} />{t('hitung.periksa.ubah')}</button>}
      </div>
      <div className="tubuh">
        <p data-testid="narasi">{narasi(kasus, babak, nama, pemilik)}</p>
        <div className="mini-pohon"><PohonKecil kasus={kasus} babak={babak} /></div>
      </div>
      {terbuka && <Sunting kasus={kasus} babak={babak} ubah={ubah} kirim={kirim} saatTutup={saatTutup} />}
    </article>
  );
}

function narasi(kasus: Kasus, babak: DataBabak, nama: string, pemilik: string): ReactNode {
  const orang = (id: IdOrang) => { const sebutan = sebutanDariSaya(kasus, id); const diri = namaSingkat(kasus, id); return sebutan ? `${sebutan} (${diri})` : diri; };
  const gabung = (ids: IdOrang[]) => { const nama = ids.map(orang); return nama.length <= 1 ? nama.join('') : `${nama.slice(0, -1).join(', ')} ${t('hitung.cerita.dan')} ${nama.at(-1)}`; };
  // Daftar yang membuka kalimat diawali huruf besar walau diawali sebutan "-mu" (pamanmu, nenekmu).
  const awalKapital = (teks: string) => teks.charAt(0).toUpperCase() + teks.slice(1);
  const tiada = babak.sudahTiada.filter(id => id !== kasus.graf.idPewaris);   // pemilik sudah jelas wafat lebih dulu
  const pasti = (ids: IdOrang[]) => ids.filter(id => !babak.belumPasti.includes(id));
  const ditinggalkan = [...pasti(babak.pasangan), ...pasti(babak.anak), ...pasti(babak.orangTua)];
  return (
    <>
      {babak.nomor === 0 ? t('hitung.periksa.babak_pembuka_pertama', { nama }) : t('hitung.periksa.babak_pembuka_lanjut', { nama, pemilik })}
      {ditinggalkan.length > 0 && ` ${t('hitung.periksa.meninggalkan', { daftar: gabung(ditinggalkan) })}`}
      {tiada.length > 0 && ` ${t('hitung.periksa.sudah_tiada', { daftar: awalKapital(gabung(tiada)) })}`}
      {babak.belumPasti.length > 0 && <> <em>{t('hitung.periksa.belum_dipastikan_hidup', { daftar: awalKapital(gabung(babak.belumPasti)) })}</em></>}
      {babak.nomor > 0 && ` ${t('hitung.periksa.bagian_jadi_milik', { nama, pemilik })}`}
    </>
  );
}

function Sunting({ kasus, babak, ubah, kirim, saatTutup }: Pick<Props, 'kasus' | 'babak' | 'ubah' | 'kirim'> & { saatTutup: () => void }) {
  const [apa, setApa] = useState<Apa | null>(null);
  const [siapa, setSiapa] = useState<IdOrang | null>(null);
  const { idMayit } = babak;
  const nama = namaSingkat(kasus, idMayit);
  const pilihLain = () => { setApa(null); setSiapa(null); };
  const adaUrutan = kasus.urutanWafat.includes(idMayit) && kasus.urutanWafat.length > 1;
  const opsi = (kunci: Apa, judul: string, ket?: string) => (
    <button key={kunci} type="button" className="opsi-urutan" onClick={() => setApa(kunci)}>{judul}{ket && <small>{ket}</small>}</button>
  );
  return (
    <div className="sunting-babak">
      {apa === null && <>
        <span className="langkah-ubah">{t('hitung.periksa.babak_keliru')}</span>
        <div className="pilihan-urutan">
          {opsi('tahun', t('hitung.periksa.tahun_wafat', { nama }), babak.tahun ? t('hitung.periksa.tahun_sekarang', { tahun: babak.tahun.tahun }) : t('hitung.periksa.belum_diisi'))}
          {adaUrutan && opsi('urutan', t('hitung.periksa.urutan_opsi', { nama }))}
          {opsi('keadaan', t('hitung.periksa.keadaan_babak'), t('hitung.periksa.keadaan_babak_ket'))}
          {opsi('orang', t('hitung.periksa.orang_babak'), t('hitung.periksa.orang_babak_ket'))}
        </div>
      </>}
      {apa === 'tahun' && <IsianTahun label={t('hitung.periksa.tahun_wafat', { nama })} contoh={t('hitung.periksa.tahun_ingat')}
        nilai={kasus.waktu?.[idMayit]?.wafat} saatUbah={tahun => ubah(k => aturTahunWafat(k, idMayit, tahun))} />}
      {apa === 'urutan' && <PilihUrutan kasus={kasus} idMayit={idMayit} ubah={ubah} />}
      {apa === 'keadaan' && !siapa && <>
        <span className="langkah-ubah">{t('hitung.periksa.keadaan_siapa')}</span>
        <div className="pilihan-urutan">
          {[...babak.pasangan, ...babak.anak, ...babak.orangTua, ...babak.sudahTiada].filter((id, i, semua) => semua.indexOf(id) === i).map(id =>
            <button key={id} type="button" className="opsi-urutan" onClick={() => setSiapa(id)}>{namaSingkat(kasus, id)}</button>)}
        </div>
      </>}
      {apa === 'keadaan' && siapa && <>
        <span className="langkah-ubah">{t('hitung.periksa.keadaan_sekarang', { nama: namaSingkat(kasus, siapa) })}</span>
        <JawabKeadaan kasus={kasus} id={siapa} milik={idMayit} ubah={ubah} />
      </>}
      {apa === 'orang' && <>
        <span className="langkah-ubah">{t('hitung.periksa.bagian_mana')}</span>
        <div className="pilihan-urutan">
          {daftarBagian(kasus).filter(b => b.milik === idMayit && b.jenis !== 'urutan' && b.jenis !== 'kamu').map(b =>
            <button key={b.id} type="button" className="opsi-urutan"
              onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 3, fokusBagian: b.id, dariPeriksa: true })}>{judulBagian(kasus, b)}</button>)}
        </div>
      </>}
      <div className="deret antar">
        {apa ? <button type="button" className="aksi-teks" onClick={pilihLain}><Ikon nama="kembali" ukuran={15} />{t('hitung.periksa.pilih_lain')}</button> : <span />}
        <button type="button" className="aksi-teks" onClick={saatTutup}><Ikon nama="benar" ukuran={15} />{t('hitung.periksa.selesai')}</button>
      </div>
    </div>
  );
}

/** Tombol lebih dulu/akhir hanya untuk arah yang boleh; bila tetangga ditentukan tahun, tampil kalimat penjelasnya. */
function PilihUrutan({ kasus, idMayit, ubah }: { kasus: Kasus; idMayit: IdOrang; ubah: (f: (k: Kasus) => Kasus) => void }) {
  const posisi = kasus.urutanWafat.indexOf(idMayit);
  const arah = ([[-1, t('hitung.periksa.lebih_dulu'), 'atas'], [1, t('hitung.periksa.lebih_akhir'), 'bawah']] as const).flatMap(([langkah, label, putar]) => {
    const tetangga = kasus.urutanWafat[posisi + langkah];
    return tetangga ? [{ langkah, label, putar, dariTahun: urutanDariTahun(kasus, idMayit, tetangga) }] : [];
  });
  return (
    <>
      <span className="langkah-ubah">{t('hitung.periksa.wafat_apa', { nama: namaSingkat(kasus, idMayit) })}</span>
      <div className="deret">
        {arah.filter(a => !a.dariTahun).map(a => (
          <button key={a.label} type="button" className="aksi-teks" onClick={() => ubah(k => geserUrutan(k, idMayit, a.langkah))}>
            <span className={`ikon-${a.putar}`}><Ikon nama="kembali" ukuran={15} /></span>{a.label}
          </button>
        ))}
      </div>
      {arah.some(a => a.dariTahun) && <p className="kecil redup">{t('hitung.periksa.urutan_ikut_tahun')}</p>}
    </>
  );
}
