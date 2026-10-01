// Pintu masuk layar Rujukan, tersusun menurut hierarki dalil KB bab 17.1.
// `#/rujukan/<kategori>`, `#/rujukan/<kode>` (satu dalil), `#/rujukan/kitab/<nomor>` (penampil PDF).

import { HeroMini } from '../../ui/Hero';
import { tautanRujukan } from '../../rute';
import { angka, t } from '../../terjemah';
import { Laci } from '../../ui/Laci';
import { DAFTAR_KATEGORI, IsiKategori, jumlahDi } from './Kategori';
import { Awal } from './Awal';
import { DetailDalil } from './DetailDalil';
import { PenampilKitab } from './PenampilKitab';

export const KATEGORI_RUJUKAN = DAFTAR_KATEGORI.map(isi => isi.id);

interface Props { kode?: string | undefined; kategori?: string | undefined; kitab?: string | undefined }

export function Rujukan({ kode, kategori, kitab }: Props) {
  const aktif = kode ? undefined : DAFTAR_KATEGORI.find(isi => isi.id === kategori);
  if (!kode && !aktif) return <Awal />;
  return (
    <div className="tata-materi">
      {!kode && kitab === undefined && (
        <HeroMini judul={t('umum.rujukan')} keterangan={t('rujukan.al_qur_an_sunnah_atsar_ijma')} ikon="rujukan" />
      )}
      <Laci key={kode ?? kategori ?? ''} id="kategori-rujukan" label={t('rujukan.kategori_dalil')}
        ringkasan={aktif ? <>{aktif.judul} <span className="jumlah-laci">{angka(String(jumlahDi(aktif)))}</span></> : t('rujukan.dalil_terpilih')} judul={<span className="label-langkah">{t('rujukan.kategori_dalil')}</span>}>
        <ol className="daftar-polos modul-sidebar">
          {DAFTAR_KATEGORI.map((isi, urutan) => (
            <li key={isi.id}>
              <a href={tautanRujukan(isi.id)} className="pelajaran-sidebar" aria-current={isi === aktif ? 'page' : undefined}>
                <span className="tanda-pelajaran">{isi.jenis ? urutan + 1 : ''}</span>
                <span className="isi-sidebar-rujukan">{isi.judul}<small>{angka(String(jumlahDi(isi)))}</small></span>
              </a>
            </li>
          ))}
        </ol>
      </Laci>
      <main className="konten-materi konten-rujukan">
        {kode ? <DetailDalil kode={kode} />
          : aktif!.id === 'kitab' && kitab !== undefined ? <PenampilKitab nomor={Number(kitab)} />
          : <IsiKategori kategori={aktif!} />}
      </main>
    </div>
  );
}
