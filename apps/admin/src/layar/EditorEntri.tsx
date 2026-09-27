// Editor entri: memuat entri (jenis, slug, revisi terakhir & terbit), menampilkan isi sebagai form per jenis (FormKonten,
// tahap B) atau JSON mentah (tab JSON, semua peran) + PemilihRefs. Memutuskan boleh sunting lewat
// bolehSuntingDraf (UI saja; database tetap penjaga): draf sendiri disunting di tempat, entri terbit/dikembalikan
// langsung bisa disunting dan disimpan sebagai draf baru (versi terbit tetap tampil sampai disetujui). Menyimpan
// lewat repo.editorial (buatEntri/buatDraf/ubahDraf/ajukan) dan menghapus lewat caraHapusEntri (ajukanHapus bila
// pernah terbit, hapusEntri bila belum). Galat validasi (dariBentuk) maupun galat repo ditampilkan, tidak ditelan.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { bacaIsi, bolehSuntingDraf, caraHapusEntri, GLOSARIUM, keJson, periksaRefs, slug as buatSlug, type IsiKonten, type JenisKonten } from '@waris/content';
import type { RingkasanRevisi } from '@waris/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { LABEL_ISI, menuUntukJenis } from '../navigasi';
import { dariNilaiForm, keNilaiForm, nilaiFormKosong, type HasilForm, type NilaiForm } from '../editor/nilaiForm';
import { FormKonten, type OpsiRuntime } from './FormKonten';
import { usePortal } from '../repo';
import { tulisRute } from '../rute';
import { PemilihRefs } from './PemilihRefs';
import { Pratinjau } from './Pratinjau';
import { RiwayatRevisi } from './RiwayatRevisi';

const JARAK_URUTAN = 10;
type Tab = 'form' | 'json';
const OPSI_ISTILAH = GLOSARIUM.map(entri => ({ nilai: entri.id, label: `${entri.istilah} (${entri.id})` }));
const FIELD_CALON_JUDUL = ['judul', 'pertanyaan', 'slug', 'id', 'kode', 'kunci', 'istilahId'] as const;

type Mode = { mode: 'baca' } | { mode: 'suntingDraf'; revisiId: string } | { mode: 'drafBaru' };
// basis = revisi yang isinya dimuat ke form; terakhir = revisi terbaru (status & catatan review ditampilkan dari sini).
// dihapus = revisi terbitnya revisi penghapusan; semuaRevisi dipakai caraHapusEntri (pembuat & pengajuan hapus).
interface Muatan {
  jenis: JenisKonten; slug: string | null; entriId: string | null; basis: RingkasanRevisi | null; terakhir: RingkasanRevisi | null;
  revisiTerbitId: string | null; dihapus: boolean; semuaRevisi: RingkasanRevisi[];
}

export function EditorEntri(props: { entriId: string; saatJenisDiketahui?: (jenis: JenisKonten) => void } | { jenis: JenisKonten }) {
  const { repo, sesi, peran } = usePortal();
  const [muatan, setMuatan] = useState<Muatan | null>(null);
  const [bentuk, setBentuk] = useState<NilaiForm | null>(null);
  const [tab, setTab] = useState<Tab>('form');
  const [teksJson, setTeksJson] = useState('');
  const [galatBidang, setGalatBidang] = useState<Record<string, string>>({});
  const [opsi, setOpsi] = useState<OpsiRuntime>({ modul: [], kelompokFaq: [], istilah: OPSI_ISTILAH });
  const [refs, setRefs] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>({ mode: 'baca' });
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [pratinjau, setPratinjau] = useState(false);
  const entriIdProp = 'entriId' in props ? props.entriId : null;
  const jenisProp = 'jenis' in props ? props.jenis : null;

  useEffect(() => {
    let dibatalkan = false;
    setGalat(null);
    (async () => {
      const hasil = entriIdProp ? await muatEntri(entriIdProp) : muatBaru(jenisProp!);
      if (dibatalkan) return;
      if ('saatJenisDiketahui' in props) props.saatJenisDiketahui?.(hasil.muatan.jenis);
      setMuatan(hasil.muatan);
      setBentuk(hasil.bentuk);
      setTab('form');
      setGalatBidang({});
      setRefs(hasil.muatan.basis?.refs ?? []);
      setMode(tentukanMode(hasil.muatan));
    })().catch(e => { if (!dibatalkan) setGalat(pesan(e)); });
    return () => { dibatalkan = true; };
  }, [repo, entriIdProp, jenisProp, muatUlang]);

  useEffect(() => {
    let dibatalkan = false;
    muatOpsi(repo).then(o => { if (!dibatalkan) setOpsi(o); }).catch(() => { /* opsi kosong: dropdown tetap memuat nilai sekarang */ });
    return () => { dibatalkan = true; };
  }, [repo]);

  async function muatEntri(entriId: string) {
    // ponytail: memuat semua entri untuk menemukan jenis/slug satu entri; ganti dengan repo.konten.bacaEntri(entriId) bila jumlah entri besar.
    const semua = await repo.konten.daftarEntri();
    const entri = semua.find(e => e.entriId === entriId);
    if (!entri) throw new Error(`entri ${entriId} tidak ditemukan`);
    const terakhir = entri.revisiTerakhir;
    const semuaRevisi = await repo.konten.daftarRevisi(entriId);
    // Draf/diajukan/dikembalikan: isinya sendiri jadi basis (dikembalikan boleh didrafkan ulang dari isinya).
    // Disetujui: basis = revisi yang sedang terbit (bisa berbeda bila pernah terbitkanUlang revisi lama). Entri yang
    // dihapus: basis = revisi penghapusan, isinya salinan versi terakhir, jadi menyuntingnya = memulihkan.
    const basis = entri.revisiTerbitId && terakhir?.status === 'disetujui'
      ? semuaRevisi.find(r => r.id === entri.revisiTerbitId) ?? terakhir
      : terakhir;
    const muatan: Muatan = {
      jenis: entri.jenis, slug: entri.slug, entriId, basis, terakhir, revisiTerbitId: entri.revisiTerbitId, dihapus: entri.dihapus, semuaRevisi,
    };
    return { muatan, bentuk: basis ? bentukDariRevisi(entri.jenis, basis) : bentukKosong(entri.jenis) };
  }

  function tentukanMode(m: Muatan): Mode {
    if (!m.entriId) return { mode: 'drafBaru' };
    const basis = m.basis;
    if (basis?.status === 'draf' && bolehSuntingDraf({ peran, pelakuId: sesi.userId, pembuatId: basis.dibuatOleh, status: basis.status })) {
      return { mode: 'suntingDraf', revisiId: basis.id };
    }
    // Terbit/dikembalikan: langsung bisa disunting; simpan = draf baru. Selama ada draf (orang lain) atau revisi yang
    // sedang diajukan, entri dibaca saja supaya tidak ada dua suntingan bersaing.
    const bolehDrafBaru = (peran === 'admin' || peran === 'penulis') && m.terakhir?.status !== 'draf' && m.terakhir?.status !== 'diajukan';
    return bolehDrafBaru ? { mode: 'drafBaru' } : { mode: 'baca' };
  }

  // Isi dari tab aktif: form lewat dariNilaiForm, JSON lewat bacaIsi. Keduanya berakhir di Zod.
  function isiSekarang(): HasilForm<JenisKonten> {
    if (!muatan || !bentuk) return { ok: false, galat: 'belum dimuat', galatBidang: {} };
    return tab === 'json' ? bacaJson(muatan.jenis, teksJson) : dariNilaiForm(muatan.jenis, muatan.slug ?? 'baru', bentuk);
  }

  function gantiTab(tujuan: string) {
    if (!muatan || !bentuk || tujuan === tab) return;
    const hasil = isiSekarang();
    if (!hasil.ok && tujuan === 'json' && hasil.mentah !== undefined) {
      // Form belum sah tetap boleh dibuka sebagai JSON (bidang yang gagal dibaca memakai nilai asal); galat tetap tampil.
      setGalat(hasil.galat);
      setTeksJson(JSON.stringify(hasil.mentah, null, 2));
      setTab('json');
      return;
    }
    if (!hasil.ok) { setGalat(hasil.galat); setGalatBidang(hasil.galatBidang); return; }
    setGalat(null);
    setGalatBidang({});
    if (tujuan === 'json') setTeksJson(JSON.stringify(keJson(muatan.jenis, hasil.isi), null, 2));
    else setBentuk(keNilaiForm(muatan.jenis, hasil.isi));
    setTab(tujuan as Tab);
  }

  async function simpan() {
    if (!muatan || !bentuk) return;
    setGalat(null);
    setGalatBidang({});
    const hasil = isiSekarang();
    if (!hasil.ok) { setGalat(hasil.galat); setGalatBidang(hasil.galatBidang); return; }
    try {
      if (mode.mode === 'suntingDraf') {
        await repo.editorial.ubahDraf(mode.revisiId, muatan.jenis, hasil.isi, refs);
        setMuatUlang(n => n + 1);
      } else if (muatan.entriId) {
        await repo.editorial.buatDraf(muatan.entriId, muatan.jenis, hasil.isi, refs);
        if (entriIdProp) setMuatUlang(n => n + 1);
        else location.hash = tulisRute({ layar: 'entri', entriId: muatan.entriId });
      } else {
        const slugBaru = slugDariIsi(hasil.isi);
        if (!slugBaru) { setGalat(`isi butuh salah satu field: ${FIELD_CALON_JUDUL.join(', ')} (untuk slug)`); return; }
        // Periksa refs di klien sebelum buatEntri supaya entri kosong tidak tertinggal; database tetap penjaga.
        const refsDikenal = new Set((await repo.konten.daftarRefs()).map(ref => ref.kode));
        const galatRefs = periksaRefs(muatan.jenis, hasil.isi, refs, refsDikenal);
        if (galatRefs) { setGalat(galatRefs); return; }
        const daftar = await repo.konten.daftarEntri(muatan.jenis);
        const maksUrutan = Math.max(0, ...daftar.map(e => e.urutan));
        // ponytail: entri & draf dua panggilan, tidak atomik. entriId disimpan dulu supaya bila buatDraf gagal,
        // simpan ulang memakai entri yang sama (cabang di atas). RPC atomik bila perlu.
        const entriId = await repo.editorial.buatEntri(muatan.jenis, slugBaru, maksUrutan + JARAK_URUTAN);
        setMuatan({ ...muatan, entriId, slug: slugBaru });
        await repo.editorial.buatDraf(entriId, muatan.jenis, hasil.isi, refs);
        location.hash = tulisRute({ layar: 'entri', entriId });
      }
    } catch (e) {
      setGalat(pesan(e));
    }
  }

  async function hapus(cara: 'ajukan' | 'langsung') {
    if (!muatan?.entriId) return;
    const tanya = cara === 'ajukan'
      ? 'Ajukan penghapusan entri ini? Entri tetap tampil di web sampai reviewer menyetujui.'
      : 'Hapus entri ini beserta semua drafnya? Entri belum pernah terbit, jadi langsung terhapus permanen.';
    if (!window.confirm(tanya)) return;
    setGalat(null);
    try {
      if (cara === 'ajukan') {
        await repo.editorial.ajukanHapus(muatan.entriId);
        setMuatUlang(n => n + 1);
      } else {
        await repo.editorial.hapusEntri(muatan.entriId);
        const menu = menuUntukJenis(muatan.jenis);
        location.hash = tulisRute({ layar: 'menu', menu: menu.kunci, tab: muatan.jenis });
      }
    } catch (e) {
      setGalat(pesan(e));
    }
  }

  async function ajukan() {
    if (mode.mode !== 'suntingDraf') return;
    setGalat(null);
    try {
      await repo.editorial.ajukan(mode.revisiId);
      setMuatUlang(n => n + 1);
    } catch (e) {
      setGalat(pesan(e));
    }
  }

  if (!muatan || !bentuk) return galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null;
  const bacaSaja = mode.mode === 'baca';
  const tampilDiWeb = !!muatan.revisiTerbitId && !muatan.dihapus;
  const caraHapus = muatan.entriId ? caraHapusEntri({
    peran, pelakuId: sesi.userId, pernahTerbit: !!muatan.revisiTerbitId, sudahDihapus: muatan.dihapus,
    hapusSedangDiajukan: muatan.semuaRevisi.some(r => r.hapus && r.status === 'diajukan'),
    pembuatRevisi: muatan.semuaRevisi.map(r => r.dibuatOleh),
  }) : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{LABEL_ISI[muatan.jenis]}</p>
        <h1 className="text-2xl font-bold break-words">{muatan.slug ?? 'Entri baru'}</h1>
        {muatan.terakhir ? <p className="text-sm text-muted-foreground">{teksStatus(muatan)}</p> : null}
      </div>
      {muatan.terakhir?.catatanReview ? (
        <Alert><AlertTitle>Catatan review</AlertTitle><AlertDescription>{muatan.terakhir.catatanReview}</AlertDescription></Alert>
      ) : null}
      {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
      {mode.mode === 'drafBaru' && muatan.entriId ? (
        <p className="text-sm text-muted-foreground">
          {tampilDiWeb
            ? 'Suntingan disimpan sebagai draf baru; versi terbit tetap tampil di web sampai draf disetujui.'
            : muatan.dihapus
              ? 'Entri ini sudah dihapus dari web. Simpan & ajukan suntingan untuk memulihkannya.'
              : 'Suntingan disimpan sebagai draf baru.'}
        </p>
      ) : null}
      <Card>
        <CardContent className="grid gap-4">
          <Tabs value={tab} onValueChange={gantiTab}>
            <TabsList>
              <TabsTrigger value="form">Form</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="pt-2">
              <FormKonten jenis={muatan.jenis} form={bentuk} saatUbah={setBentuk} bacaSaja={bacaSaja} galatBidang={galatBidang} opsi={opsi} />
            </TabsContent>
            <TabsContent value="json" className="pt-2">
              <Bidang label="JSON">
                <Textarea rows={20} className="font-mono text-xs" value={teksJson} readOnly={bacaSaja} onChange={e => setTeksJson(e.target.value)} />
              </Bidang>
            </TabsContent>
          </Tabs>
          <PemilihRefs nilai={refs} saatUbah={setRefs} bacaSaja={bacaSaja} />
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        {!bacaSaja ? <Button onClick={() => void simpan()}>Simpan draf</Button> : null}
        {mode.mode === 'suntingDraf' ? <Button variant="secondary" onClick={() => void ajukan()}>Ajukan</Button> : null}
        <Button variant="outline" onClick={() => setPratinjau(true)}>Pratinjau</Button>
        {caraHapus?.ok ? (
          <Button variant="destructive" className="ml-auto" onClick={() => void hapus(caraHapus.cara)}>
            {caraHapus.cara === 'ajukan' ? 'Ajukan hapus' : 'Hapus entri'}
          </Button>
        ) : null}
      </div>
      {pratinjau ? <Pratinjauan jenis={muatan.jenis} slug={muatan.slug ?? 'pratinjau'} hitungIsi={isiSekarang} kunci={[bentuk, teksJson, tab]} saatTutup={() => setPratinjau(false)} /> : null}
      {muatan.entriId ? (
        <RiwayatRevisi
          entriId={muatan.entriId}
          jenis={muatan.jenis}
          revisiTerbitId={muatan.revisiTerbitId}
          saatBerubah={() => setMuatUlang(n => n + 1)}
        />
      ) : null}
    </div>
  );
}

function teksStatus(m: Muatan): string {
  if (m.terakhir?.hapus && m.terakhir.status === 'diajukan') return 'Status: penghapusan diajukan (masih tampil di web sampai disetujui)';
  if (m.dihapus && m.terakhir?.status === 'disetujui') return 'Status: dihapus (tidak tampil di web)';
  return `Status: ${m.terakhir!.status}`;
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
  // pratinjau terbuka (refs, mode, dst.); tanpa memo, objek `isi` baru tiap kali membuat <Pratinjau> memasang ulang
  // snapshotnya (kehilangan state di dalam pratinjau, mis. pilihan kuis yang sudah dijawab).
  const hasil = useMemo(hitungIsi, kunci);
  if (!hasil.ok) return <Alert variant="destructive" role="alert"><AlertDescription>{hasil.galat}</AlertDescription></Alert>;
  return <Pratinjau jenis={jenis} slug={slug} isi={hasil.isi} saatTutup={saatTutup} />;
}

function muatBaru(jenis: JenisKonten) {
  return {
    muatan: { jenis, slug: null, entriId: null, basis: null, terakhir: null, revisiTerbitId: null, dihapus: false, semuaRevisi: [] } satisfies Muatan,
    bentuk: bentukKosong(jenis),
  };
}

function bentukKosong(jenis: JenisKonten): NilaiForm {
  return nilaiFormKosong(jenis);
}

function bentukDariRevisi(jenis: JenisKonten, revisi: RingkasanRevisi): NilaiForm {
  const hasil = bacaIsi(jenis, revisi.isi);
  if (!hasil.ok) throw new Error(`isi revisi tidak sah: ${hasil.galat}`);
  return keNilaiForm(jenis, hasil.isi);
}

function slugDariIsi(isi: unknown): string | null {
  const objek = isi as Record<string, unknown>;
  const calon = FIELD_CALON_JUDUL.map(kunci => objek[kunci]).find((n): n is string => typeof n === 'string' && n.length > 0);
  return calon ? buatSlug(calon) : null;
}

const pesan = (e: unknown) => (e instanceof Error ? e.message : String(e));

function bacaJson(jenis: JenisKonten, teks: string): HasilForm<JenisKonten> {
  let json: unknown;
  try {
    json = JSON.parse(teks);
  } catch (e) {
    return { ok: false, galat: `JSON tidak sah: ${pesan(e)}`, galatBidang: {} };
  }
  const hasil = bacaIsi(jenis, json);
  return hasil.ok ? hasil : { ok: false, galat: hasil.galat, galatBidang: {} };
}

// Opsi dropdown dari konten yang ada: nomor modul (materi) dan kelompok FAQ. Istilah dari glosarium KB (statis).
async function muatOpsi(repo: ReturnType<typeof usePortal>['repo']): Promise<OpsiRuntime> {
  const [daftarModul, daftarFaq] = await Promise.all([repo.konten.daftarEntri('modul'), repo.konten.daftarEntri('faq')]);
  const isiDari = <J extends JenisKonten>(jenis: J, isi: unknown): IsiKonten[J] | null => {
    const hasil = bacaIsi(jenis, isi);
    return hasil.ok ? hasil.isi : null;
  };
  const modul = daftarModul.filter(e => !e.dihapus).flatMap(e => {
    const isi = isiDari('modul', e.revisiTerakhir?.isi);
    return isi ? [{ nilai: String(isi.nomor), label: `${isi.nomor}. ${isi.judul}` }] : [];
  }).sort((a, b) => Number(a.nilai) - Number(b.nilai));
  const kelompok = new Set(daftarFaq.flatMap(e => {
    const isi = isiDari('faq', e.revisiTerakhir?.isi);
    return isi ? [isi.kelompok] : [];
  }));
  return { modul, kelompokFaq: [...kelompok].sort().map(k => ({ nilai: k, label: k })), istilah: OPSI_ISTILAH };
}
