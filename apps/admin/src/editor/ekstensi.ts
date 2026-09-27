// Skema Tiptap editor blok. Menerima mode (blok / potongan) dan tampilan kartu blok khusus dari layar; memutuskan node
// dan tanda apa yang boleh ada supaya dokumen selalu bisa dikonversi dokumen.ts ke Blok[]/Potongan[] tanpa sisa;
// menyerahkan daftar ekstensi ke EditorBlok. Node sebaris: istilah {id, teks}, rujukan {kode} (tampil sebagai klaimnya); node blok: blokKhusus
// {blok} untuk kasus/video/kuis. Salin-tempel membawa blok khusus sebagai Markdown (tulisBlok) di atribut HTML.
import { mergeAttributes, Node, type Extensions } from '@tiptap/core';
import { ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { bacaBlok, tulisBlok, type Blok } from '@waris/content';
import type { ComponentType } from 'react';
import { teksRujukan } from './rujukan';

export type ModeEditor = 'blok' | 'potongan';
export type BukaDialogBlok = (blok: Blok, saatSimpan: (baru: Blok) => void) => void;

const PANJANG_CHIP = 32;
const pendek = (teks: string) => (teks.length > PANJANG_CHIP ? `${teks.slice(0, PANJANG_CHIP - 1).trimEnd()}…` : teks);
const KELAS_CHIP = 'rounded bg-secondary px-1 py-0.5 text-secondary-foreground';

export const Istilah = Node.create({
  name: 'istilah',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      id: { default: '', parseHTML: el => el.getAttribute('data-istilah') ?? '' },
      teks: { default: '', parseHTML: el => el.textContent ?? '' },
    };
  },
  parseHTML: () => [{ tag: 'span[data-istilah]' }],
  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-istilah': node.attrs.id, class: `${KELAS_CHIP} underline decoration-dotted`, title: `Istilah: ${node.attrs.id}` }), node.attrs.teks];
  },
  renderText: ({ node }) => node.attrs.teks,
});

export const Rujukan = Node.create({
  name: 'rujukan',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return { kode: { default: '', parseHTML: el => el.getAttribute('data-rujukan') ?? '' } };
  },
  parseHTML: () => [{ tag: 'span[data-rujukan]' }],
  renderHTML({ node, HTMLAttributes }) {
    // Penulis melihat klaim rujukannya, bukan kode; kode tetap di atribut dan di Markdown.
    const klaim = teksRujukan(node.attrs.kode);
    return ['span', mergeAttributes(HTMLAttributes, { 'data-rujukan': node.attrs.kode, class: `${KELAS_CHIP} text-xs`, title: `Dalil: ${klaim}` }), `Dalil: ${pendek(klaim)}`];
  },
  renderText: ({ node }) => `[${node.attrs.kode}]`,
});

function buatBlokKhusus(kartu: ComponentType<ReactNodeViewProps>) {
  return Node.create<{ bukaDialog: BukaDialogBlok }>({
    name: 'blokKhusus',
    group: 'block',
    atom: true,
    draggable: true,
    addOptions: () => ({ bukaDialog: () => {} }),
    addAttributes() {
      return {
        blok: {
          default: null,
          parseHTML: el => bacaBlokSalinan(el.getAttribute('data-blok-khusus')),
          renderHTML: attrs => ({ 'data-blok-khusus': attrs.blok ? tulisBlok([attrs.blok as Blok]) : '' }),
        },
      };
    },
    parseHTML: () => [{ tag: 'div[data-blok-khusus]' }],
    renderHTML: ({ HTMLAttributes }) => ['div', HTMLAttributes],
    addNodeView: () => ReactNodeViewRenderer(kartu),
  });
}

/** Dokumen mode potongan: tepat satu paragraf, jadi Enter tidak bisa membuat paragraf baru. */
const DokumenPotongan = Node.create({ name: 'doc', topNode: true, content: 'paragraph' });

const TANPA_FITUR_LUAR_SKEMA = {
  code: false, codeBlock: false, strike: false, underline: false, link: false, horizontalRule: false, hardBreak: false,
} as const;

export function ekstensiEditor(mode: ModeEditor, kartu: ComponentType<ReactNodeViewProps>, bukaDialog: BukaDialogBlok): Extensions {
  if (mode === 'potongan') {
    return [
      DokumenPotongan,
      StarterKit.configure({
        ...TANPA_FITUR_LUAR_SKEMA, document: false, heading: false, blockquote: false,
        bulletList: false, orderedList: false, listItem: false, listKeymap: false, trailingNode: false,
      }),
      Istilah, Rujukan,
    ];
  }
  return [
    StarterKit.configure({ ...TANPA_FITUR_LUAR_SKEMA, heading: { levels: [2, 3] } }),
    TableKit.configure({ table: { resizable: false } }),
    Istilah, Rujukan,
    buatBlokKhusus(kartu).configure({ bukaDialog }),
  ];
}

function bacaBlokSalinan(markdown: string | null): Blok | null {
  if (!markdown) return null;
  try {
    return bacaBlok('salinan', markdown)[0] ?? null;
  } catch {
    return null;
  }
}
