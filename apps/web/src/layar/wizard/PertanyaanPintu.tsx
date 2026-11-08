// Pertanyaan pintu (spec kanvas 4): "Sejak {nama} wafat, apakah hartanya sudah dibagi?". Empat jawaban tanpa pilihan bawaan,
// karena jawabannya menentukan apakah munasakhat perlu ditanyakan. Menerima jawaban sekarang; menyerahkan jawaban baru.

import type { Pintu } from '../../kasus';
import { t } from '../../terjemah';

interface Props { nama: string; nilai: Pintu | undefined; saatPilih: (pintu: Pintu) => void }

export function PertanyaanPintu({ nama, nilai, saatPilih }: Props) {
  const pilihan: Array<[Pintu, string, string]> = [
    ['baru', t('hitung.kanvas.pintu_baru'), t('hitung.kanvas.pintu_baru_ket')],
    ['lama', t('hitung.kanvas.pintu_lama'), t('hitung.kanvas.pintu_lama_ket')],
    ['sudah', t('hitung.kanvas.pintu_sudah'), t('hitung.kanvas.pintu_sudah_ket')],
    ['tidakTahu', t('hitung.kanvas.pintu_tidak_tahu'), t('hitung.kanvas.pintu_tidak_tahu_ket')],
  ];
  return (
    <section className="penutup-babak" aria-labelledby="pintu-tanya">
      <h2 id="pintu-tanya" className="judul-bagian-kecil">{t('hitung.kanvas.pintu_tanya', { nama })}</h2>
      <div className="kartu-pilihan-deret" role="radiogroup" aria-labelledby="pintu-tanya">
        {pilihan.map(([nilaiPilihan, label, keterangan]) => (
          <button key={nilaiPilihan} type="button" role="radio" aria-checked={nilai === nilaiPilihan} className="kartu-pilihan kecil" onClick={() => saatPilih(nilaiPilihan)}>
            <span>{label}</span><small>{keterangan}</small>
          </button>
        ))}
      </div>
      {nilai === 'sudah' && <p className="catatan-info">{t('hitung.kanvas.pintu_sudah_pesan')}</p>}
    </section>
  );
}
