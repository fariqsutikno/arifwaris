// Sunting teks aplikasi langsung di layar: menampilkan layar web asli (beranda, kalkulator, hasil, belajar, …) dan
// menandai setiap teks yang berasal dari teks edukasi atau diksi (lewat buatPencocok) dengan kotak bergaris. Klik teks →
// dialog sunting Indonesia/Arab → admin menerbitkan (teks edukasi) atau mengajukan (diksi & penulis), sama dengan jalur
// layar daftar. Kotak digambar sebagai lapisan di atas layar, bukan dengan mengubah DOM React milik layar web.
// Teks yang tidak tampil di layar mana pun (tur, akun, dst.) dicari lewat kotak "Cari teks".
// ponytail: layar web memakai snapshot bawaan build dan membaca teksnya sekali saat dimuat; teks yang baru disimpan
// ditulis langsung ke simpul teksnya supaya terlihat, bukan dirender ulang oleh layar web.
import { Component, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { IsiTeksEdukasi } from '@waris/content';
import type { RingkasanEntri, RingkasanKunciDiksi } from '@waris/data';
import { snapshotTerpasang } from '@waris/web/sumber';
import { Beranda as BerandaWeb } from '@waris/web/layar/Beranda';
import { LangkahPewaris } from '@waris/web/layar/wizard/LangkahPewaris';
import { LangkahAhliWaris } from '@waris/web/layar/LangkahAhliWaris';
import { LangkahHarta } from '@waris/web/layar/wizard/LangkahHarta';
import { LangkahKewajiban } from '@waris/web/layar/wizard/LangkahKewajiban';
import { Hasil } from '@waris/web/layar/Hasil';
import { Belajar } from '@waris/web/belajar/Belajar';
import { Latihan } from '@waris/web/belajar/Latihan';
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
const KASUS_CONTOH = kasusDariContoh({ pewaris: 'L', ahliWaris: ['ISTRI', 'IBU', 'ANAK_LK', 'ANAK_PR'], harta: 120_000_000n, harapan: { saham: {}, ashlAkhir: 0n } });
const BATAS_HASIL_CARI = 30;

// Nama kelompok teks untuk manusia (awalan kunci teks edukasi / halaman diksi).
const NAMA_KELOMPOK: Record<string, string> = {
  harta: 'Langkah harta', ahli_waris: 'Nama ahli waris', wizard: 'Langkah kalkulator', selanjutnya: 'Habis ini ngapain',
  tur: 'Tur pengenalan', umum: 'Umum', hitung: 'Kalkulator', beranda: 'Beranda', belajar: 'Belajar', latihan: 'Latihan',
  akun: 'Akun', rujukan: 'Rujukan', glosarium: 'Glosarium', faq: 'FAQ', tanya_jawab: 'Tanya jawab',
};
const namaKelompok = (sumber: SumberTeks) => NAMA_KELOMPOK[sumber.kunci.split('.')[0]!] ?? 'Lainnya';

interface Bagian { id: string; judul: string; layar: () => ReactNode }
const BAGIAN: readonly Bagian[] = [
  { id: 'beranda', judul: 'Beranda', layar: () => <BerandaWeb kasusTerakhir={null} saatKeHitung={tanpaAksi} /> },
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
];

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
  const [dipilih, setDipilih] = useState<{ sumber: SumberTeks[]; simpul: Text | null } | null>(null);
  const [cari, setCari] = useState('');
  const pencocok = useMemo(() => buatPencocok(daftarSumber), [daftarSumber]);

  useEffect(() => {
    let dibatalkan = false;
    Promise.all([repo.konten.daftarEntri('teks_edukasi'), repo.diksi.daftarKunci()])
      .then(([entri, diksi]) => { if (!dibatalkan) setData({ entri, diksi }); })
      .catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo, muatUlang]);

  const bagian = BAGIAN.find(b => b.id === bagianId)!;
  const kata = rapikan(cari).toLowerCase();
  const hasilCari = kata ? daftarSumber.filter(s => s.id.toLowerCase().includes(kata) || (s.ar ?? '').includes(cari.trim())).slice(0, BATAS_HASIL_CARI) : [];

  function setelahSimpan(sumber: SumberTeks, idBaru: string, arBaru: string | null) {
    // Simpul teks ditulis langsung (lihat ponytail di atas); hanya bila isinya memang persis teks lama.
    if (dipilih?.simpul && rapikan(dipilih.simpul.data) === rapikan(sumber.id)) dipilih.simpul.data = idBaru;
    setDaftarSumber(lama => lama.map(s => (s === sumber ? { ...s, id: idBaru, ar: arBaru } : s)));
    setMuatUlang(n => n + 1);
  }

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
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="gap-0 overflow-hidden py-0">
          <PenjagaGalat key={bagian.id}>
            <LayarBisaDisunting pencocok={pencocok} aktif={modeSunting} saatPilih={(sumber, simpul) => setDipilih({ sumber, simpul })}>
              {bagian.layar()}
            </LayarBisaDisunting>
          </PenjagaGalat>
        </Card>
        <Card className="gap-2 p-4 lg:sticky lg:top-4">
          <Label className="grid gap-1.5">
            Cari teks
            <span className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input type="search" className="pl-9" placeholder="mis. Harta yang dibagi" value={cari} onChange={e => setCari(e.target.value)} />
            </span>
          </Label>
          <p className="text-xs text-muted-foreground">Untuk teks yang tidak terlihat di layar mana pun, mis. tur pengenalan.</p>
          <ul className="grid gap-1">
            {hasilCari.map(sumber => (
              <li key={`${sumber.sumber}/${sumber.kunci}`}>
                <button type="button" className="grid w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted" onClick={() => setDipilih({ sumber: [sumber], simpul: null })}>
                  <span className="line-clamp-2">{sumber.id}</span>
                  <span className="text-xs text-muted-foreground">{namaKelompok(sumber)}</span>
                </button>
              </li>
            ))}
            {kata && hasilCari.length === 0 ? <li className="text-sm text-muted-foreground">Tidak ada teks yang cocok.</li> : null}
          </ul>
        </Card>
      </div>
      {dipilih ? (
        data ? (
          <DialogSunting pilihan={dipilih.sumber} data={data} bacaSaja={peran === 'reviewer'} judulLayar={dipilih.simpul ? bagian.judul : null}
            saatTutup={() => setDipilih(null)} saatTersimpan={setelahSimpan} />
        ) : <Skeleton className="h-10" />
      ) : null}
    </div>
  );
}

function LayarBisaDisunting({ pencocok, aktif, saatPilih, children }: {
  pencocok: PencocokTeks; aktif: boolean; saatPilih: (sumber: SumberTeks[], simpul: Text) => void; children: ReactNode;
}) {
  const wadah = useRef<HTMLDivElement>(null);
  const [kotak, setKotak] = useState<KotakTeks[]>([]);

  useLayoutEffect(() => {
    const el = wadah.current;
    if (!el || !aktif) { setKotak([]); return; }
    let bingkai = 0;
    const ukur = () => { cancelAnimationFrame(bingkai); bingkai = requestAnimationFrame(() => setKotak(kumpulkanKotak(el, pencocok))); };
    ukur();
    const pengamat = new MutationObserver(ukur);
    pengamat.observe(el, { subtree: true, childList: true, characterData: true });
    const pengamatUkuran = new ResizeObserver(ukur);
    pengamatUkuran.observe(el);
    return () => { pengamat.disconnect(); pengamatUkuran.disconnect(); cancelAnimationFrame(bingkai); };
  }, [pencocok, aktif]);

  return (
    // Sama dengan Pratinjau: gaya komponen.css web, dan transform supaya elemen fixed web tetap di dalam kotak.
    <div className="relative max-h-[75vh] overflow-auto bg-background p-4 text-base leading-[26px] [transform:translateZ(0)]">
      <div ref={wadah}>{children}</div>
      {kotak.map((k, i) => (
        <button key={i} type="button" aria-label={`Sunting teks: ${rapikan(k.simpul.data)}`}
          className="absolute rounded-sm outline-1 outline-primary/60 outline-dashed hover:bg-primary/15 focus-visible:bg-primary/15 focus-visible:outline-2"
          style={{ left: k.kiri, top: k.atas, width: k.lebar, height: k.tinggi }}
          onClick={() => saatPilih(k.sumber, k.simpul)} />
      ))}
    </div>
  );
}

function kumpulkanKotak(el: HTMLElement, pencocok: PencocokTeks): KotakTeks[] {
  const acuan = el.parentElement!;
  const dasar = acuan.getBoundingClientRect();
  const hasil: KotakTeks[] = [];
  const penjelajah = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let simpul = penjelajah.nextNode() as Text | null; simpul; simpul = penjelajah.nextNode() as Text | null) {
    const sumber = pencocok.cari(simpul.data);
    if (sumber.length === 0) continue;
    const rentang = document.createRange();
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

function DialogSunting({ pilihan, data, bacaSaja, judulLayar, saatTutup, saatTersimpan }: {
  pilihan: SumberTeks[]; data: { entri: RingkasanEntri[]; diksi: RingkasanKunciDiksi[] }; bacaSaja: boolean; judulLayar: string | null;
  saatTutup: () => void; saatTersimpan: (sumber: SumberTeks, id: string, ar: string | null) => void;
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
  const terkunci = bacaSaja || menunggu;
  const berubah = teksId !== keadaan.id || teksAr !== (keadaan.ar ?? '');
  const langsungTerbit = sumber.sumber === 'teks' && peran === 'admin';

  function ganti(i: number) {
    const lain = keadaanSumber(pilihan[i]!, data);
    setIndeks(i);
    setTeksId(lain.id);
    setTeksAr(lain.ar ?? '');
  }

  async function simpan() {
    setSibuk(true);
    setGalat(null);
    try {
      const ar = teksAr.trim() || null;
      if (sumber.sumber === 'diksi') {
        await repo.diksi.ajukan(await repo.diksi.buatDraf(sumber.kunci, teksId, ar, null));
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
      saatTersimpan(sumber, teksId, ar);
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
          <DialogDescription>
            {judulLayar ? `Tampil di layar ${judulLayar}. ` : ''}Kelompok: {namaKelompok(sumber)}.
          </DialogDescription>
        </DialogHeader>
        {pilihan.length > 1 ? (
          <fieldset className="grid gap-1.5 text-sm">
            <legend className="mb-1 font-medium">Teks yang sama dipakai di beberapa tempat. Ubah yang mana?</legend>
            {pilihan.map((s, i) => (
              <Label key={`${s.sumber}/${s.kunci}`} className="gap-2 font-normal">
                <input type="radio" name="sumber-teks" checked={i === indeks} onChange={() => ganti(i)} />
                {namaKelompok(s)}
              </Label>
            ))}
          </fieldset>
        ) : null}
        {menunggu ? <p className="text-sm text-muted-foreground">Perubahan teks ini sedang menunggu review. Tunggu disetujui dulu sebelum menyunting lagi.</p> : null}
        <Label className="grid gap-1.5">
          Bahasa Indonesia
          <Textarea rows={3} value={teksId} readOnly={terkunci} onChange={e => setTeksId(e.target.value)} />
        </Label>
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
              {sibuk ? 'Menyimpan…' : langsungTerbit ? 'Simpan & terbitkan' : 'Simpan & ajukan'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Nilai terbaru satu teks di database (draf/ajuan bila ada, selain itu yang terbit), jatuh ke nilai layar. */
function keadaanSumber(sumber: SumberTeks, data: { entri: RingkasanEntri[]; diksi: RingkasanKunciDiksi[] }) {
  if (sumber.sumber === 'diksi') {
    const kunci = data.diksi.find(k => k.kunci === sumber.kunci);
    const revisi = kunci?.revisiTerakhir;
    if (revisi && revisi.status !== 'disetujui') return { id: revisi.idTeks, ar: revisi.arTeks, status: revisi.status };
    return { id: kunci?.terbit?.id ?? sumber.id, ar: kunci?.terbit?.ar ?? sumber.ar, status: 'terbit' as const };
  }
  const revisi = data.entri.find(e => e.slug === sumber.kunci)?.revisiTerakhir;
  const isi = revisi?.isi as IsiTeksEdukasi | undefined;
  return { id: isi?.id ?? sumber.id, ar: isi?.ar ?? sumber.ar, status: revisi?.status ?? 'terbit' };
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
