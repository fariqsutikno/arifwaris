// Editor entri: memuat entri beserta semua revisinya, menampilkan isi sebagai form per jenis (FormKonten; admin juga
// punya tab JSON sebagai bagian lanjutan) + PemilihRefs. Keadaan layar (bisa disunting, menunggu review, terkunci
// beserta alasannya, atau di Sampah) diputuskan keadaanSunting; di sini hanya ditampilkan sebagai banner dua jalur
// ("tayang di web" & "perubahan Anda") dan satu tombol utama per peran: penulis "Kirim untuk review", admin
// "Terbitkan sekarang", dengan "Simpan draf" sebagai tombol kedua dan satu baris keterangan beda keduanya. Suntingan pertama membuat salinan kerja, berikutnya memperbaruinya.
// Tombol mati bila tidak ada perubahan, dan meninggalkan halaman dengan perubahan belum disimpan diperingatkan.
// Tata letak dua kolom: isi (tab Bahasa Indonesia / Bahasa Arab / Kode mentah) di kiri, panel Info (Kelengkapan,
// identitas & metadata, rujukan) di kanan. Galat bidang tampil begitu bidangnya ditinggalkan (validasi langsung);
// "Batalkan perubahan" mengembalikan form ke versi tersimpan terakhir.
// Identitas entri (kode soal, slug, id) diisi otomatis bila kosong dan terkunci setelah terbit (admin bisa membuka).
// Database tetap penjaga sebenarnya; galat validasi (dariNilaiForm) maupun galat repo ditampilkan, tidak ditelan.
// Perubahan terhadap versi tayang bisa dilihat kapan saja ("Lihat perubahan") dan selalu diringkas di dialog konfirmasi
// Terbitkan/Kirim. Entri yang menunggu review menampilkan perubahan yang diajukan; reviewer menyetujui/mengembalikan
// langsung di sini (AksiReview, sama dengan Antrean review).
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, CircleDashed, Globe, PencilLine } from 'lucide-react';
import { bacaIsi, DAFTAR_KITAB, GLOSARIUM, JUDUL_BAB, keJson, periksaRefs, type IsiKonten, type JenisKonten } from '@waris/content';
import { KUNCI_CONTOH } from '@waris/web/contoh';
import type { RingkasanRevisi } from '@waris/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { LABEL_ISI } from '../navigasi';
import { dariNilaiForm, keNilaiForm, nilaiFormKosong, samaForm, type HasilForm, type NilaiForm } from '../editor/nilaiForm';
import { caraBuang, keadaanSunting, revisiBasis, teksTayang, type EntriSunting, type KeadaanSunting } from '../editor/keadaanSunting';
import { useNamaTim } from '../hooks/useNamaTim';
import { judulEntri, waktuRelatif } from '../ringkas';
import { bidangIdentitas, punyaVersiArab } from '../editor/formulir';
import { kodeBerikutnya, lengkapiIdentitas, slugEntri } from '../editor/identitas';
import { opsiRujukan } from '../editor/rujukan';
import { daftarKelengkapan, type ButirKelengkapan } from '../editor/kelengkapan';
import { FormKonten, type OpsiRuntime, type PotonganForm } from './FormKonten';
import { usePortal } from '../repo';
import { tulisRute, type Kueri } from '../rute';
import { PemilihRefs } from './PemilihRujukan';
import { Pratinjau } from './Pratinjau';
import { AksiReview } from './AksiReview';
import { Perbandingan } from './Perbandingan';
import { bidangBanding, daftarPerubahan, type PerubahanBidang } from '../editor/banding';
import { RiwayatRevisi } from './RiwayatRevisi';
import { lepasPenjaga, usePenjagaPerubahan } from '../penjaga';
import { pesanGalat } from '../pesanGalat';

const JARAK_URUTAN = 10;
type Tab = 'form' | 'arab' | 'json';
// Opsi dropdown yang tetap (dari KB & daftar ahli waris engine); yang bergantung isi database dimuat muatOpsi.
const OPSI_STATIS: OpsiRuntime = {
  istilah: GLOSARIUM.map(entri => ({ nilai: entri.id, label: `${entri.istilah} (${entri.id})` })),
  bab: Object.entries(JUDUL_BAB).map(([bab, judul]) => ({ nilai: bab, label: `${bab}. ${judul}` })).sort((a, b) => Number(a.nilai) - Number(b.nilai)),
  kunciAhliWaris: KUNCI_CONTOH.map(({ kunci, label }) => ({ nilai: kunci, label })),
  kitab: DAFTAR_KITAB.map(({ judul }) => ({ nilai: judul, label: judul })),
};
const PESAN_BUKA_KUNCI = 'Identitas ini dipakai di tautan yang sudah dibagikan dan progres belajar pengguna. Mengubahnya bisa memutus keduanya. Tetap buka kunci?';
const ENTRI_BARU: EntriSunting = { revisiTerbitId: null, dihapus: false, dibuang: false, semuaRevisi: [] };

// basis = revisi yang isinya dimuat ke form (revisiBasis). entriId null = entri baru yang belum pernah disimpan.
interface Muatan { jenis: JenisKonten; slug: string | null; entriId: string | null; entri: EntriSunting; basis: RingkasanRevisi | null }

export function EditorEntri(props: { entriId: string; saatJenisDiketahui?: (jenis: JenisKonten) => void } | { jenis: JenisKonten; awal?: Kueri | undefined }) {
  const { repo, sesi, peran } = usePortal();
  const namaDari = useNamaTim();
  const [muatan, setMuatan] = useState<Muatan | null>(null);
  const [bentuk, setBentuk] = useState<NilaiForm | null>(null);
  const [bentukAwal, setBentukAwal] = useState<NilaiForm | null>(null);
  const [refs, setRefs] = useState<string[]>([]);
  const [refsAwal, setRefsAwal] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('form');
  const [teksJson, setTeksJson] = useState('');
  const [teksJsonAwal, setTeksJsonAwal] = useState('');
  // Galat bidang tampil setelah bidangnya ditinggalkan (disentuh), atau semuanya setelah gagal simpan.
  const [disentuh, setDisentuh] = useState<ReadonlySet<string>>(new Set());
  const [tampilSemuaGalat, setTampilSemuaGalat] = useState(false);
  const [opsi, setOpsi] = useState<OpsiRuntime>(OPSI_STATIS);
  const [bukaKunci, setBukaKunci] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [pratinjau, setPratinjau] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [disimpanPada, setDisimpanPada] = useState<Date | null>(null);
  const [lihatPerubahan, setLihatPerubahan] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState<'terbitkan' | 'kirim' | null>(null);
  const entriIdProp = 'entriId' in props ? props.entriId : null;
  const jenisProp = 'jenis' in props ? props.jenis : null;

  useEffect(() => {
    let dibatalkan = false;
    setGalat(null);
    (async () => {
      const hasil = entriIdProp ? await muatEntri(entriIdProp) : await muatBaru(repo, jenisProp!, 'awal' in props ? props.awal : undefined);
      if (dibatalkan) return;
      if ('saatJenisDiketahui' in props) props.saatJenisDiketahui?.(hasil.muatan.jenis);
      setMuatan(hasil.muatan);
      setBentuk(hasil.bentuk);
      setBentukAwal(hasil.bentuk);
      setTab('form');
      setDisentuh(new Set());
      setTampilSemuaGalat(false);
      setBukaKunci(false);
      setRefs(hasil.muatan.basis?.refs ?? []);
      setRefsAwal(hasil.muatan.basis?.refs ?? []);
    })().catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo, entriIdProp, jenisProp, muatUlang]);

  useEffect(() => {
    let dibatalkan = false;
    muatOpsi(repo).then(o => { if (!dibatalkan) setOpsi(o); }).catch(() => { /* opsi kosong: dropdown tetap memuat nilai sekarang */ });
    return () => { dibatalkan = true; };
  }, [repo]);

  const keadaan: KeadaanSunting | null = muatan
    ? (muatan.entriId ? keadaanSunting(muatan.entri, { peran, userId: sesi.userId, namaDari }) : { jenis: 'sunting', salinanKerjaId: null })
    : null;
  const bisaSunting = keadaan?.jenis === 'sunting';
  const kotor = bisaSunting && (
    (tab === 'json' ? teksJson !== teksJsonAwal : !samaForm(bentuk, bentukAwal))
    || JSON.stringify(refs) !== JSON.stringify(refsAwal));

  usePenjagaPerubahan(kotor);

  const pratinjauKunci = useMemo(() => [bentuk, teksJson, tab], [bentuk, teksJson, tab]);
  const validasi = useMemo(
    () => (muatan && bentuk && tab !== 'json' ? dariNilaiForm(muatan.jenis, muatan.slug ?? 'baru', lengkapiIdentitas(muatan.jenis, bentuk)) : null),
    [muatan, bentuk, tab],
  );
  const semuaGalatBidang = validasi && !validasi.ok ? validasi.galatBidang : {};
  const galatBidang = tampilSemuaGalat ? semuaGalatBidang : Object.fromEntries(Object.entries(semuaGalatBidang).filter(([jalur]) => disentuh.has(jalur)));

  async function muatEntri(entriId: string) {
    // ponytail: memuat semua entri untuk menemukan jenis/slug satu entri; ganti dengan repo.konten.bacaEntri(entriId) bila jumlah entri besar.
    const semua = await repo.konten.daftarEntri();
    const ringkasan = semua.find(e => e.entriId === entriId);
    if (!ringkasan) throw new Error(`entri ${entriId} tidak ditemukan`);
    const entri: EntriSunting = {
      revisiTerbitId: ringkasan.revisiTerbitId, dihapus: ringkasan.dihapus, dibuang: ringkasan.dibuang,
      semuaRevisi: await repo.konten.daftarRevisi(entriId),
    };
    const basis = revisiBasis(entri);
    const muatan: Muatan = { jenis: ringkasan.jenis, slug: ringkasan.slug, entriId, entri, basis };
    return { muatan, bentuk: basis ? bentukDariRevisi(ringkasan.jenis, basis) : nilaiFormKosong(ringkasan.jenis) };
  }

  // Isi dari tab aktif: form lewat dariNilaiForm, JSON lewat bacaIsi. Keduanya berakhir di Zod.
  function isiSekarang(): HasilForm<JenisKonten> {
    if (!muatan || !bentuk) return { ok: false, galat: 'belum dimuat', galatBidang: {} };
    return tab === 'json'
      ? bacaJson(muatan.jenis, teksJson)
      : dariNilaiForm(muatan.jenis, muatan.slug ?? 'baru', lengkapiIdentitas(muatan.jenis, bentuk));
  }

  // Isi ↔ Arab = form yang sama, tanpa konversi. Ke/dari JSON dikonversi lewat Zod.
  function gantiTab(tujuanMentah: string) {
    const tujuan = tujuanMentah as Tab;
    if (!muatan || !bentuk || tujuan === tab) return;
    if (tab !== 'json' && tujuan !== 'json') { setTab(tujuan); return; }
    // JSON yang tidak diubah tidak dikonversi balik, supaya form tetap sama persis (tidak tampak berubah).
    if (tujuan !== 'json' && teksJson === teksJsonAwal) { setGalat(null); setTab(tujuan); return; }
    const hasil = isiSekarang();
    const formKotor = !samaForm(bentuk, bentukAwal);
    if (!hasil.ok && tujuan === 'json' && hasil.mentah !== undefined) {
      // Form belum sah tetap boleh dibuka sebagai JSON (bidang yang gagal dibaca memakai nilai asal); galat tetap tampil.
      setGalat(hasil.galat);
      bukaJson(JSON.stringify(hasil.mentah, null, 2), formKotor);
      return;
    }
    if (!hasil.ok) { setGalat(hasil.galat); setTampilSemuaGalat(true); return; }
    setGalat(null);
    if (tujuan === 'json') { bukaJson(JSON.stringify(keJson(muatan.jenis, hasil.isi), null, 2), formKotor); return; }
    setBentuk(keNilaiForm(muatan.jenis, hasil.isi));
    setTab(tujuan);
  }

  // Perubahan form yang belum disimpan tetap terhitung setelah pindah ke JSON (awal dibuat berbeda).
  function bukaJson(teks: string, formKotor: boolean) {
    setTeksJson(teks);
    setTeksJsonAwal(formKotor ? '' : teks);
    setTab('json');
  }

  /** Menyimpan isi ke salinan kerja (membuatnya bila belum ada, juga entrinya bila entri baru); mengembalikan id
   * revisi & entrinya, atau null bila isi belum sah. */
  async function simpanSalinan(): Promise<{ revisiId: string; entriId: string } | null> {
    if (!muatan || keadaan?.jenis !== 'sunting') return null;
    const hasil = isiSekarang();
    if (!hasil.ok) { setGalat(hasil.galat); setTampilSemuaGalat(true); return null; }
    if (keadaan.salinanKerjaId) {
      await repo.editorial.ubahDraf(keadaan.salinanKerjaId, muatan.jenis, hasil.isi, refs);
      return { revisiId: keadaan.salinanKerjaId, entriId: muatan.entriId! };
    }
    if (muatan.entriId) return { revisiId: await repo.editorial.buatDraf(muatan.entriId, muatan.jenis, hasil.isi, refs), entriId: muatan.entriId };
    const slugBaru = slugEntri(muatan.jenis, hasil.isi);
    if (!slugBaru) { setGalat('Isi judul dulu: alamat entri dibentuk dari judul.'); return null; }
    // Periksa refs di klien sebelum buatEntri supaya entri kosong tidak tertinggal; database tetap penjaga.
    const refsDikenal = new Set((await repo.konten.daftarRefs()).map(ref => ref.kode));
    const galatRefs = periksaRefs(muatan.jenis, hasil.isi, refs, refsDikenal);
    if (galatRefs) { setGalat(galatRefs); return null; }
    const daftar = await repo.konten.daftarEntri(muatan.jenis);
    const maksUrutan = Math.max(0, ...daftar.map(e => e.urutan));
    // ponytail: entri & salinan kerja dua panggilan, tidak atomik. entriId disimpan dulu supaya bila buatDraf gagal,
    // simpan ulang memakai entri yang sama (cabang di atas). RPC atomik bila perlu.
    const entriId = await repo.editorial.buatEntri(muatan.jenis, slugBaru, maksUrutan + JARAK_URUTAN);
    setMuatan({ ...muatan, entriId, slug: slugBaru });
    return { revisiId: await repo.editorial.buatDraf(entriId, muatan.jenis, hasil.isi, refs), entriId };
  }

  /** Salinan kerja yang siap dikirim/diterbitkan: disimpan dulu bila ada perubahan. */
  async function salinanSiap() {
    if (keadaan?.jenis === 'sunting' && keadaan.salinanKerjaId && !kotor) return { revisiId: keadaan.salinanKerjaId, entriId: muatan!.entriId! };
    return simpanSalinan();
  }

  /** `aksi` mengembalikan entriId yang disentuh, atau null bila batal (isi belum sah). */
  async function jalankan(aksi: () => Promise<string | null | void>) {
    setGalat(null);
    setSibuk(true);
    try {
      const entriId = await aksi();
      if (entriId === null) return;
      // Entri baru pindah ke rutenya sendiri (layar dipasang ulang); entri lama cukup dimuat ulang.
      lepasPenjaga();
      if (entriId && !entriIdProp) location.hash = tulisRute({ layar: 'entri', entriId });
      else setMuatUlang(n => n + 1);
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setSibuk(false);
    }
  }

  const simpanDulu = () => jalankan(async () => {
    const hasil = await simpanSalinan();
    if (hasil) setDisimpanPada(new Date());
    return hasil?.entriId ?? null;
  });
  const kirim = () => jalankan(async () => {
    const hasil = await salinanSiap();
    if (hasil) await repo.editorial.ajukan(hasil.revisiId);
    return hasil?.entriId ?? null;
  });
  const terbitkan = () => jalankan(async () => {
    const hasil = await salinanSiap();
    if (hasil) await repo.editorial.terbitkanLangsung(hasil.revisiId);
    return hasil?.entriId ?? null;
  });
  const tarik = (revisiId: string) => jalankan(() => repo.editorial.tarik(revisiId));
  const pulihkan = () => jalankan(() => repo.editorial.pulihkanEntri(muatan!.entriId!));
  function buang(cara: 'langsung' | 'ajukan') {
    const alasan = window.prompt(cara === 'ajukan'
      ? 'Ajukan pemindahan ke Sampah? Entri tetap tampil di web sampai reviewer menyetujui.\nAlasan (opsional):'
      : 'Pindahkan entri ini ke Sampah? Entri tidak tampil di web dan bisa dipulihkan kapan saja.\nAlasan (opsional):', '');
    if (alasan === null) return;
    void jalankan(async () => { await repo.editorial.buangEntri(muatan!.entriId!, alasan); });
  }

  if (!muatan || !bentuk || !keadaan) return galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null;
  const sekarang = new Date();
  const relatif = (iso: string) => waktuRelatif(iso, sekarang);
  const terakhir = muatan.entri.semuaRevisi.at(-1) ?? null;
  const salinanKerjaId = keadaan.jenis === 'sunting' ? keadaan.salinanKerjaId : null;
  const bolehKirim = !sibuk && (kotor || !!salinanKerjaId || !muatan.entriId);
  const cara = muatan.entriId && keadaan.jenis !== 'sampah' ? caraBuang(muatan.entri, { peran, userId: sesi.userId, namaDari }) : null;
  const adaArab = punyaVersiArab(muatan.jenis);
  const judul = muatan.slug ? judulEntri({ slug: muatan.slug, revisiTerakhir: muatan.basis }) : `${LABEL_ISI[muatan.jenis]} baru`;
  const revisiTayang = muatan.entri.semuaRevisi.find(r => r.id === muatan.entri.revisiTerbitId) ?? null;
  const dikembalikan = keadaan.jenis === 'sunting' && !salinanKerjaId && terakhir?.status === 'dikembalikan' && !terakhir.hapus ? terakhir : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{LABEL_ISI[muatan.jenis]}</p>
        <h1 className="text-2xl font-bold break-words">{judul}</h1>
      </div>
      <section aria-label="Status entri" className="grid gap-1.5 rounded-lg border bg-muted/40 p-3 text-sm">
        <p className="flex items-center gap-2"><Globe className="size-4 shrink-0" aria-hidden />{teksTayang(muatan.entri, relatif)}</p>
        <p className="flex items-center gap-2"><PencilLine className="size-4 shrink-0" aria-hidden />{teksPerubahan()}</p>
      </section>
      {dikembalikan ? (
        <Alert>
          <AlertTitle>Dikembalikan oleh {dikembalikan.diperiksaOleh ? namaDari(dikembalikan.diperiksaOleh) : 'reviewer'}</AlertTitle>
          <AlertDescription>{dikembalikan.catatanReview} · Perbaiki di bawah lalu kirim lagi.</AlertDescription>
        </Alert>
      ) : null}
      {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
      {/* Pratinjau terbuka: form & Info bertumpuk di kiri, pratinjau menempel di kanan supaya perubahan langsung terlihat. */}
      <div className={`grid items-start gap-4 ${pratinjau ? 'lg:grid-cols-2' : 'lg:grid-cols-[minmax(0,1fr)_18rem]'}`}>
        <div className={pratinjau ? 'grid gap-4' : 'contents'}>
        <Card>
          <CardContent>
            {adaArab || peran === 'admin' ? (
              <Tabs value={tab} onValueChange={gantiTab}>
                <TabsList>
                  <TabsTrigger value="form">Bahasa Indonesia</TabsTrigger>
                  {adaArab ? <TabsTrigger value="arab">Bahasa Arab</TabsTrigger> : null}
                  {peran === 'admin' ? <TabsTrigger value="json">Kode mentah</TabsTrigger> : null}
                </TabsList>
                <TabsContent value="form" className="pt-2">{formKonten('utama')}</TabsContent>
                {adaArab ? <TabsContent value="arab" className="pt-2">{formKonten('arab')}</TabsContent> : null}
                {peran === 'admin' ? (
                  <TabsContent value="json" className="pt-2">
                    <p className="mb-2 text-xs text-muted-foreground">Untuk admin: isi entri dalam bentuk JSON, untuk perbaikan yang tidak bisa lewat form.</p>
                    <Bidang label="JSON">
                      <Textarea rows={20} className="font-mono text-xs" value={teksJson} readOnly={!bisaSunting} onChange={e => setTeksJson(e.target.value)} />
                    </Bidang>
                  </TabsContent>
                ) : null}
              </Tabs>
            ) : formKonten('utama')}
          </CardContent>
        </Card>
        <Card className={pratinjau ? undefined : 'lg:sticky lg:top-4'}>
          <CardHeader><CardTitle className="text-base">Info</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            {bisaSunting && tab !== 'json' ? <Kelengkapan butir={kelengkapan()} /> : null}
            {tab === 'json'
              ? <p className="text-sm text-muted-foreground">Selama di tab Kode mentah, info entri diubah lewat kode.</p>
              : formKonten('samping')}
            <PemilihRefs nilai={refs} saatUbah={setRefs} bacaSaja={!bisaSunting} />
          </CardContent>
        </Card>
        </div>
        {/* sticky membuat stacking context; saat pratinjau layar penuh dilepas supaya pratinjau menutupi seluruh portal. */}
        {pratinjau ? (
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:overflow-auto lg:has-[[aria-modal=true]]:static">
            <Pratinjauan jenis={muatan.jenis} slug={muatan.slug ?? 'pratinjau'} hitungIsi={isiSekarang} kunci={pratinjauKunci} saatTutup={() => setPratinjau(false)} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {bisaSunting && peran === 'admin' ? <Button disabled={!bolehKirim} onClick={() => mintaKonfirmasi('terbitkan')}>Terbitkan sekarang</Button> : null}
        {bisaSunting && peran !== 'admin' ? <Button disabled={!bolehKirim} onClick={() => mintaKonfirmasi('kirim')}>Kirim untuk review</Button> : null}
        {bisaSunting ? <Button variant="outline" disabled={sibuk || (!kotor && !!muatan.entriId)} onClick={() => void simpanDulu()}>Simpan draf</Button> : null}
        {kotor ? <Button variant="link" disabled={sibuk} onClick={batalkanPerubahan}>Batalkan perubahan</Button> : null}
        {keadaan.jenis === 'menungguReview' && keadaan.bolehTarik ? (
          <Button variant="outline" disabled={sibuk} onClick={() => void tarik(keadaan.revisi.id)}>
            {keadaan.revisi.hapus ? 'Batalkan pengajuan' : 'Tarik kembali'}
          </Button>
        ) : null}
        {keadaan.jenis === 'sampah' && keadaan.bolehPulihkan ? <Button disabled={sibuk} onClick={() => void pulihkan()}>Pulihkan</Button> : null}
        <Button variant="ghost" aria-pressed={pratinjau} onClick={() => setPratinjau(!pratinjau)}>{pratinjau ? 'Tutup pratinjau' : 'Pratinjau'}</Button>
        {bisaSunting && muatan.entriId ? (
          <Button variant="ghost" aria-pressed={lihatPerubahan} onClick={() => setLihatPerubahan(!lihatPerubahan)}>
            {lihatPerubahan ? 'Sembunyikan perubahan' : 'Lihat perubahan'}
          </Button>
        ) : null}
        {cara?.ok ? (
          <Button variant="ghost" className="ml-auto text-destructive" disabled={sibuk} onClick={() => buang(cara.cara)}>
            {cara.cara === 'ajukan' ? 'Ajukan ke Sampah' : 'Pindahkan ke Sampah'}
          </Button>
        ) : null}
      </div>
      {lihatPerubahan && bisaSunting ? <PanelPerubahan perubahan={perubahanSekarang()} baru={!revisiTayang} /> : null}
      {keadaan.jenis === 'menungguReview' ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Perubahan yang diajukan</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {keadaan.revisi.hapus
              ? <p className="text-sm text-muted-foreground">Diajukan ke Sampah. Bila disetujui, entri hilang dari web dan bisa dipulihkan kapan saja.</p>
              : <PanelPerubahan perubahan={perubahanRevisi(keadaan.revisi)} baru={!revisiTayang} />}
            <AksiReview pembuatId={keadaan.revisi.dibuatOleh} status={keadaan.revisi.status}
              setujui={() => repo.editorial.setujui(keadaan.revisi.id)} kembalikan={catatan => repo.editorial.kembalikan(keadaan.revisi.id, catatan)}
              saatSelesai={() => setMuatUlang(n => n + 1)} />
          </CardContent>
        </Card>
      ) : null}
      <Dialog open={konfirmasi !== null} onOpenChange={buka => { if (!buka) setKonfirmasi(null); }}>
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{konfirmasi === 'terbitkan' ? 'Terbitkan sekarang?' : 'Kirim untuk review?'}</DialogTitle>
            <DialogDescription>
              {konfirmasi === 'terbitkan' ? 'Perubahan berikut langsung tampil di web.' : 'Reviewer akan memeriksa perubahan berikut sebelum tampil di web.'}
            </DialogDescription>
          </DialogHeader>
          {konfirmasi ? <PanelPerubahan perubahan={perubahanSekarang()} baru={!revisiTayang} /> : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setKonfirmasi(null)}>Batal</Button>
            <Button disabled={sibuk} onClick={jalankanKonfirmasi}>{konfirmasi === 'terbitkan' ? 'Ya, terbitkan' : 'Ya, kirim'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {bisaSunting ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Simpan draf</span>: belum tampil di web, bisa dilanjutkan nanti.{' '}
          {peran === 'admin'
            ? <><span className="font-medium">Terbitkan sekarang</span>: langsung tampil di web.</>
            : <><span className="font-medium">Kirim untuk review</span>: reviewer memeriksa dulu sebelum tampil di web.</>}
        </p>
      ) : null}
      {muatan.entriId ? (
        <RiwayatRevisi entriId={muatan.entriId} jenis={muatan.jenis} revisiTerbitId={muatan.entri.revisiTerbitId} versi={muatUlang} saatBerubah={() => setMuatUlang(n => n + 1)} />
      ) : null}
    </div>
  );

  function mintaKonfirmasi(aksi: 'terbitkan' | 'kirim') {
    // Isi belum sah: tampilkan galat bidang sekarang, tidak perlu membuka dialog.
    const hasil = isiSekarang();
    if (!hasil.ok) { setGalat(hasil.galat); setTampilSemuaGalat(true); return; }
    setKonfirmasi(aksi);
  }

  function jalankanKonfirmasi() {
    const aksi = konfirmasi;
    setKonfirmasi(null);
    void (aksi === 'terbitkan' ? terbitkan() : kirim());
  }

  /** Isi form sekarang dibanding versi tayang; null = isian belum sah sehingga belum bisa dibandingkan. */
  function perubahanSekarang(): PerubahanBidang[] | null {
    const hasil = isiSekarang();
    if (!hasil.ok) return null;
    return daftarPerubahan(bidangTayang(), bidangBanding(muatan!.jenis, keJson(muatan!.jenis, hasil.isi), refs));
  }

  function perubahanRevisi(revisi: RingkasanRevisi) {
    return daftarPerubahan(bidangTayang(), bidangBanding(muatan!.jenis, revisi.isi, revisi.refs));
  }
  function bidangTayang() {
    return revisiTayang && bidangBanding(muatan!.jenis, revisiTayang.isi, revisiTayang.refs);
  }

  function formKonten(bagian: PotonganForm) {
    const bukaKunciIdentitas = peran === 'admin' ? () => { if (window.confirm(PESAN_BUKA_KUNCI)) setBukaKunci(true); } : undefined;
    return (
      <FormKonten jenis={muatan!.jenis} form={bentuk!} saatUbah={setBentuk} bacaSaja={!bisaSunting} galatBidang={galatBidang} opsi={opsi}
        bagian={bagian} identitasTerkunci={!!muatan!.entri.revisiTerbitId && !bukaKunci} saatBukaKunci={bukaKunciIdentitas}
        saatSelesaiIsi={jalur => setDisentuh(lama => (lama.has(jalur) ? lama : new Set(lama).add(jalur)))} />
    );
  }

  function kelengkapan() {
    const isi = validasi?.ok ? validasi.isi : validasi?.mentah;
    // Rujukan wajib bila periksaRefs menolak isi ini tanpa rujukan sama sekali.
    const rujukanWajib = periksaRefs(muatan!.jenis, isi, [], new Set()) !== null;
    return daftarKelengkapan(muatan!.jenis, bentuk!, semuaGalatBidang, rujukanWajib ? refs.length === 0 : null);
  }

  function batalkanPerubahan() {
    if (!window.confirm('Buang semua perubahan yang belum disimpan dan kembali ke versi tersimpan terakhir?')) return;
    setBentuk(bentukAwal);
    setRefs(refsAwal);
    setTeksJson(teksJsonAwal);
    setDisentuh(new Set());
    setTampilSemuaGalat(false);
    setGalat(null);
  }

  function teksPerubahan(): string {
    switch (keadaan!.jenis) {
      case 'sunting':
        if (kotor) return 'Ada perubahan yang belum disimpan';
        if (salinanKerjaId) return `Draf tersimpan${disimpanPada ? ` pukul ${jam(disimpanPada)}` : ''} · belum dikirim`;
        return muatan!.entriId ? 'Belum ada perubahan · langsung sunting di bawah' : 'Entri baru · belum disimpan';
      case 'menungguReview': {
        const { revisi } = keadaan!;
        return revisi.hapus
          ? `Pemindahan ke Sampah diajukan oleh ${namaDari(revisi.dibuatOleh)} · menunggu review`
          : `Perubahan dari ${namaDari(revisi.dibuatOleh)} menunggu review`;
      }
      case 'terkunci': return keadaan!.alasan;
      case 'sampah': return keadaan!.bolehPulihkan ? 'Pulihkan untuk menyunting lagi.' : keadaan!.alasan ?? '';
    }
  }
}

const IKON_BUTIR = { benar: CircleCheck, kosong: CircleDashed, salah: CircleAlert } as const;
const WARNA_BUTIR = { benar: 'text-emerald-700 dark:text-emerald-400', kosong: 'text-muted-foreground', salah: 'text-destructive' } as const;
const KETERANGAN_BUTIR = { benar: 'sudah benar', kosong: 'belum diisi', salah: 'belum benar' } as const;

function Kelengkapan({ butir }: { butir: ButirKelengkapan[] }) {
  const beres = butir.filter(b => b.status === 'benar').length;
  return (
    <section aria-label="Kelengkapan" className="grid gap-1.5">
      <p className="text-sm font-medium">Kelengkapan <span className="font-normal text-muted-foreground">{beres}/{butir.length}</span></p>
      <ul className="grid gap-1 text-sm">
        {butir.map(({ jalur, label, status }) => {
          const Ikon = IKON_BUTIR[status];
          return (
            <li key={jalur} className={`flex items-center gap-2 ${WARNA_BUTIR[status]}`}>
              <Ikon className="size-4 shrink-0" aria-hidden />
              <span>{label}{status === 'benar' ? <span className="sr-only">: {KETERANGAN_BUTIR.benar}</span> : null}</span>
              {status !== 'benar' ? <span className="ml-auto text-xs">{KETERANGAN_BUTIR[status]}</span> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PanelPerubahan({ perubahan, baru }: { perubahan: PerubahanBidang[] | null; baru: boolean }) {
  if (!perubahan) return <p className="text-sm text-muted-foreground">Lengkapi isian yang belum benar dulu untuk melihat perubahannya.</p>;
  return <Perbandingan perubahan={perubahan} keterangan={baru ? 'Belum pernah tayang: semua isi ditambahkan.' : 'Dibandingkan dengan versi yang tayang di web.'} />;
}

function Bidang({ label, children }: { label: string; children: ReactNode }) {
  // Label pembungkus: nama aksesibel input = label, tanpa perlu id.
  return <Label className="grid gap-1.5">{label}{children}</Label>;
}

// Menggabung form/JSON jadi isi sebelum diserahkan ke <Pratinjau>; kalau belum sah, galat itu sendiri ditampilkan
// menggantikan pratinjau.
function Pratinjauan({ jenis, slug, hitungIsi, kunci, saatTutup }: {
  jenis: JenisKonten; slug: string; hitungIsi: () => HasilForm<JenisKonten>; kunci: readonly unknown[]; saatTutup: () => void;
}) {
  // Di-memo lewat nilai form (bukan dipanggil ulang tiap render): EditorEntri re-render untuk alasan lain saat
  // pratinjau terbuka (refs, keadaan, dst.); tanpa memo, objek `isi` baru tiap kali membuat <Pratinjau> memasang ulang
  // snapshotnya (kehilangan state di dalam pratinjau, mis. pilihan kuis yang sudah dijawab).
  const hasil = useMemo(hitungIsi, kunci);
  if (!hasil.ok) return <Alert variant="destructive" role="alert"><AlertDescription>{hasil.galat}</AlertDescription></Alert>;
  return <Pratinjau jenis={jenis} slug={slug} isi={hasil.isi} saatTutup={saatTutup} />;
}

/** Entri baru: isian awal dari URL, dan kode soal langsung diisi kode berikutnya (K-12 → K-13) supaya penulis
 * tidak perlu mengarang. */
async function muatBaru(repo: ReturnType<typeof usePortal>['repo'], jenis: JenisKonten, awal: Kueri | undefined) {
  const bentuk = nilaiFormKosong(jenis);
  const bidang = bidangIdentitas(jenis);
  if (bidang?.identitas?.awalan) {
    const kodeAda = (await repo.konten.daftarEntri(jenis)).map(entri => (entri.revisiTerakhir?.isi as { kode?: unknown } | undefined)?.kode)
      .filter((kode): kode is string => typeof kode === 'string');
    bentuk.nilai[bidang.jalur] = kodeBerikutnya(bidang.identitas.awalan, kodeAda);
  }
  // Isian awal dari URL (mis. "Materi di modul ini" → ?modul=3), hanya untuk bidang teks yang memang ada di form.
  for (const [jalur, nilai] of Object.entries(awal ?? {})) if (typeof bentuk.nilai[jalur] === 'string') bentuk.nilai[jalur] = nilai;
  return { muatan: { jenis, slug: null, entriId: null, entri: ENTRI_BARU, basis: null } satisfies Muatan, bentuk };
}

function bentukDariRevisi(jenis: JenisKonten, revisi: RingkasanRevisi): NilaiForm {
  const hasil = bacaIsi(jenis, revisi.isi);
  if (!hasil.ok) throw new Error(`isi revisi tidak sah: ${hasil.galat}`);
  return keNilaiForm(jenis, hasil.isi);
}

const jam = (waktu: Date) => waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

function bacaJson(jenis: JenisKonten, teks: string): HasilForm<JenisKonten> {
  let json: unknown;
  try {
    json = JSON.parse(teks);
  } catch (e) {
    return { ok: false, galat: `JSON tidak sah: ${pesanGalat(e)}`, galatBidang: {} };
  }
  const hasil = bacaIsi(jenis, json);
  return hasil.ok ? hasil : { ok: false, galat: hasil.galat, galatBidang: {} };
}

// Opsi dropdown dari konten yang ada: nomor modul (materi) dan kelompok FAQ. Istilah dari glosarium KB (statis).
// Entri di Sampah tidak ditawarkan.
async function muatOpsi(repo: ReturnType<typeof usePortal>['repo']): Promise<OpsiRuntime> {
  const [daftarModul, daftarFaq, daftarAhwal, daftarRefs] = await Promise.all([
    repo.konten.daftarEntri('modul'), repo.konten.daftarEntri('faq'), repo.konten.daftarEntri('ahwal'), repo.konten.daftarRefs(),
  ]);
  const isiDari = <J extends JenisKonten>(jenis: J, isi: unknown): IsiKonten[J] | null => {
    const hasil = bacaIsi(jenis, isi);
    return hasil.ok ? hasil.isi : null;
  };
  const modul = daftarModul.filter(e => !e.dihapus && !e.dibuang).flatMap(e => {
    const isi = isiDari('modul', e.revisiTerakhir?.isi);
    return isi ? [{ nilai: String(isi.nomor), label: `${isi.nomor}. ${isi.judul}` }] : [];
  }).sort((a, b) => Number(a.nilai) - Number(b.nilai));
  const kelompok = new Set(daftarFaq.flatMap(e => {
    const isi = isiDari('faq', e.revisiTerakhir?.isi);
    return isi ? [isi.kelompok] : [];
  }));
  // Kode alasan = kode AlasanFardh engine yang sudah dipakai baris ahwal lain; hanya saran, boleh diketik.
  const alasan = new Set(daftarAhwal.flatMap(e => isiDari('ahwal', e.revisiTerakhir?.isi)?.baris.flatMap(b => b.cocok.kodeAlasan ?? []) ?? []));
  return {
    ...OPSI_STATIS,
    modul,
    kelompokFaq: [...kelompok].sort().map(k => ({ nilai: k, label: k })),
    refs: opsiRujukan(daftarRefs).map(ref => ({ nilai: ref.kode, label: `Bab ${ref.bab} · ${ref.klaim}` })),
    kodeAlasan: [...alasan].sort().map(k => ({ nilai: k, label: k })),
  };
}
