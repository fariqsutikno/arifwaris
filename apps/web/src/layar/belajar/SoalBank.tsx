// Panel "Soal acak dari bank" di tab Soal hitung: pilih tingkat dan modul, lalu mulai. Soal diambil dari bank generator
// (daring); bila bank tak terjangkau, pesannya jelas dan soal kurasi di daftar bawah tetap bisa dikerjakan.
// Satu aksi utama (tombol Mulai); soal yang keluar langsung dibuka di kalkulator mode Belajar.

import { useState } from 'react';
import type { SoalHitung, Tingkat } from '@waris/content';
import { akunLokal } from '../../akun/antrean';
import { cariSoalBank } from '../../bank/cariSoalBank';
import { muatBankSoal } from '../../bank/klienBank';
import { daftarModul } from '../../konten/sumber';
import type { Kasus } from '../../kasus';
import { Ikon } from '../../ui/Ikon';
import { t } from '../../terjemah';
import { TEKS_TINGKAT } from '../AwalHitung';
import { TombolBukaKasus } from './TombolBukaKasus';

const SEMUA_TINGKAT: Tingkat[] = ['dasar', 'menengah', 'sulit'];
/** Modul yang punya soal bank (tingkatModul.ts); modul 12 (dzawil arham) tanpa tabel isian, 1-2 dan 8, 15 tanpa soal hitung bank. */
const MODUL_BANK = [3, 4, 5, 6, 7, 9, 10, 11, 13, 14];

type Status = 'diam' | 'mencari' | 'tidakTerhubung' | 'tidakAda';

interface Props {
  kasusSekarang: Kasus | null;
  saatKerjakan: (soal: SoalHitung) => void;
  /** Disuntik uji; bawaan = klien bank (Supabase, atau sampel memori di pengembangan lokal). */
  muatBank?: typeof muatBankSoal;
  /** Benih pencarian: turunan pengguna + waktu supaya tiap tekan menghasilkan soal lain; kelas kelak memakai benih tugas. */
  buatBenih?: () => string;
}

const hurufAwalKapital = (teks: string) => teks.charAt(0).toLocaleUpperCase() + teks.slice(1);
const benihBawaan = () => `${akunLokal() ?? 'tamu'}:${Date.now()}`;

export function SoalBank({ kasusSekarang, saatKerjakan, muatBank = muatBankSoal, buatBenih = benihBawaan }: Props) {
  const [tingkat, setTingkat] = useState<Tingkat | ''>('');
  const [modul, setModul] = useState('');
  const [status, setStatus] = useState<Status>('diam');
  const judulModul = new Map(daftarModul().map(isi => [isi.nomor, isi.judul]));

  const mulai = async () => {
    setStatus('mencari');
    try {
      const bank = await muatBank();
      if (!bank) return setStatus('tidakTerhubung');
      const soal = await cariSoalBank(bank, { tingkat: tingkat || undefined, modul: modul ? Number(modul) : undefined }, buatBenih());
      if (!soal) return setStatus('tidakAda');
      setStatus('diam');
      saatKerjakan(soal);
    } catch {
      setStatus('tidakTerhubung');
    }
  };

  return (
    <section className="soal-bank" aria-labelledby="judul-bank">
      <h2 id="judul-bank"><Ikon nama="acak" ukuran={20} />{t('latihan.bank_judul')}</h2>
      <p className="keterangan">{t('latihan.bank_pengantar')}</p>
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
            {MODUL_BANK.map(nomor => <option key={nomor} value={nomor}>{judulModul.get(nomor) ?? nomor}</option>)}
          </select>
        </label>
      </div>
      <TombolBukaKasus kasusSekarang={kasusSekarang} saatBuka={() => void mulai()} varian="primary">{status === 'mencari' ? t('latihan.bank_mencari') : t('latihan.bank_mulai')}</TombolBukaKasus>
      <p className="status-bank" role="status">
        {status === 'tidakTerhubung' ? t('latihan.bank_tidak_terhubung') : status === 'tidakAda' ? t('latihan.bank_tidak_ada_cocok') : ''}
      </p>
    </section>
  );
}
