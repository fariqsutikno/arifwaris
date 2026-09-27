// Perender form satu jenis konten dari FORM_KONTEN. Menerima NilaiForm + opsi runtime (modul, kelompok FAQ, istilah);
// tiap perubahan menyerahkan NilaiForm baru ke induk (EditorEntri) — tidak ada validasi di sini, itu tugas dariNilaiForm.
// Galat per bidang (galatBidang) tampil tepat di bawah bidangnya. Field Arab: dir="rtl" lang="ar".
import type { ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { BarisAhwal, ContohKasus, JenisKonten } from '@waris/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { FORM_KONTEN, type Bidang, type SumberOpsi } from '../editor/formulir';
import type { NilaiBidang, NilaiForm, NilaiPilihanKuis } from '../editor/nilaiForm';
import { EditorKasus } from './EditorKasus';

export interface Opsi { nilai: string; label: string }
export type OpsiRuntime = Record<SumberOpsi, Opsi[]>;

interface Props {
  jenis: JenisKonten;
  form: NilaiForm;
  saatUbah: (form: NilaiForm) => void;
  bacaSaja: boolean;
  galatBidang: Record<string, string>;
  opsi: OpsiRuntime;
}

export function FormKonten({ jenis, form, saatUbah, bacaSaja, galatBidang, opsi }: Props) {
  const ubah = (jalur: string, nilai: NilaiBidang) => saatUbah({ ...form, nilai: { ...form.nilai, [jalur]: nilai } });
  return (
    <div className="grid gap-6">
      {FORM_KONTEN[jenis].map((bagian, i) => {
        const aktif = !bagian.objekOpsional || form.aktif[bagian.objekOpsional];
        return (
          <section key={bagian.judul ?? i} className="grid gap-4">
            {bagian.judul ? (
              <div className="flex items-center justify-between gap-2 border-b pb-2">
                <h2 className="font-semibold">{bagian.judul}</h2>
                {bagian.objekOpsional ? (
                  <Label className="flex items-center gap-2 text-sm font-normal">
                    <input type="checkbox" checked={!!aktif} disabled={bacaSaja}
                      onChange={e => saatUbah({ ...form, aktif: { ...form.aktif, [bagian.objekOpsional!]: e.target.checked } })} />
                    Ada {bagian.judul.toLowerCase()}
                  </Label>
                ) : null}
              </div>
            ) : null}
            {aktif ? bagian.bidang.map(bidang => (
              <BidangForm key={bidang.jalur} bidang={bidang} nilai={form.nilai[bidang.jalur]} saatUbah={nilai => ubah(bidang.jalur, nilai)}
                bacaSaja={bacaSaja} galat={galatBidang[bidang.jalur]} opsi={bidang.sumberOpsi ? opsi[bidang.sumberOpsi] : undefined} />
            )) : null}
          </section>
        );
      })}
    </div>
  );
}

interface PropsBidang {
  bidang: Bidang; nilai: NilaiBidang | undefined; saatUbah: (nilai: NilaiBidang) => void;
  bacaSaja: boolean; galat: string | undefined; opsi: Opsi[] | undefined;
}

function BidangForm({ bidang, nilai, saatUbah, bacaSaja, galat, opsi }: PropsBidang) {
  const arah = bidang.arab ? { dir: 'rtl' as const, lang: 'ar' } : {};
  const teks = typeof nilai === 'string' ? nilai : '';
  const label = bidang.opsional ? `${bidang.label} (opsional)` : bidang.label;
  switch (bidang.jenis) {
    case 'kasus':
      return <Bungkus galat={galat}><EditorKasus nilai={nilai as ContohKasus} saatUbah={saatUbah} bacaSaja={bacaSaja} /></Bungkus>;
    case 'barisAhwal':
      return <Bungkus galat={galat}><EditorBarisAhwal label={label} nilai={nilai as BarisAhwal[]} saatUbah={saatUbah} bacaSaja={bacaSaja} /></Bungkus>;
    case 'pilihanKuis':
      return <Bungkus galat={galat}><EditorPilihanKuis label={label} nilai={nilai as NilaiPilihanKuis} saatUbah={saatUbah} bacaSaja={bacaSaja} /></Bungkus>;
    case 'centang':
      return (
        <Bungkus galat={galat}>
          <Label className="flex items-center gap-2">
            <input type="checkbox" checked={nilai === true} disabled={bacaSaja} onChange={e => saatUbah(e.target.checked)} />{label}
          </Label>
        </Bungkus>
      );
    default:
      return (
        <Bungkus galat={galat} bantuan={bidang.bantuan}>
          <Label className="grid gap-1.5">{label}{masukan()}</Label>
        </Bungkus>
      );
  }

  function masukan(): ReactNode {
    const galatAria = { 'aria-invalid': galat ? true : undefined };
    if ((bidang.jenis === 'pilihan' || bidang.jenis === 'angka') && (bidang.opsi || opsi) && !bidang.bolehBaru) {
      const daftar = opsi ?? bidang.opsi!.map(o => ({ nilai: o, label: o }));
      const adaNilai = daftar.some(o => o.nilai === teks);
      return (
        <NativeSelect className="w-full" value={teks} disabled={bacaSaja} onChange={e => saatUbah(e.target.value)} {...galatAria}>
          {!adaNilai ? <NativeSelectOption value={teks}>{teks === '' ? '— pilih —' : teks}</NativeSelectOption> : null}
          {daftar.map(o => <NativeSelectOption key={o.nilai} value={o.nilai}>{o.label}</NativeSelectOption>)}
        </NativeSelect>
      );
    }
    if (bidang.bolehBaru) {
      const idDaftar = `opsi-${bidang.jalur}`;
      return (
        <>
          <Input list={idDaftar} value={teks} readOnly={bacaSaja} onChange={e => saatUbah(e.target.value)} {...galatAria} />
          <datalist id={idDaftar}>{(opsi ?? []).map(o => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}</datalist>
        </>
      );
    }
    if (bidang.jenis === 'teksPanjang' || bidang.jenis === 'markdownBlok' || bidang.jenis === 'markdownPotongan') {
      const baris = bidang.jenis === 'markdownBlok' ? 14 : bidang.jenis === 'teksPanjang' ? 3 : 2;
      const kelas = bidang.jenis === 'markdownBlok' ? 'font-mono text-sm' : undefined;
      return <Textarea rows={baris} className={kelas} value={teks} readOnly={bacaSaja} onChange={e => saatUbah(e.target.value)} {...arah} {...galatAria} />;
    }
    const tipe = bidang.jenis === 'tautan' ? 'url' : 'text';
    const mode = bidang.jenis === 'angka' ? 'numeric' as const : undefined;
    return <Input type={tipe} inputMode={mode} value={teks} readOnly={bacaSaja} onChange={e => saatUbah(e.target.value)} {...arah} {...galatAria} />;
  }
}

function Bungkus({ galat, bantuan, children }: { galat: string | undefined; bantuan?: string | undefined; children: ReactNode }) {
  return (
    <div className="grid gap-1" data-galat={galat ? '' : undefined}>
      {children}
      {bantuan ? <p className="text-xs text-muted-foreground">{bantuan}</p> : null}
      {galat ? <p className="text-sm text-destructive">{galat}</p> : null}
    </div>
  );
}

function EditorPilihanKuis({ label, nilai, saatUbah, bacaSaja }: { label: string; nilai: NilaiPilihanKuis; saatUbah: (n: NilaiPilihanKuis) => void; bacaSaja: boolean }) {
  const ubahTeks = (indeks: number, teks: string) => saatUbah({ ...nilai, daftar: nilai.daftar.map((t, i) => (i === indeks ? teks : t)) });
  const hapus = (indeks: number) => saatUbah({
    daftar: nilai.daftar.filter((_, i) => i !== indeks),
    benar: nilai.benar === indeks ? 0 : nilai.benar > indeks ? nilai.benar - 1 : nilai.benar,
  });
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {nilai.daftar.map((teks, indeks) => (
        <div key={indeks} className="flex items-center gap-2">
          <input type="radio" name="jawaban-benar" aria-label={`Pilihan ${indeks + 1} benar`} checked={nilai.benar === indeks}
            disabled={bacaSaja} onChange={() => saatUbah({ ...nilai, benar: indeks })} />
          <Input aria-label={`Pilihan ${indeks + 1}`} value={teks} readOnly={bacaSaja} onChange={e => ubahTeks(indeks, e.target.value)} />
          {!bacaSaja ? (
            <Button type="button" size="icon-sm" variant="ghost" aria-label={`Hapus pilihan ${indeks + 1}`} disabled={nilai.daftar.length <= 2}
              onClick={() => hapus(indeks)}><Trash2 /></Button>
          ) : null}
        </div>
      ))}
      {!bacaSaja ? (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => saatUbah({ ...nilai, daftar: [...nilai.daftar, ''] })}>
          <Plus /> Tambah pilihan
        </Button>
      ) : null}
      <p className="text-xs text-muted-foreground">Tandai bulatan di pilihan yang benar.</p>
    </fieldset>
  );
}

// Nilai sakelar tiga keadaan pada `cocok`: kosong = tidak dicocokkan (field dihapus).
const TIGA_KEADAAN = [{ nilai: '', label: 'abaikan' }, { nilai: 'ya', label: 'ya' }, { nilai: 'tidak', label: 'tidak' }];
const keTiga = (b: boolean | undefined) => (b === undefined ? '' : b ? 'ya' : 'tidak');
const dariTiga = (s: string) => (s === '' ? undefined : s === 'ya');
// fardh: '' = tidak dicocokkan, '-' = cocok bila TIDAK dapat fardh (null).
const keFardh = (f: string | null | undefined) => (f === undefined ? '' : f === null ? '-' : f);
const dariFardh = (s: string) => (s === '' ? undefined : s === '-' ? null : s);

function EditorBarisAhwal({ label, nilai, saatUbah, bacaSaja }: { label: string; nilai: BarisAhwal[]; saatUbah: (n: BarisAhwal[]) => void; bacaSaja: boolean }) {
  const ubah = (indeks: number, baris: BarisAhwal) => saatUbah(nilai.map((b, i) => (i === indeks ? rapikan(baris) : b)));
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {nilai.map((baris, indeks) => (
        <div key={indeks} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
          <p className="text-sm font-medium sm:col-span-2">Baris {indeks + 1}</p>
          <Label className="grid gap-1">Bagian<Input value={baris.bagian} readOnly={bacaSaja} onChange={e => ubah(indeks, { ...baris, bagian: e.target.value })} /></Label>
          <Label className="grid gap-1">Syarat<Input value={baris.syarat} readOnly={bacaSaja} onChange={e => ubah(indeks, { ...baris, syarat: e.target.value })} /></Label>
          <Label className="grid gap-1">Cocok: fardh
            <Input value={keFardh(baris.cocok.fardh)} readOnly={bacaSaja} placeholder="1/6, atau - bila tanpa fardh"
              onChange={e => ubah(indeks, aturCocok(baris, 'fardh', dariFardh(e.target.value.trim())))} />
          </Label>
          <Label className="grid gap-1">Cocok: kode alasan
            <Input value={baris.cocok.kodeAlasan ?? ''} readOnly={bacaSaja}
              onChange={e => ubah(indeks, aturCocok(baris, 'kodeAlasan', e.target.value || undefined))} />
          </Label>
          {(['ashabah', 'terhalang'] as const).map(kunci => (
            <Label key={kunci} className="grid gap-1">Cocok: {kunci}
              <NativeSelect className="w-full" value={keTiga(baris.cocok[kunci])} disabled={bacaSaja}
                onChange={e => ubah(indeks, aturCocok(baris, kunci, dariTiga(e.target.value)))}>
                {TIGA_KEADAAN.map(o => <NativeSelectOption key={o.nilai} value={o.nilai}>{o.label}</NativeSelectOption>)}
              </NativeSelect>
            </Label>
          ))}
          <Label className="grid gap-1">Bagian (Arab)
            <Input dir="rtl" lang="ar" value={baris.ar?.bagian ?? ''} readOnly={bacaSaja}
              onChange={e => ubah(indeks, { ...baris, ar: { bagian: e.target.value, syarat: baris.ar?.syarat ?? '' } })} />
          </Label>
          <Label className="grid gap-1">Syarat (Arab)
            <Input dir="rtl" lang="ar" value={baris.ar?.syarat ?? ''} readOnly={bacaSaja}
              onChange={e => ubah(indeks, { ...baris, ar: { bagian: baris.ar?.bagian ?? '', syarat: e.target.value } })} />
          </Label>
          {!bacaSaja ? (
            <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => saatUbah(nilai.filter((_, i) => i !== indeks))}>
              <Trash2 /> Hapus baris {indeks + 1}
            </Button>
          ) : null}
        </div>
      ))}
      {!bacaSaja ? (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => saatUbah([...nilai, { bagian: '', syarat: '', cocok: {} }])}>
          <Plus /> Tambah baris
        </Button>
      ) : null}
    </fieldset>
  );
}

/** Nilai undefined = field `cocok` itu tidak dicocokkan → dihapus, bukan disimpan sebagai undefined. */
function aturCocok<K extends keyof BarisAhwal['cocok']>(baris: BarisAhwal, kunci: K, nilai: BarisAhwal['cocok'][K] | undefined): BarisAhwal {
  const cocok = { ...baris.cocok };
  if (nilai === undefined) delete cocok[kunci];
  else cocok[kunci] = nilai;
  return { ...baris, cocok };
}

/** `ar` yang kedua kolomnya kosong dibuang, supaya isi sama dengan yang ditulis tangan. */
function rapikan(baris: BarisAhwal): BarisAhwal {
  const { ar, ...sisa } = baris;
  return ar && (ar.bagian !== '' || ar.syarat !== '') ? { ...sisa, ar } : sisa;
}
