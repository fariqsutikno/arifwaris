// Periksa latihan: satu baris per mayit berisi ahli warisnya, dengan "ubah" ke kartu mayit itu di langkah Ahli waris,
// lalu keadaan khusus (hilang, belum tahu, khuntsa, wafat sebelum mayit) dan baris harta yang dibagi.

import type { IdOrang } from '@waris/engine';
import { formatRupiah } from '../../format';
import type { Kasus } from '../../kasus';
import type { Aksi } from '../../keadaan';
import { labelMayit, labelOrangDiKartu, mayitLatihan } from '../../latihan';
import { daftarAlmarhum, keadaanOrang, namaSingkat } from '../../keadaanOrang';
import { t } from '../../terjemah';
import { statusKeadaan } from './HalLainKartu';

// Keadaan yang belum punya kalimat di BarisKhususCerita; sisanya (hilang, bersamaan, sesudah dibagi, janin) sudah tertulis di sana.
const KEADAAN_DITULIS_DI_SINI = ['wafatSebelum', 'belumTahu', 'khuntsa'];

export function RingkasanLatihan({ kasus, kirim }: { kasus: Kasus; kirim: (aksi: Aksi) => void }) {
  return (
    <div className="kartu tumpuk">
      {mayitLatihan(kasus).map(idMayit => (
        <section key={idMayit} className="tumpuk-rapat">
          <h2 className="judul-bagian-kecil">{t('hitung.cerita.label_babak', { nama: labelMayit(kasus, idMayit) })}</h2>
          <p>
            {labelOrangDiKartu(kasus, idMayit).map(({ id, label }) => {
              return kasus.urutanWafat.includes(id) ? `${label} (${t('hitung.latihan.wafat_sebelum_dibagi')})` : label;
            }).join(', ')}{' '}
            <button type="button" className="tautan" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 3, fokus: idMayit })}>{t('hitung.cerita.ubah')}</button>
          </p>
          {labelOrangDiKartu(kasus, idMayit).filter(({ id }) => KEADAAN_DITULIS_DI_SINI.includes(keadaanOrang(kasus, id))).map(({ id, label }) => (
            <p key={id}>{label}: {statusKeadaan(kasus, id, idMayit)}</p>
          ))}
        </section>
      ))}
      <BarisKhususCerita kasus={kasus} />
    </div>
  );
}

/** Baris keadaan khusus dan harta yang dibagi. */
function BarisKhususCerita({ kasus }: { kasus: Kasus }) {
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
