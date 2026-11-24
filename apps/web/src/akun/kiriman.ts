// Terjemahan KejadianPercobaan lokal ↔ kiriman/baris server. Ke server hanya isian dan klik (spec 2.6): hasilKolom,
// benarSemua, jenis soal, versi, dan konteks sengaja tidak ikut karena server menentukannya sendiri.

import type { KejadianPercobaan } from '@waris/latihan';
import type { BarisPercobaanServer, KirimanPercobaan } from '@waris/data';

export const keKiriman = (kejadian: KejadianPercobaan): KirimanPercobaan => ({
  id: kejadian.id, idSesiSoal: kejadian.idSesiSoal, soalId: kejadian.soalId, revisiSoal: kejadian.revisiSoal, mode: kejadian.mode,
  aksi: kejadian.aksi, isian: kejadian.isian, jangkar: kejadian.jangkar, ...(kejadian.gharqa ? { gharqa: kejadian.gharqa } : {}), ...(kejadian.bantuan ? { bantuan: kejadian.bantuan } : {}), dimulaiPada: kejadian.dimulaiPada,
});

const keCamel = (teks: string) => teks.replace(/_([a-z])/g, (_, huruf: string) => huruf.toUpperCase());

/** Baris server → kejadian lengkap (hasil dan versi milik server), untuk digabung dengan kejadian lokal per id. */
export const dariBarisServer = (baris: BarisPercobaanServer): KejadianPercobaan => ({
  id: baris.id, idSesiSoal: baris.idSesiSoal, soalId: baris.soalId, revisiSoal: baris.revisiSoal,
  jenisSoal: keCamel(baris.jenisSoal) as KejadianPercobaan['jenisSoal'], mode: baris.mode, konteks: { jenis: 'mandiri' },
  aksi: keCamel(baris.aksi) as KejadianPercobaan['aksi'],
  ...(baris.jenisSoal === 'gharqa' && baris.isian ? { isian: null, gharqa: baris.isian as NonNullable<KejadianPercobaan['gharqa']> } : { isian: baris.isian as KejadianPercobaan['isian'] }),
  jangkar: baris.jangkar as KejadianPercobaan['jangkar'], hasilKolom: baris.hasilKolom as KejadianPercobaan['hasilKolom'],
  benarSemua: baris.benarSemua ?? false, dimulaiPada: baris.dimulaiPadaKlien ?? baris.diterimaPada, diterimaPada: baris.diterimaPada,
  versi: baris.versi as KejadianPercobaan['versi'],
});
