// Kartu pendamping Pembagian di halaman hasil: Ringkasan harta (statistik + hitungan bersusun yang bisa dibuka),
// Tidak mendapat bagian, Tentang kasus ini (jenis kasus, asal masalah, tashih dari jejak engine), Habis ini ngapain,
// dan kartu kerangka untuk bagian yang datanya belum tersedia.

import { useId, useState } from 'react';
import { formatRupiah, formatRupiahRingkas } from '../format';
import { Ikon, type NamaIkon } from '../ui/Ikon';
import { AvatarOrang } from './AvatarOrang';
import { useAtributOrang } from './sorot';
import { LANGKAH_SELANJUTNYA } from '../konten/ahwal';
import { Istilah } from '../ui/Tooltip';
import { Lipat } from './Lipat';
import type { RingkasanHasil, TentangKasus } from './ringkasan';
import { angka, panah, t } from '../terjemah';

export function KartuHarta({ ringkasan, jumlahOrang, sembunyiNominal, sedangMenebak, saatUbahHarta }: {
  ringkasan: RingkasanHasil; jumlahOrang: number; sembunyiNominal: boolean; sedangMenebak: boolean; saatUbahHarta?: (() => void) | undefined;
}) {
  const { tirkah } = ringkasan;
  const [rincianTerbuka, setRincianTerbuka] = useState(false);
  const idRincian = useId();
  const uang = (nilai: bigint) => (sembunyiNominal ? t('hitung.rp') : formatRupiah(nilai));
  const potongan = [
    { label: t('hitung.pengurusan_jenazah'), nilai: tirkah.tajhiz },
    { label: t('hitung.hutang'), nilai: tirkah.hutang },
    { label: t('hitung.wasiat'), nilai: tirkah.wasiatDipakai },
  ];
  // Jumlah penerima dan sisa pembulatan adalah bagian dari jawaban: disembunyikan selama pelajar masih menebak.
  const statistik: Array<{ ikon: NamaIkon; nilai: string; label: string }> = [
    { ikon: 'koin', nilai: sembunyiNominal ? t('hitung.rp') : formatRupiahRingkas(tirkah.bersih), label: t('hitung.total_harta') },
    { ikon: 'cabang', nilai: angka(String(jumlahOrang)), label: t('hitung.orang_di_pohon') },
    ...(sedangMenebak ? [] : [
      { ikon: 'orang' as const, nilai: angka(String(ringkasan.penerima.length)), label: t('hitung.menerima_bagian') },
      { ikon: 'benar' as const, nilai: uang(ringkasan.sisaPembulatan), label: t('hitung.sisa_pembulatan') },
    ]),
  ];

  return (
    <section className="kartu-sisi kartu-isi kartu-harta" aria-labelledby="judul-ringkasan-harta">
      <h2 id="judul-ringkasan-harta">{t('hitung.ringkasan_harta')}</h2>
      <div className="statistik-kartu">
        {statistik.map(butir => (
          <div key={butir.label}><span className="ikon-bulat"><Ikon nama={butir.ikon} /></span><p><b>{butir.nilai}</b><span>{butir.label}</span></p></div>
        ))}
      </div>
      <button type="button" className="kepala-rincian" aria-expanded={rincianTerbuka} aria-controls={idRincian} onClick={() => setRincianTerbuka(!rincianTerbuka)}>
        <span>{t('hitung.harta_yang_dibagi')}</span><b>{uang(tirkah.bersih)}</b><span className="panah-lipat" aria-hidden="true" />
      </button>
      {rincianTerbuka && (
        <div id={idRincian} className="rincian-harta">
          <p className="caption-isian">{t('hitung.harta_tidak_langsung_dibagi_dipakai_dulu')}</p>
          <div className="hitung-susun">
            <span>{t('hitung.harta_peninggalan')}</span><span className="nilai">{uang(tirkah.kotor)}</span>
            {potongan.map(bagian => <FragmenPotongan key={bagian.label} label={bagian.label} nilai={bagian.nilai} sembunyi={sembunyiNominal} />)}
            {tirkah.wasiatButuhIjazah > 0n
              ? <span className="ket">{t('hitung.wasiat_dipangkas_ke_batas_1_3', { lebih: uang(tirkah.wasiatButuhIjazah) })}</span>
              : tirkah.wasiatDipakai > 0n && <span className="ket">{t('hitung.aman_masih_di_bawah_batas_1', { batas: uang(tirkah.wasiatBatas) })}</span>}
            <span className="garis" />
            <b>{t('hitung.dibagi_ke_ahli_waris')}</b><b className="nilai total">{uang(tirkah.bersih)}</b>
          </div>
          {saatUbahHarta && <button type="button" className="tautan-aksi" onClick={saatUbahHarta}><Ikon nama="pensil" ukuran={18} />{t('hitung.ubah_harta')}</button>}
        </div>
      )}
    </section>
  );
}

function FragmenPotongan({ label, nilai, sembunyi }: { label: string; nilai: bigint; sembunyi: boolean }) {
  return <><span>{label}</span><span className="nilai kurang">{sembunyi ? t('hitung.rp_2') : `−${formatRupiah(nilai)}`}</span></>;
}

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

export function KartuTentang({ tentang }: { tentang: TentangKasus }) {
  const jenis = tentang.kelas ? JENIS_KASUS[tentang.kelas] : undefined;
  return (
    <Lipat judul={t('hitung.tentang_kasus_ini')} ringkas={jenis?.nama} terbukaAwal>
      <div className="fakta-kasus">
        {jenis && <div><span className="lbl">{t('hitung.jenis_kasus')}</span><b><Istilah id={jenis.istilah}>{jenis.nama}</Istilah></b><p>{jenis.arti}</p></div>}
        {tentang.ashl && (
          <div><span className="lbl"><Istilah id="ashlul-masalah">{t('hitung.asal_masalah')}</Istilah></span><b>{angka(String(tentang.ashl.nilai))}</b>
            <p>{tentang.ashl.penyebut.length > 1
              ? <>{t('hitung.dari_penyebut_daftar_yang', { daftar: angka(tentang.ashl.penyebut.map(String).join(t('umum.dan'))) })} <Nisbah hubungan={tentang.ashl.hubungan ?? ''} />.</>
              : t('hitung.penyebut_bagian_yang_ada')}</p></div>
        )}
        {tentang.aul && <div><span className="lbl"><Istilah id="aul">{t('hitung.aul')}</Istilah></span><b>{angka(`${tentang.aul.dari} ${panah()} ${tentang.aul.menjadi}`)}</b><p>{t('hitung.asal_masalah_dinaikkan_supaya_semua_bagian')}</p></div>}
        {tentang.tashih && (
          <div><span className="lbl"><Istilah id="tashih">{t('hitung.tashih')}</Istilah></span><b>{angka(`${tentang.tashih.dari} ${panah()} ${tentang.tashih.jadi}`)}</b>
            <p>{t('hitung.bagian_sekelompok_ahli_waris_belum_habis')}{tentang.tashih.hubungan ? <>, <Nisbah hubungan={tentang.tashih.hubungan} /></> : ''}{t('hitung.jadi_semua_dikali_kali', { kali: String(tentang.tashih.jadi / tentang.tashih.dari) })}</p></div>
        )}
        {tentang.jamiah !== undefined && <div><span className="lbl"><Istilah id="jamiah">{t('hitung.jami_ah')}</Istilah></span><b>{angka(String(tentang.jamiah))}</b><p>{t('hitung.mas_alah_gabungan_untuk_semua_mayit')} (<Istilah id="munasakhat">{t('hitung.munasakhat')}</Istilah>).</p></div>}
      </div>
    </Lipat>
  );
}

/** Orang di pohon yang tidak menerima, masing-masing dengan alasannya; mengetuk membuka penjelasan orang itu. */
export function KartuTidakDapat({ ringkasan, saatPilihOrang }: { ringkasan: RingkasanHasil; saatPilihOrang: (id: string) => void }) {
  const atribut = useAtributOrang();
  return (
    <section className="kartu-sisi kartu-isi" aria-labelledby="judul-tidak-dapat">
      <div className="judul-kartu">
        <h2 id="judul-tidak-dapat">{t('hitung.tidak_mendapat_bagian')}</h2>
        {ringkasan.terhalang.length > 0 && <p className="sub-kartu">{t('hitung.jumlah_orang_di_pohon', { jumlah: angka(String(ringkasan.terhalang.length)) })}</p>}
      </div>
      {ringkasan.terhalang.length === 0 ? <p className="sub-kartu">{t('hitung.semua_orang_mendapat_bagian')}</p> : (
        <ul className="daftar-bagian">
          {ringkasan.terhalang.map(orang => {
            const { className, ...pemicu } = atribut(orang.id);
            return (
              <li key={orang.id}>
                <button type="button" {...pemicu} className={['baris-bagian', className].filter(Boolean).join(' ')} onClick={() => saatPilihOrang(orang.id)}>
                  <AvatarOrang nama={orang.nama} ukuran={36} />
                  <span className="nama-bagian">{orang.nama}<small>{orang.alasan}</small></span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Kartu yang datanya belum tersedia di aplikasi: tempatnya sudah ada supaya tata letak tetap, isinya menyusul. */
export function KartuKerangka({ judul, keterangan }: { judul: string; keterangan: string }) {
  return (
    <section className="kartu-sisi kartu-isi kartu-kerangka" aria-label={judul}>
      <div className="judul-kartu"><h2>{judul}</h2><span className="chip-segera">{t('umum.segera_hadir')}</span></div>
      <p className="sub-kartu">{keterangan}</p>
    </section>
  );
}

export function KartuSelanjutnya({ tersimpan, saatSimpan, saatEkspor }: { tersimpan: boolean; saatSimpan: () => void; saatEkspor: () => void }) {
  return (
    <section className="kartu-sisi kartu-isi" aria-labelledby="judul-selanjutnya" data-tur="selanjutnya">
      <h2 id="judul-selanjutnya">{t('hitung.habis_ini_ngapain')}</h2>
      <div className="daftar-aksi">
        {tersimpan
          ? <span className="status-simpan"><Ikon nama="benar" /> {t('hitung.tersimpan')}</span>
          : <button type="button" className="tautan-aksi" onClick={saatSimpan}><Ikon nama="berkas" />{t('hitung.simpan_lanjut_nanti')}</button>}
        <button type="button" className="tautan-aksi" onClick={saatEkspor}><Ikon nama="unduh" />{t('hitung.ekspor_tabel_lengkap')}</button>
        <span className="aksi-segera"><Ikon nama="cetak" />{t('hitung.lembar_musyawarah')}<span className="chip-segera">{t('umum.segera_hadir')}</span></span>
        <span className="aksi-segera"><Ikon nama="kirim" />{t('hitung.kirim_ke_keluarga')}<span className="chip-segera">{t('umum.segera_hadir')}</span></span>
      </div>
      <details className="lipat-urutan">
        <summary>{t('hitung.urutan_yang_biasa_dilakukan')}</summary>
        <p className="caption-isian">{t('hitung.angka_sudah_ada_ini_urutan_yang')}</p>
        <ol className="urutan-selanjutnya">
          {LANGKAH_SELANJUTNYA.map(langkah => <li key={langkah.judul}><b>{langkah.judul}</b><span>{langkah.isi}</span></li>)}
        </ol>
      </details>
    </section>
  );
}
