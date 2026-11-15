// Periksa cerita (spec 1.5): CeritaKasus = ringkasan kalimat per babak dengan tautan "ubah" ke babaknya, dipakai di langkah
// Periksa wizard. PilihanMenunggu = layar pilihan menunggu kelahiran (spec 1.6, [R13-17]), tampil sesudah Periksa bila ada janin.

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import { labelOrangChecklist } from '../checklist';
import { formatRupiah } from '../format';
import type { Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { daftarAlmarhum, kerabatDari, namaSingkat } from '../keadaanOrang';
import { Tombol } from '../ui/komponen';
import { t } from '../terjemah';

export function kalimatBabak(kasus: Kasus, idMayit: IdOrang): string {
  const almarhum = daftarAlmarhum(kasus);
  const indeks = almarhum.indexOf(idMayit);
  const sebelumnya = new Set(almarhum.slice(0, indeks));
  const ditinggalkan = kerabatDari(kasus, idMayit)
    .filter(id => !sebelumnya.has(id) && kasus.graf.orang[id]!.statusHidup !== 'wafat')
    .map(id => {
      const { nama, ...tanpaNama } = kasus.graf.orang[id]!;
      const grafTanpaNama = { ...kasus.graf, orang: { ...kasus.graf.orang, [id]: tanpaNama } };
      const sebutan = labelOrangChecklist(grafTanpaNama, idMayit, id).toLowerCase();
      return nama ? `${sebutan} (${nama})` : sebutan;
    });
  const nama = namaSingkat(kasus, idMayit);
  return indeks === 0
    ? t('hitung.cerita.babak_pertama', { nama, daftar: gabungDaftar(ditinggalkan) })
    : t('hitung.cerita.babak_lanjut', { nama, daftar: gabungDaftar(ditinggalkan) });
}

const gabungDaftar = (daftar: string[]): string =>
  daftar.length <= 1 ? daftar.join('') : `${daftar.slice(0, -1).join(', ')} ${t('hitung.cerita.dan')} ${daftar.at(-1)}`;

export function PilihanMenunggu({ kirim }: { kirim: (aksi: Aksi) => void }) {
  const [pilihan, setPilihan] = useState<'tunggu' | 'hitungSekarang' | null>(null);
  const lanjut = () => {
    if (!pilihan) return;
    kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, pilihanJanin: pilihan }) });
    kirim({ jenis: 'KE_LAYAR', layar: 'hasil' });
  };
  return (
    <main className="halaman tumpuk hasil-khusus">
      <h1 className="judul-langkah" id="tanya-menunggu">{t('hitung.cerita.menunggu_tanya')}</h1>
      <p className="keterangan">{t('hitung.cerita.menunggu_ket')}</p>
      <div className="pilihan-dialog" role="radiogroup" aria-labelledby="tanya-menunggu">
        <button type="button" role="radio" aria-checked={pilihan === 'tunggu'} className="opsi-dialog" onClick={() => setPilihan('tunggu')}>
          <span>{t('hitung.cerita.tunggu')}</span><small>{t('hitung.cerita.tunggu_ket')}</small>
        </button>
        <button type="button" role="radio" aria-checked={pilihan === 'hitungSekarang'} className="opsi-dialog" onClick={() => setPilihan('hitungSekarang')}>
          <span>{t('hitung.cerita.hitung_sekarang')}</span><small>{t('hitung.cerita.hitung_sekarang_ket')}</small>
        </button>
      </div>
      <div className="chip-deret">
        <button type="button" className="tautan" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 4 })}>{t('umum.kembali_2')}</button>
        <Tombol disabled={!pilihan} onClick={lanjut}>{t('umum.lanjut')}</Tombol>
      </div>
    </main>
  );
}

export function CeritaKasus({ kasus, kirim }: { kasus: Kasus; kirim: (aksi: Aksi) => void }) {
  const almarhum = daftarAlmarhum(kasus);
  const nama = (id: IdOrang) => namaSingkat(kasus, id);
  const ubahKeluarga = () => kirim({ jenis: 'KE_LANGKAH', langkah: 3 });
  return (
    <div className="kartu tumpuk">
      {almarhum.map((id, indeks) => (
        <section key={id} className="tumpuk-rapat">
          <h2 className="judul-bagian-kecil">{t('hitung.cerita.label_babak', { nomor: indeks + 1, nama: nama(id) })}</h2>
          <p>{kalimatBabak(kasus, id)} <button type="button" className="tautan" onClick={ubahKeluarga}>{t('hitung.cerita.ubah')}</button></p>
        </section>
      ))}
      <BarisKhususCerita kasus={kasus} />
    </div>
  );
}

/** Baris keadaan khusus dan harta yang dibagi; dipakai CeritaKasus (nyata) dan RingkasanLatihan. */
export function BarisKhususCerita({ kasus }: { kasus: Kasus }) {
  const orang = Object.values(kasus.graf.orang);
  const nama = (id: IdOrang) => namaSingkat(kasus, id);
  const pewaris = nama(kasus.graf.idPewaris);
  const lanjutan = daftarAlmarhum(kasus).slice(1).map(nama);
  return (
    <>
      {kasus.wafatSesudahDibagi?.map(id => <p key={id}>{t('hitung.cerita.sesudah_dibagi', { nama: nama(id) })}</p>)}
      {kasus.gharqa && <p>{t('hitung.cerita.bersamaan', { daftar: kasus.gharqa.anggota.map(nama).join(', ') })}</p>}
      {orang.filter(o => o.statusHidup === 'mafqud').map(o => <p key={o.id}>{t('hitung.cerita.hilang', { nama: nama(o.id) })}</p>)}
      {orang.filter(o => o.statusHidup === 'dalamKandungan').map(o => <p key={o.id}>{o.idIbu ? t('hitung.janin.baris', { ibu: nama(o.idIbu) }) : t('hitung.penutup.status_dalam_kandungan')}</p>)}
      <p>{t('hitung.cerita.harta_dibagi', { pewaris, jumlah: formatRupiah(kasus.tirkah.kotor) })}
        {lanjutan.length > 0 && ` ${t('hitung.cerita.harta_sendiri_tidak', { daftar: lanjutan.join(', ') })}`}</p>
    </>
  );
}
