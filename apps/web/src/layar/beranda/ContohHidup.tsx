// Hero Beranda: tiga keadaan keluarga yang dihitung engine sungguhan (bukan gambar). Pengguna memilih keadaan, pohon dan
// angkanya berganti. Menerima: saatCoba (buka kasus pilihan di ArifLab). Tidak ada aturan fikih di sini; semua angka dari
// jalankan() + ringkas(), sama persis dengan layar Hasil.

import { useMemo, useState } from 'react';
import { Pohon } from '../../hasil/Pohon';
import { PratinjauPohon } from '../../hasil/PratinjauPohon';
import { PenyediaSorot } from '../../hasil/sorot';
import { ringkas } from '../../hasil/ringkasan';
import { formatRupiahRingkas } from '../../format';
import { jalankan } from '../../jalankan';
import { TAUTAN_KALKULATOR } from '../../rute';
import type { Kasus } from '../../kasus';
import { kasusDariContoh } from '../belajar/contoh';
import { Ikon } from '../../ui/Ikon';
import { angka, panah, t } from '../../terjemah';

const HARTA_CONTOH = 240_000_000n;
// Pohon contoh kecil (3-4 orang): boleh diperbesar sampai mengisi kotak hero, bukan mengambang di tengah.
const SKALA_MAKS = 1.5;

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
        <PratinjauPohon saatBuka={() => saatCoba(kasus)} label={t('beranda.coba_kasus_ini')} skalaMaks={SKALA_MAKS}>
          <PenyediaSorot>
            <Pohon graf={kasus.graf} ringkasan={ringkasan} urutanWafat={[]} bentuk="sederhana" sedangMenebak={false} sembunyiNominal={false} saatPilih={() => {}} />
          </PenyediaSorot>
        </PratinjauPohon>
      </div>
      <div className="kaki-pohon kaki-contoh">
        <dl className="statistik-hero">
          <div><dt>{t('beranda.stat_harta')}</dt><dd>{formatRupiahRingkas(HARTA_CONTOH)}</dd></div>
          <div><dt>{t('beranda.stat_dapat')}</dt><dd>{angka(String(ringkasan.penerima.length))}</dd></div>
          {ringkasan.terhalang.length > 0 && <div><dt>{t('beranda.stat_tidak_dapat')}</dt><dd>{angka(String(ringkasan.terhalang.length))}</dd></div>}
        </dl>
        <a className="tautan-hero" href={TAUTAN_KALKULATOR} onClick={event => { event.preventDefault(); saatCoba(kasus); }}>
          {t('beranda.coba_kasus_ini')} {panah()}
        </a>
      </div>
      <p className="petunjuk-contoh"><Ikon nama="tanya" ukuran={16} />{t('beranda.contoh_petunjuk')}</p>
    </div>
  );
}
