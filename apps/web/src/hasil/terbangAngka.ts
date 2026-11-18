// Angka terbang: dari rumus/keterangan kotak ke sel tabel, supaya terlihat isi tabel berasal dari langkah itu.
// Sel tujuan disembunyikan sampai angkanya mendarat; dibatalkan (sel langsung tampil) bila langkah berganti atau gerak dikurangi.

const TERBANG_MS = 900;
const JEDA_ANTAR_ANGKA_MS = 120;
const TOTAL_JEDA_MS = 600;
const TINGGI_LENGKUNG_PX = 50;

export interface PenerbanganAngka { sumber: HTMLElement | null; sasaran: HTMLElement }

/** Mengembalikan fungsi pembatal; sel yang belum didarati langsung ditampilkan. */
export function terbangkanAngka(daftar: PenerbanganAngka[], gerakKurang: boolean): () => void {
  const sisa = new Set<() => void>();
  daftar.forEach(({ sumber, sasaran }, urutan) => {
    const tampilkan = () => { sasaran.style.visibility = ''; };
    if (!sumber || gerakKurang || !sasaran.animate) return;
    sasaran.style.visibility = 'hidden';
    const dari = sumber.getBoundingClientRect(), ke = sasaran.getBoundingClientRect();
    const chip = document.createElement('span');
    chip.className = 'angka-terbang';
    chip.textContent = sasaran.textContent?.trim() ?? '';
    document.body.append(chip);
    const titik = (kotak: DOMRect) => [kotak.left + kotak.width / 2 - chip.offsetWidth / 2, kotak.top + kotak.height / 2 - chip.offsetHeight / 2] as const;
    const [x0, y0] = titik(dari), [x1, y1] = titik(ke);
    chip.style.transform = `translate(${x0}px,${y0}px)`;
    const selesai = () => { chip.remove(); tampilkan(); sisa.delete(batal); };
    const gerak = chip.animate([
      { transform: `translate(${x0}px,${y0}px) scale(1)` },
      { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - TINGGI_LENGKUNG_PX}px) scale(1.15)`, offset: 0.5 },
      { transform: `translate(${x1}px,${y1}px) scale(.9)` },
    ], { duration: TERBANG_MS, delay: urutan * Math.min(JEDA_ANTAR_ANGKA_MS, TOTAL_JEDA_MS / daftar.length), easing: 'cubic-bezier(.5,0,.3,1)', fill: 'backwards' });
    const batal = () => { gerak.cancel(); selesai(); };
    gerak.onfinish = selesai;
    sisa.add(batal);
  });
  return () => [...sisa].forEach(batal => batal());
}
