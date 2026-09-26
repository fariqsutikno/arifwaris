// Pojok kanan bawah di desktop: jalan pintas ke FAQ (sementara chatbot belum ada) dan tautan lapor masalah yang selalu ada.
// Di HP disembunyikan; nav bawah sudah punya Belajar → FAQ.

import { tautanFaq } from '../rute';
import { Ikon } from './Ikon';
import { TAUTAN_LAPORAN } from '../konten/umum';
import { t } from '../terjemah';

export function Dok() {
  return (
    <aside className="dok" aria-label={t('umum.bantuan_cepat')}>
      <a href={TAUTAN_LAPORAN} target="_blank" rel="noopener" className="dok-lapor">{t('umum.nemu_masalah_laporkan')}</a>
      <a href={tautanFaq()} className="dok-faq"><Ikon nama="tanya" ukuran={18} />{t('umum.faq')}</a>
    </aside>
  );
}
