// Langkah 1: jenis kelamin almarhum sebagai pertanyaan utama (dua kartu berikon, tanpa pilihan bawaan);
// nama hanya isian kecil opsional. Mengganti jenis kelamin setelah ada pasangan/anak meminta konfirmasi,
// karena isian ahli waris dan kondisi khusus harus dikosongkan (hubungan keluarganya ikut berubah).

import { useEffect, useRef, useState } from 'react';
import { bolehUbahJenisKelamin } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { t } from '../../terjemah';

interface Props {
  kasus: Kasus | null;
  saatPilih: (jenisKelamin: 'L' | 'P') => void;
  saatGantiDanKosongkan: (jenisKelamin: 'L' | 'P') => void;
  saatUbahNama: (nama: string) => void;
}

export function LangkahPewaris({ kasus, saatPilih, saatGantiDanKosongkan, saatUbahNama }: Props) {
  const pewaris = kasus?.graf.orang[kasus.graf.idPewaris];
  const pilihan: Array<['L' | 'P', string]> = [['L', t('Laki-laki')], ['P', t('Perempuan')]];
  const perluKonfirmasi = !!kasus && !bolehUbahJenisKelamin(kasus.graf, kasus.graf.idPewaris);
  const [tertunda, setTertunda] = useState<'L' | 'P' | null>(null);
  const saatKlik = (jenisKelamin: 'L' | 'P') => {
    if (pewaris?.jenisKelamin === jenisKelamin) return;
    if (perluKonfirmasi) setTertunda(jenisKelamin);
    else saatPilih(jenisKelamin);
  };
  return (
    <>
      <div className="kartu-pilihan-deret" role="radiogroup" aria-labelledby="pertanyaan-utama">
        {pilihan.map(([jenisKelamin, label]) => (
          <button key={jenisKelamin} type="button" role="radio" aria-checked={pewaris?.jenisKelamin === jenisKelamin}
            className={`kartu-pilihan pilih-gender-${jenisKelamin}`} onClick={() => saatKlik(jenisKelamin)}>
            <IkonGender jenisKelamin={jenisKelamin} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {perluKonfirmasi && <p className="caption-isian">{t('Mengganti jenis kelamin akan mengosongkan isian ahli waris dan kondisi khusus.')}</p>}
      {kasus && (
        <label className="isian isian-kecil">{t('Nama almarhum')} <span className="opsional">{t('(boleh dikosongkan)')}</span>
          <input value={pewaris?.nama ?? ''} onChange={event => saatUbahNama(event.target.value)} />
        </label>
      )}
      {tertunda && (
        <KonfirmasiGanti saatBatal={() => setTertunda(null)} saatLanjut={() => { saatGantiDanKosongkan(tertunda); setTertunda(null); }} />
      )}
    </>
  );
}

function KonfirmasiGanti({ saatBatal, saatLanjut }: { saatBatal: () => void; saatLanjut: () => void }) {
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => { wadah.current?.querySelector<HTMLButtonElement>('[data-batal]')?.focus(); }, []);
  return (
    <div className="konfirmasi" role="alertdialog" aria-modal="true" aria-labelledby="judul-ganti" ref={wadah}
      onKeyDown={event => { if (event.key === 'Escape') saatBatal(); }}>
      <div className="konfirmasi-isi">
        <h2 id="judul-ganti">{t('Ganti jenis kelamin almarhum?')}</h2>
        <p>{t('Pasangan dan hubungan keluarga ikut berubah, jadi isian ahli waris dan kondisi khusus akan dikosongkan. Harta dan kewajiban tetap.')}</p>
        <div className="chip-deret">
          <button type="button" className="aw-btn aw-btn-primary" onClick={saatLanjut}>{t('Ganti dan kosongkan')}</button>
          <button type="button" className="aw-btn aw-btn-ghost" data-batal onClick={saatBatal}>{t('Batal')}</button>
        </div>
      </div>
    </div>
  );
}

function IkonGender({ jenisKelamin }: { jenisKelamin: 'L' | 'P' }) {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
      {jenisKelamin === 'L'
        ? <><circle cx="20" cy="28" r="12" /><path d="M29 19l11-11M30 8h10v10" /></>
        : <><circle cx="24" cy="18" r="12" /><path d="M24 30v14M17 38h14" /></>}
    </svg>
  );
}
