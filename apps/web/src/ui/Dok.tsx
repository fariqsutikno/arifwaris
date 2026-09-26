// Pojok kanan bawah di desktop: jalan pintas ke FAQ (sementara chatbot belum ada).
// Di HP disembunyikan; nav bawah sudah punya Belajar → Tanya jawab.

import { tautanFaq } from '../rute';
import { Ikon } from './Ikon';

export function Dok() {
  return (
    <aside className="dok" aria-label="Bantuan cepat">
      <a href={tautanFaq()} className="dok-faq"><Ikon nama="tanya" ukuran={18} />Tanya jawab</a>
    </aside>
  );
}
