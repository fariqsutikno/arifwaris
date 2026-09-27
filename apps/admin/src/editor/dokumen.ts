// Konversi murni Blok[]/Potongan[] ↔ dokumen Tiptap (JSONContent). Menerima isi yang sudah dibaca bacaBlok/bacaPotongan
// atau dokumen dari editor; memutuskan node apa mewakili tiap blok; menyerahkan Blok[] ke EditorBlok, yang menuliskannya
// kembali sebagai Markdown (tulisBlok) ke NilaiForm. Hukum: dariDokumen(keDokumen(b)) = b. Yang tak terwakili skema Blok
// dipipihkan secara tetap: tebal+miring → tebal, daftar bersarang → butir berikutnya, beberapa paragraf di catatan/sel
// tabel → disambung spasi, paragraf kosong → dilewati.
import type { JSONContent } from '@tiptap/core';
import type { Blok, Potongan } from '@waris/content';

export function keDokumen(daftarBlok: Blok[]): JSONContent {
  const isi = daftarBlok.map(keNode);
  return { type: 'doc', content: isi.length > 0 ? isi : [paragraf([])] };
}

export function dariDokumen(dokumen: JSONContent): Blok[] {
  return (dokumen.content ?? []).flatMap(dariNode);
}

/** Mode potongan: dokumen berisi tepat satu paragraf. */
export function kePotonganDokumen(daftar: Potongan[]): JSONContent {
  return { type: 'doc', content: [paragraf(daftar)] };
}

export function dariPotonganDokumen(dokumen: JSONContent): Potongan[] {
  return gabungTeks(dokumen);
}

// --- Blok → node ---

function keNode(blok: Blok): JSONContent {
  switch (blok.jenis) {
    case 'judul': return { type: 'heading', attrs: { level: blok.tingkat }, ...isiSebaris(blok.isi) };
    case 'paragraf': return paragraf(blok.isi);
    case 'catatan': return { type: 'blockquote', content: [paragraf(blok.isi)] };
    case 'daftar': return {
      type: blok.berurut ? 'orderedList' : 'bulletList',
      content: blok.butir.map(butir => ({ type: 'listItem', content: [paragraf(butir)] })),
    };
    case 'tabel': return {
      type: 'table',
      content: [barisTabel('tableHeader', blok.kepala), ...blok.baris.map(baris => barisTabel('tableCell', baris))],
    };
    case 'kasus': case 'video': case 'kuis': return { type: 'blokKhusus', attrs: { blok } };
  }
}

const paragraf = (daftar: Potongan[]): JSONContent => ({ type: 'paragraph', ...isiSebaris(daftar) });

const barisTabel = (jenisSel: 'tableHeader' | 'tableCell', daftarSel: Potongan[][]): JSONContent => ({
  type: 'tableRow', content: daftarSel.map(sel => ({ type: jenisSel, content: [paragraf(sel)] })),
});

/** ProseMirror menolak node teks kosong, jadi potongan teks kosong tidak dijadikan node. */
function isiSebaris(daftar: Potongan[]): { content?: JSONContent[] } {
  const isi = daftar.flatMap((potongan): JSONContent[] => {
    switch (potongan.jenis) {
      case 'teks': return potongan.teks ? [{ type: 'text', text: potongan.teks }] : [];
      case 'tebal': return potongan.teks ? [{ type: 'text', text: potongan.teks, marks: [{ type: 'bold' }] }] : [];
      case 'miring': return potongan.teks ? [{ type: 'text', text: potongan.teks, marks: [{ type: 'italic' }] }] : [];
      case 'istilah': return [{ type: 'istilah', attrs: { id: potongan.id, teks: potongan.teks } }];
      case 'rujukan': return [{ type: 'rujukan', attrs: { kode: potongan.kode } }];
    }
  });
  return isi.length > 0 ? { content: isi } : {};
}

// --- node → Blok ---

function dariNode(node: JSONContent): Blok[] {
  switch (node.type) {
    case 'heading': return [{ jenis: 'judul', tingkat: node.attrs?.level === 3 ? 3 : 2, isi: keSebaris(node) }];
    case 'paragraph': {
      const isi = keSebaris(node);
      return isi.length > 0 ? [{ jenis: 'paragraf', isi }] : [];
    }
    case 'blockquote': return [{ jenis: 'catatan', isi: gabungTeks(node) }];
    case 'bulletList': case 'orderedList': return [{ jenis: 'daftar', berurut: node.type === 'orderedList', butir: butirDaftar(node) }];
    case 'table': {
      const [kepala, ...baris] = (node.content ?? []).map(baris => (baris.content ?? []).map(gabungTeks));
      return [{ jenis: 'tabel', kepala: kepala ?? [], baris }];
    }
    case 'blokKhusus': return node.attrs?.blok ? [node.attrs.blok as Blok] : [];
    default: return [];
  }
}

/** Butir = paragraf langsung di listItem; daftar bersarang dipipihkan jadi butir berikutnya. */
function butirDaftar(daftar: JSONContent): Potongan[][] {
  return (daftar.content ?? []).flatMap(butir => (butir.content ?? []).flatMap(anak =>
    anak.type === 'bulletList' || anak.type === 'orderedList' ? butirDaftar(anak) : [gabungTeks(anak)]));
}

/** Semua paragraf/judul di dalam node, disambung spasi (sama seperti bacaBlok menyambung baris catatan). */
function gabungTeks(node: JSONContent): Potongan[] {
  const daftarSebaris: Potongan[][] = [];
  const kumpulkan = (kini: JSONContent) => {
    if (kini.type === 'paragraph' || kini.type === 'heading') daftarSebaris.push(keSebaris(kini));
    else (kini.content ?? []).forEach(kumpulkan);
  };
  kumpulkan(node);
  return rapatkan(daftarSebaris.filter(isi => isi.length > 0)
    .flatMap((isi, i): Potongan[] => (i === 0 ? isi : [{ jenis: 'teks', teks: ' ' }, ...isi])));
}

function keSebaris(node: JSONContent): Potongan[] {
  return rapatkan((node.content ?? []).flatMap((anak): Potongan[] => {
    if (anak.type === 'istilah') return [{ jenis: 'istilah', id: String(anak.attrs?.id ?? ''), teks: String(anak.attrs?.teks ?? '') }];
    if (anak.type === 'rujukan') return [{ jenis: 'rujukan', kode: String(anak.attrs?.kode ?? '') }];
    if (anak.type !== 'text' || !anak.text) return [];
    const tanda = new Set((anak.marks ?? []).map(mark => mark.type));
    // Potongan tidak bisa tebal dan miring sekaligus → tebal didahulukan.
    const jenis = tanda.has('bold') ? 'tebal' : tanda.has('italic') ? 'miring' : 'teks';
    return [{ jenis, teks: anak.text }];
  }));
}

/** Potongan berurutan sejenis (teks/tebal/miring) disatukan, seperti hasil bacaPotongan. */
function rapatkan(daftar: Potongan[]): Potongan[] {
  return daftar.reduce<Potongan[]>((hasil, potongan) => {
    const terakhir = hasil.at(-1);
    if (terakhir && terakhir.jenis === potongan.jenis && 'teks' in terakhir && 'teks' in potongan && terakhir.jenis !== 'istilah') {
      return [...hasil.slice(0, -1), { ...terakhir, teks: terakhir.teks + potongan.teks }];
    }
    return [...hasil, potongan];
  }, []);
}
