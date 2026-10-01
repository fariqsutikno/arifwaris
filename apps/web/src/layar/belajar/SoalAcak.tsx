// Panel "Soal acak" di hero Latihan: pilih bab dan tingkat (multi-pilih lewat dropdown), lalu acak. Soal yang keluar
// tampil sebagai pratinjau (judul, tingkat) dengan Kerjakan atau Acak lagi, supaya soal yang tidak cocok tidak perlu
// dibuka dulu di kalkulator. Pilihan terakhir diingat di perangkat.

import { useState } from 'react';
import type { SoalHitung, Tingkat } from '@waris/content';
import { daftarSoalHitung } from '../../konten/sumber';
import type { Kasus } from '../../kasus';
import { bacaPilihan, simpanPilihan } from '../../preferensi';
import { bacaProgresLatihan } from '../../progres';
import { Ikon } from '../../ui/Ikon';
import { angka, t } from '../../terjemah';
import { TEKS_TINGKAT } from '../AwalHitung';
import { DropdownCentang } from './DropdownCentang';
import { judulTopik, perBab } from './KuisKonsep';
import { kandidatAcak, pilihAcak, type SaringanAcak } from './soalAcak';
import { TombolBukaKasus } from './TombolBukaKasus';

const KUNCI_SARINGAN = 'saringan-soal-acak';
const SEMUA_TINGKAT: Tingkat[] = ['dasar', 'menengah', 'sulit'];

interface Props { kasusSekarang: Kasus | null; saatKerjakan: (soal: SoalHitung) => void }

export function SoalAcak({ kasusSekarang, saatKerjakan }: Props) {
  const daftarBab = perBab(daftarSoalHitung()).map(([bab]) => bab);
  const [saringan, setSaringan] = useState<SaringanAcak>(() => bacaSaringan(daftarBab));
  const [terpilih, setTerpilih] = useState<SoalHitung>();
  const selesai = bacaProgresLatihan('hitung');
  const kandidat = kandidatAcak(daftarSoalHitung(), kode => !!selesai[kode], saringan);

  const ubah = (baru: SaringanAcak) => { setSaringan(baru); setTerpilih(undefined); simpanSaringan(baru); };
  const acak = () => setTerpilih(pilihAcak(kandidat.soal, terpilih?.kode));

  return (
    <section className="panel-acak" aria-labelledby="judul-acak">
      <h2 id="judul-acak"><Ikon nama="acak" ukuran={20} />{t('latihan.soal_acak')}</h2>
      <div className="pilihan-acak">
        <DropdownCentang label={t('latihan.bab')} terpilih={new Set([...saringan.bab].map(String))}
          opsi={daftarBab.map(bab => ({ nilai: String(bab), teks: judulTopik(bab) }))}
          ringkasan={ringkasanBab(saringan.bab, daftarBab)} saatUbah={baru => ubah({ ...saringan, bab: new Set([...baru].map(Number)) })} />
        <DropdownCentang label={t('latihan.tingkat')} terpilih={saringan.tingkat}
          opsi={SEMUA_TINGKAT.map(tingkat => ({ nilai: tingkat, teks: TEKS_TINGKAT()[tingkat] }))}
          ringkasan={ringkasanTingkat(saringan.tingkat)} saatUbah={baru => ubah({ ...saringan, tingkat: baru as Set<Tingkat> })} />
      </div>
      <label className="centang-utamakan">
        <input type="checkbox" checked={saringan.utamakanBelum} onChange={kejadian => ubah({ ...saringan, utamakanBelum: kejadian.target.checked })} />
        <span className="kotak-centang" aria-hidden="true"><Ikon nama="benar" ukuran={14} /></span>
        <span>{t('latihan.utamakan_yang_belum_dikerjakan')}</span>
      </label>
      <p className="jumlah-tersedia" aria-live="polite">
        {kandidat.soal.length === 0
          ? (saringan.bab.size === 0 || saringan.tingkat.size === 0 ? t('latihan.pilih_minimal_satu_bab_dan_tingkat') : t('latihan.tidak_ada_soal_yang_cocok'))
          : kandidat.jatuhKeSelesai ? t('latihan.semua_soal_di_pilihan_ini_sudah_selesai_jumlah', { jumlah: angka(String(kandidat.soal.length)) })
            : t('latihan.jumlah_soal_tersedia', { jumlah: angka(String(kandidat.soal.length)) })}
      </p>
      {terpilih ? (
        <div className="pratinjau-acak" aria-live="polite">
          <div>
            <b>{terpilih.judul}</b>
            <span className="keterangan"><span className={`tingkat tingkat-${terpilih.tingkat}`}>{TEKS_TINGKAT()[terpilih.tingkat]}</span> · {judulTopik(terpilih.bab)}</span>
          </div>
          <div className="aksi-acak">
            <TombolBukaKasus kasusSekarang={kasusSekarang} saatBuka={() => saatKerjakan(terpilih)} varian="primary" kelas="tombol-terang">{t('hitung.kerjakan')}</TombolBukaKasus>
            <button type="button" className="tautan-terang" onClick={acak} disabled={kandidat.soal.length < 2}>{t('latihan.acak_lagi')}</button>
          </div>
        </div>
      ) : (
        <button type="button" className="aw-btn aw-btn-sm tombol-terang" disabled={kandidat.soal.length === 0} onClick={acak}>{t('latihan.acak_soal')}</button>
      )}
    </section>
  );
}

function ringkasanBab(terpilih: ReadonlySet<number>, semua: number[]): string {
  if (terpilih.size === 0) return t('latihan.belum_ada_yang_dipilih');
  if (terpilih.size === semua.length) return t('latihan.semua_bab');
  return terpilih.size === 1 ? judulTopik([...terpilih][0]!) : t('latihan.jumlah_bab_dipilih', { jumlah: angka(String(terpilih.size)) });
}

function ringkasanTingkat(terpilih: ReadonlySet<Tingkat>): string {
  if (terpilih.size === 0) return t('latihan.belum_ada_yang_dipilih');
  if (terpilih.size === SEMUA_TINGKAT.length) return t('latihan.semua_tingkat');
  return SEMUA_TINGKAT.filter(tingkat => terpilih.has(tingkat)).map(tingkat => TEKS_TINGKAT()[tingkat]).join(', ');
}

/** Pilihan tersimpan disaring ke bab yang masih ada; tanpa simpanan = semua dipilih. */
function bacaSaringan(daftarBab: number[]): SaringanAcak {
  const semua: SaringanAcak = { bab: new Set(daftarBab), tingkat: new Set(SEMUA_TINGKAT), utamakanBelum: true };
  try {
    const mentah = bacaPilihan(KUNCI_SARINGAN);
    if (!mentah) return semua;
    const nilai = JSON.parse(mentah) as { bab?: number[]; tingkat?: string[]; utamakanBelum?: boolean };
    return {
      bab: new Set((nilai.bab ?? []).filter(bab => daftarBab.includes(bab))),
      tingkat: new Set(SEMUA_TINGKAT.filter(tingkat => nilai.tingkat?.includes(tingkat))),
      utamakanBelum: nilai.utamakanBelum ?? true,
    };
  } catch {
    return semua;
  }
}

const simpanSaringan = (saringan: SaringanAcak) =>
  simpanPilihan(KUNCI_SARINGAN, JSON.stringify({ bab: [...saringan.bab], tingkat: [...saringan.tingkat], utamakanBelum: saringan.utamakanBelum }));
