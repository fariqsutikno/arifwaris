// Catatan + tombol Setujui/Kembalikan untuk satu revisi yang diajukan. Menerima pembuat & status revisi serta dua aksi
// repo; tombol hanya tampil bila transisiRevisi mengizinkan (UI saja; database tetap penjaga), dan Kembalikan wajib
// bercatatan. Dipakai Antrean review dan editor entri (reviewer menyetujui langsung dari entri yang dibukanya).
import { useState } from 'react';
import { transisiRevisi, type StatusRevisi } from '@waris/content';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { pesanGalat } from '../pesanGalat';
import { usePortal } from '../repo';

interface Props {
  pembuatId: string;
  status: StatusRevisi;
  setujui: () => Promise<void>;
  kembalikan: (catatan: string) => Promise<void>;
  saatSelesai: () => void;
}

export function AksiReview({ pembuatId, status, setujui, kembalikan, saatSelesai }: Props) {
  const { sesi, peran } = usePortal();
  const [catatan, setCatatan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const pelaku = { peran, pelakuId: sesi.userId, pembuatId, status };
  if (!transisiRevisi({ ...pelaku, aksi: 'setujui' }).ok) return null;
  const bolehKembalikan = transisiRevisi({ ...pelaku, aksi: 'kembalikan', catatan }).ok;

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
      <Label className="grid gap-1.5">
        Catatan
        <Textarea value={catatan} placeholder="Wajib diisi bila dikembalikan" onChange={e => setCatatan(e.target.value)} />
      </Label>
      <div className="flex flex-wrap gap-2">
        <Button disabled={sibuk} onClick={() => void jalankan(setujui)}>Setujui</Button>
        <Button variant="outline" disabled={sibuk || !bolehKembalikan} onClick={() => void jalankan(() => kembalikan(catatan))}>Kembalikan</Button>
      </div>
    </div>
  );
}
