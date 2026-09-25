// Latihan: dua tab.
//   Soal hitung — daftar kasus per bab (ala LeetCode): tanda sudah dikerjakan, tingkat, dan tombol Kerjakan yang
//   membuka kasusnya di kalkulator mode Belajar. Soal ditandai selesai saat jawabannya dibuka di sana.
//   Kuis konsep — daftar paket; sesi kuisnya ada di KuisKonsep.tsx.

import { HeroMini } from '../../ui/Hero';
import { DAFTAR_SOAL_HITUNG, type SoalHitung, type Tingkat } from '@waris/content';
import type { Kasus } from '../../kasus';
import { bacaCatatan } from '../../preferensi';
import { tautanLatihan } from '../../rute';
import { DaftarPaketKuis, SesiKuis, judulTopik, perBab } from './KuisKonsep';
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
      <HeroMini judul="Latihan" keterangan="Kerjakan soal hitung dari kasus nyata, atau uji pemahaman konsep lewat kuis per bab." ikon="kuis" />
      <nav className="tab-kecil tab-latihan" aria-label="Jenis latihan">
        <a className="tab-tautan" href={tautanLatihan('hitung')} aria-current={tab === 'hitung' ? 'page' : undefined}>Soal hitung</a>
        <a className="tab-tautan" href={tautanLatihan('kuis')} aria-current={tab === 'kuis' ? 'page' : undefined}>Kuis konsep</a>
      </nav>
      {tab === 'hitung' ? <DaftarSoalHitung kasusSekarang={kasusSekarang} saatKerjakan={saatKerjakan} /> : <DaftarPaketKuis />}
    </main>
  );
}

const TINGKAT: Tingkat[] = ['dasar', 'menengah', 'sulit'];

function DaftarSoalHitung({ kasusSekarang, saatKerjakan }: Omit<Props, 'tab' | 'paket'>) {
  const catatan = bacaCatatan('soal');
  const jumlahSelesai = DAFTAR_SOAL_HITUNG.filter(soal => catatan[soal.kode]).length;
  return (
    <>
      <section className="kartu statistik-latihan" aria-label="Progres soal hitung">
        <div className="stat-utama">
          <span className="angka-besar">{jumlahSelesai}<small>/{DAFTAR_SOAL_HITUNG.length}</small></span>
          <span className="keterangan">soal dikerjakan</span>
          <span className="bar-progres" aria-hidden="true"><span style={{ width: `${(jumlahSelesai / DAFTAR_SOAL_HITUNG.length) * 100}%` }} /></span>
        </div>
        <dl className="stat-tingkat">
          {TINGKAT.map(tingkat => {
            const daftar = DAFTAR_SOAL_HITUNG.filter(soal => soal.tingkat === tingkat);
            return (
              <div key={tingkat}>
                <dt className={`tingkat tingkat-${tingkat}`}>{tingkat}</dt>
                <dd>{daftar.filter(soal => catatan[soal.kode]).length}<small>/{daftar.length}</small></dd>
              </div>
            );
          })}
        </dl>
      </section>
      {perBab(DAFTAR_SOAL_HITUNG).map(([bab, daftar]) => (
        <section key={bab} className="tumpuk-rapat">
          <h2 className="judul-bab-latihan">{judulTopik(bab)} <span className="keterangan">{daftar.filter(soal => catatan[soal.kode]).length}/{daftar.length}</span></h2>
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

