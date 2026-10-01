// Sunting teks aplikasi langsung di layar: menampilkan layar web asli (beranda, kalkulator, hasil, belajar, …) dan
// menandai setiap teks yang berasal dari teks edukasi atau diksi (lewat buatPencocok) dengan kotak bergaris. Klik teks →
// dialog sunting Indonesia/Arab → admin langsung menerbitkan, penulis mengajukan; ajuan yang masih menunggu bisa
// disunting pembuatnya (menggantikan ajuan itu), sama dengan jalur layar daftar. Kotak digambar sebagai lapisan di atas layar, bukan dengan mengubah DOM React milik layar web.
// Panel kanan (PanelTeks) mendaftar teks di layar ini dan mencari semua teks, termasuk yang tidak tampil di layar mana
// pun (satu tampilan, putaran 2 A8). Dialog sunting menulis
// "Tampil di" (modul virtual lokasi-teks) dan pratinjau kalimatnya; tempat simpan (teks edukasi/diksi) diurus di sini.
// Layar web membaca snapshot yang terpasang (terbaru dari database, lihat Portal.tsx) ditimpa draf/ajuan yang belum
// terbit, lalu dipasang ulang tiap kali data berubah: semua tempat yang memakai teks sama ikut berubah dan tetap bergaris.
// Batas: teks yang dibaca web di konstanta tingkat modul baru berubah setelah portal dimuat ulang.
import { Component, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { bolehAbaikanRevisi, bolehPerbaruiAjuan, keJson, type IsiTeksEdukasi } from '@waris/content';
import type { RingkasanEntri, RingkasanKunciDiksi } from '@waris/data';
import { pasangSnapshot, snapshotTerpasang } from '@waris/web/sumber';
import { BingkaiWeb } from './BingkaiWeb';
import { kunciTeks, PanelTeks } from './PanelTeks';
import type { Snapshot } from '@waris/data/snapshot';
import { Beranda as BerandaWeb } from '@waris/web/layar/Beranda';
import { LangkahPewaris } from '@waris/web/layar/wizard/LangkahPewaris';
import { LangkahAhliWaris } from '@waris/web/layar/LangkahAhliWaris';
import { LangkahHarta } from '@waris/web/layar/wizard/LangkahHarta';
import { LangkahKewajiban } from '@waris/web/layar/wizard/LangkahKewajiban';
import { Hasil } from '@waris/web/layar/Hasil';
import { Belajar } from '@waris/web/belajar/Belajar';
import { Latihan } from '@waris/web/belajar/Latihan';
import { Materi } from '@waris/web/belajar/Materi';
import { Faq } from '@waris/web/belajar/Faq';
import { TanyaJawab } from '@waris/web/belajar/TanyaJawab';
import { Glosarium } from '@waris/web/belajar/Glosarium';
import { Rujukan } from '@waris/web/belajar/Rujukan';
import { Peringkat } from '@waris/web/layar/Peringkat';
import { TUR } from '@waris/web/tur';
import lokasiTeks from 'virtual:lokasi-teks';
import { kasusDariContoh } from '@waris/web/contoh';
import { Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { buatPencocok, rapikan, type PencocokTeks, type SumberTeks } from '../editor/teksLayar';
import { usePortal } from '../repo';
import { pesanGalat } from '../pesanGalat';

const tanpaAksi = () => {};
const CSS_KOTAK = `.kotak-sunting{position:absolute;padding:0;border:0;border-radius:3px;background:none;cursor:pointer;
outline:1px dashed color-mix(in srgb,var(--pink) 70%,transparent)}
.kotak-sunting:hover,.kotak-sunting:focus-visible,.kotak-sunting.disorot{background:color-mix(in srgb,var(--pink) 18%,transparent);outline-width:2px}`;
const KASUS_CONTOH = kasusDariContoh({ pewaris: 'L', ahliWaris: ['ISTRI', 'IBU', 'ANAK_LK', 'ANAK_PR'], harta: 120_000_000n, harapan: { saham: {}, ashlAkhir: 0n } });
const SLUG_MATERI_CONTOH = snapshotTerpasang().konten.find(baris => baris.jenis === 'materi')?.slug ?? '';

// Nama kelompok teks untuk manusia (awalan kunci teks edukasi / halaman diksi).
const NAMA_KELOMPOK: Record<string, string> = {
  harta: 'Langkah harta', ahli_waris: 'Nama ahli waris', wizard: 'Langkah kalkulator', selanjutnya: 'Habis ini ngapain',
  tur: 'Tur pengenalan', umum: 'Umum', hitung: 'Kalkulator', beranda: 'Beranda', belajar: 'Belajar', latihan: 'Latihan',
  akun: 'Akun', rujukan: 'Rujukan', glosarium: 'Glosarium', faq: 'FAQ', tanya_jawab: 'Tanya jawab',
};
const namaKelompok = (sumber: SumberTeks) => NAMA_KELOMPOK[sumber.kunci.split('.')[0]!] ?? 'Lainnya';

interface Bagian { id: string; judul: string; layar: () => ReactNode }
const BAGIAN: readonly Bagian[] = [
  { id: 'beranda', judul: 'Beranda', layar: () => <BerandaWeb kasusTerakhir={null} saatKeHitung={tanpaAksi} saatCoba={tanpaAksi} /> },
  { id: 'pewaris', judul: 'Kalkulator · Pewaris', layar: () => <LayarKasus>{() => <LangkahPewaris kasus={KASUS_CONTOH} saatPilih={tanpaAksi} saatGantiDanKosongkan={tanpaAksi} saatUbahNama={tanpaAksi} />}</LayarKasus> },
  { id: 'ahli-waris', judul: 'Kalkulator · Ahli waris', layar: () => (
    <LayarKasus>{(kasus, ubah) => <LangkahAhliWaris graf={kasus.graf} idMayit={kasus.graf.idPewaris} ubahGraf={f => ubah(k => ({ ...k, graf: f(k.graf) }))} />}</LayarKasus>
  ) },
  { id: 'harta', judul: 'Kalkulator · Harta & kewajiban', layar: () => (
    <LayarKasus>{(kasus, ubah) => <><LangkahHarta kasus={kasus} ubah={ubah} /><LangkahKewajiban kasus={kasus} ubah={ubah} /></>}</LayarKasus>
  ) },
  { id: 'hasil', judul: 'Hasil hitung', layar: () => <Hasil kasus={KASUS_CONTOH} idSesi="sunting-teks" tujuan="hitung" kirim={tanpaAksi} /> },
  { id: 'belajar', judul: 'Belajar', layar: () => <Belajar /> },
  { id: 'latihan', judul: 'Latihan', layar: () => <Latihan tab="hitung" kasusSekarang={null} saatKerjakan={tanpaAksi} /> },
  { id: 'materi', judul: 'Materi (contoh)', layar: () => <Materi slug={SLUG_MATERI_CONTOH} kasusSekarang={null} saatCoba={tanpaAksi} /> },
  { id: 'faq', judul: 'FAQ', layar: () => <Faq kasusSekarang={null} saatCoba={tanpaAksi} /> },
  { id: 'tanya-jawab', judul: 'Tanya jawab', layar: () => <TanyaJawab kasusSekarang={null} saatCoba={tanpaAksi} /> },
  { id: 'glosarium', judul: 'Glosarium', layar: () => <Glosarium /> },
  { id: 'rujukan', judul: 'Rujukan', layar: () => <Rujukan /> },
  { id: 'peringkat', judul: 'Peringkat (tamu)', layar: () => <Peringkat sesi={null} repo={null} /> },
  { id: 'tur', judul: 'Tur pengenalan', layar: () => <TurStatis /> },
];

/** Tur tampil sebagai sorotan di atas layar lain; di portal tiap langkahnya ditampilkan sebagai kartu biasa. */
function TurStatis() {
  return (
    <main className="halaman tumpuk">
      {Object.entries(TUR).map(([layar, langkah]) => (
        <section key={layar} className="tumpuk-rapat">
          {langkah!.map(l => <div key={l.sasaran} className="kartu tumpuk-rapat"><h3>{l.judul}</h3><p>{l.isi}</p></div>)}
        </section>
      ))}
    </main>
  );
}

type Kasus = typeof KASUS_CONTOH;
function LayarKasus({ children }: { children: (kasus: Kasus, ubah: (f: (kasus: Kasus) => Kasus) => void) => ReactNode }) {
  const [kasus, setKasus] = useState(KASUS_CONTOH);
  return <main className="halaman tumpuk">{children(kasus, setKasus)}</main>;
}

/** Kotak satu teks yang cocok, relatif terhadap wadah layar. */
interface KotakTeks { kiri: number; atas: number; lebar: number; tinggi: number; simpul: Text; sumber: SumberTeks[] }

export function EditorTeksAplikasi() {
  const { repo, peran } = usePortal();
  const [data, setData] = useState<{ entri: RingkasanEntri[]; diksi: RingkasanKunciDiksi[] } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [bagianId, setBagianId] = useState(BAGIAN[0]!.id);
  const [modeSunting, setModeSunting] = useState(true);
  const [daftarSumber, setDaftarSumber] = useState<SumberTeks[]>(sumberDariSnapshot);
  const [versiLayar, setVersiLayar] = useState(0);
  const [dipilih, setDipilih] = useState<{ sumber: SumberTeks[]; simpul: Text | null } | null>(null);
  const [diLayar, setDiLayar] = useState<string[]>([]);
  const [sorot, setSorot] = useState<string | null>(null);
  const pencocok = useMemo(() => buatPencocok(daftarSumber), [daftarSumber]);

  useEffect(() => {
    let dibatalkan = false;
    Promise.all([repo.konten.daftarEntri('teks_edukasi'), repo.diksi.daftarKunci()])
      .then(([entri, diksi]) => { if (!dibatalkan) setData({ entri, diksi }); })
      .catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo, muatUlang]);

  // asal ditangkap di dalam efek (bukan saat render) supaya benar di StrictMode; lihat Pratinjau.tsx.
  useLayoutEffect(() => {
    if (!data) return;
    const asal = snapshotTerpasang();
    pasangSnapshot(timpaBelumTerbit(asal, data));
    setDaftarSumber(sumberDariSnapshot());
    setVersiLayar(n => n + 1);
    return () => pasangSnapshot(asal);
  }, [data]);

  const bagian = BAGIAN.find(b => b.id === bagianId)!;

  const setelahSimpan = () => setMuatUlang(n => n + 1);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Pilih layar, lalu klik teks bergaris putus-putus untuk menyunting. Matikan mode sunting untuk mencoba layarnya (mis. menambah ahli waris).
      </p>
      {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
      <div className="flex flex-wrap items-center gap-2">
        <nav aria-label="Layar" className="flex flex-wrap gap-1">
          {BAGIAN.map(b => (
            <Button key={b.id} size="sm" variant={b.id === bagianId ? 'secondary' : 'ghost'} aria-current={b.id === bagianId ? 'page' : undefined}
              onClick={() => setBagianId(b.id)}>{b.judul}</Button>
          ))}
        </nav>
        <Label className="ml-auto gap-2 text-sm font-normal">
          <input type="checkbox" className="size-4 accent-primary" checked={modeSunting} onChange={e => setModeSunting(e.target.checked)} />
          Mode sunting
        </Label>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="gap-0 overflow-hidden py-0">
          <PenjagaGalat key={`${bagian.id}-${versiLayar}`}>
            <LayarBisaDisunting pencocok={pencocok} aktif={modeSunting} sorot={sorot} saatKotak={setDiLayar}
              saatPilih={(sumber, simpul) => setDipilih({ sumber, simpul })}>
              {bagian.layar()}
            </LayarBisaDisunting>
          </PenjagaGalat>
        </Card>
        <Card className="gap-2 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:overflow-auto">
          {data ? (
            <PanelTeks data={data} diLayar={diLayar} saatSorot={setSorot} saatBerubah={setelahSimpan}
              saatSunting={butir => setDipilih({ sumber: [butir], simpul: null })} />
          ) : <Skeleton className="h-24" />}
        </Card>
      </div>
      {dipilih ? (
        data ? (
          <DialogSunting pilihan={dipilih.sumber} data={data} bacaSaja={peran === 'reviewer'} layarSekarang={dipilih.simpul ? bagian.judul : undefined}
            saatTutup={() => setDipilih(null)} saatTersimpan={setelahSimpan} />
        ) : <Skeleton className="h-10" />
      ) : null}
    </div>
  );
}

function LayarBisaDisunting({ pencocok, aktif, sorot, saatKotak, saatPilih, children }: {
  pencocok: PencocokTeks; aktif: boolean; sorot: string | null; saatKotak: (kunci: string[]) => void;
  saatPilih: (sumber: SumberTeks[], simpul: Text) => void; children: ReactNode;
}) {
  // Callback ref: isi baru terpasang setelah iframe BingkaiWeb siap, jadi efek harus jalan ulang saat wadah muncul.
  const [wadah, setWadah] = useState<HTMLDivElement | null>(null);
  const [kotak, setKotak] = useState<KotakTeks[]>([]);
  // Teks yang tampil dilaporkan ke panel kanan (tanpa duplikat, urut kemunculan).
  useEffect(() => {
    saatKotak([...new Set(kotak.flatMap(k => k.sumber.map(kunciTeks)))]);
  }, [kotak, saatKotak]);

  useLayoutEffect(() => {
    const el = wadah;
    if (!el || !aktif) { setKotak([]); return; }
    let bingkai = 0;
    const ukur = () => { cancelAnimationFrame(bingkai); bingkai = requestAnimationFrame(() => setKotak(kumpulkanKotak(el, pencocok))); };
    ukur();
    const jendela = el.ownerDocument.defaultView ?? window;
    const pengamat = new jendela.MutationObserver(ukur);
    pengamat.observe(el, { subtree: true, childList: true, characterData: true });
    const pengamatUkuran = new (jendela.ResizeObserver ?? ResizeObserver)(ukur);
    pengamatUkuran.observe(el);
    return () => { pengamat.disconnect(); pengamatUkuran.disconnect(); cancelAnimationFrame(bingkai); };
  }, [pencocok, aktif, wadah]);

  return (
    // Layar web di iframe (BingkaiWeb) supaya tata letaknya persis web; kotak bergaris ikut di dalam iframe, jadi gayanya
    // CSS biasa (CSS_KOTAK), bukan Tailwind portal.
    <div className="max-h-[75vh] overflow-auto">
      <BingkaiWeb judul="Layar web yang bisa disunting" gayaTambahan={CSS_KOTAK}>
        <div style={{ position: 'relative' }}>
          <div ref={setWadah}>{children}</div>
          {kotak.map((k, i) => (
            <button key={i} type="button" aria-label={`Sunting teks: ${rapikan(k.simpul.data)}`}
              className={sorot && k.sumber.some(s => kunciTeks(s) === sorot) ? 'kotak-sunting disorot' : 'kotak-sunting'}
              style={{ left: k.kiri, top: k.atas, width: k.lebar, height: k.tinggi }}
              onClick={() => saatPilih(k.sumber, k.simpul)} />
          ))}
        </div>
      </BingkaiWeb>
    </div>
  );
}

function kumpulkanKotak(el: HTMLElement, pencocok: PencocokTeks): KotakTeks[] {
  const acuan = el.parentElement!;
  const dasar = acuan.getBoundingClientRect();
  const hasil: KotakTeks[] = [];
  const dok = el.ownerDocument;
  const penjelajah = dok.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let simpul = penjelajah.nextNode() as Text | null; simpul; simpul = penjelajah.nextNode() as Text | null) {
    const sumber = pencocok.cari(simpul.data);
    if (sumber.length === 0) continue;
    const rentang = dok.createRange();
    rentang.selectNodeContents(simpul);
    const kotak = rentang.getBoundingClientRect();
    if (kotak.width === 0 || kotak.height === 0) continue;
    hasil.push({
      kiri: kotak.left - dasar.left + acuan.scrollLeft, atas: kotak.top - dasar.top + acuan.scrollTop,
      lebar: kotak.width, tinggi: kotak.height, simpul, sumber,
    });
  }
  return hasil;
}

export function DialogSunting({ pilihan, data, bacaSaja, layarSekarang, saatTutup, saatTersimpan }: {
  pilihan: SumberTeks[]; data: { entri: RingkasanEntri[]; diksi: RingkasanKunciDiksi[] }; bacaSaja: boolean; layarSekarang?: string | undefined;
  saatTutup: () => void; saatTersimpan: () => void;
}) {
  const { repo, peran, sesi } = usePortal();
  const [indeks, setIndeks] = useState(0);
  const sumber = pilihan[indeks]!;
  const keadaan = keadaanSumber(sumber, data);
  const [teksId, setTeksId] = useState(keadaan.id);
  const [teksAr, setTeksAr] = useState(keadaan.ar ?? '');
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const menunggu = keadaan.status === 'diajukan';
  // [K2] ajuan yang menunggu disunting di tempat oleh pembuatnya (atau admin); tetap di antrean.
  const perbaruiAjuan = menunggu && !!keadaan.revisi
    && bolehPerbaruiAjuan({ peran, pelakuId: sesi.userId, pembuatId: keadaan.revisi.dibuatOleh, status: 'diajukan' });
  const terkunci = bacaSaja || (menunggu && !perbaruiAjuan);
  const berubah = teksId !== keadaan.id || teksAr !== (keadaan.ar ?? '');
  // Revisi dikembalikan boleh dibuang pembuatnya tanpa disunting; tanpa teks tayang tidak ada yang bisa dikembalikan.
  const punyaTayang = sumber.sumber === 'diksi'
    ? !!data.diksi.find(k => k.kunci === sumber.kunci)?.terbit : !!data.entri.find(e => e.slug === sumber.kunci)?.revisiTerbitId;
  const bolehBuang = !bacaSaja && keadaan.status === 'dikembalikan' && !!keadaan.revisi && punyaTayang
    && bolehAbaikanRevisi({ peran, pelakuId: sesi.userId, pembuatId: keadaan.revisi.dibuatOleh, status: 'dikembalikan' });
  // [K1] admin menerbitkan teks aplikasi langsung, tanpa antrean.
  const langsungTerbit = peran === 'admin' && !menunggu;

  function ganti(i: number) {
    const lain = keadaanSumber(pilihan[i]!, data);
    setIndeks(i);
    setTeksId(lain.id);
    setTeksAr(lain.ar ?? '');
  }

  async function buangPerubahan() {
    setSibuk(true);
    setGalat(null);
    try {
      await (sumber.sumber === 'diksi' ? repo.diksi.abaikan(keadaan.revisi!.id) : repo.editorial.abaikan(keadaan.revisi!.id));
      saatTersimpan();
      saatTutup();
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setSibuk(false);
    }
  }

  async function simpan() {
    setSibuk(true);
    setGalat(null);
    try {
      const ar = teksAr.trim() || null;
      if (perbaruiAjuan) {
        await (sumber.sumber === 'diksi'
          ? repo.diksi.perbaruiAjuan(keadaan.revisi!.id, teksId, ar)
          : repo.editorial.perbaruiAjuan(keadaan.revisi!.id, 'teks_edukasi', ar ? { id: teksId, ar } : { id: teksId }, []));
      } else if (sumber.sumber === 'diksi') {
        const revisiId = await repo.diksi.buatDraf(sumber.kunci, teksId, ar, null);
        await (langsungTerbit ? repo.diksi.terbitkanLangsung(revisiId) : repo.diksi.ajukan(revisiId));
      } else {
        const entri = data.entri.find(e => e.slug === sumber.kunci);
        if (!entri) throw new Error('Teks ini belum ada di database; minta admin menambahkannya.');
        const isi: IsiTeksEdukasi = ar ? { id: teksId, ar } : { id: teksId };
        const terakhir = entri.revisiTerakhir;
        const revisiId = terakhir?.status === 'draf' && terakhir.dibuatOleh === sesi.userId
          ? (await repo.editorial.ubahDraf(terakhir.id, 'teks_edukasi', isi, []), terakhir.id)
          : await repo.editorial.buatDraf(entri.entriId, 'teks_edukasi', isi, []);
        await (langsungTerbit ? repo.editorial.terbitkanLangsung(revisiId) : repo.editorial.ajukan(revisiId));
      }
      saatTersimpan();
      saatTutup();
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Dialog open onOpenChange={buka => { if (!buka) saatTutup(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sunting teks</DialogTitle>
          <DialogDescription>Tampil di: {teksLokasi(sumber, layarSekarang)}.</DialogDescription>
        </DialogHeader>
        {pilihan.length > 1 ? (
          <fieldset className="grid gap-1.5 text-sm">
            <legend className="mb-1 font-medium">Teks yang sama dipakai di beberapa tempat. Ubah yang mana?</legend>
            {pilihan.map((s, i) => (
              <Label key={`${s.sumber}/${s.kunci}`} className="gap-2 font-normal">
                <input type="radio" name="sumber-teks" checked={i === indeks} onChange={() => ganti(i)} />
                {teksLokasi(s, undefined)}
              </Label>
            ))}
          </fieldset>
        ) : null}
        {menunggu ? (
          <p className="text-sm text-muted-foreground">
            {perbaruiAjuan
              ? 'Perubahan teks ini sedang menunggu review. Suntingan Anda menggantikan ajuan itu, dan tetap menunggu review.'
              : 'Perubahan teks ini sedang menunggu review. Tunggu disetujui dulu sebelum menyunting lagi.'}
          </p>
        ) : null}
        {keadaan.status === 'dikembalikan' && keadaan.revisi ? (
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">
              Dikembalikan reviewer{keadaan.revisi.catatanReview ? `: ${keadaan.revisi.catatanReview}` : ''}. Perbaiki di bawah lalu ajukan lagi.
            </p>
            {bolehBuang ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" disabled={sibuk} onClick={() => void buangPerubahan()}>Buang perubahan ini</Button>
                <span className="text-sm text-muted-foreground">Kembali ke teks yang tayang tanpa menyunting.</span>
              </div>
            ) : null}
          </div>
        ) : null}
        <Label className="grid gap-1.5">
          Bahasa Indonesia
          <Textarea rows={3} value={teksId} readOnly={terkunci} onChange={e => setTeksId(e.target.value)} />
        </Label>
        {teksId.trim() ? (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="text-xs text-muted-foreground">Pratinjau: </span><PratinjauTeks teks={teksId} />
          </div>
        ) : null}
        {/\{\w+\}/.test(keadaan.id) ? (
          <p className="text-xs text-muted-foreground">Bagian bertanda kurung kurawal, mis. {'{jumlah}'}, diisi otomatis oleh aplikasi. Biarkan apa adanya.</p>
        ) : null}
        <Label className="grid gap-1.5">
          Bahasa Arab (opsional)
          <Textarea rows={3} dir="rtl" lang="ar" value={teksAr} readOnly={terkunci} onChange={e => setTeksAr(e.target.value)} />
        </Label>
        {galat ? <p role="alert" className="text-sm text-destructive">{galat}</p> : null}
        <DialogFooter>
          <Button variant="ghost" onClick={saatTutup}>Batal</Button>
          {terkunci ? null : (
            <Button disabled={!berubah || !teksId.trim() || sibuk} onClick={() => void simpan()}>
              {sibuk ? 'Menyimpan…' : perbaruiAjuan ? 'Simpan perubahan ajuan' : langsungTerbit ? 'Simpan & terbitkan' : 'Simpan & ajukan'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** "Beranda · Hasil hitung": lokasi dari pemindaian kode web, ditambah layar tempat teks diklik. */
function teksLokasi(sumber: SumberTeks, layarSekarang: string | undefined): string {
  const lokasi = new Set(lokasiTeks[sumber.kunci] ?? []);
  if (layarSekarang) lokasi.add(layarSekarang);
  return lokasi.size ? [...lokasi].join(' · ') : `belum diketahui (kelompok ${namaKelompok(sumber)})`;
}

/** Teks apa adanya, bagian {sisipan} ditandai sebagai isian otomatis. */
function PratinjauTeks({ teks }: { teks: string }) {
  return <>{teks.split(/(\{\w+\})/).map((bagian, i) => (/^\{\w+\}$/.test(bagian)
    ? <span key={i} className="rounded bg-primary/15 px-1 text-xs" title="Diisi otomatis oleh aplikasi">{bagian.slice(1, -1)}</span>
    : <span key={i}>{bagian}</span>))}</>;
}

/** Nilai terbaru satu teks di database (draf/ajuan bila ada, selain itu yang terbit), jatuh ke nilai layar; `revisi` =
 * revisi terakhir yang belum terbit, untuk memperbarui ajuan. */
function keadaanSumber(sumber: SumberTeks, data: { entri: RingkasanEntri[]; diksi: RingkasanKunciDiksi[] }) {
  if (sumber.sumber === 'diksi') {
    const kunci = data.diksi.find(k => k.kunci === sumber.kunci);
    const revisi = kunci?.revisiTerakhir;
    if (revisi && revisi.status !== 'disetujui' && !revisi.diabaikan) return { id: revisi.idTeks, ar: revisi.arTeks, status: revisi.status, revisi };
    return { id: kunci?.terbit?.id ?? sumber.id, ar: kunci?.terbit?.ar ?? sumber.ar, status: 'terbit' as const, revisi: null };
  }
  const entri = data.entri.find(e => e.slug === sumber.kunci);
  const dibuang = !!entri?.revisiTerakhir?.diabaikan;
  const revisi = dibuang ? null : entri?.revisiTerakhir ?? null;
  const isi = (dibuang ? entri?.isiTerbit : revisi?.isi) as IsiTeksEdukasi | undefined;
  return { id: isi?.id ?? sumber.id, ar: isi?.ar ?? sumber.ar, status: revisi?.status ?? 'terbit', revisi: revisi?.status === 'disetujui' ? null : revisi };
}

/** Snapshot layar web: yang terbit, ditimpa teks yang sedang disunting (draf/ajuan terakhir) supaya hasil suntingan
 * langsung terlihat di semua tempat. Revisi dikembalikan tidak ditimpakan (belum layak tampil). */
function timpaBelumTerbit(asal: Snapshot, data: { entri: RingkasanEntri[]; diksi: RingkasanKunciDiksi[] }): Snapshot {
  const tampil = (status: string) => status === 'draf' || status === 'diajukan' || status === 'disetujui';
  const teks = new Map(data.entri.filter(e => e.revisiTerakhir && tampil(e.revisiTerakhir.status))
    .map(e => [e.slug, e.revisiTerakhir!.isi as IsiTeksEdukasi]));
  const diksi = new Map(data.diksi.map(k => {
    const revisi = k.revisiTerakhir;
    return [k.kunci, revisi && tampil(revisi.status) ? { id: revisi.idTeks, ar: revisi.arTeks } : k.terbit] as const;
  }));
  return {
    ...asal,
    konten: asal.konten.map(baris => (baris.jenis === 'teks_edukasi' && teks.has(baris.slug)
      ? { ...baris, isi: keJson('teks_edukasi', teks.get(baris.slug)!) } : baris)),
    diksi: asal.diksi.map(butir => {
      const baru = diksi.get(butir.kunci);
      return baru ? { ...butir, id: baru.id, ar: baru.ar } : butir;
    }),
  };
}

function sumberDariSnapshot(): SumberTeks[] {
  const snapshot = snapshotTerpasang();
  const teks = snapshot.konten.filter(baris => baris.jenis === 'teks_edukasi').map((baris): SumberTeks => {
    const isi = baris.isi as IsiTeksEdukasi;
    return { sumber: 'teks', kunci: baris.slug, id: isi.id, ar: isi.ar ?? null };
  });
  const diksi = snapshot.diksi.map((d): SumberTeks => ({ sumber: 'diksi', kunci: d.kunci, id: d.id, ar: d.ar ?? null }));
  return [...teks, ...diksi];
}

/** Layar web yang gagal dirender (mis. butuh data yang tidak ada di portal) tidak menjatuhkan seluruh editor. */
class PenjagaGalat extends Component<{ children: ReactNode }, { galat: string | null }> {
  override state = { galat: null as string | null };
  static getDerivedStateFromError(e: unknown) { return { galat: e instanceof Error ? e.message : String(e) }; }
  override render() {
    return this.state.galat
      ? <p role="alert" className="p-4 text-sm text-destructive">Layar ini belum bisa ditampilkan di portal: {this.state.galat}</p>
      : this.props.children;
  }
}
