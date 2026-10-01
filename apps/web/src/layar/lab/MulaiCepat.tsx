// Mulai cepat: susunan keluarga umum sebagai ubin berwarna (pola ubin modul Belajar). Tiap ubin menampilkan ahli
// warisnya sebagai deretan avatar yang sama dengan di pohon, jadi pengguna langsung melihat isi susunannya.
// Satu ketukan membuka wizard dengan ahli waris terisi (harta masih kosong).

import type { CSSProperties } from 'react';
import { AvatarOrang } from '../../hasil/AvatarOrang';
import { kasusDariSusunan, SUSUNAN_CEPAT } from '../../lab';
import type { Kasus } from '../../kasus';
import { jenisDari } from '../../checklist';
import { angka, panah, t } from '../../terjemah';

export function MulaiCepat({ saatPilih }: { saatPilih: (kasus: Kasus) => void }) {
  return (
    <section className="bagian-lab" aria-labelledby="judul-lab-cepat">
      <h2 id="judul-lab-cepat" className="judul-bagian">{t('hitung.lab_mulai_cepat')}</h2>
      <p className="keterangan">{t('hitung.lab_mulai_cepat_ket')}</p>
      <ul className="daftar-polos lab-ubin-cepat">
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
    </section>
  );
}
