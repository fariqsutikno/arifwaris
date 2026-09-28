// Layar web asli di dalam <iframe> (putaran 2 A3): isi tetap bagian pohon React portal (createPortal ke body iframe,
// jadi state & event jalan), tapi CSS web (token + komponen, disuntikkan sebagai teks) hanya berlaku di dalam iframe dan
// media query membaca lebar iframe, bukan jendela. Hasilnya tata letak HP/desktop persis web, tanpa bentrok dengan
// Tailwind portal. Tinggi iframe mengikuti isi; `penuh` = mengisi wadahnya (pratinjau layar penuh).
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import cssToken from '@waris/web/gaya/token.css?inline';
import cssKomponen from '@waris/web/gaya/komponen.css?inline';

const FONT_WEB = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Readex+Pro:wght@400;600;700&family=Noto+Kufi+Arabic:wght@400;600&display=swap';
const PENANDA = 'data-bingkai-web';
// Isi dirender dengan jarak tepi yang sama seperti kotak pratinjau lama; nav-bawah web tidak ada di sini.
const CSS_BINGKAI = `body{margin:0;padding:16px;padding-bottom:16px}`;

export function BingkaiWeb({ judul, lebar, penuh = false, gayaTambahan = '', children }: {
  judul: string; lebar?: number | undefined; penuh?: boolean; gayaTambahan?: string; children: ReactNode;
}) {
  const bingkai = useRef<HTMLIFrameElement>(null);
  const [badan, setBadan] = useState<HTMLElement | null>(null);
  const [tinggi, setTinggi] = useState(0);

  // Dokumen ditulis langsung (sinkron); beberapa browser mengganti dokumen about:blank awal saat 'load', jadi ditulis
  // ulang bila penandanya hilang.
  useLayoutEffect(() => {
    const iframe = bingkai.current!;
    const tulis = () => {
      const dok = iframe.contentDocument;
      if (!dok || dok.documentElement.hasAttribute(PENANDA)) return;
      dok.open();
      dok.write(`<!doctype html><html lang="id" ${PENANDA}><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT_WEB}">`
        + `<style>${cssToken}\n${cssKomponen}\n${CSS_BINGKAI}\n${gayaTambahan}</style></head><body></body></html>`);
      dok.close();
      setBadan(dok.body);
    };
    tulis();
    iframe.addEventListener('load', tulis);
    return () => iframe.removeEventListener('load', tulis);
  }, [gayaTambahan]);

  useEffect(() => {
    if (!badan || penuh) return;
    const Pengamat = badan.ownerDocument.defaultView?.ResizeObserver ?? ResizeObserver;
    const ukur = () => setTinggi(badan.ownerDocument.documentElement.scrollHeight);
    const pengamat = new Pengamat(ukur);
    pengamat.observe(badan);
    ukur();
    return () => pengamat.disconnect();
  }, [badan, penuh]);

  return (
    <>
      <iframe ref={bingkai} title={judul} className="mx-auto block border-0 bg-transparent"
        style={{ width: lebar ?? '100%', height: penuh ? '100%' : Math.max(tinggi, 120) }} />
      {badan ? createPortal(children, badan) : null}
    </>
  );
}
