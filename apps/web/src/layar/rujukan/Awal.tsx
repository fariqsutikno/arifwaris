// Awal Rujukan: banner dengan kolom cari, lalu ubin per jenis dalil. Tidak menerima props; memutuskan hasil cari
// dari kata yang diketik; menyerahkan pembaca ke #/rujukan/<kategori> atau #/rujukan/<kode>.

import { useState, type CSSProperties } from 'react';
import { angka, panah, t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';
import { tautanBelajar, tautanRujukan } from '../../rute';
import { cariRujukanTeks } from './cari';
import { Kerangka } from './Kerangka';
import { DAFTAR_KATEGORI, jumlahDi } from './Kategori';

const JUMLAH_HASIL = 12;
const HURUF_MINIMAL = 2;

export function Awal() {
  const [kata, setKata] = useState('');
  const hasil = cariRujukanTeks(kata);
  return (
    <Kerangka judul={t('umum.rujukan')} lead={t('rujukan.al_qur_an_sunnah_atsar_ijma')} kembali={tautanBelajar()} tambahan={(
      <div className="panel-cari-rujukan">
        <input type="search" className="kolom-cari-rujukan" aria-label={t('rujukan.cari_label')} placeholder={t('rujukan.cari_label')}
          value={kata} onChange={event => setKata(event.target.value)} />
        {kata.trim().length >= HURUF_MINIMAL && (
          <div role="status" className="hasil-cari-rujukan">
            {hasil.length === 0 ? <p>{t('rujukan.tidak_ada_hasil')}</p> : (
              <>
                <p>{t('rujukan.hasil_cari', { jumlah: angka(String(hasil.length)) })}</p>
                <ul className="daftar-polos">
                  {hasil.slice(0, JUMLAH_HASIL).map(isi => (
                    <li key={`${isi.tautan}-${isi.judul}`}><a href={isi.tautan}><b>{isi.judul}</b><span>{isi.keterangan}</span></a></li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    )}>
      <h2 className="judul-bagian-rujukan">{t('rujukan.jelajah_kategori')}</h2>
      <ul className="daftar-polos deret-ubin-rujukan">
        {DAFTAR_KATEGORI.map((kategori, urutan) => (
          <li key={kategori.id}>
            <a className="ubin ubin-rujukan" style={{ '--i': urutan } as CSSProperties} href={tautanRujukan(kategori.id)}>
              <Ikon nama="rujukan" ukuran={120} />
              <span className="angka-ubin">{angka(String(jumlahDi(kategori)))} <small>{t('rujukan.dalil')}</small></span>
              <b className="judul-ubin">{kategori.judul}</b>
              <span className="keterangan">{kategori.lead}</span>
              <span className="panah-bulat" aria-hidden="true">{panah()}</span>
            </a>
          </li>
        ))}
      </ul>
    </Kerangka>
  );
}
