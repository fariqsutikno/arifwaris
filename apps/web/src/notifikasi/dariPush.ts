// Mengubah kabar yang sudah dikirim server (log kirim_push) menjadi notifikasi kotak masuk lokal. Id sengaja sama dengan yang dipakai
// pemasok lokal (SumberNotifikasi): kabar yang sama dari dua jalur dicatat sekali saja.

import type { KabarPush } from '@waris/data';
import type { NotifikasiBaru } from './gudang';

const PRIORITAS_STREAK_TERANCAM = 70;
const PRIORITAS_PERINGKAT_PEKAN = 50;

export function kabarKeNotifikasi(kabar: KabarPush): NotifikasiBaru {
  const tanggal = kabar.kunci.split(':')[1] ?? kabar.kunci;
  const dasar = { judul: kabar.judul, isi: kabar.isi, ...(kabar.tautan ? { tautan: kabar.tautan } : {}) };
  return kabar.jenis === 'streak_terancam'
    ? { ...dasar, id: `streak-ingat-${tanggal}`, jenis: 'streak', prioritas: PRIORITAS_STREAK_TERANCAM, mendesak: kabar.mendesak }
    : { ...dasar, id: `peringkat-pekan-${tanggal}`, jenis: 'peringkat', prioritas: PRIORITAS_PERINGKAT_PEKAN, mendesak: kabar.mendesak };
}
