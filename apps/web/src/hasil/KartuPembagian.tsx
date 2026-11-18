// Daftar "Siapa menerima berapa" (acuan-hasil-final.html): kelompok Penerima dan Tidak mendapat bagian, baris tanpa alasan
// (alasan ada di modal orang), sakelar Fardh/Saham untuk bentuk pecahan, lalu penjumlahan sampai harta yang dibagi.
// Ikon pensil (ubah ahli waris) dan mata (sembunyikan nominal) tetap. Baris penjumlahan menyaring daftar; satuan pembulatan
// diubah lewat pil di baris sisa pembulatan (dialog), hanya muncul bila ada angka tidak bulat.
// Di mode Belajar sebelum jawaban dibuka, seluruh isinya diganti isian tebakan (KartuTebak).

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

interface Saringan { kunci: string; label: string }
const KUNCI_DITERIMA = 'diterima';
const KUNCI_TERHALANG = 'terhalang';

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
  /** Orang yang bagiannya berbeda dari Syafi'i menurut madzhab terpilih. */
  idBerbeda?: ReadonlySet<string>;
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
  const [saring, setSaring] = useState<Saringan | null>(null);
  const [bukaBulat, setBukaBulat] = useState(false);
  const ketuk = (kunci: string, label: string) => setSaring(saring?.kunci === kunci ? null : { kunci, label });
  const tampil = (kunci: string) => !saring || saring.kunci === kunci;
  const tampilPenerima = tampil(KUNCI_DITERIMA);
  const labelDiterima = t('hasil.diterima_jumlah_penerima', { jumlah: angka(String(ringkasan.penerima.length)) });
  const labelTerhalang = t('hasil.tidak_mendapat_jumlah', { jumlah: angka(String(ringkasan.terhalang.length)) });
  const adaDaftarPenerima = tampilPenerima || ringkasan.daftarSisaKeluar.some(sisa => tampil(sisa.id));

  return (
    <section className="ubin-h kartu-utama" aria-labelledby="judul-pembagian" data-tur="pembagian">
      <header className="kepala-pembagian">
        <div className="judul-kartu">
          <h2 id="judul-pembagian">{props.adalahBelajar ? (sedangMenebak ? t('hitung.jawabanmu') : t('hitung.kunci_jawaban')) : t('hasil.siapa_menerima_berapa')}</h2>
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
            <button type="button" className="tautan-aksi" onClick={props.saatUbahAhliWaris}>
              <Ikon nama="pensil" ukuran={16} />{t('hitung.ubah_ahli_waris')}
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
          {saring && (
            <p className="disaring">{t('hasil.disaring')} <b>{saring.label}</b> · <button type="button" className="tautan-aksi tautan-sebaris" onClick={() => setSaring(null)}>{t('hitung.tampilkan_semua')}</button></p>
          )}
          {adaDaftarPenerima && <JudulKelompok judul={t('hasil.penerima')} jumlah={tampilPenerima ? ringkasan.penerima.length : ringkasan.daftarSisaKeluar.filter(sisa => !sisa.ditahan && tampil(sisa.id)).length} />}
          <ul className="daftar-bagian">
            {tampilPenerima && ringkasan.penerima.map(orang => (
              <BarisOrang key={orang.id} orang={orang} warna={warnaOrang(ringkasan, orang.id)} berbeda={!!props.idBerbeda?.has(orang.id)} saatPilih={props.saatPilihOrang}
                uang={uang(orang.nominal)} pecahan={orang.rincian ?? <>{pecahanTeks(orang.saham, ringkasan.penyebut, pengaturan.bentuk)} · {persenTeks(orang.saham, ringkasan.penyebut)}</>} />
            ))}
            {ringkasan.daftarSisaKeluar.filter(sisa => !sisa.ditahan && tampil(sisa.id)).map(sisa => (
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
          {ringkasan.terhalang.length > 0 && tampil(KUNCI_TERHALANG) && (
            <section aria-labelledby="judul-tidak-dapat">
              <JudulKelompok id="judul-tidak-dapat" judul={t('hitung.tidak_mendapat_bagian')} jumlah={ringkasan.terhalang.length} />
              <ul className="daftar-bagian">
                {ringkasan.terhalang.map(orang => <BarisOrang key={orang.id} orang={orang} redup saatPilih={props.saatPilihOrang} uang={uang(0n)} pecahan={orang.alasan} />)}
              </ul>
            </section>
          )}
          <dl className="penjumlahan">
            <BarisPenyaring label={labelDiterima} nilai={uang(totalDiterima)} aktif={saring?.kunci === KUNCI_DITERIMA} saatKetuk={() => ketuk(KUNCI_DITERIMA, labelDiterima)} />
            {ringkasan.daftarSisaKeluar.map(sisa => (
              <BarisPenyaring key={sisa.id} label={sisa.judul} nilai={uang(sisa.nominal)} aktif={saring?.kunci === sisa.id} saatKetuk={() => ketuk(sisa.id, sisa.judul)} />
            ))}
            {ringkasan.terhalang.length > 0 && (
              <BarisPenyaring label={labelTerhalang} nilai={uang(0n)} aktif={saring?.kunci === KUNCI_TERHALANG} saatKetuk={() => ketuk(KUNCI_TERHALANG, labelTerhalang)} />
            )}
            {props.tampilPembulatan && (
              <div data-tur="pembulatan"><dt>{t('hasil.sisa_pembulatan')}
                <button type="button" className="pil-bulat" aria-label={t('hasil.ubah_pembulatan')} onClick={() => setBukaBulat(true)}>
                  {PILIHAN_PEMBULATAN.find(pilihan => pilihan.satuan === props.satuanPembulatan)?.judul ?? formatRupiah(props.satuanPembulatan)}<Ikon nama="bawah" ukuran={15} />
                </button></dt><dd>{uang(ringkasan.sisaPembulatan)}</dd></div>
            )}
            <div className="hasil-jumlah"><dt>{t('hitung.harta_yang_dibagi')}</dt><dd>{uang(totalDiterima + totalSisaKeluar + ringkasan.sisaPembulatan)}</dd></div>
          </dl>
          {bukaBulat && <ModalPembulatan satuan={props.satuanPembulatan} saatPilih={satuan => { props.saatUbahPembulatan(satuan); setBukaBulat(false); }} saatTutup={() => setBukaBulat(false)} />}
        </>
      )}
    </section>
  );
}

export function JudulKelompok({ id, judul, jumlah }: { id?: string; judul: string; jumlah: number }) {
  return <h3 className="judul-kelompok" id={id}><span>{judul}</span><span>{t('hasil.jumlah_orang', { jumlah: angka(String(jumlah)) })}</span></h3>;
}

export function BarisOrang({ orang, warna, redup = false, berbeda = false, saatPilih, uang, pecahan }: {
  orang: Pick<Penerima | Terhalang, 'id' | 'nama' | 'kunci'>; warna?: string; redup?: boolean; /** Bagiannya berbeda dari Syafi'i menurut madzhab terpilih. */ berbeda?: boolean; saatPilih: (id: string) => void; uang: string; pecahan: ReactNode;
}) {
  const atribut = useAtributOrang();
  const { className, ...pemicu } = atribut(orang.id);
  const peran = peranDari(orang);
  return (
    <li>
      <button type="button" {...pemicu} className={['baris-bagian', redup && 'redup', className].filter(Boolean).join(' ')} onClick={() => saatPilih(orang.id)}>
        <AvatarOrang nama={orang.nama} warna={warna} ukuran={40} />
        <span className="nama-bagian">{orang.nama}{peran && <small>{peran}</small>}{berbeda && <small className="label-beda-madzhab">{t('hitung.berbeda_dari_syafii')}</small>}</span>
        <span className="jumlah-bagian"><span className="angka">{uang}</span><small>{pecahan}</small></span>
        <Ikon nama="kanan" ukuran={18} />
      </button>
    </li>
  );
}

function BarisPenyaring({ label, nilai, aktif, saatKetuk }: { label: string; nilai: string; aktif: boolean; saatKetuk: () => void }) {
  // Tombol di dalam dt ditarik menutupi seluruh baris (CSS ::after) supaya HTML dl tetap sah.
  return <div className={aktif ? 'aktif' : undefined}><dt><button type="button" className="saring" aria-pressed={aktif} onClick={saatKetuk}>{label}</button></dt><dd>{nilai}</dd></div>;
}

function ModalPembulatan({ satuan, saatPilih, saatTutup }: { satuan: bigint; saatPilih: (satuan: bigint) => void; saatTutup: () => void }) {
  const kotak = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const pemicu = document.activeElement as HTMLElement | null;
    kotak.current?.querySelector<HTMLElement>('[aria-checked=true]')?.focus();
    return () => pemicu?.focus();
  }, []);
  const jagaFokus = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') return saatTutup();
    if (event.key !== 'Tab') return;
    const tombol = [...kotak.current!.querySelectorAll<HTMLElement>('button')];
    const ujung = event.shiftKey ? tombol[0] : tombol[tombol.length - 1];
    if (document.activeElement === ujung) { event.preventDefault(); (event.shiftKey ? tombol[tombol.length - 1] : tombol[0])?.focus(); }
  };
  return (
    // Portal ke body: position:fixed terkurung bila ada induk ber-transform/filter di dalam ubin.
    createPortal(<div className="modal-latar" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div ref={kotak} className="modal-orang modal-kecil" role="dialog" aria-modal="true" aria-label={t('hasil.pembulatan_judul')} onKeyDown={jagaFokus}>
        <header className="kepala-modal netral"><div><h2>{t('hasil.pembulatan_judul')}</h2><p className="sub-kartu">{t('hasil.pembulatan_sub')}</p></div></header>
        <div className="isi-modal">
          <div className="pilihan-bulat tegak" role="radiogroup" aria-label={t('hasil.pembulatan_judul')}>
            {PILIHAN_PEMBULATAN.map(pilihan => (
              <button key={String(pilihan.satuan)} type="button" role="radio" aria-checked={pilihan.satuan === satuan} onClick={() => saatPilih(pilihan.satuan)}>
                <b>{pilihan.judul}</b><small>{pilihan.keterangan}</small>
              </button>
            ))}
          </div>
        </div>
        <footer className="kaki-modal"><span className="pengisi" /><button type="button" className="tautan-aksi" onClick={saatTutup}>{t('umum.tutup')}</button></footer>
      </div>
    </div>, document.body)
  );
}
