// Langkah 2: total harta peninggalan. Dua cara isi (total langsung / rinci per jenis) di atas nilai yang sama,
// tombol tambah cepat kecil, dan card Pembulatan yang tertutup dengan contoh akibat tiap pilihan.

import { useState } from 'react';
import { formatRupiah } from '../../format';
import { KATEGORI_HARTA, type Kasus, type KategoriHarta } from '../../kasus';
import { KATEGORI_HARTA_TEKS, PILIHAN_PEMBULATAN, TEKS_HARTA, TEKS_PEMBULATAN } from '../../konten/harta';
import { IsianUang } from './IsianUang';

interface Props { kasus: Kasus; ubah: (fungsiUbah: (kasus: Kasus) => Kasus) => void }

const labelTambahCepat = (nilai: bigint) => `+${nilai / 1_000_000n} jt`;

export function LangkahHarta({ kasus, ubah }: Props) {
  const [cara, setCara] = useState<'total' | 'rinci'>(kasus.rincianHarta ? 'rinci' : 'total');
  const aturTotal = (kotor: bigint) => ubah(k => {
    const { rincianHarta: _rincian, ...tanpaRincian } = k;
    return { ...tanpaRincian, tirkah: { ...k.tirkah, kotor } };
  });
  const aturRincian = (kategori: KategoriHarta, jumlah: bigint) => ubah(k => {
    const rincianHarta = { ...k.rincianHarta, [kategori]: jumlah };
    if (jumlah === 0n) delete rincianHarta[kategori];
    const kotor = Object.values(rincianHarta).reduce((total, nilai) => total + nilai, 0n);
    return { ...k, rincianHarta, tirkah: { ...k.tirkah, kotor } };
  });

  return (
    <>
      <div className="tab-kecil" role="tablist" aria-label="Cara mengisi harta">
        <button type="button" role="tab" aria-selected={cara === 'total'} onClick={() => setCara('total')}>Total langsung</button>
        <button type="button" role="tab" aria-selected={cara === 'rinci'} onClick={() => setCara('rinci')}>Rinci per jenis</button>
      </div>

      {cara === 'total' ? (
        <div className="tumpuk-rapat">
          <IsianUang id="harta-total" label="Total harta peninggalan" besar nilai={kasus.tirkah.kotor} saatUbah={aturTotal}
            keterangan={TEKS_HARTA.presisi} />
          <div className="tambah-cepat" aria-label="Tambah cepat">
            <span className="caption-isian">Tambah cepat:</span>
            {TEKS_HARTA.tambahCepat.map(nilai => (
              <button key={String(nilai)} type="button" className="chip-kecil" onClick={() => aturTotal(kasus.tirkah.kotor + nilai)}>
                {labelTambahCepat(nilai)}
              </button>
            ))}
            {kasus.tirkah.kotor > 0n && <button type="button" className="chip-kecil hapus" onClick={() => aturTotal(0n)}>Kosongkan</button>}
          </div>
        </div>
      ) : (
        <div className="rincian-harta">
          {KATEGORI_HARTA.map(kategori => (
            <IsianUang key={kategori} id={`harta-${kategori}`} label={KATEGORI_HARTA_TEKS[kategori].label}
              nilai={kasus.rincianHarta?.[kategori] ?? 0n} saatUbah={jumlah => aturRincian(kategori, jumlah)}
              keterangan={KATEGORI_HARTA_TEKS[kategori].contoh} />
          ))}
          <div className="total-rincian"><span>Total harta peninggalan</span><b>{formatRupiah(kasus.tirkah.kotor)}</b></div>
        </div>
      )}

      <p className="caption-isian">{TEKS_HARTA.gonoGini}</p>
      <KartuPembulatan kasus={kasus} ubah={ubah} />
    </>
  );
}

function KartuPembulatan({ kasus, ubah }: Props) {
  const terpilih = PILIHAN_PEMBULATAN.find(pilihan => pilihan.satuan === kasus.satuanPembulatan) ?? PILIHAN_PEMBULATAN[0];
  return (
    <details className="kartu-lipat">
      <summary>
        <span className="judul-lipat">{TEKS_PEMBULATAN.judul}</span>
        <span className="ringkas-lipat">Dibulatkan ke {terpilih.judul} (bisa diubah)</span>
      </summary>
      <div className="isi-lipat">
        <p className="caption-isian">{TEKS_PEMBULATAN.apa}</p>
        <div className="pilihan-bulat" role="radiogroup" aria-label="Bulatkan bagian tiap orang ke">
          {PILIHAN_PEMBULATAN.map(pilihan => (
            <button key={String(pilihan.satuan)} type="button" role="radio" aria-checked={pilihan.satuan === kasus.satuanPembulatan}
              onClick={() => ubah(k => ({ ...k, satuanPembulatan: pilihan.satuan }))}>
              <b>{pilihan.judul}</b><small>{pilihan.keterangan}</small>
            </button>
          ))}
        </div>
        <ContohPembulatan satuan={kasus.satuanPembulatan} />
      </div>
    </details>
  );
}

/** Contoh tetap Rp 100.000 dibagi rata 3 orang, supaya akibat tiap pilihan kelihatan. */
function ContohPembulatan({ satuan }: { satuan: bigint }) {
  const harta = 100_000n, orang = 3n;
  const perOrang = (harta / orang / satuan) * satuan;
  const sisa = harta - perOrang * orang;
  return (
    <p className="contoh-bulat">
      <b>Contoh:</b> Rp 100.000 dibagi rata 3 orang → tiap orang {formatRupiah(perOrang)}, sisa {formatRupiah(sisa)} disepakati bersama.
    </p>
  );
}
