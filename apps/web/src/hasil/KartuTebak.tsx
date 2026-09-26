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
        <h3 id="judul-tebak">{t('Tebak pembagian akhirnya')}</h3>
        <p>{t('Tulis bagian akhir tiap orang dari')} <b>{t('seluruh harta yang dibagi')}</b>{t(", sesudah 'aul atau radd bila ada. Bukan bagian fardh awalnya.")}</p>
        <p className="contoh-tebak">{t('Contoh')} <code>{angka('1/8')}</code> {t('atau')} <code>{angka('3/24')}</code>{t('. Yang tidak mendapat bagian, isi')} <code>{angka('0')}</code>.</p>
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
          <b>{t('Masih ada yang kosong')}</b>
          <p>{t('Isi dulu: {nama}.', { nama: namaDari(hasil.idKosong) })}</p>
        </div>
      )}
      {hasil?.jenis === 'dinilai' && hasil.idSalah.length > 0 && (
        <div className="hasil-tebak salah" role="alert">
          <b><Ikon nama="salah" ukuran={18} /> {t('Jawabanmu belum tepat')}</b>
          <p>{t('{benar} dari {total} orang sudah benar. Perbaiki: {nama}.', { benar: hasil.idBenar.length, total: daftarOrang.length, nama: namaDari(hasil.idSalah) })}</p>
        </div>
      )}

      <div className="aksi-tebak">
        <button type="submit" className="aw-btn aw-btn-primary aw-btn-sm">{t('Jawab')}</button>
        <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={saatLihatJawaban}>{t('Lihat jawaban')}</button>
      </div>
    </form>
  );
}

/** Ditampilkan di atas pembagian setelah tebakan benar semua, bersama confetti. */
export function UmpanBalikBenar() {
  return (
    <div className="hasil-tebak benar" role="status">
      <b><Ikon nama="benar" ukuran={20} /> {t('Benar semua!')}</b>
      <p>{t('Pembagianmu sama persis dengan hasil perhitungan. Cocokkan caranya di langkah perhitungan.')}</p>
    </div>
  );
}
