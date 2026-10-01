// Mulai kasus baru: semua cara memulai di satu tempat. "Mulai dari nol" (selalu tampil; hero tidak lagi menawarkannya),
// susunan keluarga umum sebagai ubin berwarna dengan avatar ahli warisnya (satu ketukan membuka
// wizard dengan ahli waris terisi), dan tautan impor berkas.

import type { CSSProperties } from 'react';
import { AvatarOrang } from '../../hasil/AvatarOrang';
import { jenisDari } from '../../checklist';
import { kasusDariSusunan, SUSUNAN_CEPAT } from '../../lab';
import type { Kasus } from '../../kasus';
import { Ikon } from '../../ui/Ikon';
import { angka, panah, t } from '../../terjemah';

interface Props { saatPilih: (kasus: Kasus) => void; saatDariNol: () => void; adaKasusBerjalan: boolean; saatImpor: () => void }

export function MulaiCepat({ saatPilih, saatDariNol, adaKasusBerjalan, saatImpor }: Props) {
  return (
    <section className="bagian-lab" aria-labelledby="judul-lab-cepat">
      <h2 id="judul-lab-cepat" className="judul-bagian">{t('hitung.lab_mulai_cepat')}</h2>
      <p className="keterangan">{t('hitung.lab_mulai_baru_ket')}</p>
      <ul className="daftar-polos lab-ubin-cepat">
        {(
          <li>
            <button type="button" className="ubin ubin-lab ubin-nol" onClick={saatDariNol}>
              <span className="panah-bulat" aria-hidden="true">{panah()}</span>
              <Ikon nama="tambah" ukuran={40} />
              <b className="judul-ubin">{t('hitung.lab_dari_nol')}</b>
              {adaKasusBerjalan && <span className="keterangan">{t('hitung.lab_kasus_tetap')}</span>}
            </button>
          </li>
        )}
        {SUSUNAN_CEPAT.map((susunan, urutan) => (
          <li key={susunan.kunci}>
            <button type="button" className="ubin ubin-lab" style={{ '--i': urutan } as CSSProperties} onClick={() => saatPilih(kasusDariSusunan(susunan))}>
              <span className="panah-bulat" aria-hidden="true">{panah()}</span>
              <span className="lab-avatar-deret" aria-hidden="true">
                {susunan.ahliWaris.map((kunci, i) => <AvatarOrang key={`${kunci}${i}`} nama={jenisDari(kunci)?.label ?? kunci} ukuran={40} />)}
              </span>
              <b className="judul-ubin">{susunan.label()}</b>
              <span className="keterangan">{t('hitung.lab_jumlah_ahli_waris', { jumlah: angka(String(susunan.ahliWaris.length)) })}</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="tautan-cari lab-impor" onClick={saatImpor}><Ikon nama="berkas" ukuran={20} />{t('hitung.lab_impor')}</button>
    </section>
  );
}
