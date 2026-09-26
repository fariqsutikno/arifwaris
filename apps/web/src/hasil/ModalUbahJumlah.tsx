// Ubah jumlah satu jenis ahli waris dari layar hasil (tombol "Ubah jumlah" di modal orang).
// Isinya satu baris "− n +" yang sama dengan langkah Ahli waris; perubahan langsung dihitung ulang.

import { useState } from 'react';
import type { GrafKeluarga, KunciAhliWaris } from '@waris/engine';
import { hitungIsian, kurangiAhliWaris, tambahAhliWaris, ubahNama } from '../checklist';
import { LABEL_SEHARI } from '../konten/ahliWaris';
import { BarisJumlah } from '../layar/LangkahAhliWaris';
import { t } from '../terjemah';

interface Props { kunci: KunciAhliWaris; graf: GrafKeluarga; ubahGraf: (ubah: (graf: GrafKeluarga) => GrafKeluarga) => void; saatTutup: () => void }

export function ModalUbahJumlah({ kunci, graf, ubahGraf, saatTutup }: Props) {
  const [pesan, setPesan] = useState<string | null>(null);
  const idMayit = graf.idPewaris;
  const coba = (ubah: (graf: GrafKeluarga) => GrafKeluarga) => {
    try {
      ubahGraf(ubah);
      setPesan(null);
    } catch (galat) {
      setPesan(galat instanceof Error ? galat.message : String(galat));
    }
  };
  return (
    <div className="modal-latar" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div className="modal-orang modal-kecil" role="dialog" aria-modal="true" aria-label={t('hitung.ubah_jumlah_label', { label: LABEL_SEHARI[kunci] ?? '' })}
        onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
        <header className="kepala-modal netral"><div><h2>{t('hitung.ubah_jumlah')}</h2></div></header>
        <div className="isi-modal">
          {pesan && <p className="isian-salah" role="alert">{pesan}</p>}
          <ul className="daftar-jumlah">
            <BarisJumlah kunci={kunci} graf={graf} idMayit={idMayit} daftarOrang={hitungIsian(graf, idMayit)[kunci] ?? []}
              saatTambah={idInduk => coba(g => tambahAhliWaris(g, idMayit, kunci, idInduk ? { idInduk } : {}))}
              saatKurang={() => coba(g => kurangiAhliWaris(g, idMayit, kunci))}
              saatUbahNama={(idOrang, nama) => coba(g => ubahNama(g, idOrang, nama))} />
          </ul>
          <p className="caption-isian">{t('hitung.hasil_langsung_dihitung_ulang_untuk_kerabat')}</p>
        </div>
        <footer className="kaki-modal">
          <span className="pengisi" />
          <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" onClick={saatTutup}>{t('umum.selesai_2')}</button>
        </footer>
      </div>
    </div>
  );
}
