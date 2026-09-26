// Modal penjelasan satu orang (dari klik pohon, daftar, bar, atau tabel): bagiannya di kasus ini, lalu
// "Kenapa segitu?" (baris explain yang subjeknya orang ini), "Cara menghitungnya", dan "Ahli waris lain yang terdampak"
// (baris tentang orang lain yang menyebut dia sebagai penyebab). "Kapan dapat berapa?" dan dalil sebagai lipatan sekunder.
// Ubah jumlah jenis orang ini lewat tombol Ubah (modal kecil − n +).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import { hitungIsian } from '../checklist';
import { formatRupiah, namaOrang } from '../format';
import { barisBerlaku } from '../konten/ahwal';
import { ahwalUntuk } from '../konten/sumber';
import { Baris, Dalil, orangDisebut, type BabBerjudul } from '../layar/Penjelasan';
import type { BentukPecahan, RingkasanHasil } from './ringkasan';
import { pecahanTeks, persenTeks } from './ringkasan';
import { angka, bahasaArab, t } from '../terjemah';
import type { Kelompok } from '../checklist';

const TEKS_KELOMPOK = (): Record<Kelompok, string> => ({
  pasangan: t('pasangan'), keturunan: t('keturunan'), leluhur: t('leluhur'), saudara: t('saudara'),
});

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

  return (
    <div className="modal-latar" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div className="modal-orang" role="dialog" aria-modal="true" aria-labelledby="judul-modal" ref={wadah}
        onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
        <header className={`kepala-modal ${!halang && kelompok ? `g-${kelompok}` : 'netral'}`}>
          <div>
            <p className="peran-modal">{id === graf.idPewaris ? t('Almarhum') : halang && !sedangMenebak ? t('Terhalang (mahjub)') : kelompok ? TEKS_KELOMPOK()[kelompok] : t('Kerabat')}</p>
            <h2 id="judul-modal">{nama}</h2>
          </div>
          <button type="button" className="tombol-ikon" data-tutup aria-label={t('Tutup')} onClick={saatTutup}>✕</button>
        </header>
        <div className="isi-modal">
          {sedangMenebak && <p className="caption-isian">{t('Mode belajar: bagian orang ini masih disembunyikan. Lihat "Kapan dapat berapa?", lalu tebak kondisi mana yang cocok.')}</p>}
          {dapat && !sedangMenebak && (
            <div>
              <h3>{t('Bagiannya di kasus ini')}</h3>
              <div className="angka-modal">
                <div><small>{t('Pecahan')}</small><b>{pecahanTeks(dapat.saham, ringkasan.penyebut, bentuk)}</b></div>
                <div><small>{t('Persen')}</small><b>{persenTeks(dapat.saham, ringkasan.penyebut)}</b></div>
                <div><small>{t('Nominal')}</small><b>{sembunyiNominal ? t('Rp ••••••') : formatRupiah(dapat.nominal)}</b></div>
              </div>
            </div>
          )}
          {!sedangMenebak && (barisKenapa.length > 0 || halang) && (
            <div className="kenapa-utama">
              <h3>{halang ? t('Kenapa tidak dapat?') : t('Kenapa segitu?')}</h3>
              <ul>
                {barisKenapa.length === 0 && halang && <li>{halang.alasan}</li>}
                {barisKenapa.map((baris, indeks) => <li key={indeks}><Baris baris={baris} /></li>)}
              </ul>
            </div>
          )}
          {dapat && !sedangMenebak && (
            <div>
              <h3>{t('Cara menghitungnya')}</h3>
              <p className="cara-hitung">
                {t('Harta dibagi menjadi {penyebut} bagian yang sama; {nama} mendapat {saham} bagian.', { penyebut: ringkasan.penyebut, nama, saham: dapat.saham })}<br />
                {angka(String(dapat.saham))}/{angka(String(ringkasan.penyebut))} × {sembunyiNominal ? t('Rp ••••••') : formatRupiah(ringkasan.tirkah.bersih)} = <b>{sembunyiNominal ? t('Rp ••••••') : formatRupiah(dapat.nominal)}</b>
                {ringkasan.sisaPembulatan > 0n && <small> ({t('dibulatkan ke bawah')})</small>}
              </p>
            </div>
          )}
          {!sedangMenebak && barisTerdampak.length > 0 && (
            <div>
              <h3>{t('Ahli waris lain yang terdampak')}</h3>
              <ul>{barisTerdampak.map((baris, indeks) => <li key={indeks}><Baris baris={baris} /></li>)}</ul>
            </div>
          )}
          {ahwal && (
            <Lipatan judul={t('Kapan dapat berapa?')} catatan={t('semua kemungkinan bagian {nama}', { nama: nama.toLowerCase() })}>
              <table>
                <tbody>
                  {ahwal.map(baris => {
                    const berlaku = !sedangMenebak && barisBerlaku(baris, dataCocok);
                    return (
                      <tr key={baris.bagian} className={berlaku ? 'kini' : undefined}>
                        <th>{bahasaArab() && baris.ar ? baris.ar.bagian : baris.bagian}</th>
                        <td>{bahasaArab() && baris.ar ? baris.ar.syarat : baris.syarat}{berlaku && <span className="stiker-kecil">{t('kasus ini')}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="caption-isian">{t('Draf, menunggu pengecekan tim keilmuan.')}</p>
            </Lipatan>
          )}
          {refs.length > 0 && !sedangMenebak && (
            <Lipatan judul={t('Dalilnya')}><div className="isi-kenapa"><Dalil daftarKode={refs} /></div></Lipatan>
          )}
        </div>
        <footer className="kaki-modal">
          {bisaDiubah && kunci && saatUbah && <button type="button" className="aksi-kecil" onClick={() => saatUbah(kunci)}>{t('Ubah jumlah')}</button>}
          <span className="pengisi" />
          <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" onClick={saatTutup}>{t('Oke, paham')}</button>
        </footer>
      </div>
    </div>
  );
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
