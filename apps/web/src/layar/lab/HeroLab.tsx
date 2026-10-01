// Hero Awal Lab: panggung pohon keluarga kasus terakhir. Kasus lengkap → pohon + pita bagian dari engine (jalankan +
// ringkas, sama dengan layar Hasil); kasus belum lengkap → pohon susunan saja, engine tidak dipanggil.
// Tanpa kasus berisi ahli waris → ajakan mulai skenario baru.

import { useMemo } from 'react';
import { hitungIsian } from '../../checklist';
import { Pohon } from '../../hasil/Pohon';
import { PratinjauPohon } from '../../hasil/PratinjauPohon';
import { PenyediaSorot } from '../../hasil/sorot';
import { ringkas } from '../../hasil/ringkasan';
import { jalankan } from '../../jalankan';
import type { Kasus } from '../../kasus';
import { ringkasKasus } from '../../riwayat';
import { Ikon } from '../../ui/Ikon';
import { PohonSusunan } from './PohonSusunan';
import { t } from '../../terjemah';

const SKALA_MAKS = 1.4;
// Warna ruas pita bagian, satu per penerima (sama dengan hero Beranda).
const WARNA_RUAS = ['#6ee9b0', '#f6c86a', '#8ec5ff', '#f7a8c4', '#c9a8f7'];

interface Props { kasusTerakhir: Kasus | null; saatLanjut: () => void; saatMulaiBaru: () => void }

export function HeroLab({ kasusTerakhir, saatLanjut, saatMulaiBaru }: Props) {
  const berisi = !!kasusTerakhir && Object.keys(hitungIsian(kasusTerakhir.graf, kasusTerakhir.graf.idPewaris)).length > 0;
  const ringkasan = useMemo(
    () => (berisi && kasusTerakhir && ringkasKasus(kasusTerakhir).lengkap ? ringkas(kasusTerakhir, jalankan(kasusTerakhir)) : null),
    [berisi, kasusTerakhir]);
  if (!berisi || !kasusTerakhir) {
    return (
      <section className="lab-hero lab-hero-kosong">
        <p className="lead">{t('hitung.lab_hero_kosong')}</p>
        <button type="button" className="pil-hero pil-terang" onClick={saatMulaiBaru}><Ikon nama="tambah" ukuran={18} />{t('hitung.lab_mulai_baru')}</button>
      </section>
    );
  }
  const { judul, keterangan } = ringkasKasus(kasusTerakhir);
  return (
    <section className="lab-hero" aria-label={t('hitung.lab_pohon_kasus', { nama: judul })}>
      <div className="lab-panggung">
        {ringkasan
          ? <PratinjauPohon skalaMaks={SKALA_MAKS}><PenyediaSorot><Pohon graf={kasusTerakhir.graf} ringkasan={ringkasan} urutanWafat={[]} bentuk="sederhana" sedangMenebak={false} sembunyiNominal={false} saatPilih={() => {}} /></PenyediaSorot></PratinjauPohon>
          : <PohonSusunan kasus={kasusTerakhir} skalaMaks={SKALA_MAKS} />}
        {ringkasan && (
          <div className="pita-bagian" aria-hidden="true">
            {ringkasan.penerima.map((orang, urutan) => (
              <span key={orang.id} style={{ width: `${Number(orang.saham * 10000n / ringkasan.penyebut) / 100}%`, background: WARNA_RUAS[urutan % WARNA_RUAS.length] }} />
            ))}
          </div>
        )}
      </div>
      <div className="lab-hero-isi">
        <h2>{judul}</h2>
        <p className="keterangan">{keterangan}</p>
        <button type="button" className="pil-hero pil-terang" onClick={saatLanjut}>{t('hitung.lab_lanjutkan')}</button>
      </div>
    </section>
  );
}
