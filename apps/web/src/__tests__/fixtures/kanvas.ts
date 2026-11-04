// Graf contoh kanvas silsilah (spec 11.1), dibangun lewat checklist seperti isian pengguna.
// Angkanya cocok dengan packages/engine/src/__tests__/kanvasSilsilah.test.ts.
import type { IdOrang, KunciAhliWaris, Orang } from '@waris/engine';
import { tambahAhliWaris, ubahOrang } from '../../checklist';
import { kasusBaru, type Kasus } from '../../kasus';

export function tambah(kasus: Kasus, idMayit: IdOrang, kunci: KunciAhliWaris, ubah: Partial<Orang> = {}): { kasus: Kasus; id: IdOrang } {
  const graf = tambahAhliWaris(kasus.graf, idMayit, kunci);
  const id = Object.keys(graf.orang).find(x => !kasus.graf.orang[x] && !graf.orang[x]!.penghubung)!;
  return { kasus: { ...kasus, graf: ubahOrang(graf, id, ubah) }, id };
}

/** Mbah Karto: istri Sumi, anak Slamet (wafat lebih dulu), Budi, Rina; ayah wafat; Budi beristri Dewi, anak Andi & Sari. Urutan wafat: Sumi, Budi. */
export function keluargaKarto() {
  let k = kasusBaru('L');
  let r = tambah(k, 'PEWARIS', 'ISTRI', { nama: 'Mbah Sumi' }); k = r.kasus; const sumi = r.id;
  r = tambah(k, 'PEWARIS', 'ANAK_LK', { nama: 'Slamet', statusHidup: 'wafat', idIbu: sumi }); k = r.kasus; const slamet = r.id;
  r = tambah(k, 'PEWARIS', 'ANAK_LK', { nama: 'Budi', idIbu: sumi }); k = r.kasus; const budi = r.id;
  r = tambah(k, 'PEWARIS', 'ANAK_PR', { nama: 'Rina', idIbu: sumi }); k = r.kasus; const rina = r.id;
  r = tambah(k, 'PEWARIS', 'AYAH', { statusHidup: 'wafat' }); k = r.kasus; const ayah = r.id;
  r = tambah(k, budi, 'ISTRI', { nama: 'Dewi' }); k = r.kasus; const dewi = r.id;
  r = tambah(k, budi, 'ANAK_LK', { nama: 'Andi', idIbu: dewi }); k = r.kasus; const andi = r.id;
  r = tambah(k, budi, 'ANAK_PR', { nama: 'Sari', idIbu: dewi }); k = r.kasus; const sari = r.id;
  return { kasus: { ...k, urutanWafat: [sumi, budi] }, sumi, slamet, budi, rina, ayah, dewi, andi, sari };
}

/** Budi tak menikah; ayah wafat lebih dulu; ibu; saudara kandung Andi dan Rina; opsional kakek hidup. */
export function keluargaBudi(kakekHidup = false) {
  let k = { ...kasusBaru('L'), graf: ubahOrang(kasusBaru('L').graf, 'PEWARIS', { nama: 'Budi' }) };
  let r = tambah(k, 'PEWARIS', 'AYAH', { statusHidup: 'wafat' }); k = r.kasus; const ayah = r.id;
  r = tambah(k, 'PEWARIS', 'IBU'); k = r.kasus; const ibu = r.id;
  r = tambah(k, 'PEWARIS', 'SAUDARA_KANDUNG', { nama: 'Andi' }); k = r.kasus; const andi = r.id;
  r = tambah(k, 'PEWARIS', 'SAUDARI_KANDUNG', { nama: 'Rina' }); k = r.kasus; const rina = r.id;
  let kakek: IdOrang | undefined;
  if (kakekHidup) { r = tambah(k, 'PEWARIS', 'KAKEK'); k = r.kasus; kakek = r.id; }
  return { kasus: k, ayah, ibu, andi, rina, ...(kakek ? { kakek } : {}) };
}
