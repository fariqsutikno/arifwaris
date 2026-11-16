// Pertanyaan pintu (spec kanvas 4): "Sejak {nama} wafat, apakah hartanya sudah dibagi?". Empat jawaban satu kolom tanpa keterangan dan tanpa pilihan bawaan,
// karena jawabannya menentukan apakah munasakhat perlu ditanyakan. Menerima jawaban sekarang; menyerahkan jawaban baru.

import type { Pintu } from '../../kasus';
import { t } from '../../terjemah';

interface Props { nama: string; nilai: Pintu | undefined; saatPilih: (pintu: Pintu) => void; tandai?: boolean }

export function PertanyaanPintu({ nama, nilai, saatPilih, tandai = false }: Props) {
  const pilihan: Array<[Pintu, string]> = [
    ['baru', t('hitung.kanvas.pintu_baru')],
    ['lama', t('hitung.kanvas.pintu_lama')],
    ['sudah', t('hitung.kanvas.pintu_sudah')],
    ['tidakTahu', t('hitung.kanvas.pintu_tidak_tahu')],
  ];
  return (
    <section className="penutup-babak" aria-labelledby="pintu-tanya">
      <h2 id="pintu-tanya" className="judul-bagian-kecil">{t('hitung.kanvas.pintu_tanya', { nama })}</h2>
      <div className={tandai ? 'daftar-pintu galat' : 'daftar-pintu'} role="radiogroup" aria-labelledby="pintu-tanya"
        {...(tandai ? { 'aria-invalid': true, 'aria-describedby': 'pintu-galat', tabIndex: -1 } : {})}>
        {pilihan.map(([nilaiPilihan, label]) => (
          <button key={nilaiPilihan} type="button" role="radio" aria-checked={nilai === nilaiPilihan} className="pilihan-pintu" onClick={() => saatPilih(nilaiPilihan)}>
            <i aria-hidden="true" /><span>{label}</span>
          </button>
        ))}
      </div>
      {tandai && <p className="pesan-galat" id="pintu-galat">{t('hitung.kanvas.pintu_belum_dijawab')}</p>}
      {nilai === 'sudah' && <p className="catatan-info">{t('hitung.kanvas.pintu_sudah_pesan')}</p>}
    </section>
  );
}
