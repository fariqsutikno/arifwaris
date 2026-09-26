// Bilah di atas halaman turunan (FAQ, glosarium, materi, rujukan, riwayat, latihan): Kembali di kiri, Bagikan di kanan.
// Kembali selalu ke halaman induk (naik satu tingkat), bukan ke halaman yang terakhir dibuka.

import { cariPelajaran } from '../konten/sumber';
import { tautanInduk, type Rute } from '../rute';
import { Bagikan } from './Bagikan';
import { Ikon } from './Ikon';
import { t } from '../terjemah';

export function KepalaHalaman({ rute }: { rute: Rute }) {
  const judul = judulBagikan(rute);
  return (
    <div className="kepala-halaman">
      <a className="tombol-kembali" href={tautanInduk(rute)}>
        <Ikon nama="kembali" ukuran={18} />{t('umum.kembali_2')}
      </a>
      {judul && <Bagikan judul={judul} tautan={window.location.hash} />}
    </div>
  );
}

/** Judul untuk menu bagikan; halaman yang tidak layak dibagikan (riwayat pribadi, latihan) mengembalikan null. */
function judulBagikan(rute: Rute): string | null {
  switch (rute.halaman) {
    case 'materi': return cariPelajaran(rute.slug)?.judul ?? null;
    case 'faq': return t('umum.faq_faraidh');
    case 'tanya-jawab': return t('umum.tanya_jawab_kasus_waris');
    case 'glosarium': return t('umum.glosarium_faraidh');
    case 'rujukan': return t('umum.rujukan_faraidh');
    default: return null;
  }
}
