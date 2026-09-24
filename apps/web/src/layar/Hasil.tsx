// Layar hasil. Menerima Kasus, menjalankan engine, menampilkan:
// OK → rincian tirkah, KartuHasil (+ selisih pembulatan), yang terhalang, penjelasan per bab;
// PERLU_INPUT / TIDAK_DIDUKUNG / galat → kartu pesan. Tidak ada hitungan waris di sini.

import { useMemo, useState } from 'react';
import type { GrafKeluarga, IdOrang, StatusOrang } from '@waris/engine';
import { jenisDari, type Kelompok } from '../checklist';
import { formatRupiah, namaOrang, penyebutAkhir, teksPecahan } from '../format';
import { jalankan, type HasilMunasakhatOk, type HasilOk } from '../jalankan';
import { keJson, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { KartuAhliWaris, KartuHasil, Tombol, type BarisHasil } from '../ui/komponen';
import { BabSebagaiLangkah, daftarBabDari } from './Penjelasan';

export function Hasil({ kasus, kirim }: { kasus: Kasus; kirim: (aksi: Aksi) => void }) {
  const tampil = useMemo(() => jalankan(kasus), [kasus]);
  const [penjelasanTerbuka, setPenjelasanTerbuka] = useState(false);
  const daftarBab = useMemo(() => daftarBabDari(kasus, tampil), [kasus, tampil]);
  const tombolUbah = <Tombol varian="secondary" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 4 })}>Ubah isian</Tombol>;

  if (tampil.jenis === 'galat') {
    return (
      <main className="halaman tumpuk">
        <div className="kartu kartu-galat tumpuk" role="alert">
          <h1 className="judul-langkah">Waduh, ada yang nggak beres di mesin hitungnya</h1>
          <p>Ini bukan salah isianmu. Tolong laporkan dan lampirkan data kasus di bawah.</p>
          <p className="keterangan">{tampil.pesan}</p>
          <Tombol varian="secondary" onClick={() => void navigator.clipboard?.writeText(keJson(kasus))}>Salin data kasus</Tombol>
        </div>
        {tombolUbah}
      </main>
    );
  }
  const hasil = tampil.hasil;
  if (hasil.status === 'PERLU_INPUT') {
    return (
      <main className="halaman tumpuk">
        <div className="kartu kartu-peringatan tumpuk" role="alert">
          <h1 className="judul-langkah">Bentar, masih ada yang perlu diisi</h1>
          <ul>{hasil.pertanyaan.map((pertanyaan, indeks) => <li key={indeks}>{pertanyaan.alasan}</li>)}</ul>
        </div>
        {tombolUbah}
      </main>
    );
  }
  if (hasil.status === 'TIDAK_DIDUKUNG') {
    return (
      <main className="halaman tumpuk">
        <div className="kartu kartu-peringatan tumpuk" role="alert">
          <h1 className="judul-langkah">Kasus ini belum bisa dihitung di sini</h1>
          <p>{hasil.alasan}</p>
          {'mayit' in hasil && <p className="keterangan">Terjadi saat menghitung ahli waris {String(hasil.mayit)}.</p>}
          {hasil.refs.length > 0 && <p className="keterangan">Rujukan: {hasil.refs.join(', ')}</p>}
        </div>
        {tombolUbah}
      </main>
    );
  }

  const { baris, selisih, terhalang } = tampil.jenis === 'biasa'
    ? ringkasBiasa(kasus.graf, hasil as HasilOk)
    : ringkasMunasakhat(kasus.graf, hasil as HasilMunasakhatOk);
  const bersih = kasus.tirkah.kotor - kasus.tirkah.tajhiz - kasus.tirkah.hutang - kasus.tirkah.wasiat;

  return (
    <main className="halaman tumpuk">
      <h1 className="judul-langkah">Nah, ini pembagiannya</h1>
      <div className="kartu keterangan">
        Harta {formatRupiah(kasus.tirkah.kotor)} − jenazah {formatRupiah(kasus.tirkah.tajhiz)} − hutang {formatRupiah(kasus.tirkah.hutang)} − wasiat {formatRupiah(kasus.tirkah.wasiat)}
      </div>
      <KartuHasil total={formatRupiah(bersih < 0n ? 0n : bersih)} stiker="Fix!" daftarBaris={baris} />
      <p className="keterangan">Selisih pembulatan: {formatRupiah(selisih)} (nggak dibagi, dicatat terpisah).</p>
      {terhalang.length > 0 && (
        <>
          <h2 className="judul-langkah" style={{ fontSize: 22 }}>Yang nggak dapat, dan kenapa</h2>
          <div className="aw-heirs">{terhalang.map(orang => <KartuAhliWaris key={orang.id} nama={orang.nama} kelompok={orang.kelompok} adalahMahjub catatan={orang.alasan} />)}</div>
        </>
      )}
      <div className="baris-tombol">
        {tombolUbah}
        <Tombol varian="sun" onClick={() => setPenjelasanTerbuka(!penjelasanTerbuka)}>Kok bisa gini?</Tombol>
        <Tombol onClick={() => kirim({ jenis: 'KE_LAYAR', layar: 'belajar' })}>Pelajari langkah demi langkah</Tombol>
      </div>
      {penjelasanTerbuka && (
        <div className="tumpuk">
          {daftarBab.map((babBerjudul, indeks) => <BabSebagaiLangkah key={indeks} nomor={indeks + 1} babBerjudul={babBerjudul} />)}
        </div>
      )}
    </main>
  );
}

interface OrangTerhalang { id: IdOrang; nama: string; kelompok: Kelompok; alasan: string }

function ringkasBiasa(graf: GrafKeluarga, hasil: HasilOk) {
  const penyebut = penyebutAkhir(hasil.tabel);
  const baris: BarisHasil[] = hasil.tabel.baris.flatMap(barisTabel => Object.entries(barisTabel.perOrang).map(([id, { saham, nominal }]) => ({
    nama: namaOrang(graf, hasil.statusOrang, id),
    kelompok: kelompokDari(hasil.statusOrang[id]),
    bagian: teksPecahan({ n: saham, d: penyebut }),
    bobot: Number(saham),   // hanya lebar visual BarBagian
    nominal: formatRupiah(nominal),
    ...(barisTabel.fardh ? { keterangan: `Fardh ${teksPecahan(barisTabel.fardh)}` } : barisTabel.ashabah ? { keterangan: 'Ashabah (sisa)' } : {}),
  })));
  return { baris, selisih: hasil.pembulatan.sisaPembulatan, terhalang: daftarTerhalang(graf, hasil.statusOrang) };
}

function ringkasMunasakhat(graf: GrafKeluarga, hasil: HasilMunasakhatOk) {
  const statusGabungan: Record<IdOrang, StatusOrang> = {};
  // Tiap orang dinamai dari mayit tempat ia pertama kali menjadi ahli waris (bukan "kerabat" mayit lain).
  for (const { hasil: hasilMayit } of hasil.daftarLangkah) {
    for (const [id, status] of Object.entries(hasilMayit.statusOrang)) {
      if (!statusGabungan[id] || (statusGabungan[id]!.jenis !== 'ahliWaris' && status.jenis === 'ahliWaris')) statusGabungan[id] = status;
    }
  }
  const baris: BarisHasil[] = Object.entries(hasil.saham).filter(([, saham]) => saham > 0n).map(([id, saham]) => ({
    nama: namaOrang(graf, statusGabungan, id),
    kelompok: kelompokDari(statusGabungan[id]),
    bagian: teksPecahan({ n: saham, d: hasil.jamiah }),
    bobot: Number(saham),
    nominal: formatRupiah(hasil.nominal[id] ?? 0n),
    keterangan: `Jami'ah ${String(hasil.jamiah)}`,
  }));
  return { baris, selisih: hasil.pembulatan.sisaPembulatan, terhalang: daftarTerhalang(graf, hasil.daftarLangkah[0]!.hasil.statusOrang) };
}

function daftarTerhalang(graf: GrafKeluarga, statusOrang: Record<IdOrang, StatusOrang>): OrangTerhalang[] {
  return Object.entries(statusOrang).flatMap(([id, status]) => {
    if (graf.orang[id]?.penghubung) return [];
    if (status.jenis === 'mahjub') {
      const oleh = status.oleh.map(idLain => namaOrang(graf, statusOrang, idLain)).join(', ');
      return [{ id, nama: namaOrang(graf, statusOrang, id), kelompok: kelompokDari(status), alasan: `Kehalang oleh ${oleh} [${status.rujukanAturan}]` }];
    }
    if (status.jenis === 'mamnu') {
      return [{ id, nama: namaOrang(graf, statusOrang, id), kelompok: kelompokDari(status), alasan: `Terhalang penghalang waris (${status.mani}) [${status.rujukanAturan}]` }];
    }
    return [];
  });
}

function kelompokDari(status: StatusOrang | undefined): Kelompok {
  if (!status || !('peran' in status)) return 'saudara';
  const kunci = status.peran.kunci;
  return kunci === 'DZAWIL_ARHAM' || kunci === 'BUKAN_AHLI_WARIS' ? 'saudara' : jenisDari(kunci)?.kelompok ?? 'saudara';
}
