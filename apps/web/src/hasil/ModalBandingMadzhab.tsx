// Panel perbandingan madzhab di layar Hasil: baris = ahli waris, kolom = madzhab. Baris yang berbeda ditandai; madzhab yang tidak
// bisa dihitung ditulis jujur ("Belum dikaji"), tanpa angka. "Di titik mana berbeda" (matriks khilaf bab 18) terlipat untuk praktisi.
// Memilih madzhab lain mengganti Kasus.ruleset dan menghitung ulang; yang tersimpan tidak berubah sampai dipilih.

import { useEffect, useRef } from 'react';
import { DAFTAR_RULESET, type Ruleset } from '@waris/engine';
import { formatRupiah, formatRupiahRingkas } from '../format';
import { bersihkanSel, namaMadzhab, type KondisiMadzhab, type Perbandingan } from '../madzhab';
import { t } from '../terjemah';

interface Props { perbandingan: Perbandingan; saatPakai: (ruleset: Ruleset) => void; saatTutup: () => void }

const teksKondisi = (kondisi: KondisiMadzhab): string => (kondisi === 'belumDikaji' ? t('hitung.madzhab.belum_dikaji')
  : kondisi === 'perluInput' ? t('hitung.madzhab.butuh_jawaban') : t('hitung.madzhab.tidak_dibandingkan'));

export function ModalBandingMadzhab({ perbandingan, saatPakai, saatTutup }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => { wadah.current?.querySelector<HTMLButtonElement>('[data-tutup]')?.focus(); }, []);
  const { sekarang, hasil, orang, baris, titik } = perbandingan;
  return (
    <div className="modal-latar" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div className="modal-orang modal-banding" role="dialog" aria-modal="true" aria-labelledby="judul-banding" ref={wadah}
        onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
        <header className="kepala-modal netral">
          <div><h2 id="judul-banding">{t('hitung.madzhab.banding_judul')}</h2><p className="keterangan">{t('hitung.madzhab.banding_ket')}</p></div>
          <button type="button" className="tombol-ikon" data-tutup aria-label={t('hitung.madzhab.tutup')} onClick={saatTutup}>×</button>
        </header>
        <div className="isi-modal">
          <div className="wadah-banding">
            <table className="tabel-banding">
              <thead>
                <tr>
                  <th scope="col">{t('hitung.madzhab.kolom_orang')}</th>
                  {DAFTAR_RULESET.map(ruleset => {
                    const satu = hasil.find(h => h.ruleset === ruleset)!;
                    return (
                      <th key={ruleset} scope="col" className={ruleset === sekarang ? 'sekarang' : undefined}>
                        {namaMadzhab(ruleset)}
                        {ruleset === sekarang && <small>{t('hitung.madzhab.sekarang')}</small>}
                        {satu.kondisi !== 'ok' && <small>{teksKondisi(satu.kondisi)}</small>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {orang.map(({ id, nama }) => (
                  <tr key={id} className={baris.has(id) ? 'beda' : undefined}>
                    <th scope="row">{nama}{baris.has(id) && <small>{t('hitung.madzhab.berbeda')}</small>}</th>
                    {DAFTAR_RULESET.map(ruleset => {
                      const satu = hasil.find(h => h.ruleset === ruleset)!;
                      const nominal = satu.bagian[id] ?? 0n;
                      return (
                        <td key={ruleset} className={ruleset === sekarang ? 'sekarang' : undefined}>
                          {satu.kondisi !== 'ok' ? '' : nominal > 0n
                            ? <><span className="rp-penuh">{formatRupiah(nominal)}</span><span className="rp-ringkas" aria-hidden="true">{formatRupiahRingkas(nominal)}</span></>
                            : t('hitung.madzhab.tidak_menerima')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="catatan-info">{t('hitung.madzhab.catatan_sumber')}</p>
          {titik.length > 0 && (
            <details className="lipatan-sekunder titik-beda">
              <summary>{t('hitung.madzhab.titik_judul')}</summary>
              {titik.map(({ kode, titik: topik, posisi }) => (
                <section key={kode} className="titik-satu">
                  <h3>{topik}</h3>
                  <dl>
                    {DAFTAR_RULESET.map(ruleset => <div key={ruleset}><dt>{namaMadzhab(ruleset)}</dt><dd>{bersihkanSel(posisi[ruleset])}</dd></div>)}
                  </dl>
                </section>
              ))}
            </details>
          )}
          <div className="pakai-madzhab">
            {hasil.filter(h => h.ruleset !== sekarang && h.kondisi === 'ok').map(h => (
              <button key={h.ruleset} type="button" className="tautan-aksi" onClick={() => saatPakai(h.ruleset)}>{t('hitung.madzhab.pakai_ini')} {namaMadzhab(h.ruleset)}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
