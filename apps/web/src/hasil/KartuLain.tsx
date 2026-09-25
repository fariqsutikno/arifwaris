// Kartu sidebar yang tertutup: Harta yang dibagi (hitungan bersusun + bar komposisi bertooltip),
// Tentang kasus ini (jenis kasus, asal masalah, tashih dari jejak engine), dan Habis ini ngapain.

import { formatRupiah } from '../format';
import { LANGKAH_SELANJUTNYA } from '../konten/ahwal';
import { Istilah } from '../ui/Tooltip';
import { Lipat } from './Lipat';
import type { RingkasanHasil, TentangKasus } from './ringkasan';

export function KartuHarta({ ringkasan, sembunyiNominal, saatUbahHarta }: { ringkasan: RingkasanHasil; sembunyiNominal: boolean; saatUbahHarta: () => void }) {
  const { tirkah } = ringkasan;
  const uang = (nilai: bigint) => (sembunyiNominal ? 'Rp ••••••' : formatRupiah(nilai));
  const potongan = [
    { label: 'Pengurusan jenazah', nilai: tirkah.tajhiz },
    { label: 'Hutang', nilai: tirkah.hutang },
    { label: 'Wasiat', nilai: tirkah.wasiatDipakai },
  ];

  return (
    <Lipat judul="Harta yang dibagi" ringkas={uang(tirkah.bersih)} className="urut-harta">
      <p className="caption-isian">Harta tidak langsung dibagi. Dipakai dulu untuk mengurus jenazah, lalu melunasi hutang, lalu menunaikan wasiat. Sisanya baru hak ahli waris.</p>
      <div className="hitung-susun">
        <span>Harta peninggalan</span><span className="nilai">{uang(tirkah.kotor)}</span>
        {potongan.map(bagian => <FragmenPotongan key={bagian.label} label={bagian.label} nilai={bagian.nilai} sembunyi={sembunyiNominal} />)}
        {tirkah.wasiatButuhIjazah > 0n
          ? <span className="ket">Wasiat dipangkas ke batas 1/3. Kelebihan {uang(tirkah.wasiatButuhIjazah)} hanya berlaku bila semua ahli waris setuju.</span>
          : tirkah.wasiatDipakai > 0n && <span className="ket">Aman, masih di bawah batas 1/3 (maks. {uang(tirkah.wasiatBatas)}).</span>}
        <span className="garis" />
        <b>Dibagi ke ahli waris</b><b className="nilai total">{uang(tirkah.bersih)}</b>
      </div>
      <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm tombol-ubah-harta" onClick={saatUbahHarta}>Ubah harta</button>
    </Lipat>
  );
}

function FragmenPotongan({ label, nilai, sembunyi }: { label: string; nilai: bigint; sembunyi: boolean }) {
  return <><span>{label}</span><span className="nilai kurang">{sembunyi ? '−Rp ••••••' : `−${formatRupiah(nilai)}`}</span></>;
}

// Bagian tertentu = fardh (1/2, 1/4, 1/8, 2/3, 1/3, 1/6): besarnya sudah ditentukan nash.
const JENIS_KASUS: Record<NonNullable<TentangKasus['kelas']>, { nama: string; istilah: string; arti: string }> = {
  adilah: { nama: "Normal ('adilah)", istilah: 'adilah', arti: 'Jumlah bagian tertentu (fardh) tidak melebihi harta; bila ada sisa, diambil ashabah.' },
  ailah: { nama: "'Aul", istilah: 'aul', arti: 'Jumlah bagian tertentu melebihi harta, jadi semua bagian dikurangi secara seimbang.' },
  raddA: { nama: 'Radd', istilah: 'radd', arti: 'Ada sisa tanpa ashabah; sisa dikembalikan ke pemilik bagian tertentu.' },
  raddB: { nama: 'Radd (dengan suami/istri)', istilah: 'radd', arti: 'Ada sisa tanpa ashabah; sisa dikembalikan ke pemilik bagian tertentu selain suami/istri.' },
};
const ARTI_NISBAH: Record<string, string> = {
  tamatsul: 'sama besar', tadakhul: 'yang besar habis dibagi yang kecil',
  tawafuq: 'punya faktor persekutuan', tabayun: 'tidak punya faktor persekutuan', habis: 'sudah habis dibagi',
};
const Nisbah = ({ hubungan }: { hubungan: string }) =>
  hubungan === 'habis' ? <>{ARTI_NISBAH.habis}</> : <>{ARTI_NISBAH[hubungan] ?? hubungan} (<Istilah id={hubungan}>{hubungan}</Istilah>)</>;

export function KartuTentang({ tentang }: { tentang: TentangKasus }) {
  const jenis = tentang.kelas ? JENIS_KASUS[tentang.kelas] : undefined;
  return (
    <Lipat judul="Tentang kasus ini" ringkas={jenis?.nama} className="urut-tentang">
      <div className="fakta-kasus">
        {jenis && <div><span className="lbl">Jenis kasus</span><b><Istilah id={jenis.istilah}>{jenis.nama}</Istilah></b><p>{jenis.arti}</p></div>}
        {tentang.ashl && (
          <div><span className="lbl"><Istilah id="ashlul-masalah">Asal masalah</Istilah></span><b>{String(tentang.ashl.nilai)}</b>
            <p>{tentang.ashl.penyebut.length > 1
              ? <>Dari penyebut {tentang.ashl.penyebut.map(String).join(' dan ')}, yang <Nisbah hubungan={tentang.ashl.hubungan ?? ''} />.</>
              : 'Penyebut bagian yang ada.'}</p></div>
        )}
        {tentang.aul && <div><span className="lbl"><Istilah id="aul">'Aul</Istilah></span><b>{`${tentang.aul.dari} → ${tentang.aul.menjadi}`}</b><p>Asal masalah dinaikkan supaya semua bagian muat.</p></div>}
        {tentang.tashih && (
          <div><span className="lbl"><Istilah id="tashih">Tashih</Istilah></span><b>{`${tentang.tashih.dari} → ${tentang.tashih.jadi}`}</b>
            <p>Bagian sekelompok ahli waris belum habis dibagi jumlah orangnya{tentang.tashih.hubungan ? <>, <Nisbah hubungan={tentang.tashih.hubungan} /></> : ''}, jadi semua dikali {String(tentang.tashih.jadi / tentang.tashih.dari)}.</p></div>
        )}
        {tentang.jamiah !== undefined && <div><span className="lbl"><Istilah id="jamiah">Jami'ah</Istilah></span><b>{String(tentang.jamiah)}</b><p>Mas'alah gabungan untuk semua mayit (<Istilah id="munasakhat">munasakhat</Istilah>).</p></div>}
      </div>
    </Lipat>
  );
}

export function KartuSelanjutnya() {
  return (
    <Lipat judul="Habis ini ngapain?" dataTur="selanjutnya" className="urut-selanjutnya">
      <p className="caption-isian">Angka sudah ada. Ini urutan yang biasanya dilakukan keluarga. (Draf, menunggu pengecekan tim keilmuan.)</p>
      <ol className="urutan-selanjutnya">
        {LANGKAH_SELANJUTNYA.map(langkah => <li key={langkah.judul}><b>{langkah.judul}</b><span>{langkah.isi}</span></li>)}
      </ol>
    </Lipat>
  );
}
