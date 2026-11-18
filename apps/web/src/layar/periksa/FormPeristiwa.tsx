// Dialog "Ada kejadian lain?" (spec kanvas 7.4): kelahiran, pernikahan, atau perceraian yang terjadi di antara dua kematian.
// Satu pertanyaan per langkah (apa, siapa, [dengan siapa], kapan), pilihan berupa daftar radio. Menyimpan Peristiwa ke Kasus
// lewat ubah(); penurunan ke engine dikerjakan reducer (turunkanDariWaktu). Menurut urutan baku tidak mungkin menikah atau
// bercerai sesudah salah satu pasangan wafat, jadi pilihan waktunya menyaring keduanya.

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus, Peristiwa } from '../../kasus';
import { daftarAlmarhum, namaJelas } from '../../keadaanOrang';
import { nomorKembar } from '../../latihan';
import { t } from '../../terjemah';
import { Tombol } from '../../ui/komponen';

interface Props { kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void; saatTutup: () => void }
type Jenis = Peristiwa['jenis'];
type Langkah = 'jenis' | 'siapa' | 'pasangan' | 'kapan';

export function FormPeristiwa({ kasus, ubah, saatTutup }: Props) {
  const orang = Object.values(kasus.graf.orang).filter(satu => !satu.penghubung && satu.id !== kasus.graf.idPewaris).map(satu => satu.id);
  const [posisi, setPosisi] = useState(0);
  const [jenis, setJenis] = useState<Jenis>();
  const [siapa, setSiapa] = useState<IdOrang>();
  const [pasangan, setPasangan] = useState<IdOrang>();
  const [kapan, setKapan] = useState<IdOrang>();
  const [belumDipilih, setBelumDipilih] = useState(false);

  const adaPasangan = !!jenis && jenis !== 'lahir';
  const urutan: Langkah[] = ['jenis', 'siapa', ...(adaPasangan ? ['pasangan' as const] : []), 'kapan'];
  const langkah = urutan[posisi]!;
  // Orang tanpa nama dibedakan dengan babak asalnya; yang tetap kembar diberi nomor (satu sumber: nomorKembar).
  const semuaId = Object.keys(kasus.graf.orang);
  const labelUnik = nomorKembar(semuaId.map(id => namaJelas(kasus, id)));
  const nama = (id: IdOrang) => labelUnik[semuaId.indexOf(id)]!;
  const calonPasangan = orang.filter(id => id !== siapa);
  const calonWaktu = daftarAlmarhum(kasus).filter(id => !adaPasangan || (id !== siapa && id !== pasangan));
  const idPasangan = pasangan && calonPasangan.includes(pasangan) ? pasangan : undefined;
  const sesudahWafat = kapan && calonWaktu.includes(kapan) ? kapan : undefined;

  const maju = () => { setBelumDipilih(false); setPosisi(posisi + 1); };
  const pilihLalu = (aturNilai: () => void) => { aturNilai(); maju(); };
  const mundur = () => { setBelumDipilih(false); setPosisi(posisi - 1); };
  const simpan = () => {
    if (!jenis || !siapa || !sesudahWafat || (adaPasangan && !idPasangan)) { setBelumDipilih(true); return; }
    const baru: Peristiwa = jenis === 'lahir' ? { jenis, idOrang: siapa, sesudahWafat } : { jenis, idOrang: siapa, idPasangan: idPasangan!, sesudahWafat };
    ubah(k => ({ ...k, peristiwa: [...(k.peristiwa ?? []), baru] }));
    saatTutup();
  };

  const daftar = (tanya: string, terpilih: string | undefined, pilihan: Array<[string, string]>, saatPilih: (id: string) => void) => (
    <>
      <h3 id="tanya-kejadian" className="tanya-kejadian">{tanya}</h3>
      <div className="daftar-pintu" role="radiogroup" aria-labelledby="tanya-kejadian">
        {pilihan.map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={terpilih === id} className="pilihan-pintu" onClick={() => saatPilih(id)}>
            <i aria-hidden="true" /><span>{label}</span>
          </button>
        ))}
      </div>
    </>
  );
  const orangSebagai = (id: IdOrang): [string, string] => [id, nama(id)];
  const waktuSebagai = (id: IdOrang): [string, string] =>
    [id, id === kasus.graf.idPewaris ? t('hitung.periksa.peristiwa_sesudah_pewaris', { nama: nama(id) }) : t('hitung.periksa.peristiwa_sesudah', { nama: nama(id) })];

  return (
    <section className="form-peristiwa" role="group" aria-label={t('hitung.periksa.peristiwa_judul')}>
      <div className="titik-langkah" role="img" aria-label={t('hitung.periksa.kejadian_langkah', { n: posisi + 1, total: urutan.length })}>
        {urutan.map((nama, indeks) => <span key={nama} className={indeks <= posisi ? 'on' : ''} />)}
      </div>
      {langkah === 'jenis' && daftar(t('hitung.periksa.peristiwa_apa'), jenis, [
        ['lahir', t('hitung.periksa.peristiwa_lahir')], ['nikah', t('hitung.periksa.peristiwa_nikah')], ['cerai', t('hitung.periksa.peristiwa_cerai')]],
        id => pilihLalu(() => setJenis(id as Jenis)))}
      {langkah === 'siapa' && daftar(t('hitung.periksa.peristiwa_siapa'), siapa, orang.map(orangSebagai), id => pilihLalu(() => setSiapa(id)))}
      {langkah === 'pasangan' && daftar(t('hitung.periksa.pasangan_siapa'), idPasangan, calonPasangan.map(orangSebagai), id => pilihLalu(() => setPasangan(id)))}
      {langkah === 'kapan' && <>
        {daftar(t('hitung.periksa.peristiwa_kapan'), sesudahWafat, calonWaktu.map(waktuSebagai), id => { setBelumDipilih(false); setKapan(id); })}
        <p className="kecil redup">{t('hitung.periksa.peristiwa_keterangan')}</p>
        {belumDipilih && <p className="pesan-galat">{t('hitung.periksa.kejadian_pilih_dulu')}</p>}
      </>}
      <div className="deret antar">
        <button type="button" className="tautan" onClick={saatTutup}>{t('hitung.periksa.batal')}</button>
        <div className="deret">
          {posisi > 0 && <button type="button" className="tautan" onClick={mundur}>{t('hitung.periksa.kejadian_kembali')}</button>}
          {langkah === 'kapan' && <Tombol onClick={simpan}>{t('hitung.periksa.simpan_peristiwa')}</Tombol>}
        </div>
      </div>
    </section>
  );
}
