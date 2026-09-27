// Form kasus soal hitung (ContohKasus). Menerima nilai kasus; penulis memilih pewaris, jumlah orang per ahli waris, harta,
// lalu "Hitung dengan engine" mengisi harapan (saham per kunci + ashl akhir) dari engine [SYF] lewat hitungHarapan web.
// Harapan boleh diketik manual; bila berbeda dari hasil engine tampil peringatan (tidak memblokir simpan).
import { useEffect, useMemo, useState } from 'react';
import { Calculator, Minus, Plus } from 'lucide-react';
import type { ContohKasus } from '@waris/content';
import { hitungHarapan, KUNCI_CONTOH } from '@waris/web/contoh';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { aturJumlah, bacaBigint, jumlahPerKunci, labelKunci, samaHarapan } from '../editor/kasus';

interface Props { nilai: ContohKasus; saatUbah: (nilai: ContohKasus) => void; bacaSaja: boolean }

export function EditorKasus({ nilai, saatUbah, bacaSaja }: Props) {
  const [galatHitung, setGalatHitung] = useState<string | null>(null);
  const jumlah = jumlahPerKunci(nilai.ahliWaris);
  const daftarKunci = KUNCI_CONTOH.filter(({ hanyaUntuk }) => !hanyaUntuk || hanyaUntuk === nilai.pewaris);
  const kunciSaham = [...new Set([...Object.keys(jumlah), ...Object.keys(nilai.harapan.saham)])];
  const hasilEngine = useMemo(() => hitungHarapan(nilai), [nilai]);
  const berbeda = hasilEngine.ok && !samaHarapan(hasilEngine.harapan, nilai.harapan);

  function hitung() {
    if (!hasilEngine.ok) { setGalatHitung(hasilEngine.galat); return; }
    setGalatHitung(null);
    saatUbah({ ...nilai, harapan: hasilEngine.harapan });
  }
  const ubahSaham = (kunci: string, saham: bigint) =>
    saatUbah({ ...nilai, harapan: { ...nilai.harapan, saham: { ...nilai.harapan.saham, [kunci]: saham } } });

  return (
    <fieldset className="grid gap-4 rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">Kasus</legend>
      <div className="flex flex-wrap gap-4">
        <Label className="grid gap-1.5">Pewaris
          <NativeSelect value={nilai.pewaris} disabled={bacaSaja}
            onChange={e => saatUbah({ ...nilai, pewaris: e.target.value as 'L' | 'P' })}>
            <NativeSelectOption value="L">Laki-laki</NativeSelectOption>
            <NativeSelectOption value="P">Perempuan</NativeSelectOption>
          </NativeSelect>
        </Label>
        <Label className="grid gap-1.5">Harta (rupiah)
          <InputBigint nilai={nilai.harta} bacaSaja={bacaSaja} saatUbah={harta => saatUbah({ ...nilai, harta })} />
        </Label>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">Ahli waris</p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {daftarKunci.map(({ kunci, maksimal }) => {
            const banyak = jumlah[kunci] ?? 0;
            const label = labelKunci(kunci);
            return (
              <li key={kunci} className="flex items-center justify-between gap-2 rounded-md px-2 py-1 odd:bg-muted/40">
                <span className="text-sm">{label}</span>
                <span className="flex items-center gap-1">
                  <Button type="button" size="icon-sm" variant="ghost" aria-label={`Kurangi ${label}`} disabled={bacaSaja || banyak === 0}
                    onClick={() => saatUbah({ ...nilai, ahliWaris: aturJumlah(nilai.ahliWaris, kunci, banyak - 1) })}><Minus /></Button>
                  <span className="w-6 text-center tabular-nums" aria-label={`Jumlah ${label}`}>{banyak}</span>
                  <Button type="button" size="icon-sm" variant="ghost" aria-label={`Tambah ${label}`} disabled={bacaSaja || (maksimal !== undefined && banyak >= maksimal)}
                    onClick={() => saatUbah({ ...nilai, ahliWaris: aturJumlah(nilai.ahliWaris, kunci, banyak + 1) })}><Plus /></Button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Harapan (saham)</p>
          {!bacaSaja ? <Button type="button" variant="secondary" size="sm" onClick={hitung}><Calculator /> Hitung dengan engine</Button> : null}
        </div>
        {galatHitung ? <Alert variant="destructive"><AlertDescription>Engine tidak bisa menghitung kasus ini: {galatHitung}</AlertDescription></Alert> : null}
        {berbeda ? <Alert role="status"><AlertDescription>Harapan berbeda dari hasil engine.</AlertDescription></Alert> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {kunciSaham.map(kunci => (
            <Label key={kunci} className="grid gap-1.5">Saham {labelKunci(kunci)}
              <InputBigint nilai={nilai.harapan.saham[kunci] ?? 0n} bacaSaja={bacaSaja} saatUbah={saham => ubahSaham(kunci, saham)} />
            </Label>
          ))}
          <Label className="grid gap-1.5">Ashl akhir
            <InputBigint nilai={nilai.harapan.ashlAkhir} bacaSaja={bacaSaja}
              saatUbah={ashlAkhir => saatUbah({ ...nilai, harapan: { ...nilai.harapan, ashlAkhir } })} />
          </Label>
        </div>
      </div>
    </fieldset>
  );
}

// Teks lokal supaya penulis bisa mengosongkan input sementara; nilai diteruskan hanya saat terbaca sebagai bilangan.
function InputBigint({ nilai, saatUbah, bacaSaja }: { nilai: bigint; saatUbah: (nilai: bigint) => void; bacaSaja: boolean }) {
  const [teks, setTeks] = useState(String(nilai));
  useEffect(() => { if (bacaBigint(teks) !== nilai) setTeks(String(nilai)); }, [nilai]);
  return (
    <Input inputMode="numeric" value={teks} readOnly={bacaSaja} aria-invalid={bacaBigint(teks) === null}
      onChange={e => {
        setTeks(e.target.value);
        const angka = bacaBigint(e.target.value);
        if (angka !== null) saatUbah(angka);
      }} />
  );
}
