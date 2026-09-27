// Dialog editor blok. DialogBlokKhusus menyunting satu blok kasus/video/kuis sebagai draf; Simpan memvalidasinya lewat
// bacaBlok(tulisBlok(...)) supaya aturan sama persis dengan yang dipakai saat simpan entri, lalu menyerahkan blok ke
// EditorBlok. DialogIstilah: cari lalu pilih; hanya istilah dari daftar. (DialogRujukan ada di PemilihRujukan.tsx.)
import { useState } from 'react';
import { bacaBlok, tulisBlok, type Blok, type ContohKasus } from '@waris/content';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Opsi } from '../editor/formulir';
import { EditorKasus } from './EditorKasus';
import { pesanGalat } from '../pesanGalat';

export type JenisBlokKhusus = Extract<Blok, { jenis: 'kasus' | 'video' | 'kuis' }>['jenis'];

const KASUS_BARU: ContohKasus = { pewaris: 'L', ahliWaris: [], harta: 0n, harapan: { saham: {}, ashlAkhir: 0n } };
const BATAS_SARAN = 30;

export function blokKhususBaru(jenis: JenisBlokKhusus): Blok {
  switch (jenis) {
    case 'kasus': return { jenis, kasus: KASUS_BARU };
    case 'video': return { jenis, idYoutube: '', judul: '' };
    case 'kuis': return { jenis, daftarKode: [] };
  }
}

const JUDUL_DIALOG: Record<JenisBlokKhusus, string> = { kasus: 'Contoh kasus', video: 'Video YouTube', kuis: 'Kuis cek pemahaman' };

interface PropsBlokKhusus { blok: Blok | null; slug: string; saatSimpan: (blok: Blok) => void; saatTutup: () => void }

export function DialogBlokKhusus({ blok, slug, saatSimpan, saatTutup }: PropsBlokKhusus) {
  return (
    <Dialog open={blok !== null} onOpenChange={buka => { if (!buka) saatTutup(); }}>
      {blok ? <IsiBlokKhusus key={JSON.stringify(blok, (_, v) => (typeof v === 'bigint' ? String(v) : v))} blok={blok} slug={slug} saatSimpan={saatSimpan} /> : null}
    </Dialog>
  );
}

function IsiBlokKhusus({ blok, slug, saatSimpan }: { blok: Blok; slug: string; saatSimpan: (blok: Blok) => void }) {
  const jenis = blok.jenis as JenisBlokKhusus;
  const [kasus, setKasus] = useState(blok.jenis === 'kasus' ? blok.kasus : KASUS_BARU);
  const [tautan, setTautan] = useState(blok.jenis === 'video' && blok.idYoutube ? `https://www.youtube.com/watch?v=${blok.idYoutube}` : '');
  const [judul, setJudul] = useState(blok.jenis === 'video' ? blok.judul : '');
  const [kode, setKode] = useState(blok.jenis === 'kuis' ? blok.daftarKode.join(', ') : '');
  const [galat, setGalat] = useState<string | null>(null);

  function simpan() {
    try {
      const [hasil] = bacaBlok(slug, markdownDraf());
      if (!hasil || (hasil.jenis === 'kuis' && hasil.daftarKode.length === 0)) throw new Error('Isi minimal satu kode soal.');
      saatSimpan(hasil);
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  }

  function markdownDraf(): string {
    switch (jenis) {
      case 'kasus': return tulisBlok([{ jenis, kasus }]);
      case 'video': return '```video\n' + `${tautan.trim()}\njudul: ${judul.trim() || 'Video'}` + '\n```\n';
      case 'kuis': return '```kuis\n' + kode + '\n```\n';
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{JUDUL_DIALOG[jenis]}</DialogTitle>
        <DialogDescription>
          {jenis === 'kasus' ? 'Contoh ini dihitung ulang oleh kalkulator setiap kali ditampilkan.'
            : jenis === 'video' ? 'Ditampilkan lewat youtube-nocookie.' : 'Kode soal kuis dipisah koma, mis. K-01, K-02.'}
        </DialogDescription>
      </DialogHeader>
      {jenis === 'kasus' ? <EditorKasus nilai={kasus} saatUbah={setKasus} bacaSaja={false} /> : null}
      {jenis === 'video' ? (
        <>
          <Label className="grid gap-1.5">Tautan YouTube<Input type="url" value={tautan} onChange={e => setTautan(e.target.value)} /></Label>
          <Label className="grid gap-1.5">Judul video<Input value={judul} onChange={e => setJudul(e.target.value)} /></Label>
        </>
      ) : null}
      {jenis === 'kuis' ? <Label className="grid gap-1.5">Kode soal<Input value={kode} onChange={e => setKode(e.target.value)} /></Label> : null}
      {galat ? <Alert variant="destructive"><AlertDescription>{galat}</AlertDescription></Alert> : null}
      <DialogFooter><Button type="button" onClick={simpan}>Simpan blok</Button></DialogFooter>
    </DialogContent>
  );
}

interface PropsIstilah { buka: boolean; opsi: Opsi[]; saatPilih: (id: string, teks: string) => void; saatTutup: () => void }

/** Label opsi istilah berbentuk "Istilah (id)"; teks tampilan bawaan = bagian sebelum id. */
export const teksIstilah = (opsi: Opsi) => opsi.label.replace(` (${opsi.nilai})`, '');

export function DialogIstilah({ buka, opsi, saatPilih, saatTutup }: PropsIstilah) {
  const [cari, setCari] = useState('');
  const kata = cari.trim().toLowerCase();
  const saran = opsi.filter(o => !kata || o.label.toLowerCase().includes(kata)).slice(0, BATAS_SARAN);
  return (
    <DialogPemilih judul="Sisip istilah" keterangan="Istilah glosarium; teks yang sedang dipilih dipakai sebagai teks tampilan."
      buka={buka} saatTutup={() => { setCari(''); saatTutup(); }} cari={cari} setCari={setCari}>
      {saran.map(o => (
        <Button key={o.nilai} type="button" variant="outline" size="sm" onClick={() => { setCari(''); saatPilih(o.nilai, teksIstilah(o)); }}>{o.label}</Button>
      ))}
    </DialogPemilih>
  );
}

interface PropsPemilih {
  judul: string; keterangan: string; buka: boolean; saatTutup: () => void;
  cari: string; setCari: (cari: string) => void; children: React.ReactNode;
}

function DialogPemilih({ judul, keterangan, buka, saatTutup, cari, setCari, children }: PropsPemilih) {
  return (
    <Dialog open={buka} onOpenChange={terbuka => { if (!terbuka) saatTutup(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{judul}</DialogTitle>
          <DialogDescription>{keterangan}</DialogDescription>
        </DialogHeader>
        <Input aria-label={`Cari: ${judul}`} placeholder="Cari…" value={cari} onChange={e => setCari(e.target.value)} autoFocus />
        <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
