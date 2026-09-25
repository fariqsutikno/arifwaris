// Layar hasil. Desktop: kanvas (pohon keluarga / tabel faraidh) di kiri, sidebar di kanan.
// HP: tanpa tab; kanvas disisipkan di antara kartu (urutan diatur CSS). Semua angka dari engine lewat ringkas().
// PERLU_INPUT / TIDAK_DIDUKUNG / galat → kartu pesan, tanpa hasil setengah jadi.

import { useEffect, useMemo, useState } from 'react';
import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import { unduhKasus } from '../berkas';
import { TAUTAN_LAPORAN } from '../konten/umum';
import { keJson, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { jalankan, type HasilOk } from '../jalankan';
import type { Tujuan } from '../preferensi';
import { KartuHarta, KartuSelanjutnya, KartuTentang } from '../hasil/KartuLain';
import { KartuLangkah } from '../hasil/KartuLangkah';
import { KartuPembagian, type PengaturanTampil } from '../hasil/KartuPembagian';
import { ModalOrang } from '../hasil/ModalOrang';
import { ModalUbahHarta } from '../hasil/ModalUbahHarta';
import { ModalUbahJumlah } from '../hasil/ModalUbahJumlah';
import { Pohon } from '../hasil/Pohon';
import { adaTidakPas, ringkas } from '../hasil/ringkasan';
import { PenyediaSorot } from '../hasil/sorot';
import { TabelFaraidh } from '../hasil/TabelFaraidh';
import { Tombol } from '../ui/komponen';
import { TombolIkon } from '../ui/Tooltip';
import { daftarBabDari } from './Penjelasan';

interface Props {
  kasus: Kasus;
  tujuan: Tujuan | null;
  kirim: (aksi: Aksi) => void;
  /**
   * Mode belajar: kasus ini dihitung "sudah dikerjakan" bila tebakan dijawab benar, atau jawaban dibuka setelah
   * pernah mencoba menjawab. Membuka kunci tanpa mencoba tidak dihitung.
   */
  saatDikerjakan?: (() => void) | undefined;
}

export function Hasil({ kasus, tujuan, kirim, saatDikerjakan }: Props) {
  const tampil = useMemo(() => jalankan(kasus), [kasus]);
  const tombolUbah = <Tombol varian="secondary" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 1 })}>← Ubah data</Tombol>;

  if (tampil.jenis === 'galat') {
    return (
      <main className="halaman tumpuk">
        <div className="kartu kartu-galat tumpuk" role="alert">
          <h1 className="judul-langkah">Waduh, ada yang nggak beres di mesin hitungnya</h1>
          <p>Ini bukan salah isianmu. Tolong laporkan dan lampirkan data kasus di bawah.</p>
          <p className="keterangan">{tampil.pesan}</p>
          <div className="chip-deret">
            <Tombol varian="secondary" onClick={() => void navigator.clipboard?.writeText(keJson(kasus)).catch(() => {})}>Salin data kasus</Tombol>
            <a className="aw-btn aw-btn-ghost" href={TAUTAN_LAPORAN} target="_blank" rel="noopener">Laporkan ke pengembang</a>
          </div>
        </div>
        {tombolUbah}
      </main>
    );
  }
  if (tampil.hasil.status !== 'OK') {
    const hasil = tampil.hasil;
    return (
      <main className="halaman tumpuk">
        <div className="kartu kartu-peringatan tumpuk" role="alert">
          <h1 className="judul-langkah">{hasil.status === 'PERLU_INPUT' ? 'Bentar, masih ada yang perlu diisi' : 'Kasus ini belum bisa dihitung di sini'}</h1>
          {hasil.status === 'PERLU_INPUT'
            ? <ul>{hasil.pertanyaan.map((pertanyaan, indeks) => <li key={indeks}>{pertanyaan.alasan}</li>)}</ul>
            : <p>{hasil.alasan}</p>}
        </div>
        {tombolUbah}
      </main>
    );
  }
  return <PenyediaSorot><HasilOkLayar kasus={kasus} tujuan={tujuan} kirim={kirim} saatDikerjakan={saatDikerjakan} /></PenyediaSorot>;
}

function HasilOkLayar({ kasus, tujuan, kirim, saatDikerjakan }: Props) {
  const tampil = useMemo(() => jalankan(kasus), [kasus]);
  const ringkasan = useMemo(() => ringkas(kasus, tampil), [kasus, tampil]);
  const daftarBab = useMemo(() => daftarBabDari(kasus, tampil), [kasus, tampil]);
  const tampilPembulatan = useMemo(() => adaTidakPas(kasus), [kasus]);
  const adalahBelajar = tujuan === 'belajar';

  const [jawabanTerbuka, setJawabanTerbuka] = useState(!adalahBelajar);
  useEffect(() => { setJawabanTerbuka(!adalahBelajar); }, [adalahBelajar]);
  const sedangMenebak = adalahBelajar && !jawabanTerbuka;
  const [sudahMencoba, setSudahMencoba] = useState(false);
  const bukaJawaban = () => { setJawabanTerbuka(true); if (sudahMencoba) saatDikerjakan?.(); };
  const tebakanBenar = () => { setJawabanTerbuka(true); saatDikerjakan?.(); };
  const [sembunyiNominal, setSembunyiNominal] = useState(false);
  const [pengaturan, setPengaturan] = useState<PengaturanTampil>({ pecahan: true, persen: true, bentuk: 'sederhana' });
  const [tabKanvas, setTabKanvas] = useState<'pohon' | 'tabel'>('pohon');
  const [orangDipilih, setOrangDipilih] = useState<IdOrang | null>(null);
  const [kunciDiubah, setKunciDiubah] = useState<KunciAhliWaris | null>(null);
  const [ubahHartaTerbuka, setUbahHartaTerbuka] = useState(false);
  const ubahGraf = (ubah: (graf: Kasus['graf']) => Kasus['graf']) => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, graf: ubah(k.graf) }) });
  const hasilBiasa = tampil.jenis === 'biasa' ? tampil.hasil as HasilOk : null;

  return (
    <main className="halaman-hasil">
      <div className="judul-hasil">
        <h1>Nah, ini pembagiannya</h1>
        <div className="tab-kecil" role="group" aria-label="Tujuan">
          <button type="button" aria-pressed={!adalahBelajar} onClick={() => kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'hitung' })}>Hitung kasus</button>
          <button type="button" aria-pressed={adalahBelajar} onClick={() => kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'belajar' })}>Belajar</button>
        </div>
      </div>

      <div className="tata-hasil">
        <section className="kanvas-hasil" aria-label="Kanvas keluarga">
          <div className="kepala-kanvas">
            <div className="tab-kecil" role="tablist" aria-label="Tampilan kanvas">
              <button type="button" role="tab" aria-selected={tabKanvas === 'pohon'} onClick={() => setTabKanvas('pohon')}>Pohon keluarga</button>
              <button type="button" role="tab" aria-selected={tabKanvas === 'tabel'} onClick={() => setTabKanvas('tabel')}>Tabel faraidh</button>
            </div>
            <TombolIkon label="Ubah ahli waris" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 4 })}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" />
                </svg>
            </TombolIkon>
          </div>
          <section className={tabKanvas === 'pohon' ? 'panel-kanvas panel-pohon' : 'panel-kanvas panel-pohon sembunyi-desktop'} aria-label="Pohon keluarga" data-tur="pohon">
            <Legenda />
            <Pohon graf={kasus.graf} ringkasan={ringkasan} urutanWafat={kasus.urutanWafat} bentuk={pengaturan.bentuk}
              sedangMenebak={sedangMenebak} sembunyiNominal={sembunyiNominal} saatPilih={setOrangDipilih} />
            <p className="petunjuk-kanvas">Klik orang untuk melihat penjelasannya</p>
          </section>
          <section className={tabKanvas === 'tabel' ? 'panel-kanvas panel-tabel' : 'panel-kanvas panel-tabel sembunyi-desktop'} aria-label="Tabel faraidh">
            {sedangMenebak
              ? <p className="kosong-ahli-waris">Tabel disembunyikan di mode belajar. Tebak dulu di kartu Pembagian, atau ikuti langkah perhitungan.</p>
              : <div className="wadah-tabel"><TabelFaraidh hasil={hasilBiasa} ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} saatPilih={setOrangDipilih} /></div>}
          </section>
        </section>

        <aside className="sidebar-hasil" aria-label="Hasil perhitungan">
          <div className="catatan-hasil">
            <b>Catatan.</b> Hasil ini menurut madzhab Syafi'i. Untuk pembagian nyata, musyawarahkan dengan ahli faraidh atau ustadz setempat.
            Nemu yang janggal? <a href={TAUTAN_LAPORAN} target="_blank" rel="noopener">Laporkan ke pengembang</a>.
          </div>
          <KartuPembagian ringkasan={ringkasan} pengaturan={pengaturan} saatUbahPengaturan={setPengaturan}
            sembunyiNominal={sembunyiNominal} saatSembunyi={() => setSembunyiNominal(!sembunyiNominal)}
            sedangMenebak={sedangMenebak} saatTampilkanJawaban={bukaJawaban} saatTebakanBenar={tebakanBenar} saatMencobaMenjawab={() => setSudahMencoba(true)}
            tampilPembulatan={tampilPembulatan} satuanPembulatan={kasus.satuanPembulatan}
            saatUbahPembulatan={satuan => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, satuanPembulatan: satuan }) })}
            saatPilihOrang={setOrangDipilih} />
          <KartuHarta ringkasan={ringkasan} sembunyiNominal={sembunyiNominal || sedangMenebak} saatUbahHarta={() => setUbahHartaTerbuka(true)} />
          {!sedangMenebak && <KartuTentang tentang={ringkasan.tentang} />}
          <KartuLangkah daftarBab={daftarBab} terbukaAwal={adalahBelajar} saatSelesai={bukaJawaban} />
          <KartuSelanjutnya />
        </aside>
      </div>

      <div className="bar-bawah">
        <div className="bar-bawah-isi">
          <Tombol varian="secondary" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 1 })}>← Ubah data</Tombol>
          <span className="pengisi" />
          <Tombol onClick={() => unduhKasus(kasus)}>Simpan file</Tombol>
        </div>
      </div>

      {orangDipilih && (
        <ModalOrang id={orangDipilih} graf={kasus.graf} ringkasan={ringkasan} daftarBab={daftarBab} bentuk={pengaturan.bentuk}
          sedangMenebak={sedangMenebak} sembunyiNominal={sembunyiNominal} saatTutup={() => setOrangDipilih(null)}
          saatUbah={kunci => { setOrangDipilih(null); setKunciDiubah(kunci); }} />
      )}
      {kunciDiubah && <ModalUbahJumlah kunci={kunciDiubah} graf={kasus.graf} ubahGraf={ubahGraf} saatTutup={() => setKunciDiubah(null)} />}
      {ubahHartaTerbuka && (
        <ModalUbahHarta kasus={kasus} saatTutup={() => setUbahHartaTerbuka(false)}
          saatBukaKewajiban={() => kirim({ jenis: 'KE_LANGKAH', langkah: 3 })}
          saatSimpan={kotor => {
            setUbahHartaTerbuka(false);
            kirim({ jenis: 'UBAH_KASUS', ubah: k => { const { rincianHarta: _rincian, ...tanpaRincian } = k; return { ...tanpaRincian, tirkah: { ...k.tirkah, kotor } }; } });
          }} />
      )}
    </main>
  );
}

function Legenda() {
  return (
    <div className="legenda" aria-label="Keterangan pohon">
      <span><i className="kotak g-pasangan" />Pasangan</span>
      <span><i className="kotak g-keturunan" />Keturunan</span>
      <span><i className="kotak g-leluhur" />Orang tua & leluhur</span>
      <span><i className="kotak g-saudara" />Saudara & kerabat</span>
      <span><i className="kotak putus" />Garis putus = tidak dapat bagian</span>
      <span><i className="kotak almarhum" />Almarhum</span>
      <span><i className="garis-l" />Mendatar = menikah, turun = anak</span>
    </div>
  );
}
