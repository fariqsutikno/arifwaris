// Tombol Setujui/Kembalikan untuk satu revisi yang menunggu review. Menerima pembuat & status revisi serta dua aksi repo; tombol
// hanya tampil bila transisiRevisi mengizinkan (UI saja; database tetap penjaga). Kolom catatan baru muncul setelah
// Kembalikan diklik (wajib diisi); Setujui tidak menyimpan catatan, jadi tidak diberi kolom. Dipakai Antrean review dan editor entri (reviewer menyetujui langsung dari entri yang dibukanya).
// Soal kuis (`soalKuis`): tahap 1 = tombol Periksa bila checklist lengkap (bila belum, pesan sisa butir, bukan tombol nonaktif);
// tahap 2 (status diperiksa) = Setujui/Kembalikan untuk keilmuan/admin.
import { useState } from 'react';
import { ceklisLengkap, JUMLAH_BUTIR_CEKLIS, transisiRevisi, type StatusRevisi } from '@waris/content';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { pesanGalat } from '../pesanGalat';
import { usePortal } from '../repo';

const SEMUA_BUTIR = Array.from({ length: JUMLAH_BUTIR_CEKLIS }, (_, indeks) => indeks + 1);

interface Props {
  pembuatId: string;
  status: StatusRevisi;
  setujui: () => Promise<void>;
  kembalikan: (catatan: string) => Promise<void>;
  saatSelesai: () => void;
  /** Revisi soal kuis: aksi periksa + butir checklist yang sudah dicentang. */
  soalKuis?: { periksa: () => Promise<void>; butirDicentang: readonly number[] };
}

export function AksiReview({ pembuatId, status, setujui, kembalikan, saatSelesai, soalKuis }: Props) {
  const { sesi, peran } = usePortal();
  const [catatan, setCatatan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [mengembalikan, setMengembalikan] = useState(false);
  const pelaku = { peran, pelakuId: sesi.userId, pembuatId, status, duaTahap: soalKuis !== undefined };
  const bolehSetujui = transisiRevisi({ ...pelaku, aksi: 'setujui' }).ok;
  const butirDicentang = soalKuis?.butirDicentang ?? [];
  const bolehPeriksa = soalKuis !== undefined && transisiRevisi({ ...pelaku, aksi: 'periksa', butirDicentang: SEMUA_BUTIR }).ok;
  const tersedia = transisiRevisi({ ...pelaku, aksi: 'kembalikan', catatan: 'ada' }).ok;
  if (!bolehSetujui && !bolehPeriksa && !tersedia) return null;
  const bolehKembalikan = transisiRevisi({ ...pelaku, aksi: 'kembalikan', catatan }).ok;
  const sisaButir = JUMLAH_BUTIR_CEKLIS - new Set(butirDicentang).size;

  async function jalankan(aksi: () => Promise<void>) {
    if (sibuk) return;
    setSibuk(true);
    setGalat(null);
    try {
      await aksi();
      saatSelesai();
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="grid gap-3 border-t pt-3">
      {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
      {mengembalikan ? (
        <>
          <Label className="grid gap-1.5">
            Apa yang perlu diperbaiki?
            <Textarea autoFocus value={catatan} placeholder="Catatan ini dibaca penulis" onChange={e => setCatatan(e.target.value)} />
          </Label>
          <div className="flex flex-wrap gap-2">
            <Button disabled={sibuk || !bolehKembalikan} onClick={() => void jalankan(() => kembalikan(catatan))}>Kirim pengembalian</Button>
            <Button variant="ghost" disabled={sibuk} onClick={() => { setMengembalikan(false); setCatatan(''); }}>Batal</Button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          {bolehSetujui ? <Button disabled={sibuk} onClick={() => void jalankan(setujui)}>Setujui</Button> : null}
          {bolehPeriksa && ceklisLengkap(butirDicentang)
            ? <Button disabled={sibuk} onClick={() => void jalankan(soalKuis!.periksa)}>Periksa</Button> : null}
          {bolehPeriksa && !ceklisLengkap(butirDicentang)
            ? <p className="self-center text-sm text-muted-foreground">Centang {sisaButir} butir lagi di checklist sebelum memeriksa.</p> : null}
          {tersedia ? <Button variant="outline" disabled={sibuk} onClick={() => setMengembalikan(true)}>Kembalikan</Button> : null}
        </div>
      )}
    </div>
  );
}
