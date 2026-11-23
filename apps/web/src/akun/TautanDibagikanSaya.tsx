// Daftar tautan yang sedang dibagikan pemilik, dibaca dari server: jalan keluar bila kasusnya sudah hilang dari perangkat
// (perangkat lain, penyimpanan dibersihkan). Tanpa tautan aktif atau gagal memuat, bagian ini tidak tampil sama sekali.

import { useEffect, useState } from 'react';
import type { RepositoriBagikan, TautanDibagikanSaya } from '@waris/data';
import { tandaiDibagikan } from '../bagikanLokal';
import { tautanBagikan } from '../rute';
import { t } from '../terjemah';

export function DaftarTautanDibagikan({ repo }: { repo: RepositoriBagikan }) {
  const [daftar, setDaftar] = useState<TautanDibagikanSaya[]>([]);
  const [gagal, setGagal] = useState(false);
  useEffect(() => {
    let batal = false;
    repo.daftarMilikSaya().then(isi => { if (!batal) setDaftar(isi); }).catch(() => undefined);
    return () => { batal = true; };
  }, [repo]);

  const hentikan = async (tautan: TautanDibagikanSaya) => {
    setGagal(false);
    try {
      await repo.berhenti(tautan.idRiwayat);
      tandaiDibagikan(tautan.idRiwayat, false);
      setDaftar(lama => lama.filter(isi => isi.idRiwayat !== tautan.idRiwayat));
    } catch { setGagal(true); }
  };

  if (daftar.length === 0 && !gagal) return null;
  return (
    <section className="tumpuk-rapat" aria-labelledby="judul-tautan-saya">
      <h3 id="judul-tautan-saya" className="keterangan">{t('akun.tautan_dibagikan')}</h3>
      <ul className="tumpuk-rapat">
        {daftar.map(tautan => (
          <li key={tautan.idRiwayat} className="keterangan">
            <code>{tautan.slug}</code> ({tautan.akses === 'email' ? t('bagikan.akses_email') : t('bagikan.akses_tautan')}){' '}
            <a className="tautan-teks" href={tautanBagikan(tautan.slug)} target="_blank" rel="noopener">{t('akun.tautan_buka')}</a>{' '}
            <button type="button" className="tautan-teks tautan-bahaya" onClick={() => void hentikan(tautan)}>{t('akun.tautan_hentikan')}</button>
          </li>
        ))}
      </ul>
      {gagal && <p role="alert" className="peringatan-isian">{t('akun.tautan_gagal_dihentikan')}</p>}
    </section>
  );
}
