// Tab Soal hitung: soal per bab dalam daftar lipat. Hanya bab dengan soal berikutnya yang terbuka; tiap bab menampilkan
// beberapa soal dulu ("Tampilkan lagi"), supaya ratusan soal tetap enak dipindai. Cari judul, saring tingkat, dan
// sembunyikan yang selesai; saat menyaring, bab yang cocok otomatis terbuka dan yang tidak cocok disembunyikan.
// Aksi per baris berupa tautan teks; satu-satunya tombol utama dipakai untuk soal berikutnya yang disarankan.

import { useState } from 'react';
import type { SoalHitung, Tingkat } from '@waris/content';
import { daftarSoalHitung } from '../../konten/sumber';
import type { Kasus } from '../../kasus';
import { bacaProgresLatihan } from '../../progres';
import { Ikon } from '../../ui/Ikon';
import { angka, t } from '../../terjemah';
import { TEKS_TINGKAT } from '../AwalHitung';
import { judulTopik, perBab } from './KuisKonsep';
import { TombolBukaKasus } from './TombolBukaKasus';

const BATAS_AWAL = 8;
const TAMBAHAN = 10;
const TINGKAT: Tingkat[] = ['dasar', 'menengah', 'sulit'];

interface Props { kasusSekarang: Kasus | null; saatKerjakan: (soal: SoalHitung) => void }

export function DaftarSoalHitung({ kasusSekarang, saatKerjakan }: Props) {
  const semua = daftarSoalHitung();
  const catatan = bacaProgresLatihan('hitung');
  const berikutnya = semua.find(soal => !catatan[soal.kode]);
  const [kueri, setKueri] = useState('');
  const [tingkat, setTingkat] = useState<Tingkat | null>(null);
  const [sembunyikanSelesai, setSembunyikanSelesai] = useState(false);
  const [terbuka, setTerbuka] = useState(() => new Set([(berikutnya ?? semua[0])?.bab]));
  const [batasTampil, setBatasTampil] = useState<Record<number, number>>({});

  const menyaring = kueri.trim() !== '' || tingkat !== null || sembunyikanSelesai;
  const cocok = (soal: SoalHitung) => {
    const selesai = !!catatan[soal.kode];
    if (tingkat && soal.tingkat !== tingkat) return false;
    if (sembunyikanSelesai && selesai) return false;
    const kata = kueri.trim().toLowerCase();
    return !kata || soal.judul.toLowerCase().includes(kata) || (selesai && soal.topik.toLowerCase().includes(kata));
  };
  const babTampil = perBab(semua).map(([bab, daftar]) => ({ bab, daftar, cocok: daftar.filter(cocok) })).filter(isi => !menyaring || isi.cocok.length > 0);
  const jumlahCocok = babTampil.reduce((jumlah, isi) => jumlah + isi.cocok.length, 0);
  const setel = (bab: number) => setTerbuka(lama => { const baru = new Set(lama); if (!baru.delete(bab)) baru.add(bab); return baru; });
  const hapusSaringan = () => { setKueri(''); setTingkat(null); setSembunyikanSelesai(false); };

  return (
    <>
      <div className="alat-soal">
        <label className="kolom-cari">
          <span className="sembunyi-visual">{t('latihan.cari_judul_soal')}</span>
          <input type="search" value={kueri} placeholder={t('latihan.cari_judul_soal')} onChange={kejadian => setKueri(kejadian.target.value)} />
        </label>
        <div className="pilih-tingkat" role="group" aria-label={t('latihan.tingkat')}>
          <button type="button" aria-pressed={tingkat === null} onClick={() => setTingkat(null)}>{t('latihan.semua')}</button>
          {TINGKAT.map(isi => <button key={isi} type="button" aria-pressed={tingkat === isi} onClick={() => setTingkat(tingkat === isi ? null : isi)}>{TEKS_TINGKAT()[isi]}</button>)}
        </div>
        <label className="sakelar">
          <input type="checkbox" role="switch" checked={sembunyikanSelesai} onChange={kejadian => setSembunyikanSelesai(kejadian.target.checked)} />
          <span className="jalur-sakelar" aria-hidden="true" />
          <span>{t('latihan.sembunyikan_yang_selesai')}</span>
        </label>
      </div>
      {menyaring && <p className="keterangan" aria-live="polite">{t('latihan.jumlah_soal_cocok', { jumlah: angka(String(jumlahCocok)) })}</p>}

      {babTampil.map(({ bab, daftar, cocok: terlihat }) => {
        const selesai = daftar.filter(soal => catatan[soal.kode]).length;
        const buka = menyaring || terbuka.has(bab);
        const batas = batasTampil[bab] ?? Math.max(BATAS_AWAL, berikutnya ? terlihat.findIndex(soal => soal.kode === berikutnya.kode) + 1 : 0);
        return (
          <section key={bab} className={buka ? 'bab-soal terbuka' : 'bab-soal'}>
            <h2>
              <button type="button" className="kepala-bab" aria-expanded={buka} aria-controls={`bab-soal-${bab}`} onClick={() => setel(bab)}>
                <Ikon nama="kembali" ukuran={18} />
                <span className="judul-bab-soal">{judulTopik(bab)}</span>
                <span className="progres-bab">
                  <span className="keterangan">{t('latihan.selesai_dari_total', { selesai: angka(String(selesai)), total: angka(String(daftar.length)) })}</span>
                  <span className="bar-progres" aria-hidden="true"><span style={{ width: `${(selesai / daftar.length) * 100}%` }} /></span>
                </span>
              </button>
            </h2>
            {buka && (
              <div id={`bab-soal-${bab}`}>
                <ul className="daftar-polos daftar-soal-baru">
                  {terlihat.slice(0, batas).map(soal => (
                    <BarisSoal key={soal.kode} soal={soal} selesai={!!catatan[soal.kode]} disarankan={soal.kode === berikutnya?.kode}
                      kasusSekarang={kasusSekarang} saatKerjakan={saatKerjakan} />
                  ))}
                </ul>
                {terlihat.length > batas && (
                  <button type="button" className="tautan-lagi" onClick={() => setBatasTampil({ ...batasTampil, [bab]: batas + TAMBAHAN })}>
                    {t('latihan.tampilkan_lagi', { jumlah: angka(String(Math.min(TAMBAHAN, terlihat.length - batas))) })} <span className="keterangan">({t('latihan.sisa_jumlah', { jumlah: angka(String(terlihat.length - batas)) })})</span>
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}
      {babTampil.length === 0 && (
        <p className="kosong-soal">{t('latihan.tidak_ada_soal_yang_cocok')} <button type="button" className="tautan-lagi" onClick={hapusSaringan}>{t('latihan.hapus_pencarian_dan_saringan')}</button></p>
      )}
    </>
  );
}

interface BarisProps { soal: SoalHitung; selesai: boolean; disarankan: boolean; kasusSekarang: Kasus | null; saatKerjakan: (soal: SoalHitung) => void }

function BarisSoal({ soal, selesai, disarankan, kasusSekarang, saatKerjakan }: BarisProps) {
  return (
    <li className={['baris-soal-baru', selesai && 'selesai', disarankan && 'disarankan'].filter(Boolean).join(' ')}>
      <span className="status-soal-baru" role="img" aria-label={selesai ? t('latihan.sudah_dikerjakan') : t('latihan.belum_dikerjakan')}>
        {selesai && <Ikon nama="benar" ukuran={16} />}
      </span>
      <div className="isi-soal">
        <b>{soal.judul}</b>
        <span className="keterangan">
          <span className={`tingkat tingkat-${soal.tingkat}`}>{TEKS_TINGKAT()[soal.tingkat]}</span>
          {selesai && <> · {soal.topik}</>}
          {disarankan && <> · <span className="penanda-berikutnya">{t('latihan.soal_berikutnya_untukmu')}</span></>}
        </span>
      </div>
      <TombolBukaKasus kasusSekarang={kasusSekarang} saatBuka={() => saatKerjakan(soal)} varian={disarankan ? 'primary' : 'ghost'}>
        {selesai ? t('latihan.ulangi') : t('hitung.kerjakan')}
      </TombolBukaKasus>
    </li>
  );
}
