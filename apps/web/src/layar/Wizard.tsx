// Wizard 5 langkah, satu pertanyaan per layar. Menerima keadaan + kirim(aksi);
// menyerahkan Kasus yang sudah lengkap ke layar hasil lewat KE_LAYAR 'hasil'.

import { useState } from 'react';
import { bolehUbahJenisKelamin } from '@waris/engine';
import { SATUAN_PEMBULATAN, type Kasus } from '../kasus';
import { TOTAL_LANGKAH, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { bacaInputUang, formatRupiah } from '../format';
import { Pilihan, Stiker, Tombol } from '../ui/komponen';
import { LangkahAhliWaris } from './LangkahAhliWaris';
import { LangkahKondisi } from './LangkahKondisi';

const JUDUL_LANGKAH = ['', 'Siapa yang meninggal?', 'Berapa harta peninggalannya?', 'Ada kewajiban yang harus dibayar dulu?',
  'Siapa aja yang ditinggalin?', 'Ada kondisi khusus?'];

export function Wizard({ keadaan, kirim }: { keadaan: KeadaanAplikasi; kirim: (aksi: Aksi) => void }) {
  if (!keadaan.kasus) {
        return (
          <main className="halaman tumpuk">
            <h1 className="judul-langkah">Almarhum laki-laki atau perempuan?</h1>
            <div className="chip-deret">
              <Pilihan saatKlik={() => kirim({ jenis: 'PILIH_PEWARIS', jenisKelamin: 'L' })}>Laki-laki</Pilihan>
              <Pilihan saatKlik={() => kirim({ jenis: 'PILIH_PEWARIS', jenisKelamin: 'P' })}>Perempuan</Pilihan>
            </div>
          </main>
        );
      }
  const kasus = keadaan.kasus!;
  const ubah = (fungsiUbah: (kasus: Kasus) => Kasus) => kirim({ jenis: 'UBAH_KASUS', ubah: fungsiUbah });
  const adalahTerakhir = keadaan.langkah === TOTAL_LANGKAH;
  return (
    <main className="halaman tumpuk">
      <Stiker>Langkah {keadaan.langkah}/{TOTAL_LANGKAH}</Stiker>
      <h1 className="judul-langkah">{JUDUL_LANGKAH[keadaan.langkah]}</h1>
      {keadaan.langkah === 1 && <LangkahPewaris kasus={kasus} ubah={ubah} />}
      {keadaan.langkah === 2 && <LangkahHarta kasus={kasus} ubah={ubah} />}
      {keadaan.langkah === 3 && <LangkahKewajiban kasus={kasus} ubah={ubah} />}
      {keadaan.langkah === 4 && <LangkahAhliWaris graf={kasus.graf} idMayit={kasus.graf.idPewaris} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />}
      {keadaan.langkah === 5 && <LangkahKondisi kasus={kasus} ubah={ubah} />}
      <div className="baris-tombol">
        <Tombol varian="secondary" onClick={() => (keadaan.langkah === 1 ? kirim({ jenis: 'KE_LAYAR', layar: 'beranda' }) : kirim({ jenis: 'KE_LANGKAH', langkah: keadaan.langkah - 1 }))}>
          Kembali
        </Tombol>
        <Tombol onClick={() => (adalahTerakhir ? kirim({ jenis: 'KE_LAYAR', layar: 'hasil' }) : kirim({ jenis: 'KE_LANGKAH', langkah: keadaan.langkah + 1 }))}>
          {adalahTerakhir ? 'Gas hitung' : 'Gas, langkah berikutnya'}
        </Tombol>
      </div>
    </main>
  );
}

interface PropsLangkah { kasus: Kasus; ubah: (fungsiUbah: (kasus: Kasus) => Kasus) => void }

function LangkahPewaris({ kasus, ubah }: PropsLangkah) {
  const pewaris = kasus.graf.orang[kasus.graf.idPewaris]!;
  const bolehUbah = bolehUbahJenisKelamin(kasus.graf, pewaris.id);
  const ubahPewaris = (perubahan: Partial<typeof pewaris>) =>
    ubah(k => ({ ...k, graf: { ...k.graf, orang: { ...k.graf.orang, [pewaris.id]: { ...pewaris, ...perubahan } } } }));
  return (
    <div className="tumpuk">
      <label className="isian">Namanya (boleh dikosongin)
        <input value={pewaris.nama ?? ''} onChange={event => ubah(k => {
          const { nama: _lama, ...tanpaNama } = k.graf.orang[pewaris.id]!;
          const baru = event.target.value ? { ...tanpaNama, nama: event.target.value } : tanpaNama;
          return { ...k, graf: { ...k.graf, orang: { ...k.graf.orang, [pewaris.id]: baru } } };
        })} />
      </label>
      <p className="keterangan">Jenis kelaminnya? Ini nentuin siapa pasangannya: suami atau istri.</p>
      <div className="chip-deret">
        <Pilihan terpilih={pewaris.jenisKelamin === 'L'} saatKlik={() => bolehUbah && ubahPewaris({ jenisKelamin: 'L' })}>Laki-laki</Pilihan>
        <Pilihan terpilih={pewaris.jenisKelamin === 'P'} saatKlik={() => bolehUbah && ubahPewaris({ jenisKelamin: 'P' })}>Perempuan</Pilihan>
      </div>
      {!bolehUbah && <p className="keterangan">Udah ada pasangan atau anak yang diisi. Kurangi dulu di langkah 4 kalau mau ganti.</p>}
    </div>
  );
}

function LangkahHarta({ kasus, ubah }: PropsLangkah) {
  return (
    <div className="tumpuk">
      <IsianUang label="Total harta peninggalan (Rp)" nilai={kasus.tirkah.kotor} saatUbah={kotor => ubah(k => ({ ...k, tirkah: { ...k.tirkah, kotor } }))} />
      <p className="keterangan">Hasil tiap orang dibulatkan ke bawah ke kelipatan ini. Sisanya ditulis terpisah, nggak dibagi diam-diam.</p>
      <div className="chip-deret">
        {SATUAN_PEMBULATAN.map(satuan => (
          <Pilihan key={String(satuan)} terpilih={kasus.satuanPembulatan === satuan} saatKlik={() => ubah(k => ({ ...k, satuanPembulatan: satuan }))}>
            {formatRupiah(satuan)}
          </Pilihan>
        ))}
      </div>
    </div>
  );
}

function LangkahKewajiban({ kasus, ubah }: PropsLangkah) {
  const ubahTirkah = (kunci: 'tajhiz' | 'hutang' | 'wasiat') => (nilai: bigint) => ubah(k => ({ ...k, tirkah: { ...k.tirkah, [kunci]: nilai } }));
  return (
    <div className="tumpuk">
      <p className="keterangan">Urutannya: urus jenazah, bayar hutang, baru wasiat. Nggak ada? Biarin 0.</p>
      <IsianUang label="Biaya pengurusan jenazah (tajhiz)" nilai={kasus.tirkah.tajhiz} saatUbah={ubahTirkah('tajhiz')} />
      <IsianUang label="Hutang" nilai={kasus.tirkah.hutang} saatUbah={ubahTirkah('hutang')} />
      <IsianUang label="Wasiat" nilai={kasus.tirkah.wasiat} saatUbah={ubahTirkah('wasiat')} />
    </div>
  );
}

/** Isian uang: teks bebas saat diketik, disimpan sebagai bigint hanya bila valid. */
function IsianUang({ label, nilai, saatUbah }: { label: string; nilai: bigint; saatUbah: (nilai: bigint) => void }) {
  const [teks, setTeks] = useState(nilai === 0n ? '' : new Intl.NumberFormat('id-ID').format(nilai));
  const hasil = bacaInputUang(teks);
  return (
    <label className="isian">{label}
      <input inputMode="numeric" value={teks} placeholder="0" onChange={event => {
        setTeks(event.target.value);
        const baru = bacaInputUang(event.target.value);
        if (baru !== null) saatUbah(baru);
      }} />
      {hasil === null && <span className="isian-salah">Isi angka aja ya, boleh pakai titik ribuan.</span>}
    </label>
  );
}
