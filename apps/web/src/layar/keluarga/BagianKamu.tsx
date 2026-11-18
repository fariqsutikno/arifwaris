// Bagian "Kamu" (spec kanvas 5.8): "Kamu ada di keluarga ini?" Pilihan orang yang masih hidup + "Bukan, saya mengisi untuk
// orang lain". Tanpa jawaban bawaan; keduanya jawaban sah, jadi bagian boleh dilewati. Menyimpan `saya` lewat jawabKamu.

import { useId } from 'react';
import type { Kasus } from '../../kasus';
import { calonKamu, jawabKamu } from '../../isianBagian';
import { namaSingkat } from '../../keadaanOrang';
import type { Bagian } from '../../kelompok';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; bagian: Bagian; ubah: (f: (k: Kasus) => Kasus) => void }

export function BagianKamu({ kasus, ubah }: Props) {
  const idLabel = useId();
  const pilihan: Array<[string | null, string]> = [
    ...calonKamu(kasus).map((id): [string, string] => [id, t('hitung.kanvas.kamu_saya', { nama: namaSingkat(kasus, id) })]),
    [null, t('hitung.kanvas.kamu_orang_lain')],
  ];
  return (
    <div className="pilihan-urutan" role="radiogroup" aria-labelledby="judul-bagian-aktif" id={idLabel}>
      {pilihan.map(([id, label]) => (
        <button key={id ?? 'orang-lain'} type="button" role="radio" aria-checked={kasus.saya === id} className="opsi-urutan"
          onClick={() => ubah(k => jawabKamu(k, id))}>{label}</button>
      ))}
    </div>
  );
}
