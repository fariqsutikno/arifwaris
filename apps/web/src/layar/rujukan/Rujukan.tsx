// Pintu masuk layar Rujukan, tersusun menurut hierarki dalil KB bab 17.1.
// `#/rujukan/<kategori>`, `#/rujukan/<kode>` (satu dalil), `#/rujukan/kitab/<nomor>` (penampil PDF).

import { tautanRujukan } from '../../rute';
import { t } from '../../terjemah';
import { BarisKategori } from './BarisKategori';
import { DAFTAR_KATEGORI, IsiKategori } from './Kategori';
import { Awal } from './Awal';
import { Kerangka } from './Kerangka';
import { DetailDalil } from './DetailDalil';
import { PenampilKitab } from './PenampilKitab';

export const KATEGORI_RUJUKAN = DAFTAR_KATEGORI.map(isi => isi.id);

interface Props { kode?: string | undefined; kategori?: string | undefined; kitab?: string | undefined }

export function Rujukan({ kode, kategori, kitab }: Props) {
  const aktif = kode ? undefined : DAFTAR_KATEGORI.find(isi => isi.id === kategori);
  if (!kode && !aktif) return <Awal />;
  if (kode) return <DetailDalil kode={kode} />;
  if (aktif!.id === 'kitab' && kitab !== undefined) return <PenampilKitab nomor={Number(kitab)} />;
  return (
    <Kerangka label={t('rujukan.kategori_dalil')} judul={aktif!.judul} lead={aktif!.lead} kembali={tautanRujukan()}>
      <BarisKategori aktif={aktif!.id} />
      <IsiKategori kategori={aktif!} />
    </Kerangka>
  );
}
