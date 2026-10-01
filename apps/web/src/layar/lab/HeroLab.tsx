// Panel kaca di hero Awal Lab (pola sama dengan panel "Lanjutkan" di Belajar): satu aksi utama. Ada kasus berjalan →
// pohon keluarganya dan tombol Lanjutkan. Kasus lengkap yang punya satu pembagian pasti memakai pohon + pita bagian dari engine
// (jalankan + cobaRingkas, sama dengan layar Hasil); kasus belum lengkap, atau yang hasilnya berupa kemungkinan (janin, hilang,
// kelamin ganda, wafat bersamaan), memakai pohon susunan saja. Tidak boleh melempar galat: halaman ini pintu masuk ArifLab.
// Tanpa kasus → tidak dirender (memulai ada di bagian Mulai kasus baru). Kasus apa pun yang berjalan (bahkan baru memilih jenis kelamin) bisa dilanjutkan.

import { useMemo } from 'react';
import { Pohon } from '../../hasil/Pohon';
import { PratinjauPohon } from '../../hasil/PratinjauPohon';
import { PenyediaSorot } from '../../hasil/sorot';
import { cobaRingkas } from '../../hasil/ringkasan';
import { jalankan } from '../../jalankan';
import type { Kasus } from '../../kasus';
import { ringkasKasus } from '../../riwayat';
import { PohonSusunan } from './PohonSusunan';
import { panah, t } from '../../terjemah';

const SKALA_MAKS = 1.3;
// Warna ruas pita bagian, satu per penerima (sama dengan hero Beranda).
const WARNA_RUAS = ['#6ee9b0', '#f6c86a', '#8ec5ff', '#f7a8c4', '#c9a8f7'];

interface Props { kasusTerakhir: Kasus | null; saatLanjut: () => void }

export function HeroLab({ kasusTerakhir, saatLanjut }: Props) {
  const ringkasan = useMemo(
    () => (kasusTerakhir && ringkasKasus(kasusTerakhir).lengkap ? cobaRingkas(kasusTerakhir, jalankan(kasusTerakhir)) : null),
    [kasusTerakhir]);
  if (!kasusTerakhir) return null;
  const { judul, keterangan } = ringkasKasus(kasusTerakhir);
  return (
    <section className="panel-lab" aria-label={t('hitung.lab_pohon_kasus', { nama: judul })}>
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
      <button type="button" className="pil-terang kartu-lanjut-hero" onClick={saatLanjut}>
        <span className="label-langkah">{t('hitung.lab_lanjutkan')}</span>
        <b>{judul}</b>
        <span className="keterangan">{keterangan}</span>
        <span className="panah-bulat" aria-hidden="true">{panah()}</span>
      </button>
    </section>
  );
}
