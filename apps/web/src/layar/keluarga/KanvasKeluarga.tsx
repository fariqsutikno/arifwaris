// Kanvas wawancara keluarga (spec kanvas 5.1, 5.5), hanya untuk kasus nyata. Menerima Kasus + ubah(); menyerahkan Kasus
// yang diisi per bagian. Satu kartu aktif; bagian selesai menjadi ringkasan; bagian yang belum dicapai tidak dirender.
// Bagian tidak pindah sendiri: hanya lewat "Lanjut: …" di kaki kartu atau "Ubah" pada ringkasan.

import { useEffect, useRef, useState } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { namaSingkat } from '../../keadaanOrang';
import { dampakAdaKeTidak, jawabAdaTidak, tambahBaris } from '../../isianBagian';
import { anggotaBagian, awalCabang, bagianDijawab, bagianDilewati, bagianLengkap, daftarBagian, type Bagian, type BagianDilewati } from '../../kelompok';
import { judulBagian, judulPendek, pertanyaanBagian, ringkasanBagian } from '../../ringkasanBagian';
import { t } from '../../terjemah';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { Ikon } from '../../ui/Ikon';
import { BagianKeluarga } from './BagianKeluarga';
import { gulirKe } from './gulir';
import { KenapaTidakDitanya } from './KenapaTidakDitanya';
import { KartuBagian } from './KartuBagian';
import { PetaBagian } from './PetaBagian';

interface Props {
  kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void;
  /** true setelah aksi utama diklik saat ada yang kurang. */
  tandaiKurang: boolean;
  /** Memindahkan kartu aktif ke bagian itu (aksi utama di bar bawah diklik terlalu dini); `kali` bertambah tiap permintaan. */
  fokusBagian?: { id: string; kali: number };
  /** Simpul pohon diketuk: buka bagian yang memuat orang itu, lalu gulir dan sorot barisnya. */
  fokusOrang?: { id: IdOrang; kali: number };
  saatSelesai: () => void;
}

/** Bagian yang dijawab Ya/Tidak di kartunya; bagian lain punya pertanyaan sendiri (Tugas 8 dan 9). */
const BAGIAN_YA_TIDAK = ['pasangan', 'anak', 'saudara', 'jauh'];

/** Bagian saudara/jauh/kakek-nenek yang ditambahkan pengguna lewat "Tetap isi kerabat lain"; `setelah` = pemilik yang kelompoknya dilewati. */
interface Tambahan { bagian: Bagian; setelah: IdOrang }

export function KanvasKeluarga({ kasus, ubah, tandaiKurang, fokusBagian, fokusOrang, saatSelesai }: Props) {
  // ponytail: "Tetap isi" hilang bila halaman dimuat ulang sebelum bagiannya terisi (K3 rencana 2); data yang sudah diisi tetap ada.
  const [tambahan, setTambahan] = useState<Tambahan[]>([]);
  const daftar = gabungTambahan(daftarBagian(kasus), tambahan);
  const pertamaBelumLengkap = () => daftar.find(bagian => !bagianLengkap(kasus, bagian)) ?? daftar[daftar.length - 1]!;
  const [aktifId, setAktifId] = useState(() => pertamaBelumLengkap().id);
  const [dikunjungi, setDikunjungi] = useState(() => new Set(daftar.slice(0, daftar.findIndex(bagian => bagian.id === aktifId)).map(bagian => bagian.id)));
  const [yaSementara, setYaSementara] = useState<ReadonlySet<string>>(new Set());
  const [tandaiLokal, setTandaiLokal] = useState(false);
  const [konfirmasiTidak, setKonfirmasiTidak] = useState<Bagian | null>(null);
  const [animasiMasuk, setAnimasiMasuk] = useState(false);
  const [disorot, setDisorot] = useState<IdOrang | null>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const sudahBerganti = useRef(false);

  const aktif = daftar.find(bagian => bagian.id === aktifId) ?? pertamaBelumLengkap();
  const lengkap = bagianLengkap(kasus, aktif);
  const berikutnya = daftar.slice(daftar.indexOf(aktif) + 1).find(bagian => !bagianLengkap(kasus, bagian))
    ?? daftar.find(bagian => bagian.id !== aktif.id && !bagianLengkap(kasus, bagian));

  useEffect(() => setTandaiLokal(false), [kasus]);
  // Fokus ke baris yang ditandai kurang bila ada, selain itu ke judul kartu.
  const fokusKartu = () => {
    const sasaran = document.querySelector<HTMLElement>('.grup [aria-invalid="true"]') ?? judulRef.current;
    sasaran?.focus();
    gulirKe(sasaran);
  };
  useEffect(() => {
    if (sudahBerganti.current) fokusKartu();
  }, [aktif.id]);
  useEffect(() => {
    if (!fokusBagian) return;
    if (fokusBagian.id === aktif.id || !daftar.some(bagian => bagian.id === fokusBagian.id)) fokusKartu(); else pindahKe(fokusBagian.id);
  }, [fokusBagian?.kali]);
  useEffect(() => {
    if (!fokusOrang) return;
    const bagian = daftar.find(satu => satu.jenis !== 'anakBersama' && anggotaBagian(kasus, satu).includes(fokusOrang.id));
    if (!bagian) return;
    setDisorot(fokusOrang.id);
    if (bagian.id !== aktif.id) pindahKe(bagian.id);
  }, [fokusOrang?.kali]);
  // Dijalankan sesudah efek fokus kartu, jadi barisnya yang akhirnya memegang fokus.
  useEffect(() => {
    if (!disorot) return;
    const baris = document.getElementById(`baris-${disorot}`);
    baris?.focus();
    gulirKe(baris);
  }, [disorot, aktif.id, fokusOrang?.kali]);

  const pindahKe = (id: string) => {
    sudahBerganti.current = true;
    setDikunjungi(sebelumnya => new Set([...sebelumnya, aktif.id]));
    setAktifId(id);
    setAnimasiMasuk(true);
    setTandaiLokal(false);
  };
  const lanjut = () => {
    if (!lengkap) {
      setTandaiLokal(true);
      return gulirKe(document.querySelector('[aria-invalid="true"]') ?? judulRef.current);
    }
    if (berikutnya) pindahKe(berikutnya.id); else saatSelesai();
  };
  const jawabYa = (bagian: Bagian) => {
    setYaSementara(sebelumnya => new Set([...sebelumnya, bagian.id]));
    // Perempuan hanya punya satu suami: barisnya langsung dibuat, tanpa penghitung.
    const satuSuami = bagian.jenis === 'pasangan' && kasus.graf.orang[bagian.milik]?.jenisKelamin === 'P' && anggotaBagian(kasus, bagian).length === 0;
    ubah(k => (satuSuami ? tambahBaris(k, bagian, 'SUAMI') : jawabAdaTidak(k, bagian, true)));
  };
  const tetapIsi = (dilewati: BagianDilewati) => {
    // Bagian anak dari almarhum diturunkan dari Kasus (anggota atau jawaban), jadi cukup satu baris kosong yang membukanya.
    if (dilewati.jenis === 'anakDariWafat') return ubah(k => tambahBaris(k, { id: `anak:${dilewati.sebab}`, milik: dilewati.sebab!, jenis: 'anak' }, 'ANAK_LK'));
    const bagian = bagianTambahan(dilewati);
    setTambahan(sebelumnya => (sebelumnya.some(satu => satu.bagian.id === bagian.id) ? sebelumnya : [...sebelumnya, { bagian, setelah: dilewati.milik }]));
  };
  const jawabTidak = (bagian: Bagian) => {
    setYaSementara(sebelumnya => new Set([...sebelumnya].filter(id => id !== bagian.id)));
    ubah(k => jawabAdaTidak(k, bagian, false));
  };
  const saatPilihTidak = (bagian: Bagian) => (dampakAdaKeTidak(kasus, bagian).length > 0 ? setKonfirmasiTidak(bagian) : jawabTidak(bagian));

  const adalahYaTidak = BAGIAN_YA_TIDAK.includes(aktif.jenis);
  const ya = !adalahYaTidak || anggotaBagian(kasus, aktif).length > 0 || yaSementara.has(aktif.id);
  const selesai = daftar.filter(bagian => bagian.id !== aktif.id && dikunjungi.has(bagian.id) && bagianLengkap(kasus, bagian));
  return (
    <div className="kanvas-keluarga">
      <PetaBagian kasus={kasus} daftar={daftar} aktifId={aktif.id} />
      {selesai.length > 0 && (
        <ul className="ringkasan-bagian" aria-label={t('hitung.kanvas.ringkasan_label')}>
          {selesai.map(bagian => (
            <li key={bagian.id} className="ringkas">
              <span className="cek"><Ikon nama="benar" ukuran={15} /></span>
              <div className="isi"><b>{judulBagian(kasus, bagian)}</b><span>{ringkasanBagian(kasus, bagian)}</span></div>
              <button type="button" className="aksi-teks" aria-label={t('hitung.kanvas.ubah_label', { judul: judulBagian(kasus, bagian) })}
                onClick={() => pindahKe(bagian.id)}><Ikon nama="pensil" ukuran={15} />{t('hitung.kanvas.ubah')}</button>
            </li>
          ))}
        </ul>
      )}
      <KartuBagian key={aktif.id} label={judulBagian(kasus, aktif)} pertanyaan={pertanyaanBagian(kasus, aktif)} masuk={animasiMasuk}
        pengantar={awalCabang(kasus, aktif) ? t('hitung.kanvas.pengantar_cabang', { almarhum: namaSingkat(kasus, aktif.milik), pewaris: namaSingkat(kasus, kasus.graf.idPewaris) }) : undefined}
        judulRef={judulRef} lengkap={lengkap} tandai={tandaiLokal || (tandaiKurang && !lengkap)}
        labelLanjut={berikutnya ? t('hitung.kanvas.lanjut_ke', { bagian: judulPendek(kasus, berikutnya) }) : t('hitung.kanvas.selesai_ke_periksa')}
        saatLanjut={lanjut}>
        {adalahYaTidak && (
          <YaTidak ya={ya} tidak={anggotaBagian(kasus, aktif).length === 0 && bagianDijawab(kasus, aktif)}
            saatYa={() => jawabYa(aktif)} saatTidak={() => saatPilihTidak(aktif)} />
        )}
        <BagianKeluarga kasus={kasus} bagian={aktif} ubah={ubah} ya={ya} disorot={disorot} tandaiKurang={tandaiLokal || (tandaiKurang && !lengkap)} />
        {aktif.jenis === 'anak' && bagianDilewati(kasus).filter(satu => satu.milik === aktif.milik).map(satu => (
          <KenapaTidakDitanya key={`${satu.jenis}:${satu.sebab ?? ''}`} dilewati={satu} kasus={kasus}
            sudahTetapIsi={satu.jenis !== 'anakDariWafat' && tambahan.some(lain => lain.bagian.id === bagianTambahan(satu).id)} saatTetapIsi={() => tetapIsi(satu)}
            ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />
        ))}
      </KartuBagian>
      {konfirmasiTidak && (
        <DialogKonfirmasi judul={t('hitung.kanvas.konfirmasi_tidak_judul')} labelLanjut={t('hitung.kanvas.konfirmasi_tidak_lanjut')}
          saatBatal={() => setKonfirmasiTidak(null)}
          saatLanjut={() => { jawabTidak(konfirmasiTidak); setKonfirmasiTidak(null); }}>
          <p>{t('hitung.kanvas.konfirmasi_tidak_isi', { nama: dampakAdaKeTidak(kasus, konfirmasiTidak).map(id => namaSingkat(kasus, id)).join(', ') })}</p>
        </DialogKonfirmasi>
      )}
    </div>
  );
}

/** Tanpa jawaban bawaan: keduanya tidak terpilih sampai pengguna memilih. */
function YaTidak({ ya, tidak, saatYa, saatTidak }: { ya: boolean; tidak: boolean; saatYa: () => void; saatTidak: () => void }) {
  return (
    <div className="ya-tidak" role="radiogroup" aria-labelledby="judul-bagian-aktif">
      <button type="button" role="radio" aria-checked={ya} onClick={saatYa}>{t('hitung.kanvas.ya')}</button>
      <button type="button" role="radio" aria-checked={tidak} onClick={saatTidak}>{t('hitung.kanvas.tidak')}</button>
    </div>
  );
}

const bagianTambahan = (dilewati: BagianDilewati): Bagian =>
  ({ id: `${dilewati.jenis}:${dilewati.milik}`, milik: dilewati.milik, jenis: dilewati.jenis as Exclude<BagianDilewati['jenis'], 'anakDariWafat'> });

/** Bagian tambahan disisipkan sesudah bagian terakhir milik orang yang kelompoknya dilewati. */
function gabungTambahan(daftar: Bagian[], tambahan: Tambahan[]): Bagian[] {
  return tambahan.reduce((hasil, { bagian, setelah }) => {
    if (hasil.some(satu => satu.id === bagian.id)) return hasil;
    const akhir = hasil.reduce((indeks, satu, urutan) => (satu.milik === setelah && satu.jenis !== 'urutan' && satu.jenis !== 'kamu' ? urutan : indeks), -1);
    return [...hasil.slice(0, akhir + 1), bagian, ...hasil.slice(akhir + 1)];
  }, daftar);
}
