// Bagian pemeriksa paket soal yang butuh engine (docs/soal-kit): token topik harus sah, dan kasus soal (kode bank atau
// pewaris + ahli waris) harus menghasilkan topik yang dinyatakan serta saham yang ditulis di `harapan`.
// Soal keluarga lanjutan (munasakhat, haml, ...) baru bisa dicek labelnya; angkanya belum (spec bank soal §8, G6).
import type { ButirPaket, KasusPaket, PaketSoal, Temuan } from '@waris/content';
import { adalahTokenLabel } from './bank/labelSoal.js';
import { buatKodeSoal, uraiKodeSoal, periksaKasusBiasa, type KasusBiasa } from './bank/kodeSoal.js';
import { adalahLanjutan } from './bank/kodeLanjutan.js';
import { soalDariKode } from './bank/soalDariKode.js';
import { selisihHarapan } from './periksaAngkaMateri.js';

/** Topik tanpa token bank: pokok bahasan yang tidak lahir dari jejak engine (tirkah, penghalang waris, ...). Tidak dicocokkan engine. */
const POLA_TOPIK_KONSEP = /^konsep:[a-z0-9-]+$/;

type KasusTerurai = { ok: true; biasa?: { pewaris: 'L' | 'P'; ahliWaris: string[] }; kode: string } | { ok: false; pesan: string };

export function periksaAngkaPaketSoal(paket: PaketSoal): Temuan[] {
  return paket.butir.flatMap(butir => periksaButir(butir));
}

function periksaButir({ soal, baris, topik, kasus }: ButirPaket): Temuan[] {
  const temuan: Temuan[] = [];
  const galat = (pesan: string) => temuan.push({ tingkat: 'galat', baris, pesan: `soal ${soal.kode}: ${pesan}` });
  for (const token of topik) if (!adalahTokenLabel(token) && !POLA_TOPIK_KONSEP.test(token)) galat(`topik "${token}" bukan token label bank soal atau konsep:<kata>`);
  if (!kasus) return temuan;

  const terurai = uraiKasus(kasus);
  if (!terurai.ok) { galat(terurai.pesan); return temuan; }
  const bank = soalDariKode(terurai.kode);
  if (!bank.ok) { galat(`kasus tidak bisa dijadikan soal bank (${bank.galat})`); return temuan; }
  for (const token of topik) if (adalahTokenLabel(token) && !bank.label.includes(token)) galat(`topik "${token}" tidak dihasilkan engine untuk kasus ini. Label engine: ${bank.label.join(', ')}`);

  if (!kasus.harapan) return temuan;
  if (!terurai.biasa) galat('harapan baru bisa dicocokkan untuk kasus satu mayit; hapus "harapan" untuk kode bank lanjutan');
  else {
    const selisih = selisihHarapan(terurai.biasa.pewaris, terurai.biasa.ahliWaris, kasus.harapan);
    if (selisih) galat(selisih);
  }
  return temuan;
}

function uraiKasus(kasus: KasusPaket): KasusTerurai {
  if (kasus.kodeBank) {
    const urai = uraiKodeSoal(kasus.kodeBank);
    if (!urai.ok) return { ok: false, pesan: `kode-bank ${kasus.kodeBank} tidak terbaca (${urai.galat})` };
    return { ok: true, kode: kasus.kodeBank, ...(adalahLanjutan(urai.kasus) ? {} : { biasa: { pewaris: urai.kasus.pewaris, ahliWaris: daftarDariJumlah(urai.kasus) } }) };
  }
  const jumlah: KasusBiasa = { pewaris: kasus.pewaris!, ahliWaris: {} };
  for (const kunci of kasus.ahliWaris!) jumlah.ahliWaris[kunci as keyof KasusBiasa['ahliWaris']] = (jumlah.ahliWaris[kunci as keyof KasusBiasa['ahliWaris']] ?? 0) + 1;
  const tidakSah = periksaKasusBiasa(jumlah);
  if (tidakSah) return { ok: false, pesan: `susunan ahli waris tidak sah untuk kasus soal (${tidakSah})` };
  return { ok: true, kode: buatKodeSoal(jumlah), biasa: { pewaris: kasus.pewaris!, ahliWaris: kasus.ahliWaris! } };
}

const daftarDariJumlah = (kasus: KasusBiasa) => Object.entries(kasus.ahliWaris).flatMap(([kunci, jumlah]) => Array.from({ length: jumlah }, () => kunci));
