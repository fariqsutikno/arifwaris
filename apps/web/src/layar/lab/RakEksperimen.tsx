// Rak Eksperimen: kasus bernama yang disimpan pengguna (tersimpan.ts, ikut sinkron ke akun), yang disematkan di depan.
// Berkas berwarna yang saling menumpuk sedikit dan agak miring seperti tumpukan di meja; disentuh, ia terangkat dan lurus.
// Tiap berkas: pohon mini, nama, ringkasan, tombol Buka, dan aksi teks (sematkan, ganti nama, hapus). Tanpa kasus tersimpan tidak dirender.

import { useState } from 'react';
import { urutRak } from '../../lab';
import type { Kasus } from '../../kasus';
import { ringkasKasus, type EntriRiwayat } from '../../riwayat';
import { bacaTersimpan, hapusTersimpan, sematkan, ubahJudul } from '../../tersimpan';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { Ikon } from '../../ui/Ikon';
import { TombolBukaKasus } from '../belajar/TombolBukaKasus';
import { DialogNama } from './DialogNama';
import { PohonSusunan } from './PohonSusunan';
import { keJson } from '../../kasus';
import { t } from '../../terjemah';

const SKALA_KARTU = 0.55;
type Baris = ReturnType<typeof bacaTersimpan>[number];

export function RakEksperimen({ kasusSekarang, saatBuka }: { kasusSekarang: Kasus | null; saatBuka: (entri: EntriRiwayat) => void }) {
  const [daftar, setDaftar] = useState(bacaTersimpan);
  const [diganti, setDiganti] = useState<Baris | null>(null);
  const [dihapus, setDihapus] = useState<Baris | null>(null);
  const segarkan = () => setDaftar(bacaTersimpan());
  if (daftar.length === 0) return null;
  return (
    <section className="bagian-lab" aria-labelledby="judul-lab-rak">
      <h2 id="judul-lab-rak" className="judul-bagian">{t('hitung.lab_rak')}</h2>
      <p className="keterangan">{t('hitung.lab_rak_ket')}</p>
      <ul className="daftar-polos lab-rak-daftar">
        {urutRak(daftar).map((baris, urutan) => {
          const ringkasan = ringkasKasus(baris.kasus);
          return (
            <li key={baris.id} className={baris.disematkan ? 'lab-berkas tersemat' : 'lab-berkas'} style={{ ['--urut' as string]: urutan }}>
              {baris.disematkan && <span className="lab-semat">{t('hitung.lab_disematkan')}</span>}
              <PohonSusunan kasus={baris.kasus} skalaMaks={SKALA_KARTU} />
              <h3>{baris.judul}</h3>
              <p className="keterangan">{ringkasan.judul} · {ringkasan.keterangan}</p>
              <div className="lab-berkas-aksi">
                <TombolBukaKasus kasusSekarang={kasusSekarang && keJson(kasusSekarang) !== keJson(baris.kasus) ? kasusSekarang : null}
                  saatBuka={() => saatBuka({ id: baris.id, waktu: Date.parse(baris.disimpanPada), sumber: { jenis: 'sendiri' }, kasus: baris.kasus, ...ringkasan })}>
                  {ringkasan.lengkap ? t('hitung.buka') : t('hitung.lanjut')}
                </TombolBukaKasus>
                <button type="button" className="tautan-aksi" aria-label={`${baris.disematkan ? t('hitung.lab_lepas_sematan') : t('hitung.lab_sematkan')} ${baris.judul}`}
                  onClick={() => { sematkan(baris.id, !baris.disematkan); segarkan(); }}>
                  {baris.disematkan ? t('hitung.lab_lepas_sematan') : t('hitung.lab_sematkan')}
                </button>
                <button type="button" className="tautan-aksi" aria-label={`${t('hitung.lab_ganti_nama')} ${baris.judul}`} onClick={() => setDiganti(baris)}>{t('hitung.lab_ganti_nama')}</button>
                <button type="button" className="tautan-aksi" aria-label={t('hitung.hapus_judul', { judul: baris.judul })} title={t('umum.hapus')} onClick={() => setDihapus(baris)}><Ikon nama="sampah" ukuran={16} /></button>
              </div>
            </li>
          );
        })}
      </ul>
      {diganti && <DialogNama judulAwal={diganti.judul} saatBatal={() => setDiganti(null)} saatSimpan={nama => { ubahJudul(diganti.id, nama); setDiganti(null); segarkan(); }} />}
      {dihapus && (
        <DialogKonfirmasi judul={t('hitung.hapus_kasus_ini')} labelLanjut={t('umum.hapus')} saatBatal={() => setDihapus(null)}
          saatLanjut={() => { hapusTersimpan(dihapus.id); setDihapus(null); segarkan(); }}>
          <p>{`"${dihapus.judul}"`} {t('hitung.akan_dihapus_dari_perangkat_ini_dan')}</p>
        </DialogKonfirmasi>
      )}
    </section>
  );
}
