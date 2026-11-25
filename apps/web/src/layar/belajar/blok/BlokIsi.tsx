// Blok materi yang hanya menyajikan isi berkas (tanpa engine): alur, cara berpikir, peta bab, bandingan, ingat, dasar,
// tebak, lipat, matriks. Gaya mengikuti preview materi v2 (docs/design/preview-materi-v2.html).
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { TAHAP_ALUR, type Blok, type NilaiBagian, type SimpulPeta, type TahapAlur } from '@waris/content';
import { angka, t } from '../../../terjemah';
import { Ikon } from '../../../ui/Ikon';
import { ChipDalil } from '../ChipDalil';
import { idBagian, keBagian, nomorTampil } from '../DaftarIsi';
import { Sebaris } from '../Sebaris';

type BlokDari<J extends Blok['jenis']> = Extract<Blok, { jenis: J }>;

/** Tahap pipeline yang digambar berurutan; 'semua' dan 'lanjutan' bukan tahap tunggal (seluruh deret disorot / tidak ada). */
const TAHAP_PIPELINE = TAHAP_ALUR.filter(tahap => tahap !== 'semua' && tahap !== 'lanjutan');
const labelTahap = (tahap: TahapAlur) => t(`belajar.tahap_${tahap.replace('-', '_')}`);

export function Alur({ blok }: { blok: BlokDari<'alur'> }) {
  return (
    <section className="blok-alur" aria-label={t('belajar.alur_judul')}>
      <p className="judul-blok">{t('belajar.alur_judul')}</p>
      {blok.tahap === 'lanjutan'
        ? <p className="deret-alur"><span className="kini">{labelTahap('lanjutan')}</span></p>
        : (
          <ol className="deret-alur">
            {TAHAP_PIPELINE.map(tahap => (
              <li key={tahap} className={blok.tahap === 'semua' || tahap === blok.tahap ? 'kini' : undefined} aria-current={tahap === blok.tahap ? 'step' : undefined}>{labelTahap(tahap)}</li>
            ))}
          </ol>
        )}
      <dl className="isi-alur">
        <dt>{t('belajar.alur_tanya')}</dt><dd><Sebaris isi={blok.tanya} /></dd>
        {blok.bekal && <><dt>{t('belajar.alur_bekal')}</dt><dd><Sebaris isi={blok.bekal} /></dd></>}
        <dt>{t('belajar.alur_hasil')}</dt><dd><Sebaris isi={blok.hasil} /></dd>
      </dl>
    </section>
  );
}

export function CaraBerpikir({ blok }: { blok: BlokDari<'caraBerpikir'> }) {
  return (
    <section className="blok-materi cara-berpikir">
      <p className="judul-blok">{blok.judul ?? t('belajar.cara_berpikir_judul')}</p>
      <ol>
        {blok.langkah.map((langkah, urutan) => (
          <li key={urutan}><span className="tanya-langkah"><Sebaris isi={langkah.tanya} /></span><span className="akibat-langkah"><Sebaris isi={langkah.akibat} /></span></li>
        ))}
      </ol>
    </section>
  );
}

/** Pohon bercabang bila muat di lembar baca; bila tidak (pohon lebar atau layar sempit), pohon menurun berbatas kiri. */
export function Peta({ blok }: { blok: BlokDari<'peta'> }) {
  const wadah = useRef<HTMLElement>(null);
  const [menurun, setMenurun] = useState(false);
  useLayoutEffect(() => {
    const elemen = wadah.current;
    if (!elemen || typeof ResizeObserver === 'undefined') return;
    const ukur = () => {
      elemen.classList.remove('menurun');
      const terlaluLebar = elemen.scrollWidth > elemen.clientWidth;
      elemen.classList.toggle('menurun', terlaluLebar);
      setMenurun(terlaluLebar);
    };
    const pengamat = new ResizeObserver(ukur);
    pengamat.observe(elemen);
    return () => pengamat.disconnect();
  }, []);
  return (
    <nav ref={wadah} className={menurun ? 'peta-bab menurun' : 'peta-bab'} aria-label={t('belajar.peta_judul')}>
      <p className="judul-blok">{t('belajar.peta_judul')}</p>
      <ul className="pohon"><SimpulPohon simpul={blok.akar} akar /></ul>
    </nav>
  );
}

function SimpulPohon({ simpul, akar }: { simpul: SimpulPeta; akar?: boolean }) {
  const isi = <><b>{simpul.judul}</b>{simpul.keterangan && <small>{simpul.keterangan}</small>}</>;
  return (
    <li>
      {simpul.tujuan
        ? <a className="simpul" href={`#${idBagian(simpul.tujuan)}`} onClick={kejadian => { kejadian.preventDefault(); keBagian(idBagian(simpul.tujuan!)); }}>
            <span className="nomor-bagian">{angka(nomorTampil(simpul.tujuan))}</span>{isi}
          </a>
        : <span className={akar ? 'simpul akar' : 'simpul'}>{isi}</span>}
      {simpul.anak.length > 0 && <ul>{simpul.anak.map((anak, urutan) => <SimpulPohon key={urutan} simpul={anak} />)}</ul>}
    </li>
  );
}

export function Bandingan({ blok }: { blok: BlokDari<'bandingan'> }) {
  const [kolom, setKolom] = useState(0);
  return (
    <figure className="blok-materi bandingan">
      {blok.judul && <figcaption className="judul-blok">{blok.judul}</figcaption>}
      <div className="segmen" role="group">
        {blok.kolom.map((nama, urutan) => <button key={nama} type="button" aria-pressed={urutan === kolom} onClick={() => setKolom(urutan)}>{nama}</button>)}
      </div>
      <div className="daftar-batang">
        {blok.baris.map(baris => {
          const nilai = baris.nilai[kolom]!;
          const turun = nilaiPecahan(nilai) < nilaiPecahan(baris.nilai[0]!);
          return (
            <div key={baris.nama} className="baris-batang">
              <span>{baris.nama}</span>
              <span className="batang" aria-hidden="true"><span className={nilai.sisa || nilai.sepertigaSisa ? 'isi-batang sisa' : 'isi-batang'} style={{ width: `${lebarBatang(nilai)}%` }} /></span>
              <b className={turun ? 'nilai turun' : 'nilai'}>{teksNilai(nilai)}</b>
            </div>
          );
        })}
      </div>
      {blok.catatan && <p className="keterangan"><Sebaris isi={blok.catatan} /></p>}
    </figure>
  );
}

/** Lebar batang hanya ilustrasi; "sisa" tidak punya ukuran pasti, jadi digambar bergaris di atas bagian pastinya. */
const LEBAR_SISA = 0.25;
const nilaiPecahan = (nilai: NilaiBagian) => (nilai.pecahan ? Number(nilai.pecahan[0]) / Number(nilai.pecahan[1]) : nilai.gugur ? 0 : LEBAR_SISA);
const lebarBatang = (nilai: NilaiBagian) => Math.min(100, (nilaiPecahan(nilai) + (nilai.pecahan && nilai.sisa ? LEBAR_SISA : 0)) * 100);

function teksNilai(nilai: NilaiBagian): string {
  if (nilai.gugur) return t('belajar.gugur');
  if (nilai.sepertigaSisa) return t('belajar.sepertiga_sisa');
  if (!nilai.pecahan) return t('belajar.sisa');
  const pecahan = angka(`${nilai.pecahan[0]}/${nilai.pecahan[1]}`);
  return nilai.sisa ? `${pecahan} + ${t('belajar.sisa')}` : pecahan;
}

export function Ingat({ blok }: { blok: BlokDari<'ingat'> }) {
  return (
    <aside className="ingat">
      <p className="judul-ingat"><Ikon nama="info" ukuran={18} />{blok.judul ?? t('belajar.ingat_judul')}</p>
      <div className="kunci-ingat">
        {blok.butir.map(butir => <span key={butir.kunci}><strong>{butir.kunci}</strong><small><Sebaris isi={butir.penjelasan} /></small></span>)}
      </div>
      {blok.penutup && <p><Sebaris isi={blok.penutup} /></p>}
    </aside>
  );
}

export function Dasar({ blok }: { blok: BlokDari<'dasar'> }) {
  return (
    <p className="dasar">
      <Ikon nama="rujukan" ukuran={16} />
      <span><Sebaris isi={blok.isi} /> {blok.rujukan.map(kode => <ChipDalil key={kode} kode={kode} />)}</span>
    </p>
  );
}

export function Tebak({ blok }: { blok: BlokDari<'tebak'> }) {
  const [terbuka, setTerbuka] = useState(false);
  return (
    <aside className="blok-materi tebak">
      <p className="tanya-tebak"><Sebaris isi={blok.tanya} /></p>
      {terbuka && <p><Sebaris isi={blok.jawab} /></p>}
      <button type="button" className="aksi-teks" aria-expanded={terbuka} onClick={() => setTerbuka(buka => !buka)}>
        {terbuka ? t('belajar.sembunyikan_jawaban') : t('belajar.lihat_jawaban')}
      </button>
    </aside>
  );
}

export function Lipat({ blok, children }: { blok: BlokDari<'lipat'>; children: ReactNode }) {
  return <details className="lipat-materi"><summary>{blok.judul}</summary>{children}</details>;
}

export function Matriks({ blok }: { blok: BlokDari<'matriks'> }) {
  return (
    <div className="matriks" style={{ gridTemplateColumns: `auto repeat(${blok.kolom.length}, minmax(0, 1fr))` }}>
      <span className="kosong" />
      {blok.kolom.map(nama => <span key={nama} className="sumbu">{nama}</span>)}
      {blok.baris.map(baris => [
        <span key={baris.label} className="sumbu kiri">{baris.label}</span>,
        ...baris.sel.map((sel, urutan) => <span key={`${baris.label}-${urutan}`} className="sel"><Sebaris isi={sel} /></span>),
      ])}
    </div>
  );
}
