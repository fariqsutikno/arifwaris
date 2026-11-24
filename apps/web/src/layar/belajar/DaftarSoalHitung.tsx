// Tab Soal hitung: soal per bab dalam daftar lipat. Hanya bab dengan soal berikutnya yang terbuka; tiap bab menampilkan
// beberapa soal dulu ("Tampilkan lagi"), supaya ratusan soal tetap enak dipindai. Cari judul, saring tingkat, dan
// sembunyikan yang selesai; saat menyaring, bab yang cocok otomatis terbuka dan yang tidak cocok disembunyikan.
// Aksi per baris berupa tautan teks; satu-satunya tombol utama dipakai untuk soal berikutnya yang disarankan.

import { useState, type CSSProperties } from 'react';
import type { SoalHitung, Tingkat } from '@waris/content';
import { daftarSoalHitung } from '../../konten/sumber';
import type { Kasus } from '../../kasus';
import { bacaSemuaIsianSoal, hitungTerisi, type IsianSoal } from '../../isianSoal';
import { bacaProgresLatihan } from '../../progres';
import { bacaSemuaBantuanSoal } from '../../bantuanSoal';
import type { PredikatSoal } from '../../tanggaBantuan';
import { Ikon } from '../../ui/Ikon';
import { angka, t } from '../../terjemah';
import { TEKS_TINGKAT } from '../AwalHitung';
import { judulTopik, perBab, urutanSoalHitung } from './KuisKonsep';
import { judulSoalTampil } from './judulSoal';
import { porsiIsian, soalSelesai, soalTerputus, statusSoal, type StatusSoal } from './statusSoal';
import { TombolBukaKasus } from './TombolBukaKasus';

const BATAS_AWAL = 8;
const TAMBAHAN = 10;
const TINGKAT: Tingkat[] = ['dasar', 'menengah', 'sulit'];

interface Props { kasusSekarang: Kasus | null; saatKerjakan: (soal: SoalHitung) => void }

export function DaftarSoalHitung({ kasusSekarang, saatKerjakan }: Props) {
  const semua = urutanSoalHitung(daftarSoalHitung());
  const catatan = bacaProgresLatihan('hitung');
  const isianTersimpan = bacaSemuaIsianSoal();
  const bantuanTersimpan = bacaSemuaBantuanSoal();
  const statusDari = (soal: SoalHitung) => statusSoal(catatan[soal.kode], isianTersimpan[soal.kode]);
  const terputus = soalTerputus(semua, catatan, isianTersimpan)[0];
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
    // Soal buta: sebelum selesai hanya kode, bab, dan tingkat yang bisa dicari; judul dan topik membuka susunan keluarga.
    return !kata || soal.kode.toLowerCase().includes(kata) || judulTopik(soal.bab).toLowerCase().includes(kata) || TEKS_TINGKAT()[soal.tingkat].toLowerCase().includes(kata)
      || (selesai && (soal.judul.toLowerCase().includes(kata) || soal.topik.toLowerCase().includes(kata)));
  };
  const babTampil = perBab(semua).map(([bab, daftar]) => ({ bab, daftar, cocok: daftar.filter(cocok) })).filter(isi => !menyaring || isi.cocok.length > 0);
  const jumlahCocok = babTampil.reduce((jumlah, isi) => jumlah + isi.cocok.length, 0);
  const setel = (bab: number) => setTerbuka(lama => { const baru = new Set(lama); if (!baru.delete(bab)) baru.add(bab); return baru; });
  const hapusSaringan = () => { setKueri(''); setTingkat(null); setSembunyikanSelesai(false); };

  return (
    <>
      <div className="alat-soal">
        <label className="kolom-cari">
          <span className="sembunyi-visual">{t('latihan.cari_kode_bab_tingkat')}</span>
          <input type="search" value={kueri} placeholder={t('latihan.cari_kode_bab_tingkat')} onChange={kejadian => setKueri(kejadian.target.value)} />
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
      {terputus && (
        <div className="lanjut-terputus">
          <span><b>{t('latihan.lanjutkan_yang_terputus')}</b> · {judulSoalTampil(terputus, false)} · {judulTopik(terputus.bab)}</span>
          <TombolBukaKasus kasusSekarang={kasusSekarang} saatBuka={() => saatKerjakan(terputus)} varian="primary" kelas="tombol-baris">{t('hitung.lab_lanjutkan')}</TombolBukaKasus>
        </div>
      )}
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
                    <BarisSoal key={soal.kode} soal={soal} status={statusDari(soal)} isian={isianTersimpan[soal.kode]} predikat={bantuanTersimpan[soal.kode]?.predikat} disarankan={soal.kode === berikutnya?.kode}
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

interface BarisProps { soal: SoalHitung; status: StatusSoal; isian: IsianSoal | undefined; predikat: PredikatSoal | undefined; disarankan: boolean; kasusSekarang: Kasus | null; saatKerjakan: (soal: SoalHitung) => void }

function BarisSoal({ soal, status, isian, predikat, disarankan, kasusSekarang, saatKerjakan }: BarisProps) {
  const selesai = soalSelesai(status);
  const keterangan = keteranganStatus(status, isian, predikat);
  // Soal yang selesai dengan bantuan diajak diulang; jawaban yang dibuka lewat "Lihat jawaban" lama (tanpa predikat) juga.
  const layakDiulang = selesai && (predikat ? predikat !== 'mandiri' : status === 'lihatJawaban');
  return (
    <li className={['baris-soal-baru', selesai && 'selesai', status === 'terputus' && 'terputus', disarankan && 'disarankan'].filter(Boolean).join(' ')}>
      <span className={`status-soal-baru status-${status}`} role="img" aria-label={keterangan ?? t('latihan.belum_dikerjakan')}
        style={status === 'terputus' && isian ? { '--isi': `${porsiIsian(isian)}%` } as CSSProperties : undefined}>
        {status === 'benar' && <Ikon nama="benar" ukuran={16} />}
        {status === 'lihatJawaban' && <Ikon nama="mata" ukuran={16} />}
      </span>
      <div className="isi-soal">
        <b>{judulSoalTampil(soal, selesai)}</b>
        <span className="keterangan">
          <span className={`tingkat tingkat-${soal.tingkat}`}>{TEKS_TINGKAT()[soal.tingkat]}</span>
          {selesai && <> · {soal.topik}</>}
          {keterangan && <> · <span className={status === 'terputus' ? 'ket-terputus' : undefined}>{keterangan}</span></>}
          {layakDiulang && <> · <span className="penanda-ulang">{t('latihan.layak_diulang')}</span></>}
          {disarankan && <> · <span className="penanda-berikutnya">{t('latihan.soal_berikutnya_untukmu')}</span></>}
        </span>
      </div>
      <TombolBukaKasus kasusSekarang={kasusSekarang} saatBuka={() => saatKerjakan(soal)} varian={disarankan ? 'primary' : 'secondary'} kelas="tombol-baris">
        {selesai ? t('hitung.pembahasan') : status === 'terputus' ? t('hitung.lab_lanjutkan') : t('hitung.kerjakan')}
      </TombolBukaKasus>
    </li>
  );
}

function keteranganStatus(status: StatusSoal, isian: IsianSoal | undefined, predikat: PredikatSoal | undefined): string | null {
  if (status === 'terputus' && isian) return t('latihan.terputus_isian', { terisi: angka(String(hitungTerisi(isian.isian))), total: angka(String(isian.jumlahKotak)) });
  if (status !== 'benar' && status !== 'lihatJawaban') return null;
  if (predikat) return t(`latihan.keterangan_${predikat === 'dibuka' ? 'dibuka' : predikat}`);
  return status === 'benar' ? t('latihan.sudah_benar') : t('latihan.sudah_lihat_jawaban');
}
