// Visual linimasa untuk dua tampilan: ubin hitungan harta dan kotak wakil (satu kotak = satu penyebut, dibelah bila penyebutnya besar).
// Warna kotak = warna orang (warnaOrang), supaya sama dengan pohon dan tabel. Semua angka datang dari Visual linimasa.

import type { IdOrang } from '@waris/engine';
import type { BarisHarta, Visual } from '@waris/explain';
import { formatRupiah } from '../format';
import type { RingkasanHasil } from './ringkasan';
import { warnaPeraga } from './warnaOrang';
import { angka, t } from '../terjemah';

/** Riset 29e: kotak dibelah dengan garis hanya sampai sebanyak ini; lebih dari itu cukup label "tiap kotak = n potong". */
const BATAS_POTONG_BERGARIS = 12n;

const JUDUL_HARTA: Record<BarisHarta['kode'], () => string> = {
  kotor: () => t('langkah.harta_kotor'), tajhiz: () => t('langkah.harta_tajhiz'), hutang: () => t('langkah.harta_hutang'),
  wasiat: () => t('langkah.harta_wasiat'), bersih: () => t('langkah.harta_bersih'),
};

export function HartaTabel({ baris, sembunyiNominal }: { baris: BarisHarta[]; sembunyiNominal: boolean }) {
  return (
    <div className="ubin-harta">
      {baris.map(satu => (
        <div key={satu.kode} className={satu.kode === 'bersih' ? 'akhir' : undefined}>
          <span>{JUDUL_HARTA[satu.kode]()}</span><b>{sembunyiNominal ? t('hitung.rp') : formatRupiah(satu.nilai)}</b>
        </div>
      ))}
    </div>
  );
}

type VisualKotak = Extract<Visual, { jenis: 'kotak' }>;

/** `sebutan`: nama lintas mayit dari linimasa (munasakhat); menimpa nama dari ringkasan. */
export function KotakHarta({ visual, ringkasan, sebutan }: { visual: VisualKotak; ringkasan: RingkasanHasil; sebutan?: Record<string, string> | undefined }) {
  const nama = (id: IdOrang) => sebutan?.[id] ?? ringkasan.penerima.find(orang => orang.id === id)?.nama ?? id;
  const jumlah = Number(visual.jumlah), potong = Number(visual.potong);
  const pemilik: IdOrang[] = visual.isi.flatMap(isi => Array.from({ length: Number(isi.jumlah) }, () => isi.anggota[0]!));
  const kotak = Array.from({ length: jumlah }, (_, urut) => pemilik.slice(urut * potong, (urut + 1) * potong));
  const bergaris = visual.potong > 1n && visual.potong <= BATAS_POTONG_BERGARIS;
  const luar = visual.bingkai !== undefined && visual.jumlah > visual.bingkai ? jumlah - Number(visual.bingkai) : 0;
  const hilang = visual.bingkai !== undefined && visual.jumlah < visual.bingkai ? Number(visual.bingkai - visual.jumlah) : 0;
  return (
    <div className="kotak-harta">
      <p className="label-harta">{t('langkah.harta_kotak', { jumlah: angka(String(visual.bingkai ?? visual.jumlah)) })}</p>
      <div className="grid-kotak" style={{ gridTemplateColumns: `repeat(${Math.min(jumlah, 12)}, minmax(0, 1fr))` }}>
        {kotak.map((isi, urut) => (
          <div key={urut} className={['kt', bergaris && 'potong', urut >= jumlah - luar && luar > 0 && 'luar', isi[0] === 'ditahan' && 'ditahan'].filter(Boolean).join(' ')}
            style={bergaris || isi.length === 0 ? undefined : { background: warnaPeraga(ringkasan, isi[0] ?? '', nama(isi[0] ?? '')) }}>
            {bergaris && isi.map((id, bagian) => <span key={bagian} className={id === 'ditahan' ? 'ditahan' : undefined} style={{ background: warnaPeraga(ringkasan, id, nama(id)) }} />)}
          </div>
        ))}
      </div>
      <p className="ket-kotak">
        {visual.isi.map(isi => (
          <span key={isi.kelompok} data-orang={isi.anggota.join(' ')}>
            <i className={isi.anggota[0] === 'ditahan' ? 'ditahan' : undefined} style={{ background: warnaPeraga(ringkasan, isi.anggota[0]!, nama(isi.anggota[0]!)) }} />
            {t('langkah.isi_kotak', { nama: isi.anggota.map(nama).join(' + '), jumlah: angka(String(isi.jumlah)) })}
          </span>
        ))}
        {visual.potong > 1n && <span>{t('langkah.kotak_potong', { potong: angka(String(visual.potong)) })}</span>}
        {luar > 0 && <span>{t('langkah.kotak_luar', { jumlah: angka(String(luar)) })}</span>}
        {hilang > 0 && <span>{t('langkah.kotak_hilang', { jumlah: angka(String(hilang)) })}</span>}
      </p>
    </div>
  );
}
