// "Kisah harta {X}" di Periksa (spec kanvas 7.3): linimasa kematian sebelum pemilik, babak per almarhum dengan jeda waktu dan
// benang "harta masih belum dibagi", penutup "Hari ini", lalu catatan khusus. Hanya fakta isian. Babak yang sedang disunting
// bisa dikontrol dari luar (Ubah dipandu membukanya); tanpa prop, komponen mengurusnya sendiri.

import { useEffect, useState } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus, TanggalKira } from '../../kasus';
import type { Aksi } from '../../keadaan';
import { namaSingkat } from '../../keadaanOrang';
import { babakKisah, catatanKhusus, hidupSekarang, jedaTahun, kematianSebelum } from '../../kisah';
import { t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';
import { gulirKe } from '../keluarga/gulir';
import { BabakKisah } from './BabakKisah';

interface Props {
  kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void; kirim: (aksi: Aksi) => void;
  babakDisunting?: IdOrang | null; saatSunting?: (id: IdOrang | null) => void;
}

export function KisahHarta({ kasus, ubah, kirim, babakDisunting, saatSunting }: Props) {
  const [dalam, setDalam] = useState<IdOrang | null>(null);
  const disunting = babakDisunting !== undefined ? babakDisunting : dalam;
  const sunting = (id: IdOrang | null) => (saatSunting ? saatSunting(id) : setDalam(id));
  useEffect(() => { if (disunting) gulirKe(document.getElementById(`babak-${disunting}`)); }, [disunting]);
  const nama = (id: IdOrang) => namaSingkat(kasus, id);
  const pemilik = nama(kasus.graf.idPewaris);
  const babak = babakKisah(kasus);
  const harta = t('hitung.periksa.harta_belum_dibagi', { nama: pemilik });
  const tahunWafat = (id: IdOrang): TanggalKira | undefined => kasus.waktu?.[id]?.wafat;
  const hidup = hidupSekarang(kasus).map(nama).join(', ');
  return (
    <section className="kartu tumpuk" aria-labelledby="judul-kisah">
      <h2 id="judul-kisah" className="judul-bagian-kecil">{t('hitung.periksa.kisah_judul', { nama: pemilik })}</h2>
      <div className="linimasa">
        {kematianSebelum(kasus).map(id => (
          <div key={id} className="jeda sebelum">{t('hitung.periksa.sebelum_pemilik', { tahun: tahunWafat(id)?.tahun ?? '?', nama: nama(id), pemilik })}</div>
        ))}
        {babak.map((satu, indeks) => (
          <div key={satu.idMayit} className="langkah-kisah">
            {indeks > 0 && <Jeda kata={kataJeda(jedaTahun(babak[indeks - 1]!.tahun, satu.tahun))} harta={harta} />}
            <BabakKisah kasus={kasus} babak={satu} ubah={ubah} kirim={kirim} terbuka={disunting === satu.idMayit}
              saatBuka={() => sunting(satu.idMayit)} saatTutup={() => sunting(null)} />
          </div>
        ))}
        <Jeda kata={t('hitung.periksa.sampai_hari_ini')} harta={harta} />
        <article className="babak kini" aria-label={t('hitung.periksa.hari_ini')}>
          <div className="kepala"><div>
            <div className="tahun-besar">{t('hitung.periksa.hari_ini')}</div>
            <div className="judul-babak">{t('hitung.periksa.yang_masih_hidup')}</div>
          </div></div>
          <p>{t('hitung.periksa.hari_ini_isi', { daftar: hidup, pemilik })}</p>
        </article>
      </div>
      {catatanKhusus(kasus).map(({ jenis, orang }) => <p key={jenis} className="kecil redup">{kalimatCatatan(kasus, jenis, orang)}</p>)}
      <p className="kecil redup">{t('hitung.periksa.catatan_harta', { nama: pemilik })}</p>
    </section>
  );
}

const kataJeda = (tahun: number | null) => tahun === null ? t('hitung.periksa.jeda_tanpa_tahun') : t('hitung.periksa.jeda_tahun', { n: tahun });

function Jeda({ kata, harta }: { kata: string; harta: string }) {
  return <div className="jeda">{kata} <span className="harta"><Ikon nama="rumah" ukuran={13} />{harta}</span></div>;
}

function kalimatCatatan(kasus: Kasus, jenis: string, orang: IdOrang[]): string {
  const daftar = orang.map(id => namaSingkat(kasus, id)).join(', ');
  const nama = daftar;
  switch (jenis) {
    case 'bersamaan': return t('hitung.cerita.bersamaan', { daftar });
    case 'hilang': return t('hitung.cerita.hilang', { nama });
    case 'janin': return t('hitung.penutup.status_dalam_kandungan');
    default: return t('hitung.cerita.sesudah_dibagi', { nama });
  }
}
