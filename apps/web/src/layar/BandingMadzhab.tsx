// Panel "Kata madzhab lain" (mode Belajar, setelah jawaban dibuka): kasus yang sama dihitung di keempat madzhab,
// hanya orang yang nominalnya berbeda yang ditampilkan. Judul kolom menjadikan madzhab itu hasil utama.
// Tidak dirender bila ada hasil yang bukan OK atau tidak ada orang yang berbeda.

import { useMemo } from 'react';
import type { Ruleset } from '@waris/engine';
import { formatRupiah } from '../format';
import { jalankan } from '@waris/latihan';
import type { Kasus } from '../kasus';
import { ringkas } from '../hasil/ringkasan';
import { t } from '../terjemah';
import { namaMadzhab } from './DialogMadzhab';

const DAFTAR_MADZHAB: Ruleset[] = ['syafii', 'hanbali', 'hanafi', 'maliki'];

interface Baris { id: string; nama: string; nominal: bigint[] }

function hitungBaris(kasus: Kasus): Baris[] | null {
  const perMadzhab = DAFTAR_MADZHAB.map(madzhab => {
    const tampil = jalankan({ ...kasus, madzhab });
    return tampil.jenis === 'biasa' && tampil.hasil.status === 'OK' ? ringkas(kasus, tampil).penerima : null;
  });
  if (perMadzhab.some(penerima => penerima === null)) return null;
  const nama = new Map<string, string>();
  for (const penerima of perMadzhab) for (const orang of penerima ?? []) nama.set(orang.id, orang.nama);
  return [...nama].map(([id, namaOrang]) => ({
    id, nama: namaOrang,
    nominal: perMadzhab.map(penerima => penerima?.find(orang => orang.id === id)?.nominal ?? 0n),
  })).filter(baris => baris.nominal.some(nilai => nilai !== baris.nominal[0]));
}

interface Props { kasus: Kasus; aktif: Ruleset; saatPilih: (ruleset: Ruleset) => void; sembunyiNominal: boolean }

export function BandingMadzhab({ kasus, aktif, saatPilih, sembunyiNominal }: Props) {
  const baris = useMemo(() => hitungBaris(kasus), [kasus]);
  if (!baris || baris.length === 0) return null;
  return (
    <section className="kartu-sisi banding-madzhab" aria-labelledby="judul-banding-madzhab">
      <h2 id="judul-banding-madzhab">{t('hitung.banding_madzhab_judul')}</h2>
      <div className="gulir-banding">
        <table>
          <thead>
            <tr>
              <th scope="col">{t('hitung.banding_madzhab_orang')}</th>
              {DAFTAR_MADZHAB.map(ruleset => (
                <th key={ruleset} scope="col" className={ruleset === aktif ? 'aktif' : undefined}>
                  <button type="button" className="tautan-aksi" onClick={() => saatPilih(ruleset)}>{namaMadzhab(ruleset)}</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.map(({ id, nama, nominal }) => (
              <tr key={id}>
                <th scope="row">{nama}</th>
                {nominal.map((nilai, indeks) => (
                  <td key={DAFTAR_MADZHAB[indeks]} className={DAFTAR_MADZHAB[indeks] === aktif ? 'aktif' : undefined}>
                    {nilai === 0n ? '—' : sembunyiNominal ? t('hitung.rp') : formatRupiah(nilai)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="catatan-madzhab">{t('hitung.banding_madzhab_sumber_kitab')}</p>
    </section>
  );
}
