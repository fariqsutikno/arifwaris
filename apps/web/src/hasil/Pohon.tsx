// Pohon keluarga di kanvas hasil: node per orang (warna kelompok, garis putus = tidak dapat, abu-abu = almarhum),
// garis menikah (mendatar + lingkaran) dan garis keturunan (turun), diukur dari posisi node sesungguhnya.

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { formatRupiah, namaOrang } from '../format';
import type { BentukPecahan, RingkasanHasil } from './ringkasan';
import { pecahanTeks } from './ringkasan';
import { useAtributOrang, useSorot } from './sorot';
import { tataLetak, type TataLetak } from './tataLetak';

interface Props {
  graf: GrafKeluarga;
  ringkasan: RingkasanHasil;
  urutanWafat: IdOrang[];
  bentuk: BentukPecahan;
  sedangMenebak: boolean;
  sembunyiNominal: boolean;
  saatPilih: (id: IdOrang) => void;
}

export function Pohon({ graf, ringkasan, urutanWafat, bentuk, sedangMenebak, sembunyiNominal, saatPilih }: Props) {
  const penerima = new Map(ringkasan.penerima.map(orang => [orang.id, orang]));
  const terhalang = new Map(ringkasan.terhalang.map(orang => [orang.id, orang]));
  const { langkah } = useSorot();
  const isiNode = (id: IdOrang): IsiNode => {
    const orang = graf.orang[id]!;
    const almarhum = id === graf.idPewaris || urutanWafat.includes(id);
    const dapat = penerima.get(id);
    const halang = terhalang.get(id);
    const nama = id === graf.idPewaris ? orang.nama ?? 'Almarhum' : namaOrang(graf, ringkasan.statusOrang, id);
    if (orang.penghubung) return { kelas: 'penghubung', peran: 'Sudah wafat', nama };
    if (almarhum) return { kelas: 'almarhum', peran: id === graf.idPewaris ? 'Pewaris' : 'Wafat sebelum dibagi', nama };
    if (sedangMenebak) return { kelas: dapat || halang ? `g-${(dapat ?? halang)!.kelompok}` : 'putus', peran: '', nama };
    if (dapat) return {
      kelas: `g-${dapat.kelompok}`, peran: '', nama,
      isi: <span className="dapat-node"><span className="frac">{pecahanTeks(dapat.saham, ringkasan.penyebut, bentuk)}</span>
        <span className="angka">{sembunyiNominal ? 'Rp ••••••' : formatRupiah(dapat.nominal)}</span></span>,
    };
    if (halang) return { kelas: 'putus', peran: 'Terhalang (mahjub)', nama, isi: <span className="alasan-node">{halang.alasan}</span> };
    return { kelas: 'putus', peran: '', nama, isi: <span className="alasan-node">Tidak mewarisi</span> };
  };
  return <PohonDasar graf={graf} isiNode={isiNode} saatPilih={saatPilih} redup={!!langkah} />;
}

export interface IsiNode { kelas: string; peran: string; nama: string; isi?: ReactNode }

/** Tata letak + garis pohon untuk graf apa pun; isi tiap node ditentukan pemanggil. */
export function PohonDasar({ graf, isiNode, saatPilih, redup = false }: {
  graf: GrafKeluarga; isiNode: (id: IdOrang) => IsiNode; saatPilih?: (id: IdOrang) => void; redup?: boolean;
}) {
  const letak = tataLetak(graf);
  const wadah = useRef<HTMLDivElement>(null);
  const garis = useGarisPohon(wadah, letak);
  const atribut = useAtributOrang();
  return (
    <div className="pohon-wadah">
      <div className={redup ? 'pohon redup' : 'pohon'} ref={wadah}>
        <svg className="garis-pohon" aria-hidden="true">
          <path d={garis.jalur} />
          {garis.cincin.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={5} />)}
        </svg>
        {letak.baris.map((baris, indeksBaris) => (
          <div className="pohon-baris" key={indeksBaris}>
            {baris.map(id => {
              const node = isiNode(id);
              const { className, ...pemicu } = atribut(id);
              const bisaDipilih = !!saatPilih && node.kelas !== 'penghubung';
              return (
                <button key={id} type="button" {...pemicu} className={['node-orang', node.kelas, className].filter(Boolean).join(' ')}
                  aria-label={bisaDipilih ? `${node.nama}. Lihat penjelasan` : node.nama} disabled={!bisaDipilih}
                  onClick={() => saatPilih?.(id)}>
                  <span className="peran-node">{node.peran}</span>
                  <b>{node.nama}</b>
                  {node.isi}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Ukur posisi node lalu susun jalur SVG: garis menikah antar orang tua, batang turun, dan cabang ke tiap anak. */
function useGarisPohon(wadah: React.RefObject<HTMLDivElement>, letak: TataLetak) {
  const [garis, setGaris] = useState<{ jalur: string; cincin: Array<[number, number]> }>({ jalur: '', cincin: [] });
  const kunciLetak = JSON.stringify(letak);
  useLayoutEffect(() => {
    const elemen = wadah.current;
    if (!elemen) return;
    const gambar = () => {
      const dasar = elemen.getBoundingClientRect();
      const kotak = (id: IdOrang) => {
        const node = elemen.querySelector<HTMLElement>(`[data-orang="${id}"]`);
        if (!node) return null;
        const r = node.getBoundingClientRect();
        return { kiri: r.left - dasar.left, kanan: r.right - dasar.left, atas: r.top - dasar.top, bawah: r.bottom - dasar.top,
          tengahX: (r.left + r.right) / 2 - dasar.left, tengahY: (r.top + r.bottom) / 2 - dasar.top };
      };
      let jalur = '';
      const cincin: Array<[number, number]> = [];
      const garisNikah = (a: IdOrang, b: IdOrang): [number, number] | null => {
        const [kiri, kanan] = [kotak(a), kotak(b)].sort((p, q) => (p?.tengahX ?? 0) - (q?.tengahX ?? 0));
        if (!kiri || !kanan) return null;
        const y = Math.max(kiri.tengahY, kanan.tengahY);
        jalur += `M${kiri.kanan},${y}H${kanan.kiri}`;
        const titik: [number, number] = [(kiri.kanan + kanan.kiri) / 2, y];
        cincin.push(titik);
        return titik;
      };
      for (const { orangTua, anak } of letak.keluarga) {
        const titikAwal = orangTua.length === 2 ? garisNikah(orangTua[0]!, orangTua[1]!)
          : (() => { const k = kotak(orangTua[0]!); return k ? [k.tengahX, k.bawah] as [number, number] : null; })();
        const daftarAnak = anak.map(kotak).filter((k): k is NonNullable<typeof k> => !!k);
        if (!titikAwal || daftarAnak.length === 0) continue;
        const yBatang = Math.min(...daftarAnak.map(k => k.atas)) - 22;
        const semuaX = [titikAwal[0], ...daftarAnak.map(k => k.tengahX)];
        jalur += `M${titikAwal[0]},${titikAwal[1]}V${yBatang}M${Math.min(...semuaX)},${yBatang}H${Math.max(...semuaX)}`;
        for (const k of daftarAnak) jalur += `M${k.tengahX},${yBatang}V${k.atas}`;
      }
      for (const [a, b] of letak.pasanganSaja) garisNikah(a, b);
      setGaris({ jalur, cincin });
    };
    gambar();
    const pengamat = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(gambar);
    pengamat?.observe(elemen);
    return () => pengamat?.disconnect();
  }, [wadah, kunciLetak]);
  return garis;
}
