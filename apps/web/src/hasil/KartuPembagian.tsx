// Kartu Pembagian (selalu terbuka): bar pecahan, daftar per orang, yang tidak dapat beserta alasannya,
// ikon mata (sembunyikan nominal), panel atur tampilan, dan kartu pembulatan yang muncul hanya bila ada angka tidak bulat.
// Di mode Belajar sebelum jawaban dibuka, seluruh isinya diganti ajakan menebak.

import { useState } from 'react';
import { formatRupiah } from '../format';
import { PILIHAN_PEMBULATAN } from '../konten/harta';
import type { BentukPecahan, RingkasanHasil } from './ringkasan';
import { pecahanTeks, persenTeks } from './ringkasan';
import { useAtributOrang } from './sorot';

export interface PengaturanTampil { pecahan: boolean; persen: boolean; bentuk: BentukPecahan }

interface Props {
  ringkasan: RingkasanHasil;
  pengaturan: PengaturanTampil;
  saatUbahPengaturan: (pengaturan: PengaturanTampil) => void;
  sembunyiNominal: boolean;
  saatSembunyi: () => void;
  sedangMenebak: boolean;
  saatTampilkanJawaban: () => void;
  tampilPembulatan: boolean;
  satuanPembulatan: bigint;
  saatUbahPembulatan: (satuan: bigint) => void;
  saatPilihOrang: (id: string) => void;
}

export function KartuPembagian(props: Props) {
  const { ringkasan, pengaturan, sembunyiNominal, sedangMenebak } = props;
  const [aturTerbuka, setAturTerbuka] = useState(false);
  const atribut = useAtributOrang();
  const uang = (nilai: bigint) => (sembunyiNominal ? 'Rp ••••••' : formatRupiah(nilai));

  return (
    <section className="kartu-sisi kartu-utama" aria-labelledby="judul-pembagian" data-tur="pembagian">
      <header className="kepala-pembagian">
        <h2 id="judul-pembagian">Pembagian</h2>
        {!sedangMenebak && (
          <div className="alat-pembagian">
            <button type="button" className="tombol-ikon" aria-pressed={sembunyiNominal} onClick={props.saatSembunyi}
              aria-label={sembunyiNominal ? 'Tampilkan nominal' : 'Sembunyikan nominal'} title={sembunyiNominal ? 'Tampilkan nominal' : 'Sembunyikan nominal'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
                {sembunyiNominal && <path d="M4 4l16 16" />}
              </svg>
            </button>
            <button type="button" className="tombol-ikon" aria-expanded={aturTerbuka} onClick={() => setAturTerbuka(!aturTerbuka)} aria-label="Atur tampilan" title="Atur tampilan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
              </svg>
            </button>
          </div>
        )}
      </header>

      {sedangMenebak ? (
        <div className="tebak">
          <p><b>Mode belajar:</b> pembagiannya disembunyikan dulu. Coba tebak siapa dapat berapa, lalu ikuti langkah perhitungan di bawah.</p>
          <button type="button" className="aw-btn aw-btn-sun aw-btn-sm" onClick={props.saatTampilkanJawaban}>Tampilkan jawaban</button>
        </div>
      ) : (
        <>
          {aturTerbuka && <PanelAtur pengaturan={pengaturan} saatUbah={props.saatUbahPengaturan} />}
          <div className="bar-bagian" role="img" aria-label={ringkasan.penerima.map(orang => `${orang.nama} ${pecahanTeks(orang.saham, ringkasan.penyebut, pengaturan.bentuk)}`).join(', ')}>
            {ringkasan.penerima.map(orang => {
              const { className, ...pemicu } = atribut(orang.id);
              return (
                <span key={orang.id} {...pemicu} className={[`g-${orang.kelompok}`, className].filter(Boolean).join(' ')}
                  style={{ flex: Number(orang.saham) }} onClick={() => props.saatPilihOrang(orang.id)}>
                  {pecahanTeks(orang.saham, ringkasan.penyebut, pengaturan.bentuk)}
                </span>
              );
            })}
            {ringkasan.sisaKeluar && <span className="sisa-keluar" style={{ flex: Number(ringkasan.sisaKeluar.saham) }}>{pecahanTeks(ringkasan.sisaKeluar.saham, ringkasan.penyebut, pengaturan.bentuk)}</span>}
          </div>
          <ul className="daftar-bagian">
            {ringkasan.penerima.map(orang => {
              const { className, ...pemicu } = atribut(orang.id);
              return (
                <li key={orang.id}>
                  <button type="button" {...pemicu} className={['baris-bagian', className].filter(Boolean).join(' ')} onClick={() => props.saatPilihOrang(orang.id)}>
                    <span className={`titik g-${orang.kelompok}`} aria-hidden="true" />
                    <span className="nama-bagian">{orang.nama}<small>{orang.keterangan}</small></span>
                    <span className="jumlah-bagian">
                      <span className="angka">{uang(orang.nominal)}</span>
                      <span className="sub-bagian">
                        {pengaturan.pecahan && <span className="frac">{pecahanTeks(orang.saham, ringkasan.penyebut, pengaturan.bentuk)}</span>}
                        {pengaturan.persen && <span>{persenTeks(orang.saham, ringkasan.penyebut)}</span>}
                      </span>
                    </span>
                    {pengaturan.persen && <span className="bar-persen" aria-hidden="true"><i className={`g-${orang.kelompok}`} style={{ width: `${Number(orang.saham * 10000n / ringkasan.penyebut) / 100}%` }} /></span>}
                  </button>
                </li>
              );
            })}
            {ringkasan.sisaKeluar && (
              <li>
                <div className="baris-bagian sisa">
                  <span className="titik putus" aria-hidden="true" />
                  <span className="nama-bagian">{ringkasan.sisaKeluar.judul}<small>{ringkasan.sisaKeluar.keterangan}</small></span>
                  <span className="jumlah-bagian">
                    <span className="angka">{uang(ringkasan.sisaKeluar.nominal)}</span>
                    <span className="sub-bagian">
                      {pengaturan.pecahan && <span className="frac">{pecahanTeks(ringkasan.sisaKeluar.saham, ringkasan.penyebut, pengaturan.bentuk)}</span>}
                      {pengaturan.persen && <span>{persenTeks(ringkasan.sisaKeluar.saham, ringkasan.penyebut)}</span>}
                    </span>
                  </span>
                </div>
              </li>
            )}
          </ul>
          {ringkasan.terhalang.map(orang => {
            const { className, ...pemicu } = atribut(orang.id);
            return (
              <button key={orang.id} type="button" {...pemicu} className={['tidak-dapat', className].filter(Boolean).join(' ')} onClick={() => props.saatPilihOrang(orang.id)}>
                <span className="titik putus" aria-hidden="true" />
                <span><b>{orang.nama}</b> tidak dapat bagian. {orang.alasan}</span>
              </button>
            );
          })}
          {props.tampilPembulatan && (
            <KartuPembulatan ringkasan={ringkasan} satuan={props.satuanPembulatan} saatUbah={props.saatUbahPembulatan} sembunyiNominal={sembunyiNominal} />
          )}
        </>
      )}
    </section>
  );
}

function PanelAtur({ pengaturan, saatUbah }: { pengaturan: PengaturanTampil; saatUbah: (pengaturan: PengaturanTampil) => void }) {
  return (
    <div className="panel-atur">
      <div>
        <h3>Tampilkan di samping nominal</h3>
        <label className="cek">
          <input type="checkbox" checked={pengaturan.pecahan} onChange={event => saatUbah({ ...pengaturan, pecahan: event.target.checked })} />
          <span><b>Pecahan</b><small>Bagian dari harta yang dibagi, misal 1/6 = satu dari enam bagian.</small></span>
        </label>
        <label className="cek">
          <input type="checkbox" checked={pengaturan.persen} onChange={event => saatUbah({ ...pengaturan, persen: event.target.checked })} />
          <span><b>Persen</b><small>Bagian yang sama dalam persen, misal 1/6 ≈ 16,67%.</small></span>
        </label>
      </div>
      <div>
        <h3 id="judul-bentuk">Bentuk pecahan</h3>
        <div className="pilihan-bulat" role="radiogroup" aria-labelledby="judul-bentuk">
          <button type="button" role="radio" aria-checked={pengaturan.bentuk === 'sederhana'} onClick={() => saatUbah({ ...pengaturan, bentuk: 'sederhana' })}>
            <b>Disederhanakan</b><small>1/6 · 13/36, paling ringkas</small>
          </button>
          <button type="button" role="radio" aria-checked={pengaturan.bentuk === 'sama'} onClick={() => saatUbah({ ...pengaturan, bentuk: 'sama' })}>
            <b>Penyebut sama</b><small>12/72 · 26/72, gampang dibandingkan</small>
          </button>
        </div>
      </div>
    </div>
  );
}

function KartuPembulatan({ ringkasan, satuan, saatUbah, sembunyiNominal }: {
  ringkasan: RingkasanHasil; satuan: bigint; saatUbah: (satuan: bigint) => void; sembunyiNominal: boolean;
}) {
  const contoh = ringkasan.penerima.find(orang => orang.nominal % 1000n !== 0n) ?? ringkasan.penerima[0];
  return (
    <div className="kartu-bulat" data-tur="pembulatan">
      <div className="kepala-bulat">
        <b>Ada angka yang nggak bulat</b>
        <span>Misalnya bagian {contoh?.nama.toLowerCase()} susah dibagi tunai. Mau dibulatkan?</span>
      </div>
      <div className="isi-bulat">
        <div className="pilihan-bulat" role="radiogroup" aria-label="Bulatkan bagian tiap orang ke">
          {PILIHAN_PEMBULATAN.map(pilihan => (
            <button key={String(pilihan.satuan)} type="button" role="radio" aria-checked={pilihan.satuan === satuan} onClick={() => saatUbah(pilihan.satuan)}>
              <b>{pilihan.judul}</b><small>{pilihan.keterangan}</small>
            </button>
          ))}
        </div>
        {ringkasan.sisaPembulatan > 0n
          ? <p>Setelah dibulatkan ke bawah, tersisa <b>{sembunyiNominal ? 'Rp ••••••' : formatRupiah(ringkasan.sisaPembulatan)}</b> yang belum terbagi. Sisa ini tidak dibagi diam-diam; sepakati bersama para ahli waris.</p>
          : <p>Semua bagian sudah pas, tidak ada sisa.</p>}
      </div>
    </div>
  );
}
