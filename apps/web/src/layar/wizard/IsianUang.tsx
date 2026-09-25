// Isian uang: prefix "Rp" di dalam kotak, titik ribuan langsung muncul saat mengetik, selain digit dibuang.
// Nilai diserahkan sebagai bigint; kursor dijaga tetap setelah digit yang sama supaya mengetik di tengah tidak melompat.

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { InfoTip } from '../../ui/Tooltip';

const ANGKA_INDONESIA = new Intl.NumberFormat('id-ID');

/** 1500000n → "1.500.000"; 0n → "" supaya isian kosong menampilkan placeholder. */
export const teksRibuan = (nilai: bigint): string => (nilai === 0n ? '' : ANGKA_INDONESIA.format(nilai));

interface Props {
  id: string;
  label: string;
  nilai: bigint;
  saatUbah: (nilai: bigint) => void;
  keterangan?: ReactNode;
  /** Penjelasan panjang di balik ikon ⓘ di samping label. */
  info?: ReactNode;
  besar?: boolean;
}

export function IsianUang({ id, label, nilai, saatUbah, keterangan, info, besar }: Props) {
  const isian = useRef<HTMLInputElement>(null);
  const digitSebelumKursor = useRef<number | null>(null);

  useLayoutEffect(() => {
    const elemen = isian.current;
    if (!elemen || digitSebelumKursor.current === null || document.activeElement !== elemen) return;
    elemen.setSelectionRange(...Array(2).fill(posisiSetelahDigit(elemen.value, digitSebelumKursor.current)) as [number, number]);
    digitSebelumKursor.current = null;
  }, [nilai]);

  return (
    <div className={besar ? 'isian-uang besar' : 'isian-uang'}>
      <div className="label-isian"><label htmlFor={id}>{label}</label>{info && <InfoTip label={`Tentang ${label}`}>{info}</InfoTip>}</div>
      <div className="kotak-uang">
        <span className="prefix-uang" aria-hidden="true">Rp</span>
        <input id={id} ref={isian} inputMode="numeric" autoComplete="off" placeholder="0" value={teksRibuan(nilai)}
          {...(keterangan ? { 'aria-describedby': `${id}-ket` } : {})}
          onChange={event => {
            const { value, selectionStart } = event.target;
            digitSebelumKursor.current = value.slice(0, selectionStart ?? value.length).replace(/\D/g, '').length;
            const digit = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
            saatUbah(digit ? BigInt(digit) : 0n);
          }} />
      </div>
      {keterangan && <p className="caption-isian" id={`${id}-ket`}>{keterangan}</p>}
    </div>
  );
}

/** Posisi kursor di teks berformat tepat setelah digit ke-n. */
function posisiSetelahDigit(teks: string, jumlahDigit: number): number {
  if (jumlahDigit === 0) return 0;
  let dihitung = 0;
  for (let indeks = 0; indeks < teks.length; indeks++) {
    if (/\d/.test(teks[indeks]!)) dihitung++;
    if (dihitung === jumlahDigit) return indeks + 1;
  }
  return teks.length;
}
