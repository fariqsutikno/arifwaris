// Contoh jadi: blok kasus dari pelajaran dibuka di Lab sebagai layar Hasil hanya-baca (tanpa isian, tanpa tebakan).
// Menerima slug pelajaran + indeks blok dari alamat, mengambil kasusnya dari konten (bukan dari URL, jadi tidak bisa disisipi),
// lalu menyerahkannya ke Hasil. Kasus hidup hanya di memori layar ini: tidak menyentuh kasus pengguna, riwayat, atau XP.

import { useState, type ReactNode } from 'react';
import { nomorBagian, type ContohKasus } from '@waris/content';
import { kasusDariSoal } from '@waris/latihan';
import { cariPelajaran } from '../../konten/sumber';
import { rapikanKeadaan } from '../../kasus';
import type { Aksi } from '../../keadaan';
import { tautanBelajar } from '../../rute';
import { panahMundur, t } from '../../terjemah';
import { Hasil } from '../Hasil';
import { pelajaranPratinjau } from './pratinjauMateri';

export function ContohJadi({ slug, indeks }: { slug: string; indeks: number }) {
  const pelajaran = cariPelajaran(slug) ?? pelajaranPratinjau(slug);
  const blok = pelajaran?.blok[indeks];
  if (!pelajaran || blok?.jenis !== 'kasus') {
    return <main className="halaman tumpuk"><a href={tautanBelajar()}>{panahMundur()} {t('umum.belajar')}</a><p role="alert">{t('belajar.contoh_tidak_ditemukan')}</p></main>;
  }
  const bagian = nomorBagian(pelajaran.blok).filter(isi => isi.indeksBlok < indeks).at(-1)?.nomor;
  const nomorPelajaran = `${pelajaran.modul}.${pelajaran.urutan}`;
  const asal = bagian ? t('belajar.contoh_dari_pelajaran_bagian', { pelajaran: nomorPelajaran, bagian }) : t('belajar.contoh_dari_pelajaran', { pelajaran: nomorPelajaran });
  const pita = <>{asal} <a className="tautan-hero" href={tautanBelajar(slug)}>{t('belajar.kembali_ke_pelajaran')}</a></>;
  return <KasusContoh slug={slug} indeks={indeks} contoh={blok.kasus} pita={pita} />;
}

function KasusContoh({ slug, indeks, contoh, pita }: { slug: string; indeks: number; contoh: ContohKasus; pita: ReactNode }) {
  const [kasus, setKasus] = useState(() => kasusDariSoal(contoh));
  // Pembulatan boleh dimainkan di layar ini; perubahannya tidak disimpan.
  const kirim = (aksi: Aksi) => { if (aksi.jenis === 'UBAH_KASUS') setKasus(rapikanKeadaan(aksi.ubah(kasus))); };
  return <Hasil kasus={kasus} idSesi={`contoh-${slug}-${indeks}`} tujuan={null} kirim={kirim} hanyaBaca pita={pita} />;
}
