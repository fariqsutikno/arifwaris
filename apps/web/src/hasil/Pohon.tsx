// Pohon keluarga di kanvas hasil: node per orang (warna kelompok, gelap = almarhum, merah bergaris = terhalang,
// garis putus = tidak mewarisi),
// garis menikah (mendatar + lingkaran) dan garis keturunan (turun), diukur dari posisi node sesungguhnya.
// Saat langkah perhitungan diputar: panah sebab-akibat berlabel (mis. "menghalangi") digambar di atas node,
// hajb tampil sebagai bagian semula yang dicoret lalu diganti, dan keterangan warna sorotan tampil di pojok.
// Aliran harta (hanya CSS, urutan = urutan penerima di ringkasan): garis tergambar, bagian tiba satu per satu.
// Mode fokus membangun tabel bertahap: node menampilkan pecahan fardh dulu, saham/nominal baru di hasil akhir.

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { buatSebutSimpul } from '../checklist';
import { formatRupiah, namaOrang } from '../format';
import { keteranganMeninggal } from '../penandaMeninggal';
import { AvatarOrang } from './AvatarOrang';
import type { BentukPecahan, RingkasanHasil } from './ringkasan';
import { pecahanTeks } from './ringkasan';
import { LegendaSorot, useAtributOrang, useSorot } from './sorot';
import { jalurDariRuas, susunBingkai, susunGaris, type Bingkai } from './garisPohon';
import { kelompokSaudara } from './saudara';
import { BATAS_PER_BARIS, jumlahPerBaris, tataLetak, type TataLetak } from './tataLetak';
import { angka, panah, t } from '../terjemah';

/** Avatar di kotak pohon; hanya tampil di pohon bergaya kaca (hero dan layar penuh), disembunyikan CSS di tempat lain. */
const UKURAN_AVATAR_NODE = 30;

interface Props {
  graf: GrafKeluarga;
  ringkasan: RingkasanHasil;
  urutanWafat: IdOrang[];
  bentuk: BentukPecahan;
  sedangMenebak: boolean;
  sembunyiNominal: boolean;
  saatPilih: (id: IdOrang) => void;
  /** Putar aliran harta: garis tergambar, lalu bagian tiba di tiap penerima. Kunci komponen berubah = putar ulang. */
  aliran?: boolean;
  /** Tombol kecil di bawah node orang itu (mis. tambah anak); tanpa ini pohon baca saja. */
  aksiNode?: (id: IdOrang) => ReactNode;
  /** Tahun meninggal bila diketahui; tanpa ini keterangan hanya "lebih dulu"/"sesudah almarhum". */
  tahunWafat?: (id: IdOrang) => number | undefined;
}

export function Pohon({ graf, ringkasan, urutanWafat, bentuk, sedangMenebak, sembunyiNominal, saatPilih, aliran, aksiNode, tahunWafat }: Props) {
  const penerima = new Map(ringkasan.penerima.map(orang => [orang.id, orang]));
  const urutan = new Map(ringkasan.penerima.map((orang, indeks) => [orang.id, indeks]));
  const terhalang = new Map(ringkasan.terhalang.map(orang => [orang.id, orang]));
  const { langkah } = useSorot();
  const sebut = buatSebutSimpul(graf);
  const isiNodeDasar = (id: IdOrang): IsiNode => {
    const orang = graf.orang[id]!;
    const almarhum = id === graf.idPewaris || urutanWafat.includes(id);
    const dapat = penerima.get(id);
    const halang = terhalang.get(id);
    const nama = id === graf.idPewaris ? orang.nama ?? t('hitung.almarhum') : namaOrang(graf, ringkasan.statusOrang, id);
    // C5-2/C5-3: simpul penghubung disebut menurut hubungannya; yang meninggal bergaris abu dengan keterangan, bukan pucat atau dicoret.
    if (orang.penghubung) return { kelas: 'penghubung', tambahan: 'meninggal', peran: keteranganMeninggal('lebihDulu', tahunWafat?.(id)), nama: sebut(id) };
    if (id === graf.idPewaris) return { kelas: 'almarhum', peran: orang.nama ? t('hitung.almarhum') : '', nama };
    if (almarhum) return { kelas: 'meninggal', peran: keteranganMeninggal('sesudah', tahunWafat?.(id)), nama };
    if (orang.statusHidup === 'wafat') return { kelas: 'meninggal', peran: keteranganMeninggal('lebihDulu', tahunWafat?.(id)), nama };
    if (sedangMenebak) return { kelas: dapat || halang ? `g-${(dapat ?? halang)!.kelompok}` : 'putus', peran: '', nama };
    const ubah = langkah?.ubah?.get(id);
    if (ubah) return { kelas: dapat ? `g-${dapat.kelompok}` : 'terhalang', peran: '', nama, isi: <UbahNode key={langkah!.ketukan} ubah={ubah} /> };
    if (dapat && langkah?.kolomTerbuka && !langkah.kolomTerbuka.has('perOrang')) {
      const bagianTerbuka = langkah.kolomTerbuka.has('bagian') && (langkah.kolom !== 'bagian' || !langkah.terungkap || langkah.terungkap.has(id));
      return { kelas: `g-${dapat.kelompok}`, peran: '', nama, isi: <span className="dapat-node"><span className="frac">{bagianTerbuka ? bagianFardh(dapat) : '?'}</span></span> };
    }
    if (dapat) return {
      kelas: `g-${dapat.kelompok}`, peran: '', nama, urut: urutan.get(id)!,
      isi: <span className="dapat-node"><span className="frac">{pecahanTeks(dapat.saham, ringkasan.penyebut, bentuk)}</span>
        <span className="angka">{sembunyiNominal ? t('hitung.rp') : formatRupiah(dapat.nominal)}</span></span>,
    };
    if (halang) return { kelas: 'terhalang', peran: t('hitung.terhalang'), nama, isi: <span className="alasan-node">{halang.alasan}</span> };
    return { kelas: 'putus', peran: '', nama, isi: <span className="alasan-node">{t('hitung.tidak_mewarisi')}</span> };
  };
  const isiNode = (id: IdOrang): IsiNode => {
    const aksi = aksiNode?.(id);
    return aksi ? { ...isiNodeDasar(id), aksi } : isiNodeDasar(id);
  };
  return <PohonDasar graf={graf} isiNode={isiNode} saatPilih={saatPilih} redup={!!langkah} aliran={!!aliran && !langkah} />;
}

/** Bagian sebelum dijadikan saham: "1/8", "1/6 + sisa", atau "sisa". */
const bagianFardh = ({ fardh, ashabah }: { fardh?: { n: bigint; d: bigint }; ashabah: boolean }) =>
  fardh ? `${angka(`${fardh.n}/${fardh.d}`)}${ashabah ? t('hitung.sisa') : ''}` : t('hitung.sisa_2');

function UbahNode({ ubah }: { ubah: { dari: string; menjadi: string } }) {
  return <span className="ubah-node"><s>{ubah.dari}</s><span aria-hidden="true">{panah()}</span><b>{ubah.menjadi}</b></span>;
}

export interface IsiNode { /** Urutan tiba bagian pada aliran harta (indeks penerima); tanpa ini node hanya memudar masuk. */ urut?: number; kelas: string; /** Kelas tambahan yang tidak dipakai logika pohon (mis. gaya menurut keadaan). */ tambahan?: string; peran: string; nama: string; isi?: ReactNode; /** Tombol kecil di pojok node (mis. hapus); node jadi kotak biasa, bukan tombol. */ aksi?: ReactNode; /** Simpul bukan orang (mis. ringkasan saudara): tanpa avatar. */ tanpaAvatar?: boolean }

/** Tata letak + garis pohon untuk graf apa pun; isi tiap node ditentukan pemanggil. */
export function PohonDasar({ graf, isiNode, saatPilih, redup = false, aliran = false, maksPerBaris = BATAS_PER_BARIS, pilihPenghubung = false, labelPilih, bisaPilih, bingkaiSaudara = true }: {
  graf: GrafKeluarga; isiNode: (id: IdOrang) => IsiNode; saatPilih?: (id: IdOrang) => void; redup?: boolean; aliran?: boolean;
  /** Batas node per baris tampilan; panggung sempit memakai batas lebih kecil. */
  maksPerBaris?: number;
  /** Penghubung (orang tanpa nama buatan sistem) ikut bisa dipilih, mis. untuk diberi nama. */
  pilihPenghubung?: boolean;
  /** Label tombol node bila bisa dipilih; bawaan: "lihat penjelasan". */
  labelPilih?: (nama: string) => string;
  /** Menyaring simpul yang bisa dipilih (bawaan semua); yang tidak lolos tampil sebagai kotak biasa, bukan tombol. */
  bisaPilih?: (id: IdOrang) => boolean;
  /** Bingkai putus-putus berlabel (kandung, seayah, seibu) di sekitar saudara pewaris; mati untuk pohon mungil. */
  bingkaiSaudara?: boolean;
}) {
  const letak = tataLetak(graf);
  const wadah = useRef<HTMLDivElement>(null);
  const garis = useGarisPohon(wadah, letak, bingkaiSaudara ? kelompokSaudara(graf).map(k => ({ label: labelBingkai(k.jenis), anak: k.anak })) : []);
  const atribut = useAtributOrang();
  const { langkah } = useSorot();
  const panah = usePanahSorot(wadah, langkah?.panah ?? []);
  return (
    <div className="pohon-wadah">
      {redup && <LegendaSorot />}
      <div className={['pohon', redup && 'redup', aliran && 'aliran'].filter(Boolean).join(' ')} ref={wadah}>
        {garis.bingkai.map(({ kiri, atas, lebar, tinggi, label }) => (
          <div key={`${kiri}-${atas}`} className="bingkai-saudara" aria-hidden="true" style={{ left: kiri, top: atas, width: lebar, height: tinggi }}>{label && <span>{label}</span>}</div>
        ))}
        <svg className="garis-pohon" aria-hidden="true">
          <path d={garis.jalur} pathLength={1} />
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
          <div className="pohon-baris" key={indeksBaris} style={lebarMaksBaris(baris.length, maksPerBaris)}>
            {baris.map(id => {
              const node = isiNode(id);
              const { className, ...pemicu } = atribut(id);
              const bisaDipilih = !!saatPilih && (node.kelas !== 'penghubung' || pilihPenghubung) && (bisaPilih?.(id) ?? true);
              if (!bisaDipilih) {
                return (
                  <div key={id} {...pemicu} className={['node-orang', node.kelas, node.tambahan, className].filter(Boolean).join(' ')} style={styleUrut(node)} role="group" aria-label={node.nama}>
                    {node.kelas !== 'penghubung' && !node.tanpaAvatar && <AvatarOrang nama={node.nama} ukuran={UKURAN_AVATAR_NODE} />}
                    {node.peran && <span className="peran-node">{node.peran}</span>}
                    <b>{node.nama}</b>
                    {node.isi}
                    {node.aksi}
                  </div>
                );
              }
              const tombolNode = (
                <button key={id} type="button" {...pemicu} className={['node-orang', node.kelas, node.tambahan, className].filter(Boolean).join(' ')} style={styleUrut(node)}
                  aria-label={labelPilih ? labelPilih(node.nama) : t('hitung.nama_lihat_penjelasan', { nama: node.nama })}
                  onClick={() => saatPilih?.(id)}>
                  {node.kelas !== 'penghubung' && !node.tanpaAvatar && <AvatarOrang nama={node.nama} ukuran={UKURAN_AVATAR_NODE} />}
                  {node.peran && <span className="peran-node">{node.peran}</span>}
                  <b>{node.nama}</b>
                  {node.isi}
                </button>
              );
              // Tombol tidak boleh bersarang: aksi diletakkan di samping tombol node.
              return node.aksi ? <div key={id} className="node-dengan-aksi">{tombolNode}{node.aksi}</div> : tombolNode;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Satu baris yang melebihi batas dibungkus rata (jumlahPerBaris di tataLetak.ts); lebar maksimumnya dihitung dari lebar node di CSS. */
function lebarMaksBaris(jumlah: number, maks: number): CSSProperties | undefined {
  if (jumlah <= maks) return undefined;
  const perBaris = jumlahPerBaris(jumlah, maks);
  // Lebar dan jarak node adalah variabel CSS (--lebar-node, --jarak-node) supaya konteks sempit (panggung wizard) bisa memperkecilnya.
  return { maxWidth: `calc(${perBaris} * var(--lebar-node) + ${perBaris - 1} * var(--jarak-node))` };
}

const styleUrut = (node: IsiNode): CSSProperties | undefined => (node.urut === undefined ? undefined : ({ '--urut': Math.min(node.urut, 8) } as CSSProperties));

/** Skala tampil elemen (pratinjau dan layar penuh memakai transform: scale): garis digambar di ruang lokal, jadi ukuran layar dibagi skala. */
const skalaTampil = (elemen: HTMLElement) => (elemen.offsetWidth ? elemen.getBoundingClientRect().width / elemen.offsetWidth : 1) || 1;

/** Jalur panah melengkung dari tepi node asal ke tepi node tujuan (+ titik tengah untuk labelnya), diukur ulang tiap daftar panah berubah. */
function usePanahSorot(wadah: React.RefObject<HTMLDivElement>, daftarPanah: Array<[IdOrang, IdOrang, string]>) {
  const [jalur, setJalur] = useState<Array<{ jalur: string; ke: IdOrang; x: number; y: number; label: string }>>([]);
  const kunci = JSON.stringify(daftarPanah);
  useLayoutEffect(() => {
    const elemen = wadah.current;
    if (!elemen || daftarPanah.length === 0) { setJalur([]); return; }
    const dasar = elemen.getBoundingClientRect();
    const skala = skalaTampil(elemen);
    const pusat = (id: IdOrang) => {
      const node = [...elemen.querySelectorAll<HTMLElement>('[data-orang]')].find(isi => isi.dataset.orang === id);
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x: ((r.left + r.right) / 2 - dasar.left) / skala, y: ((r.top + r.bottom) / 2 - dasar.top) / skala, rx: r.width / 2 / skala, ry: r.height / 2 / skala };
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

const labelBingkai = (jenis: 'kandung' | 'sebapak' | 'seibu') =>
  jenis === 'kandung' ? t('hitung.pohon.bingkai_kandung') : jenis === 'sebapak' ? t('hitung.pohon.bingkai_seayah') : t('hitung.pohon.bingkai_seibu');

/** Ukur posisi node lalu susun jalur SVG: garis menikah antar orang tua, batang turun, dan cabang ke tiap anak. */
function useGarisPohon(wadah: React.RefObject<HTMLDivElement>, letak: TataLetak, kelompok: Array<{ label: string; anak: IdOrang[] }>) {
  const [garis, setGaris] = useState<{ jalur: string; cincin: Array<[number, number]>; bingkai: Bingkai[] }>({ jalur: '', cincin: [], bingkai: [] });
  const kunciLetak = JSON.stringify([letak, kelompok]);
  useLayoutEffect(() => {
    const elemen = wadah.current;
    if (!elemen) return;
    const gambar = () => {
      const dasar = elemen.getBoundingClientRect();
      const skala = skalaTampil(elemen);
      const kotak = (id: IdOrang) => {
        const node = elemen.querySelector<HTMLElement>(`[data-orang="${id}"]`);
        if (!node) return null;
        const r = node.getBoundingClientRect();
        return { kiri: (r.left - dasar.left) / skala, kanan: (r.right - dasar.left) / skala, atas: (r.top - dasar.top) / skala, bawah: (r.bottom - dasar.top) / skala,
          tengahX: ((r.left + r.right) / 2 - dasar.left) / skala, tengahY: ((r.top + r.bottom) / 2 - dasar.top) / skala };
      };
      const { ruas, cincin } = susunGaris(kotak, letak);
      setGaris({ jalur: jalurDariRuas(ruas), cincin, bingkai: susunBingkai(kotak, kelompok) });
    };
    gambar();
    const pengamat = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(gambar);
    pengamat?.observe(elemen);
    return () => pengamat?.disconnect();
  }, [wadah, kunciLetak]);
  return garis;
}
