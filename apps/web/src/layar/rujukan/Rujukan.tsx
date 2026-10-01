// Pintu masuk layar Rujukan, tersusun menurut hierarki dalil KB bab 17.1.
// `#/rujukan/<kategori>`, `#/rujukan/<kode>` (satu dalil), `#/rujukan/kitab/<nomor>` (penampil PDF).

import { BarisKategori } from './BarisKategori';
import { DAFTAR_KATEGORI, IsiKategori } from './Kategori';
import { Awal } from './Awal';
import { DetailDalil } from './DetailDalil';
import { PenampilKitab } from './PenampilKitab';

export const KATEGORI_RUJUKAN = DAFTAR_KATEGORI.map(isi => isi.id);

interface Props { kode?: string | undefined; kategori?: string | undefined; kitab?: string | undefined }

export function Rujukan({ kode, kategori, kitab }: Props) {
  const aktif = kode ? undefined : DAFTAR_KATEGORI.find(isi => isi.id === kategori);
  if (!kode && !aktif) return <Awal />;
  return (
    <div className="tata-rujukan">
      <main className="konten-rujukan">
        {aktif && <BarisKategori aktif={aktif.id} />}
        {kode ? <DetailDalil kode={kode} />
          : aktif!.id === 'kitab' && kitab !== undefined ? <PenampilKitab nomor={Number(kitab)} />
          : <IsiKategori kategori={aktif!} />}
      </main>
    </div>
  );
}
