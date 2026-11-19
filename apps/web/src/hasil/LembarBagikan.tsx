// Lembar Bagikan di layar Hasil: pratinjau teks ringkasan + empat cara membagikan + "Jangan simpan kasus ini".
// Menerima teks dan aksi dari Hasil (tidak tahu soal engine atau penyimpanan). HP: lembar dari bawah, laptop: dialog tengah.
// Fokus pindah ke tautan Tutup saat dibuka dan kembali ke pemicu saat ditutup; Esc dan ketuk latar menutup.

import { useEffect, useId, useRef } from 'react';
import { Ikon, type NamaIkon } from '../ui/Ikon';
import { t } from '../terjemah';

interface Props {
  teks: string;
  /** Tanpa ini baris "Bagikan tautan" tidak tampil. */
  tautan?: { judul: string; saatPilih: () => void } | undefined;
  /** Tanpa ini bagian "Jangan simpan kasus ini" tidak tampil (sudah tidak disimpan, atau memang tidak disimpan). */
  saatJanganSimpan?: (() => void) | undefined;
  saatKirim: () => void;
  saatSalin: () => void;
  saatUnduh: () => void;
  saatTutup: () => void;
}

export function LembarBagikan({ teks, tautan, saatJanganSimpan, saatKirim, saatSalin, saatUnduh, saatTutup }: Props) {
  const id = useId();
  const tombolTutup = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const pemicu = document.activeElement as HTMLElement | null;
    tombolTutup.current?.focus();
    return () => pemicu?.focus?.();
  }, []);
  const aksi: Array<{ ikon: NamaIkon; judul: string; keterangan: string; saatPilih: () => void }> = [
    { ikon: 'kirim', judul: t('hasil.bagikan_lembar.kirim'), keterangan: t('hasil.bagikan_lembar.kirim_ket'), saatPilih: saatKirim },
    { ikon: 'salin', judul: t('hasil.bagikan_lembar.salin'), keterangan: t('hasil.bagikan_lembar.salin_ket'), saatPilih: saatSalin },
    ...(tautan ? [{ ikon: 'tautan' as const, judul: tautan.judul, keterangan: t('hasil.bagikan_lembar.tautan_ket'), saatPilih: tautan.saatPilih }] : []),
    { ikon: 'unduh', judul: t('hasil.bagikan_lembar.unduh'), keterangan: t('hasil.bagikan_lembar.unduh_ket'), saatPilih: saatUnduh },
  ];
  return (
    <div className="modal-latar" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div className="modal-orang lembar-bagikan" role="dialog" aria-modal="true" aria-labelledby={`${id}-judul`}
        onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); saatTutup(); } }}>
        <div className="kepala-lembar">
          <h2 id={`${id}-judul`}>{t('hasil.bagikan_lembar.judul')}</h2>
          <button type="button" className="tautan" ref={tombolTutup} onClick={saatTutup}>{t('umum.tutup')}</button>
        </div>
        <p className="sub-lembar">{t('hasil.bagikan_lembar.pratinjau')}</p>
        <pre className="pratinjau-teks">{teks}</pre>
        <div className="daftar-aksi-ubin">
          {aksi.map(butir => (
            <button key={butir.judul} type="button" onClick={butir.saatPilih}>
              <span className="ikon-bulat"><Ikon nama={butir.ikon} /></span><span><b>{butir.judul}</b><small>{butir.keterangan}</small></span>
            </button>
          ))}
        </div>
        {saatJanganSimpan && <>
          <hr />
          <button type="button" className="tautan tautan-bahaya" onClick={saatJanganSimpan}>{t('hasil.bagikan_lembar.jangan_simpan')}</button>
          <p className="sub-lembar">{t('hasil.bagikan_lembar.jangan_simpan_ket')}</p>
        </>}
      </div>
    </div>
  );
}
