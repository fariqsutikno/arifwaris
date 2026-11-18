// Pintu "Langkah demi langkah" di panel "Pelajari cara menghitungnya". Kasus yang punya linimasa (biasa, munasakhat, taqdir, gharqa)
// membuka mode Langkah demi langkah (LangkahDemiLangkah). Kasus tanpa linimasa (dzawil arham, taqdir yang menunggu kelahiran)
// memakai daftar bab dari packages/explain di tempat: satu per satu atau semua sekaligus, kanvas menyorot seluruh bab.
// Di mode Belajar, isinya terkunci sampai jawaban terbuka.

import { useEffect, useRef, useState } from 'react';
import type { BarisPenjelasan, Linimasa } from '@waris/explain';
import { Dalil, Baris, type BabBerjudul } from '../layar/Penjelasan';
import { Ikon } from '../ui/Ikon';
import { LangkahDemiLangkah } from './LangkahDemiLangkah';
import { sorotKetukan, type DataPeran } from './ketukan';
import type { RingkasanHasil } from './ringkasan';
import { useSorot } from './sorot';
import type { PeragaBabak } from './urutanLinimasa';
import type { ReactNode } from 'react';
import { angka, t } from '../terjemah';

interface Props {
  daftarBab: BabBerjudul[];
  dataPeran: DataPeran;
  ringkasan: RingkasanHasil;
  sembunyiNominal: boolean;
  /** Mode Belajar sebelum jawaban terbuka: isi langkah belum boleh dilihat. */
  terkunci: boolean;
  adalahBelajar: boolean;
  /** Pohon yang dipakai mode Langkah demi langkah. */
  pohon: ReactNode;
  /** Ada = pintu membuka mode Langkah demi langkah (dengan `babak`: hasil dan ringkasan per tabel). */
  linimasa: Linimasa | null;
  babak: PeragaBabak[] | null;
}

/** Deret langkah tanpa scrollbar: tepi yang masih menyimpan pill memudar, tanda bahwa deret bisa digeser. */
const tandaiTepi = (wadah: HTMLElement) => {
  wadah.dataset.kiri = angka(String(wadah.scrollLeft > 1));
  wadah.dataset.kanan = angka(String(wadah.scrollLeft + wadah.clientWidth < wadah.scrollWidth - 1));
};

const tanpaNomor = (judul: string) => judul.replace(/^(Langkah|الخطوة) \S+ — /, '');

export function KartuLangkah({ daftarBab, dataPeran, ringkasan, sembunyiNominal, terkunci, adalahBelajar, pohon, linimasa, babak }: Props) {
  const [terbuka, setTerbuka] = useState(false);
  const [modeBaru, setModeBaru] = useState(false);
  const [mode, setMode] = useState<'satu' | 'semua'>('satu');
  const [indeks, setIndeks] = useState(0);
  const [dibaca, setDibaca] = useState<Set<number>>(new Set([0]));
  const { setLangkah } = useSorot();
  const babIni = daftarBab[indeks];
  const jalur = useRef<HTMLElement>(null);
  const pakaiModeBaru = !!linimasa && !!babak && !terkunci;
  const bisaMenyorot = terbuka && !terkunci && mode === 'satu';

  // Pill langkah aktif selalu terlihat di tengah deret, tanpa pengguna perlu menggeser.
  useEffect(() => {
    const wadah = jalur.current;
    const aktif = wadah?.querySelector<HTMLElement>('[aria-current="step"]');
    if (wadah && aktif) wadah.scrollLeft = aktif.offsetLeft - (wadah.clientWidth - aktif.offsetWidth) / 2;
    if (wadah) tandaiTepi(wadah);
  }, [indeks, terbuka, mode]);

  useEffect(() => {
    setLangkah(bisaMenyorot && babIni ? sorotKetukan(babIni.bab, null, dataPeran, 0) : null);
  }, [bisaMenyorot, babIni, dataPeran, setLangkah]);
  useEffect(() => () => setLangkah(null), [setLangkah]);

  const keLangkah = (tujuan: number) => {
    if (tujuan >= daftarBab.length) { setTerbuka(false); return; }
    setIndeks(tujuan);
    setDibaca(new Set([...dibaca, tujuan]));
  };

  return (
    <div className="urut-langkah" data-tur="langkah">
      <button type="button" className="kepala-lipat" aria-expanded={pakaiModeBaru ? modeBaru : terbuka} aria-haspopup={pakaiModeBaru ? 'dialog' : undefined} onClick={() => (pakaiModeBaru ? setModeBaru(true) : setTerbuka(!terbuka))}>
        <span className="ikon-bulat"><Ikon nama="daftar" /></span>
        <span className="judul-pintu"><b>{adalahBelajar ? t('hitung.pembahasan_langkah_demi_langkah') : t('hasil.langkah_demi_langkah')}</b><small>{t('hasil.langkah_demi_langkah_sub')}</small></span>
        {terkunci && <span className="lencana-kunci"><Ikon nama="kunci" ukuran={14} /> {t('umum.terkunci')}</span>}
        <span className="panah-lipat" aria-hidden="true" />
      </button>
      {modeBaru && linimasa && babak && <LangkahDemiLangkah linimasa={linimasa} babak={babak} ringkasanAkhir={ringkasan} sembunyiNominal={sembunyiNominal} pohon={pohon} saatTutup={() => setModeBaru(false)} />}
      {terbuka && (terkunci ? (
        <div className="isi-kartu-sisi">
          <div className="langkah-terkunci">
            <b>{t('hitung.jawab_soalnya_dulu')}</b>
            <p>{t('hitung.langkah_perhitungan_terbuka_setelah_jawabanmu_di')} <i>{t('hitung.jawabanmu')}</i> {t('hitung.benar_atau_setelah_kamu_membuka_jawabannya')}</p>
          </div>
        </div>
      ) : (
        <div className="isi-kartu-sisi">
          <div className="alat-langkah">
            <div className="tab-kecil" role="group" aria-label={t('hitung.cara_tampil')}>
              <button type="button" aria-pressed={mode === 'satu'} onClick={() => setMode('satu')}>{t('hitung.langkah_demi_langkah')}</button>
              <button type="button" aria-pressed={mode === 'semua'} onClick={() => setMode('semua')}>{t('hitung.tampilkan_semua')}</button>
            </div>
          </div>
          {mode === 'semua'
            ? daftarBab.map((bab, nomor) => <KartuSatuLangkah key={nomor} nomor={nomor} total={daftarBab.length} babBerjudul={bab} />)
            : babIni && (
              <>
                <nav className="jalur-langkah" aria-label={t('hitung.langkah')} ref={jalur} onScroll={event => tandaiTepi(event.currentTarget)}>
                  {daftarBab.map((bab, nomor) => (
                    <button key={nomor} type="button" aria-current={nomor === indeks ? 'step' : undefined}
                      className={dibaca.has(nomor) && nomor !== indeks ? 'kelar' : undefined} onClick={() => keLangkah(nomor)}>
                      <b aria-hidden="true">{dibaca.has(nomor) && nomor !== indeks ? '✓' : nomor + 1}</b><span>{tanpaNomor(bab.bab.judul)}</span>
                    </button>
                  ))}
                </nav>
                <KartuSatuLangkah nomor={indeks} total={daftarBab.length} babBerjudul={babIni} />
                <div className="nav-langkah">
                  <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" disabled={indeks === 0} onClick={() => keLangkah(indeks - 1)}>{t('umum.sebelumnya')}</button>
                  <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" onClick={() => keLangkah(indeks + 1)}>
                    {indeks === daftarBab.length - 1 ? t('langkah.selesai') : t('umum.berikutnya')}
                  </button>
                </div>
              </>
            )}
        </div>
      ))}
    </div>
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

function KartuSatuLangkah({ nomor, total, babBerjudul }: { nomor: number; total: number; babBerjudul: BabBerjudul }) {
  const [kenapaTerbuka, setKenapaTerbuka] = useState(false);
  const { bab, judulBagian } = babBerjudul;
  const refs = [...new Set(bab.daftarBaris.flatMap(baris => baris.refs))];
  const baris = ({ baris: isi, nomor: nomorBaris }: { baris: BarisPenjelasan; nomor: number }) => (
    <li key={nomorBaris}>
      <Baris baris={isi} />
    </li>
  );
  return (
    <article className="kartu-langkah">
      <p className="ke-langkah">Langkah {nomor + 1} dari {total}{judulBagian ? ` · ${judulBagian}` : ''}</p>
      <h3>{bab.judul}</h3>
      <div className="kelompok-langkah">
        {kelompokkan(bab.daftarBaris).map((kelompok, urutan) => kelompok.jenis === 'perhatian' ? (
          <div key={urutan} className="kotak-perhatian" role="note">
            <p className="label-perhatian">{t('hitung.perlu_diperhatikan')}</p>
            <p><Baris baris={kelompok.isi[0]!.baris} /></p>
          </div>
        ) : (
          <div key={urutan}>
            {kelompok.judul && <p className="subjudul-langkah"><Baris baris={kelompok.judul} /></p>}
            {kelompok.isi.length > 0 && <ul>{kelompok.isi.map(baris)}</ul>}
          </div>
        ))}
      </div>
      {refs.length > 0 && (
        <div className="kenapa">
          <button type="button" aria-expanded={kenapaTerbuka} onClick={() => setKenapaTerbuka(!kenapaTerbuka)}>{t('umum.kenapa_begitu')}</button>
          {kenapaTerbuka && <div className="isi-kenapa"><Dalil daftarKode={refs} /></div>}
        </div>
      )}
    </article>
  );
}
