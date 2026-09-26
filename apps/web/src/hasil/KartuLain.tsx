// Kartu sidebar yang tertutup: Harta yang dibagi (hitungan bersusun + bar komposisi bertooltip),
// Tentang kasus ini (jenis kasus, asal masalah, tashih dari jejak engine), dan Habis ini ngapain.

import { formatRupiah } from '../format';
import { LANGKAH_SELANJUTNYA } from '../konten/ahwal';
import { Istilah } from '../ui/Tooltip';
import { Lipat } from './Lipat';
import type { RingkasanHasil, TentangKasus } from './ringkasan';
import { angka, panah, t } from '../terjemah';

export function KartuHarta({ ringkasan, sembunyiNominal, saatUbahHarta }: { ringkasan: RingkasanHasil; sembunyiNominal: boolean; saatUbahHarta?: (() => void) | undefined }) {
  const { tirkah } = ringkasan;
  const uang = (nilai: bigint) => (sembunyiNominal ? t('Rp ••••••') : formatRupiah(nilai));
  const potongan = [
    { label: t('Pengurusan jenazah'), nilai: tirkah.tajhiz },
    { label: t('Hutang'), nilai: tirkah.hutang },
    { label: t('Wasiat'), nilai: tirkah.wasiatDipakai },
  ];

  return (
    <Lipat judul={t('Harta yang dibagi')} ringkas={uang(tirkah.bersih)} className="urut-harta kartu-harta">
      <p className="caption-isian">{t('Harta tidak langsung dibagi. Dipakai dulu untuk mengurus jenazah, lalu melunasi hutang, lalu menunaikan wasiat. Sisanya baru hak ahli waris.')}</p>
      <div className="hitung-susun">
        <span>{t('Harta peninggalan')}</span><span className="nilai">{uang(tirkah.kotor)}</span>
        {potongan.map(bagian => <FragmenPotongan key={bagian.label} label={bagian.label} nilai={bagian.nilai} sembunyi={sembunyiNominal} />)}
        {tirkah.wasiatButuhIjazah > 0n
          ? <span className="ket">{t('Wasiat dipangkas ke batas 1/3. Kelebihan {lebih} hanya berlaku bila semua ahli waris setuju.', { lebih: uang(tirkah.wasiatButuhIjazah) })}</span>
          : tirkah.wasiatDipakai > 0n && <span className="ket">{t('Aman, masih di bawah batas 1/3 (maks. {batas}).', { batas: uang(tirkah.wasiatBatas) })}</span>}
        <span className="garis" />
        <b>{t('Dibagi ke ahli waris')}</b><b className="nilai total">{uang(tirkah.bersih)}</b>
      </div>
      {saatUbahHarta && <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm tombol-ubah-harta" onClick={saatUbahHarta}>{t('Ubah harta')}</button>}
    </Lipat>
  );
}

function FragmenPotongan({ label, nilai, sembunyi }: { label: string; nilai: bigint; sembunyi: boolean }) {
  return <><span>{label}</span><span className="nilai kurang">{sembunyi ? t('−Rp ••••••') : `−${formatRupiah(nilai)}`}</span></>;
}

// Bagian tertentu = fardh (1/2, 1/4, 1/8, 2/3, 1/3, 1/6): besarnya sudah ditentukan nash.
const JENIS_KASUS: Record<NonNullable<TentangKasus['kelas']>, { nama: string; istilah: string; arti: string }> = {
  adilah: { nama: t("Normal ('adilah)"), istilah: 'adilah', arti: t('Jumlah bagian tertentu (fardh) tidak melebihi harta; bila ada sisa, diambil ashabah.') },
  ailah: { nama: t("'Aul"), istilah: 'aul', arti: t('Jumlah bagian tertentu melebihi harta, jadi semua bagian dikurangi secara seimbang.') },
  raddA: { nama: t('Radd'), istilah: 'radd', arti: t('Ada sisa tanpa ashabah; sisa dikembalikan ke pemilik bagian tertentu.') },
  raddB: { nama: t('Radd (dengan suami/istri)'), istilah: 'radd', arti: t('Ada sisa tanpa ashabah; sisa dikembalikan ke pemilik bagian tertentu selain suami/istri.') },
};
const ARTI_NISBAH: Record<string, string> = {
  tamatsul: t('sama besar'), tadakhul: t('yang besar habis dibagi yang kecil'),
  tawafuq: t('punya faktor persekutuan'), tabayun: t('tidak punya faktor persekutuan'), habis: t('sudah habis dibagi'),
};
const Nisbah = ({ hubungan }: { hubungan: string }) =>
  hubungan === 'habis' ? <>{ARTI_NISBAH.habis}</> : <>{ARTI_NISBAH[hubungan] ?? hubungan} (<Istilah id={hubungan}>{hubungan}</Istilah>)</>;

export function KartuTentang({ tentang }: { tentang: TentangKasus }) {
  const jenis = tentang.kelas ? JENIS_KASUS[tentang.kelas] : undefined;
  return (
    <Lipat judul={t('Tentang kasus ini')} ringkas={jenis?.nama} className="urut-tentang">
      <div className="fakta-kasus">
        {jenis && <div><span className="lbl">{t('Jenis kasus')}</span><b><Istilah id={jenis.istilah}>{jenis.nama}</Istilah></b><p>{jenis.arti}</p></div>}
        {tentang.ashl && (
          <div><span className="lbl"><Istilah id="ashlul-masalah">{t('Asal masalah')}</Istilah></span><b>{angka(String(tentang.ashl.nilai))}</b>
            <p>{tentang.ashl.penyebut.length > 1
              ? <>{t('Dari penyebut {daftar}, yang', { daftar: angka(tentang.ashl.penyebut.map(String).join(t(' dan '))) })} <Nisbah hubungan={tentang.ashl.hubungan ?? ''} />.</>
              : t('Penyebut bagian yang ada.')}</p></div>
        )}
        {tentang.aul && <div><span className="lbl"><Istilah id="aul">{t('\'Aul')}</Istilah></span><b>{angka(`${tentang.aul.dari} ${panah()} ${tentang.aul.menjadi}`)}</b><p>{t('Asal masalah dinaikkan supaya semua bagian muat.')}</p></div>}
        {tentang.tashih && (
          <div><span className="lbl"><Istilah id="tashih">{t('Tashih')}</Istilah></span><b>{angka(`${tentang.tashih.dari} ${panah()} ${tentang.tashih.jadi}`)}</b>
            <p>{t('Bagian sekelompok ahli waris belum habis dibagi jumlah orangnya')}{tentang.tashih.hubungan ? <>, <Nisbah hubungan={tentang.tashih.hubungan} /></> : ''}{t(', jadi semua dikali {kali}.', { kali: String(tentang.tashih.jadi / tentang.tashih.dari) })}</p></div>
        )}
        {tentang.jamiah !== undefined && <div><span className="lbl"><Istilah id="jamiah">{t('Jami\'ah')}</Istilah></span><b>{angka(String(tentang.jamiah))}</b><p>{t("Mas'alah gabungan untuk semua mayit")} (<Istilah id="munasakhat">{t('munasakhat')}</Istilah>).</p></div>}
      </div>
    </Lipat>
  );
}

export function KartuSelanjutnya() {
  return (
    <Lipat judul={t('Habis ini ngapain?')} dataTur="selanjutnya" className="urut-selanjutnya">
      <p className="caption-isian">{t('Angka sudah ada. Ini urutan yang biasanya dilakukan keluarga. (Draf, menunggu pengecekan tim keilmuan.)')}</p>
      <ol className="urutan-selanjutnya">
        {LANGKAH_SELANJUTNYA.map(langkah => <li key={langkah.judul}><b>{langkah.judul}</b><span>{langkah.isi}</span></li>)}
      </ol>
    </Lipat>
  );
}
