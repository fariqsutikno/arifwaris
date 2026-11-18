// Isian tahun (kejadian dalam keluarga) yang boleh kosong. Menerima nilai TanggalKira; menyerahkan TanggalKira baru
// atau undefined bila dikosongkan. Hanya angka yang diterima; tahun tidak pernah dikirim ke engine (spec kanvas 9.1).
// ponytail: kiraKira selalu false dari isian ini; penanda "kira-kira" menunggu panel Periksa.

import { useState } from 'react';
import type { TanggalKira } from '../../kasus';

const PANJANG_TAHUN = 4;

interface Props { label: string; petunjuk?: string; contoh?: string; fokus?: boolean; nilai: TanggalKira | undefined; saatUbah: (tanggal: TanggalKira | undefined) => void }

export function IsianTahun({ label, petunjuk, contoh, fokus, nilai, saatUbah }: Props) {
  const [teks, setTeks] = useState(nilai ? String(nilai.tahun) : '');
  const ubahTeks = (mentah: string) => {
    const angka = mentah.replace(/\D/g, '').slice(0, PANJANG_TAHUN);
    setTeks(angka);
    saatUbah(angka && Number(angka) >= 1 ? { tahun: Number(angka), kiraKira: false } : undefined);
  };
  return (
    <label className="isian isian-tahun">
      <span>{label}{petunjuk && <> <span className="opsional">{petunjuk}</span></>}</span>
      <input autoFocus={fokus} inputMode="numeric" autoComplete="off" value={teks} {...(contoh ? { placeholder: contoh } : {})} onChange={event => ubahTeks(event.target.value)} />
    </label>
  );
}
