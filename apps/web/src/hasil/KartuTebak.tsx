// Mode Belajar sebelum jawaban dibuka: pelajar menebak bagian tiap orang (pecahan dari harta, 0 bila tidak dapat),
// lalu Jawab. Benar semua → jawaban terbuka dan dicatat sudah dikerjakan. Salah → ditolak, boleh mencoba lagi
// atau melihat jawaban. Yang dinilai hanya bagian akhir; langkah perhitungan tetap bisa diikuti di bawah.

import { useState } from 'react';
import { nilaiTebakan, type HasilTebakan } from './tebak';
import type { RingkasanHasil } from './ringkasan';

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
  const jawab = () => {
    const nilai = nilaiTebakan(tebakan, daftarOrang, ringkasan.penyebut);
    setHasil(nilai);
    if (nilai.jenis !== 'dinilai') return;
    saatMencoba();
    if (nilai.idSalah.length === 0) saatBenar();
  };
  const salah = hasil?.jenis === 'dinilai' ? new Set(hasil.idSalah) : new Set<string>();
  const kosong = hasil?.jenis === 'belumLengkap' ? new Set(hasil.idKosong) : new Set<string>();

  return (
    <form className="tebak" onSubmit={event => { event.preventDefault(); jawab(); }}>
      <p><b>Mode belajar.</b> Tebak bagian tiap orang dari seluruh harta, misalnya <code>1/8</code>. Yang tidak dapat, isi <code>0</code>.</p>
      <div className="isian-tebak">
        {daftarOrang.map(orang => (
          <label key={orang.id} className={salah.has(orang.id) || kosong.has(orang.id) ? 'baris-tebak keliru' : 'baris-tebak'}>
            <span>{orang.nama}</span>
            <input inputMode="numeric" autoComplete="off" placeholder="1/8" value={tebakan[orang.id] ?? ''}
              aria-invalid={salah.has(orang.id) || kosong.has(orang.id)}
              onChange={event => { setTebakan({ ...tebakan, [orang.id]: event.target.value }); setHasil(null); }} />
          </label>
        ))}
      </div>
      {hasil?.jenis === 'belumLengkap' && <p role="alert">Isi semua dengan pecahan (mis. 1/8) atau 0.</p>}
      {hasil?.jenis === 'dinilai' && hasil.idSalah.length > 0 && (
        <p role="alert"><b>Jawaban kamu masih salah.</b> {hasil.idBenar.length} dari {daftarOrang.length} sudah tepat. Coba lagi, atau lihat jawabannya.</p>
      )}
      <div className="chip-deret">
        <button type="submit" className="aw-btn aw-btn-primary aw-btn-sm">Jawab</button>
        <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={saatLihatJawaban}>Lihat jawaban</button>
      </div>
    </form>
  );
}
