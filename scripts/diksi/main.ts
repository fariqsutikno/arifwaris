// scripts/diksi/main.ts
// CLI: `peta` → scripts/diksi/peta.json dari apps/web/src + kamus Arab; `tulis <awalan>` → tulis ulang berkas web
// yang jalurnya diawali <awalan> (relatif ke apps/web/src) memakai peta.json. Dijalankan per kelompok halaman.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KAMUS_UMUM } from '../../apps/web/src/konten/kamus/umum';
import { KAMUS_BERANDA } from '../../apps/web/src/konten/kamus/beranda';
import { KAMUS_HITUNG } from '../../apps/web/src/konten/kamus/hitung';
import { KAMUS_BELAJAR } from '../../apps/web/src/konten/kamus/belajar';
import { KAMUS_LATIHAN } from '../../apps/web/src/konten/kamus/latihan';
import { KAMUS_RUJUKAN } from '../../apps/web/src/konten/kamus/rujukan';
import { KAMUS_FAQ } from '../../apps/web/src/konten/kamus/faq';
import { KAMUS_GLOSARIUM } from '../../apps/web/src/konten/kamus/glosarium';
import { KAMUS_TANYA_JAWAB } from '../../apps/web/src/konten/kamus/tanyaJawab';
import { KAMUS_BAB } from '../../apps/web/src/konten/kamus/bab';
import { susunPeta, tulisUlang, type BerkasSumber, type PetaDiksi } from './rencana';

const AKAR_WEB = fileURLToPath(new URL('../../apps/web/src/', import.meta.url));
const BERKAS_PETA = fileURLToPath(new URL('./peta.json', import.meta.url));
const KAMUS = { umum: KAMUS_UMUM, beranda: KAMUS_BERANDA, hitung: KAMUS_HITUNG, belajar: KAMUS_BELAJAR, latihan: KAMUS_LATIHAN,
  rujukan: KAMUS_RUJUKAN, faq: KAMUS_FAQ, glosarium: KAMUS_GLOSARIUM, tanya_jawab: KAMUS_TANYA_JAWAB, bab: KAMUS_BAB };

const semuaBerkas = (): BerkasSumber[] => (readdirSync(AKAR_WEB, { recursive: true }) as string[])
  .filter(nama => /\.tsx?$/.test(nama))
  .map(nama => ({ jalur: relative(AKAR_WEB, join(AKAR_WEB, nama)).split(sep).join('/'), isi: readFileSync(join(AKAR_WEB, nama), 'utf8') }));

const [perintah, awalan = ''] = process.argv.slice(2);
if (perintah === 'peta') {
  const peta = susunPeta(semuaBerkas(), KAMUS);
  writeFileSync(BERKAS_PETA, JSON.stringify(peta, null, 2) + '\n');
  console.log(`diksi ${peta.diksi.length}, teks edukasi ${peta.edukasi.length}`);
} else if (perintah === 'tulis') {
  const peta = JSON.parse(readFileSync(BERKAS_PETA, 'utf8')) as PetaDiksi;
  const diubah = semuaBerkas().filter(b => b.jalur.startsWith(awalan)).flatMap(berkas => {
    const baru = tulisUlang(berkas, peta);
    if (baru === berkas.isi) return [];
    writeFileSync(join(AKAR_WEB, berkas.jalur), baru);
    return [berkas.jalur];
  });
  console.log(`ditulis ulang: ${diubah.length} berkas`);
} else {
  console.error('pakai: peta | tulis <awalan-jalur>');
  process.exit(1);
}
