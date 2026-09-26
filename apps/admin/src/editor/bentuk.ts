// Bentuk editor hibrida (murni): isi konten ↔ BentukEditor. Field string tingkat atas jadi input teks, blok materi
// jadi Markdown (tulisBlok/bacaBlok), sisanya JSON indentasi 2. dariBentuk menggabung kembali lalu memvalidasi lewat
// bacaIsi (Zod); galat (JSON rusak, Markdown tak terbaca, Zod) dikembalikan sebagai { ok: false }, tidak dilempar.
import { bacaBlok, bacaIsi, keJson, tulisBlok, type IsiKonten, type JenisKonten, type Pelajaran } from '@waris/content';

export interface BentukEditor {
  teks: Record<string, string>;
  blok: string | null;
  blokAr: string | null;
  json: string;
}

type Objek = Record<string, unknown>;

export function keBentuk<J extends JenisKonten>(jenis: J, isi: IsiKonten[J]): BentukEditor {
  const sisa = keJson(jenis, isi) as Objek;
  const teks: Record<string, string> = {};
  for (const [kunci, nilai] of Object.entries(sisa)) {
    if (typeof nilai === 'string') { teks[kunci] = nilai; delete sisa[kunci]; }
  }
  let blok: string | null = null;
  let blokAr: string | null = null;
  if (jenis === 'materi') {
    const pelajaran = isi as Pelajaran;
    blok = tulisBlok(pelajaran.blok);
    delete sisa.blok;
    if (pelajaran.ar?.blok) {
      blokAr = tulisBlok(pelajaran.ar.blok);
      delete (sisa.ar as Objek).blok;
    }
  }
  return { teks, blok, blokAr, json: JSON.stringify(sisa, null, 2) };
}

export function dariBentuk<J extends JenisKonten>(jenis: J, slug: string, bentuk: BentukEditor):
  { ok: true; isi: IsiKonten[J] } | { ok: false; galat: string } {
  let sisa: Objek;
  try {
    sisa = JSON.parse(bentuk.json) as Objek;
  } catch (e) {
    return { ok: false, galat: `JSON tidak sah: ${pesanGalat(e)}` };
  }
  const gabungan: Objek = { ...sisa, ...bentuk.teks };
  if (jenis === 'materi') {
    try {
      if (bentuk.blok !== null) gabungan.blok = bacaBlok(slug, bentuk.blok);
      if (bentuk.blokAr !== null) gabungan.ar = { ...(gabungan.ar as Objek), blok: bacaBlok(slug, bentuk.blokAr) };
    } catch (e) {
      return { ok: false, galat: `Markdown blok tidak sah: ${pesanGalat(e)}` };
    }
  }
  // bacaBlok menghasilkan bigint (blok kasus); bacaIsi mengharapkan string digit seperti di database.
  return bacaIsi(jenis, keJson(jenis, gabungan as unknown as IsiKonten[J]));
}

const pesanGalat = (e: unknown) => (e instanceof Error ? e.message : String(e));
