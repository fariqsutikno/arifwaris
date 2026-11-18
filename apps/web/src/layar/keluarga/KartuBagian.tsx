// Kartu bagian aktif kanvas keluarga (spec kanvas 5.5): label, pengantar cabang, pertanyaan (h2, menerima fokus saat
// bagian berganti), isi, dan kaki berisi status bagian + tombol lanjut lokal. Tombol tidak pernah nonaktif.

import type { ReactNode, RefObject } from 'react';
import { t } from '../../terjemah';
import { Tombol } from '../../ui/komponen';

interface Props {
  label: string; pertanyaan: string; pengantar?: string | undefined; masuk: boolean;
  judulRef: RefObject<HTMLHeadingElement>; lengkap: boolean; tandai: boolean;
  /** Yang kurang, disebut tepat; dipakai bila `tandai`. */
  pesanKurang: string; labelLanjut: string;
  saatLanjut: () => void; children?: ReactNode;
}

export function KartuBagian({ label, pertanyaan, pengantar, masuk, judulRef, lengkap, tandai, pesanKurang, labelLanjut, saatLanjut, children }: Props) {
  return (
    <section className={masuk ? 'grup masuk' : 'grup'} aria-labelledby="judul-bagian-aktif">
      <span className="label">{label}</span>
      {pengantar && <p className="pengantar">{pengantar}</p>}
      <h2 id="judul-bagian-aktif" ref={judulRef} tabIndex={-1}>{pertanyaan}</h2>
      {children}
      <div className="kaki-grup">
        <span className="kecil redup" role="status">
          {lengkap ? t('hitung.kanvas.kaki_lengkap') : tandai ? <span className="salah">{pesanKurang || t('hitung.kanvas.kaki_kurang')}</span> : null}
        </span>
        <Tombol onClick={saatLanjut}>{labelLanjut}</Tombol>
      </div>
    </section>
  );
}
