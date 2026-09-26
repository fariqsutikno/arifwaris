// Mode Belajar sebelum jawaban dibuka: pelajar menebak bagian AKHIR tiap orang (pecahan dari seluruh harta yang
// dibagi, sesudah 'aul/radd/tashih bila ada; 0 bila tidak dapat), lalu Jawab. Tiga kelompok yang terpisah jelas:
// petunjuk, isian, dan hasil penilaian. Benar semua → jawaban terbuka (umpan balik benar ditampilkan kartu induk).

import { useState } from 'react';
import { Ikon } from '../ui/Ikon';
import { nilaiTebakan, type HasilTebakan } from './tebak';
import type { RingkasanHasil } from './ringkasan';
import { angka, t } from '../terjemah';

interface Props {
  ringkasan: RingkasanHasil;
  saatBenar: () => void;
  saatMencoba: () => void;
  saatLihatJawaban: () => void;
}

export function KartuTebak({ ringkasan, saatBenar, saatMencoba, saatLihatJawaban }: Props) {
  const [tebakan, setTebakan] = useState<Record<string, string>>({});
  const [hasil, setHasil] = useState<HasilTebakan | null>(null);
  const daftarOrang = [
    ...ringkasan.penerima.map(orang => ({ id: orang.id, nama: orang.nama, saham: orang.saham })),
    ...ringkasan.terhalang.map(orang => ({ id: orang.id, nama: orang.nama, saham: 0n })),
  ];
  const namaDari = (daftarId: string[]) => daftarId.map(id => daftarOrang.find(orang => orang.id === id)?.nama).join(', ');
  const jawab = () => {
    const nilai = nilaiTebakan(tebakan, daftarOrang, ringkasan.penyebut);
    setHasil(nilai);
    if (nilai.jenis !== 'dinilai') return;
    saatMencoba();
    if (nilai.idSalah.length === 0) saatBenar();
  };
  const ditandai = new Set(hasil?.jenis === 'dinilai' ? hasil.idSalah : hasil?.jenis === 'belumLengkap' ? hasil.idKosong : []);

  return (
    <form className="tebak" onSubmit={event => { event.preventDefault(); jawab(); }} aria-labelledby="judul-tebak">
      <div className="petunjuk-tebak">
        <h3 id="judul-tebak">{t('hitung.tebak_pembagian_akhirnya')}</h3>
        <p>{t('hitung.tulis_bagian_akhir_tiap_orang_dari')} <b>{t('hitung.seluruh_harta_yang_dibagi')}</b>{t('hitung.sesudah_aul_atau_radd_bila_ada')}</p>
        <p className="contoh-tebak">{t('umum.contoh')} <code>{angka('1/8')}</code> {t('hitung.atau')} <code>{angka('3/24')}</code>{t('hitung.yang_tidak_mendapat_bagian_isi')} <code>{angka('0')}</code>.</p>
      </div>

      <div className="isian-tebak">
        {daftarOrang.map(orang => (
          <label key={orang.id} className={ditandai.has(orang.id) ? 'baris-tebak keliru' : 'baris-tebak'}>
            <span>{orang.nama}</span>
            <input inputMode="numeric" autoComplete="off" placeholder="?" value={tebakan[orang.id] ?? ''} aria-invalid={ditandai.has(orang.id)}
              onChange={event => { setTebakan({ ...tebakan, [orang.id]: event.target.value }); setHasil(null); }} />
          </label>
        ))}
      </div>

      {hasil?.jenis === 'belumLengkap' && (
        <div className="hasil-tebak kurang" role="alert">
          <b>{t('hitung.masih_ada_yang_kosong')}</b>
          <p>{t('hitung.isi_dulu_nama', { nama: namaDari(hasil.idKosong) })}</p>
        </div>
      )}
      {hasil?.jenis === 'dinilai' && hasil.idSalah.length > 0 && (
        <div className="hasil-tebak salah" role="alert">
          <b><Ikon nama="salah" ukuran={18} /> {t('hitung.jawabanmu_belum_tepat')}</b>
          <p>{t('hitung.benar_dari_total_orang_sudah_benar', { benar: hasil.idBenar.length, total: daftarOrang.length, nama: namaDari(hasil.idSalah) })}</p>
        </div>
      )}

      <div className="aksi-tebak">
        <button type="submit" className="aw-btn aw-btn-primary aw-btn-sm">{t('umum.jawab')}</button>
        <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={saatLihatJawaban}>{t('hitung.lihat_jawaban')}</button>
      </div>
    </form>
  );
}

/** Ditampilkan di atas pembagian setelah tebakan benar semua, bersama confetti. */
export function UmpanBalikBenar() {
  return (
    <div className="hasil-tebak benar" role="status">
      <b><Ikon nama="benar" ukuran={20} /> {t('hitung.benar_semua')}</b>
      <p>{t('hitung.pembagianmu_sama_persis_dengan_hasil_perhitungan')}</p>
    </div>
  );
}
