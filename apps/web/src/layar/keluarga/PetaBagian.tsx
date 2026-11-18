// Peta bagian kanvas keluarga (spec kanvas 5.5): batang kemajuan, "{n} dari {m} bagian selesai", dan deret nama bagian
// sebagai teks biasa (bukan pil, tidak bisa diklik). Menerima kasus dan bagian aktif; tidak memegang state.

import type { Kasus } from '../../kasus';
import { bagianLengkap, type Bagian } from '../../kelompok';
import { judulPendek } from '../../ringkasanBagian';
import { namaSingkat } from '../../keadaanOrang';
import { t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';

interface Props { kasus: Kasus; daftar: Bagian[]; aktifId: string }

export function PetaBagian({ kasus, daftar, aktifId }: Props) {
  const selesai = daftar.filter(bagian => bagianLengkap(kasus, bagian));
  const kelasRuas = (bagian: Bagian) => (selesai.includes(bagian) ? 'selesai' : bagian.id === aktifId ? 'aktif' : '');
  return (
    <div className="peta-bagian" aria-label={t('hitung.kanvas.peta_label')}>
      <div className="atas">
        <span><b>{t('hitung.kanvas.peta_selesai', { n: selesai.length, m: daftar.length })}</b></span>
        <span>{t('hitung.kanvas.peta_bertambah', { nama: namaSingkat(kasus, kasus.graf.idPewaris) })}</span>
      </div>
      <div className="batang" aria-hidden="true">{daftar.map(bagian => <i key={bagian.id} className={kelasRuas(bagian)} />)}</div>
      <ol className="langkah-bagian">
        {daftar.map(bagian => (
          <li key={bagian.id} className={`${selesai.includes(bagian) ? 'selesai' : ''} ${bagian.id === aktifId ? 'aktif' : ''}`.trim()}
            {...(bagian.id === aktifId ? { 'aria-current': 'step' as const } : {})}>
            {selesai.includes(bagian) && <Ikon nama="benar" ukuran={14} />}{judulPendek(kasus, bagian)}
          </li>
        ))}
      </ol>
    </div>
  );
}
