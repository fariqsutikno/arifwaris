// Penilaian tabel latihan, dua lapis (spec 1.2):
//   nilaiSemuaKolom : murni, menilai SEMUA kolom per sel (benar + benarEcf), tanpa kebijakan berhenti.
//   putusanLatihan  : kebijakan B6 — berhenti di kolom pertama yang belum lengkap/salah (HasilNilai).
//   putusanUjian    : kebijakan Ujian — belumLengkap dihitung salah, semua kolom ditandai.
// Murni, bigint, tanpa bahasa.

import { barisDinilai, bacaBulat, isiSel } from './isian.js';
import { terapkanEcf } from './ecf.js';
import type { HasilKolom, HasilNilai, HasilSel, IsianTabel, Jangkar, KolomSoal, TabelSoal } from './model.js';

export const nilaiTabel = (tabel: TabelSoal, isian: IsianTabel, jangkar: Jangkar | null): HasilNilai =>
  putusanLatihan(nilaiSemuaKolom(tabel, isian, jangkar));

export function nilaiSemuaKolom(tabel: TabelSoal, isian: IsianTabel, jangkar: Jangkar | null): HasilKolom[] {
  const kolom = tabel.kolom.filter(kolom => !kolom.terkunci).map(kolom => nilaiKolom(tabel, kolom, isian, jangkar));
  return terapkanEcf(tabel, isian, jangkar, kolom);
}

/** B6 butir 1–5 dan 7: kolom pertama yang tidak benar menentukan putusan. */
export function putusanLatihan(kolom: HasilKolom[]): HasilNilai {
  const bentukTerkecil: Extract<HasilNilai, { jenis: 'benar' }>['bentukTerkecil'] = [];
  for (const hasil of kolom) {
    const { idKolom, idJudul } = hasil;
    const barisBermasalah = (saring: (sel: HasilSel) => boolean) => hasil.sel.filter(sel => sel.idBaris !== 'kepala' && saring(sel)).map(sel => sel.idBaris);
    const kepala = hasil.sel.find(sel => sel.idBaris === 'kepala');
    if (hasil.status === 'belumLengkap') {
      return { jenis: 'belumLengkap', idKolom, idJudul, kepalaKosong: !!kepala?.kosong, idBarisKosong: barisBermasalah(sel => sel.kosong) };
    }
    if (hasil.status === 'salah') {
      return { jenis: 'salah', idKolom, idJudul, kepalaSalah: !!kepala && !kepala.benar, idBarisSalah: barisBermasalah(sel => !sel.benar) };
    }
    if (hasil.bentuk) bentukTerkecil.push({ idKolom, idJudul, diisi: BigInt(hasil.bentuk.diisi), terkecil: BigInt(hasil.bentuk.terkecil) });
  }
  return { jenis: 'benar', bentukTerkecil };
}

export function putusanUjian(kolom: HasilKolom[]): { benar: number; total: number; kolom: HasilKolom[] } {
  return { benar: kolom.filter(hasil => hasil.status === 'benar').length, total: kolom.length, kolom };
}

function nilaiKolom(tabel: TabelSoal, kolom: KolomSoal, isian: IsianTabel, jangkar: Jangkar | null): HasilKolom {
  const { id: idKolom, idJudul } = kolom;
  const dinilai = barisDinilai(tabel, kolom);
  const bentukSel = (benar: boolean, kosong: boolean) => ({ benar, benarEcf: benar, kosong });

  if (kolom.jenis === 'pilih') {
    const sel = dinilai.map((baris): HasilSel => {
      const diisi = isiSel(baris, kolom, isian, jangkar);
      return { idBaris: baris.id, ...bentukSel(diisi === baris.kunci[idKolom], diisi === undefined) };
    });
    return { idKolom, idJudul, status: statusDari(sel), sel };
  }

  // Kolom bulat berkepala: sebanding diterima, isi × kunci kepala = kunci sel × isian kepala (B6 butir 4).
  const terkecil = kolom.kepala!;
  const kepala = bacaBulat(isian.kepala[idKolom]);
  const adaJangkar = jangkar?.idKolom === idKolom;
  const kepalaBenar = kepala !== undefined && kepala !== 0n && kepala % terkecil === 0n && !(adaJangkar && kepala !== terkecil);
  const sel = dinilai.map((baris): HasilSel => {
    const diisi = isiSel(baris, kolom, isian, jangkar);
    const nilai = bacaBulat(diisi);
    const benar = kepala !== undefined && nilai !== undefined && nilai * terkecil === BigInt(baris.kunci[idKolom]!) * kepala;
    return { idBaris: baris.id, ...bentukSel(benar, diisi === undefined) };
  });
  sel.push({ idBaris: 'kepala', ...bentukSel(kepalaBenar, kepala === undefined) });
  const status = statusDari(sel);
  const bentuk = status === 'benar' && kepala !== terkecil ? { bentuk: { diisi: String(kepala), terkecil: String(terkecil) } } : {};
  return { idKolom, idJudul, status, sel, ...bentuk };
}

const statusDari = (sel: HasilSel[]): HasilKolom['status'] =>
  sel.some(hasil => hasil.kosong) ? 'belumLengkap' : sel.every(hasil => hasil.benar) ? 'benar' : 'salah';
