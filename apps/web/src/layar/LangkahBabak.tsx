// Layar daftar babak 2..n (spec 1.2): satu almarhum lanjutan, dilihat dari sisinya. Menerima Kasus + nomor babak;
// menyerahkan perubahan graf (keluarga baru) dan anak yang lahir belakangan. Keadaan orang dan hamil ada di layar keadaan (KeadaanKeluarga).

import type { IdOrang } from '@waris/engine';
import { PohonDasar } from '../hasil/Pohon';
import type { Kasus } from '../kasus';
import { ubahNama } from '../checklist';
import { aturDikandung, babakAsal, calonPasangan, daftarAlmarhum, kerabatDari, namaSingkat, nikahkan } from '../keadaanOrang';
import { LangkahAhliWaris, labelOrangChecklist } from './LangkahAhliWaris';
import { t } from '../terjemah';

interface Props { kasus: Kasus; babak: number; ubah: (f: (k: Kasus) => Kasus) => void }

export function LangkahBabak({ kasus, babak, ubah }: Props) {
  const almarhum = daftarAlmarhum(kasus);
  const idMayit = almarhum[babak]!;
  const sebelumnya = almarhum.slice(0, babak);
  const nama = namaSingkat(kasus, idMayit);
  const namaSebelum = namaSingkat(kasus, almarhum[babak - 1]!);
  const pewaris = namaSingkat(kasus, kasus.graf.idPewaris);
  const kerabat = kerabatDari(kasus, idMayit);
  const dariBabakLalu = kerabat.filter(id => babakAsal(kasus, id) !== idMayit);
  // Anak X yang juga kerabat almarhum sebelumnya: tanyakan kapan dikandung [R13-1].
  const anakMayit = Object.values(kasus.graf.orang).filter(o => (o.idAyah === idMayit || o.idIbu === idMayit) && !o.penghubung).map(o => o.id);
  const peran = labelOrangChecklist(kasus.graf, babakAsal(kasus, idMayit) ?? kasus.graf.idPewaris, idMayit);
  const contohNama = kasus.graf.orang[idMayit]!.jenisKelamin === 'L' ? 'Budi' : 'Siti';
  const sebutan = (id: IdOrang) => labelOrangChecklist(kasus.graf, idMayit, id);

  return (
    <div className="tumpuk">
      {/* Nama dulu, supaya kalimat di bawah berbunyi "Budi wafat…", bukan "Anak laki-laki wafat…". */}
      <label className="isian isian-kecil">
        <span>{t('hitung.babak.nama_almarhum', { peran: peran.toLowerCase() })}</span>
        <input type="text" defaultValue={kasus.graf.orang[idMayit]!.nama ?? ''} placeholder={t('hitung.babak.nama_almarhum_contoh', { contoh: contohNama })}
          onChange={e => ubah(k => ({ ...k, graf: ubahNama(k.graf, idMayit, e.target.value) }))} />
      </label>
      <p className="pembuka-babak">{t('hitung.babak.pembuka', { nama, sebelum: namaSebelum })} <b>{t('hitung.babak.sudut_pandang', { nama })}</b></p>
      <div className="pohon-kecil">
        <PohonDasar graf={{ ...kasus.graf, idPewaris: idMayit }} isiNode={id => ({
          kelas: id === idMayit ? 'pewaris' : sebelumnya.includes(id) ? 'penghubung' : 'ahli-waris',
          peran: id === idMayit ? t('hitung.almarhum') : sebutan(id),
          nama: id === idMayit ? nama : kasus.graf.orang[id]!.nama ?? '',
        })} />
      </div>
      {dariBabakLalu.length > 0 && (
        <section className="kelompok-kerabat">
          <h3 className="judul-bagian-kecil">{t('hitung.babak.dari_yang_sudah_ada')}</h3>
          <ul className="daftar-keadaan">
            {dariBabakLalu.map(id => (
              <li key={id} className={sebelumnya.includes(id) ? 'baris-kerabat nonaktif' : 'baris-kerabat'}>
                <b>{namaSingkat(kasus, id)}</b>
                <span>{sebelumnya.includes(id)
                  ? t('hitung.babak.sudah_wafat_lebih_dulu', { nama })
                  : t('hitung.babak.bagi_nama', { nama, sebutan: sebutan(id) })}</span>
              </li>
            ))}
          </ul>
          <p className="keterangan">{t('hitung.babak.dari_babak_sebelumnya')}</p>
        </section>
      )}
      <LangkahAhliWaris graf={kasus.graf} idMayit={idMayit} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />
      {calonPasangan(kasus, idMayit).length > 0 && (
        <label className="isian isian-kecil">
          <span>{t('hitung.babak.pasangan_dari_yang_ada', { nama })}</span>
          <select value="" onChange={e => { if (e.target.value) ubah(k => nikahkan(k, idMayit, e.target.value)); }}>
            <option value="">{t('hitung.babak.pasangan_tidak')}</option>
            {calonPasangan(kasus, idMayit).map(id => <option key={id} value={id}>{namaSingkat(kasus, id)}</option>)}
          </select>
        </label>
      )}
      {anakMayit.length > 0 && (
        <section className="kelompok-kerabat">
          <h3 className="judul-bagian-kecil">{t('hitung.babak.anak_lahir_belakangan')}</h3>
          {anakMayit.map(idAnak => (
            <label key={idAnak} className="isian isian-kecil">
              <span>{t('hitung.babak.anak_sudah_ada_kapan', { anak: namaSingkat(kasus, idAnak) })}</span>
              <select value={kasus.dikandungSetelahWafat?.[idAnak] ?? ''} onChange={e => ubah(k => aturDikandung(k, idAnak, e.target.value || null))}>
                <option value="">{t('hitung.babak.sudah_ada_sebelum', { mayit: pewaris })}</option>
                {sebelumnya.map(id => <option key={id} value={id}>{t('hitung.babak.dikandung_sesudah', { mayit: namaSingkat(kasus, id) })}</option>)}
              </select>
            </label>
          ))}
        </section>
      )}
      <p className="keterangan">{t('hitung.babak.harta_sendiri', { nama, pewaris })}</p>
    </div>
  );
}
