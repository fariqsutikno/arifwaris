// Pilihan "dari siapa" untuk kerabat bertingkat (cucu, keponakan, sepupu). Menerima nilai terpilih; menyerahkan id induk
// atau INDUK_BARU_WAFAT. Dipakai bersama alur Babak (LangkahAhliWaris) dan kanvas keluarga.

import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import { daftarInduk, INDUK_BARU_WAFAT, jenisDari, labelOrangChecklist } from '../../checklist';
import { LABEL_SEHARI, sebutAlmarhum } from '../../konten/ahliWaris';
import { t } from '../../terjemah';

interface Props { kunci: KunciAhliWaris; graf: GrafKeluarga; idMayit: IdOrang; nilai: string; saatUbah: (idInduk: string) => void }

export function PilihInduk({ kunci, graf, idMayit, nilai, saatUbah }: Props) {
  const jenis = jenisDari(kunci);
  if (!jenis?.kunciInduk) return null;
  const label = sebutAlmarhum(LABEL_SEHARI[kunci] ?? jenis.label, graf.orang[idMayit]!.jenisKelamin);
  const labelInduk = LABEL_SEHARI[jenis.kunciInduk]!.toLowerCase();
  return (
    <select aria-label={t('hitung.label_dari_siapa', { label })} value={nilai} onChange={event => saatUbah(event.target.value)}>
      {daftarInduk(graf, idMayit, jenis.kunciInduk).map(id => (
        <option key={id} value={id}>{t('hitung.dari_nama_2', { nama: labelOrangChecklist(graf, idMayit, id, jenis.kunciInduk!) })}</option>
      ))}
      <option value={INDUK_BARU_WAFAT}>dari {labelInduk} lain (sudah wafat)</option>
    </select>
  );
}
