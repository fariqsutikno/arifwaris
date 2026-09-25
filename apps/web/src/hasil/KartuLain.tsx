// Kartu sidebar yang tertutup: Harta yang dibagi (hitungan bersusun + bar komposisi bertooltip),
// Tentang kasus ini (jenis kasus, asal masalah, tashih dari jejak engine), dan Habis ini ngapain.

import { useState } from 'react';
import { formatRupiah } from '../format';
import { LANGKAH_SELANJUTNYA } from '../konten/ahwal';
import { Lipat } from './Lipat';
import type { RingkasanHasil, TentangKasus } from './ringkasan';

export function KartuHarta({ ringkasan, sembunyiNominal }: { ringkasan: RingkasanHasil; sembunyiNominal: boolean }) {
  const { tirkah } = ringkasan;
  const uang = (nilai: bigint) => (sembunyiNominal ? 'Rp ••••••' : formatRupiah(nilai));
  const potongan = [
    { label: 'Pengurusan jenazah', nilai: tirkah.tajhiz, kelas: 'a-jenazah' },
    { label: 'Hutang', nilai: tirkah.hutang, kelas: 'a-hutang' },
    { label: 'Wasiat', nilai: tirkah.wasiatDipakai, kelas: 'a-wasiat' },
  ];
  const ruas = [{ label: 'Dibagi ke ahli waris', nilai: tirkah.bersih, kelas: 'a-dibagi' }, ...potongan].filter(bagian => bagian.nilai > 0n);
  const [ruasAktif, setRuasAktif] = useState<typeof ruas[number] | null>(null);
  const persenDari = (nilai: bigint) => tirkah.kotor === 0n ? '0%'
    : `${(Number(nilai * 10000n / tirkah.kotor) / 100).toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;

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
      <div className="alir" onMouseLeave={() => setRuasAktif(null)}>
        {ruas.map(bagian => (
          <span key={bagian.label} className={[bagian.kelas, ruasAktif === bagian ? 'aktif' : ''].filter(Boolean).join(' ')} style={{ flex: Number(bagian.nilai * 1000n / (tirkah.kotor || 1n)) || 1 }}
            tabIndex={0} role="button" aria-label={`${bagian.label}: ${persenDari(bagian.nilai)} dari harta, ${uang(bagian.nilai)}`}
            onMouseEnter={() => setRuasAktif(bagian)} onFocus={() => setRuasAktif(bagian)} onClick={() => setRuasAktif(bagian)} />
        ))}
      </div>
      {ruasAktif
        ? <p className="tip-alir" role="status"><b>{ruasAktif.label}</b><span>{persenDari(ruasAktif.nilai)} dari harta</span><span>{uang(ruasAktif.nilai)}</span></p>
        : <p className="caption-isian">Arahkan kursor atau ketuk bagian bar untuk melihat persen dan nominalnya.</p>}
    </Lipat>
  );
}

function FragmenPotongan({ label, nilai, sembunyi }: { label: string; nilai: bigint; sembunyi: boolean }) {
  return <><span>{label}</span><span className="nilai kurang">{sembunyi ? '−Rp ••••••' : `−${formatRupiah(nilai)}`}</span></>;
}

const JENIS_KASUS: Record<NonNullable<TentangKasus['kelas']>, { nama: string; arti: string }> = {
  adilah: { nama: "Normal ('adilah)", arti: 'Jumlah bagian pasti tidak melebihi harta; bila ada sisa, diambil ashabah.' },
  ailah: { nama: "'Aul", arti: 'Jumlah bagian pasti melebihi harta, jadi semua bagian dikurangi secara seimbang.' },
  raddA: { nama: 'Radd', arti: 'Ada sisa tanpa ashabah; sisa dikembalikan ke ahli waris bagian pasti.' },
  raddB: { nama: 'Radd (dengan suami/istri)', arti: 'Ada sisa tanpa ashabah; sisa dikembalikan ke ahli waris selain suami/istri.' },
};
const ARTI_NISBAH: Record<string, string> = {
  tamatsul: 'sama besar (tamatsul)', tadakhul: 'yang besar habis dibagi yang kecil (tadakhul)',
  tawafuq: 'punya faktor persekutuan (tawafuq)', tabayun: 'tidak punya faktor persekutuan (tabayun)', habis: 'sudah habis dibagi',
};

export function KartuTentang({ tentang }: { tentang: TentangKasus }) {
  const jenis = tentang.kelas ? JENIS_KASUS[tentang.kelas] : undefined;
  return (
    <Lipat judul="Tentang kasus ini" ringkas={jenis?.nama} className="urut-tentang">
      <div className="fakta-kasus">
        {jenis && <div><span className="lbl">Jenis kasus</span><b>{jenis.nama}</b><p>{jenis.arti}</p></div>}
        {tentang.ashl && (
          <div><span className="lbl">Asal masalah</span><b>{String(tentang.ashl.nilai)}</b>
            <p>{tentang.ashl.penyebut.length > 1
              ? `Dari penyebut ${tentang.ashl.penyebut.map(String).join(' dan ')}, yang ${ARTI_NISBAH[tentang.ashl.hubungan ?? ''] ?? tentang.ashl.hubungan}.`
              : 'Penyebut bagian yang ada.'}</p></div>
        )}
        {tentang.aul && <div><span className="lbl">'Aul</span><b>{`${tentang.aul.dari} → ${tentang.aul.menjadi}`}</b><p>Asal masalah dinaikkan supaya semua bagian muat.</p></div>}
        {tentang.tashih && (
          <div><span className="lbl">Tashih</span><b>{`${tentang.tashih.dari} → ${tentang.tashih.jadi}`}</b>
            <p>Bagian sekelompok ahli waris belum habis dibagi jumlah orangnya{tentang.tashih.hubungan ? `, ${ARTI_NISBAH[tentang.tashih.hubungan] ?? tentang.tashih.hubungan}` : ''}, jadi semua dikali {String(tentang.tashih.jadi / tentang.tashih.dari)}.</p></div>
        )}
        {tentang.jamiah !== undefined && <div><span className="lbl">Jami'ah</span><b>{String(tentang.jamiah)}</b><p>Mas'alah gabungan untuk semua mayit (munasakhat).</p></div>}
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
