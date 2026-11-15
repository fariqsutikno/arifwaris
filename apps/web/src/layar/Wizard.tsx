// Wizard 4 langkah (Almarhum, Harta, Keluarga, Periksa), satu pertanyaan per layar. Menerima keadaan + kirim(aksi);
// menyerahkan Kasus yang sudah lengkap ke layar hasil lewat KE_LAYAR 'hasil' (atau pilihan menunggu bila ada janin).

import { useEffect, useState } from 'react';
import type { IdOrang } from '@waris/engine';
import { LANGKAH_WIZARD } from '../konten/wizard';
import type { Kasus } from '../kasus';
import { daftarAlmarhum, namaSingkat } from '../keadaanOrang';
import { gantiJenisKelaminPewaris, ubahNamaPewaris } from '../pewaris';
import { aturTahunWafat } from '../silsilah';
import { statusKeluarga } from '../statusKeluarga';
import { t } from '../terjemah';
import { TOTAL_LANGKAH, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { Pilihan } from '../ui/komponen';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
import { LangkahAhliWaris } from './LangkahAhliWaris';
import { LangkahBabak } from './LangkahBabak';
import { KanvasKeluarga } from './keluarga/KanvasKeluarga';
import { PertanyaanHamil } from './keadaan/PertanyaanHamil';
import { PertanyaanPenutup } from './keadaan/PertanyaanPenutup';
import { CeritaKasus } from './PeriksaCerita';
import { LangkahKondisi } from './LangkahKondisi';
import { LangkahHarta } from './wizard/LangkahHarta';
import { KewajibanOpsional } from './wizard/KewajibanOpsional';
import { BarBawah } from './wizard/BarBawah';
import { KerangkaLangkah } from './wizard/KerangkaLangkah';
import { NamaKasus } from './wizard/NamaKasus';
import { IsianNamaAlmarhum, LangkahPewaris } from './wizard/LangkahPewaris';
import { PanggungPohon } from './wizard/PanggungPohon';
import { Stepper } from './wizard/Stepper';
import { adaAhliWaris, alasanBabak, alasanBelumLengkap, langkahTerjauh, LANGKAH_HASIL } from './wizard/validasi';


export function Wizard({ keadaan, kirim }: { keadaan: KeadaanAplikasi; kirim: (aksi: Aksi) => void }) {
  const { kasus, langkah } = keadaan;
  // Kasus nyata memakai kanvas per bagian, tanpa babak; alur Babak hanya melayani latihan (K1 rencana 2).
  const nyata = kasus?.jenisKasus === 'nyata';
  const babak = nyata ? 0 : keadaan.babak;
  const [sedangReset, setSedangReset] = useState(false);
  const [tertahan, setTertahan] = useState(false);
  const [fokusBagian, setFokusBagian] = useState<{ id: string; kali: number }>();
  // `kali` bertambah tiap ketukan supaya ketukan berulang pada simpul yang sama tetap memicu gulir.
  const [fokusOrang, setFokusOrang] = useState<{ id: IdOrang; kali: number }>();
  const almarhum = kasus ? daftarAlmarhum(kasus) : [];
  const ubah = (fungsiUbah: (kasus: Kasus) => Kasus) => kirim({ jenis: 'UBAH_KASUS', ubah: fungsiUbah });
  const alasan = langkah === 3 && kasus && !nyata
    ? (babak === 0 && !adaAhliWaris(kasus) ? t('hitung.tambahkan_minimal_satu_ahli_waris') : alasanBabak(kasus, babak))
    : alasanBelumLengkap(kasus, langkah);
  const kanvasBelumLengkap = nyata && langkah === 3 && !!alasan;
  const subjudul = langkah === 3 && babak > 0 && kasus
    ? t('hitung.babak.subjudul', { nomor: babak + 1, total: almarhum.length, nama: namaSingkat(kasus, almarhum[babak]!) })
    : undefined;
  const saatLanjut = () => {
    if (langkah === 3 && !nyata && babak < almarhum.length - 1) return kirim({ jenis: 'KE_BABAK', babak: babak + 1 });
    // Janin belum lahir: pilihan menunggu dulu ([R13-17]), kecuali sudah dipilih.
    if (langkah === TOTAL_LANGKAH) return kirim({ jenis: 'KE_LAYAR', layar: kasus && adaJaninBelumLahir(kasus) && !kasus.pilihanJanin ? 'cerita' : 'hasil' });
    kirim({ jenis: 'KE_LANGKAH', langkah: langkah + 1 });
  };
  const saatKembali = () => {
    if (langkah === 3 && !nyata && babak > 0) return kirim({ jenis: 'KE_BABAK', babak: babak - 1 });
    kirim(langkah === 1 ? { jenis: 'KE_LAYAR', layar: 'awal' } : { jenis: 'KE_LANGKAH', langkah: langkah - 1 });
  };
  // Tombol lanjut tidak pernah nonaktif: bila isian kurang, klik hanya menahan dan mengumumkan alasannya; tanda hilang saat isian diubah.
  const berikut = LANGKAH_WIZARD[langkah];
  // Kanvas belum lengkap: aksi utama berupa tautan "Ke Periksa ›" (spec 5.9); diklik → tandai kekurangan dan pindah ke bagian pertama yang kurang.
  const saatKlikTertahan = () => {
    setTertahan(true);
    const pertama = kasus && nyata && langkah === 3 ? statusKeluarga(kasus).pertama : null;
    if (pertama) setFokusBagian(sebelumnya => ({ id: pertama.id, kali: (sebelumnya?.kali ?? 0) + 1 }));
  };
  const aksiLanjut = {
    label: kanvasBelumLengkap ? t('hitung.kanvas.ke_periksa') : berikut ? t('hitung.lanjut_nama', { nama: berikut.nama }) : t('hitung.lihat_hasil'),
    sebagai: kanvasBelumLengkap ? 'tautan' as const : 'tombol' as const,
    saatKlik: () => (alasan ? saatKlikTertahan() : saatLanjut()),
  };
  const statusBar = tertahan ? alasan : kanvasBelumLengkap && kasus ? statusKeluarga(kasus).status : nyata && langkah === 3 ? t('hitung.kanvas.status_lengkap') : null;
  useEffect(() => setTertahan(false), [kasus, langkah, babak]);
  // Kanvas mengurus fokusnya sendiri (pindah bagian dulu, baru fokus ke baris yang kurang).
  useEffect(() => { if (tertahan && !kanvasBelumLengkap) document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); }, [tertahan]);
  // Penanda halaman: latar krem dan navbar menyatu dengan hero gelap (CSS body.layar-beranda), sama dengan Awal Lab.
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  const stepper = (
    <Stepper langkahAktif={langkah} terjauh={langkahTerjauh(kasus)}
      saatPilih={tujuan => kirim(tujuan === LANGKAH_HASIL ? { jenis: 'KE_LAYAR', layar: 'hasil' } : { jenis: 'KE_LANGKAH', langkah: tujuan })} />
  );
  return (
    <main className="halaman-beranda halaman-wizard">
      <KerangkaLangkah langkah={langkah} subjudul={subjudul} stepper={stepper} saatReset={() => setSedangReset(true)} ringkasan={<PanggungPohon kasus={kasus} maksPerBaris={3}
        {...(langkah === 3 ? (nyata ? { saatPilihOrang: (id: IdOrang) => setFokusOrang(sebelumnya => ({ id, kali: (sebelumnya?.kali ?? 0) + 1 })) } : { ubah }) : {})} />}>
        {langkah === 1 && <LangkahPewaris kasus={kasus} saatPilih={jenisKelamin => kirim({ jenis: 'PILIH_PEWARIS', jenisKelamin })}
          saatGantiDanKosongkan={jenisKelamin => ubah(k => gantiJenisKelaminPewaris(k, jenisKelamin))}
          saatUbahNama={nama => ubah(k => ubahNamaPewaris(k, nama))}
          saatUbahTahun={tahun => ubah(k => aturTahunWafat(k, k.graf.idPewaris, tahun))}
          saatPilihPintu={pintu => ubah(k => ({ ...k, pintu }))} />}
        {kasus && langkah === 2 && <><LangkahHarta kasus={kasus} ubah={ubah} /><KewajibanOpsional kasus={kasus} ubah={ubah} /></>}
        {kasus && langkah === 3 && nyata && <KanvasKeluarga kasus={kasus} ubah={ubah} tandaiKurang={tertahan}
          {...(fokusBagian ? { fokusBagian } : {})} {...(fokusOrang ? { fokusOrang } : {})} saatSelesai={saatLanjut} />}
        {kasus && langkah === 3 && !nyata && babak === 0 && <>
          <IsianNamaAlmarhum nama={kasus.graf.orang[kasus.graf.idPewaris]?.nama ?? ''} saatUbah={nama => ubah(k => ubahNamaPewaris(k, nama))} />
          <p className="keterangan">{t('hitung.penutup.masukkan_yang_wafat', { mayit: namaSingkat(kasus, kasus.graf.idPewaris) })}</p>
          <p className="catatan-info">{t('hitung.keluarga_beri_nama_jelas')}</p>
          <LangkahAhliWaris graf={kasus.graf} idMayit={kasus.graf.idPewaris} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />
          <PertanyaanPenutup kasus={kasus} idMayit={kasus.graf.idPewaris} ubah={ubah} />
          <PertanyaanHamil kasus={kasus} idMayit={kasus.graf.idPewaris} ubah={ubah} />
        </>}
        {kasus && langkah === 3 && !nyata && babak > 0 && <LangkahBabak kasus={kasus} babak={babak} ubah={ubah} />}
        {kasus && langkah === 4 && <>
          <CeritaKasus kasus={kasus} kirim={kirim} />
          {!nyata && <>
            <h2 id="tanya-kondisi" className="judul-bagian-kecil">{t('hitung.kondisi_tanya_baru')}</h2>
            <LangkahKondisi kasus={kasus} ubah={ubah} labelId="tanya-kondisi" />
          </>}
          <NamaKasus kasus={kasus} ubah={ubah} />
        </>}
      </KerangkaLangkah>
      {sedangReset && kasus && (
        <KonfirmasiKasusBaru kasus={kasus} judul={t('umum.reset_skenario')} labelLanjut={t('umum.reset')} saatBatal={() => setSedangReset(false)}
          saatLanjut={() => { setSedangReset(false); kirim({ jenis: 'ULANGI' }); }} />
      )}
      <BarBawah saatKembali={saatKembali} status={statusBar} aksi={aksiLanjut} />
    </main>
  );
}

const adaJaninBelumLahir = (kasus: Kasus): boolean => Object.values(kasus.graf.orang).some(orang => orang.statusHidup === 'dalamKandungan');
