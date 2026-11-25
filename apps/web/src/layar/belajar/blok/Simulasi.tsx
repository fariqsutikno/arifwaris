// Blok ```simulasi: pelajar mencentang kerabat yang hadir; engine menentukan siapa mendapat dan siapa gugur, dan alasan
// gugurnya diambil dari ringkasan Hasil ("Terhalang oleh ..."). Tidak ada kaidah hajb yang ditulis ulang di sini.
import { useMemo, useState } from 'react';
import type { Blok } from '@waris/content';
import { pecahanTeks } from '../../../hasil/ringkasan';
import { angka, t } from '../../../terjemah';
import { hitungContoh, labelKunci } from './hitungContoh';

type BlokSimulasi = Extract<Blok, { jenis: 'simulasi' }>;

export function Simulasi({ blok }: { blok: BlokSimulasi }) {
  const [hadir, setHadir] = useState<string[]>(blok.awal);
  const hasil = useMemo(() => (hadir.length ? hitungContoh(blok.pewaris, hadir) : undefined), [blok.pewaris, hadir]);
  const ubah = (kunci: string) => setHadir(lama => (lama.includes(kunci) ? lama.filter(isi => isi !== kunci) : blok.pilihan.filter(isi => isi === kunci || lama.includes(isi))));

  return (
    <section className="blok-materi simulasi">
      <p className="judul-blok">{blok.judul ?? t('belajar.simulasi_judul')}</p>
      <fieldset className="pilih-orang">
        <legend>{t('belajar.simulasi_pilih')}</legend>
        {blok.pilihan.map(kunci => (
          <label key={kunci}><input type="checkbox" checked={hadir.includes(kunci)} onChange={() => ubah(kunci)} />{labelKunci(kunci)}</label>
        ))}
      </fieldset>
      <div className="status-orang" aria-live="polite">
        {!hadir.length && <p>{t('belajar.simulasi_kosong')}</p>}
        {hadir.length > 0 && !hasil && <p role="alert">{t('belajar.contoh_ini_tidak_bisa_dihitung_laporkan')}</p>}
        {hasil && hadir.map(kunci => {
          const menerima = hasil.perKunci.find(isi => isi.kunci === kunci);
          const terhalang = hasil.ringkasan.terhalang.find(isi => isi.kunci === kunci);
          const status = menerima
            ? (blok.tampil === 'bagian' ? t('belajar.mendapat_bagian', { bagian: angka(pecahanTeks(menerima.saham, hasil.ringkasan.penyebut, 'sederhana')) }) : t('belajar.mendapat'))
            : terhalang ? `${t('belajar.gugur')}: ${terhalang.alasan}` : t('belajar.tidak_ada_sisa');
          return <div key={kunci} className={menerima ? undefined : 'gugur'}><span>{labelKunci(kunci)}</span><b>{status}</b></div>;
        })}
      </div>
    </section>
  );
}
