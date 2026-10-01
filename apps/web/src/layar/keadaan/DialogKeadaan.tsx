// Dialog keadaan satu orang (spec 1.1): satu pertanyaan per layar, jawaban baru diterapkan di layar terakhir.
// Menerima Kasus + orang; menyerahkan Kasus baru lewat saatSelesai. Keadaan yang belum didukung engine ditolak di sini.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { IdOrang, InputTirkah, KeadaanGharqa, KunciAhliWaris } from '@waris/engine';
import { KONFIGURASI_BAWAAN, turunkanPeran } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { alasanTidakDidukung, babakAsal, namaSingkat, terapkanKeadaan, type JawabanKeadaan } from '../../keadaanOrang';
import { jawabSisip, mulaiSisip, pembanding, posisiAkhir, type Sisipan } from '../../urutan';
import { Tombol } from '../../ui/komponen';
import { IsianUang } from '../wizard/IsianUang';
import { t } from '../../terjemah';

// [R13-9] khuntsa hanya di jihah bunuwwah, ukhuwwah, 'umumah (13c.1): bukan orang tua atau pasangan.
export const KHUNTSA_MUNGKIN: KunciAhliWaris[] = ['ANAK_LK', 'ANAK_PR', 'CUCU_LK', 'CUCU_PR', 'SAUDARA_KANDUNG', 'SAUDARI_KANDUNG',
  'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU', 'KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK',
  'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'];
const TANPA_HARTA: InputTirkah = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

type Layar =
  | { jenis: 'keadaan'; lain: boolean }
  | { jenis: 'waktu' }
  | { jenis: 'dibagi' }
  | { jenis: 'urutan'; sisipan: Sisipan }
  | { jenis: 'putusan' }
  | { jenis: 'serentak' }
  | { jenis: 'pernahTahu' }
  | { jenis: 'harta'; keadaan: KeadaanGharqa }
  | { jenis: 'baligh' }
  | { jenis: 'ditolak' };

export function DialogKeadaan({ kasus, idOrang, saatSelesai, saatBatal }: {
  kasus: Kasus; idOrang: IdOrang; saatSelesai: (kasusBaru: Kasus) => void; saatBatal: () => void;
}) {
  const id = useId();
  const nama = namaSingkat(kasus, idOrang);
  const idMayit = babakAsal(kasus, idOrang) ?? kasus.graf.idPewaris;
  const mayit = namaSingkat(kasus, idMayit);
  const pewaris = namaSingkat(kasus, kasus.graf.idPewaris);
  const [layar, setLayar] = useState<Layar>({ jenis: 'keadaan', lain: false });
  const [pilihan, setPilihan] = useState<string | null>(null);
  const [hartaSendiri, setHartaSendiri] = useState(0n);
  const [riwayat, setRiwayat] = useState<Layar[]>([]);
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => { wadah.current?.querySelector<HTMLElement>('[role=radio]')?.focus(); }, [layar]);

  const ke = (berikut: Layar) => { setRiwayat([...riwayat, layar]); setLayar(berikut); setPilihan(null); };
  const selesai = (jawaban: JawabanKeadaan) => {
    if (alasanTidakDidukung(kasus, idOrang, jawaban)) return ke({ jenis: 'ditolak' });
    saatSelesai(terapkanKeadaan(kasus, idOrang, jawaban));
  };
  const kunciOrang = turunkanPeran({ ...kasus.graf, idPewaris: idMayit }, KONFIGURASI_BAWAAN).daftarPeran[idOrang]?.kunci;
  const bolehKhuntsa = !!kunciOrang && KHUNTSA_MUNGKIN.includes(kunciOrang as KunciAhliWaris);

  const lanjut = () => {
    switch (layar.jenis) {
      case 'keadaan':
        if (pilihan === 'hidup') return selesai({ jenis: 'hidup' });
        if (pilihan === 'wafat') return ke({ jenis: 'waktu' });
        if (pilihan === 'hilang') return ke({ jenis: 'putusan' });
        if (pilihan === 'khuntsa') return ke({ jenis: 'baligh' });
        return;
      case 'waktu':
        if (pilihan === 'sebelum') return selesai({ jenis: 'wafatSebelum' });
        if (pilihan === 'sesudah') return ke({ jenis: 'dibagi' });
        if (pilihan === 'bersamaan') {
          return alasanTidakDidukung(kasus, idOrang, { jenis: 'bersamaan', keadaan: 'serentak', tirkah: TANPA_HARTA })
            ? ke({ jenis: 'ditolak' }) : ke({ jenis: 'serentak' });
        }
        return;
      case 'dibagi': {
        if (pilihan === 'sudah') return selesai({ jenis: 'wafatSesudah', hartaSudahDibagi: true });
        if (alasanTidakDidukung(kasus, idOrang, { jenis: 'wafatSesudah', hartaSudahDibagi: false })) return ke({ jenis: 'ditolak' });
        const tanpaDiri = { ...kasus, urutanWafat: kasus.urutanWafat.filter(lain => lain !== idOrang) };
        const sisipan = mulaiSisip(tanpaDiri, idMayit);
        return pembanding(sisipan) ? ke({ jenis: 'urutan', sisipan }) : selesai({ jenis: 'wafatSesudah', hartaSudahDibagi: false, posisi: posisiAkhir(sisipan) });
      }
      case 'urutan': {
        if (pilihan === 'bersamaan') return ke({ jenis: 'ditolak' });   // bersamaan antar-almarhum lanjutan: E1
        if (pilihan === 'tidakTahu') {
          // Tidak tahu bukan alasan menolak: urutan sementara disusun, dicatat sebagai belum pasti, dan Hasil menghitung kedua urutan berdampingan.
          const berikut = jawabSisip(layar.sisipan, false);
          return selesai({ jenis: 'wafatSesudah', hartaSudahDibagi: false, posisi: posisiAkhir(berikut), takTahuUrutanDengan: pembanding(layar.sisipan)! });
        }
        const berikut = jawabSisip(layar.sisipan, pilihan === 'diri');
        return pembanding(berikut) ? ke({ jenis: 'urutan', sisipan: berikut })
          : selesai({ jenis: 'wafatSesudah', hartaSudahDibagi: false, posisi: posisiAkhir(berikut) });
      }
      case 'putusan':
        if (pilihan === 'belum') return selesai({ jenis: 'hilang' });   // [R13-6]
        if (pilihan === 'sudah') return ke({ jenis: 'waktu' });           // [R13-18] butir 3: seperti wafat
        if (pilihan === 'takTahuKapan') return ke({ jenis: 'serentak' }); // [R13-18] butir 5: gharqa
        return;
      case 'serentak':
        if (pilihan === 'ya') return ke({ jenis: 'harta', keadaan: 'serentak' });
        if (pilihan === 'tidak') return ke({ jenis: 'pernahTahu' });
        return;
      case 'pernahTahu':
        // [K13d-1] keadaan 4 dan 5 sama di semua madzhab → satu pilihan 'tidakDiketahui'.
        if (pilihan === 'lupa') return ke({ jenis: 'harta', keadaan: 'terlupakan' });
        if (pilihan === 'tidakPernah') return ke({ jenis: 'harta', keadaan: 'tidakDiketahui' });
        if (pilihan === 'tahu') return ke({ jenis: 'waktu' });
        return;
      case 'harta':
        return selesai({ jenis: 'bersamaan', keadaan: layar.keadaan, tirkah: { ...TANPA_HARTA, kotor: hartaSendiri } });
      case 'baligh':
        if (pilihan === 'belum') return selesai({ jenis: 'khuntsa', keadaan: 'diharapkanJelas' });
        if (pilihan === 'sudah') return selesai({ jenis: 'khuntsa', keadaan: 'tidakDiharapkanJelas' });
        return;
      case 'ditolak': return saatBatal();
    }
  };
  const kembali = () => { const lalu = riwayat.at(-1); if (!lalu) return saatBatal(); setRiwayat(riwayat.slice(0, -1)); setLayar(lalu); setPilihan(null); };

  const opsi = (daftar: Array<[string, string, string?]>) => (
    <div className="pilihan-dialog" role="radiogroup" aria-labelledby={`${id}-tanya`}>
      {daftar.map(([nilai, label, keterangan]) => (
        <button key={nilai} type="button" role="radio" aria-checked={pilihan === nilai} className="opsi-dialog" onClick={() => setPilihan(nilai)}>
          <span>{label}</span>{keterangan && <small>{keterangan}</small>}
        </button>
      ))}
    </div>
  );

  let isi: { tanya: string; keterangan?: string; badan: ReactNode };
  switch (layar.jenis) {
    case 'keadaan':
      isi = { tanya: t('hitung.keadaan.tanya', { nama }), badan: <>
        {opsi([
          ['hidup', t('hitung.keadaan.masih_hidup')], ['wafat', t('hitung.keadaan.sudah_wafat')], ['hilang', t('hitung.keadaan.hilang')],
          ...(layar.lain && bolehKhuntsa ? [['khuntsa', t('hitung.keadaan.kelamin_belum_jelas'), t('hitung.keadaan.kelamin_belum_jelas_ket')] as [string, string, string]] : []),
        ])}
        {!layar.lain && <button type="button" className="tautan" onClick={() => setLayar({ jenis: 'keadaan', lain: true })}>{t('hitung.keadaan.keadaan_lain')}</button>}
      </> };
      break;
    case 'waktu':
      isi = { tanya: t('hitung.keadaan.sebelum_atau_sesudah', { nama, mayit }), keterangan: t('hitung.keadaan.kenapa_waktu', { mayit }), badan:
        opsi([['sebelum', t('hitung.keadaan.sebelum', { mayit })], ['sesudah', t('hitung.keadaan.sesudah', { mayit })], ['bersamaan', t('hitung.keadaan.bersamaan_atau_tidak_tahu')]]) };
      break;
    case 'dibagi':
      isi = { tanya: t('hitung.keadaan.harta_sudah_dibagi', { nama, pewaris }), keterangan: t('hitung.keadaan.arti_dibagi'), badan:
        opsi([['belum', t('hitung.keadaan.belum_dibagi')], ['sudah', t('hitung.keadaan.sudah_dibagi')]]) };
      break;
    case 'urutan': {
      const lain = namaSingkat(kasus, pembanding(layar.sisipan)!);
      isi = { tanya: t('hitung.keadaan.siapa_lebih_dulu'), badan: opsi([['diri', nama], ['lain', lain], ['tidakTahu', t('hitung.keadaan.tidak_tahu_urutan')], ['bersamaan', t('hitung.keadaan.bersamaan_saja')]]) };
      break;
    }
    case 'putusan':
      isi = { tanya: t('hitung.hilang.ada_putusan', { nama }), badan: opsi([
        ['belum', t('hitung.hilang.belum_ada')], ['sudah', t('hitung.hilang.sudah_ada')], ['takTahuKapan', t('hitung.hilang.pasti_wafat_tak_tahu_kapan')]]) };
      break;
    case 'serentak':
      isi = { tanya: t('hitung.bersamaan.pasti_bersamaan', { nama, mayit }), keterangan: t('hitung.bersamaan.contoh'), badan:
        opsi([['ya', t('hitung.bersamaan.ya_pasti')], ['tidak', t('hitung.bersamaan.tidak_pasti')]]) };
      break;
    case 'pernahTahu':
      isi = { tanya: t('hitung.bersamaan.pernah_tahu'), badan: opsi([
        ['lupa', t('hitung.bersamaan.pernah_tahu_lupa')], ['tidakPernah', t('hitung.bersamaan.tidak_pernah_tahu')], ['tahu', t('hitung.bersamaan.sekarang_tahu')]]) };
      break;
    case 'harta':
      isi = { tanya: t('hitung.bersamaan.harta_sendiri', { nama }), keterangan: t('hitung.bersamaan.harta_sendiri_ket'), badan:
        <IsianUang id={`${id}-harta`} label={t('hitung.bersamaan.harta_label', { nama })} nilai={hartaSendiri} saatUbah={setHartaSendiri} /> };
      break;
    case 'baligh':
      isi = { tanya: t('hitung.keadaan.sudah_baligh', { nama }), keterangan: t('hitung.keadaan.baligh_ket'), badan:
        opsi([['belum', t('hitung.keadaan.belum_baligh'), t('hitung.keadaan.belum_baligh_ket')], ['sudah', t('hitung.keadaan.sudah_baligh_tetap'), t('hitung.keadaan.sudah_baligh_tetap_ket')]]) };
      break;
    case 'ditolak':
      isi = { tanya: t('hitung.keadaan.belum_didukung'), badan: <p>{t('hitung.keadaan.belum_didukung_ket')}</p> };
      break;
  }
  const bisaLanjut = layar.jenis === 'harta' || layar.jenis === 'ditolak' || pilihan !== null;
  return (
    <div className="konfirmasi" role="dialog" aria-modal="true" aria-labelledby={`${id}-tanya`} ref={wadah}
      onKeyDown={event => { if (event.key === 'Escape') saatBatal(); }}>
      <div className="konfirmasi-isi dialog-langkah">
        <p className="label-langkah">{nama}</p>
        <h2 id={`${id}-tanya`}>{isi.tanya}</h2>
        {isi.keterangan && <p className="keterangan">{isi.keterangan}</p>}
        {isi.badan}
        <div className="aksi-konfirmasi">
          <button type="button" className="tautan" onClick={kembali}>{riwayat.length ? t('umum.kembali_2') : t('umum.batal')}</button>
          <Tombol disabled={!bisaLanjut} onClick={lanjut}>{layar.jenis === 'ditolak' ? t('umum.tutup') : t('umum.lanjut')}</Tombol>
        </div>
      </div>
    </div>
  );
}
