// Layar hasil (gaya Logivo, acuan docs/design/mockup-hasil-gaya-logivo.html). Atas: hero gelap berisi judul, aksi utama (Ekspor),
// statistik, dan pratinjau seluruh pohon keluarga; mengetuk pohon membuka layar penuh (zoom, geser, penjelasan per orang, bagikan).
// Bawah: pita jawaban (Pembagian + rel samping: yang tidak dapat, harta, tindak lanjut) lalu pita cara menghitung (langkah, tabel faraidh,
// tentang kasus). Kartu hanya ada bila kasusnya memuatnya. HP: satu kolom, urutan = urutan DOM.
// Kaki bingkai: catatan + tautan Ubah data · Reset skenario. Semua angka dari engine lewat ringkas().
// PERLU_INPUT / TIDAK_DIDUKUNG / galat → kartu pesan, tanpa hasil setengah jadi.

import { useEffect, useMemo, useReducer, useState } from 'react';
import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import { TAUTAN_LAPORAN } from '../konten/umum';
import { keJson, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { jalankan, type HasilOk } from '../jalankan';
import { useBahasa, type Tujuan } from '../preferensi';
import { HasilKasusKhusus } from '../hasil/HasilKasusKhusus';
import { KartuHarta, KartuSelanjutnya, KartuTentang, KartuTidakDapat } from '../hasil/KartuLain';
import { KartuLangkah } from '../hasil/KartuLangkah';
import { dataPeranDari } from '../hasil/ketukan';
import { KartuPembagian, type PengaturanTampil } from '../hasil/KartuPembagian';
import { ModalOrang } from '../hasil/ModalOrang';
import { ModalEkspor } from '../hasil/ModalEkspor';
import { ModalUbahHarta } from '../hasil/ModalUbahHarta';
import { ModalUbahJumlah } from '../hasil/ModalUbahJumlah';
import { Pohon } from '../hasil/Pohon';
import { PohonLayarPenuh } from '../hasil/PohonLayarPenuh';
import { PratinjauPohon } from '../hasil/PratinjauPohon';
import { adaTidakPas, ringkas } from '../hasil/ringkasan';
import { PenyediaSorot } from '../hasil/sorot';
import { TabelFaraidh } from '../hasil/TabelFaraidh';
import { simpanKasus, sudahTersimpan } from '../tersimpan';
import { formatRupiahRingkas } from '../format';
import { Tombol } from '../ui/komponen';
import { DialogKonfirmasi } from '../ui/Dialog';
import { Ikon } from '../ui/Ikon';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
import { daftarBabDari } from './Penjelasan';
import { t } from '../terjemah';

interface Props {
  kasus: Kasus;
  idSesi: string;
  tujuan: Tujuan | null;
  kirim: (aksi: Aksi) => void;
  /**
   * Mode belajar: kasus ini dihitung "sudah dikerjakan" bila tebakan dijawab benar (`benar` = true), atau jawaban
   * dibuka setelah pernah mencoba menjawab (`benar` = false, tanpa XP, spec tahap 5). Membuka tanpa mencoba tidak dihitung.
   */
  saatDikerjakan?: ((benar: boolean) => void) | undefined;
  /** Kasus dari latihan/materi di mode belajar: data kasus tidak bisa diubah atau di-reset supaya fokus. */
  terkunci?: boolean | undefined;
}

export function Hasil({ kasus, idSesi, tujuan, kirim, saatDikerjakan, terkunci }: Props) {
  const tampil = useMemo(() => jalankan(kasus), [kasus]);
  const tombolUbah = <Tombol varian="secondary" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 1 })}>{t('hitung.ubah_data')}</Tombol>;

  if (tampil.jenis === 'galat') {
    return (
      <main className="halaman tumpuk">
        <div className="kartu kartu-galat tumpuk" role="alert">
          <h1 className="judul-langkah">{t('hitung.waduh_ada_yang_nggak_beres_di')}</h1>
          <p>{t('hitung.ini_bukan_salah_isianmu_tolong_laporkan')}</p>
          <p className="keterangan">{tampil.pesan}</p>
          <div className="chip-deret">
            <Tombol varian="secondary" onClick={() => void navigator.clipboard?.writeText(keJson(kasus)).catch(() => {})}>{t('hitung.salin_data_kasus')}</Tombol>
            <a className="aw-btn aw-btn-ghost" href={TAUTAN_LAPORAN} target="_blank" rel="noopener">{t('umum.laporkan_ke_pengembang')}</a>
          </div>
        </div>
        {tombolUbah}
      </main>
    );
  }
  if (tampil.jenis === 'taqdir' || tampil.jenis === 'gharqa' || tampil.jenis === 'menunggu') {
    return <HasilKasusKhusus kasus={kasus} tampil={tampil} kirim={kirim} idSesi={idSesi} />;
  }
  if (tampil.hasil.status !== 'OK') {
    const hasil = tampil.hasil;
    return (
      <main className="halaman tumpuk">
        <div className="kartu kartu-peringatan tumpuk" role="alert">
          <h1 className="judul-langkah">{hasil.status === 'PERLU_INPUT' ? t('hitung.bentar_masih_ada_yang_perlu_diisi') : t('hitung.kasus_ini_belum_bisa_dihitung_di')}</h1>
          {hasil.status === 'PERLU_INPUT'
            ? <ul>{hasil.pertanyaan.map((pertanyaan, indeks) => <li key={indeks}>{pertanyaan.alasan}</li>)}</ul>
            : <p>{hasil.alasan}</p>}
        </div>
        {tombolUbah}
      </main>
    );
  }
  return <PenyediaSorot><HasilOkLayar kasus={kasus} idSesi={idSesi} tujuan={tujuan} kirim={kirim} saatDikerjakan={saatDikerjakan} terkunci={terkunci} /></PenyediaSorot>;
}

function HasilOkLayar({ kasus, idSesi, tujuan, kirim, saatDikerjakan, terkunci }: Props) {
  const [, segarkan] = useReducer((n: number) => n + 1, 0);
  const tampil = useMemo(() => jalankan(kasus), [kasus]);
  const ringkasan = useMemo(() => ringkas(kasus, tampil), [kasus, tampil]);
  const bahasa = useBahasa();
  const daftarBab = useMemo(() => daftarBabDari(kasus, tampil, bahasa), [kasus, tampil, bahasa]);
  const tampilPembulatan = useMemo(() => adaTidakPas(kasus), [kasus]);
  const adalahBelajar = tujuan === 'belajar';
  // Penanda halaman: latar sage, bingkai krem, dan nav menyatu dengan hero (CSS body.layar-hasil).
  useEffect(() => { document.body.classList.add('layar-hasil'); return () => document.body.classList.remove('layar-hasil'); }, []);
  const bolehUbah = !(terkunci && adalahBelajar);
  const adaPotonganHarta = ringkasan.tirkah.kotor !== ringkasan.tirkah.bersih;
  const ubahData = () => kirim({ jenis: 'KE_LANGKAH', langkah: 1 });

  const [jawabanTerbuka, setJawabanTerbuka] = useState(!adalahBelajar);
  useEffect(() => { setJawabanTerbuka(!adalahBelajar); }, [adalahBelajar]);
  const sedangMenebak = adalahBelajar && !jawabanTerbuka;
  const [sudahMencoba, setSudahMencoba] = useState(false);
  const bukaJawaban = () => { setJawabanTerbuka(true); if (sudahMencoba) saatDikerjakan?.(false); };
  const [tebakanBenar, setTebakanBenar] = useState(false);
  const jawabBenar = () => { setTebakanBenar(true); setJawabanTerbuka(true); saatDikerjakan?.(true); };
  // Membuka jawaban saat masih menebak (Lihat jawaban, atau pindah ke Hitung kasus) sengaja dibuat berat:
  // lewat dialog dengan tombol tekan-tahan.
  const [konfirmasiBuka, setKonfirmasiBuka] = useState<'lihat' | 'pindah' | null>(null);
  const [konfirmasiBelajar, setKonfirmasiBelajar] = useState(false);
  const pilihHitungKasus = () => (sedangMenebak ? setKonfirmasiBuka('pindah') : kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'hitung' }));
  const [sembunyiNominal, setSembunyiNominal] = useState(false);
  const [pengaturan, setPengaturan] = useState<PengaturanTampil>({ pecahan: true, persen: true, bentuk: 'sederhana' });
  const [layarPenuh, setLayarPenuh] = useState<{ zoom: number } | null>(null);
  const [orangDipilih, setOrangDipilih] = useState<IdOrang | null>(null);
  const [kunciDiubah, setKunciDiubah] = useState<KunciAhliWaris | null>(null);
  const [ubahHartaTerbuka, setUbahHartaTerbuka] = useState(false);
  const [eksporTerbuka, setEksporTerbuka] = useState(false);
  const [konfirmasiUlangi, setKonfirmasiUlangi] = useState(false);
  const ubahGraf = (ubah: (graf: Kasus['graf']) => Kasus['graf']) => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, graf: ubah(k.graf) }) });
  const namaPewaris = kasus.graf.orang[kasus.graf.idPewaris]?.nama?.trim() || '';
  const jumlahOrang = Object.values(kasus.graf.orang).filter(orang => !orang.penghubung).length;
  const hasilBiasa = tampil.jenis === 'biasa' ? tampil.hasil as HasilOk : null;
  const pohon = <Pohon graf={kasus.graf} ringkasan={ringkasan} urutanWafat={kasus.urutanWafat} bentuk={pengaturan.bentuk}
    sedangMenebak={sedangMenebak} sembunyiNominal={sembunyiNominal} saatPilih={setOrangDipilih} />;
  const tabel = <TabelFaraidh hasil={hasilBiasa} ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} sedangMenebak={sedangMenebak} saatPilih={setOrangDipilih} />;
  const kanvasFokus = { pohon, tabel };
  const dataPeran = useMemo(() => dataPeranDari(kasus.graf, ringkasan, hasilBiasa?.tabel ?? null, kasus.urutanWafat, hasilBiasa?.jejak), [kasus, ringkasan, hasilBiasa]);

  return (
    <main className={adalahBelajar ? 'halaman-hasil mode-belajar' : 'halaman-hasil'}>
      <header className="hero-hasil">
        <div className="judul-hasil">
          <div className="judul-soal">
            <p className="lok-hero">{adalahBelajar ? (sedangMenebak ? t('hitung.soal') : t('hitung.pembahasan')) : t('hitung.menurut_madzhab_syafii')}</p>
            {adalahBelajar
              ? <h1>{sedangMenebak ? t('hitung.tentukan_bagian_tiap_ahli_waris') : t('hitung.pembahasan_soal')}</h1>
              : <h1>{namaPewaris ? t('hitung.harta_nama', { nama: namaPewaris }) : t('hitung.nah_ini_pembagiannya')}</h1>}
            {adalahBelajar && <p>{sedangMenebak ? t('hitung.kerjakan_di_kartu_jawabanmu_langkah_perhitungan') : t('hitung.cocokkan_jawabanmu_lalu_pelajari_cara_menghitungnya')}</p>}
          </div>
          <div className="aksi-hero">
            {!sedangMenebak && <button type="button" className="pil-hero" onClick={() => setEksporTerbuka(true)}><Ikon nama="unduh" /> {t('hitung.ekspor')}</button>}
            {bolehUbah && <button type="button" className="tautan-hero" onClick={ubahData}>{t('hitung.ubah_data_2')}</button>}
          </div>
          {!sedangMenebak && (
            <dl className="statistik-hero">
              <div><dd>{sembunyiNominal ? t('hitung.rp') : formatRupiahRingkas(ringkasan.tirkah.bersih)}</dd><dt>{t('hitung.total_harta')}</dt></div>
              <div><dd>{ringkasan.penerima.length}</dd><dt>{t('hitung.menerima_bagian')}</dt></div>
              <div><dd>{jumlahOrang}</dd><dt>{t('hitung.orang_di_pohon')}</dt></div>
            </dl>
          )}
          <div className="tab-kecil" role="group" aria-label={t('umum.tujuan')}>
            <button type="button" aria-pressed={!adalahBelajar} onClick={pilihHitungKasus}>{t('hitung.hitung_kasus')}</button>
            <button type="button" aria-pressed={adalahBelajar} onClick={() => (adalahBelajar ? undefined : setKonfirmasiBelajar(true))}>{t('umum.belajar')}</button>
          </div>
        </div>
        <div className="hero-pohon" data-tur="pohon" aria-label={t('hitung.pohon_keluarga')}>
          <div className="hero-alat">
            <button type="button" className="alat-bulat" aria-label={t('hitung.perbesar')} onClick={() => setLayarPenuh({ zoom: 1.5 })}><Ikon nama="zoomMasuk" /></button>
            <button type="button" className="alat-bulat" aria-label={t('hitung.layar_penuh')} onClick={() => setLayarPenuh({ zoom: 1 })}><Ikon nama="perbesar" /></button>
          </div>
          <PratinjauPohon saatBuka={() => setLayarPenuh({ zoom: 1 })}>{pohon}</PratinjauPohon>
          <div className="kaki-pohon"><Legenda /><span>{t('hitung.pratinjau_ketuk_untuk_memperbesar')}</span></div>
        </div>
      </header>

      {/* Urutan = pertanyaan yang muncul di kepala pengguna: siapa dapat berapa → kenapa ada yang tidak dapat → dari harta yang mana
          → habis ini ngapain → (bagi yang mau) cara menghitungnya. Kartu yang tidak ada isinya untuk kasus ini tidak dirender. */}
      <div className="tata-hasil">
        <div className="pita-jawaban">
          <KartuPembagian ringkasan={ringkasan} pengaturan={pengaturan} saatUbahPengaturan={setPengaturan} adalahBelajar={adalahBelajar}
            sembunyiNominal={sembunyiNominal} saatSembunyi={() => setSembunyiNominal(!sembunyiNominal)}
            sedangMenebak={sedangMenebak} saatTampilkanJawaban={() => setKonfirmasiBuka('lihat')} saatTebakanBenar={jawabBenar} tebakanBenar={tebakanBenar} saatMencobaMenjawab={() => setSudahMencoba(true)}
            tampilPembulatan={tampilPembulatan} satuanPembulatan={kasus.satuanPembulatan}
            saatUbahPembulatan={satuan => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, satuanPembulatan: satuan }) })}
            saatPilihOrang={setOrangDipilih} saatUbahAhliWaris={bolehUbah ? () => kirim({ jenis: 'KE_LANGKAH', langkah: 4 }) : undefined}
            saatUbahHarta={bolehUbah && !adaPotonganHarta ? () => setUbahHartaTerbuka(true) : undefined} />
          <div className="rel-samping">
            {!sedangMenebak && ringkasan.terhalang.length > 0 && <KartuTidakDapat ringkasan={ringkasan} saatPilihOrang={setOrangDipilih} />}
            {adaPotonganHarta && <KartuHarta ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} saatUbahHarta={bolehUbah ? () => setUbahHartaTerbuka(true) : undefined} />}
            <KartuSelanjutnya tersimpan={sudahTersimpan(idSesi, kasus)} saatSimpan={() => { simpanKasus(idSesi, kasus); segarkan(); }} saatEkspor={() => setEksporTerbuka(true)} />
          </div>
        </div>
        <div className="pita-hitung">
          <KartuLangkah daftarBab={daftarBab} dataPeran={dataPeran} hasil={hasilBiasa} ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} terkunci={sedangMenebak} adalahBelajar={adalahBelajar} kanvas={kanvasFokus} />
          <section className="kartu-sisi kartu-tabel" aria-labelledby="judul-tabel-faraidh">
            <h2 id="judul-tabel-faraidh">{t('hitung.tabel_faraidh')}</h2>
            <div className="wadah-tabel">{tabel}</div>
          </section>
          {!sedangMenebak && <KartuTentang tentang={ringkasan.tentang} />}
        </div>
      </div>

      <footer className="kaki-hasil">
        <p>{t('hitung.hasil_ini_menurut_madzhab_syafi_i')} {t('hitung.nemu_yang_janggal')} <a href={TAUTAN_LAPORAN} target="_blank" rel="noopener">{t('umum.laporkan_ke_pengembang')}</a>.</p>
        {bolehUbah && (
          <div className="aksi-kaki">
            <button type="button" className="tautan-aksi" onClick={ubahData}>{t('hitung.ubah_data_2')}</button>
            <button type="button" className="tautan-aksi" onClick={() => setKonfirmasiUlangi(true)}>{t('umum.reset')}{t('hitung.skenario')}</button>
          </div>
        )}
      </footer>
      {konfirmasiUlangi && (
        <KonfirmasiKasusBaru kasus={kasus} judul={t('umum.reset_skenario')} labelLanjut={t('umum.reset')} saatBatal={() => setKonfirmasiUlangi(false)}
          saatLanjut={() => { setKonfirmasiUlangi(false); kirim({ jenis: 'ULANGI' }); }} />
      )}

      {orangDipilih && (
        <ModalOrang id={orangDipilih} graf={kasus.graf} ringkasan={ringkasan} daftarBab={daftarBab} bentuk={pengaturan.bentuk}
          sedangMenebak={sedangMenebak} sembunyiNominal={sembunyiNominal} saatTutup={() => setOrangDipilih(null)}
          saatUbah={bolehUbah ? kunci => { setOrangDipilih(null); setKunciDiubah(kunci); } : undefined} />
      )}
      {konfirmasiBuka && (
        <DialogKonfirmasi tahan
          judul={konfirmasiBuka === 'lihat' ? t('hitung.yakin_mau_lihat_jawaban') : t('hitung.pindah_ke_hitung_kasus')}
          labelBatal={konfirmasiBuka === 'lihat' ? t('hitung.coba_dulu') : t('hitung.tetap_belajar')}
          labelLanjut={konfirmasiBuka === 'lihat' ? t('hitung.tahan_untuk_buka') : t('hitung.tahan_untuk_pindah')}
          saatBatal={() => setKonfirmasiBuka(null)}
          saatLanjut={() => {
            const jenis = konfirmasiBuka;
            setKonfirmasiBuka(null);
            if (jenis === 'lihat') bukaJawaban();
            else kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'hitung' });
          }}>
          <ul className="poin-konfirmasi">
            <li>{t('hitung.semua_jawaban_langsung_kebuka_kamu_nggak')}</li>
            {!sudahMencoba && <li>{t('hitung.kamu_belum_nyoba_jawab_sama_sekali')}</li>}
            {/* Hanya soal latihan yang tercatat; XP-nya hanya dari tebakan benar (spec tahap 5). */}
            {konfirmasiBuka === 'lihat' && saatDikerjakan && <li>{t('hitung.soal_yang_jawabannya_dibuka_tidak_memberi_xp')}</li>}
          </ul>
        </DialogKonfirmasi>
      )}
      {konfirmasiBelajar && (
        <DialogKonfirmasi judul={t('hitung.pindah_ke_mode_belajar')} labelBatal={t('umum.tetap_di_sini')} labelLanjut={t('umum.pindah')}
          saatBatal={() => setKonfirmasiBelajar(false)}
          saatLanjut={() => { setKonfirmasiBelajar(false); kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'belajar' }); }}>
          <p>{t('hitung.jawaban_akan_disembunyikan_dan_kamu_diminta')}</p>
        </DialogKonfirmasi>
      )}
      {layarPenuh && (
        <PohonLayarPenuh pohon={pohon} zoomAwal={layarPenuh.zoom} legenda={<Legenda />} sembunyiNominal={sembunyiNominal}
          saatSembunyi={() => setSembunyiNominal(!sembunyiNominal)} saatEkspor={() => setEksporTerbuka(true)} saatTutup={() => setLayarPenuh(null)} />
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

/** Tiga keadaan kotak di pohon kaca: wafat (garis putus), menerima (hijau), tidak menerima (redup). */
function Legenda() {
  return (
    <div className="legenda" aria-label={t('hitung.keterangan_pohon')}>
      <span><i className="kotak almarhum" />{t('hitung.legenda_wafat')}</span>
      <span><i className="kotak menerima" />{t('hitung.legenda_menerima')}</span>
      <span><i className="kotak putus" />{t('hitung.legenda_tidak_menerima')}</span>
    </div>
  );
}
