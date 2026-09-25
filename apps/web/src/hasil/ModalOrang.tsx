// Modal penjelasan satu orang (dari klik pohon, daftar, bar, atau tabel): peran, bagiannya di kasus ini,
// "Kenapa segitu?" (baris penjelasan explain yang menyebut orang itu), "Kapan dapat berapa?" (ahwal, baris kasus ini
// disorot kecuali di mode Belajar), dan dalil. Ubah data hanya link kecil di bawah supaya tidak bersaing dengan penjelasan.

import { useEffect, useRef, useState } from 'react';
import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { formatRupiah, namaOrang } from '../format';
import { AHWAL, barisBerlaku } from '../konten/ahwal';
import { Baris, Dalil, orangDisebut, type BabBerjudul } from '../layar/Penjelasan';
import type { BentukPecahan, RingkasanHasil } from './ringkasan';
import { pecahanTeks, persenTeks } from './ringkasan';

interface Props {
  id: IdOrang;
  graf: GrafKeluarga;
  ringkasan: RingkasanHasil;
  daftarBab: BabBerjudul[];
  bentuk: BentukPecahan;
  sedangMenebak: boolean;
  sembunyiNominal: boolean;
  saatTutup: () => void;
  saatUbahData: () => void;
}

export function ModalOrang({ id, graf, ringkasan, daftarBab, bentuk, sedangMenebak, sembunyiNominal, saatTutup, saatUbahData }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const [ahwalTerbuka, setAhwalTerbuka] = useState(false);
  const [dalilTerbuka, setDalilTerbuka] = useState(false);
  useEffect(() => { wadah.current?.querySelector<HTMLButtonElement>('[data-tutup]')?.focus(); }, []);

  const dapat = ringkasan.penerima.find(orang => orang.id === id);
  const halang = ringkasan.terhalang.find(orang => orang.id === id);
  const kunci = dapat?.kunci ?? halang?.kunci;
  const kelompok = dapat?.kelompok ?? halang?.kelompok;
  const nama = id === graf.idPewaris ? graf.orang[id]?.nama ?? 'Almarhum' : namaOrang(graf, ringkasan.statusOrang, id);
  const barisTentangDia = daftarBab.flatMap(({ bab }) => bab.daftarBaris.filter(baris => orangDisebut([baris]).includes(id)));
  const refs = [...new Set(barisTentangDia.flatMap(baris => baris.refs))];
  const ahwal = kunci ? AHWAL[kunci] : undefined;
  const dataCocok = {
    ...(dapat?.fardh ? { fardh: `${dapat.fardh.n}/${dapat.fardh.d}` } : {}),
    ashabah: !!dapat?.ashabah, terhalang: !!halang,
    ...(dapat?.kodeAlasan ? { kodeAlasan: dapat.kodeAlasan } : {}),
  };

  return (
    <div className="modal-latar" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div className="modal-orang" role="dialog" aria-modal="true" aria-labelledby="judul-modal" ref={wadah}
        onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
        <header className={`kepala-modal ${!halang && kelompok ? `g-${kelompok}` : 'netral'}`}>
          <div>
            <p className="peran-modal">{id === graf.idPewaris ? 'Pewaris' : halang && !sedangMenebak ? 'Terhalang (mahjub)' : kelompok ?? 'Kerabat'}</p>
            <h2 id="judul-modal">{nama}</h2>
          </div>
          <button type="button" className="tombol-ikon" data-tutup aria-label="Tutup" onClick={saatTutup}>✕</button>
        </header>
        <div className="isi-modal">
          {sedangMenebak && <p className="caption-isian">Mode belajar: bagian orang ini masih disembunyikan. Lihat "Kapan dapat berapa?", lalu tebak kondisi mana yang cocok.</p>}
          {dapat && !sedangMenebak && (
            <div>
              <h3>Bagiannya di kasus ini</h3>
              <div className="angka-modal">
                <div><small>Pecahan</small><b>{pecahanTeks(dapat.saham, ringkasan.penyebut, bentuk)}</b></div>
                <div><small>Persen</small><b>{persenTeks(dapat.saham, ringkasan.penyebut)}</b></div>
                <div><small>Nominal</small><b>{sembunyiNominal ? 'Rp ••••••' : formatRupiah(dapat.nominal)}</b></div>
              </div>
            </div>
          )}
          {!sedangMenebak && (barisTentangDia.length > 0 || halang) && (
            <div>
              <h3>{halang ? 'Kenapa tidak dapat?' : 'Kenapa segitu?'}</h3>
              <ul>
                {halang && <li>{halang.alasan}</li>}
                {barisTentangDia.map((baris, indeks) => <li key={indeks}><Baris baris={baris} /></li>)}
              </ul>
            </div>
          )}
          {ahwal && (
            <div className="ahwal">
              <button type="button" aria-expanded={ahwalTerbuka} onClick={() => setAhwalTerbuka(!ahwalTerbuka)}>
                Kapan dapat berapa? <small>semua kemungkinan bagian {nama.toLowerCase()}</small>
              </button>
              {ahwalTerbuka && (
                <>
                  <table>
                    <tbody>
                      {ahwal.map(baris => {
                        const berlaku = !sedangMenebak && barisBerlaku(baris, dataCocok);
                        return (
                          <tr key={baris.bagian} className={berlaku ? 'kini' : undefined}>
                            <th>{baris.bagian}</th>
                            <td>{baris.syarat}{berlaku && <span className="stiker-kecil">kasus ini</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="caption-isian">Draf, menunggu pengecekan tim keilmuan.</p>
                </>
              )}
            </div>
          )}
          {refs.length > 0 && !sedangMenebak && (
            <div className="kenapa">
              <button type="button" aria-expanded={dalilTerbuka} onClick={() => setDalilTerbuka(!dalilTerbuka)}>Dalilnya</button>
              {dalilTerbuka && <div className="isi-kenapa"><Dalil daftarKode={refs} /></div>}
            </div>
          )}
        </div>
        <footer className="kaki-modal">
          <button type="button" className="aw-btn aw-btn-ghost aw-btn-sm" onClick={saatUbahData}>Ubah data orang ini</button>
          <span className="pengisi" />
          <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" onClick={saatTutup}>Oke, paham</button>
        </footer>
      </div>
    </div>
  );
}
