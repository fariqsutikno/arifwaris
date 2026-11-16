// Bagian "Belum dipastikan" di Periksa nyata (spec kanvas 7.1). Menerima Kasus; menjawab keadaan "belum tahu" dan urutan
// wafat yang ditunda di tempat lewat ubah(), menawarkan "Lihat di Keluarga", dan menyalin pertanyaannya ke WhatsApp.
// Tidak dirender bila tidak ada yang belum pasti.

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import { jawabUrutanTertunda } from '../../antreanUrutan';
import { daftarBelumPasti, type HalBelumPastiTampil } from '../../belumPasti';
import type { Kasus } from '../../kasus';
import { jawabLanjutan, pilihKeadaan } from '../../keadaanBaris';
import { namaSingkat } from '../../keadaanOrang';
import { t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';

interface Props { kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void; saatLihatDiKeluarga: (id: IdOrang) => void }

export function BelumPasti({ kasus, ubah, saatLihatDiKeluarga }: Props) {
  const daftar = daftarBelumPasti(kasus);
  const [tersimpan, setTersimpan] = useState('');
  const [statusSalin, setStatusSalin] = useState<'tersalin' | 'gagal' | null>(null);
  if (daftar.length === 0 && !tersimpan) return null;
  const nama = (id: IdOrang) => namaSingkat(kasus, id);
  const simpan = (untuk: IdOrang, f: (k: Kasus) => Kasus) => { ubah(f); setTersimpan(t('hitung.periksa.tersimpan', { nama: nama(untuk) })); };
  const pertanyaan = (hal: HalBelumPastiTampil) => hal.jenis === 'keadaan'
    ? t('hitung.periksa.tanya_keadaan', { almarhum: nama(hal.milik), nama: nama(hal.orang) })
    : t('hitung.periksa.tanya_urutan', { a: nama(hal.a), b: nama(hal.b) });
  const pesan = t('hitung.periksa.pesan_wa', {
    almarhum: nama(kasus.graf.idPewaris), daftar: daftar.map((hal, i) => `${i + 1}. ${pertanyaan(hal)}`).join('\n'),
  });
  const salin = async () => {
    try { await navigator.clipboard.writeText(pesan); setStatusSalin('tersalin'); } catch { setStatusSalin('gagal'); }
  };
  return (
    <section className="kartu tumpuk" aria-labelledby="judul-belum-pasti">
      <h2 id="judul-belum-pasti" className="judul-bagian-kecil">{t('hitung.periksa.belum_judul', { jumlah: daftar.length })}</h2>
      <p className="keterangan">{t('hitung.periksa.belum_keterangan')}</p>
      <p role="status" className="terjawab">{tersimpan}</p>
      {daftar.map(hal => (
        <div key={hal.jenis === 'keadaan' ? hal.orang : `${hal.a}-${hal.b}`} className="belum-baris"
          id={hal.jenis === 'urutan' ? `belum-urutan-${hal.a}-${hal.b}` : `belum-keadaan-${hal.orang}`}>
          <span id={`tanya-${hal.jenis === 'keadaan' ? hal.orang : `${hal.a}-${hal.b}`}`}>{pertanyaan(hal)}</span>
          <div className="deret" role="radiogroup" aria-labelledby={`tanya-${hal.jenis === 'keadaan' ? hal.orang : `${hal.a}-${hal.b}`}`}>
            {hal.jenis === 'keadaan' ? (
              <>
                <Pilih teks={t('hitung.periksa.masih_hidup')} saatPilih={() => simpan(hal.orang, k => pilihKeadaan(k, hal.orang, 'hidup', hal.milik))} />
                <Pilih teks={t('hitung.periksa.wafat_sebelum', { nama: nama(hal.milik) })}
                  saatPilih={() => simpan(hal.orang, k => jawabLanjutan(pilihKeadaan(k, hal.orang, 'wafat', hal.milik), hal.orang, hal.milik, { jenis: 'wafat', waktu: 'sebelum' }))} />
                <Pilih teks={t('hitung.periksa.wafat_sesudah', { nama: nama(hal.milik) })}
                  saatPilih={() => simpan(hal.orang, k => jawabLanjutan(pilihKeadaan(k, hal.orang, 'wafat', hal.milik), hal.orang, hal.milik, { jenis: 'wafat', waktu: 'sesudah' }))} />
                <button type="button" className="tautan kecil" onClick={() => saatLihatDiKeluarga(hal.orang)}>{t('hitung.periksa.lihat_di_keluarga')}</button>
              </>
            ) : (
              <>
                <Pilih teks={t('hitung.periksa.sebelum_nama', { nama: nama(hal.b) })} saatPilih={() => simpan(hal.a, k => jawabUrutanTertunda(k, hal.a, hal.b, 'sebelum'))} />
                <Pilih teks={t('hitung.periksa.sesudah_nama', { nama: nama(hal.b) })} saatPilih={() => simpan(hal.a, k => jawabUrutanTertunda(k, hal.a, hal.b, 'sesudah'))} />
              </>
            )}
          </div>
        </div>
      ))}
      {daftar.length > 0 && (
        <button type="button" className="aksi-teks" onClick={salin}><Ikon nama="salin" ukuran={16} />{t('hitung.periksa.salin_wa')}</button>
      )}
      {statusSalin && daftar.length > 0 && (
        <>
          <p role="status" className="terjawab">{statusSalin === 'tersalin' ? t('hitung.periksa.tersalin') : t('hitung.periksa.gagal_salin')}</p>
          <div className="wa">{pesan}</div>
        </>
      )}
    </section>
  );
}

function Pilih({ teks, saatPilih }: { teks: string; saatPilih: () => void }) {
  return <button type="button" role="radio" aria-checked={false} className="pilih-belum" onClick={saatPilih}>{teks}</button>;
}
