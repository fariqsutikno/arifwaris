// Panel "Ada yang keliru?" (spec kanvas 7.2): dua langkah, pilih apa yang diubah lalu orang atau bagian yang dimaksud.
// Keadaan dijawab di tempat; tahun/urutan membuka babak orangnya; anggota keluarga mengantar ke bagian di Keluarga; peristiwa
// membuka formnya. Tombol tidak pernah nonaktif.

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../../kasus';
import type { Aksi } from '../../keadaan';
import { daftarAlmarhum, namaSingkat } from '../../keadaanOrang';
import { bagianDariOrang, daftarBagian } from '../../kelompok';
import { judulBagian } from '../../ringkasanBagian';
import { t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';
import { JawabKeadaan } from './JawabKeadaan';

interface Props {
  kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void; kirim: (aksi: Aksi) => void;
  saatBukaBabak: (id: IdOrang) => void; saatBukaPeristiwa: () => void;
}
type Apa = 'keadaan' | 'waktu' | 'orang';

export function UbahDipandu({ kasus, ubah, kirim, saatBukaBabak, saatBukaPeristiwa }: Props) {
  const [terbuka, setTerbuka] = useState(false);
  const [apa, setApa] = useState<Apa | null>(null);
  const [siapa, setSiapa] = useState<IdOrang | null>(null);
  const nama = (id: IdOrang) => namaSingkat(kasus, id);
  const tutup = () => { setTerbuka(false); setApa(null); setSiapa(null); };
  const pilihLain = () => { setApa(null); setSiapa(null); };
  if (!terbuka) {
    return (
      <section className="kartu deret antar">
        <span><b>{t('hitung.periksa.keliru_judul')}</b> <span className="redup">{t('hitung.periksa.keliru_keterangan')}</span></span>
        <button type="button" className="aksi-teks" onClick={() => setTerbuka(true)}><Ikon nama="pensil" ukuran={15} />{t('hitung.periksa.ubah_sesuatu')}</button>
      </section>
    );
  }
  const { idPewaris } = kasus.graf;
  const orangLain = Object.values(kasus.graf.orang).filter(orang => !orang.penghubung && orang.id !== idPewaris).map(orang => orang.id);
  const opsi = (judul: string, ket: string | undefined, saatKlik: () => void) => (
    <button key={judul} type="button" className="opsi-urutan" onClick={saatKlik}>{judul}{ket && <small>{ket}</small>}</button>
  );
  const langkah = !apa ? t('hitung.periksa.langkah_apa')
    : apa === 'keadaan' && siapa ? t('hitung.periksa.keadaan_sekarang', { nama: nama(siapa) })
    : apa === 'keadaan' ? t('hitung.periksa.langkah_siapa_keadaan')
    : apa === 'waktu' ? t('hitung.periksa.langkah_siapa_waktu') : t('hitung.periksa.langkah_bagian');
  return (
    <section className="kartu ubah-panel">
      <div className="deret antar">
        <span className="langkah-ubah">{langkah}</span>
        <button type="button" className="aksi-teks" onClick={tutup}><Ikon nama="salah" ukuran={15} />{t('hitung.periksa.tutup')}</button>
      </div>
      {!apa && <div className="pilihan-urutan">
        {opsi(t('hitung.periksa.apa_keadaan'), t('hitung.periksa.apa_keadaan_ket'), () => setApa('keadaan'))}
        {opsi(t('hitung.periksa.apa_waktu'), undefined, () => setApa('waktu'))}
        {opsi(t('hitung.periksa.apa_orang'), t('hitung.periksa.apa_orang_ket'), () => setApa('orang'))}
        {opsi(t('hitung.periksa.apa_peristiwa'), t('hitung.periksa.apa_peristiwa_ket'), saatBukaPeristiwa)}
      </div>}
      {apa === 'keadaan' && !siapa && <div className="pilihan-urutan">{orangLain.map(id => opsi(nama(id), undefined, () => setSiapa(id)))}</div>}
      {apa === 'keadaan' && siapa && <JawabKeadaan kasus={kasus} id={siapa} milik={bagianDariOrang(kasus, siapa)?.milik ?? idPewaris} ubah={ubah} />}
      {apa === 'waktu' && <div className="pilihan-urutan">
        {daftarAlmarhum(kasus).map(id => opsi(nama(id), kasus.waktu?.[id]?.wafat?.tahun?.toString() ?? t('hitung.periksa.tahun_belum_diisi'), () => { saatBukaBabak(id); tutup(); }))}
      </div>}
      {apa === 'orang' && <div className="pilihan-urutan">
        {daftarBagian(kasus).filter(b => b.jenis !== 'urutan' && b.jenis !== 'kamu' && b.jenis !== 'anakBersama').map(b =>
          opsi(judulBagian(kasus, b), undefined, () => kirim({ jenis: 'KE_LANGKAH', langkah: 3, fokusBagian: b.id, dariPeriksa: true })))}
      </div>}
      {apa && <button type="button" className="aksi-teks mulai" onClick={pilihLain}><Ikon nama="kembali" ukuran={15} />{t('hitung.periksa.pilih_lain')}</button>}
    </section>
  );
}
