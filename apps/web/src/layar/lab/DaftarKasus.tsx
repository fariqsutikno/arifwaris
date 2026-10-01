// "Kasusmu": semua kasus pengguna dalam satu daftar (kasusmu.ts). Di Awal Lab (ringkas) hanya beberapa yang terbaru,
// berkas yang saling menumpuk miring dalam satu baris yang bisa digulir, dengan tautan ke halaman penuh. Di halaman penuh:
// kisi berkas, penyaring Semua/Tersimpan/Sementara (hanya bila dua jenis ada), kolom cari bila banyak, dan hapus semua sementara.

import { useState } from 'react';
import { BATAS_TAMPIL_CARI, cariEntri } from '../../lab';
import type { Kasus } from '../../kasus';
import { bacaKasusKu, hapusSemuaSementara } from '../../kasusmu';
import type { EntriRiwayat } from '../../riwayat';
import { tautanRiwayat } from '../../rute';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { BerkasKasus } from './BerkasKasus';
import { angka, t } from '../../terjemah';

const JUMLAH_RINGKAS = 6;
type Saring = 'semua' | 'tersimpan' | 'sementara';

interface Props { kasusSekarang: Kasus | null; saatBuka: (entri: EntriRiwayat) => void; ringkas?: boolean }

export function DaftarKasus({ kasusSekarang, saatBuka, ringkas = false }: Props) {
  const [daftar, setDaftar] = useState(() => bacaKasusKu());
  const [saring, setSaring] = useState<Saring>('semua');
  const [kata, setKata] = useState('');
  const [hapusSemua, setHapusSemua] = useState(false);
  const segarkan = () => setDaftar(bacaKasusKu());
  if (daftar.length === 0 && ringkas) return null;

  const jumlahSementara = daftar.filter(kasus => !kasus.tersimpan).length;
  const adaDuaJenis = jumlahSementara > 0 && jumlahSementara < daftar.length;
  const terpilih = daftar.filter(kasus => saring === 'semua' || (saring === 'tersimpan') === kasus.tersimpan);
  const tampil = ringkas ? daftar.slice(0, JUMLAH_RINGKAS) : cariEntri(terpilih, kata);
  const berkas = tampil.map((kasus, urutan) => (
    <li key={kasus.id} className={kasus.tersimpan ? 'lab-berkas tersimpan' : 'lab-berkas'} style={{ ['--urut' as string]: urutan }}>
      <BerkasKasus kasus={kasus} kasusSekarang={kasusSekarang} saatBuka={saatBuka} saatBerubah={segarkan} />
    </li>
  ));

  return (
    <section className="bagian-lab" aria-labelledby={ringkas ? 'judul-kasusmu' : undefined}>
      {ringkas && (
        <>
          <h2 id="judul-kasusmu" className="judul-bagian">{t('hitung.lab_kasusmu')}</h2>
          <p className="keterangan">{t('hitung.lab_kasusmu_ket')}</p>
        </>
      )}
      {!ringkas && daftar.length > 0 && (
        <div className="lab-alat">
          {adaDuaJenis && (
            <div className="lab-filter" role="group" aria-label={t('hitung.lab_kasusmu')}>
              {([['semua', t('hitung.lab_filter_semua')], ['tersimpan', t('hitung.lab_status_tersimpan')], ['sementara', t('hitung.lab_status_sementara')]] as const).map(([nilai, label]) => (
                <button key={nilai} type="button" aria-pressed={saring === nilai} onClick={() => setSaring(nilai)}>{label}</button>
              ))}
            </div>
          )}
          {daftar.length > BATAS_TAMPIL_CARI && (
            <label className="isian isian-kecil">
              <span className="sembunyi-visual">{t('hitung.lab_cari')}</span>
              <input type="search" value={kata} placeholder={t('hitung.lab_cari')} aria-label={t('hitung.lab_cari')} onChange={event => setKata(event.target.value)} />
            </label>
          )}
          {jumlahSementara > 0 && <button type="button" className="tautan-aksi" onClick={() => setHapusSemua(true)}>{t('hitung.lab_hapus_semua_sementara')}</button>}
        </div>
      )}
      {daftar.length === 0 && <p className="keterangan">{t('hitung.lab_kasusmu_kosong')}</p>}
      {daftar.length > 0 && tampil.length === 0 && <p className="keterangan">{t('hitung.lab_tidak_ketemu')}</p>}
      {berkas.length > 0 && <ul className={ringkas ? 'daftar-polos lab-rak-daftar' : 'daftar-polos lab-berkas-grid'}>{berkas}</ul>}
      {ringkas && daftar.length > JUMLAH_RINGKAS && <a className="tautan-cari" href={tautanRiwayat()}>{t('hitung.lab_lihat_semua', { jumlah: angka(String(daftar.length)) })}</a>}
      {hapusSemua && (
        <DialogKonfirmasi judul={t('hitung.lab_hapus_semua_sementara_judul')} labelLanjut={t('umum.hapus_semua')} saatBatal={() => setHapusSemua(false)}
          saatLanjut={() => { hapusSemuaSementara(); setHapusSemua(false); setSaring('semua'); segarkan(); }}>
          <p>{t('hitung.lab_hapus_semua_sementara_isi', { jumlah: angka(String(jumlahSementara)) })}</p>
        </DialogKonfirmasi>
      )}
    </section>
  );
}
