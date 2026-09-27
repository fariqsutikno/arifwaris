// Layar kelola peran (khusus admin): tabel nama+email+peran dari repo.akun.daftarPeran(), form untuk memberi peran
// lewat email (repo.akun.aturPeran), ubah peran langsung di baris, dan "Cabut" per baris (window.confirm). Baris admin
// sendiri tidak bisa diubah/dicabut supaya admin tidak mengunci diri sendiri (database juga menolak). Galat aturPeran
// (mis. email tak dikenal) ditampilkan lewat pesanGalat; tabel tidak diubah sebelum aturPeran berhasil.
import { useEffect, useState } from 'react';
import { type Peran } from '@waris/content';
import type { PeranPengguna } from '@waris/data';
import { usePortal } from '../repo';
import { pesanGalat } from '../pesanGalat';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DAFTAR_PERAN: Peran[] = ['admin', 'penulis', 'reviewer'];
const LABEL_PERAN: Record<Peran, string> = { admin: 'Admin', penulis: 'Penulis', reviewer: 'Reviewer' };
const KETERANGAN_PERAN: Record<Peran, string> = {
  penulis: 'menulis & mengajukan draf',
  reviewer: 'memeriksa & menerbitkan revisi orang lain',
  admin: 'semua, termasuk mengatur peran',
};
const ALASAN_DIRI_SENDIRI = 'Peran Anda sendiri tidak bisa diubah dari sini.';

export function KelolaPeran() {
  const { repo, sesi } = usePortal();
  const [daftar, setDaftar] = useState<PeranPengguna[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [peranBaru, setPeranBaru] = useState<Peran>('penulis');
  const [sibuk, setSibuk] = useState(false);

  function muatUlang() {
    return repo.akun.daftarPeran().then(setDaftar);
  }

  useEffect(() => {
    muatUlang().catch(e => setGalat(pesanGalat(e)));
  }, [repo]);

  async function atur(emailTujuan: string, peran: Peran | null, pesanSukses: string) {
    setGalat(null);
    setSukses(null);
    setSibuk(true);
    try {
      await repo.akun.aturPeran(emailTujuan, peran);
      await muatUlang();
      setSukses(pesanSukses);
      return true;
    } catch (e) {
      setGalat(pesanGalat(e));
      return false;
    } finally {
      setSibuk(false);
    }
  }

  async function beriPeran() {
    const tujuan = email.trim();
    if (await atur(tujuan, peranBaru, `${tujuan} sekarang ${LABEL_PERAN[peranBaru]}.`)) setEmail('');
  }

  async function ubahPeran(baris: PeranPengguna, peran: Peran) {
    if (peran === baris.peran) return;
    await atur(baris.email, peran, `${baris.email} sekarang ${LABEL_PERAN[peran]}.`);
  }

  async function cabut(baris: PeranPengguna) {
    if (!window.confirm(`Cabut peran ${baris.email}? Akun ini tidak bisa lagi membuka portal.`)) return;
    await atur(baris.email, null, `Peran ${baris.email} dicabut.`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Peran</h1>
      {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
      {sukses ? <Alert role="status"><AlertDescription>{sukses}</AlertDescription></Alert> : null}
      <Card>
        <CardHeader>
          <CardTitle>Beri peran</CardTitle>
          <CardDescription>Pemilik email harus sudah pernah masuk ke portal dengan Google sekali.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); void beriPeran(); }}>
            <Label className="grid min-w-60 flex-1 gap-1.5">
              Email
              <Input type="email" value={email} placeholder="nama@contoh.id" onChange={event => setEmail(event.target.value)} />
            </Label>
            <Label className="grid gap-1.5">
              Peran
              <NativeSelect value={peranBaru} onChange={event => setPeranBaru(event.target.value as Peran)}>
                {DAFTAR_PERAN.map(p => <NativeSelectOption key={p} value={p}>{LABEL_PERAN[p]}: {KETERANGAN_PERAN[p]}</NativeSelectOption>)}
              </NativeSelect>
            </Label>
            <Button type="submit" disabled={sibuk || !email.trim()}>Beri peran</Button>
          </form>
        </CardContent>
      </Card>
      {!daftar && !galat ? <Skeleton aria-busy="true" className="h-40" /> : null}
      {daftar ? (
        <Card className="py-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Peran</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {daftar.map(baris => {
                const diriSendiri = baris.userId === sesi.userId;
                return (
                  <TableRow key={baris.userId}>
                    <TableCell>{baris.nama ?? '—'}{diriSendiri ? <span className="text-muted-foreground"> (Anda)</span> : null}</TableCell>
                    <TableCell>{baris.email}</TableCell>
                    <TableCell>
                      <NativeSelect size="sm" aria-label={`Peran ${baris.email}`} value={baris.peran} disabled={sibuk || diriSendiri}
                        title={diriSendiri ? ALASAN_DIRI_SENDIRI : undefined}
                        onChange={event => void ubahPeran(baris, event.target.value as Peran)}>
                        {DAFTAR_PERAN.map(p => <NativeSelectOption key={p} value={p}>{LABEL_PERAN[p]}</NativeSelectOption>)}
                      </NativeSelect>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => void cabut(baris)} disabled={sibuk || diriSendiri}
                        title={diriSendiri ? ALASAN_DIRI_SENDIRI : undefined}>Cabut</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : null}
    </div>
  );
}
