// Pohon keluarga di kanvas hasil: node per orang (warna kelompok, gelap = almarhum, merah bergaris = terhalang,
// garis putus = tidak mewarisi),
// garis menikah (mendatar + lingkaran) dan garis keturunan (turun), diukur dari posisi node sesungguhnya.
// Saat langkah perhitungan diputar: panah sebab-akibat berlabel (mis. "menghalangi") digambar di atas node,
// hajb tampil sebagai bagian semula yang dicoret lalu diganti, dan keterangan warna sorotan tampil di pojok.
// Mode fokus membangun tabel bertahap: node menampilkan pecahan fardh dulu, saham/nominal baru di hasil akhir.

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { formatRupiah, namaOrang } from '../format';
import type { BentukPecahan, RingkasanHasil } from './ringkasan';
import { pecahanTeks } from './ringkasan';
import { LegendaSorot, useAtributOrang, useSorot } from './sorot';
import { tataLetak, type TataLetak } from './tataLetak';
import { angka, panah, t } from '../terjemah';

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
    const nama = id === graf.idPewaris ? orang.nama ?? t('hitung.almarhum') : namaOrang(graf, ringkasan.statusOrang, id);
    if (orang.penghubung) return { kelas: 'penghubung', peran: '', nama: t('hitung.nama_tidak_diisi', { nama }) };
    if (almarhum) return { kelas: 'almarhum', peran: id === graf.idPewaris ? t('hitung.almarhum') : t('hitung.wafat_sebelum_dibagi'), nama };
    if (sedangMenebak) return { kelas: dapat || halang ? `g-${(dapat ?? halang)!.kelompok}` : 'putus', peran: '', nama };
    const ubah = langkah?.ubah?.get(id);
    if (ubah) return { kelas: dapat ? `g-${dapat.kelompok}` : 'terhalang', peran: '', nama, isi: <UbahNode key={langkah!.ketukan} ubah={ubah} /> };
    if (dapat && langkah?.kolomTerbuka && !langkah.kolomTerbuka.has('perOrang')) {
      const bagianTerbuka = langkah.kolomTerbuka.has('bagian') && (langkah.kolom !== 'bagian' || !langkah.terungkap || langkah.terungkap.has(id));
      return { kelas: `g-${dapat.kelompok}`, peran: '', nama, isi: <span className="dapat-node"><span className="frac">{bagianTerbuka ? bagianFardh(dapat) : '?'}</span></span> };
    }
    if (dapat) return {
      kelas: `g-${dapat.kelompok}`, peran: '', nama,
      isi: <span className="dapat-node"><span className="frac">{pecahanTeks(dapat.saham, ringkasan.penyebut, bentuk)}</span>
        <span className="angka">{sembunyiNominal ? t('hitung.rp') : formatRupiah(dapat.nominal)}</span></span>,
    };
    if (halang) return { kelas: 'terhalang', peran: t('hitung.terhalang'), nama, isi: <span className="alasan-node">{halang.alasan}</span> };
    return { kelas: 'putus', peran: '', nama, isi: <span className="alasan-node">{t('hitung.tidak_mewarisi')}</span> };
  };
  return <PohonDasar graf={graf} isiNode={isiNode} saatPilih={saatPilih} redup={!!langkah} />;
}

/** Bagian sebelum dijadikan saham: "1/8", "1/6 + sisa", atau "sisa". */
const bagianFardh = ({ fardh, ashabah }: { fardh?: { n: bigint; d: bigint }; ashabah: boolean }) =>
  fardh ? `${angka(`${fardh.n}/${fardh.d}`)}${ashabah ? t('hitung.sisa') : ''}` : t('hitung.sisa_2');

function UbahNode({ ubah }: { ubah: { dari: string; menjadi: string } }) {
  return <span className="ubah-node"><s>{ubah.dari}</s><span aria-hidden="true">{panah()}</span><b>{ubah.menjadi}</b></span>;
}

export interface IsiNode { kelas: string; peran: string; nama: string; isi?: ReactNode; /** Tombol kecil di pojok node (mis. hapus); node jadi kotak biasa, bukan tombol. */ aksi?: ReactNode }

/** Tata letak + garis pohon untuk graf apa pun; isi tiap node ditentukan pemanggil. */
export function PohonDasar({ graf, isiNode, saatPilih, redup = false }: {
  graf: GrafKeluarga; isiNode: (id: IdOrang) => IsiNode; saatPilih?: (id: IdOrang) => void; redup?: boolean;
}) {
  const letak = tataLetak(graf);
  const wadah = useRef<HTMLDivElement>(null);
  const garis = useGarisPohon(wadah, letak);
  const atribut = useAtributOrang();
  const { langkah } = useSorot();
  const panah = usePanahSorot(wadah, langkah?.panah ?? []);
  return (
    <div className="pohon-wadah">
      {redup && <LegendaSorot />}
      <div className={redup ? 'pohon redup' : 'pohon'} ref={wadah}>
        <svg className="garis-pohon" aria-hidden="true">
          <path d={garis.jalur} />
          {garis.cincin.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={5} />)}
        </svg>
        {panah.length > 0 && (
          <svg className="panah-pohon" aria-hidden="true" key={langkah?.ketukan}>
            <defs><marker id="ujung-panah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" /></marker></defs>
            {panah.map(({ jalur }) => <path key={jalur} d={jalur} pathLength={1} markerEnd="url(#ujung-panah)" />)}
          </svg>
        )}
        {/* Beberapa penyebab ke orang yang sama cukup satu label. */}
        {panah.filter((isi, urutan) => panah.findIndex(lain => lain.ke === isi.ke && lain.label === isi.label) === urutan)
          .map(({ jalur, x, y, label }) => <span key={`${langkah?.ketukan}${jalur}`} className="label-panah" style={{ left: x, top: y }}>{label}</span>)}
        {letak.baris.map((baris, indeksBaris) => (
          <div className="pohon-baris" key={indeksBaris}>
            {baris.map(id => {
              const node = isiNode(id);
              const { className, ...pemicu } = atribut(id);
              const bisaDipilih = !!saatPilih && node.kelas !== 'penghubung';
              if (!saatPilih) {
                return (
                  <div key={id} {...pemicu} className={['node-orang', node.kelas, className].filter(Boolean).join(' ')} role="group" aria-label={node.nama}>
                    {node.peran && <span className="peran-node">{node.peran}</span>}
                    <b>{node.nama}</b>
                    {node.isi}
                    {node.aksi}
                  </div>
                );
              }
              return (
                <button key={id} type="button" {...pemicu} className={['node-orang', node.kelas, className].filter(Boolean).join(' ')}
                  aria-label={bisaDipilih ? t('hitung.nama_lihat_penjelasan', { nama: node.nama }) : node.nama} disabled={!bisaDipilih}
                  onClick={() => saatPilih?.(id)}>
                  {node.peran && <span className="peran-node">{node.peran}</span>}
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

/** Jalur panah melengkung dari tepi node asal ke tepi node tujuan (+ titik tengah untuk labelnya), diukur ulang tiap daftar panah berubah. */
function usePanahSorot(wadah: React.RefObject<HTMLDivElement>, daftarPanah: Array<[IdOrang, IdOrang, string]>) {
  const [jalur, setJalur] = useState<Array<{ jalur: string; ke: IdOrang; x: number; y: number; label: string }>>([]);
  const kunci = JSON.stringify(daftarPanah);
  useLayoutEffect(() => {
    const elemen = wadah.current;
    if (!elemen || daftarPanah.length === 0) { setJalur([]); return; }
    const dasar = elemen.getBoundingClientRect();
    const pusat = (id: IdOrang) => {
      const node = [...elemen.querySelectorAll<HTMLElement>('[data-orang]')].find(isi => isi.dataset.orang === id);
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x: (r.left + r.right) / 2 - dasar.left, y: (r.top + r.bottom) / 2 - dasar.top, rx: r.width / 2, ry: r.height / 2 };
    };
    setJalur(daftarPanah.flatMap(([dari, ke, label]) => {
      const a = pusat(dari);
      const b = pusat(ke);
      if (!a || !b) return [];
      // Mulai dan berhenti di tepi kotak node (bukan di tengahnya), lalu lengkungkan sedikit supaya tidak menimpa garis keluarga.
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const tepi = (kotak: typeof a, arah: number) => Math.min(kotak.rx / Math.abs(dx || 1e-6), kotak.ry / Math.abs(dy || 1e-6)) * arah;
      const ta = tepi(a, 1);
      const tb = tepi(b, 1);
      const x1 = a.x + dx * ta; const y1 = a.y + dy * ta;
      const x2 = b.x - dx * tb; const y2 = b.y - dy * tb;
      const lengkung = 0.2;
      const cx = (x1 + x2) / 2 - (y2 - y1) * lengkung;
      const cy = (y1 + y2) / 2 + (x2 - x1) * lengkung;
      // Titik tengah kurva kuadrat (t = 0.5) untuk label panah.
      return [{ jalur: `M${x1},${y1}Q${cx},${cy} ${x2},${y2}`, ke, x: (x1 + 2 * cx + x2) / 4, y: (y1 + 2 * cy + y2) / 4, label }];
    }));
  }, [wadah, kunci]);
  return jalur;
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
      // Keluarga yang anaknya di baris sama mendapat ketinggian batang berbeda, supaya garis mendatarnya tidak menumpuk.
      const jumlahDiBaris = new Map<number, number>();
      for (const { orangTua, anak } of letak.keluarga) {
        const titikAwal = orangTua.length === 2 ? garisNikah(orangTua[0]!, orangTua[1]!)
          : (() => { const k = kotak(orangTua[0]!); return k ? [k.tengahX, k.bawah] as [number, number] : null; })();
        const daftarAnak = anak.map(kotak).filter((k): k is NonNullable<typeof k> => !!k);
        if (!titikAwal || daftarAnak.length === 0) continue;
        const atasAnak = Math.round(Math.min(...daftarAnak.map(k => k.atas)));
        const keBerapa = jumlahDiBaris.get(atasAnak) ?? 0;
        jumlahDiBaris.set(atasAnak, keBerapa + 1);
        const yBatang = atasAnak - 18 - (keBerapa % 4) * 9;
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
