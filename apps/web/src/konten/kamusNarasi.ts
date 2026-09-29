// Kamus narasi explain dari diksi terbit (snapshot/cache yang sama dengan t()).
import type { Kamus } from '@waris/explain';
import { cariDiksi } from './sumber';

export const kamusNarasi: Kamus = kunci => cariDiksi(kunci);
