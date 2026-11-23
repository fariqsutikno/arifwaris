// Panel baca "Kalau menurut KHI" (hukum positif, bukan fikih): kartu per catatan dari KB, kalimat lewat jelaskanCatatanKhi.
// Menerima catatan yang sudah dipilih Hasil (tanpa tahu engine). Isi tanpa angka hasil dan tanpa kode teknis; sumber tampil sebagai nama.
// HP: lembar penuh; laptop: panel dari kanan. Esc dan ketuk latar menutup; fokus kembali ke pemicu.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Ruleset } from '@waris/engine';
import { NAMA_SUMBER_KHI, type CatatanKhi } from '@waris/content';
import { jelaskanCatatanKhi, type PenjelasanCatatanKhi } from '@waris/explain';
import { kamusNarasi } from '../konten/kamusNarasi';
import { namaMadzhab } from '../layar/DialogMadzhab';
import { Ikon } from '../ui/Ikon';
import { t } from '../terjemah';

interface Props { daftar: readonly CatatanKhi[]; madzhab: Ruleset; saatTutup: () => void }

export function PanelKhi({ daftar, madzhab, saatTutup }: Props) {
  const id = useId();
  const tombolTutup = useRef<HTMLButtonElement>(null);
  const [tampilPraktik, setTampilPraktik] = useState(true);
  useEffect(() => {
    const pemicu = document.activeElement as HTMLElement | null;
    tombolTutup.current?.focus();
    return () => pemicu?.focus?.();
  }, []);
  const penjelasan = useMemo(() => daftar.map(catatan => ({ catatan, hasil: jelaskanCatatanKhi(catatan, { madzhab, kamus: kamusNarasi }) })), [daftar, madzhab]);
  const penutup = penjelasan[0]?.hasil.penutup;
  const penanda = penjelasan[0]?.hasil.penanda;
  return (
    <div className="modal-latar latar-khi" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div className="modal-orang panel-khi" role="dialog" aria-modal="true" aria-labelledby={`${id}-judul`}
        onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); saatTutup(); } }}>
        <div className="kepala-panel-khi">
          <div className="baris-judul-khi">
            <h2 id={`${id}-judul`}>{t('hasil.khi.judul')}</h2>
            <button type="button" className="tautan" ref={tombolTutup} onClick={saatTutup}>{t('umum.tutup')}</button>
          </div>
          {penanda && <span className="penanda-khi"><Ikon nama="info" ukuran={16} />{penanda}</span>}
          <p className="pengantar-khi">{t('hasil.khi.pengantar', { madzhab: namaMadzhab(madzhab) })}</p>
          <label className="pilihan-khi">
            <input type="checkbox" checked={tampilPraktik} onChange={event => setTampilPraktik(event.target.checked)} />
            {t('hasil.khi.tampil_praktik')}
          </label>
        </div>
        <div className="isi-panel-khi">
          {penjelasan.map(({ catatan, hasil }) => <KartuKhi key={catatan.id} catatan={catatan} hasil={hasil} tampilPraktik={tampilPraktik} />)}
          {penutup && <p className="penutup-khi">{penutup}</p>}
        </div>
      </div>
    </div>
  );
}

function KartuKhi({ catatan, hasil, tampilPraktik }: { catatan: CatatanKhi; hasil: PenjelasanCatatanKhi; tampilPraktik: boolean }) {
  const id = useId();
  const [terbuka, setTerbuka] = useState(false);
  const [sumberTerbuka, setSumberTerbuka] = useState(false);
  const cuplik = hasil.bagian.find(bagian => bagian.jenis === 'bunyi')?.butir[0];
  return (
    <article className={terbuka ? 'kartu-khi buka' : 'kartu-khi'}>
      <button type="button" className="kepala-kartu-khi" aria-expanded={terbuka} aria-controls={`${id}-isi`} onClick={() => setTerbuka(!terbuka)}>
        <span className="judul-kartu-khi">
          <b>{hasil.judul}</b>
          <span className="pasal-khi">{hasil.pasalLabel}</span>
          {!terbuka && cuplik && <span className="cuplik-khi">{cuplik}</span>}
          <span className={`tingkat-khi tingkat-${catatan.tingkat}`}>{hasil.tingkatLabel}</span>
        </span>
        <span className="panah-khi" aria-hidden="true"><Ikon nama="bawah" ukuran={18} /></span>
      </button>
      {terbuka && (
        <div id={`${id}-isi`} className="badan-kartu-khi">
          {hasil.bagian.filter(bagian => tampilPraktik || bagian.jenis !== 'praktik').map(bagian => (
            <section key={bagian.jenis} className={`bagian-khi bagian-${bagian.jenis}`}>
              <h3>{bagian.judul}</h3>
              <ul>{bagian.butir.map(butir => <li key={butir}>{butir}</li>)}</ul>
            </section>
          ))}
          <button type="button" className="tautan" aria-expanded={sumberTerbuka} onClick={() => setSumberTerbuka(!sumberTerbuka)}>
            {sumberTerbuka ? t('hasil.khi.sembunyikan_sumber') : t('hasil.khi.lihat_sumber')}
          </button>
          {sumberTerbuka && <DaftarSumber catatan={catatan} />}
        </div>
      )}
    </article>
  );
}

function DaftarSumber({ catatan }: { catatan: CatatanKhi }) {
  const kelompok = [
    { judul: t('hasil.khi.sumber_hukum'), butir: catatan.sumber.filter(sumber => NAMA_SUMBER_KHI[sumber.kode]?.hukumPositif) },
    { judul: t('hasil.khi.sumber_fikih'), butir: catatan.sumber.filter(sumber => NAMA_SUMBER_KHI[sumber.kode] && !NAMA_SUMBER_KHI[sumber.kode]!.hukumPositif) },
  ].filter(grup => grup.butir.length > 0);
  return (
    <div className="sumber-khi">
      {kelompok.map(grup => (
        <section key={grup.judul}>
          <h3>{grup.judul}</h3>
          <ul>{grup.butir.map(sumber => <li key={`${sumber.kode}${sumber.lokasi}`}>{t('hasil.khi.sumber_butir', { nama: NAMA_SUMBER_KHI[sumber.kode]!.nama, lokasi: sumber.lokasi })}</li>)}</ul>
        </section>
      ))}
    </div>
  );
}
