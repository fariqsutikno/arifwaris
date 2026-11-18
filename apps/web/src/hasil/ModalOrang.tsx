// Penjelasan satu orang (dari klik pohon, daftar, bar, atau tabel; modal di laptop, laci bawah di HP). Kepala berwarna
// menurut status (menerima / tidak mendapat); bagian terbuka: bagiannya, "Kenapa segitu?" (baris explain yang subjeknya
// orang ini), "Cara menghitungnya". Ketiganya alur bernomor (acuan mockup-hasil-per-kasus): dasar (dalil + kapan dapat berapa) →
// keadaan di keluarga ini → hitungan. Terlipat dengan jumlahnya: ahli waris lain yang terdampak. Ubah jumlah lewat tautan di kaki (modal kecil − n +).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import { hitungIsian, peranDariMayit } from '../checklist';
import { formatRupiah, namaOrang } from '../format';
import { barisBerlaku } from '../konten/ahwal';
import { ahwalUntuk } from '../konten/sumber';
import { Baris, Dalil, orangDisebut, type BabBerjudul } from '../layar/Penjelasan';
import type { BentukPecahan, RingkasanHasil } from './ringkasan';
import { pecahanTeks, persenTeks, teksKelompok } from './ringkasan';
import { Ikon } from '../ui/Ikon';
import { angka, bahasaArab, t } from '../terjemah';

interface Props {
  id: IdOrang;
  graf: GrafKeluarga;
  ringkasan: RingkasanHasil;
  daftarBab: BabBerjudul[];
  bentuk: BentukPecahan;
  sedangMenebak: boolean;
  sembunyiNominal: boolean;
  saatTutup: () => void;
  saatUbah?: ((kunci: KunciAhliWaris) => void) | undefined;
}

export function ModalOrang({ id, graf, ringkasan, daftarBab, bentuk, sedangMenebak, sembunyiNominal, saatTutup, saatUbah }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => { wadah.current?.querySelector<HTMLButtonElement>('[data-tutup]')?.focus(); }, []);

  const dapat = ringkasan.penerima.find(orang => orang.id === id);
  const halang = ringkasan.terhalang.find(orang => orang.id === id);
  const kunci = dapat?.kunci ?? halang?.kunci;
  const kelompok = dapat?.kelompok ?? halang?.kelompok;
  const nama = id === graf.idPewaris ? graf.orang[id]?.nama ?? 'Almarhum' : namaOrang(graf, ringkasan.statusOrang, id);
  const semuaBaris = daftarBab.flatMap(({ bab }) => bab.daftarBaris);
  const barisKenapa = semuaBaris.filter(baris => baris.subjek?.includes(id));
  const barisTerdampak = semuaBaris.filter(baris => baris.subjek && !baris.subjek.includes(id) && orangDisebut([baris]).includes(id));
  const refs = [...new Set(barisKenapa.flatMap(baris => baris.refs))];
  const ahwal = kunci ? ahwalUntuk(kunci) : undefined;
  // Ubah langsung dari sini hanya untuk ahli waris pewaris pertama (bukan pewaris, bukan ahli waris mayit munasakhat).
  const bisaDiubah = !!kunci && (hitungIsian(graf, graf.idPewaris)[kunci] ?? []).includes(id);
  const dataCocok = {
    ...(dapat?.fardh ? { fardh: angka(`${dapat.fardh.n}/${dapat.fardh.d}`) } : {}),
    ashabah: !!dapat?.ashabah, terhalang: !!halang,
    ...(dapat?.kodeAlasan ? { kodeAlasan: dapat.kodeAlasan } : {}),
  };

  const adalahPewaris = id === graf.idPewaris;
  const statusKepala = sedangMenebak || adalahPewaris || !kelompok ? 'netral' : halang ? 'tidak' : 'menerima';
  const labelStatus = adalahPewaris ? t('hitung.almarhum') : sedangMenebak || !kelompok ? peranDariMayit(graf, graf.idPewaris, id) ?? t('hitung.kerabat') : halang ? t('hitung.tidak_mendapat_bagian') : t('hitung.menerima_bagian');
  const peran = adalahPewaris ? undefined : kelompok ? teksKelompok(kelompok) : undefined;
  const orangTerdampak = [...new Set(orangDisebut(barisTerdampak))].filter(lain => lain !== id);

  return (
    <div className="modal-latar" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div className="modal-orang" role="dialog" aria-modal="true" aria-labelledby="judul-modal" ref={wadah}
        onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
        <header className={`kepala-modal ${statusKepala}`}>
          <div>
            <p className="peran-modal">{labelStatus}</p>
            <h2 id="judul-modal">{nama}</h2>
            {peran && <p className="sub-modal">{peran}</p>}
          </div>
          <button type="button" className="tombol-ikon" data-tutup aria-label={t('umum.tutup')} onClick={saatTutup}><Ikon nama="salah" ukuran={18} /></button>
        </header>
        <div className="isi-modal">
          {sedangMenebak && <p className="caption-isian">{t('hitung.mode_belajar_bagian_orang_ini_masih')}</p>}
          {dapat && !sedangMenebak && (
            <div>
              <h3>{t('hitung.bagiannya_di_kasus_ini')}</h3>
              <div className="angka-modal">
                <div><small>{t('hitung.pecahan')}</small><b>{pecahanTeks(dapat.saham, ringkasan.penyebut, bentuk)}</b></div>
                <div><small>{t('hitung.persen')}</small><b>{persenTeks(dapat.saham, ringkasan.penyebut)}</b></div>
                <div><small>{t('hitung.nominal')}</small><b>{sembunyiNominal ? t('hitung.rp') : formatRupiah(dapat.nominal)}</b></div>
              </div>
            </div>
          )}
          {!sedangMenebak && (
            <ol className="alur-modal">
              {ahwal && (
                <Titik jenis="dasar" judul={t('hitung.kapan_dapat_berapa')}>
                  {refs.length > 0 && <div className="isi-kenapa"><Dalil daftarKode={refs} /></div>}
                  <table className="tabel-ahwal">
                    <tbody>
                      {ahwal.map(baris => {
                        const berlaku = barisBerlaku(baris, dataCocok);
                        return (
                          <tr key={baris.bagian} className={berlaku ? 'kini' : undefined}>
                            <th>{bahasaArab() && baris.ar ? baris.ar.bagian : baris.bagian}</th>
                            <td>{bahasaArab() && baris.ar ? baris.ar.syarat : baris.syarat}{berlaku && <span className="stiker-kecil">{t('hitung.kasus_ini')}</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="caption-isian">{t('umum.draf_menunggu_pengecekan_tim_keilmuan')}</p>
                </Titik>
              )}
              {(barisKenapa.length > 0 || halang) && (
                <Titik jenis="kasus" judul={halang ? t('hitung.kenapa_tidak_dapat') : t('hitung.kenapa_segitu')}>
                  <ul className="syarat-modal">
                    {barisKenapa.length === 0 && halang && <li><span className="cek" aria-hidden="true" /><span>{halang.alasan}</span></li>}
                    {barisKenapa.map((baris, indeks) => <li key={indeks}><span className="cek" aria-hidden="true" /><span><Baris baris={baris} /></span></li>)}
                  </ul>
                </Titik>
              )}
              {dapat && (
                <Titik jenis="kasus" judul={t('hitung.cara_menghitungnya')}>
                  <div className="langkah-hitung">
                    <p>{t('hitung.harta_dibagi_menjadi_penyebut_bagian_yang', { penyebut: ringkasan.penyebut, nama, saham: dapat.saham })}</p>
                    <p>
                      {angka(String(dapat.saham))}/{angka(String(ringkasan.penyebut))} × {sembunyiNominal ? t('hitung.rp') : formatRupiah(ringkasan.tirkah.bersih)} = <b>{sembunyiNominal ? t('hitung.rp') : formatRupiah(dapat.nominal)}</b>
                      {ringkasan.sisaPembulatan > 0n && <small> ({t('hitung.dibulatkan_ke_bawah')})</small>}
                    </p>
                  </div>
                </Titik>
              )}
            </ol>
          )}
          {!sedangMenebak && barisTerdampak.length > 0 && (
            <Lipatan judul={t('hitung.ahli_waris_lain_yang_terdampak')} catatan={t('hitung.jumlah_orang', { n: orangTerdampak.length })}>
              <ul>{barisTerdampak.map((baris, indeks) => <li key={indeks}><Baris baris={baris} /></li>)}</ul>
            </Lipatan>
          )}
        </div>
        <footer className="kaki-modal">
          {bisaDiubah && kunci && saatUbah && <button type="button" className="aksi-kecil" onClick={() => saatUbah(kunci)}>{t('hitung.ubah_jumlah')}</button>}
          <span className="pengisi" />
          <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" onClick={saatTutup}>{t('umum.oke_paham')}</button>
        </footer>
      </div>
    </div>
  );
}

/** Satu titik di alur penjelasan: nomor bulat (hijau = dasar umum, oranye = keadaan kasus ini) disambung garis ke titik berikutnya. */
function Titik({ jenis, judul, children }: { jenis: 'dasar' | 'kasus'; judul: string; children: ReactNode }) {
  return <li className={`titik-modal ${jenis}`}><h4>{judul}</h4>{children}</li>;
}

/** Lipatan sekunder (lebih kecil dan netral dari "Kenapa segitu?"), dengan ikon +/−. */
function Lipatan({ judul, catatan, children }: { judul: string; catatan?: string; children: ReactNode }) {
  const [terbuka, setTerbuka] = useState(false);
  return (
    <div className="lipatan-sekunder">
      <button type="button" aria-expanded={terbuka} onClick={() => setTerbuka(!terbuka)}>
        {judul}{catatan && <small>{catatan}</small>}
      </button>
      {terbuka && <div className="isi-lipatan">{children}</div>}
    </div>
  );
}
