// Layar hasil (gaya Logivo, acuan docs/design/mockup-hasil-gaya-logivo.html). Atas: hero gelap berisi judul, aksi utama (Ekspor),
// statistik, dan pratinjau seluruh pohon keluarga; mengetuk pohon membuka layar penuh (zoom, geser, penjelasan per orang, bagikan).
// Bawah: pita jawaban (Pembagian + rel samping: yang tidak dapat, harta, tindak lanjut) lalu pita cara menghitung (langkah, tabel faraidh,
// tentang kasus). Kartu hanya ada bila kasusnya memuatnya. HP: satu kolom, urutan = urutan DOM.
// Kaki bingkai: catatan + tautan Ubah data · Reset skenario. Semua angka dari engine lewat ringkas().
// PERLU_INPUT / TIDAK_DIDUKUNG / galat → kartu pesan, tanpa hasil setengah jadi.

import { useEffect, useMemo, useReducer, useState } from 'react';
import type { IdOrang, KunciAhliWaris, Ruleset } from '@waris/engine';
import { TAUTAN_LAPORAN } from '../konten/umum';
import type { RepositoriBagikan } from '@waris/data';
import { keJson, type Kasus } from '../kasus';
import { TOTAL_LANGKAH, type Aksi } from '../keadaan';
import { jalankan, type HasilOk } from '../jalankan';
import { useBahasa, type Tujuan } from '../preferensi';
import { PesanKasusKhusus } from '../hasil/HasilKasusKhusus';
import { KelompokDitahan, TabelKemungkinan, TabelPerHarta, TabelSkenarioGharqa, UbinDitahan, UbinKemungkinanUrutan, UbinMenunggu } from '../hasil/Ditahan';
import { DaftarAksi, UbinJenisMasalah, UbinSelanjutnya, UbinTentang } from '../hasil/KartuLain';
import { KartuLangkah } from '../hasil/KartuLangkah';
import { dataPeranDari } from '../hasil/ketukan';
import { KartuPembagian, type PengaturanTampil } from '../hasil/KartuPembagian';
import { ModalOrang } from '../hasil/ModalOrang';
import { LembarBagikan } from '../hasil/LembarBagikan';
import { ModalUbahHarta } from '../hasil/ModalUbahHarta';
import { ModalUbahJumlah } from '../hasil/ModalUbahJumlah';
import { KelompokMeninggal, KotakYangDibagi, TabelMunasakhatKitab, UbinUrutanPembagian } from '../hasil/Munasakhat';
import { rantaiMunasakhat } from '../hasil/munasakhat';
import { Pohon } from '../hasil/Pohon';
import { tahunWafat as tahunWafatKasus } from '../penandaMeninggal';
import { bisaTambahAnak } from '../kelompok';
import { tambahAnakBernama } from '../isianBagian';
import { namaSingkat } from '../keadaanOrang';
import { DialogTambahAnak } from './DialogTambahAnak';
import { PohonLayarPenuh } from '../hasil/PohonLayarPenuh';
import { adaTidakPas, adalahDzawilArham, pecahanTeks, persenTeks, ringkas, ringkasBiasa, type RingkasanHasil } from '../hasil/ringkasan';
import { jenisDari } from '../checklist';
import { susunLinimasa, susunLinimasaGharqa, susunLinimasaMunasakhat, susunLinimasaTaqdir, type Linimasa } from '@waris/explain';
import type { PeragaBabak } from '../hasil/urutanLinimasa';
import { kamusNarasi } from '../konten/kamusNarasi';
import { unduhKasus } from '../berkas';
import { PenyediaSorot } from '../hasil/sorot';
import { PanelPohon } from '../hasil/PanelPohon';
import { TabelFaraidh } from '../hasil/TabelFaraidh';
import { bacaJudulTersimpan, hapusTersimpan, ubahJudul } from '../tersimpan';
import { susunTeksRingkasan } from '../hasil/ringkasanTeks';
import { useSimpanOtomatis } from '../hasil/useSimpanOtomatis';
import { Toast, type IsiToast } from '../ui/Toast';
import { DialogNama } from './lab/DialogNama';
import { DialogBagikan } from './DialogBagikan';
import { BandingMadzhab } from './BandingMadzhab';
import { DialogMadzhab, namaMadzhab } from './DialogMadzhab';
import { sudahDibagikan } from '../bagikanLokal';
import { ringkasKasus } from '../riwayat';
import { formatRupiah, formatRupiahRingkas } from '../format';
import { Tombol } from '../ui/komponen';
import { DialogKonfirmasi } from '../ui/Dialog';
import { Ikon } from '../ui/Ikon';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
import { daftarBabDari } from './Penjelasan';
import { angka, t } from '../terjemah';

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
  /** Tampilan penerima tautan: tanpa ubah data, reset, bagikan, dan pindah tujuan. */
  hanyaBaca?: boolean | undefined;
  /** Ada = "Bagikan tautan" tampil di lembar Bagikan (hanya untuk pengguna yang sudah masuk). */
  bagikan?: RepositoriBagikan | undefined;
  /** Soal latihan tidak disimpan otomatis (spec A4). */
  tanpaSimpan?: boolean | undefined;
  /** Sesi ini ditandai "Jangan simpan kasus ini": state sesi (bukan disimpan), dipegang pemanggil supaya bertahan antar-layar. */
  janganSimpan?: boolean | undefined;
  saatJanganSimpan?: ((nilai: boolean) => void) | undefined;
}

/** Syafi'i = bawaan, jadi disimpan sebagai tanpa field `madzhab`. */
const aturMadzhab = (kasus: Kasus, ruleset: Ruleset): Kasus => {
  const { madzhab: _lama, ...tanpa } = kasus;
  return ruleset === 'syafii' ? tanpa : { ...tanpa, madzhab: ruleset };
};

/** Pohon lebih besar dari ini cukup tampil diam. */
const BATAS_ALIRAN = 40;

export function Hasil({ kasus, idSesi, tujuan, kirim, saatDikerjakan, terkunci, hanyaBaca, bagikan, tanpaSimpan, janganSimpan, saatJanganSimpan }: Props) {
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
  if ((tampil.jenis === 'taqdir' || tampil.jenis === 'gharqa' || tampil.jenis === 'menunggu')
    && (tampil.hasil.status === 'PERLU_INPUT' || tampil.hasil.status === 'TIDAK_DIDUKUNG' || tampil.hasil.status === 'MAUQUF_SEMUA')) {
    return <PesanKasusKhusus kasus={kasus} hasil={tampil.hasil} kirim={kirim} />;
  }
  if ((tampil.jenis === 'biasa' || tampil.jenis === 'munasakhat') && tampil.hasil.status !== 'OK') {
    const hasil = tampil.hasil;
    return (
      <main className="halaman tumpuk">
        <div className="kartu kartu-peringatan tumpuk" role="alert">
          <h1 className="judul-langkah">{hasil.status === 'PERLU_INPUT' ? t('hitung.bentar_masih_ada_yang_perlu_diisi') : t('hitung.kasus_ini_belum_bisa_dihitung_di')}</h1>
          {hasil.status === 'PERLU_INPUT'
            ? <ul>{hasil.pertanyaan.map((pertanyaan, indeks) => <li key={indeks}>{pertanyaan.alasan}</li>)}</ul>
            : <p>{hasil.alasan}</p>}
          {hasil.status === 'TIDAK_DIDUKUNG' && kasus.madzhab && !hanyaBaca && (
            <button type="button" className="tautan-aksi" onClick={() => kirim({ jenis: 'UBAH_KASUS', ubah: k => aturMadzhab(k, 'syafii') })}>{t('hitung.hitung_menurut_syafii')}</button>
          )}
        </div>
        {tombolUbah}
      </main>
    );
  }
  return <PenyediaSorot><HasilOkLayar kasus={kasus} idSesi={idSesi} tujuan={tujuan} kirim={kirim} saatDikerjakan={saatDikerjakan} terkunci={terkunci} hanyaBaca={hanyaBaca} bagikan={bagikan}
    tanpaSimpan={tanpaSimpan} janganSimpan={janganSimpan} saatJanganSimpan={saatJanganSimpan} /></PenyediaSorot>;
}

function HasilOkLayar({ kasus, idSesi, tujuan, kirim, saatDikerjakan, terkunci, hanyaBaca, bagikan, tanpaSimpan, janganSimpan, saatJanganSimpan }: Props) {
  const [, segarkan] = useReducer((n: number) => n + 1, 0);
  const tampil = useMemo(() => jalankan(kasus), [kasus]);
  const ringkasan = useMemo(() => ringkas(kasus, tampil), [kasus, tampil]);
  const bahasa = useBahasa();
  const daftarBab = useMemo(() => daftarBabDari(kasus, tampil, bahasa), [kasus, tampil, bahasa]);
  const tampilPembulatan = useMemo(() => adaTidakPas(kasus), [kasus]);
  // Taqdir, menunggu kelahiran, dan gharqa belum punya mode Belajar (tebakan): selalu tampil sebagai hasil hitung.
  const khusus = ringkasan.jenis === 'taqdir' || ringkasan.jenis === 'menunggu' || ringkasan.jenis === 'gharqa';
  const adalahBelajar = tujuan === 'belajar' && !khusus;
  const menunggu = ringkasan.jenis === 'menunggu';
  const gharqaDitahan = !!ringkasan.gharqa?.skenario;
  // Setiap kasus yang sampai di sini tersimpan otomatis (termasuk menunggu kelahiran), kecuali soal latihan, tautan penerima, dan "Jangan simpan".
  const statusSimpan = useSimpanOtomatis(idSesi, kasus, !hanyaBaca && !tanpaSimpan && !janganSimpan);
  // Penanda halaman: latar sage, bingkai krem, dan nav menyatu dengan hero (CSS body.layar-hasil).
  useEffect(() => { document.body.classList.add('layar-hasil'); return () => document.body.classList.remove('layar-hasil'); }, []);
  const bolehUbah = !hanyaBaca && !(terkunci && adalahBelajar);
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
  const [konfirmasiBuka, setKonfirmasiBuka] = useState<'lihat' | null>(null);
  const [sembunyiManual, setSembunyiManual] = useState(false);
  // Susunan cepat belum punya harta: rupiah tersembunyi sampai "Ubah harta" diisi, jadi tidak tampil "Rp 0".
  const hartaKosong = kasus.tirkah.kotor <= 0n;
  const sembunyiNominal = sembunyiManual || hartaKosong;
  const setSembunyiNominal = setSembunyiManual;
  const [namaTerbuka, setNamaTerbuka] = useState(false);
  const [waktuHitung] = useState(() => Date.now());
  const [pengaturan, setPengaturan] = useState<PengaturanTampil>({ bentuk: 'sederhana' });
  // HP: pohon dan tabel tidak muat berdampingan, jadi tampil satu per satu lewat sakelar (CSS menyembunyikan sakelar di laptop).
  const [panelHp, setPanelHp] = useState<'pohon' | 'tabel'>('pohon');
  const [layarPenuh, setLayarPenuh] = useState<{ zoom: number } | null>(null);
  const [orangDipilih, setOrangDipilih] = useState<IdOrang | null>(null);
  const [kunciDiubah, setKunciDiubah] = useState<KunciAhliWaris | null>(null);
  const [ubahHartaTerbuka, setUbahHartaTerbuka] = useState(false);
  const [lembarTerbuka, setLembarTerbuka] = useState(false);
  const [bagikanTerbuka, setBagikanTerbuka] = useState(false);
  const [toast, setToast] = useState<IsiToast | null>(null);
  const [konfirmasiUlangi, setKonfirmasiUlangi] = useState(false);
  const [madzhabTerbuka, setMadzhabTerbuka] = useState(false);
  const madzhab = kasus.madzhab ?? 'syafii';
  const ubahGraf = (ubah: (graf: Kasus['graf']) => Kasus['graf']) => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, graf: ubah(k.graf) }) });
  const namaPewaris = kasus.graf.orang[kasus.graf.idPewaris]?.nama?.trim() || '';
  const jumlahOrang = Object.values(kasus.graf.orang).filter(orang => !orang.penghubung).length;
  const hasilBiasa = tampil.jenis === 'biasa' ? tampil.hasil as HasilOk : null;
  const idBerbeda = useMemo(() => new Set((hasilBiasa?.jejak ?? []).flatMap(langkah => (langkah.jenis === 'KHILAF_MADZHAB' ? langkah.idOrang : []))), [hasilBiasa]);
  // Aliran harta hanya di pratinjau hero (sekali per hasil, bisa diputar ulang); pohon besar tidak berputar tiap dibuka.
  const [putaranAliran, setPutaranAliran] = useState(1);
  const bolehAliran = !sedangMenebak && jumlahOrang <= BATAS_ALIRAN;
  const buatPohon = (aliran: boolean) => <Pohon key={aliran ? putaranAliran : 'diam'} graf={kasus.graf} ringkasan={ringkasan} urutanWafat={kasus.urutanWafat} bentuk={pengaturan.bentuk}
    sedangMenebak={sedangMenebak} sembunyiNominal={sembunyiNominal} saatPilih={setOrangDipilih} aliran={aliran && bolehAliran} tahunWafat={id => tahunWafatKasus(kasus, id)} />;
  const pohon = buatPohon(false);
  // Jalan pintas di layar penuh: hanya mode hitung yang boleh mengubah data.
  const [anakDitambahDi, setAnakDitambahDi] = useState<IdOrang | null>(null);
  const bolehTambahAnak = !sedangMenebak && !hanyaBaca && !terkunci;
  const pohonLayarPenuh = !bolehTambahAnak ? pohon : (
    <Pohon graf={kasus.graf} ringkasan={ringkasan} urutanWafat={kasus.urutanWafat} bentuk={pengaturan.bentuk}
      sedangMenebak={sedangMenebak} sembunyiNominal={sembunyiNominal} saatPilih={setOrangDipilih} tahunWafat={id => tahunWafatKasus(kasus, id)}
      aksiNode={id => bisaTambahAnak(kasus, id) && (
        <button type="button" className="tambah-anak-node" aria-label={t('hitung.pohon.judul_tambah_anak', { nama: namaSingkat(kasus, id) })}
          onClick={() => setAnakDitambahDi(id)}><Ikon nama="tambah" /></button>
      )} />
  );
  const umumKhusus = { graf: kasus.graf, ringkasan, sembunyiNominal, saatPilih: setOrangDipilih };
  const rantai = useMemo(() => (tampil.jenis === 'munasakhat' && tampil.hasil.status === 'OK'
    ? { hasil: tampil.hasil, langkah: rantaiMunasakhat(tampil.hasil, ringkasan.tirkah.bersih, kasus.satuanPembulatan) } : null), [tampil, ringkasan, kasus.satuanPembulatan]);
  const umumRantai = rantai && { graf: kasus.graf, ringkasan, rantai: rantai.langkah, sembunyiNominal, saatPilih: setOrangDipilih };
  const tabel = umumRantai && !sedangMenebak ? <TabelMunasakhatKitab {...umumRantai} nominal={rantai!.hasil.nominal} />
    : ringkasan.taqdir ? <TabelKemungkinan {...umumKhusus} />
    : gharqaDitahan ? <TabelSkenarioGharqa {...umumKhusus} />
    : ringkasan.gharqa ? <TabelPerHarta {...umumKhusus} daftarHarta={ringkasan.gharqa.harta} />
    : <TabelFaraidh hasil={hasilBiasa} ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} sedangMenebak={sedangMenebak} saatPilih={setOrangDipilih} />;
  // Dzawil arham: linimasanya tanpa tabel bertahap (tabel: []), jadi tanpa babak seperti taqdir dan gharqa.
  const adaDzawilArham = Object.values(ringkasan.statusOrang).some(adalahDzawilArham);
  const hasilMunasakhat = tampil.jenis === 'munasakhat' && tampil.hasil.status === 'OK' ? tampil.hasil : null;
  const { linimasa, babakLinimasa } = useMemo((): { linimasa: Linimasa | null; babakLinimasa: PeragaBabak[] | null } => {
    try { return susunSemuaLinimasa(); } catch { return { linimasa: null, babakLinimasa: null }; } // gagal menyusun = pakai daftar lama, layar Hasil tetap hidup
    function susunSemuaLinimasa(): { linimasa: Linimasa | null; babakLinimasa: PeragaBabak[] | null } {
    if (sedangMenebak) return { linimasa: null, babakLinimasa: null };
    if (hasilBiasa) return { linimasa: susunLinimasa(hasilBiasa, kasus.graf, { kamus: kamusNarasi }), babakLinimasa: adaDzawilArham ? [] : [{ hasil: hasilBiasa, ringkasan }] };
    if (hasilMunasakhat) {
      return {
        linimasa: susunLinimasaMunasakhat(hasilMunasakhat, kasus.graf, { kamus: kamusNarasi }),
        babakLinimasa: hasilMunasakhat.daftarLangkah.map(langkah => ({ hasil: langkah.hasil, ringkasan: ringkasBiasa({ ...kasus.graf, idPewaris: langkah.mayit }, langkah.hasil) })),
      };
    }
    // Taqdir/menunggu dan gharqa tidak punya tabel pipeline: tanpa babak.
    // 'menunggu' belum membagi apa pun (layar Hasil menyatakan itu), jadi tidak diceritakan sebagai "dibagi sekarang".
    if (tampil.jenis === 'taqdir' && tampil.hasil.status === 'OK') {
      return { linimasa: susunLinimasaTaqdir(tampil.hasil, kasus.graf, { kamus: kamusNarasi }), babakLinimasa: [] };
    }
    if (tampil.jenis === 'gharqa' && (tampil.hasil.status === 'OK' || tampil.hasil.status === 'MAUQUF') && kasus.gharqa) {
      return { linimasa: susunLinimasaGharqa(tampil.hasil, kasus.graf, kasus.gharqa.keadaan, { kamus: kamusNarasi }), babakLinimasa: [] };
    }
    return { linimasa: null, babakLinimasa: null };
    }
  }, [tampil, hasilBiasa, hasilMunasakhat, kasus.gharqa, sedangMenebak, adaDzawilArham, kasus.graf, ringkasan]);
  const dataPeran = useMemo(() => dataPeranDari(kasus.graf, ringkasan, hasilBiasa?.tabel ?? null, kasus.urutanWafat, hasilBiasa?.jejak), [kasus, ringkasan, hasilBiasa]);

  const kamu = kasus.saya ? ringkasan.penerima.find(orang => orang.id === kasus.saya) : undefined;
  const peranKamu = kamu?.kunci && jenisDari(kamu.kunci)?.label.toLowerCase();
  const namaMayit = (id: IdOrang) => namaSingkat(kasus, id);
  const daftarMayit = ringkasan.gharqa ? ringkasan.gharqa.anggota.map(namaMayit) : [namaPewaris || t('hitung.almarhum'), ...kasus.urutanWafat.map(namaMayit)];
  const hero = teksHero(ringkasan, daftarMayit, namaPewaris, madzhab);
  const teksRingkasan = susunTeksRingkasan(ringkasan, kasus, { sembunyiNominal, bentuk: pengaturan.bentuk });
  const salinTeks = async () => {
    try { await navigator.clipboard.writeText(teksRingkasan); setToast({ teks: t('hasil.bagikan_lembar.teks_disalin') }); }
    catch { setToast({ teks: t('hasil.bagikan_lembar.gagal_salin') }); }
  };
  const kirimTeks = async () => {
    // Dibatalkan pengguna = bukan galat; tanpa menu bagikan perangkat, teks disalin (pola ui/Bagikan.tsx).
    if (navigator.share) await navigator.share({ text: teksRingkasan }).catch(() => {});
    else await salinTeks();
  };
  const janganSimpanKasus = () => {
    hapusTersimpan(idSesi);
    saatJanganSimpan?.(true);
    setLembarTerbuka(false);
    setToast({ teks: t('hasil.simpan.dihapus'), aksi: { label: t('hasil.simpan.urungkan'), saat: () => { saatJanganSimpan?.(false); setToast(null); } } });
  };
  const namaKasus = bacaJudulTersimpan(idSesi) ?? kasus.nama ?? ringkasKasus(kasus).judul;
  const jamSimpan = statusSimpan.jenis === 'tersimpan'
    ? angka(statusSimpan.pada.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })) : null;

  return (
    <main className={adalahBelajar ? 'halaman-hasil mode-belajar' : 'halaman-hasil'}>
      <header className="hero-hasil">
        <div className="bilah-hero">
          {adalahBelajar
            ? <p className="lok-hero">{sedangMenebak ? t('hitung.soal') : t('hitung.pembahasan')}</p>
            : bolehUbah ? <button type="button" className="tautan-hero" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: TOTAL_LANGKAH })}><Ikon nama="kembali" ukuran={18} />{t('hitung.langkah_periksa')}</button> : <span />}
          {!adalahBelajar && (
            <div className="kanan-bilah">
              {!hanyaBaca && <span className="status-simpan" role="status">{jamSimpan ? <><Ikon nama="benar" ukuran={14} />{t('hasil.simpan.tersimpan', { jam: jamSimpan })}</> : t('hasil.simpan.tidak_disimpan')}</span>}
              <span className={hero.ditahan ? 'status-hero tahan' : 'status-hero'}><i />{hero.status}</span>
              {!hanyaBaca && <button type="button" className="tautan-hero" onClick={() => setLembarTerbuka(true)}><Ikon nama="bagikan" ukuran={18} />{t('umum.bagikan')}</button>}
            </div>
          )}
        </div>
        <div className="isi-hero">
          <div className="judul-soal">
            {!adalahBelajar && (
              <div className="nama-kasus"><span>{namaKasus}</span>
                {statusSimpan.jenis === 'tersimpan' && <button type="button" className="pensil-nama" aria-label={t('hasil.ubah_nama_kasus')} onClick={() => setNamaTerbuka(true)}><Ikon nama="pensil" ukuran={16} /></button>}
              </div>
            )}
            {adalahBelajar
              ? <h1>{sedangMenebak ? t('hitung.tentukan_bagian_tiap_ahli_waris') : t('hitung.pembahasan_soal')}</h1>
              : <h1>{hero.judul}</h1>}
            <p className="kalimat-hero">{adalahBelajar
              ? (sedangMenebak ? t('hitung.kerjakan_di_kartu_jawabanmu_langkah_perhitungan') : t('hitung.cocokkan_jawabanmu_lalu_pelajari_cara_menghitungnya'))
              : hero.kalimat}</p>
            {!sedangMenebak && daftarMayit.length > 1 && <div className="fakta-hero">
              <span>{t('hasil.jumlah_mayit', { jumlah: angka(String(daftarMayit.length)) })}</span>
            </div>}
          </div>
          {!sedangMenebak && (
            <div className="ubin-hero">
              {kamu && !menunggu && (
                <button type="button" className="uh kamu" onClick={() => setOrangDipilih(kamu.id)}>
                  <span className="lbl">{peranKamu ? t('hasil.bagianmu_sebagai', { peran: peranKamu }) : t('hasil.bagianmu')}</span>
                  <b>{sembunyiNominal ? t('hitung.rp') : formatRupiah(kamu.nominal)}</b>
                  <small>{kamu.rincian ?? <>{pecahanTeks(kamu.saham, ringkasan.penyebut, pengaturan.bentuk)} · {persenTeks(kamu.saham, ringkasan.penyebut)}</>}</small>
                </button>
              )}
              {ubinHero(ringkasan, sembunyiNominal).map(ubin => (
                <div key={ubin.label} className={ubin.tahan ? 'uh tahan' : ubin.lebar ? 'uh lebar' : 'uh'}><span className="lbl">{ubin.label}</span><b>{ubin.nilai}</b>{ubin.kecil && <small>{ubin.kecil}</small>}</div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Bento (acuan-hasil-final.html): daftar + kolom info → pohon & tabel → bagikan · selanjutnya · pelajari.
          Ubin yang tidak ada isinya untuk kasus ini tidak dirender. HP: satu kolom, urutan = urutan DOM. */}
      <div className="tata-hasil">
        <div className="bento-s7">
          {menunggu ? <UbinMenunggu ringkasan={ringkasan} saatPilih={setOrangDipilih}
            saatBagiSekarang={bolehUbah ? () => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, pilihanJanin: 'hitungSekarang' }) }) : undefined} />
          : gharqaDitahan ? <UbinKemungkinanUrutan {...umumKhusus} />
          : <KartuPembagian ringkasan={ringkasan} pengaturan={pengaturan} saatUbahPengaturan={setPengaturan} adalahBelajar={adalahBelajar}
            sembunyiNominal={sembunyiNominal} saatSembunyi={hartaKosong && bolehUbah ? () => setUbahHartaTerbuka(true) : () => setSembunyiNominal(!sembunyiNominal)} hartaKosong={hartaKosong && bolehUbah}
            sedangMenebak={sedangMenebak} saatTampilkanJawaban={() => setKonfirmasiBuka('lihat')} saatTebakanBenar={jawabBenar} tebakanBenar={tebakanBenar} saatMencobaMenjawab={() => setSudahMencoba(true)}
            tampilPembulatan={tampilPembulatan} satuanPembulatan={kasus.satuanPembulatan}
            saatUbahPembulatan={satuan => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, satuanPembulatan: satuan }) })}
            idBerbeda={idBerbeda} saatPilihOrang={setOrangDipilih}
            pembuka={umumRantai && <KotakYangDibagi graf={kasus.graf} ringkasan={ringkasan} />}
            kelompokTambahan={umumRantai ? <KelompokMeninggal {...umumRantai} />
              : ringkasan.ditahan && <KelompokDitahan ringkasan={ringkasan} judul={t('hasil.ditahan.ditahan')} saatPilih={setOrangDipilih} />} />}
          {madzhab !== 'syafii' && <p className="catatan-madzhab">{t('hitung.madzhab_sumber_sekunder', { nama: namaMadzhab(madzhab) })}</p>}
          {adalahBelajar && !sedangMenebak && (
            <BandingMadzhab kasus={kasus} aktif={madzhab} sembunyiNominal={sembunyiNominal}
              saatPilih={ruleset => kirim({ jenis: 'UBAH_KASUS', ubah: k => aturMadzhab(k, ruleset) })} />
          )}
        </div>
        {!sedangMenebak && (
          <div className="bento-s5">
            <UbinJenisMasalah ringkasan={ringkasan} daftarMayit={daftarMayit} />
            {!menunggu && !gharqaDitahan && <UbinDitahan ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} />}
            <UbinTentang waktuHitung={waktuHitung} namaMadzhab={madzhab === 'syafii' ? undefined : namaMadzhab(madzhab)} ringkasan={ringkasan} satuanPembulatan={kasus.satuanPembulatan} sembunyiNominal={sembunyiNominal}
              saatUbahHarta={bolehUbah && !ringkasan.gharqa ? () => setUbahHartaTerbuka(true) : undefined}
              saatUbahMadzhab={bolehUbah && !adalahBelajar ? () => setMadzhabTerbuka(true) : undefined}
              saatUbahAhliWaris={bolehUbah ? () => kirim({ jenis: 'KE_LANGKAH', langkah: 3 }) : undefined}
              saatUbahPembulatan={bolehUbah && tampilPembulatan ? satuan => kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, satuanPembulatan: satuan }) }) : undefined} />
          </div>
        )}
        {umumRantai && !sedangMenebak && <UbinUrutanPembagian {...umumRantai} />}
        <section className="ubin-h bento-s12 ubin-pohon-tabel" data-tur="pohon" aria-labelledby="judul-pohon-tabel" data-tampil={panelHp}>
          <div className="kepala-ubin">
            <div>
              <h2 id="judul-pohon-tabel">{t('hasil.judul_bagaimana_dibagi')}</h2>
              <p className="sub-kartu">{t('hasil.pohon_dan_tabel_sub')}</p>
            </div>
            <div className="segmen sakelar-hp" role="radiogroup" aria-label={t('hasil.pohon_dan_tabel')}>
              <button type="button" role="radio" aria-checked={panelHp === 'pohon'} onClick={() => setPanelHp('pohon')}>{t('hasil.pohon')}</button>
              <button type="button" role="radio" aria-checked={panelHp === 'tabel'} onClick={() => setPanelHp('tabel')}>{t('hasil.tabel')}</button>
            </div>
          </div>
          <div className="isi-pohon-tabel">
            <PanelPohon pohon={buatPohon(true)} legenda={<Legenda />} saatLayarPenuh={() => setLayarPenuh({ zoom: 1 })}
              saatPutar={bolehAliran ? () => setPutaranAliran(putaranAliran + 1) : undefined} />
            <div className="panel-tabel-hasil">
              <h3 id="judul-tabel-faraidh" className="judul-panel">{umumRantai ? t('hasil.munasakhat.tabel_munasakhat') : ringkasan.taqdir ? t('hasil.ditahan.tabel_kemungkinan') : ringkasan.gharqa ? t('hasil.gharqa.tabel_per_harta') : t('hitung.tabel_faraidh')}</h3>
              <div className="wadah-tabel">{tabel}</div>
            </div>
          </div>
        </section>
        {!sedangMenebak && <div className="bento-s4"><UbinSelanjutnya /></div>}
        <section className="ubin-h gelap bento-s4 ubin-pelajari" aria-labelledby="judul-pelajari">
          <h2 id="judul-pelajari">{t('hasil.pelajari_cara_menghitungnya')}</h2>
          <p className="sub-kartu">{t('hasil.pelajari_sub')}</p>
          <KartuLangkah daftarBab={daftarBab} dataPeran={dataPeran} ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} terkunci={sedangMenebak} adalahBelajar={adalahBelajar} pohon={pohon} linimasa={linimasa} babak={babakLinimasa} />
          {!adalahBelajar && bolehUbah && <DaftarAksi daftar={[
            { ikon: 'rujukan', judul: t('hasil.bandingkan_madzhab'), keterangan: t('hasil.bandingkan_madzhab_ket'), saatPilih: () => setMadzhabTerbuka(true) },
          ]} />}
        </section>
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

      {madzhabTerbuka && <DialogMadzhab awal={madzhab} saatBatal={() => setMadzhabTerbuka(false)}
        saatPakai={ruleset => { setMadzhabTerbuka(false); kirim({ jenis: 'UBAH_KASUS', ubah: k => aturMadzhab(k, ruleset) }); }} />}
      {orangDipilih && (
        <ModalOrang id={orangDipilih} graf={kasus.graf} ringkasan={ringkasan} daftarBab={daftarBab} hasil={hasilBiasa} bentuk={pengaturan.bentuk}
          sedangMenebak={sedangMenebak} sembunyiNominal={sembunyiNominal} saatTutup={() => setOrangDipilih(null)}
          saatUbah={bolehUbah ? kunci => { setOrangDipilih(null); setKunciDiubah(kunci); } : undefined} />
      )}
      {konfirmasiBuka && (
        <DialogKonfirmasi tahan
          judul={t('hitung.yakin_mau_lihat_jawaban')}
          labelBatal={t('hitung.coba_dulu')} labelLanjut={t('hitung.tahan_untuk_buka')}
          saatBatal={() => setKonfirmasiBuka(null)}
          saatLanjut={() => { setKonfirmasiBuka(null); bukaJawaban(); }}>
          <ul className="poin-konfirmasi">
            <li>{t('hitung.semua_jawaban_langsung_kebuka_kamu_nggak')}</li>
            {!sudahMencoba && <li>{t('hitung.kamu_belum_nyoba_jawab_sama_sekali')}</li>}
            {/* Hanya soal latihan yang tercatat; XP-nya hanya dari tebakan benar (spec tahap 5). */}
            {saatDikerjakan && <li>{t('hitung.soal_yang_jawabannya_dibuka_tidak_memberi_xp')}</li>}
          </ul>
        </DialogKonfirmasi>
      )}
      {layarPenuh && (
        <PohonLayarPenuh pohon={pohonLayarPenuh} zoomAwal={layarPenuh.zoom} legenda={<Legenda />} sembunyiNominal={sembunyiNominal}
          saatSembunyi={() => setSembunyiNominal(!sembunyiNominal)} saatEkspor={() => setLembarTerbuka(true)} saatTutup={() => setLayarPenuh(null)} />
      )}
      {anakDitambahDi && (
        <DialogTambahAnak namaOrangTua={namaSingkat(kasus, anakDitambahDi)} saatBatal={() => setAnakDitambahDi(null)}
          saatSimpan={(jenisKelamin, nama) => {
            kirim({ jenis: 'UBAH_KASUS', ubah: k => tambahAnakBernama(k, anakDitambahDi, jenisKelamin, nama) });
            setAnakDitambahDi(null);
          }} />
      )}
      {namaTerbuka && <DialogNama judulAwal={namaKasus} saatBatal={() => setNamaTerbuka(false)}
        saatSimpan={nama => { ubahJudul(idSesi, nama); setNamaTerbuka(false); segarkan(); }} />}
      {bagikanTerbuka && bagikan && <DialogBagikan idRiwayat={idSesi} kasus={kasus} repo={bagikan} saatTutup={() => setBagikanTerbuka(false)} />}
      {lembarTerbuka && (
        <LembarBagikan teks={teksRingkasan} saatTutup={() => setLembarTerbuka(false)}
          saatKirim={() => void kirimTeks()} saatSalin={() => void salinTeks()} saatUnduh={() => unduhKasus(kasus)}
          tautan={bagikan && bolehUbah ? { judul: sudahDibagikan(idSesi) ? t('bagikan.kelola') : t('hasil.bagikan_tautan'), saatPilih: () => { setLembarTerbuka(false); setBagikanTerbuka(true); } } : undefined}
          saatJanganSimpan={!hanyaBaca && !tanpaSimpan && !janganSimpan ? janganSimpanKasus : undefined} />
      )}
      <Toast isi={toast} saatHilang={() => setToast(null)} />
      {kunciDiubah && <ModalUbahJumlah kunci={kunciDiubah} graf={kasus.graf} ubahGraf={ubahGraf} saatTutup={() => setKunciDiubah(null)} />}
      {ubahHartaTerbuka && (
        <ModalUbahHarta kasus={kasus} saatTutup={() => setUbahHartaTerbuka(false)}
          saatBukaKewajiban={() => kirim({ jenis: 'KE_LANGKAH', langkah: 2 })}
          saatSimpan={kotor => {
            setUbahHartaTerbuka(false);
            kirim({ jenis: 'UBAH_KASUS', ubah: k => { const { rincianHarta: _rincian, ...tanpaRincian } = k; return { ...tanpaRincian, tirkah: { ...k.tirkah, kotor } }; } });
          }} />
      )}
    </main>
  );
}

/** Status, judul, dan kalimat hero menurut jenis kasus (acuan-hasil-final.html: Pasti / Sebagian ditahan / Ditunda / Ditahan). */
function teksHero(ringkasan: RingkasanHasil, daftarMayit: string[], namaPewaris: string, madzhab: Ruleset): { status: string; ditahan: boolean; judul: string; kalimat: string } {
  const nama = namaPewaris || t('hitung.almarhum');
  if (ringkasan.jenis === 'menunggu') return { status: t('hasil.ditahan.status_ditunda'), ditahan: true, judul: t('hasil.ditahan.judul_menunggu'), kalimat: t('hasil.titipan.menunggu_isi') };
  if (ringkasan.gharqa?.skenario) return { status: t('hasil.ditahan.ditahan'), ditahan: true, judul: t('hasil.gharqa.judul_ditahan'), kalimat: t('hasil.titipan.gharqa_ditahan') };
  if (ringkasan.gharqa) return { status: t('hasil.status_pasti'), ditahan: false, judul: t('hasil.pembagian_harta_nama', { nama: daftarMayit.join(t('umum.dan')) }), kalimat: t('hasil.titipan.gharqa_pembuka') };
  if (ringkasan.ditahan && ringkasan.ditahan.nominal > 0n) return { status: t('hasil.ditahan.status_sebagian'), ditahan: true, judul: t('hasil.ditahan.judul_sebagian', { nama }), kalimat: t('hasil.ditahan.kalimat_sebagian') };
  return {
    status: t('hasil.status_pasti'), ditahan: false,
    judul: namaPewaris ? t('hasil.pembagian_harta_nama', { nama: namaPewaris }) : t('hitung.nah_ini_pembagiannya'),
    kalimat: t('hasil.menurut_madzhab_dibagi', { nama: namaMadzhab(madzhab), jumlah: angka(String(ringkasan.penerima.length)) }),
  };
}

/** Dua ubin kecil di hero (selain "Bagianmu"), menurut jenis kasus. */
function ubinHero(ringkasan: RingkasanHasil, sembunyi: boolean): Array<{ label: string; nilai: string; kecil?: string; tahan?: boolean; lebar?: boolean }> {
  const uang = (nilai: bigint) => (sembunyi ? t('hitung.rp') : formatRupiahRingkas(nilai));
  const daftarNama = (daftar: Array<{ nama: string }>) => daftar.map(orang => orang.nama).join(', ');
  const ditahan = ringkasan.ditahan;
  if (ringkasan.jenis === 'menunggu') {
    return [{ label: t('hasil.ditahan.harta'), nilai: uang(ringkasan.tirkah.bersih), kecil: t('hasil.ditahan.belum_dibagi_kecil') },
      { label: t('hasil.ditahan.sudah_pasti'), nilai: t('hasil.jumlah_orang', { jumlah: angka(String(ringkasan.penerima.length)) }), kecil: daftarNama(ringkasan.penerima) }];
  }
  if (ringkasan.gharqa?.skenario) {
    return [{ label: t('hasil.ditahan.ditahan'), nilai: uang(ringkasan.tirkah.bersih), kecil: t('hasil.gharqa.sampai_ingat'), tahan: true },
      { label: t('hasil.gharqa.kemungkinan'), nilai: t('hasil.gharqa.jumlah_urutan', { jumlah: angka(String(ringkasan.gharqa.skenario.length)) }), kecil: t('hasil.gharqa.bahan_musyawarah') }];
  }
  if (ringkasan.gharqa) return ringkasan.gharqa.harta.map(harta => ({ label: t('hasil.titipan.harta_nama', { nama: harta.nama }), nilai: uang(harta.bersih) }));
  if (ditahan && ditahan.nominal > 0n) {
    return [{ label: t('hasil.ditahan.dibagi_sekarang'), nilai: uang(ringkasan.penerima.reduce((jumlah, orang) => jumlah + orang.nominal, 0n)), kecil: daftarNama(ringkasan.penerima) },
      { label: t('hasil.ditahan.ditahan'), nilai: uang(ditahan.nominal), kecil: t('hasil.ditahan.untuk_nama', { nama: daftarNama(ditahan.orang) }), tahan: true }];
  }
  // Ubin lebar penuh: nominal utuh seperti mockup (bukan ringkas).
  return [{ label: t('hasil.harta_dibagi'), nilai: sembunyi ? t('hitung.rp') : formatRupiah(ringkasan.tirkah.bersih), kecil: t('hasil.sudah_bersih_utang_wasiat'), lebar: true }];
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
