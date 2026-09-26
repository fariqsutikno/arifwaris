// Ekspor kasus ke berkas. Simpan biasa sudah otomatis ke perangkat (riwayat); ekspor untuk dipindah atau dibagikan.
// JSON bisa dibuka lagi lewat Impor di beranda. PNG dan PDF belum dibuat, jadi tampil nonaktif dengan label.

import type { Kasus } from '../kasus';
import { unduhKasus } from '../berkas';
import { Ikon, type NamaIkon } from '../ui/Ikon';
import { t } from '../terjemah';

interface Props { kasus: Kasus; saatTutup: () => void }

interface Format { id: string; judul: string; keterangan: string; ikon: NamaIkon; unduh?: (kasus: Kasus) => void }

const DAFTAR_FORMAT: Format[] = [
  { id: 'json', judul: 'JSON', keterangan: t('Bisa dibuka lagi di aplikasi ini lewat Impor.'), ikon: 'berkas', unduh: unduhKasus },
  // TODO: ekspor PNG (gambar tabel & pembagian) dan PDF (laporan) belum dibuat.
  { id: 'png', judul: 'PNG', keterangan: t('Gambar pembagian.'), ikon: 'gambar' },
  { id: 'pdf', judul: 'PDF', keterangan: t('Laporan lengkap dengan langkah hitung.'), ikon: 'berkas' },
];

export function ModalEkspor({ kasus, saatTutup }: Props) {
  return (
    <div className="modal-latar" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div className="modal-orang modal-kecil" role="dialog" aria-modal="true" aria-labelledby="judul-ekspor"
        onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
        <header className="kepala-modal netral"><div><h2 id="judul-ekspor">{t('Ekspor ke')}</h2></div></header>
        <div className="isi-modal">
          <ul className="daftar-polos daftar-format">
            {DAFTAR_FORMAT.map(format => (
              <li key={format.id}>
                <button type="button" className="pilihan-format" disabled={!format.unduh} autoFocus={format.id === 'json'}
                  onClick={() => { format.unduh?.(kasus); saatTutup(); }}>
                  <Ikon nama={format.ikon} ukuran={24} />
                  <span><b>{format.judul}</b><small>{format.unduh ? format.keterangan : t('Segera hadir')}</small></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <footer className="kaki-modal">
          <span className="pengisi" />
          <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={saatTutup}>{t('Tutup')}</button>
        </footer>
      </div>
    </div>
  );
}
