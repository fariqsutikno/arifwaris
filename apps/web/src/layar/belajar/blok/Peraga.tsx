// Blok ```peraga: kotak harta seperti di Lab, satu kotak = satu bagian dari penyebut. Tiap keadaan dihitung engine;
// semua keadaan digambar dengan jumlah kotak yang sama (KPK penyebutnya) supaya perubahan bagian terlihat pada harta yang
// sama besar. Tampil 'aul: kotak sebelum 'aul (hak meluap melewati bingkai), lalu tautan "Terapkan 'aul".
import { useMemo, useState } from 'react';
import type { Blok } from '@waris/content';
import { kpk } from '@waris/math';
import { pecahanTeks } from '../../../hasil/ringkasan';
import { PALET_ORANG } from '../../../hasil/warnaOrang';
import { angka, t } from '../../../terjemah';
import { Sebaris } from '../Sebaris';
import { hitungContoh, labelKunci, type HasilContoh } from './hitungContoh';

type BlokPeraga = Extract<Blok, { jenis: 'peraga' }>;

/** Lebih dari ini kotak terlalu kecil di HP; peraga tetap benar, hanya digambar per kotak kecil. */
const KOLOM_KOTAK_MAKS = 12;

export function Peraga({ blok }: { blok: BlokPeraga }) {
  const daftarHasil = useMemo(() => blok.keadaan.map(keadaan => hitungContoh(keadaan.pewaris, keadaan.ahliWaris)), [blok]);
  const [pilihan, setPilihan] = useState(0);
  const [aulDiterapkan, setAulDiterapkan] = useState(false);
  if (daftarHasil.some(hasil => hasil === undefined)) return <p className="kartu kartu-galat" role="alert">{t('belajar.contoh_ini_tidak_bisa_dihitung_laporkan')}</p>;
  const semua = daftarHasil as HasilContoh[];
  // Warna per kunci tetap di semua keadaan, supaya istri di keadaan pertama dan kedua berwarna sama.
  const urutanKunci = [...new Set(blok.keadaan.flatMap(keadaan => keadaan.ahliWaris))];
  const warna = (kunci: string) => PALET_ORANG[urutanKunci.indexOf(kunci) % PALET_ORANG.length]!;
  const jumlahKotak = semua.reduce((hasil, isi) => kpk(hasil, isi.ringkasan.penyebut), 1n);
  const keadaan = blok.keadaan[pilihan]!;
  const hasil = semua[pilihan]!;

  return (
    <figure className="blok-materi peraga">
      {blok.judul && <figcaption className="judul-blok">{blok.judul}</figcaption>}
      {blok.pengantar && <p><Sebaris isi={blok.pengantar} /></p>}
      {blok.keadaan.length > 1 && (
        <div className="segmen" role="group" aria-label={t('belajar.keadaan')}>
          {blok.keadaan.map((isi, urutan) => (
            <button key={isi.label} type="button" aria-pressed={urutan === pilihan} onClick={() => { setPilihan(urutan); setAulDiterapkan(false); }}>{isi.label}</button>
          ))}
        </div>
      )}
      {blok.tampil === 'aul'
        ? <KotakAul hasil={hasil} warna={warna} diterapkan={aulDiterapkan} saatUbah={setAulDiterapkan} />
        : <KotakBiasa hasil={hasil} warna={warna} jumlahKotak={jumlahKotak} />}
      <Keterangan hasil={hasil} warna={warna} />
      {blok.tampil === 'kotak-tabel' && <TabelPeraga hasil={hasil} />}
      <p className="penjelasan-peraga"><Sebaris isi={keadaan.penjelasan} /></p>
    </figure>
  );
}

type Warna = (kunci: string) => string;

function KotakBiasa({ hasil, warna, jumlahKotak }: { hasil: HasilContoh; warna: Warna; jumlahKotak: bigint }) {
  const kali = jumlahKotak / hasil.ringkasan.penyebut;
  const pemilik = hasil.perKunci.flatMap(isi => Array.from({ length: Number(isi.saham * kali) }, () => isi.kunci));
  return <GridKotak pemilik={pemilik} warna={warna} bingkai={pemilik.length} label={t('belajar.kotak_jumlah', { jumlah: angka(String(jumlahKotak)) })} />;
}

/** Sebelum 'aul: bingkai = ashl, kotak hak = jumlah saham (meluap). Sesudah: bingkai = angka 'aul, semua kotak masuk. */
function KotakAul({ hasil, warna, diterapkan, saatUbah }: { hasil: HasilContoh; warna: Warna; diterapkan: boolean; saatUbah: (nilai: boolean) => void }) {
  const ashl = hasil.hasil.tabel.totalKolom.ashl ?? hasil.ringkasan.penyebut;
  const pemilik = hasil.perKunci.flatMap(isi => Array.from({ length: Number(isi.saham) }, () => isi.kunci));
  const bingkai = diterapkan ? pemilik.length : Number(ashl);
  return (
    <>
      <GridKotak pemilik={pemilik} warna={warna} bingkai={bingkai}
        label={diterapkan ? t('belajar.aul_diterapkan', { jumlah: angka(String(pemilik.length)) }) : t('belajar.aul_meluap', { hak: angka(String(pemilik.length)), harta: angka(String(ashl)) })} />
      <button type="button" className="aksi-teks" onClick={() => saatUbah(!diterapkan)}>{diterapkan ? t('belajar.sebelum_aul') : t('belajar.terapkan_aul')}</button>
    </>
  );
}

function GridKotak({ pemilik, warna, bingkai, label }: { pemilik: string[]; warna: Warna; bingkai: number; label: string }) {
  return (
    <div className="kotak-peraga">
      <p className="label-kotak">{label}</p>
      <div className="grid-peraga" role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(pemilik.length, bingkai), KOLOM_KOTAK_MAKS)}, minmax(0, 1fr))` }}>
        {pemilik.map((kunci, urutan) => (
          <span key={urutan} className={urutan >= bingkai ? 'kotak luar' : 'kotak'} style={{ background: warna(kunci) }} />
        ))}
      </div>
    </div>
  );
}

function Keterangan({ hasil, warna }: { hasil: HasilContoh; warna: Warna }) {
  return (
    <p className="ket-peraga">
      {hasil.perKunci.map(isi => (
        <span key={isi.kunci}><i style={{ background: warna(isi.kunci) }} />{namaKelompok(isi.label, isi.jumlahOrang)} {angka(pecahanTeks(isi.saham, hasil.ringkasan.penyebut, 'sederhana'))}</span>
      ))}
      {hasil.tidakMenerima.map(kunci => <span key={kunci} className="gugur-peraga">{labelKunci(kunci)}</span>)}
    </p>
  );
}

function TabelPeraga({ hasil }: { hasil: HasilContoh }) {
  return (
    <div className="wadah-tabel-materi">
      <table className="tabel-materi">
        <thead><tr><th>{t('belajar.kolom_ahli_waris')}</th><th className="angka">{t('belajar.kolom_bagian')}</th></tr></thead>
        <tbody>
          {hasil.perKunci.map(isi => (
            <tr key={isi.kunci}><td>{namaKelompok(isi.label, isi.jumlahOrang)}</td><td className="angka">{angka(pecahanTeks(isi.saham, hasil.ringkasan.penyebut, 'sederhana'))}</td></tr>
          ))}
          {hasil.tidakMenerima.map(kunci => <tr key={kunci} className="baris-gugur"><td>{labelKunci(kunci)}</td><td className="angka">{t('belajar.gugur')}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

const namaKelompok = (label: string, jumlah: number) => (jumlah > 1 ? `${angka(String(jumlah))} ${label.toLowerCase()}` : label);
