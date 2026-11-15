// Details "Kenapa {kelompok} tidak ditanyakan?" (spec kanvas 5.7): satu kalimat alasan + tautan teks "Tetap isi kerabat lain".
// Sesudah itu muncul tautan "Tambah dengan nama hubungan" untuk kerabat bukan ahli waris (mertua, besan, anak tiri; spec 5.11).
// Menerima satu BagianDilewati; kalimat alasannya dari diksi hitung.kanvas.kenapa_tidak_ditanya.

import { useState } from 'react';
import type { GrafKeluarga } from '@waris/engine';
import { HUBUNGAN, type KunciHubungan } from '../../hubunganPohon';
import type { Kasus } from '../../kasus';
import { namaSingkat } from '../../keadaanOrang';
import type { Bagian, BagianDilewati } from '../../kelompok';
import { judulBagian } from '../../ringkasanBagian';
import { t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';
import { DialogTambahHubungan } from '../wizard/DialogTambahHubungan';

interface Props {
  dilewati: BagianDilewati; kasus: Kasus;
  /** Bagian sudah ditambahkan pengguna: tautan berganti menjadi "Tambah dengan nama hubungan". */
  sudahTetapIsi: boolean;
  saatTetapIsi: () => void;
  ubahGraf: (f: (graf: GrafKeluarga) => GrafKeluarga) => void;
}

export function KenapaTidakDitanya({ dilewati, kasus, sudahTetapIsi, saatTetapIsi, ubahGraf }: Props) {
  const [daftarHubungan, setDaftarHubungan] = useState(false);
  const [hubungan, setHubungan] = useState<KunciHubungan | null>(null);
  const dariWafat = dilewati.jenis === 'anakDariWafat';
  const acuan: Bagian = dariWafat ? { id: '', milik: dilewati.sebab!, jenis: 'anak' } : { id: '', milik: dilewati.milik, jenis: dilewati.jenis as 'saudara' };
  const kelompok = hurufKecil(judulBagian(kasus, acuan));
  const judul = dariWafat ? t('hitung.kanvas.kenapa_judul_anak', { nama: namaSingkat(kasus, dilewati.sebab!) }) : t('hitung.kanvas.kenapa_judul', { kelompok });
  return (
    <details className="rinci">
      <summary><Ikon nama="kembali" ukuran={14} />{judul}</summary>
      <div>
        <span>{t('hitung.kanvas.kenapa_tidak_ditanya', { kelompok })}</span>
        {sudahTetapIsi ? (
          <>
            <button type="button" className="aksi-teks" aria-expanded={daftarHubungan} onClick={() => setDaftarHubungan(buka => !buka)}>
              <Ikon nama="tambah" ukuran={15} />{t('hitung.kanvas.tambah_hubungan')}
            </button>
            {daftarHubungan && (
              <ul className="daftar-hubungan" aria-label={t('hitung.pohon.pilih_hubungan')}>
                {(Object.keys(HUBUNGAN) as KunciHubungan[]).map(kunci => (
                  <li key={kunci}><button type="button" className="tautan-teks" onClick={() => { setHubungan(kunci); setDaftarHubungan(false); }}>{HUBUNGAN[kunci].label}</button></li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <button type="button" className="aksi-teks" onClick={saatTetapIsi}><Ikon nama="tambah" ukuran={15} />{t('hitung.kanvas.tetap_isi')}</button>
        )}
      </div>
      {hubungan && (
        <DialogTambahHubungan kasus={kasus} idPusat={dilewati.milik} hubungan={hubungan} saatBatal={() => setHubungan(null)}
          saatSelesai={graf => { ubahGraf(() => graf); setHubungan(null); }} />
      )}
    </details>
  );
}

/** "Kakak atau adik Almarhum" → "kakak atau adik Almarhum": hanya huruf pertama, supaya nama orang tetap berhuruf besar. */
const hurufKecil = (teks: string): string => teks.charAt(0).toLowerCase() + teks.slice(1);
