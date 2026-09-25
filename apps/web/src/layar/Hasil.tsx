// Layar hasil. Desktop: kanvas (pohon keluarga / tabel faraidh) di kiri, sidebar di kanan.
// HP: tanpa tab; kanvas disisipkan di antara kartu (urutan diatur CSS), semua kartu selebar layar.
// Bar aksi bawah: Ubah data · Reset skenario · Ekspor. Semua angka dari engine lewat ringkas().
// PERLU_INPUT / TIDAK_DIDUKUNG / galat → kartu pesan, tanpa hasil setengah jadi.

import { useEffect, useMemo, useState } from 'react';
import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import { TAUTAN_LAPORAN } from '../konten/umum';
import { keJson, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { jalankan, type HasilOk } from '../jalankan';
import type { Tujuan } from '../preferensi';
import { KartuHarta, KartuSelanjutnya, KartuTentang } from '../hasil/KartuLain';
import { KartuLangkah } from '../hasil/KartuLangkah';
import { dataPeranDari } from '../hasil/ketukan';
import { KartuPembagian, type PengaturanTampil } from '../hasil/KartuPembagian';
import { ModalOrang } from '../hasil/ModalOrang';
import { ModalEkspor } from '../hasil/ModalEkspor';
import { ModalUbahHarta } from '../hasil/ModalUbahHarta';
import { ModalUbahJumlah } from '../hasil/ModalUbahJumlah';
import { Pohon } from '../hasil/Pohon';
import { adaTidakPas, ringkas } from '../hasil/ringkasan';
import { PenyediaSorot } from '../hasil/sorot';
import { TabelFaraidh } from '../hasil/TabelFaraidh';
import { Tombol } from '../ui/komponen';
import { DialogKonfirmasi } from '../ui/Dialog';
import { Ikon } from '../ui/Ikon';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
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
  /** Kasus dari latihan/materi di mode belajar: data kasus tidak bisa diubah atau di-reset supaya fokus. */
  terkunci?: boolean | undefined;
}

export function Hasil({ kasus, tujuan, kirim, saatDikerjakan, terkunci }: Props) {
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
  return <PenyediaSorot><HasilOkLayar kasus={kasus} tujuan={tujuan} kirim={kirim} saatDikerjakan={saatDikerjakan} terkunci={terkunci} /></PenyediaSorot>;
}

function HasilOkLayar({ kasus, tujuan, kirim, saatDikerjakan, terkunci }: Props) {
  const tampil = useMemo(() => jalankan(kasus), [kasus]);
  const ringkasan = useMemo(() => ringkas(kasus, tampil), [kasus, tampil]);
  const daftarBab = useMemo(() => daftarBabDari(kasus, tampil), [kasus, tampil]);
  const tampilPembulatan = useMemo(() => adaTidakPas(kasus), [kasus]);
  const adalahBelajar = tujuan === 'belajar';
  const bolehUbah = !(terkunci && adalahBelajar);

  const [jawabanTerbuka, setJawabanTerbuka] = useState(!adalahBelajar);
  useEffect(() => { setJawabanTerbuka(!adalahBelajar); }, [adalahBelajar]);
  const sedangMenebak = adalahBelajar && !jawabanTerbuka;
  const [sudahMencoba, setSudahMencoba] = useState(false);
  const bukaJawaban = () => { setJawabanTerbuka(true); if (sudahMencoba) saatDikerjakan?.(); };
  const [tebakanBenar, setTebakanBenar] = useState(false);
  const jawabBenar = () => { setTebakanBenar(true); setJawabanTerbuka(true); saatDikerjakan?.(); };
  // Membuka jawaban saat masih menebak (Lihat jawaban, atau pindah ke Hitung kasus) sengaja dibuat berat:
  // lewat dialog dengan tombol tekan-tahan.
  const [konfirmasiBuka, setKonfirmasiBuka] = useState<'lihat' | 'pindah' | null>(null);
  const [konfirmasiBelajar, setKonfirmasiBelajar] = useState(false);
  const pilihHitungKasus = () => (sedangMenebak ? setKonfirmasiBuka('pindah') : kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'hitung' }));
  const [sembunyiNominal, setSembunyiNominal] = useState(false);
  const [pengaturan, setPengaturan] = useState<PengaturanTampil>({ pecahan: true, persen: true, bentuk: 'sederhana' });
  const [tabKanvas, setTabKanvas] = useState<'pohon' | 'tabel'>('pohon');
  const [orangDipilih, setOrangDipilih] = useState<IdOrang | null>(null);
  const [kunciDiubah, setKunciDiubah] = useState<KunciAhliWaris | null>(null);
  const [ubahHartaTerbuka, setUbahHartaTerbuka] = useState(false);
  const [eksporTerbuka, setEksporTerbuka] = useState(false);
  const [konfirmasiUlangi, setKonfirmasiUlangi] = useState(false);
  const ubahGraf = (ubah: (graf: Kasus['graf']) => Kasus['graf']) => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, graf: ubah(k.graf) }) });
  const hasilBiasa = tampil.jenis === 'biasa' ? tampil.hasil as HasilOk : null;
  const pohon = <Pohon graf={kasus.graf} ringkasan={ringkasan} urutanWafat={kasus.urutanWafat} bentuk={pengaturan.bentuk}
    sedangMenebak={sedangMenebak} sembunyiNominal={sembunyiNominal} saatPilih={setOrangDipilih} />;
  const tabel = <TabelFaraidh hasil={hasilBiasa} ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} sedangMenebak={sedangMenebak} saatPilih={setOrangDipilih} />;
  const kanvasFokus = { pohon, tabel };
  const dataPeran = useMemo(() => dataPeranDari(kasus.graf, ringkasan, hasilBiasa?.tabel ?? null, kasus.urutanWafat), [kasus, ringkasan, hasilBiasa]);

  return (
    <main className={adalahBelajar ? 'halaman-hasil mode-belajar' : 'halaman-hasil'}>
      <div className="judul-hasil">
        {adalahBelajar ? (
          <div className="judul-soal">
            <span className="lencana-soal">{sedangMenebak ? 'Soal' : 'Pembahasan'}</span>
            <h1>{sedangMenebak ? 'Tentukan bagian tiap ahli waris' : 'Pembahasan soal'}</h1>
            <p>{sedangMenebak
              ? 'Kerjakan di kartu Jawabanmu. Langkah perhitungan dan angka di tabel terbuka setelah jawabanmu benar atau kamu membuka jawaban.'
              : 'Cocokkan jawabanmu, lalu pelajari cara menghitungnya langkah demi langkah.'}</p>
          </div>
        ) : (
          <div className="judul-soal">
            <span className="lencana-soal lencana-hitung">Hitung kasus</span>
            <h1>Nah, ini pembagiannya</h1>
            <p>Angka di sini hasil hitung kasusmu. Mau latihan menebak pembagiannya dulu? Pindah ke mode Belajar.</p>
          </div>
        )}
        <div className="tab-kecil" role="group" aria-label="Tujuan">
          <button type="button" aria-pressed={!adalahBelajar} onClick={pilihHitungKasus}>Hitung kasus</button>
          <button type="button" aria-pressed={adalahBelajar} onClick={() => (adalahBelajar ? undefined : setKonfirmasiBelajar(true))}>Belajar</button>
        </div>
      </div>

      <div className="tata-hasil">
        <section className="kanvas-hasil" aria-label="Kanvas keluarga">
          <div className="kepala-kanvas">
            <div className="tab-kecil" role="tablist" aria-label="Tampilan kanvas">
              <button type="button" role="tab" aria-selected={tabKanvas === 'pohon'} onClick={() => setTabKanvas('pohon')}>Pohon keluarga</button>
              <button type="button" role="tab" aria-selected={tabKanvas === 'tabel'} onClick={() => setTabKanvas('tabel')}>Tabel faraidh</button>
            </div>
          </div>
          <section className={tabKanvas === 'pohon' ? 'panel-kanvas panel-pohon' : 'panel-kanvas panel-pohon sembunyi-desktop'} aria-label="Pohon keluarga" data-tur="pohon">
            <Legenda />
            {pohon}
            <p className="petunjuk-kanvas">Ketuk orang untuk melihat penjelasannya<span className="hanya-hp"> · geser ke samping kalau terpotong</span></p>
          </section>
          <section className={tabKanvas === 'tabel' ? 'panel-kanvas panel-tabel' : 'panel-kanvas panel-tabel sembunyi-desktop'} aria-label="Tabel faraidh">
            <div className="wadah-tabel">{tabel}</div>
          </section>
        </section>

        <aside className="sidebar-hasil" aria-label="Hasil perhitungan">
          <div className="catatan-hasil">
            <b>Catatan.</b> Hasil ini menurut madzhab Syafi'i. Untuk pembagian nyata, musyawarahkan dengan ahli faraidh atau ustadz setempat.
            Nemu yang janggal? <a href={TAUTAN_LAPORAN} target="_blank" rel="noopener">Laporkan ke pengembang</a>.
          </div>
          <KartuHarta ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} saatUbahHarta={bolehUbah ? () => setUbahHartaTerbuka(true) : undefined} />
          <KartuPembagian ringkasan={ringkasan} pengaturan={pengaturan} saatUbahPengaturan={setPengaturan} adalahBelajar={adalahBelajar}
            sembunyiNominal={sembunyiNominal} saatSembunyi={() => setSembunyiNominal(!sembunyiNominal)}
            sedangMenebak={sedangMenebak} saatTampilkanJawaban={() => setKonfirmasiBuka('lihat')} saatTebakanBenar={jawabBenar} tebakanBenar={tebakanBenar} saatMencobaMenjawab={() => setSudahMencoba(true)}
            tampilPembulatan={tampilPembulatan} satuanPembulatan={kasus.satuanPembulatan}
            saatUbahPembulatan={satuan => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, satuanPembulatan: satuan }) })}
            saatPilihOrang={setOrangDipilih} saatUbahAhliWaris={bolehUbah ? () => kirim({ jenis: 'KE_LANGKAH', langkah: 4 }) : undefined} />
          {/* Urutan mengikuti alur berpikir: harta → pembagian → jenis kasus → cara menghitung → tindak lanjut. */}
          {!sedangMenebak && <KartuTentang tentang={ringkasan.tentang} />}
          <KartuLangkah daftarBab={daftarBab} dataPeran={dataPeran} ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} terkunci={sedangMenebak} adalahBelajar={adalahBelajar} kanvas={kanvasFokus} />
          <KartuSelanjutnya />
        </aside>
      </div>

      <div className="bar-bawah">
        <div className="bar-bawah-isi bar-aksi-hasil">
          {bolehUbah && <>
            <Tombol varian="secondary" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 1 })}><Ikon nama="pensil" /> Ubah data</Tombol>
            <Tombol varian="secondary" onClick={() => setKonfirmasiUlangi(true)}><Ikon nama="riwayat" /> <span>Reset<span className="label-lebar"> skenario</span></span></Tombol>
          </>}
          <span className="pengisi" />
          <span className="status-simpan"><Ikon nama="benar" ukuran={16} /> Tersimpan di riwayat</span>
          <Tombol onClick={() => setEksporTerbuka(true)}><Ikon nama="unduh" /> Ekspor</Tombol>
        </div>
      </div>
      {konfirmasiUlangi && (
        <KonfirmasiKasusBaru kasus={kasus} judul="Reset skenario?" labelLanjut="Reset" saatBatal={() => setKonfirmasiUlangi(false)}
          saatLanjut={() => { setKonfirmasiUlangi(false); kirim({ jenis: 'ULANGI' }); }} />
      )}

      {orangDipilih && (
        <ModalOrang id={orangDipilih} graf={kasus.graf} ringkasan={ringkasan} daftarBab={daftarBab} bentuk={pengaturan.bentuk}
          sedangMenebak={sedangMenebak} sembunyiNominal={sembunyiNominal} saatTutup={() => setOrangDipilih(null)}
          saatUbah={bolehUbah ? kunci => { setOrangDipilih(null); setKunciDiubah(kunci); } : undefined} />
      )}
      {konfirmasiBuka && (
        <DialogKonfirmasi tahan
          judul={konfirmasiBuka === 'lihat' ? 'Yakin mau lihat jawaban?' : 'Pindah ke Hitung kasus?'}
          labelBatal={konfirmasiBuka === 'lihat' ? 'Coba dulu' : 'Tetap belajar'}
          labelLanjut={konfirmasiBuka === 'lihat' ? 'Tahan untuk buka' : 'Tahan untuk pindah'}
          saatBatal={() => setKonfirmasiBuka(null)}
          saatLanjut={() => {
            const jenis = konfirmasiBuka;
            setKonfirmasiBuka(null);
            if (jenis === 'lihat') bukaJawaban();
            else kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'hitung' });
          }}>
          <ul className="poin-konfirmasi">
            <li>Semua jawaban langsung kebuka, kamu nggak bisa nebak kasus ini lagi.</li>
            {!sudahMencoba && <li>Kamu belum nyoba jawab sama sekali. Sekali coba dulu, yuk.</li>}
          </ul>
        </DialogKonfirmasi>
      )}
      {konfirmasiBelajar && (
        <DialogKonfirmasi judul="Pindah ke mode Belajar?" labelBatal="Tetap di sini" labelLanjut="Pindah"
          saatBatal={() => setKonfirmasiBelajar(false)}
          saatLanjut={() => { setKonfirmasiBelajar(false); kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'belajar' }); }}>
          <p>Jawaban akan disembunyikan dan kamu diminta menebak pembagiannya dulu. Data kasusmu tetap aman.</p>
        </DialogKonfirmasi>
      )}
      {eksporTerbuka && <ModalEkspor kasus={kasus} saatTutup={() => setEksporTerbuka(false)} />}
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
      <span><i className="kotak almarhum" />Almarhum</span>
      <span><i className="kotak terhalang" />Terhalang</span>
      <span><i className="kotak putus" />Garis putus = tidak mewarisi</span>
      <span><i className="garis-l" />Mendatar = menikah, turun = anak</span>
    </div>
  );
}
