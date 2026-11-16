// Form "Tambah peristiwa" (spec kanvas 7.4): kelahiran, pernikahan, atau perceraian yang terjadi di antara dua kematian.
// Menyimpan Peristiwa ke Kasus lewat ubah(); penurunan ke engine dikerjakan reducer (turunkanDariWaktu). Menurut urutan baku
// tidak mungkin menikah atau bercerai sesudah salah satu pasangan wafat, jadi pilihan waktunya menyaring keduanya.

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus, Peristiwa } from '../../kasus';
import { daftarAlmarhum, namaSingkat } from '../../keadaanOrang';
import { t } from '../../terjemah';
import { Tombol } from '../../ui/komponen';

interface Props { kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void; saatTutup: () => void }
type Jenis = Peristiwa['jenis'];

export function FormPeristiwa({ kasus, ubah, saatTutup }: Props) {
  const orang = Object.values(kasus.graf.orang).filter(satu => !satu.penghubung && satu.id !== kasus.graf.idPewaris).map(satu => satu.id);
  const [jenis, setJenis] = useState<Jenis>('lahir');
  const [siapa, setSiapa] = useState<IdOrang>(orang[0]!);
  const [pasangan, setPasangan] = useState<IdOrang | undefined>();
  const adaPasangan = jenis !== 'lahir';
  const calonPasangan = orang.filter(id => id !== siapa);
  const idPasangan = adaPasangan ? (pasangan && calonPasangan.includes(pasangan) ? pasangan : calonPasangan[0]) : undefined;
  const calonWaktu = daftarAlmarhum(kasus).filter(id => !adaPasangan || (id !== siapa && id !== idPasangan));
  const [kapan, setKapan] = useState<IdOrang>(calonWaktu[0]!);
  const sesudahWafat = calonWaktu.includes(kapan) ? kapan : calonWaktu[0]!;
  const nama = (id: IdOrang) => namaSingkat(kasus, id);
  const simpan = () => {
    const baru: Peristiwa = jenis === 'lahir' ? { jenis, idOrang: siapa, sesudahWafat }
      : { jenis, idOrang: siapa, idPasangan: idPasangan!, sesudahWafat };
    ubah(k => ({ ...k, peristiwa: [...(k.peristiwa ?? []), baru] }));
    saatTutup();
  };
  const pilihan = (label: string, nilai: string, ubahNilai: (v: string) => void, daftar: Array<[string, string]>) => (
    <label className="isian"><span>{label}</span>
      <select value={nilai} onChange={event => ubahNilai(event.target.value)}>{daftar.map(([id, teks]) => <option key={id} value={id}>{teks}</option>)}</select>
    </label>
  );
  return (
    <div className="form-peristiwa">
      <b>{t('hitung.periksa.peristiwa_judul')}</b>
      {pilihan(t('hitung.periksa.peristiwa_apa'), jenis, v => setJenis(v as Jenis), [
        ['lahir', t('hitung.periksa.peristiwa_lahir')], ['nikah', t('hitung.periksa.peristiwa_nikah')], ['cerai', t('hitung.periksa.peristiwa_cerai')]])}
      {pilihan(t('hitung.periksa.peristiwa_siapa'), siapa, setSiapa, orang.map(id => [id, nama(id)]))}
      {adaPasangan && pilihan(t('hitung.periksa.pasangan_siapa'), idPasangan ?? '', setPasangan, calonPasangan.map(id => [id, nama(id)]))}
      {pilihan(t('hitung.periksa.peristiwa_kapan'), sesudahWafat, setKapan, calonWaktu.map(id => [id, t('hitung.periksa.peristiwa_sesudah', { nama: nama(id) })]))}
      <p className="kecil redup">{t('hitung.periksa.peristiwa_keterangan')}</p>
      <div className="deret">
        <Tombol onClick={simpan}>{t('hitung.periksa.simpan_peristiwa')}</Tombol>
        <button type="button" className="tautan" onClick={saatTutup}>{t('hitung.periksa.batal')}</button>
      </div>
    </div>
  );
}
