// Form kasus soal hitung (ContohKasus). Menerima nilai kasus; penulis memilih pewaris, jumlah orang per ahli waris
// (dikelompokkan seperti wizard web), dan harta. Kunci jawaban (saham per kunci + ashl akhir) dihitung otomatis oleh
// kalkulator [SYF] lewat hitungHarapan web setiap kali kasus berubah, lalu ditampilkan sebagai tabel. Isian manual
// hanya di bagian lipat "Periksa manual" untuk mencocokkan kasus dari kitab; bila berbeda tampil peringatan.
import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { ContohKasus } from '@waris/content';
import { hitungHarapan, KUNCI_CONTOH } from '@waris/web/contoh';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import { aturJumlah, bacaBigint, formatRibuan, jumlahPerKunci, labelKunci, samaHarapan } from '../editor/kasus';

interface Props { nilai: ContohKasus; saatUbah: (nilai: ContohKasus) => void; bacaSaja: boolean }

const JUDUL_KELOMPOK = {
  pasangan: 'Pasangan',
  keturunan: 'Keturunan',
  leluhur: 'Orang tua & kakek-nenek',
  saudara: 'Saudara, paman & sepupu',
} as const;

const HARAPAN_KOSONG: ContohKasus['harapan'] = { saham: {}, ashlAkhir: 0n };

export function EditorKasus({ nilai, saatUbah, bacaSaja }: Props) {
  const jumlah = jumlahPerKunci(nilai.ahliWaris);
  const daftarKunci = KUNCI_CONTOH.filter(({ hanyaUntuk }) => !hanyaUntuk || hanyaUntuk === nilai.pewaris);
  const hasilHitung = useMemo(() => hitungHarapan(nilai), [nilai]);
  const berbeda = hasilHitung.ok && !samaHarapan(hasilHitung.harapan, nilai.harapan);


  // Perubahan kasus → kunci jawaban ikut dihitung ulang; yang gagal dikosongkan supaya tidak tersimpan kunci basi.
  function ubahKasus(kasus: Omit<ContohKasus, 'harapan'>) {
    const hasil = hitungHarapan({ ...kasus, harapan: HARAPAN_KOSONG });
    saatUbah({ ...kasus, harapan: hasil.ok ? hasil.harapan : HARAPAN_KOSONG });
  }
  const ubahSaham = (kunci: string, saham: bigint) =>
    saatUbah({ ...nilai, harapan: { ...nilai.harapan, saham: { ...nilai.harapan.saham, [kunci]: saham } } });
  const kunciSaham = [...new Set([...Object.keys(jumlah), ...Object.keys(nilai.harapan.saham)])];

  return (
    <fieldset className="grid gap-4 rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">Kasus</legend>
      <div className="flex flex-wrap gap-4">
        <Label className="grid gap-1.5">Pewaris
          <NativeSelect value={nilai.pewaris} disabled={bacaSaja}
            onChange={e => ubahKasus({ ...nilai, pewaris: e.target.value as 'L' | 'P' })}>
            <NativeSelectOption value="L">Laki-laki</NativeSelectOption>
            <NativeSelectOption value="P">Perempuan</NativeSelectOption>
          </NativeSelect>
        </Label>
        <Label className="grid gap-1.5">Harta
          <InputRupiah nilai={nilai.harta} bacaSaja={bacaSaja} saatUbah={harta => ubahKasus({ ...nilai, harta })} />
        </Label>
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-medium">Ahli waris</p>
        {(Object.keys(JUDUL_KELOMPOK) as (keyof typeof JUDUL_KELOMPOK)[]).map(kelompok => {
          const anggota = daftarKunci.filter(k => k.kelompok === kelompok);
          if (anggota.length === 0) return null;
          return (
            <section key={kelompok} className="grid gap-1.5">
              <h4 className="text-xs font-medium text-muted-foreground">{JUDUL_KELOMPOK[kelompok]}</h4>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {anggota.map(({ kunci, maksimal }) => {
                  const banyak = jumlah[kunci] ?? 0;
                  const nama = labelKunci(kunci);
                  return (
                    <li key={kunci} className={cn('flex items-center justify-between gap-2 rounded-md border px-2 py-1',
                      banyak > 0 && 'border-primary/50 bg-primary/5 font-medium')}>
                      <span className="text-sm">{nama}</span>
                      <span className="flex items-center gap-1">
                        <Button type="button" size="icon-sm" variant="ghost" aria-label={`Kurangi ${nama}`} disabled={bacaSaja || banyak === 0}
                          onClick={() => ubahKasus({ ...nilai, ahliWaris: aturJumlah(nilai.ahliWaris, kunci, banyak - 1) })}><Minus /></Button>
                        <span className="w-6 text-center tabular-nums" aria-label={`Jumlah ${nama}`}>{banyak}</span>
                        <Button type="button" size="icon-sm" variant="ghost" aria-label={`Tambah ${nama}`} disabled={bacaSaja || (maksimal !== undefined && banyak >= maksimal)}
                          onClick={() => ubahKasus({ ...nilai, ahliWaris: aturJumlah(nilai.ahliWaris, kunci, banyak + 1) })}><Plus /></Button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">Hasil kalkulator (kunci jawaban)</p>
        {hasilHitung.ok ? (
          <table className="w-full max-w-md text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="py-1 font-normal">Ahli waris</th><th className="py-1 text-right font-normal">Saham</th></tr></thead>
            <tbody>
              {Object.entries(hasilHitung.harapan.saham).map(([kunci, saham]) => (
                <tr key={kunci} className="border-b last:border-0"><td className="py-1">{labelKunci(kunci)}</td><td className="py-1 text-right tabular-nums">{String(saham)}</td></tr>
              ))}
            </tbody>
            <tfoot><tr className="border-t font-medium"><td className="py-1">Ashl akhir</td><td className="py-1 text-right tabular-nums">{String(hasilHitung.harapan.ashlAkhir)}</td></tr></tfoot>
          </table>
        ) : <Alert variant="destructive"><AlertDescription>{hasilHitung.galat}</AlertDescription></Alert>}
        {berbeda ? <Alert role="status"><AlertDescription>Kunci jawaban tersimpan berbeda dari hasil kalkulator. Periksa isian manual di bawah.</AlertDescription></Alert> : null}

        <details className="rounded-md border px-3 py-2" open={berbeda || undefined}>
          <summary className="cursor-pointer text-sm">Periksa manual</summary>
          <p className="mt-2 text-xs text-muted-foreground">
            Untuk mencocokkan kasus dari kitab. Isian ini ikut diperbarui otomatis saat kasus di atas diubah.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {kunciSaham.map(kunci => (
              <Label key={kunci} className="grid gap-1.5">Saham {labelKunci(kunci)}
                <InputAngka nilai={nilai.harapan.saham[kunci] ?? 0n} bacaSaja={bacaSaja} saatUbah={saham => ubahSaham(kunci, saham)} />
              </Label>
            ))}
            <Label className="grid gap-1.5">Ashl akhir
              <InputAngka nilai={nilai.harapan.ashlAkhir} bacaSaja={bacaSaja}
                saatUbah={ashlAkhir => saatUbah({ ...nilai, harapan: { ...nilai.harapan, ashlAkhir } })} />
            </Label>
          </div>
        </details>
      </div>
    </fieldset>
  );
}

// Teks lokal supaya penulis bisa mengosongkan input sementara; nilai diteruskan hanya saat terbaca sebagai bilangan.
function InputAngka({ nilai, saatUbah, bacaSaja, format = String }: {
  nilai: bigint; saatUbah: (nilai: bigint) => void; bacaSaja: boolean; format?: (nilai: bigint) => string;
}) {
  const [teks, setTeks] = useState(format(nilai));
  useEffect(() => { if (bacaBigint(teks) !== nilai) setTeks(format(nilai)); }, [nilai]);
  return (
    <Input inputMode="numeric" value={teks} readOnly={bacaSaja} aria-invalid={bacaBigint(teks) === null}
      onChange={e => {
        const angka = bacaBigint(e.target.value);
        setTeks(angka === null ? e.target.value : format(angka));
        if (angka !== null) saatUbah(angka);
      }} />
  );
}

function InputRupiah(props: { nilai: bigint; saatUbah: (nilai: bigint) => void; bacaSaja: boolean }) {
  return (
    <span className="relative flex items-center">
      <span aria-hidden className="pointer-events-none absolute left-3 text-sm text-muted-foreground">Rp</span>
      <span className="w-full [&_input]:pl-9"><InputAngka {...props} format={formatRibuan} /></span>
    </span>
  );
}
