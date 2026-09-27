// Editor rich text (Tiptap) untuk bidang Markdown blok atau potongan. Menerima nilai Markdown dari NilaiForm; memuatnya
// lewat bacaBlok/bacaPotongan → keDokumen; tiap perubahan dokumen → dariDokumen → tulisBlok → saatUbah, jadi yang
// disimpan tetap Markdown yang sama dengan tahap B (lalu Blok[] lewat dariNilaiForm). Nilai dari luar (tab JSON → Form)
// yang berbeda dari yang terakhir dipancarkan memuat ulang dokumen. Tombol Markdown beralih ke textarea; Markdown awal
// yang tak terbaca langsung dibuka di sana beserta galatnya supaya teks penulis tidak hilang.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { JSONContent } from '@tiptap/core';
import { EditorContent, NodeViewWrapper, useEditor, type Editor, type ReactNodeViewProps } from '@tiptap/react';
import {
  BookOpen, Bold, Calculator, Code, Columns3, Heading2, Heading3, Italic, List, ListChecks, ListOrdered, Pencil,
  Quote, Rows3, Scale, Table, TableCellsMerge, Trash2, Video,
} from 'lucide-react';
import { bacaBlok, bacaPotongan, tulisBlok, tulisPotongan, type Blok } from '@waris/content';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { dariDokumen, dariPotonganDokumen, keDokumen, kePotonganDokumen } from '../editor/dokumen';
import { ekstensiEditor, type BukaDialogBlok, type ModeEditor } from '../editor/ekstensi';
import { labelKunci } from '../editor/kasus';
import type { Opsi } from '../editor/formulir';
import { blokKhususBaru, DialogBlokKhusus, DialogIstilah, type JenisBlokKhusus } from './DialogBlok';
import { DialogRujukan } from './PemilihRujukan';

interface Props {
  label: string;
  nilai: string;
  saatUbah: (nilai: string) => void;
  mode: ModeEditor;
  slug: string;
  bacaSaja: boolean;
  istilah: Opsi[];
  arab?: boolean | undefined;
  galat?: boolean;
  /** Ringkasan sintaks, tampil di mode Markdown. */
}

type Dialog = { jenis: 'istilah' } | { jenis: 'rujukan' } | { jenis: 'blok'; blok: Blok; saatSimpan: (blok: Blok) => void };

const BANTUAN_MARKDOWN_POTONGAN = 'Markdown: **tebal**, *miring*, [[id-istilah]], [R04-2] untuk dalil.';
const BANTUAN_MARKDOWN: Record<ModeEditor, string> = {
  potongan: BANTUAN_MARKDOWN_POTONGAN,
  blok: `${BANTUAN_MARKDOWN_POTONGAN} Blok: ## judul, - daftar, > catatan, tabel, \`\`\`kasus / \`\`\`video / \`\`\`kuis.`,
};

export function EditorBlok({ label, nilai, saatUbah, mode, slug, bacaSaja, istilah, arab = false, galat = false }: Props) {
  const awal = useMemo(() => bacaMarkdown(mode, slug, nilai), []); // eslint-disable-line react-hooks/exhaustive-deps -- hanya nilai awal
  const [modeMarkdown, setModeMarkdown] = useState(!awal.ok);
  const [galatMarkdown, setGalatMarkdown] = useState(awal.ok ? null : awal.galat);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const terakhirDipancarkan = useRef(nilai);
  // Markdown ternormalisasi dari dokumen yang sedang dimuat. Transaksi yang tidak mengubahnya (mis. plugin trailing
  // node saat mount) tidak dipancarkan, supaya form tidak dianggap berubah dan Markdown rusak tidak tertimpa.
  const markdownDokumen = useRef(awal.ok ? tulisMarkdown(mode, awal.dokumen) : null);
  const modeMarkdownKini = useRef(modeMarkdown);
  modeMarkdownKini.current = modeMarkdown;
  const saatUbahTerbaru = useRef(saatUbah);
  saatUbahTerbaru.current = saatUbah;
  const bukaDialogBlok = useRef<BukaDialogBlok>((blok, saatSimpan) => setDialog({ jenis: 'blok', blok, saatSimpan }));

  const editor = useEditor({
    extensions: ekstensiEditor(mode, KartuBlok, (blok, saatSimpan) => bukaDialogBlok.current(blok, saatSimpan)),
    content: awal.ok ? awal.dokumen : null,
    editable: !bacaSaja,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        'aria-label': label, role: 'textbox', 'aria-multiline': String(mode === 'blok'),
        ...(arab ? { dir: 'rtl', lang: 'ar' } : {}),
        class: cn('prose-admin min-h-10 px-3 py-2 outline-none', mode === 'blok' && 'min-h-40'),
      },
    },
    onUpdate: ({ editor: kini }) => {
      if (modeMarkdownKini.current) return;
      const markdown = tulisMarkdown(mode, kini.getJSON());
      if (markdown === markdownDokumen.current) return;
      markdownDokumen.current = markdown;
      terakhirDipancarkan.current = markdown;
      saatUbahTerbaru.current(markdown);
    },
  });

  useEffect(() => { editor.setEditable(!bacaSaja); }, [editor, bacaSaja]);

  // Nilai dari luar (tab JSON, muat ulang entri) → muat ulang dokumen; ketikan sendiri tidak memicu ini.
  useEffect(() => {
    if (nilai === terakhirDipancarkan.current || modeMarkdown) return;
    terakhirDipancarkan.current = nilai;
    const hasil = bacaMarkdown(mode, slug, nilai);
    if (hasil.ok) muatDokumen(hasil.dokumen);
    else { setModeMarkdown(true); setGalatMarkdown(hasil.galat); }
  }, [editor, mode, slug, nilai, modeMarkdown]);

  function muatDokumen(dokumen: JSONContent) {
    markdownDokumen.current = tulisMarkdown(mode, dokumen);
    editor.commands.setContent(dokumen, { emitUpdate: false });
  }

  function keluarDariMarkdown() {
    const hasil = bacaMarkdown(mode, slug, nilai);
    if (!hasil.ok) { setGalatMarkdown(hasil.galat); return; }
    terakhirDipancarkan.current = nilai;
    muatDokumen(hasil.dokumen);
    setGalatMarkdown(null);
    setModeMarkdown(false);
  }

  const sisip = (isi: JSONContent) => editor.chain().focus().insertContent(isi).run();
  const teksTerpilih = () => editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ').trim();

  return (
    <div className={cn('rounded-lg border bg-background', galat && 'border-destructive')}>
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
        {!bacaSaja && !modeMarkdown ? <Toolbar editor={editor} mode={mode} bukaDialog={setDialog} /> : null}
        <Button type="button" size="sm" variant={modeMarkdown ? 'secondary' : 'ghost'} className="ml-auto"
          aria-label={modeMarkdown ? `Sunting ${label} sebagai teks` : `Sunting ${label} sebagai Markdown`}
          onClick={() => (modeMarkdown ? keluarDariMarkdown() : setModeMarkdown(true))}>
          <Code /> {modeMarkdown ? 'Tampilan teks' : 'Markdown'}
        </Button>
      </div>
      <div hidden={modeMarkdown}><EditorContent editor={editor} /></div>
      {modeMarkdown ? (
        <div className="grid gap-1 p-1">
          <Textarea aria-label={`${label} (Markdown)`} rows={mode === 'blok' ? 14 : 2} className={cn(mode === 'blok' && 'font-mono text-sm')}
            value={nilai} readOnly={bacaSaja} onChange={e => saatUbah(e.target.value)} {...(arab ? { dir: 'rtl', lang: 'ar' } : {})} />
          <p className="px-2 text-xs text-muted-foreground">{BANTUAN_MARKDOWN[mode]}</p>
          {galatMarkdown ? <p className="px-2 text-sm text-destructive">Markdown belum terbaca: {galatMarkdown}</p> : null}
        </div>
      ) : null}
      <DialogIstilah buka={dialog?.jenis === 'istilah'} opsi={istilah} saatTutup={() => setDialog(null)}
        saatPilih={(id, teks) => { setDialog(null); sisip({ type: 'istilah', attrs: { id, teks: teksTerpilih() || teks } }); }} />
      <DialogRujukan buka={dialog?.jenis === 'rujukan'} saatTutup={() => setDialog(null)}
        saatPilih={kode => { setDialog(null); sisip({ type: 'rujukan', attrs: { kode } }); }} />
      <DialogBlokKhusus blok={dialog?.jenis === 'blok' ? dialog.blok : null} slug={slug} saatTutup={() => setDialog(null)}
        saatSimpan={blok => { if (dialog?.jenis === 'blok') dialog.saatSimpan(blok); setDialog(null); }} />
    </div>
  );
}

function Toolbar({ editor, mode, bukaDialog }: { editor: Editor; mode: ModeEditor; bukaDialog: (dialog: Dialog) => void }) {
  const rantai = () => editor.chain().focus();
  const diTabel = editor.isActive('table');
  const sisipBlokBaru = (jenis: JenisBlokKhusus) => bukaDialog({
    jenis: 'blok', blok: blokKhususBaru(jenis),
    saatSimpan: blok => rantai().insertContent({ type: 'blokKhusus', attrs: { blok } }).run(),
  });
  return (
    <>
      <Tombol label="Tebal" aktif={editor.isActive('bold')} saatKlik={() => rantai().toggleBold().run()}><Bold /></Tombol>
      <Tombol label="Miring" aktif={editor.isActive('italic')} saatKlik={() => rantai().toggleItalic().run()}><Italic /></Tombol>
      {mode === 'blok' ? (
        <>
          <Pemisah />
          <Tombol label="Judul" aktif={editor.isActive('heading', { level: 2 })} saatKlik={() => rantai().toggleHeading({ level: 2 }).run()}><Heading2 /></Tombol>
          <Tombol label="Subjudul" aktif={editor.isActive('heading', { level: 3 })} saatKlik={() => rantai().toggleHeading({ level: 3 }).run()}><Heading3 /></Tombol>
          <Tombol label="Daftar" aktif={editor.isActive('bulletList')} saatKlik={() => rantai().toggleBulletList().run()}><List /></Tombol>
          <Tombol label="Daftar bernomor" aktif={editor.isActive('orderedList')} saatKlik={() => rantai().toggleOrderedList().run()}><ListOrdered /></Tombol>
          <Tombol label="Catatan" aktif={editor.isActive('blockquote')} saatKlik={() => rantai().toggleBlockquote().run()}><Quote /></Tombol>
          <Tombol label="Sisip tabel" saatKlik={() => rantai().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}><Table /></Tombol>
          {diTabel ? (
            <>
              <Tombol label="Tambah baris tabel" saatKlik={() => rantai().addRowAfter().run()}><Rows3 /></Tombol>
              <Tombol label="Tambah kolom tabel" saatKlik={() => rantai().addColumnAfter().run()}><Columns3 /></Tombol>
              <Tombol label="Hapus baris tabel" saatKlik={() => rantai().deleteRow().run()}><TableCellsMerge /></Tombol>
              <Tombol label="Hapus tabel" saatKlik={() => rantai().deleteTable().run()}><Trash2 /></Tombol>
            </>
          ) : null}
        </>
      ) : null}
      <Pemisah />
      <Tombol label="Sisip istilah" saatKlik={() => bukaDialog({ jenis: 'istilah' })}><BookOpen /></Tombol>
      <Tombol label="Sisip rujukan" saatKlik={() => bukaDialog({ jenis: 'rujukan' })}><Scale /></Tombol>
      {mode === 'blok' ? (
        <>
          <Pemisah />
          <Tombol label="Sisip contoh kasus" saatKlik={() => sisipBlokBaru('kasus')}><Calculator /></Tombol>
          <Tombol label="Sisip video" saatKlik={() => sisipBlokBaru('video')}><Video /></Tombol>
          <Tombol label="Sisip kuis" saatKlik={() => sisipBlokBaru('kuis')}><ListChecks /></Tombol>
        </>
      ) : null}
    </>
  );
}

function Tombol({ label, aktif = false, saatKlik, children }: { label: string; aktif?: boolean; saatKlik: () => void; children: ReactNode }) {
  return (
    <Button type="button" size="icon-sm" variant={aktif ? 'secondary' : 'ghost'} aria-label={label} aria-pressed={aktif} title={label}
      onMouseDown={e => e.preventDefault()} onClick={saatKlik}>
      {children}
    </Button>
  );
}

const Pemisah = () => <span aria-hidden className="mx-1 h-5 w-px bg-border" />;

/** Tampilan node blokKhusus (kasus/video/kuis) di dalam editor. */
function KartuBlok({ node, editor, updateAttributes, deleteNode, extension }: ReactNodeViewProps) {
  const blok = node.attrs.blok as Blok | null;
  const bukaDialog = (extension.options as { bukaDialog: BukaDialogBlok }).bukaDialog;
  return (
    <NodeViewWrapper className="my-2" data-drag-handle>
      <div contentEditable={false} className="flex flex-wrap items-center gap-2 rounded-md border border-dashed bg-muted/40 px-3 py-2">
        <span className="text-sm">{blok ? ringkasBlok(blok) : 'Blok tidak terbaca'}</span>
        {editor.isEditable && blok ? (
          <span className="ml-auto flex gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => bukaDialog(blok, baru => updateAttributes({ blok: baru }))}><Pencil /> Ubah</Button>
            <Button type="button" size="sm" variant="ghost" onClick={deleteNode}><Trash2 /> Hapus</Button>
          </span>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

function ringkasBlok(blok: Blok): string {
  switch (blok.jenis) {
    case 'kasus': {
      const ahliWaris = [...new Set(blok.kasus.ahliWaris)].map(kunci => {
        const jumlah = blok.kasus.ahliWaris.filter(k => k === kunci).length;
        return jumlah > 1 ? `${jumlah} ${labelKunci(kunci)}` : labelKunci(kunci);
      });
      return `Contoh kasus: pewaris ${blok.kasus.pewaris === 'L' ? 'laki-laki' : 'perempuan'}; ${ahliWaris.join(', ')}`;
    }
    case 'video': return `Video: ${blok.judul}`;
    case 'kuis': return `Kuis: ${blok.daftarKode.join(', ')}`;
    default: return blok.jenis;
  }
}

// --- helper ---

type HasilBaca = { ok: true; dokumen: JSONContent } | { ok: false; galat: string };

function bacaMarkdown(mode: ModeEditor, slug: string, nilai: string): HasilBaca {
  try {
    return { ok: true, dokumen: mode === 'blok' ? keDokumen(bacaBlok(slug, nilai)) : kePotonganDokumen(bacaPotongan(nilai.trim())) };
  } catch (e) {
    return { ok: false, galat: e instanceof Error ? e.message : String(e) };
  }
}

function tulisMarkdown(mode: ModeEditor, dokumen: JSONContent): string {
  if (mode === 'potongan') return tulisPotongan(dariPotonganDokumen(dokumen));
  const daftarBlok = dariDokumen(dokumen);
  return daftarBlok.length > 0 ? tulisBlok(daftarBlok) : '';
}
