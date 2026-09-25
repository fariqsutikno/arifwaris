// Latihan: dua tab.
//   Soal hitung — daftar kasus per bab (ala LeetCode): tanda sudah dikerjakan, tingkat, dan tombol Kerjakan yang
//   membuka kasusnya di kalkulator mode Belajar. Soal ditandai selesai saat jawabannya dibuka di sana.
//   Kuis konsep — daftar paket; sesi kuisnya ada di KuisKonsep.tsx.

import { DAFTAR_SOAL_HITUNG, JUDUL_BAB, type SoalHitung } from '@waris/content';
import type { Kasus } from '../../kasus';
import { bacaCatatan } from '../../preferensi';
import { tautanLatihan } from '../../rute';
import { DaftarPaketKuis, SesiKuis, perBab } from './KuisKonsep';
import { TombolBukaKasus } from './TombolBukaKasus';

interface Props {
  tab: 'hitung' | 'kuis';
  paket?: string | undefined;
  kasusSekarang: Kasus | null;
  saatKerjakan: (soal: SoalHitung) => void;
}

export function Latihan({ tab, paket, kasusSekarang, saatKerjakan }: Props) {
  // Saat mengerjakan satu paket kuis, halaman fokus ke soal: tanpa judul Latihan dan tab.
  if (tab === 'kuis' && paket) return <main className="halaman tumpuk"><SesiKuis key={paket} paket={paket} /></main>;
  return (
    <main className="halaman tumpuk">
      <h1>Latihan</h1>
      <nav className="tab-kecil tab-latihan" aria-label="Jenis latihan">
        <a href={tautanLatihan('hitung')} aria-current={tab === 'hitung' ? 'page' : undefined}>Soal hitung</a>
        <a href={tautanLatihan('kuis')} aria-current={tab === 'kuis' ? 'page' : undefined}>Kuis konsep</a>
      </nav>
      {tab === 'hitung' ? <DaftarSoalHitung kasusSekarang={kasusSekarang} saatKerjakan={saatKerjakan} /> : <DaftarPaketKuis />}
    </main>
  );
}

function DaftarSoalHitung({ kasusSekarang, saatKerjakan }: Omit<Props, 'tab' | 'paket'>) {
  const catatan = bacaCatatan('soal');
  const jumlahSelesai = DAFTAR_SOAL_HITUNG.filter(soal => catatan[soal.kode]).length;
  return (
    <>
      <p className="keterangan">{jumlahSelesai} dari {DAFTAR_SOAL_HITUNG.length} soal sudah dikerjakan. Soal dibuka di Hitung mode Belajar, jawabannya tertutup sampai kamu menjawab.</p>
      {perBab(DAFTAR_SOAL_HITUNG).map(([bab, daftar]) => (
        <section key={bab} className="tumpuk-rapat">
          <h2 className="judul-bab-latihan">Bab {bab} · {JUDUL_BAB[bab]} <span className="keterangan">{daftar.filter(soal => catatan[soal.kode]).length}/{daftar.length}</span></h2>
          <ul className="daftar-polos daftar-soal">
            {daftar.map(soal => {
              const selesai = !!catatan[soal.kode];
              return (
                <li key={soal.kode} className={selesai ? 'baris-soal selesai' : 'baris-soal'}>
                  <span className="status-soal" aria-label={selesai ? 'sudah dikerjakan' : 'belum dikerjakan'}>{selesai ? '✓' : '○'}</span>
                  <div className="isi-soal">
                    <b>{soal.judul}</b>
                    <span className="keterangan">
                      <span className={`tingkat tingkat-${soal.tingkat}`}>{soal.tingkat}</span>
                      {selesai && <> · {soal.topik}</>}
                    </span>
                  </div>
                  <TombolBukaKasus kasusSekarang={kasusSekarang} saatBuka={() => saatKerjakan(soal)} varian={selesai ? 'secondary' : 'primary'}>
                    {selesai ? 'Ulangi' : 'Kerjakan'}
                  </TombolBukaKasus>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}

