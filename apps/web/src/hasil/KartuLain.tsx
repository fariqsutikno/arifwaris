// Ubin pendamping daftar di layar Hasil (acuan-hasil-final.html): Jenis masalah, Tentang kasus ini (KASUS + HITUNGAN),
// Bagikan dan simpan, Langkah selanjutnya. Semua angka dari ringkasan (engine); ubin tanpa isi tidak dirender pemanggil.

import type { ReactNode } from 'react';
import { formatRupiah } from '../format';
import { Ikon, type NamaIkon } from '../ui/Ikon';
import { LANGKAH_SELANJUTNYA } from '../konten/ahwal';
import { PILIHAN_PEMBULATAN } from '../konten/harta';
import { Istilah } from '../ui/Tooltip';
import type { RingkasanHasil, TentangKasus } from './ringkasan';
import { angka, panah, t } from '../terjemah';

// Bagian tertentu = fardh (1/2, 1/4, 1/8, 2/3, 1/3, 1/6): besarnya sudah ditentukan nash.
const JENIS_KASUS: Record<NonNullable<TentangKasus['kelas']>, { nama: string; istilah: string; arti: string }> = {
  adilah: { nama: t('hitung.normal_adilah'), istilah: 'adilah', arti: t('hitung.jumlah_bagian_tertentu_fardh_tidak_melebihi') },
  ailah: { nama: t('hitung.aul'), istilah: 'aul', arti: t('hitung.jumlah_bagian_tertentu_melebihi_harta_jadi') },
  raddA: { nama: t('hitung.radd'), istilah: 'radd', arti: t('hitung.ada_sisa_tanpa_ashabah_sisa_dikembalikan') },
  raddB: { nama: t('hitung.radd_dengan_suami_istri'), istilah: 'radd', arti: t('hitung.ada_sisa_tanpa_ashabah_sisa_dikembalikan_2') },
};
const ARTI_NISBAH: Record<string, string> = {
  tamatsul: t('hitung.sama_besar'), tadakhul: t('hitung.yang_besar_habis_dibagi_yang_kecil'),
  tawafuq: t('hitung.punya_faktor_persekutuan'), tabayun: t('hitung.tidak_punya_faktor_persekutuan'), habis: t('hitung.sudah_habis_dibagi'),
};
const Nisbah = ({ hubungan }: { hubungan: string }) =>
  hubungan === 'habis' ? <>{ARTI_NISBAH.habis}</> : <>{ARTI_NISBAH[hubungan] ?? hubungan} (<Istilah id={hubungan}>{hubungan}</Istilah>)</>;

/** Baris info: label abu · nilai tebal · keterangan kecil. */
function BarisInfo({ label, nilai, keterangan }: { label: ReactNode; nilai: ReactNode; keterangan?: ReactNode }) {
  return <div className="baris-info"><span className="lbl">{label}</span><b>{nilai}</b>{keterangan && <small>{keterangan}</small>}</div>;
}

export function UbinJenisMasalah({ ringkasan, daftarMayit }: { ringkasan: RingkasanHasil; daftarMayit: string[] }) {
  const jenis = ringkasan.tentang.kelas ? JENIS_KASUS[ringkasan.tentang.kelas] : undefined;
  return (
    <section className="ubin-h" aria-labelledby="judul-jenis-masalah">
      <h2 id="judul-jenis-masalah">{t('hasil.jenis_masalah')}</h2>
      <div className="daftar-info">
        <BarisInfo label={t('hitung.jenis_kasus')} nilai={ringkasan.jenis === 'munasakhat' ? <Istilah id="munasakhat">{t('hitung.munasakhat')}</Istilah> : t('hasil.biasa')} />
        {jenis && <BarisInfo label={t('hasil.kondisi')} nilai={<Istilah id={jenis.istilah}>{jenis.nama}</Istilah>} keterangan={jenis.arti} />}
        <BarisInfo label={t('hasil.mayit')} nilai={daftarMayit.map((nama, urutan) => angka(`${urutan + 1}: ${nama}`)).join(' · ')} />
        <BarisInfo label={t('hasil.yang_dibagi')} nilai={t('hitung.harta_nama', { nama: daftarMayit[0] ?? '' })} />
      </div>
    </section>
  );
}

export function UbinTentang({ ringkasan, satuanPembulatan, sembunyiNominal, saatUbahHarta }: {
  ringkasan: RingkasanHasil; satuanPembulatan: bigint; sembunyiNominal: boolean; saatUbahHarta?: (() => void) | undefined;
}) {
  const { tirkah, tentang } = ringkasan;
  const uang = (nilai: bigint) => (sembunyiNominal ? t('hitung.rp') : formatRupiah(nilai));
  return (
    <section className="ubin-h" aria-labelledby="judul-tentang">
      <h2 id="judul-tentang">{t('hitung.tentang_kasus_ini')}</h2>
      <h3 className="kepala-info">{t('hasil.kasus')}</h3>
      <div className="daftar-info">
        <BarisInfo label={t('hasil.madzhab')} nilai={t('hasil.syafii')} keterangan={t('hasil.syafii_ket')} />
        <BarisInfo label={t('hitung.harta_yang_dibagi')} nilai={uang(tirkah.bersih)}
          keterangan={<>{t('hasil.rincian_harta', { kotor: uang(tirkah.kotor), jenazah: uang(tirkah.tajhiz), hutang: uang(tirkah.hutang), wasiat: uang(tirkah.wasiatDipakai) })}
            {tirkah.wasiatButuhIjazah > 0n && <> · {t('hitung.wasiat_dipangkas_ke_batas_1_3', { lebih: uang(tirkah.wasiatButuhIjazah) })}</>}
            {saatUbahHarta && <> · <button type="button" className="tautan-aksi tautan-sebaris" onClick={saatUbahHarta}>{t('hitung.ubah_harta')}</button></>}</>} />
        <BarisInfo label={t('hitung.ahli_waris')} nilai={t('hasil.ringkas_ahli_waris', { penerima: angka(String(ringkasan.penerima.length)), tidak: angka(String(ringkasan.terhalang.length)) })} />
        <BarisInfo label={t('hasil.pembulatan')} nilai={t('hasil.ke_satuan', { satuan: PILIHAN_PEMBULATAN.find(pilihan => pilihan.satuan === satuanPembulatan)?.judul ?? formatRupiah(satuanPembulatan) })}
          keterangan={t('hasil.dibulatkan_ke_bawah')} />
      </div>
      <h3 className="kepala-info">{t('hasil.hitungan')}</h3>
      <div className="daftar-info"><BarisHitungan tentang={tentang} /></div>
    </section>
  );
}

function BarisHitungan({ tentang }: { tentang: TentangKasus }) {
  return (
    <>
      {tentang.ashl && (
        <BarisInfo label={<Istilah id="ashlul-masalah">{t('hitung.asal_masalah')}</Istilah>} nilai={angka(String(tentang.ashl.nilai))}
          keterangan={tentang.ashl.penyebut.length > 1
            ? <>{t('hitung.dari_penyebut_daftar_yang', { daftar: angka(tentang.ashl.penyebut.map(String).join(t('umum.dan'))) })} <Nisbah hubungan={tentang.ashl.hubungan ?? ''} /></>
            : t('hitung.penyebut_bagian_yang_ada')} />
      )}
      {tentang.tashih && (
        <BarisInfo label={<Istilah id="tashih">{t('hitung.tashih')}</Istilah>} nilai={angka(`${tentang.tashih.dari} ${panah()} ${tentang.tashih.jadi}`)}
          keterangan={<>{t('hitung.bagian_sekelompok_ahli_waris_belum_habis')}{tentang.tashih.hubungan ? <>, <Nisbah hubungan={tentang.tashih.hubungan} /></> : ''}{t('hitung.jadi_semua_dikali_kali', { kali: String(tentang.tashih.jadi / tentang.tashih.dari) })}</>} />
      )}
      <BarisInfo label={t('hasil.aul_radd')}
        nilai={tentang.aul ? <><Istilah id="aul">{t('hitung.aul')}</Istilah> {angka(`${tentang.aul.dari} ${panah()} ${tentang.aul.menjadi}`)}</>
          : tentang.kelas === 'raddA' || tentang.kelas === 'raddB' ? <Istilah id="radd">{t('hitung.radd')}</Istilah> : t('hasil.tidak_ada')}
        keterangan={tentang.aul ? t('hitung.asal_masalah_dinaikkan_supaya_semua_bagian') : undefined} />
      {tentang.jamiah !== undefined && <BarisInfo label={<Istilah id="jamiah">{t('hitung.jami_ah')}</Istilah>} nilai={angka(String(tentang.jamiah))} keterangan={t('hitung.mas_alah_gabungan_untuk_semua_mayit')} />}
    </>
  );
}

export interface AksiUbin { ikon: NamaIkon; judul: string; keterangan: string; saatPilih: () => void }

/** Daftar aksi berupa baris ikon + judul + keterangan (bukan tombol berbingkai). */
export function DaftarAksi({ daftar }: { daftar: AksiUbin[] }) {
  return (
    <div className="daftar-aksi-ubin">
      {daftar.map(aksi => (
        <button key={aksi.judul} type="button" onClick={aksi.saatPilih}>
          <span className="ikon-bulat"><Ikon nama={aksi.ikon} /></span><span><b>{aksi.judul}</b><small>{aksi.keterangan}</small></span>
        </button>
      ))}
    </div>
  );
}

export function UbinBagikan({ daftar }: { daftar: AksiUbin[] }) {
  return (
    <section className="ubin-h oranye" aria-labelledby="judul-bagikan" data-tur="selanjutnya">
      <h2 id="judul-bagikan">{t('hasil.bagikan_dan_simpan')}</h2>
      <DaftarAksi daftar={daftar} />
    </section>
  );
}

export function UbinSelanjutnya() {
  return (
    <section className="ubin-h mint" aria-labelledby="judul-selanjutnya">
      <h2 id="judul-selanjutnya">{t('hasil.langkah_selanjutnya')}</h2>
      <ol className="urutan-selanjutnya">
        {LANGKAH_SELANJUTNYA.map(langkah => <li key={langkah.judul}><b>{langkah.judul}</b><span>{langkah.isi}</span></li>)}
      </ol>
    </section>
  );
}
