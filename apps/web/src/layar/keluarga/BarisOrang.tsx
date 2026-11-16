// Satu baris orang di kanvas keluarga (spec kanvas 5.3): peran, nama, "Keadaannya sekarang?" (pilihan sesuai peran),
// pertanyaan lanjutan, dan Hapus. Menerima Kasus + id; semua perubahan lewat ubah() ke keadaanBaris. Aturan fikih tidak
// ada di sini. Baris yang belum lengkap menampilkan alasannya bila `tandaiKurang`, dan tanda hilang begitu isian berubah.

import { useId, useState } from 'react';
import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import { jenisDari, labelBawaan, peranDariMayit, ubahNama } from '../../checklist';
import type { Kasus } from '../../kasus';
import { LABEL_SEHARI, sebutAlmarhum } from '../../konten/ahliWaris';
import { hapusBaris, orangDenganKunci, orangYangHilang } from '../../isianBagian';
import {
  alasanBarisKurang, alasanWafatSesudahDitolak, jawabLanjutan, keadaanTerpilih, lanjutanDiperlukan, pilihanKeadaan, pilihKeadaan, type PilihanKeadaan,
} from '../../keadaanBaris';
import { calonIbuJanin, keadaanOrang, namaSingkat } from '../../keadaanOrang';
import { dampakHapus } from '../../kerabatPohon';
import { sebutanDariSaya } from '../../sebutan';
import { waktuRelatif } from '../../silsilah';
import { t } from '../../terjemah';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { Ikon } from '../../ui/Ikon';
import { PertanyaanHamil } from '../keadaan/PertanyaanHamil';
import { IsianTahun } from './IsianTahun';

interface Props {
  kasus: Kasus; id: IdOrang; kunci: KunciAhliWaris; milik: IdOrang;
  ubah: (f: (k: Kasus) => Kasus) => void;
  tandaiKurang: boolean; disorot: boolean;
  /** false untuk baris tetap (Ayah, Ibu, kakek, nenek): posisinya selalu ada, hanya keadaannya yang diubah. */
  bisaHapus?: boolean;
  /** Sebutan pengganti label dari kunci peran, misalnya "Paman kandung ayah" di bagian saudara kakek. */
  sebutan?: string;
}

/** Kunci diksi harus literal (dicek tes diksi), jadi label tiap keadaan ditulis eksplisit. */
export const LABEL_KEADAAN: Record<PilihanKeadaan, () => string> = {
  hidup: () => t('hitung.kanvas.kd_hidup'), wafat: () => t('hitung.kanvas.kd_wafat'), belumTahu: () => t('hitung.kanvas.kd_belum_tahu'),
  hilang: () => t('hitung.kanvas.kd_hilang'), bercerai: () => t('hitung.kanvas.kd_bercerai'), khuntsa: () => t('hitung.kanvas.kd_khuntsa'),
};
const ARTI_KEADAAN: Partial<Record<PilihanKeadaan, () => string>> = {
  hidup: () => t('hitung.kanvas.arti_hidup'), wafat: () => t('hitung.kanvas.arti_wafat'), belumTahu: () => t('hitung.kanvas.arti_belum_tahu'),
  khuntsa: () => t('hitung.kanvas.arti_khuntsa'),
};
/** Peran yang hanya satu per orang (Ayah, Suami, …) tidak diberi nomor. */
const adalahPeranTunggal = (kunci: KunciAhliWaris) => jenisDari(kunci)?.maksimal === 1;

export function BarisOrang({ kasus, id, kunci, milik, ubah, tandaiKurang, disorot, bisaHapus = true, sebutan }: Props) {
  const idLabel = useId();
  const [akanHapus, setAkanHapus] = useState(false);
  const orang = kasus.graf.orang[id];
  if (!orang) return null;

  const peran = labelPeran(kasus, id, kunci, milik, sebutan);
  const sebutanMu = sebutanDariSaya(kasus, id);
  const terpilih = keadaanTerpilih(kasus, id);
  // [R13-1] hanya calon ibu janin yang ditanya hamil; ditanya di kartunya sendiri supaya kalimatnya menyebut orangnya.
  const calonHamil = terpilih === 'hidup' && orang.jenisKelamin === 'P' && calonIbuJanin(kasus, milik).some(calon => calon.idIbu === id);
  const diaturDiLanjutan = (terpilih === 'hilang' || terpilih === 'bercerai') && lanjutanDiperlukan(kasus, id) === null;
  const alasan = tandaiKurang ? alasanBarisKurang(kasus, id, milik) : null;
  const pilih = (nilai: PilihanKeadaan) => ubah(k => pilihKeadaan(k, id, nilai, milik));
  const ikutTerhapus = akanHapus ? orangYangHilang(kasus, hapusBaris(kasus, id)).filter(lain => lain !== id) : [];
  const dampak = dampakHapus(kasus.graf, id);
  const nama = orang.nama || peran;

  return (
    <div className={`orang${alasan ? ' kurang' : ''}${disorot ? ' sorot-baris' : ''}`} id={`baris-${id}`} data-baris-orang={id}
      role="group" aria-label={peran} tabIndex={-1} {...(alasan ? { 'aria-invalid': true, 'aria-describedby': `${idLabel}-salah` } : {})}>
      <div className="kol-orang">
        <span className="peran">{peran}{sebutanMu && ` · ${sebutanMu}`}{kasus.saya === id && <span className="lencana-kamu">{t('hitung.kanvas.lencana_kamu')}</span>}</span>
        <input className="nama-isi" value={orang.nama ?? ''} placeholder={peran} aria-label={t('hitung.nama_label', { label: peran })}
          onChange={event => ubah(k => ({ ...k, graf: ubahNama(k.graf, id, event.target.value) }))} />
        <span className="keadaan-label" id={idLabel}>{t('hitung.kanvas.keadaan_tanya')}</span>
        <div className="seg" role="radiogroup" aria-labelledby={idLabel}>
          {pilihanKeadaan(kunci).map(nilai => (
            <button key={nilai} type="button" role="radio" aria-checked={terpilih === nilai} onClick={() => pilih(nilai)}>
              {LABEL_KEADAAN[nilai]()}
            </button>
          ))}
        </div>
        {diaturDiLanjutan
          ? <p className="kecil redup">{terpilih === 'hilang' ? t('hitung.kanvas.catatan_hilang') : t('hitung.kanvas.catatan_cerai')}</p>
          : <LanjutanBaris kasus={kasus} id={id} milik={milik} terpilih={terpilih} ubah={ubah} />}
        {calonHamil && <PertanyaanHamil kasus={kasus} idMayit={milik} ubah={ubah} kartu={id} />}
        {alasan && <span className="salah" id={`${idLabel}-salah`}>{alasan}</span>}
      </div>
      {bisaHapus && (
        <button type="button" className="aksi-teks hapus" aria-label={t('hitung.hapus_judul', { judul: nama })} onClick={() => setAkanHapus(true)}>
          <Ikon nama="sampah" ukuran={15} />{t('umum.hapus')}
        </button>
      )}
      {akanHapus && (
        <DialogKonfirmasi bahaya judul={t('hitung.pohon.hapus_judul', { nama })} labelLanjut={t('hitung.pohon.hapus')} labelBatal={t('umum.batal')}
          saatBatal={() => setAkanHapus(false)} saatLanjut={() => { setAkanHapus(false); ubah(k => hapusBaris(k, id)); }}>
          <p>{dampak.menjadiPenghubung ? t('hitung.pohon.hapus_penghubung', { nama }) : t('hitung.pohon.hapus_biasa', { nama })}</p>
          {ikutTerhapus.length > 0 && <p>{t('hitung.kanvas.konfirmasi_tidak_isi', { nama: ikutTerhapus.map(lain => namaSingkat(kasus, lain)).join(', ') })}</p>}
        </DialogKonfirmasi>
      )}
    </div>
  );
}

/** "Ayah", "Anak laki-laki"; dari sisi `milik` (almarhumah bila perempuan). */
export const namaPeran = (kasus: Kasus, kunci: KunciAhliWaris, milik: IdOrang): string =>
  sebutAlmarhum(LABEL_SEHARI[kunci] ?? jenisDari(kunci)?.label ?? kunci, kasus.graf.orang[milik]?.jenisKelamin ?? 'L');

/**
 * "Anak laki-laki 2" bila perannya bisa lebih dari satu; urutannya menurut posisi di bagian. Keturunan orang lain selain pemilik harta
 * disebut menurut hubungannya ke pemilik ("Cucu laki-laki 1"), sama dengan pohon, supaya tidak bertabrakan dengan anak pemilik.
 */
export function labelPeran(kasus: Kasus, id: IdOrang, kunci: KunciAhliWaris, milik: IdOrang, sebutan?: string): string {
  const { idPewaris } = kasus.graf;
  if (!sebutan && milik !== idPewaris && peranDariMayit(kasus.graf, idPewaris, id)) return labelBawaan(kasus.graf, idPewaris, id);
  const dasar = sebutan ?? namaPeran(kasus, kunci, milik);
  return adalahPeranTunggal(kunci) ? dasar : `${dasar} ${orangDenganKunci(kasus, milik, kunci).indexOf(id) + 1}`;
}

type Segmen = Array<[string, string]>;

function PilihanSegmen({ label, pilihan, terpilih, saatPilih }: { label: string; pilihan: Segmen; terpilih: string | null; saatPilih: (nilai: string) => void }) {
  const idLabel = useId();
  return (
    <>
      <span className="keadaan-label" id={idLabel}>{label}</span>
      <div className="seg" role="radiogroup" aria-labelledby={idLabel}>
        {pilihan.map(([nilai, teks]) => (
          <button key={nilai} type="button" role="radio" aria-checked={terpilih === nilai} onClick={() => saatPilih(nilai)}>{teks}</button>
        ))}
      </div>
    </>
  );
}

/** Satu pertanyaan lanjutan per keadaan (spec 5.3); jawabannya diterapkan keadaanBaris lewat jawabLanjutan. */
export function LanjutanBaris({ kasus, id, milik, terpilih, ubah }: {
  kasus: Kasus; id: IdOrang; milik: IdOrang; terpilih: PilihanKeadaan | null; ubah: (f: (k: Kasus) => Kasus) => void;
}) {
  const rel = namaSingkat(kasus, milik);
  const menunggu = lanjutanDiperlukan(kasus, id) !== null;
  const nikah = kasus.graf.pernikahan.find(satu => satu.idSuami === id || satu.idIstri === id);
  const jawab = (jawaban: Parameters<typeof jawabLanjutan>[3]) => ubah(k => jawabLanjutan(k, id, milik, jawaban));
  switch (terpilih) {
    case 'wafat': return <KapanWafat kasus={kasus} id={id} milik={milik} rel={rel} menunggu={menunggu} jawab={jawab} />;
    case 'belumTahu': return <p className="kecil redup">{t('hitung.kanvas.belum_tahu_catatan')}</p>;
    case 'hilang': return <PilihanSegmen label={t('hitung.kanvas.putusan_tanya')} terpilih={menunggu ? null : 'belum'}
      pilihan={[['belum', t('hitung.kanvas.belum_ada')], ['sudah', t('hitung.kanvas.sudah_ada')]]}
      saatPilih={nilai => jawab({ jenis: 'putusan', ada: nilai === 'sudah' })} />;
    case 'bercerai': return <PilihanSegmen label={t('hitung.kanvas.iddah_tanya', { rel })}
      terpilih={nikah?.status === 'talakBain' ? 'sudah' : menunggu ? null : 'belum'}
      pilihan={[['belum', t('hitung.kanvas.belum_selesai')], ['sudah', t('hitung.kanvas.sudah_selesai')]]}
      saatPilih={nilai => jawab({ jenis: 'iddah', selesai: nilai === 'sudah' })} />;
    case 'khuntsa': return <PilihanSegmen label={t('hitung.kanvas.baligh_tanya')}
      terpilih={kasus.graf.orang[id]?.khuntsa === 'tidakDiharapkanJelas' ? 'sudah' : menunggu ? null : 'belum'}
      pilihan={[['belum', t('hitung.kanvas.belum')], ['sudah', t('hitung.kanvas.sudah')]]}
      saatPilih={nilai => jawab({ jenis: 'baligh', sudah: nilai === 'sudah' })} />;
    default: return null;
  }
}

function KapanWafat({ kasus, id, milik, rel, menunggu, jawab }: {
  kasus: Kasus; id: IdOrang; milik: IdOrang; rel: string; menunggu: boolean;
  jawab: (jawaban: Parameters<typeof jawabLanjutan>[3]) => void;
}) {
  const tahunMilik = kasus.waktu?.[milik]?.wafat?.tahun;
  const otomatis = waktuRelatif(kasus, id, milik);
  const sesudah = keadaanOrang(kasus, id) === 'wafatSesudah';
  const alasanDitolak = alasanWafatSesudahDitolak(kasus, id, milik);
  const [tahunDibuka, setTahunDibuka] = useState(false);
  const tahunTerbuka = tahunDibuka || !!kasus.waktu?.[id]?.wafat;
  // Satu cara menjawab pada satu waktu: bila dua tahun sudah menentukan, pilihan lebih dulu/sesudah tidak ditampilkan.
  return (
    <div className="kapan">
      {otomatis
        ? <span className="kecil redup">{otomatis === 'sebelum'
          ? t('hitung.kanvas.berarti_sebelum', { rel, tahun: tahunMilik! }) : t('hitung.kanvas.berarti_sesudah', { rel, tahun: tahunMilik! })}
          {alasanDitolak && <> {alasanDitolak}</>}</span>
        : <PilihanSegmen label={t('hitung.kanvas.waktu_tanya_rel_kosong', { rel })}
          terpilih={menunggu ? null : sesudah ? 'sesudah' : 'sebelum'}
          pilihan={[['sebelum', t('hitung.kanvas.sebelum')], ['sesudah', t('hitung.kanvas.sesudah')]]}
          saatPilih={nilai => jawab({ jenis: 'wafat', waktu: nilai === 'sesudah' ? 'sesudah' : 'sebelum' })} />}
      {tahunTerbuka
        ? <IsianTahun label={t('hitung.kanvas.tahun_wafatnya')} contoh={t('hitung.kanvas.tahun_kalau_ingat')} nilai={kasus.waktu?.[id]?.wafat}
          fokus={tahunDibuka} saatUbah={tahun => jawab({ jenis: 'wafat', tahun: tahun ?? null })} />
        : <button type="button" className="tautan" onClick={() => setTahunDibuka(true)}>{t('hitung.kanvas.ingat_tahun')}</button>}
    </div>
  );
}

/** Satu Details per bagian: hanya pilihan yang benar-benar tampil di baris-barisnya, satu baris per pilihan. */
export function BingungMemilih({ daftarKunci }: { daftarKunci: KunciAhliWaris[] }) {
  if (daftarKunci.length === 0) return null;
  const pilihan = [...new Set(daftarKunci.flatMap(pilihanKeadaan))];
  return (
    <details className="rinci">
      <summary><Ikon nama="kembali" ukuran={14} />{t('hitung.kanvas.bingung')}</summary>
      <div>{pilihan.map(nilai => <span key={nilai}><b>{LABEL_KEADAAN[nilai]()}</b>: {ARTI_KEADAAN[nilai]?.()}</span>)}</div>
    </details>
  );
}
