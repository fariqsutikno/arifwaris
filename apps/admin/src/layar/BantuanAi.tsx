// Bantuan AI di portal (Fase 5, lewat repo.ai → Edge Function ai-bantu; kunci Gemini tidak pernah ada di portal):
//   - TautanRapikan: "Rapikan dengan AI" di bidang teks; hasil tampil sebagai perbandingan, penulis Terima atau Buang.
//   - DialogDrafKuis: draf soal kuis dari dasar hukum satu bab (KB); hasilnya mengisi form dan ditandai dibantu AI.
//   - PanelSaranAi: daftar saran kelengkapan materi/FAQ; hanya saran, tidak pernah menulis ke isi.
// Reviewer tidak mendapat tautan AI (hanya penulis & admin, keputusan C7).
import { useContext, useState } from 'react';
import { JUDUL_BAB, RUJUKAN } from '@waris/content';
import type { DrafKuisAi, PermintaanAi, HasilAi } from '@waris/data';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { diffKata } from '../editor/diff';
import { pesanGalat } from '../pesanGalat';
import { KonteksRepo } from '../repo';
import { Perbandingan } from './Perbandingan';

/** Fungsi pemanggil AI bila pengguna boleh memakainya (penulis/admin di dalam portal), selain itu null. */
function useAi() {
  const portal = useContext(KonteksRepo);
  if (!portal || portal.peran === 'reviewer') return null;
  return async <F extends HasilAi['fitur']>(permintaan: PermintaanAi & { fitur: F }) =>
    (await portal.repo.ai.bantu(permintaan)).hasil as Extract<HasilAi, { fitur: F }>;
}

export function TautanRapikan({ teks, saatTerima }: { teks: string; saatTerima: (teks: string) => void }) {
  const ai = useAi();
  const [keadaan, setKeadaan] = useState<null | 'memuat' | { baru: string } | { galat: string }>(null);
  if (!ai || !teks.trim()) return null;
  const minta = async () => {
    setKeadaan('memuat');
    try { setKeadaan({ baru: (await ai({ fitur: 'rapikan', teks })).teks }); } catch (e) { setKeadaan({ galat: pesanGalat(e) }); }
  };
  return (
    <>
      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={keadaan === 'memuat'} onClick={() => void minta()}>
        <Sparkles />{keadaan === 'memuat' ? 'Merapikan…' : 'Rapikan dengan AI'}
      </Button>
      {keadaan && keadaan !== 'memuat' ? (
        <Dialog open onOpenChange={buka => { if (!buka) setKeadaan(null); }}>
          <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Hasil rapikan AI</DialogTitle>
              <DialogDescription>AI hanya merapikan ejaan dan kalimat; rujukan dan istilah sisipan dikunci. Periksa sebelum menerima.</DialogDescription>
            </DialogHeader>
            {'galat' in keadaan
              ? <p role="alert" className="text-sm text-destructive">{keadaan.galat}</p>
              : keadaan.baru === teks ? <p className="text-sm text-muted-foreground">Tidak ada yang perlu dirapikan.</p>
                : <Perbandingan perubahan={[{ label: 'Teks', arab: false, potongan: diffKata(teks, keadaan.baru) }]} />}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setKeadaan(null)}>Buang</Button>
              {'baru' in keadaan && keadaan.baru !== teks
                ? <Button onClick={() => { saatTerima(keadaan.baru); setKeadaan(null); }}>Terima</Button> : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

const DAFTAR_BAB = Object.entries(JUDUL_BAB).map(([bab, judul]) => ({ bab: Number(bab), judul }))
  .filter(({ bab }) => RUJUKAN.some(r => r.bab === bab)).sort((a, b) => a.bab - b.bab);

/** Tombol + dialog draf soal kuis. `babAwal` = bab di form (bila sudah dipilih). */
export function TautanDrafKuis({ babAwal, saatDraf }: { babAwal: number | null; saatDraf: (draf: DrafKuisAi, bab: number) => void }) {
  const ai = useAi();
  const [buka, setBuka] = useState(false);
  const [bab, setBab] = useState(babAwal ?? DAFTAR_BAB[0]?.bab ?? 1);
  const [arah, setArah] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  if (!ai) return null;
  const buat = async () => {
    setSibuk(true);
    setGalat(null);
    try {
      const rujukan = RUJUKAN.filter(r => r.bab === bab).map(({ kode, klaim, sumber, kutipan }) => ({ kode, klaim, sumber, kutipan }));
      const { draf } = await ai({ fitur: 'drafKuis', bab, judulBab: JUDUL_BAB[bab] ?? '', rujukan, pertanyaan: arah });
      saatDraf(draf, bab);
      setBuka(false);
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setSibuk(false);
    }
  };
  return (
    <>
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => { setBab(babAwal ?? bab); setBuka(true); }}>
        <Sparkles />Buat draf dengan AI
      </Button>
      <Dialog open={buka} onOpenChange={setBuka}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat draf soal dengan AI</DialogTitle>
            <DialogDescription>
              AI hanya memakai dasar hukum bab yang dipilih. Hasilnya mengisi form (menggantikan pertanyaan, pilihan, dan pembahasan)
              dan wajib lewat review sebelum tayang.
            </DialogDescription>
          </DialogHeader>
          <Label className="grid gap-1.5">Bab
            <NativeSelect className="w-full" value={String(bab)} onChange={e => setBab(Number(e.target.value))}>
              {DAFTAR_BAB.map(b => <NativeSelectOption key={b.bab} value={String(b.bab)}>{b.bab}. {b.judul}</NativeSelectOption>)}
            </NativeSelect>
          </Label>
          <Label className="grid gap-1.5">Arah pertanyaan (opsional)
            <Textarea rows={2} placeholder="mis. bagian ibu bila ada saudara" value={arah} onChange={e => setArah(e.target.value)} />
          </Label>
          {galat ? <p role="alert" className="text-sm text-destructive">{galat}</p> : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBuka(false)}>Batal</Button>
            <Button disabled={sibuk} onClick={() => void buat()}>{sibuk ? 'Membuat…' : 'Buat draf'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PanelSaranAi({ jenis, judul, teks }: { jenis: 'materi' | 'faq'; judul: string; teks: string }) {
  const ai = useAi();
  const [keadaan, setKeadaan] = useState<null | 'memuat' | { saran: string[] } | { galat: string }>(null);
  if (!ai) return null;
  const minta = async () => {
    setKeadaan('memuat');
    try { setKeadaan({ saran: (await ai({ fitur: 'saran', jenis, judul, teks })).saran }); } catch (e) { setKeadaan({ galat: pesanGalat(e) }); }
  };
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-medium">Saran AI</h3>
      {keadaan && keadaan !== 'memuat' ? (
        'galat' in keadaan ? <p role="alert" className="text-sm text-destructive">{keadaan.galat}</p>
          : keadaan.saran.length ? <ul className="grid list-disc gap-1 ps-5 text-sm">{keadaan.saran.map((s, i) => <li key={i}>{s}</li>)}</ul>
            : <p className="text-sm text-muted-foreground">Tidak ada saran.</p>
      ) : <p className="text-xs text-muted-foreground">Hal yang bisa dilengkapi. Hanya saran; isi tidak diubah.</p>}
      <Button type="button" variant="outline" size="sm" className="w-fit" disabled={keadaan === 'memuat' || !teks.trim()} onClick={() => void minta()}>
        <Sparkles />{keadaan === 'memuat' ? 'Meminta saran…' : keadaan ? 'Minta saran lagi' : 'Minta saran'}
      </Button>
    </section>
  );
}
