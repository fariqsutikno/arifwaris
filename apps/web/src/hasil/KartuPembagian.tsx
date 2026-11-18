// Daftar "Siapa menerima berapa" (acuan-hasil-final.html): kelompok Penerima dan Tidak mendapat bagian, baris tanpa alasan
// (alasan ada di modal orang), sakelar Fardh/Saham untuk bentuk pecahan, lalu penjumlahan sampai harta yang dibagi.
// Ikon pensil (ubah ahli waris) dan mata (sembunyikan nominal) tetap. Pembulatan dilipat, hanya bila ada angka tidak bulat.
// Di mode Belajar sebelum jawaban dibuka, seluruh isinya diganti isian tebakan (KartuTebak).

import type { ReactNode } from 'react';
import { AvatarOrang } from './AvatarOrang';
import { warnaOrang } from './warnaOrang';
import { jenisDari } from '../checklist';
import { formatRupiah } from '../format';
import { PILIHAN_PEMBULATAN } from '../konten/harta';
import type { BentukPecahan, Penerima, RingkasanHasil, Terhalang } from './ringkasan';
import { pecahanTeks, persenTeks } from './ringkasan';
import { Confetti } from '../ui/Confetti';
import { KartuTebak, UmpanBalikBenar } from './KartuTebak';
import { useAtributOrang } from './sorot';
import { Ikon } from '../ui/Ikon';
import { angka, t } from '../terjemah';

export interface PengaturanTampil { bentuk: BentukPecahan }

interface Props {
  ringkasan: RingkasanHasil;
  pengaturan: PengaturanTampil;
  saatUbahPengaturan: (pengaturan: PengaturanTampil) => void;
  sembunyiNominal: boolean;
  saatSembunyi: () => void;
  sedangMenebak: boolean;
  adalahBelajar: boolean;
  saatTampilkanJawaban: () => void;
  saatTebakanBenar: () => void;
  saatMencobaMenjawab: () => void;
  /** Tebakan baru saja dijawab benar semua: tampilkan umpan balik + confetti di atas pembagian. */
  tebakanBenar: boolean;
  tampilPembulatan: boolean;
  satuanPembulatan: bigint;
  saatUbahPembulatan: (satuan: bigint) => void;
  saatPilihOrang: (id: string) => void;
  saatUbahAhliWaris?: (() => void) | undefined;
  /** Diisi hanya bila tidak ada potongan harta (selain itu harta diubah dari Tentang kasus ini). */
  saatUbahHarta?: (() => void) | undefined;
  /** Kotak di atas daftar (munasakhat: "Yang dibagi sekarang"). */
  pembuka?: ReactNode;
  /** Kelompok sesudah Penerima (munasakhat: meninggal sebelum dibagi; taqdir: ditahan). */
  kelompokTambahan?: ReactNode;
}

/** Peran di bawah nama ("Istri"), kecuali namanya memang sudah peran itu. */
const peranDari = (orang: Pick<Penerima, 'nama' | 'kunci'>) => {
  const label = orang.kunci && jenisDari(orang.kunci)?.label;
  return label && !orang.nama.startsWith(label) ? label : undefined;
};

export function KartuPembagian(props: Props) {
  const { ringkasan, pengaturan, sembunyiNominal, sedangMenebak } = props;
  const uang = (nilai: bigint) => (sembunyiNominal ? t('hitung.rp') : formatRupiah(nilai));
  const totalDiterima = ringkasan.penerima.reduce((jumlah, orang) => jumlah + orang.nominal, 0n);
  const totalSisaKeluar = ringkasan.daftarSisaKeluar.reduce((jumlah, sisa) => jumlah + sisa.nominal, 0n);

  return (
    <section className="ubin kartu-utama" aria-labelledby="judul-pembagian" data-tur="pembagian">
      <header className="kepala-pembagian">
        <div className="judul-kartu">
          <h2 id="judul-pembagian">{props.adalahBelajar ? (sedangMenebak ? t('hitung.jawabanmu') : t('hitung.kunci_jawaban')) : t('hitung.pembagian')}</h2>
          {/* Harta adalah bagian dari soal, jadi tetap tampil saat menebak. */}
          <p className="sub-kartu">
            {sedangMenebak ? t('hitung.dibagi_dari_harta', { harta: uang(ringkasan.tirkah.bersih) }) : t('hasil.ketuk_nama_penjelasan')}
            {props.saatUbahHarta && <> <button type="button" className="tautan-aksi tautan-sebaris" onClick={props.saatUbahHarta}>{t('hitung.ubah_harta')}</button></>}
          </p>
        </div>
        <div className="alat-pembagian">
          {!sedangMenebak && (
            <div className="segmen" role="radiogroup" aria-label={t('hitung.bentuk_pecahan')}>
              <button type="button" role="radio" aria-checked={pengaturan.bentuk === 'sederhana'} onClick={() => props.saatUbahPengaturan({ bentuk: 'sederhana' })}>{t('hasil.fardh')}</button>
              <button type="button" role="radio" aria-checked={pengaturan.bentuk === 'sama'} onClick={() => props.saatUbahPengaturan({ bentuk: 'sama' })}>{t('hasil.saham')}</button>
            </div>
          )}
          {props.saatUbahAhliWaris && (
            <button type="button" className="tombol-ikon" onClick={props.saatUbahAhliWaris} aria-label={t('hitung.ubah_ahli_waris')} title={t('hitung.ubah_ahli_waris')}>
              <Ikon nama="pensil" />
            </button>
          )}
          {!sedangMenebak && (
            <button type="button" className="tombol-ikon" aria-pressed={sembunyiNominal} onClick={props.saatSembunyi}
              aria-label={sembunyiNominal ? t('hitung.tampilkan_nominal') : t('hitung.sembunyikan_nominal')} title={sembunyiNominal ? t('hitung.tampilkan_nominal') : t('hitung.sembunyikan_nominal')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
                {sembunyiNominal && <path d="M4 4l16 16" />}
              </svg>
            </button>
          )}
        </div>
      </header>

      {sedangMenebak ? (
        <KartuTebak ringkasan={ringkasan} saatBenar={props.saatTebakanBenar} saatMencoba={props.saatMencobaMenjawab} saatLihatJawaban={props.saatTampilkanJawaban} />
      ) : (
        <>
          {props.tebakanBenar && <><UmpanBalikBenar /><Confetti /></>}
          {props.pembuka}
          <JudulKelompok judul={t('hasil.penerima')} jumlah={ringkasan.penerima.length} />
          <ul className="daftar-bagian">
            {ringkasan.penerima.map(orang => (
              <BarisOrang key={orang.id} orang={orang} warna={warnaOrang(ringkasan, orang.id)} saatPilih={props.saatPilihOrang}
                uang={uang(orang.nominal)} pecahan={<>{pecahanTeks(orang.saham, ringkasan.penyebut, pengaturan.bentuk)} · {persenTeks(orang.saham, ringkasan.penyebut)}</>} />
            ))}
            {ringkasan.daftarSisaKeluar.filter(sisa => !sisa.ditahan).map(sisa => (
              <li key={sisa.id}>
                <div className="baris-bagian sisa">
                  <span className="titik putus" aria-hidden="true" />
                  <span className="nama-bagian">{sisa.judul}<small>{sisa.keterangan}</small></span>
                  <span className="jumlah-bagian"><span className="angka">{uang(sisa.nominal)}</span>
                    <small>{pecahanTeks(sisa.saham, ringkasan.penyebut, pengaturan.bentuk)} · {persenTeks(sisa.saham, ringkasan.penyebut)}</small></span>
                </div>
              </li>
            ))}
          </ul>
          {props.kelompokTambahan}
          {ringkasan.terhalang.length > 0 && (
            <section aria-labelledby="judul-tidak-dapat">
              <JudulKelompok id="judul-tidak-dapat" judul={t('hitung.tidak_mendapat_bagian')} jumlah={ringkasan.terhalang.length} />
              <ul className="daftar-bagian">
                {ringkasan.terhalang.map(orang => <BarisOrang key={orang.id} orang={orang} redup saatPilih={props.saatPilihOrang} uang={uang(0n)} pecahan={orang.alasan} />)}
              </ul>
            </section>
          )}
          <dl className="penjumlahan">
            <div><dt>{t('hasil.diterima_jumlah_penerima', { jumlah: angka(String(ringkasan.penerima.length)) })}</dt><dd>{uang(totalDiterima)}</dd></div>
            {ringkasan.daftarSisaKeluar.map(sisa => <div key={sisa.id}><dt>{sisa.judul}</dt><dd>{uang(sisa.nominal)}</dd></div>)}
            {ringkasan.terhalang.length > 0 && <div><dt>{t('hasil.tidak_mendapat_jumlah', { jumlah: angka(String(ringkasan.terhalang.length)) })}</dt><dd>{uang(0n)}</dd></div>}
            {ringkasan.sisaPembulatan > 0n && <div><dt>{t('hasil.sisa_pembulatan')}</dt><dd>{uang(ringkasan.sisaPembulatan)}</dd></div>}
            <div className="hasil-jumlah"><dt>{t('hitung.harta_yang_dibagi')}</dt><dd>{uang(totalDiterima + totalSisaKeluar + ringkasan.sisaPembulatan)}</dd></div>
          </dl>
          {props.tampilPembulatan && (
            <KartuPembulatan ringkasan={ringkasan} satuan={props.satuanPembulatan} saatUbah={props.saatUbahPembulatan} sembunyiNominal={sembunyiNominal} />
          )}
        </>
      )}
    </section>
  );
}

export function JudulKelompok({ id, judul, jumlah }: { id?: string; judul: string; jumlah: number }) {
  return <h3 className="judul-kelompok" id={id}><span>{judul}</span><span>{t('hasil.jumlah_orang', { jumlah: angka(String(jumlah)) })}</span></h3>;
}

export function BarisOrang({ orang, warna, redup = false, saatPilih, uang, pecahan }: {
  orang: Pick<Penerima | Terhalang, 'id' | 'nama' | 'kunci'>; warna?: string; redup?: boolean; saatPilih: (id: string) => void; uang: string; pecahan: ReactNode;
}) {
  const atribut = useAtributOrang();
  const { className, ...pemicu } = atribut(orang.id);
  const peran = peranDari(orang);
  return (
    <li>
      <button type="button" {...pemicu} className={['baris-bagian', redup && 'redup', className].filter(Boolean).join(' ')} onClick={() => saatPilih(orang.id)}>
        <AvatarOrang nama={orang.nama} warna={warna} ukuran={40} />
        <span className="nama-bagian">{orang.nama}{peran && <small>{peran}</small>}</span>
        <span className="jumlah-bagian"><span className="angka">{uang}</span><small>{pecahan}</small></span>
      </button>
    </li>
  );
}

function KartuPembulatan({ ringkasan, satuan, saatUbah, sembunyiNominal }: {
  ringkasan: RingkasanHasil; satuan: bigint; saatUbah: (satuan: bigint) => void; sembunyiNominal: boolean;
}) {
  const contoh = ringkasan.penerima.find(orang => orang.nominal % 1000n !== 0n) ?? ringkasan.penerima[0];
  return (
    // Dilipat: kebanyakan orang tidak mengubah pembulatan, jangan sampai menutupi penjelasan di bawahnya.
    <details className="kartu-bulat" data-tur="pembulatan">
      <summary className="kepala-bulat">
        <span className="label-perhatian">{t('hitung.perlu_keputusanmu')}</span>
        <b>{t('hitung.ada_angka_yang_nggak_bulat_dibulatkan', { satuan: PILIHAN_PEMBULATAN.find(pilihan => pilihan.satuan === satuan)?.judul ?? formatRupiah(satuan) })}</b>
        <span>{t('hitung.misalnya_bagian_nama_susah_dibagi_tunai', { nama: contoh?.nama.toLowerCase() ?? '' })}</span>
      </summary>
      <div className="isi-bulat">
        <div className="pilihan-bulat" role="radiogroup" aria-label={t('hitung.bulatkan_bagian_tiap_orang_ke')}>
          {PILIHAN_PEMBULATAN.map(pilihan => (
            <button key={String(pilihan.satuan)} type="button" role="radio" aria-checked={pilihan.satuan === satuan} onClick={() => saatUbah(pilihan.satuan)}>
              <b>{pilihan.judul}</b><small>{pilihan.keterangan}</small>
            </button>
          ))}
        </div>
        {ringkasan.sisaPembulatan > 0n
          ? <p>{t('hitung.setelah_dibulatkan_ke_bawah_tersisa')} <b>{sembunyiNominal ? t('hitung.rp') : formatRupiah(ringkasan.sisaPembulatan)}</b> {t('hitung.yang_belum_terbagi_sisa_ini_tidak')}</p>
          : <p>{t('hitung.semua_bagian_sudah_pas_tidak_ada')}</p>}
      </div>
    </details>
  );
}
