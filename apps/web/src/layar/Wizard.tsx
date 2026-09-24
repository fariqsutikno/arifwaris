// Wizard 5 langkah, satu pertanyaan per layar. Menerima keadaan + kirim(aksi);
// menyerahkan Kasus yang sudah lengkap ke layar hasil lewat KE_LAYAR 'hasil'.

import { useState } from 'react';
import { SATUAN_PEMBULATAN, type Kasus } from '../kasus';
import { TOTAL_LANGKAH, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { bacaInputUang, formatRupiah } from '../format';
import { Pilihan } from '../ui/komponen';
import { LangkahAhliWaris } from './LangkahAhliWaris';
import { LangkahKondisi } from './LangkahKondisi';
import { BarBawah } from './wizard/BarBawah';
import { KerangkaLangkah } from './wizard/KerangkaLangkah';
import { LangkahPewaris } from './wizard/LangkahPewaris';
import { Stepper } from './wizard/Stepper';
import { alasanBelumLengkap, langkahTerjauh, LANGKAH_HASIL } from './wizard/validasi';


export function Wizard({ keadaan, kirim }: { keadaan: KeadaanAplikasi; kirim: (aksi: Aksi) => void }) {
  const { kasus, langkah } = keadaan;
  const ubah = (fungsiUbah: (kasus: Kasus) => Kasus) => kirim({ jenis: 'UBAH_KASUS', ubah: fungsiUbah });
  const alasan = alasanBelumLengkap(kasus, langkah);
  return (
    <main className="halaman halaman-wizard">
      <Stepper langkahAktif={langkah} terjauh={langkahTerjauh(kasus)}
        saatPilih={tujuan => kirim(tujuan === LANGKAH_HASIL ? { jenis: 'KE_LAYAR', layar: 'hasil' } : { jenis: 'KE_LANGKAH', langkah: tujuan })} />
      <KerangkaLangkah langkah={langkah}>
        {langkah === 1 && <LangkahPewaris kasus={kasus} saatPilih={jenisKelamin => kirim({ jenis: 'PILIH_PEWARIS', jenisKelamin })}
          saatUbahNama={nama => ubah(k => ubahNamaPewaris(k, nama))} />}
        {kasus && langkah === 2 && <LangkahHarta kasus={kasus} ubah={ubah} />}
        {kasus && langkah === 3 && <LangkahKewajiban kasus={kasus} ubah={ubah} />}
        {kasus && langkah === 4 && <LangkahAhliWaris graf={kasus.graf} idMayit={kasus.graf.idPewaris} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />}
        {kasus && langkah === 5 && <LangkahKondisi kasus={kasus} ubah={ubah} />}
      </KerangkaLangkah>
      <BarBawah langkah={langkah} alasan={alasan}
        saatKembali={() => kirim(langkah === 1 ? { jenis: 'KE_LAYAR', layar: 'beranda' } : { jenis: 'KE_LANGKAH', langkah: langkah - 1 })}
        saatLanjut={() => kirim(langkah === TOTAL_LANGKAH ? { jenis: 'KE_LAYAR', layar: 'hasil' } : { jenis: 'KE_LANGKAH', langkah: langkah + 1 })} />
    </main>
  );
}

function ubahNamaPewaris(kasus: Kasus, nama: string): Kasus {
  const { nama: _lama, ...tanpaNama } = kasus.graf.orang[kasus.graf.idPewaris]!;
  const pewaris = nama ? { ...tanpaNama, nama } : tanpaNama;
  return { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [kasus.graf.idPewaris]: pewaris } } };
}

interface PropsLangkah { kasus: Kasus; ubah: (fungsiUbah: (kasus: Kasus) => Kasus) => void }

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
