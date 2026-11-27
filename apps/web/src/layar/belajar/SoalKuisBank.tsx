// Panel "Soal kuis acak" di tab Kuis konsep: pilih tingkat dan modul, lalu mulai. Soal pilihan ganda dibuat mesin dari kasus
// faraidh dan diambil dari bank (daring); hanya yang aturan pengecohnya sudah disetujui tim keilmuan. Soal tampil di kartu kuis
// yang sama dengan kuis konsep (pembahasan dan alasan tiap pilihan muncul setelah menjawab). Tanpa XP dan tanpa rekor paket.

import { useState } from 'react';
import type { Tingkat } from '@waris/content';
import type { SoalKuisMesin } from '@waris/latihan';
import { akunLokal } from '../../akun/antrean';
import { cariSoalKuisBank } from '../../bank/cariSoalKuisBank';
import { muatBankSoal } from '../../bank/klienBank';
import { daftarModul } from '../../konten/sumber';
import { t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';
import { TEKS_TINGKAT } from '../AwalHitung';
import { KartuSoalKuis } from './KartuSoalKuis';

const SEMUA_TINGKAT: Tingkat[] = ['dasar', 'menengah', 'sulit'];
/** Modul yang punya soal kuis mesin (kasus faraidh biasa: modul 3-7). */
const MODUL_KUIS = [3, 4, 5, 6, 7];

type Status = 'diam' | 'mencari' | 'tidakTerhubung' | 'tidakAda';

interface Props {
  /** Disuntik uji; bawaan = klien bank (Supabase, atau sampel memori di pengembangan lokal). */
  muatBank?: typeof muatBankSoal;
  buatBenih?: () => string;
}

const hurufAwalKapital = (teks: string) => teks.charAt(0).toLocaleUpperCase() + teks.slice(1);
const benihBawaan = () => `${akunLokal() ?? 'tamu'}:${Date.now()}`;

export function SoalKuisBank({ muatBank = muatBankSoal, buatBenih = benihBawaan }: Props) {
  const [tingkat, setTingkat] = useState<Tingkat | ''>('');
  const [modul, setModul] = useState('');
  const [status, setStatus] = useState<Status>('diam');
  const [soal, setSoal] = useState<SoalKuisMesin>();
  const [sudahMenjawab, setSudahMenjawab] = useState(false);
  const judulModul = new Map(daftarModul().map(isi => [isi.nomor, isi.judul]));

  const mulai = async () => {
    setStatus('mencari');
    try {
      const bank = await muatBank();
      if (!bank) return setStatus('tidakTerhubung');
      const baru = await cariSoalKuisBank(bank, { tingkat: tingkat || undefined, modul: modul ? Number(modul) : undefined }, buatBenih());
      if (!baru) return setStatus('tidakAda');
      setStatus('diam');
      setSudahMenjawab(false);
      setSoal(baru);
    } catch {
      setStatus('tidakTerhubung');
    }
  };

  return (
    <section className="soal-bank" aria-labelledby="judul-kuis-bank">
      <h2 id="judul-kuis-bank"><Ikon nama="acak" ukuran={20} />{t('latihan.kuis_bank_judul')}</h2>
      <p className="keterangan">{t('latihan.kuis_bank_pengantar')}</p>
      <div className="pilihan-bank">
        <label>{t('latihan.tingkat')}
          <select value={tingkat} onChange={kejadian => setTingkat(kejadian.target.value as Tingkat | '')}>
            <option value="">{t('latihan.semua_tingkat')}</option>
            {SEMUA_TINGKAT.map(isi => <option key={isi} value={isi}>{hurufAwalKapital(TEKS_TINGKAT()[isi])}</option>)}
          </select>
        </label>
        <label>{t('latihan.bank_modul')}
          <select value={modul} onChange={kejadian => setModul(kejadian.target.value)}>
            <option value="">{t('latihan.bank_semua_modul')}</option>
            {MODUL_KUIS.map(nomor => <option key={nomor} value={nomor}>{judulModul.get(nomor) ?? nomor}</option>)}
          </select>
        </label>
      </div>
      {soal ? (
        <>
          <KartuSoalKuis key={soal.kode} soal={soal} label={t('latihan.kuis_bank_judul')} sembunyikanLabel saatDijawab={() => setSudahMenjawab(true)} />
          {sudahMenjawab && <button type="button" className="tautan-aksi" onClick={() => void mulai()}>{t('latihan.kuis_bank_soal_lain')}</button>}
        </>
      ) : (
        <button type="button" className="aw-btn aw-btn-primary" disabled={status === 'mencari'} onClick={() => void mulai()}>
          {status === 'mencari' ? t('latihan.bank_mencari') : t('latihan.kuis_bank_mulai')}
        </button>
      )}
      <p className="status-bank" role="status">
        {status === 'tidakTerhubung' ? t('latihan.bank_tidak_terhubung') : status === 'tidakAda' ? t('latihan.kuis_bank_tidak_ada_cocok') : ''}
      </p>
    </section>
  );
}
