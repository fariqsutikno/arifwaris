// Editor entri: memuat entri beserta semua revisinya, menampilkan isi sebagai form per jenis (FormKonten; admin juga
// punya tab JSON sebagai bagian lanjutan) + PemilihRefs. Keadaan layar (bisa disunting, menunggu review, terkunci
// beserta alasannya, atau di Sampah) diputuskan keadaanSunting; di sini hanya ditampilkan sebagai banner dua jalur
// ("tayang di web" & "perubahan Anda") dan satu tombol utama per peran: penulis "Kirim untuk review", admin "Terbitkan",
// dengan "Simpan dulu" sebagai tombol kedua. Suntingan pertama membuat salinan kerja, berikutnya memperbaruinya.
// Tombol mati bila tidak ada perubahan, dan meninggalkan halaman dengan perubahan belum disimpan diperingatkan.
// Tata letak dua kolom: isi (tab Form / Arab / JSON) di kiri, panel Info (identitas & metadata + refs) di kanan.
// Identitas entri (kode soal, slug, id) diisi otomatis bila kosong dan terkunci setelah terbit (admin bisa membuka).
// Database tetap penjaga sebenarnya; galat validasi (dariNilaiForm) maupun galat repo ditampilkan, tidak ditelan.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Globe, PencilLine } from 'lucide-react';
import { bacaIsi, GLOSARIUM, JUDUL_BAB, keJson, periksaRefs, type IsiKonten, type JenisKonten } from '@waris/content';
import { KUNCI_CONTOH } from '@waris/web/contoh';
import type { RingkasanRevisi } from '@waris/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { LABEL_ISI } from '../navigasi';
import { dariNilaiForm, keNilaiForm, nilaiFormKosong, type HasilForm, type NilaiForm } from '../editor/nilaiForm';
import { caraBuang, keadaanSunting, revisiBasis, teksTayang, type EntriSunting, type KeadaanSunting } from '../editor/keadaanSunting';
import { useNamaTim } from '../hooks/useNamaTim';
import { judulEntri, waktuRelatif } from '../ringkas';
import { bidangIdentitas, punyaVersiArab } from '../editor/formulir';
import { kodeBerikutnya, lengkapiIdentitas, slugEntri } from '../editor/identitas';
import { labelKunci } from '../editor/kasus';
import { FormKonten, type OpsiRuntime, type PotonganForm } from './FormKonten';
import { usePortal } from '../repo';
import { tulisRute, type Kueri } from '../rute';
import { PemilihRefs } from './PemilihRefs';
import { Pratinjau } from './Pratinjau';
import { RiwayatRevisi } from './RiwayatRevisi';
import { lepasPenjaga, usePenjagaPerubahan } from '../penjaga';
import { pesanGalat } from '../pesanGalat';

const JARAK_URUTAN = 10;
type Tab = 'form' | 'arab' | 'json';
// Opsi dropdown yang tetap (dari KB & daftar ahli waris engine); yang bergantung isi database dimuat muatOpsi.
const OPSI_STATIS: OpsiRuntime = {
  istilah: GLOSARIUM.map(entri => ({ nilai: entri.id, label: `${entri.istilah} (${entri.id})` })),
  bab: Object.entries(JUDUL_BAB).map(([bab, judul]) => ({ nilai: bab, label: `${bab}. ${judul}` })).sort((a, b) => Number(a.nilai) - Number(b.nilai)),
  kunciAhliWaris: KUNCI_CONTOH.map(({ kunci }) => ({ nilai: kunci, label: labelKunci(kunci) })),
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
  const [galatBidang, setGalatBidang] = useState<Record<string, string>>({});
  const [opsi, setOpsi] = useState<OpsiRuntime>(OPSI_STATIS);
  const [bukaKunci, setBukaKunci] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [pratinjau, setPratinjau] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [disimpanPada, setDisimpanPada] = useState<Date | null>(null);
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
      setGalatBidang({});
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
    (tab === 'json' ? teksJson !== teksJsonAwal : JSON.stringify(bentuk) !== JSON.stringify(bentukAwal))
    || JSON.stringify(refs) !== JSON.stringify(refsAwal));

  usePenjagaPerubahan(kotor);

  const pratinjauKunci = useMemo(() => [bentuk, teksJson, tab], [bentuk, teksJson, tab]);

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
    const formKotor = JSON.stringify(bentuk) !== JSON.stringify(bentukAwal);
    if (!hasil.ok && tujuan === 'json' && hasil.mentah !== undefined) {
      // Form belum sah tetap boleh dibuka sebagai JSON (bidang yang gagal dibaca memakai nilai asal); galat tetap tampil.
      setGalat(hasil.galat);
      bukaJson(JSON.stringify(hasil.mentah, null, 2), formKotor);
      return;
    }
    if (!hasil.ok) { setGalat(hasil.galat); setGalatBidang(hasil.galatBidang); return; }
    setGalat(null);
    setGalatBidang({});
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
    setGalatBidang({});
    const hasil = isiSekarang();
    if (!hasil.ok) { setGalat(hasil.galat); setGalatBidang(hasil.galatBidang); return null; }
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
  const dikembalikan = keadaan.jenis === 'sunting' && !salinanKerjaId && terakhir?.status === 'dikembalikan' && !terakhir.hapus ? terakhir : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{LABEL_ISI[muatan.jenis]}</p>
        <h1 className="text-2xl font-bold break-words">{judul}</h1>
        {muatan.slug && muatan.slug !== judul ? <p className="font-mono text-xs text-muted-foreground">{muatan.slug}</p> : null}
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
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardContent>
            {adaArab || peran === 'admin' ? (
              <Tabs value={tab} onValueChange={gantiTab}>
                <TabsList>
                  <TabsTrigger value="form">Form</TabsTrigger>
                  {adaArab ? <TabsTrigger value="arab">Arab</TabsTrigger> : null}
                  {peran === 'admin' ? <TabsTrigger value="json">JSON (lanjutan)</TabsTrigger> : null}
                </TabsList>
                <TabsContent value="form" className="pt-2">{formKonten('utama')}</TabsContent>
                {adaArab ? <TabsContent value="arab" className="pt-2">{formKonten('arab')}</TabsContent> : null}
                {peran === 'admin' ? (
                  <TabsContent value="json" className="pt-2">
                    <Bidang label="JSON">
                      <Textarea rows={20} className="font-mono text-xs" value={teksJson} readOnly={!bisaSunting} onChange={e => setTeksJson(e.target.value)} />
                    </Bidang>
                  </TabsContent>
                ) : null}
              </Tabs>
            ) : formKonten('utama')}
          </CardContent>
        </Card>
        <Card className="lg:sticky lg:top-4">
          <CardHeader><CardTitle className="text-base">Info</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            {tab === 'json'
              ? <p className="text-sm text-muted-foreground">Selama di tab JSON, info entri diubah lewat JSON.</p>
              : formKonten('samping')}
            <PemilihRefs nilai={refs} saatUbah={setRefs} bacaSaja={!bisaSunting} />
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap gap-2">
        {bisaSunting && peran === 'admin' ? <Button disabled={!bolehKirim} onClick={() => void terbitkan()}>Terbitkan</Button> : null}
        {bisaSunting && peran !== 'admin' ? <Button disabled={!bolehKirim} onClick={() => void kirim()}>Kirim untuk review</Button> : null}
        {bisaSunting ? <Button variant="outline" disabled={sibuk || (!kotor && !!muatan.entriId)} onClick={() => void simpanDulu()}>Simpan dulu</Button> : null}
        {keadaan.jenis === 'menungguReview' && keadaan.bolehTarik ? (
          <Button variant="outline" disabled={sibuk} onClick={() => void tarik(keadaan.revisi.id)}>
            {keadaan.revisi.hapus ? 'Batalkan pengajuan' : 'Tarik kembali'}
          </Button>
        ) : null}
        {keadaan.jenis === 'sampah' && keadaan.bolehPulihkan ? <Button disabled={sibuk} onClick={() => void pulihkan()}>Pulihkan</Button> : null}
        <Button variant="ghost" onClick={() => setPratinjau(true)}>Pratinjau</Button>
        {cara?.ok ? (
          <Button variant="ghost" className="ml-auto text-destructive" disabled={sibuk} onClick={() => buang(cara.cara)}>
            {cara.cara === 'ajukan' ? 'Ajukan ke Sampah' : 'Pindahkan ke Sampah'}
          </Button>
        ) : null}
      </div>
      {pratinjau ? <Pratinjauan jenis={muatan.jenis} slug={muatan.slug ?? 'pratinjau'} hitungIsi={isiSekarang} kunci={pratinjauKunci} saatTutup={() => setPratinjau(false)} /> : null}
      {muatan.entriId ? (
        <RiwayatRevisi entriId={muatan.entriId} jenis={muatan.jenis} revisiTerbitId={muatan.entri.revisiTerbitId} saatBerubah={() => setMuatUlang(n => n + 1)} />
      ) : null}
    </div>
  );

  function formKonten(bagian: PotonganForm) {
    const bukaKunciIdentitas = peran === 'admin' ? () => { if (window.confirm(PESAN_BUKA_KUNCI)) setBukaKunci(true); } : undefined;
    return (
      <FormKonten jenis={muatan!.jenis} form={bentuk!} saatUbah={setBentuk} bacaSaja={!bisaSunting} galatBidang={galatBidang} opsi={opsi}
        bagian={bagian} identitasTerkunci={!!muatan!.entri.revisiTerbitId && !bukaKunci} saatBukaKunci={bukaKunciIdentitas} />
    );
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
    refs: daftarRefs.map(ref => ({ nilai: ref.kode, label: ref.kode })),
    kodeAlasan: [...alasan].sort().map(k => ({ nilai: k, label: k })),
  };
}
