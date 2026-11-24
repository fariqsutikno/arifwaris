// Tangga bantuan satu kolom (spec tangga-bantuan-soal 4 dan 5a): tautan "Butuh petunjuk?", kartu petunjuk 1/2 dengan
// satu aksi berikutnya, lalu "Tunjukkan jawaban kolom". Hanya tampilan; keputusan kolom dan pencatatan milik TabelLatihan.

import { Ikon } from '../ui/Ikon';
import { t } from '../terjemah';
import { tautanBelajar } from '../rute';
import { Tebal } from './Tebal';
import type { IsiPetunjuk } from './kalimatPetunjuk';

interface Props {
  judulKolom: string;
  /** Petunjuk yang sudah dibuka untuk kolom ini (0 = belum ada). */
  tingkat: 0 | 1 | 2;
  isi: (tingkat: 1 | 2) => IsiPetunjuk;
  saatPetunjuk: () => void;
  saatTunjukkan: () => void;
}

export function BantuanKolom({ judulKolom, tingkat, isi, saatPetunjuk, saatTunjukkan }: Props) {
  if (tingkat === 0) {
    return <button type="button" className="tautan-aksi tautan-bantuan" onClick={saatPetunjuk}>{t('hitung.bantuan.butuh_petunjuk')}</button>;
  }
  const daftar = ([1, 2] as const).filter(nomor => nomor <= tingkat).map(nomor => ({ nomor, ...isi(nomor) }));
  return (
    <section className="kartu-petunjuk" aria-label={t('hitung.bantuan.judul_kartu', { nomor: tingkat, judul: judulKolom })}>
      <h3>{t('hitung.bantuan.judul_kartu', { nomor: tingkat, judul: judulKolom })}</h3>
      {daftar.map(petunjuk => (
        <p key={petunjuk.nomor}>
          <Tebal teks={petunjuk.teks} />
          {petunjuk.bab && <> <a className="tautan-aksi" href={tautanBelajar()}>{t('hitung.bantuan.buka_materi')}</a></>}
        </p>
      ))}
      {tingkat === 1
        ? <button type="button" className="tautan-aksi" onClick={saatPetunjuk}>{t('hitung.bantuan.petunjuk_berikutnya')}</button>
        : <button type="button" className="tautan-aksi tautan-bahaya" onClick={saatTunjukkan}><Ikon nama="mata" ukuran={18} />{t('hitung.bantuan.tunjukkan_kolom', { judul: judulKolom })}</button>}
    </section>
  );
}
