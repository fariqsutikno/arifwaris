// Langkah 1: jenis kelamin almarhum sebagai pertanyaan utama (dua kartu berikon, tanpa pilihan bawaan);
// nama hanya isian kecil opsional.

import { bolehUbahJenisKelamin } from '@waris/engine';
import type { Kasus } from '../../kasus';

interface Props { kasus: Kasus | null; saatPilih: (jenisKelamin: 'L' | 'P') => void; saatUbahNama: (nama: string) => void }

export function LangkahPewaris({ kasus, saatPilih, saatUbahNama }: Props) {
  const pewaris = kasus?.graf.orang[kasus.graf.idPewaris];
  const pilihan: Array<['L' | 'P', string]> = [['L', 'Laki-laki'], ['P', 'Perempuan']];
  // Sudah ada pasangan/anak yang tercatat: mengganti jenis kelamin akan merusak hubungan itu, jadi dikunci.
  const terkunci = !!kasus && !bolehUbahJenisKelamin(kasus.graf, kasus.graf.idPewaris);
  return (
    <>
      <div className="kartu-pilihan-deret" role="radiogroup" aria-labelledby="pertanyaan-utama">
        {pilihan.map(([jenisKelamin, label]) => (
          <button key={jenisKelamin} type="button" role="radio" aria-checked={pewaris?.jenisKelamin === jenisKelamin}
            aria-disabled={terkunci && pewaris?.jenisKelamin !== jenisKelamin}
            className="kartu-pilihan" onClick={() => saatPilih(jenisKelamin)}>
            <IkonGender jenisKelamin={jenisKelamin} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {terkunci && <p className="caption-langkah">Sudah ada pasangan atau anak yang diisi. Kurangi dulu di langkah Ahli waris kalau mau mengganti.</p>}
      {kasus && (
        <label className="isian isian-kecil">Nama almarhum <span className="opsional">(boleh dikosongkan)</span>
          <input value={pewaris?.nama ?? ''} onChange={event => saatUbahNama(event.target.value)} />
        </label>
      )}
    </>
  );
}

function IkonGender({ jenisKelamin }: { jenisKelamin: 'L' | 'P' }) {
  return (
    <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
      {jenisKelamin === 'L'
        ? <><circle cx="20" cy="28" r="12" /><path d="M29 19l11-11M30 8h10v10" /></>
        : <><circle cx="24" cy="18" r="12" /><path d="M24 30v14M17 38h14" /></>}
    </svg>
  );
}
