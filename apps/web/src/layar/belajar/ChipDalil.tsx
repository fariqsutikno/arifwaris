// Chip "Dalil" di dalam teks (materi, FAQ, daftar hukum di Rujukan). Mengetuknya membuka lembar dalil di atas halaman
// (di HP menempel di bawah seperti lembar aplikasi), jadi pembaca tidak kehilangan posisi bacanya.
// Lembar dirender lewat portal karena chip ada di dalam <p>.

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { cariRujukan } from '@waris/content';
import { tautanRujukan } from '../../rute';
import { Ikon } from '../../ui/Ikon';
import { Dalil } from '../Penjelasan';
import { t } from '../../terjemah';

export function ChipDalil({ kode }: { kode: string }) {
  const [terbuka, setTerbuka] = useState(false);
  const klaim = cariRujukan(kode)?.klaim ?? kode;
  return (
    <>
      <button type="button" className="chip-dalil" aria-haspopup="dialog" aria-label={`${t('Dalil')}: ${klaim}`} onClick={() => setTerbuka(true)}>
        <Ikon nama="rujukan" ukuran={14} />{t('Dalil')}
      </button>
      {terbuka && createPortal(<LembarDalil kode={kode} klaim={klaim} saatTutup={() => setTerbuka(false)} />, document.body)}
    </>
  );
}

function LembarDalil({ kode, klaim, saatTutup }: { kode: string; klaim: string; saatTutup: () => void }) {
  const rujukan = cariRujukan(kode);
  return (
    <div className="modal-latar" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div className="modal-orang modal-kecil lembar" role="dialog" aria-modal="true" aria-labelledby="judul-lembar-dalil"
        onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
        <header className="kepala-modal netral">
          <div><p className="peran-modal">{t('Dalil')}</p><h2 id="judul-lembar-dalil">{klaim}</h2></div>
          <button type="button" className="tombol-ikon" autoFocus onClick={saatTutup} aria-label={t('Tutup')}><Ikon nama="salah" ukuran={18} /></button>
        </header>
        <div className="isi-modal isi-lembar-dalil">
          <Dalil daftarKode={[kode]} diHalamanRujukan />
          {/* Kutipan teks asli sama seperti di halaman detail Rujukan. */}
          {rujukan?.arab.map(teks => <blockquote key={teks} lang="ar" dir="rtl" className="kutipan-arab">{teks}</blockquote>)}
          {rujukan && rujukan.arab.length === 0 && rujukan.kutipan && <p>{rujukan.kutipan}</p>}
        </div>
        <footer className="kaki-modal">
          <a className="aw-btn aw-btn-secondary aw-btn-sm" href={tautanRujukan(kode)} onClick={saatTutup}>{t('Buka di Rujukan')}</a>
        </footer>
      </div>
    </div>
  );
}
