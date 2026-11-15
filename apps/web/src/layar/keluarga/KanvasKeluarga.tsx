// Kanvas wawancara keluarga (spec kanvas 5.1, 5.5), hanya untuk kasus nyata. Menerima Kasus + ubah(); menyerahkan Kasus
// yang diisi per bagian. Satu kartu aktif; bagian selesai menjadi ringkasan; bagian yang belum dicapai tidak dirender.
// Bagian tidak pindah sendiri: hanya lewat "Lanjut: …" di kaki kartu atau "Ubah" pada ringkasan.

import { useEffect, useRef, useState } from 'react';
import type { Kasus } from '../../kasus';
import { pengantarCabang } from '../../konten/kanvasDraf';
import { namaSingkat } from '../../keadaanOrang';
import { dampakAdaKeTidak, jawabAdaTidak } from '../../isianBagian';
import { anggotaBagian, awalCabang, bagianDijawab, bagianLengkap, daftarBagian, type Bagian } from '../../kelompok';
import { judulBagian, judulPendek, pertanyaanBagian, ringkasanBagian } from '../../ringkasanBagian';
import { t } from '../../terjemah';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { Ikon } from '../../ui/Ikon';
import { gulirKe } from './gulir';
import { KartuBagian } from './KartuBagian';
import { PetaBagian } from './PetaBagian';

interface Props {
  kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void;
  /** true setelah aksi utama diklik saat ada yang kurang. */
  tandaiKurang: boolean;
  saatSelesai: () => void;
}

/** Bagian yang dijawab Ya/Tidak di kartunya; bagian lain punya pertanyaan sendiri (Tugas 8 dan 9). */
const BAGIAN_YA_TIDAK = ['pasangan', 'anak', 'saudara', 'jauh'];

export function KanvasKeluarga({ kasus, ubah, tandaiKurang, saatSelesai }: Props) {
  const daftar = daftarBagian(kasus);
  const pertamaBelumLengkap = () => daftar.find(bagian => !bagianLengkap(kasus, bagian)) ?? daftar[daftar.length - 1]!;
  const [aktifId, setAktifId] = useState(() => pertamaBelumLengkap().id);
  const [dikunjungi, setDikunjungi] = useState(() => new Set(daftar.slice(0, daftar.findIndex(bagian => bagian.id === aktifId)).map(bagian => bagian.id)));
  const [yaSementara, setYaSementara] = useState<ReadonlySet<string>>(new Set());
  const [tandaiLokal, setTandaiLokal] = useState(false);
  const [konfirmasiTidak, setKonfirmasiTidak] = useState<Bagian | null>(null);
  const [animasiMasuk, setAnimasiMasuk] = useState(false);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const sudahBerganti = useRef(false);

  const aktif = daftar.find(bagian => bagian.id === aktifId) ?? pertamaBelumLengkap();
  const lengkap = bagianLengkap(kasus, aktif);
  const berikutnya = daftar.slice(daftar.indexOf(aktif) + 1).find(bagian => !bagianLengkap(kasus, bagian))
    ?? daftar.find(bagian => bagian.id !== aktif.id && !bagianLengkap(kasus, bagian));

  useEffect(() => setTandaiLokal(false), [kasus]);
  useEffect(() => {
    if (!sudahBerganti.current) return;
    judulRef.current?.focus();
    gulirKe(judulRef.current);
  }, [aktif.id]);

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
    ubah(k => jawabAdaTidak(k, bagian, true));
  };
  const jawabTidak = (bagian: Bagian) => {
    setYaSementara(sebelumnya => new Set([...sebelumnya].filter(id => id !== bagian.id)));
    ubah(k => jawabAdaTidak(k, bagian, false));
  };
  const saatPilihTidak = (bagian: Bagian) => (dampakAdaKeTidak(kasus, bagian).length > 0 ? setKonfirmasiTidak(bagian) : jawabTidak(bagian));

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
        pengantar={awalCabang(kasus, aktif) ? pengantarCabang(namaSingkat(kasus, aktif.milik), namaSingkat(kasus, kasus.graf.idPewaris)) : undefined}
        judulRef={judulRef} lengkap={lengkap} tandai={tandaiLokal || (tandaiKurang && !lengkap)}
        labelLanjut={berikutnya ? t('hitung.kanvas.lanjut_ke', { bagian: judulPendek(kasus, berikutnya) }) : t('hitung.kanvas.selesai_ke_periksa')}
        saatLanjut={lanjut}>
        {BAGIAN_YA_TIDAK.includes(aktif.jenis) && (
          <YaTidak ya={anggotaBagian(kasus, aktif).length > 0 || yaSementara.has(aktif.id)}
            tidak={anggotaBagian(kasus, aktif).length === 0 && bagianDijawab(kasus, aktif)}
            saatYa={() => jawabYa(aktif)} saatTidak={() => saatPilihTidak(aktif)} />
        )}
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
