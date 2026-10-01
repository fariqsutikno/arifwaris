// Pohon keluarga interaktif di panggung langkah Keluarga: mengetuk kotak membuka menu orang (spec Tahap 4).
// Menerima Kasus + ubah; menyerahkan perubahan lewat ubah (UBAH_KASUS merapikan keadaan, jadi orang yang dihapus
// ikut dibersihkan dari urutan wafat). Menu → dialog tambah / ubah / konfirmasi hapus.

import { useRef, useState } from 'react';
import { bolehUbahJenisKelamin, type IdOrang } from '@waris/engine';
import { hapusAhliWaris, ubahNama } from '../../checklist';
import { HUBUNGAN, type KunciHubungan } from '../../hubunganPohon';
import { aksiTersedia, bolehHapus, dampakHapus } from '../../kerabatPohon';
import type { Kasus } from '../../kasus';
import { namaSingkat } from '../../keadaanOrang';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { DialogKeadaan } from '../keadaan/DialogKeadaan';
import { PohonSusunan } from '../lab/PohonSusunan';
import { DialogTambahHubungan } from './DialogTambahHubungan';
import { DialogTambahOrang } from './DialogTambahOrang';
import { MenuOrang, type AksiMenu } from './MenuOrang';
import { t } from '../../terjemah';

export interface Props { kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void; maksPerBaris?: number }

export function PohonKeluarga({ kasus, ubah, maksPerBaris }: Props) {
  const [terbuka, setTerbuka] = useState<{ id: IdOrang; jangkar: HTMLElement } | null>(null);
  const [aksiDipilih, setAksiDipilih] = useState<{ id: IdOrang; aksi: AksiMenu } | null>(null);
  const [daftarHubungan, setDaftarHubungan] = useState(false);
  const [hubungan, setHubungan] = useState<KunciHubungan | null>(null);
  // Pusat nama hubungan = orang yang terakhir diketuk; bawaannya pewaris.
  const [pusat, setPusat] = useState<IdOrang>(kasus.graf.idPewaris);
  const pemicu = useRef<HTMLElement | null>(null);
  const tutup = () => { setTerbuka(null); pemicu.current?.focus(); };
  const bukaMenu = (id: IdOrang) => {
    const kotak = document.querySelector<HTMLElement>(`.panggung-pohon [data-orang="${id}"]`);
    if (!kotak) return;
    pemicu.current = kotak;
    setPusat(id);
    setTerbuka({ id, jangkar: kotak });
  };
  const aksiUntuk = (id: IdOrang): AksiMenu[] => [
    ...aksiTersedia(kasus.graf, id),
    ...(id === kasus.graf.idPewaris ? [] : ['ubah' as const]),
    ...(bolehHapus(kasus.graf, id) ? ['hapus' as const] : []),
  ];
  const selesai = () => { setAksiDipilih(null); pemicu.current?.focus(); };
  return (
    <div className="panggung-pohon pohon-keluarga">
      <PohonSusunan kasus={kasus} skalaMaks={1} saatPilih={bukaMenu} {...(maksPerBaris ? { maksPerBaris } : {})} />
      <div className="tautan-hubungan">
        <button type="button" className="tautan-teks" aria-expanded={daftarHubungan} onClick={() => setDaftarHubungan(!daftarHubungan)}>{t('hitung.pohon.tautan_hubungan')}</button>
        {daftarHubungan && (
          <ul className="daftar-hubungan" aria-label={t('hitung.pohon.pilih_hubungan')}>
            {(Object.keys(HUBUNGAN) as KunciHubungan[]).map(kunci => (
              <li key={kunci}><button type="button" className="tautan-teks" onClick={() => { setHubungan(kunci); setDaftarHubungan(false); }}>{HUBUNGAN[kunci].label}</button></li>
            ))}
          </ul>
        )}
      </div>
      {terbuka && (
        <MenuOrang jangkar={terbuka.jangkar} aksi={aksiUntuk(terbuka.id)} judul={namaSingkat(kasus, terbuka.id)}
          saatPilih={aksi => { setAksiDipilih({ id: terbuka.id, aksi }); setTerbuka(null); }} saatTutup={tutup} />
      )}
      {aksiDipilih && aksiDipilih.aksi !== 'ubah' && aksiDipilih.aksi !== 'hapus' && (
        <DialogTambahOrang kasus={kasus} idOrang={aksiDipilih.id} aksi={aksiDipilih.aksi} saatBatal={selesai}
          saatSelesai={graf => { ubah(k => ({ ...k, graf })); selesai(); }} />
      )}
      {hubungan && (
        <DialogTambahHubungan kasus={kasus} idPusat={kasus.graf.orang[pusat] ? pusat : kasus.graf.idPewaris} hubungan={hubungan}
          saatBatal={() => setHubungan(null)} saatSelesai={graf => { ubah(k => ({ ...k, graf })); setHubungan(null); }} />
      )}
      {aksiDipilih?.aksi === 'hapus' && (
        <KonfirmasiHapus kasus={kasus} idOrang={aksiDipilih.id} saatBatal={selesai}
          saatLanjut={() => { ubah(k => ({ ...k, graf: hapusAhliWaris(k.graf, aksiDipilih.id) })); selesai(); }} />
      )}
      {aksiDipilih?.aksi === 'ubah' && (
        <DialogUbahOrang kasus={kasus} idOrang={aksiDipilih.id} saatBatal={selesai} saatSelesai={perubahan => { ubah(perubahan); selesai(); }} />
      )}
    </div>
  );
}

function KonfirmasiHapus({ kasus, idOrang, saatBatal, saatLanjut }: { kasus: Kasus; idOrang: IdOrang; saatBatal: () => void; saatLanjut: () => void }) {
  const nama = namaSingkat(kasus, idOrang);
  const { menjadiPenghubung, pasangan } = dampakHapus(kasus.graf, idOrang);
  return (
    <DialogKonfirmasi judul={t('hitung.pohon.hapus_judul', { nama })} labelLanjut={t('hitung.pohon.hapus')} labelBatal={t('hitung.pohon.batal')} saatLanjut={saatLanjut} saatBatal={saatBatal}>
      <p>{menjadiPenghubung ? t('hitung.pohon.hapus_penghubung', { nama }) : t('hitung.pohon.hapus_biasa', { nama })}</p>
      {pasangan.map(id => <p key={id}>{t('hitung.pohon.hapus_pasangan', { pasangan: namaSingkat(kasus, id) })}</p>)}
    </DialogKonfirmasi>
  );
}

/** Nama dan jenis kelamin (bila belum tercatat sebagai orang tua/pasangan); keadaan lewat DialogKeadaan yang sudah ada. */
function DialogUbahOrang({ kasus, idOrang, saatBatal, saatSelesai }: { kasus: Kasus; idOrang: IdOrang; saatBatal: () => void; saatSelesai: (f: (k: Kasus) => Kasus) => void }) {
  const orang = kasus.graf.orang[idOrang]!;
  const [nama, setNama] = useState(orang.nama ?? '');
  const [jenisKelamin, setJenisKelamin] = useState(orang.jenisKelamin);
  const [diKeadaan, setDiKeadaan] = useState(false);
  if (diKeadaan) return <DialogKeadaan kasus={kasus} idOrang={idOrang} saatSelesai={kasusBaru => saatSelesai(() => kasusBaru)} saatBatal={() => setDiKeadaan(false)} />;
  const simpan = () => saatSelesai(k => {
    const graf = ubahNama(k.graf, idOrang, nama);
    return { ...k, graf: { ...graf, orang: { ...graf.orang, [idOrang]: { ...graf.orang[idOrang]!, jenisKelamin } } } };
  });
  return (
    <DialogKonfirmasi judul={t('hitung.pohon.judul_ubah', { nama: namaSingkat(kasus, idOrang) })} labelLanjut={t('hitung.pohon.simpan')} labelBatal={t('hitung.pohon.batal')} saatLanjut={simpan} saatBatal={saatBatal}>
      <label className="isian isian-kecil">
        <span>{t('hitung.pohon.nama_orang')}</span>
        <input type="text" value={nama} onChange={e => setNama(e.target.value)} autoComplete="off" />
      </label>
      {bolehUbahJenisKelamin(kasus.graf, idOrang) && (
        <div role="radiogroup" aria-label={t('hitung.pohon.kelamin')} className="pilihan-dialog">
          <span className="label-pilihan">{t('hitung.pohon.kelamin')}</span>
          {([['L', t('hitung.pohon.laki_laki')], ['P', t('hitung.pohon.perempuan')]] as const).map(([nilai, label]) => (
            <button key={nilai} type="button" role="radio" aria-checked={jenisKelamin === nilai} className={jenisKelamin === nilai ? 'pilih-dialog terpilih' : 'pilih-dialog'} onClick={() => setJenisKelamin(nilai)}>{label}</button>
          ))}
        </div>
      )}
      {!orang.penghubung && <button type="button" className="tautan-teks" onClick={() => setDiKeadaan(true)}>{t('hitung.pohon.ubah_keadaan')}</button>}
    </DialogKonfirmasi>
  );
}
