// Bagian "Kamu" (spec kanvas 5.8): "Kamu ada di keluarga ini?" Pilihan orang yang masih hidup + "Bukan, saya mengisi untuk
// orang lain". Tanpa jawaban bawaan; keduanya jawaban sah, jadi bagian boleh dilewati. Menyimpan `saya` lewat jawabKamu.

import { useId } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { peranDariMayit } from '../../checklist';
import { calonKamu, jawabKamu } from '../../isianBagian';
import { namaSingkat } from '../../keadaanOrang';
import type { Bagian } from '../../kelompok';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; bagian: Bagian; ubah: (f: (k: Kasus) => Kasus) => void }

export function BagianKamu({ kasus, ubah }: Props) {
  const idLabel = useId();
  const pilihan: Array<[string | null, string]> = [
    ...calonKamu(kasus).map((id): [string, string] => [id, labelSaya(kasus, id)]),
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

/** "Saya istri almarhum"; nama atau nomor disebut hanya bila menambah kejelasan ("Saya anak almarhum (Anak laki-laki 1)"). */
function labelSaya(kasus: Kasus, id: IdOrang): string {
  const nama = namaSingkat(kasus, id);
  const peran = peranDariMayit(kasus.graf, kasus.graf.idPewaris, id);
  if (!peran) return t('hitung.kanvas.ringkas_kamu', { nama });
  const almarhum = namaSingkat(kasus, kasus.graf.idPewaris);
  return nama.toLowerCase() === peran.toLowerCase()
    ? t('hitung.kanvas.kamu_saya', { peran: peran.toLowerCase(), almarhum })
    : t('hitung.kanvas.kamu_saya_nama', { peran: peran.toLowerCase(), almarhum, nama });
}
