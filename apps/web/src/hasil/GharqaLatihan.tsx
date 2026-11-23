// Soal gharqa (spec B7, mockup tab Gharqa): langkah keputusan dulu, lalu satu tabel biasa per harta.
//   Menerima: SoalGharqa dari @waris/latihan, jangkar tiap tabel (dipilih Hasil), aksi ke kartu induk.
//   Memutuskan: keputusan dinilai dulu; tabel baru muncul bila keputusan benar dan harta ada (ditahan: tanpa angka).
//   Menyerahkan: SATU rangkaian percobaan ke Hasil: benarSemua hanya bila keputusan dan semua tabel benar (XP sekali).

import { useEffect, useRef, useState } from 'react';
import { Ikon } from '../ui/Ikon';
import { t } from '../terjemah';
import type { IsianGharqa, IsianTabel, Jangkar, KeputusanGharqa, PercobaanTabel, SoalGharqa } from '@waris/latihan';
import { TabelLatihan, Tebal } from './TabelLatihan';

const PILIHAN_KEPUTUSAN: KeputusanGharqa[] = ['terakhirMewarisi', 'tidakSalingMewarisi', 'ditahan'];
const KOSONG: IsianTabel = { kepala: {}, sel: {} };

interface Props {
  soal: SoalGharqa;
  namaDari: (id: string) => string;
  jangkar: Array<Jangkar | null>;
  /** Jawaban sudah dibuka (dialog tahan di Hasil) atau soal sudah benar seluruhnya. */
  terbuka: boolean;
  saatPercobaan: (percobaan: PercobaanTabel) => void;
  saatLihatJawaban: (isian: IsianTabel) => void;
  /** Pilihan dan isian tabel saat dipasang (pulih dari simpanan perangkat). */
  pilihanAwal?: KeputusanGharqa | null | undefined;
  isianHartaAwal?: Record<string, IsianTabel> | undefined;
  /** Dipanggil tiap pilihan/isian berubah, untuk disimpan pemanggil. */
  saatBerubah?: (pilihan: KeputusanGharqa | null, isianHarta: Record<string, IsianTabel>) => void;
}

const labelKeputusan = (keputusan: KeputusanGharqa) => ({
  terakhirMewarisi: t('hitung.gharqa.yang_terakhir_mewarisi'),
  tidakSalingMewarisi: t('hitung.gharqa.tidak_saling_mewarisi'),
  ditahan: t('hitung.gharqa.ditahan_sampai_jelas'),
})[keputusan];

export function GharqaLatihan({ soal, namaDari, jangkar, terbuka, saatPercobaan, saatLihatJawaban, pilihanAwal = null, isianHartaAwal = {}, saatBerubah }: Props) {
  const [dipilih, setDipilih] = useState<KeputusanGharqa | null>(pilihanAwal);
  const [isianHarta, setIsianHarta] = useState<Record<string, IsianTabel>>(isianHartaAwal);
  useEffect(() => { saatBerubah?.(dipilih, isianHarta); }, [dipilih, isianHarta]); // eslint-disable-line react-hooks/exhaustive-deps
  const hartaBenar = useRef(new Map<string, boolean>());
  // Isian terakhir tiap harta: server menilai keputusan dan semua tabel dari satu kiriman.
  const isianKiriman = useRef(new Map<string, IsianGharqa['harta'][number]>());
  const kirimanGharqa = (pilihan: KeputusanGharqa): IsianGharqa => ({ keputusan: pilihan, harta: [...isianKiriman.current.values()] });
  const keputusan = terbuka ? soal.keputusan : dipilih;
  const keputusanBenar = keputusan === soal.keputusan;

  const pilih = (pilihan: KeputusanGharqa) => {
    setDipilih(pilihan);
    // Keputusan yang meneruskan ke tabel baru dilaporkan setelah tabel selesai; selebihnya (salah, atau ditahan) selesai di sini.
    if (pilihan !== soal.keputusan || soal.harta.length === 0) {
      saatPercobaan({ mode: 'latihan', aksi: 'periksa', isian: KOSONG, jangkar: null, gharqa: { keputusan: pilihan, harta: [] }, hasilKolom: [], benarSemua: pilihan === soal.keputusan });
    }
  };
  const kosongkan = () => { setDipilih(null); hartaBenar.current.clear(); isianKiriman.current.clear(); setIsianHarta({}); };
  const saatPercobaanHarta = (mayit: string) => (percobaan: PercobaanTabel) => {
    hartaBenar.current.set(mayit, percobaan.benarSemua);
    isianKiriman.current.set(mayit, { mayit, isian: percobaan.isian, jangkar: percobaan.jangkar });
    saatPercobaan({ ...percobaan, gharqa: kirimanGharqa(soal.keputusan), benarSemua: soal.harta.every(harta => hartaBenar.current.get(harta.mayit)) });
  };

  const umpan = !keputusan || terbuka ? null
    : !keputusanBenar ? { gaya: 'salah', teks: t('hitung.gharqa.umpan_salah') }
    : { gaya: 'benar', teks: soal.harta.length > 0 ? t('hitung.gharqa.umpan_benar_tabel') : t('hitung.gharqa.umpan_benar_ditahan') };

  return (
    <div className="tata-tabel-latihan">
      <section className="ubin-h tabel-latihan" aria-labelledby="judul-langkah-gharqa">
        <h2 id="judul-langkah-gharqa">{t('hitung.gharqa.langkah_pertama')}</h2>
        <p className="sub">{t('hitung.gharqa.pertanyaan')}</p>
        <div className="chip-orang" role="group" aria-labelledby="judul-langkah-gharqa">
          {PILIHAN_KEPUTUSAN.map(pilihan => (
            <button key={pilihan} type="button" aria-pressed={keputusan === pilihan} disabled={terbuka || (keputusanBenar && !!dipilih)} onClick={() => pilih(pilihan)}>{labelKeputusan(pilihan)}</button>
          ))}
        </div>
        {umpan && <div className={`umpan-tabel ${umpan.gaya}`} role="status">{umpan.teks}</div>}
        {!terbuka && !(keputusanBenar && dipilih) && (
          <div className="aksi-tabel">
            <button type="button" className="tautan-aksi" onClick={kosongkan}>{t('hitung.kosongkan')}</button>
            <button type="button" className="tautan-aksi tautan-bahaya" onClick={() => saatLihatJawaban(KOSONG)}><Ikon nama="mata" ukuran={18} />{t('hitung.lihat_jawaban')}</button>
          </div>
        )}
      </section>
      <section className="ubin-h cara-mengisi" aria-labelledby="judul-cara-gharqa">
        <h2 id="judul-cara-gharqa">{t('hitung.tabel.cara_mengisi')}</h2>
        <ol><li><Tebal teks={t('hitung.gharqa.cara_1')} /></li><li><Tebal teks={t('hitung.gharqa.cara_2')} /></li></ol>
      </section>
      {keputusanBenar && soal.harta.map((harta, indeks) => (
        <div key={harta.mayit} className="tata-tabel-latihan">
          <h3 className="judul-panel">{t('hitung.gharqa.harta_nama', { nama: namaDari(harta.mayit) })}</h3>
          <TabelLatihan tabel={harta.tabel} namaDari={namaDari} mode="latihan" jangkar={jangkar[indeks] ?? null} terbuka={terbuka} tanpaCara={indeks > 0}
            isianAwal={isianHarta[harta.mayit]} saatIsianBerubah={isian => setIsianHarta(lama => ({ ...lama, [harta.mayit]: isian }))}
            saatLihatJawaban={saatLihatJawaban} saatPercobaan={saatPercobaanHarta(harta.mayit)} />
        </div>
      ))}
    </div>
  );
}
