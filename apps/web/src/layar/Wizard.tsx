// Wizard 4 langkah (Almarhum, Harta, Keluarga, Periksa), satu pertanyaan per layar. Menerima keadaan + kirim(aksi);
// menyerahkan Kasus yang sudah lengkap ke layar hasil lewat KE_LAYAR 'hasil' (atau pilihan menunggu bila ada janin).

import { useEffect, useState } from 'react';
import type { IdOrang } from '@waris/engine';
import { LANGKAH_WIZARD } from '../konten/wizard';
import type { Kasus } from '../kasus';
import { mayitTanpaAhliWaris } from '../latihan';
import { gantiJenisKelaminPewaris, ubahNamaPewaris } from '../pewaris';
import { aturTahunWafat } from '../silsilah';
import { bagianDariOrang } from '../kelompok';
import { statusPeriksa } from '../statusPeriksa';
import { statusKeluarga } from '../statusKeluarga';
import { geraknyaDikurangi } from '../tampilan';
import { t } from '../terjemah';
import { TOTAL_LANGKAH, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { Pilihan } from '../ui/komponen';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
import { KanvasKeluarga } from './keluarga/KanvasKeluarga';
import { LatihanAhliWaris } from './latihan/LatihanAhliWaris';
import { RingkasanLatihan } from './latihan/RingkasanLatihan';
import { BelumPasti } from './periksa/BelumPasti';
import { gulirKe } from './keluarga/gulir';
import { CeritaKasus } from './PeriksaCerita';
import { LangkahKondisi } from './LangkahKondisi';
import { LangkahHarta } from './wizard/LangkahHarta';
import { KewajibanOpsional } from './wizard/KewajibanOpsional';
import { BarBawah } from './wizard/BarBawah';
import { KerangkaLangkah } from './wizard/KerangkaLangkah';
import { NamaKasus } from './wizard/NamaKasus';
import { LangkahPewaris } from './wizard/LangkahPewaris';
import { PanggungPohon } from './wizard/PanggungPohon';
import { Stepper } from './wizard/Stepper';
import { alasanBelumLengkap, langkahTerjauh, LANGKAH_HASIL } from './wizard/validasi';


export function Wizard({ keadaan, kirim }: { keadaan: KeadaanAplikasi; kirim: (aksi: Aksi) => void }) {
  const { kasus, langkah } = keadaan;
  // Kasus nyata memakai kanvas per bagian; latihan memakai kartu per mayit (rencana 3).
  const nyata = kasus?.jenisKasus === 'nyata';
  const [sedangReset, setSedangReset] = useState(false);
  const [tertahan, setTertahan] = useState(false);
  const [fokusBagian, setFokusBagian] = useState<{ id: string; kali: number }>();
  // `kali` bertambah tiap ketukan supaya ketukan berulang pada simpul yang sama tetap memicu gulir.
  const [fokusOrang, setFokusOrang] = useState<{ id: IdOrang; kali: number }>();
  const ubah = (fungsiUbah: (kasus: Kasus) => Kasus) => kirim({ jenis: 'UBAH_KASUS', ubah: fungsiUbah });
  const alasan = alasanBelumLengkap(kasus, langkah);
  const kanvasBelumLengkap = nyata && langkah === 3 && !!alasan;
  const saatLanjut = () => {
    // Janin belum lahir: pilihan menunggu dulu ([R13-17]), kecuali sudah dipilih.
    if (langkah === TOTAL_LANGKAH) return kirim({ jenis: 'KE_LAYAR', layar: kasus && adaJaninBelumLahir(kasus) && !kasus.pilihanJanin ? 'cerita' : 'hasil' });
    kirim({ jenis: 'KE_LANGKAH', langkah: langkah + 1 });
  };
  const saatKembali = () => {
    kirim(langkah === 1 ? { jenis: 'KE_LAYAR', layar: 'awal' } : { jenis: 'KE_LANGKAH', langkah: langkah - 1 });
  };
  // Tombol lanjut tidak pernah nonaktif: bila isian kurang, klik hanya menahan dan mengumumkan alasannya; tanda hilang saat isian diubah.
  const berikut = LANGKAH_WIZARD[langkah];
  // Kanvas belum lengkap: aksi utama berupa tautan "Ke Periksa ›" (spec 5.9); diklik → tandai kekurangan dan pindah ke bagian pertama yang kurang.
  const saatKlikTertahan = () => {
    setTertahan(true);
    const pertama = kasus && nyata && langkah === 3 ? statusKeluarga(kasus).pertama : null;
    if (pertama) setFokusBagian(sebelumnya => ({ id: pertama.id, kali: (sebelumnya?.kali ?? 0) + 1 }));
    // Latihan: gulir ke kartu mayit yang belum punya ahli waris hidup.
    const kartuKurang = kasus && !nyata && langkah === 3 ? mayitTanpaAhliWaris(kasus) : null;
    if (kartuKurang) document.getElementById(`mayit-${kartuKurang}`)?.scrollIntoView({ block: 'center', behavior: geraknyaDikurangi() ? 'auto' : 'smooth' });
  };
  // Periksa nyata: aksi utama dan status menurut kelengkapan Keluarga dan hal yang belum pasti (rencana 4, P1).
  const periksa = nyata && langkah === TOTAL_LANGKAH && kasus ? statusPeriksa(kasus) : null;
  const dariPeriksa = nyata && langkah === 3 && !!keadaan.dariPeriksa;
  const lihatDiKeluarga = (idBagian?: string, fokus?: IdOrang) => kirim({ jenis: 'KE_LANGKAH', langkah: 3, dariPeriksa: true,
    ...(idBagian ? { fokusBagian: idBagian } : {}), ...(fokus ? { fokus } : {}) });
  const saatKlikPeriksa = () => {
    const aksi = periksa?.aksi;
    if (aksi?.jenis === 'keluarga') return lihatDiKeluarga(aksi.idBagian);
    if (aksi?.jenis === 'urutan') return gulirKe(document.getElementById(`belum-urutan-${aksi.a}-${aksi.b}`));
    saatLanjut();
  };
  const aksiPeriksa = !periksa ? null : {
    keluarga: { label: t('hitung.periksa.lihat_di_keluarga'), sebagai: 'tautan' as const },
    urutan: { label: t('hitung.periksa.hitung'), sebagai: 'tombol' as const },
    kemungkinan: { label: t('hitung.periksa.hitung_kemungkinan'), sebagai: 'tombol' as const },
    hitung: { label: t('hitung.periksa.hitung'), sebagai: 'tombol' as const },
  }[periksa.aksi.jenis];
  const aksiLanjut = dariPeriksa ? { label: t('hitung.periksa.kembali_ke_periksa'), sebagai: 'tombol' as const, saatKlik: () => kirim({ jenis: 'KE_LANGKAH', langkah: TOTAL_LANGKAH }) }
    : aksiPeriksa ? { ...aksiPeriksa, saatKlik: saatKlikPeriksa } : {
    label: kanvasBelumLengkap ? t('hitung.kanvas.ke_periksa') : berikut ? t('hitung.lanjut_nama', { nama: berikut.nama }) : t('hitung.lihat_hasil'),
    sebagai: kanvasBelumLengkap ? 'tautan' as const : 'tombol' as const,
    saatKlik: () => (alasan ? saatKlikTertahan() : saatLanjut()),
  };
  const statusBar = dariPeriksa ? t('hitung.periksa.sedang_dari_periksa') : periksa ? periksa.status : tertahan ? alasan : kanvasBelumLengkap && kasus ? statusKeluarga(kasus).status : nyata && langkah === 3 ? t('hitung.kanvas.status_lengkap') : null;
  useEffect(() => setTertahan(false), [kasus, langkah]);
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
      <KerangkaLangkah langkah={langkah} stepper={stepper} saatReset={() => setSedangReset(true)} ringkasan={<PanggungPohon kasus={kasus} maksPerBaris={3}
        {...(langkah === 3 ? (nyata ? { saatPilihOrang: (id: IdOrang) => setFokusOrang(sebelumnya => ({ id, kali: (sebelumnya?.kali ?? 0) + 1 })) } : { ubah }) : {})} />}>
        {langkah === 1 && <LangkahPewaris kasus={kasus} saatPilih={jenisKelamin => kirim({ jenis: 'PILIH_PEWARIS', jenisKelamin })}
          saatGantiDanKosongkan={jenisKelamin => ubah(k => gantiJenisKelaminPewaris(k, jenisKelamin))}
          saatUbahNama={nama => ubah(k => ubahNamaPewaris(k, nama))}
          saatUbahTahun={tahun => ubah(k => aturTahunWafat(k, k.graf.idPewaris, tahun))}
          saatPilihPintu={pintu => ubah(k => ({ ...k, pintu }))} />}
        {kasus && langkah === 2 && <><LangkahHarta kasus={kasus} ubah={ubah} /><KewajibanOpsional kasus={kasus} ubah={ubah} /></>}
        {kasus && langkah === 3 && nyata && <KanvasKeluarga kasus={kasus} ubah={ubah} tandaiKurang={tertahan}
          {...(fokusBagian ? { fokusBagian } : keadaan.fokusBagian ? { fokusBagian: { id: keadaan.fokusBagian, kali: 0 } } : {})}
          {...(fokusOrang ? { fokusOrang } : keadaan.fokus ? { fokusOrang: { id: keadaan.fokus, kali: 0 } } : {})} saatSelesai={saatLanjut} />}
        {kasus && langkah === 3 && !nyata && <LatihanAhliWaris kasus={kasus} ubah={ubah} {...(keadaan.fokus ? { fokus: keadaan.fokus } : {})} />}
        {kasus && langkah === 4 && <>
          {nyata && <BelumPasti kasus={kasus} ubah={ubah} saatLihatDiKeluarga={id => lihatDiKeluarga(bagianDariOrang(kasus, id)?.id, id)} />}
          {nyata ? <CeritaKasus kasus={kasus} kirim={kirim} /> : <RingkasanLatihan kasus={kasus} kirim={kirim} />}
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
