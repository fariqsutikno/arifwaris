// Layar kelola peran (khusus admin): tabel nama+email+peran dari repo.akun.daftarPeran(), form untuk
// memberi peran lewat email (repo.akun.aturPeran), dan "Cabut" per baris (window.confirm) yang menonaktifkan
// tombol untuk baris admin sendiri supaya admin tidak bisa mengunci diri sendiri. Galat aturPeran (mis. email
// tak dikenal) ditampilkan sebagai teks, tabel tidak diubah sebelum aturPeran berhasil.
import { useEffect, useState } from 'react';
import { type Peran } from '@waris/content';
import type { PeranPengguna } from '@waris/data';
import { usePortal } from '../repo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { pesanGalat } from '../pesanGalat';

const DAFTAR_PERAN: Peran[] = ['admin', 'penulis', 'reviewer'];

export function KelolaPeran() {
  const { repo, sesi } = usePortal();
  const [daftar, setDaftar] = useState<PeranPengguna[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [peranBaru, setPeranBaru] = useState<Peran>('penulis');

  function muatUlang() {
    return repo.akun.daftarPeran().then(setDaftar);
  }

  useEffect(() => {
    muatUlang().catch(e => setGalat(pesanGalat(e)));
  }, [repo]);

  async function beriPeran() {
    setGalat(null);
    try {
      await repo.akun.aturPeran(email.trim(), peranBaru);
      setEmail('');
      await muatUlang();
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  }

  async function cabut(baris: PeranPengguna) {
    if (!window.confirm(`Cabut peran ${baris.email}?`)) return;
    setGalat(null);
    try {
      await repo.akun.aturPeran(baris.email, null);
      await muatUlang();
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Peran</h1>
      {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
      <Card>
        <CardHeader><CardTitle>Beri peran</CardTitle></CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); void beriPeran(); }}>
            <Label className="grid min-w-60 flex-1 gap-1.5">
              Email
              <Input type="email" value={email} placeholder="nama@contoh.id" onChange={event => setEmail(event.target.value)} />
            </Label>
            <Label className="grid gap-1.5">
              Peran
              <NativeSelect value={peranBaru} onChange={event => setPeranBaru(event.target.value as Peran)}>
                {DAFTAR_PERAN.map(p => <NativeSelectOption key={p} value={p}>{p}</NativeSelectOption>)}
              </NativeSelect>
            </Label>
            <Button type="submit">Beri peran</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="py-0">
        <Table>
          <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Peran</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {daftar.map(baris => (
              <TableRow key={baris.userId}>
                <TableCell>{baris.nama ?? ''}</TableCell>
                <TableCell>{baris.email}</TableCell>
                <TableCell>{baris.peran}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => void cabut(baris)} disabled={baris.userId === sesi.userId}>Cabut</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
