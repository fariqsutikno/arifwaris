// Hero Beranda: tiga keadaan keluarga yang dihitung engine sungguhan (bukan gambar). Pengguna memilih keadaan, pohon dan
// angkanya berganti. Menerima: saatCoba (buka kasus pilihan di ArifLab). Tidak ada aturan fikih di sini; semua angka dari
// jalankan() + ringkas(), sama persis dengan layar Hasil.

import { useMemo, useState } from 'react';
import { Pohon } from '../../hasil/Pohon';
import { PratinjauPohon } from '../../hasil/PratinjauPohon';
import { PenyediaSorot } from '../../hasil/sorot';
import { persenTeks, ringkas } from '../../hasil/ringkasan';
import { formatRupiahRingkas } from '../../format';
import { jalankan } from '../../jalankan';
import type { Kasus } from '../../kasus';
import { kasusDariContoh } from '../belajar/contoh';
import { Ikon } from '../../ui/Ikon';
import { angka, panah, t } from '../../terjemah';

const HARTA_CONTOH = 240_000_000n;
// Pohon contoh kecil (3-4 orang): boleh diperbesar sampai mengisi kotak hero, bukan mengambang di tengah.
const SKALA_MAKS = 1.5;
// Warna ruas pita bagian, satu per penerima (urutan sama dengan legenda).
const WARNA_RUAS = ['#6ee9b0', '#f6c86a', '#8ec5ff', '#f7a8c4', '#c9a8f7'];

const KEADAAN = [
  { kunci: 'istri-dan-anak', label: () => t('beranda.contoh_istri_dan_anak'), pewaris: 'L', ahliWaris: ['ISTRI', 'ANAK_LK', 'ANAK_PR'] },
  { kunci: 'anak-ibu-saudara', label: () => t('beranda.contoh_anak_ibu_saudara'), pewaris: 'L', ahliWaris: ['ANAK_LK', 'IBU', 'SAUDARA_KANDUNG'] },
  { kunci: 'suami-ibu-saudari', label: () => t('beranda.contoh_suami_ibu_saudari'), pewaris: 'P', ahliWaris: ['SUAMI', 'IBU', 'SAUDARI_KANDUNG'] },
] as const;

export function ContohHidup({ saatCoba }: { saatCoba: (kasus: Kasus) => void }) {
  const [terpilih, setTerpilih] = useState(0);
  const keadaan = KEADAAN[terpilih]!;
  const { kasus, ringkasan } = useMemo(() => {
    const kasusIni = kasusDariContoh({ pewaris: keadaan.pewaris, ahliWaris: [...keadaan.ahliWaris], harta: HARTA_CONTOH, harapan: { saham: {}, ashlAkhir: 0n } });
    return { kasus: kasusIni, ringkasan: ringkas(kasusIni, jalankan(kasusIni)) };
  }, [keadaan]);

  return (
    <div className="hero-pohon contoh-hidup">
      <div role="group" aria-label={t('beranda.keadaan_keluarga')} className="pilih-contoh">
        {KEADAAN.map((pilihan, urutan) => (
          <button key={pilihan.kunci} type="button" aria-pressed={urutan === terpilih} onClick={() => setTerpilih(urutan)}>
            {pilihan.label()}
          </button>
        ))}
      </div>
      <div className="panggung-contoh" key={keadaan.kunci}>
        <PratinjauPohon skalaMaks={SKALA_MAKS}>
          <PenyediaSorot>
            <Pohon graf={kasus.graf} ringkasan={ringkasan} urutanWafat={[]} bentuk="sederhana" sedangMenebak={false} sembunyiNominal={false} saatPilih={() => {}} />
          </PenyediaSorot>
        </PratinjauPohon>
      </div>
      <section className="ringkasan-contoh" key={`ringkasan-${keadaan.kunci}`}>
        <div className="baris-harta">
          <div className="harta-contoh"><span>{t('beranda.stat_harta')}</span><b>{formatRupiahRingkas(HARTA_CONTOH)}</b></div>
          <ul className="penanda-contoh daftar-polos">
            <li><b>{angka(String(ringkasan.penerima.length))}</b>{t('beranda.stat_dapat')}</li>
            {ringkasan.terhalang.length > 0 && <li className="redup"><b>{angka(String(ringkasan.terhalang.length))}</b>{t('beranda.stat_tidak_dapat')}</li>}
          </ul>
        </div>
        <div className="pita-bagian" aria-hidden="true">
          {ringkasan.penerima.map((orang, urutan) => (
            <span key={orang.id} style={{ width: `${Number(orang.saham * 10000n / ringkasan.penyebut) / 100}%`, background: WARNA_RUAS[urutan % WARNA_RUAS.length] }} />
          ))}
        </div>
        <ul className="legenda-pita daftar-polos">
          {ringkasan.penerima.map((orang, urutan) => (
            <li key={orang.id}><i style={{ background: WARNA_RUAS[urutan % WARNA_RUAS.length] }} />{orang.nama}<b>{persenTeks(orang.saham, ringkasan.penyebut)}</b></li>
          ))}
        </ul>
      </section>
      <div className="aksi-contoh">
        <p className="petunjuk-contoh"><Ikon nama="tanya" ukuran={16} />{t('beranda.contoh_petunjuk')}</p>
        <button type="button" className="pil-hero pil-terang" onClick={() => saatCoba(kasus)}>
          <Ikon nama="hitung" ukuran={18} />{t('beranda.coba_kasus_ini')} {panah()}
        </button>
      </div>
    </div>
  );
}
