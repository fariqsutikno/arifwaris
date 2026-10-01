// Keadaan orang tiap babak (spec 1.1): daftar orang babak ini beserta keadaannya; ketuk orang → DialogKeadaan.
// Dua pemakaian: pertanyaan utuh "Semua orang di atas masih hidup?" bawaan Ya (komponen ini sendiri), atau `tanpaTanya` = hanya
// daftarnya, dipakai kartu "wafat atau hilang" di layar keadaan khusus (KeadaanKeluarga) yang memegang pertanyaannya.
// Mengembalikan semua ke hidup meminta konfirmasi bila ada keluarga babak lain yang ikut terhapus (`kosongkanKeadaan` + `orangTerputus`).

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { babakAsal, keadaanOrang, kerabatDari, namaSingkat, orangTerputus, terapkanKeadaan } from '../../keadaanOrang';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { DialogKeadaan } from './DialogKeadaan';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; idMayit: IdOrang; ubah: (f: (k: Kasus) => Kasus) => void; tanpaTanya?: boolean }

/** Orang yang keadaannya ditanyakan di babak ini (janin ditangani pertanyaan hamil). */
export const orangBabakDari = (kasus: Kasus, idMayit: IdOrang): IdOrang[] => kerabatDari(kasus, idMayit)
  .filter(id => babakAsal(kasus, id) === idMayit && kasus.graf.orang[id]!.statusHidup !== 'dalamKandungan');

export const adaKeadaanTerisi = (kasus: Kasus, idMayit: IdOrang): boolean => orangBabakDari(kasus, idMayit).some(id => keadaanOrang(kasus, id) !== 'hidup');

/** Semua orang babak ini kembali hidup; `terputus` = orang di babak lain yang ikut hilang karenanya (untuk konfirmasi). */
export function kosongkanKeadaan(kasus: Kasus, idMayit: IdOrang): { kasusBaru: Kasus; terputus: IdOrang[] } {
  const kasusBaru = orangBabakDari(kasus, idMayit).reduce((kini, id) => (keadaanOrang(kini, id) === 'hidup' ? kini : terapkanKeadaan(kini, id, { jenis: 'hidup' })), kasus);
  return { kasusBaru, terputus: orangTerputus(kasus, kasusBaru) };
}

export function PertanyaanPenutup({ kasus, idMayit, ubah, tanpaTanya = false }: Props) {
  const orangBabak = orangBabakDari(kasus, idMayit);
  const adaTerisi = adaKeadaanTerisi(kasus, idMayit);
  const [ada, setAda] = useState(tanpaTanya || adaTerisi);
  const [dialog, setDialog] = useState<IdOrang | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<{ kasusBaru: Kasus; nama: string[] } | null>(null);
  const mayit = namaSingkat(kasus, idMayit);

  const pilihSemuaHidup = () => {
    const { kasusBaru, terputus } = kosongkanKeadaan(kasus, idMayit);
    if (terputus.length === 0) { setAda(false); ubah(() => kasusBaru); return; }
    setKonfirmasi({ kasusBaru, nama: terputus.map(id => namaSingkat(kasus, id)) });
  };
  // Tiap keadaan memanggil t dengan kunci literal supaya tes diksi menangkapnya.
  const status = (id: IdOrang): string => {
    switch (keadaanOrang(kasus, id)) {
      case 'hidup': return t('hitung.penutup.status_hidup');
      case 'wafatSebelum': return t('hitung.penutup.status_wafat_sebelum', { mayit });
      case 'wafatSesudah': return t('hitung.penutup.status_wafat_sesudah', { mayit });
      case 'wafatSesudahDibagi': return t('hitung.penutup.status_wafat_sesudah_dibagi');
      case 'bersamaan': return t('hitung.penutup.status_bersamaan');
      case 'hilang': return t('hitung.penutup.status_hilang');
      case 'dalamKandungan': return t('hitung.penutup.status_dalam_kandungan');
      case 'khuntsa': return t('hitung.penutup.status_khuntsa');
    }
  };

  return (
    <section className="penutup-babak" {...(tanpaTanya ? {} : { 'aria-labelledby': `penutup-${idMayit}` })}>
      {!tanpaTanya && <>
        <h3 id={`penutup-${idMayit}`} className="judul-bagian-kecil">{t('hitung.penutup.tanya')}</h3>
        <div className="kartu-pilihan-deret ringkas" role="radiogroup" aria-labelledby={`penutup-${idMayit}`}>
          <button type="button" role="radio" aria-checked={!ada} className="kartu-pilihan kecil" onClick={pilihSemuaHidup}>
            <span>{t('hitung.penutup.ya_semua_hidup')}</span>
          </button>
          <button type="button" role="radio" aria-checked={ada} className="kartu-pilihan kecil" onClick={() => setAda(true)}>
            <span>{t('hitung.penutup.ada_yang_wafat')}</span>
          </button>
        </div>
      </>}
      {ada && (
        <>
          <p className="keterangan">{t('hitung.penutup.ketuk_orangnya')}</p>
          <ul className="daftar-keadaan">
            {orangBabak.map(id => (
              <li key={id}>
                <button type="button" className="baris-keadaan" onClick={() => setDialog(id)}>
                  <b>{namaSingkat(kasus, id)}</b><span className={`lencana-keadaan ${keadaanOrang(kasus, id)}`}>{status(id)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {dialog && <DialogKeadaan kasus={kasus} idOrang={dialog} saatBatal={() => setDialog(null)}
        saatSelesai={kasusBaru => { setDialog(null); ubah(() => kasusBaru); }} />}
      {konfirmasi && (
        <DialogKonfirmasi judul={t('hitung.penutup.hapus_judul')} labelLanjut={t('hitung.penutup.ya_hapus')}
          saatBatal={() => setKonfirmasi(null)} saatLanjut={() => { setAda(false); ubah(() => konfirmasi.kasusBaru); setKonfirmasi(null); }}>
          <p>{t('hitung.penutup.hapus_isi', { daftar: konfirmasi.nama.join(', ') })}</p>
        </DialogKonfirmasi>
      )}
    </section>
  );
}
