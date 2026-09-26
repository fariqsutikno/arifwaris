// Pelajari langkah perhitungan: bab dari packages/explain, satu per satu (deret tahap horizontal + Sebelumnya/Berikutnya)
// atau semua sekaligus. Di kartu biasa, kanvas menyorot seluruh bab sekaligus (tanpa sorot per baris). Mode fokus membuka
// langkah yang sama dalam layar penuh bersama pohon dan tabel. Dengan animasi menyala, langkah maju per sub-langkah
// (satu baris penjelasan: 4a, 4b, ...) hanya lewat tombol Lanjut, dan animasi sub-langkah itu diulang terus sampai
// pelajar maju atau menjedanya. Dengan animasi mati, tiap langkah langsung tampil utuh. Di mode Belajar, isinya terkunci
// sampai jawaban terbuka.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { BarisPenjelasan } from '@waris/explain';
import type { HasilOk } from '../jalankan';
import { Dalil, Baris, type BabBerjudul } from '../layar/Penjelasan';
import { Ikon } from '../ui/Ikon';
import { TombolIkon } from '../ui/Tooltip';
import { FokusLangkah, PanelHitung } from './FokusLangkah';
import { kolomTerbukaSampai, sorotKetukan, type DataPeran } from './ketukan';
import { durasiPutaran, peragaKetukan, tundaSelDari } from './peraga';
import type { RingkasanHasil } from './ringkasan';
import { useSorot } from './sorot';

interface Props {
  daftarBab: BabBerjudul[];
  dataPeran: DataPeran;
  hasil: HasilOk | null;
  ringkasan: RingkasanHasil;
  sembunyiNominal: boolean;
  /** Mode Belajar sebelum jawaban terbuka: isi langkah belum boleh dilihat. */
  terkunci: boolean;
  adalahBelajar: boolean;
  kanvas: { pohon: ReactNode; tabel: ReactNode };
}

const geraknyaDikurangi = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Deret langkah tanpa scrollbar: tepi yang masih menyimpan pill memudar, tanda bahwa deret bisa digeser. */
const tandaiTepi = (wadah: HTMLElement) => {
  wadah.dataset.kiri = String(wadah.scrollLeft > 1);
  wadah.dataset.kanan = String(wadah.scrollLeft + wadah.clientWidth < wadah.scrollWidth - 1);
};

/** "4b" untuk baris kedua langkah 4; langkah yang hanya satu baris cukup "4". */
export const labelSubLangkah = (nomorBab: number, ketukan: number | null, jumlahBaris: number) =>
  `Langkah ${nomorBab + 1}${ketukan !== null && jumlahBaris > 1 ? String.fromCharCode(97 + ketukan) : ''}`;

export function KartuLangkah({ daftarBab, dataPeran, hasil, ringkasan, sembunyiNominal, terkunci, adalahBelajar, kanvas }: Props) {
  const [terbuka, setTerbuka] = useState(false);
  const [mode, setMode] = useState<'satu' | 'semua'>('satu');
  const [indeks, setIndeks] = useState(0);
  const [dibaca, setDibaca] = useState<Set<number>>(new Set([0]));
  const [fokus, setFokus] = useState(false);
  // Mode fokus: sub-langkah yang sedang dibahas; selesai = semua langkah sudah diikuti (tabel terbuka penuh).
  const [poin, setPoin] = useState(0);
  const [selesai, setSelesai] = useState(false);
  const [putaran, setPutaran] = useState(0);
  const [animasi, setAnimasi] = useState(() => !geraknyaDikurangi());
  const [dijeda, setDijeda] = useState(false);
  const [laciTerbuka, setLaciTerbuka] = useState(false);
  const { setLangkah } = useSorot();
  const babIni = daftarBab[indeks];
  const jumlahPoin = babIni?.bab.daftarBaris.length ?? 0;
  const jalur = useRef<HTMLElement>(null);
  const bisaMenyorot = (terbuka || fokus) && !terkunci && mode === 'satu';
  const ketukan = fokus && !selesai && animasi ? poin : null;
  const peraga = babIni && !sembunyiNominal ? peragaKetukan(babIni.bab, ketukan, hasil, ringkasan) : null;
  const lamaPutaran = durasiPutaran(peraga);
  // Judul bab dari explain sudah bernomor ("Langkah 4 — ..."); mode fokus menulis nomornya sendiri (4a, 4b).
  const judulFokus = babIni?.bab.judul.replace(/^(Langkah|الخطوة) \S+ — /, '') ?? '';

  // Pill langkah aktif selalu terlihat di tengah deret, tanpa pengguna perlu menggeser.
  useEffect(() => {
    const wadah = jalur.current;
    const aktif = wadah?.querySelector<HTMLElement>('[aria-current="step"]');
    if (wadah && aktif) wadah.scrollLeft = aktif.offsetLeft - (wadah.clientWidth - aktif.offsetWidth) / 2;
    if (wadah) tandaiTepi(wadah);
  }, [indeks, terbuka, mode, fokus, laciTerbuka]);

  useEffect(() => {
    if (!bisaMenyorot || !babIni) { setLangkah(null); return; }
    const tundaSel = tundaSelDari(peraga);
    setLangkah({
      ...sorotKetukan(babIni.bab, ketukan, dataPeran, putaran),
      ...(tundaSel ? { tundaSel } : {}),
      ...(fokus ? { kolomTerbuka: kolomTerbukaSampai(daftarBab.map(bab => bab.bab), selesai ? daftarBab.length - 1 : indeks) } : {}),
    });
    // peraga dihitung ulang tiap render; isinya hanya bergantung pada bab, ketukan, dan data di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bisaMenyorot, fokus, selesai, babIni, ketukan, putaran, dataPeran, daftarBab, indeks, setLangkah, hasil, ringkasan, sembunyiNominal]);
  useEffect(() => () => setLangkah(null), [setLangkah]);

  // Animasi sub-langkah diulang terus selama sub-langkah itu tampil; berganti hanya saat pelajar maju/mundur.
  useEffect(() => {
    if (ketukan === null || dijeda) return;
    const waktu = window.setInterval(() => setPutaran(nilai => nilai + 1), lamaPutaran);
    return () => window.clearInterval(waktu);
  }, [ketukan, indeks, dijeda, lamaPutaran]);

  const putarLagi = () => setPutaran(nilai => nilai + 1);
  const keLangkah = (tujuan: number, poinAwal = 0) => {
    if (tujuan >= daftarBab.length) { setFokus(false); setTerbuka(false); return; }
    setIndeks(tujuan);
    setPoin(poinAwal);
    setSelesai(false);
    setDibaca(new Set([...dibaca, tujuan]));
    putarLagi();
  };
  const bukaFokus = () => {
    setMode('satu'); setPoin(0); setSelesai(false); putarLagi(); setFokus(true);
  };
  const lanjut = () => {
    if (animasi && poin + 1 < jumlahPoin) { setPoin(poin + 1); putarLagi(); }
    else if (indeks + 1 < daftarBab.length) keLangkah(indeks + 1);
    else { setSelesai(true); putarLagi(); }
  };
  const kembali = () => {
    if (selesai) { setSelesai(false); putarLagi(); }
    else if (animasi && poin > 0) { setPoin(poin - 1); putarLagi(); }
    else if (indeks > 0) keLangkah(indeks - 1, animasi ? daftarBab[indeks - 1]!.bab.daftarBaris.length - 1 : 0);
  };
  const aturAnimasi = (nyala: boolean) => { setAnimasi(nyala); setDijeda(false); setPoin(0); putarLagi(); };

  const jalurLangkah = (
    <nav className="jalur-langkah" aria-label="Langkah" ref={jalur} onScroll={event => tandaiTepi(event.currentTarget)}>
      {daftarBab.map((bab, nomor) => (
        <button key={nomor} type="button" aria-current={nomor === indeks ? 'step' : undefined}
          className={dibaca.has(nomor) && nomor !== indeks ? 'kelar' : undefined} onClick={() => keLangkah(nomor)}>
          <b aria-hidden="true">{dibaca.has(nomor) && nomor !== indeks ? '✓' : nomor + 1}</b><span>{bab.bab.judul.replace(/^(Langkah|الخطوة) \S+ — /, '')}</span>
        </button>
      ))}
    </nav>
  );
  const navigasi = (
    <div className="nav-langkah">
      <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" disabled={indeks === 0} onClick={() => keLangkah(indeks - 1)}>← Sebelumnya</button>
      <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" onClick={() => keLangkah(indeks + 1)}>
        {indeks === daftarBab.length - 1 ? 'Selesai' : 'Berikutnya →'}
      </button>
    </div>
  );
  const navigasiFokus = (
    <div className="nav-langkah nav-fokus">
      <button type="button" className="aw-btn aw-btn-ghost" disabled={!selesai && indeks === 0 && (poin === 0 || !animasi)} onClick={kembali}>← Kembali</button>
      {selesai
        ? <button type="button" className="aw-btn aw-btn-primary" onClick={() => setFokus(false)}>Tutup mode fokus</button>
        : <button type="button" className="aw-btn aw-btn-primary" onClick={lanjut}>Lanjut →</button>}
    </div>
  );
  const kontrolFokus = (
    <>
      <button type="button" role="switch" aria-checked={animasi} className="saklar-animasi" onClick={() => aturAnimasi(!animasi)} title={animasi ? 'Matikan animasi' : 'Nyalakan animasi'}>
        <span className="rel-saklar" aria-hidden="true" />Animasi
      </button>
      {animasi && (
        <button type="button" className="tombol-ikon" onClick={() => setDijeda(!dijeda)} aria-label={dijeda ? 'Putar animasi' : 'Jeda animasi'} title={dijeda ? 'Putar' : 'Jeda'}>
          <Ikon nama={dijeda ? 'putar' : 'jeda'} />
        </button>
      )}
      <button type="button" className="tombol-ikon" aria-pressed={laciTerbuka} onClick={() => setLaciTerbuka(!laciTerbuka)} aria-label="Daftar langkah" title="Daftar langkah">
        <Ikon nama="daftar" />
      </button>
    </>
  );
  const langkahIni = (ketukanTampil: number | null, saatPilihBaris?: (baris: number) => void) => babIni && (
    <KartuSatuLangkah nomor={indeks} total={daftarBab.length} babBerjudul={babIni} ketukan={ketukanTampil} saatPilihBaris={saatPilihBaris} />
  );

  return (
    <section className="kartu-sisi urut-langkah" data-tur="langkah">
      <button type="button" className="kepala-lipat" aria-expanded={terbuka} onClick={() => setTerbuka(!terbuka)}>
        <h2>{adalahBelajar ? 'Pembahasan langkah demi langkah' : 'Pelajari langkah perhitungan'}</h2>
        {terkunci && <span className="lencana-kunci"><Ikon nama="kunci" ukuran={14} /> Terkunci</span>}
        <span className="panah-lipat" aria-hidden="true" />
      </button>
      {terbuka && (terkunci ? (
        <div className="isi-kartu-sisi">
          <div className="langkah-terkunci">
            <b>Jawab soalnya dulu</b>
            <p>Langkah perhitungan terbuka setelah jawabanmu di kartu <i>Jawabanmu</i> benar, atau setelah kamu membuka jawabannya.
              Coba hitung sendiri dulu, lalu cocokkan caranya di sini.</p>
          </div>
        </div>
      ) : (
        <div className="isi-kartu-sisi">
          <div className="alat-langkah">
            <div className="tab-kecil" role="group" aria-label="Cara tampil">
              <button type="button" aria-pressed={mode === 'satu'} onClick={() => setMode('satu')}>Langkah demi langkah</button>
              <button type="button" aria-pressed={mode === 'semua'} onClick={() => setMode('semua')}>Tampilkan semua</button>
            </div>
            <TombolIkon label="Mode fokus" onClick={bukaFokus}><Ikon nama="fokus" /></TombolIkon>
          </div>
          {mode === 'semua'
            ? daftarBab.map((bab, nomor) => <KartuSatuLangkah key={nomor} nomor={nomor} total={daftarBab.length} babBerjudul={bab} ketukan={null} />)
            : babIni && <>{jalurLangkah}{langkahIni(null)}{navigasi}</>}
        </div>
      ))}
      {fokus && !terkunci && babIni && (
        <FokusLangkah judul={judulFokus} nomor={indeks} kolom={babIni.bab.kolom} kanvas={kanvas} saatTutup={() => setFokus(false)}
          kontrol={kontrolFokus} dijeda={dijeda && ketukan !== null} navigasi={navigasiFokus}
          atasTabel={<PanelHitung key={putaran} posisi={`Langkah ${indeks + 1} dari ${daftarBab.length}`} label={labelSubLangkah(indeks, ketukan, jumlahPoin)} judul={judulFokus} selesai={selesai}
            baris={ketukan === null ? null : babIni.bab.daftarBaris[ketukan] ?? null} semuaBaris={babIni.bab.daftarBaris} peraga={peraga} />}
          laci={laciTerbuka ? <>{jalurLangkah}{langkahIni(ketukan, baris => { setPoin(baris); setSelesai(false); putarLagi(); })}</> : null} />
      )}
    </section>
  );
}

/**
 * Baris dikelompokkan supaya informasi tidak bercampur: subjudul membuka daftar di bawahnya, dan baris "perhatian"
 * (sesuatu yang perlu disikapi pembaca, mis. selisih pembulatan) masuk kotak tersendiri.
 */
type Kelompok = { jenis: 'daftar' | 'perhatian'; judul?: BarisPenjelasan; isi: Array<{ baris: BarisPenjelasan; nomor: number }> };

function kelompokkan(daftarBaris: BarisPenjelasan[]): Kelompok[] {
  const hasil: Kelompok[] = [];
  daftarBaris.forEach((baris, nomor) => {
    const terakhir = hasil[hasil.length - 1];
    if (baris.penekanan === 'subjudul') hasil.push({ jenis: 'daftar', judul: baris, isi: [] });
    else if (baris.penekanan === 'perhatian') hasil.push({ jenis: 'perhatian', isi: [{ baris, nomor }] });
    else if (terakhir?.jenis === 'daftar') terakhir.isi.push({ baris, nomor });
    else hasil.push({ jenis: 'daftar', isi: [{ baris, nomor }] });
  });
  return hasil;
}

function KartuSatuLangkah({ nomor, total, babBerjudul, ketukan, saatPilihBaris }: {
  nomor: number; total: number; babBerjudul: BabBerjudul; ketukan: number | null; saatPilihBaris?: ((baris: number) => void) | undefined;
}) {
  const [kenapaTerbuka, setKenapaTerbuka] = useState(false);
  const { bab, judulBagian } = babBerjudul;
  const refs = [...new Set(bab.daftarBaris.flatMap(baris => baris.refs))];
  const indeksSubjudul = (baris: BarisPenjelasan) => bab.daftarBaris.indexOf(baris);
  const kelasBaris = (nomorBaris: number) =>
    ketukan === null ? undefined : nomorBaris === ketukan ? 'ketukan-kini' : nomorBaris > ketukan ? 'ketukan-nanti' : 'ketukan-lewat';
  const baris = ({ baris: isi, nomor: nomorBaris }: { baris: BarisPenjelasan; nomor: number }) => (
    <li key={nomorBaris} className={kelasBaris(nomorBaris)} onClick={saatPilihBaris ? () => saatPilihBaris(nomorBaris) : undefined}>
      {kelasBaris(nomorBaris) === 'ketukan-nanti' ? <span className="baris-rahasia" aria-label="belum dibahas">?</span> : <Baris baris={isi} />}
    </li>
  );
  return (
    <article className="kartu-langkah">
      <p className="ke-langkah">Langkah {nomor + 1} dari {total}{judulBagian ? ` · ${judulBagian}` : ''}</p>
      <h3>{bab.judul}</h3>
      <div className="kelompok-langkah">
        {kelompokkan(bab.daftarBaris).map((kelompok, urutan) => kelompok.jenis === 'perhatian' ? (
          <div key={urutan} className={['kotak-perhatian', kelasBaris(kelompok.isi[0]!.nomor)].filter(Boolean).join(' ')} role="note">
            <p className="label-perhatian">Perlu diperhatikan</p>
            <p>{kelasBaris(kelompok.isi[0]!.nomor) === 'ketukan-nanti' ? '?' : <Baris baris={kelompok.isi[0]!.baris} />}</p>
          </div>
        ) : (
          <div key={urutan}>
            {kelompok.judul && <p className={['subjudul-langkah', kelasBaris(indeksSubjudul(kelompok.judul))].filter(Boolean).join(' ')}>
              {kelasBaris(indeksSubjudul(kelompok.judul)) === 'ketukan-nanti' ? '?' : <Baris baris={kelompok.judul} />}</p>}
            {kelompok.isi.length > 0 && <ul>{kelompok.isi.map(baris)}</ul>}
          </div>
        ))}
      </div>
      {refs.length > 0 && (
        <div className="kenapa">
          <button type="button" aria-expanded={kenapaTerbuka} onClick={() => setKenapaTerbuka(!kenapaTerbuka)}>Kenapa begitu?</button>
          {kenapaTerbuka && <div className="isi-kenapa"><Dalil daftarKode={refs} /></div>}
        </div>
      )}
    </article>
  );
}
