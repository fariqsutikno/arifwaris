// Pita bagian: satu garis selebar kartu, seluruh harta sesuai skala, tiap ruas milik satu orang (warna avatarnya).
// Menyambungkan pohon dan daftar: menunjuk ruas menyorot orangnya di mana-mana (sorot.tsx); mengetuk membuka penjelasannya.
// Sisa untuk pasangan (keluar dari ahli waris) berupa ruas bergaris. Dekoratif bagi pembaca layar: daftar di bawahnya memuat data yang sama.

import { warnaAvatar } from './AvatarOrang';
import type { RingkasanHasil } from './ringkasan';
import { useAtributOrang } from './sorot';

const persenLebar = (saham: bigint, penyebut: bigint) => `${Number(saham * 10000n / penyebut) / 100}%`;

export function PitaBagian({ ringkasan, saatPilihOrang }: { ringkasan: RingkasanHasil; saatPilihOrang: (id: string) => void }) {
  const atribut = useAtributOrang();
  return (
    <div className="pita-hasil" aria-hidden="true">
      {ringkasan.penerima.map(orang => {
        const { className, ...pemicu } = atribut(orang.id);
        return <span key={orang.id} {...pemicu} className={['ruas', className].filter(Boolean).join(' ')} title={orang.nama}
          style={{ width: persenLebar(orang.saham, ringkasan.penyebut), background: warnaAvatar(orang.nama) }} onClick={() => saatPilihOrang(orang.id)} />;
      })}
      {ringkasan.daftarSisaKeluar.map(sisa => (
        <span key={sisa.id} className="ruas sisa" title={sisa.judul} style={{ width: persenLebar(sisa.saham, ringkasan.penyebut) }} />
      ))}
    </div>
  );
}
