// Pojok kanan bawah di desktop: jalan pintas ke FAQ (sementara chatbot belum ada) dan tautan lapor masalah yang selalu ada.
// Di HP disembunyikan; nav bawah sudah punya Belajar → FAQ.

import { tautanFaq } from '../rute';
import { Ikon } from './Ikon';
import { TAUTAN_LAPORAN } from '../konten/umum';

export function Dok() {
  return (
    <aside className="dok" aria-label="Bantuan cepat">
      <a href={TAUTAN_LAPORAN} target="_blank" rel="noopener" className="dok-lapor">Nemu masalah? Laporkan</a>
      <a href={tautanFaq()} className="dok-faq"><Ikon nama="tanya" ukuran={18} />FAQ</a>
    </aside>
  );
}
