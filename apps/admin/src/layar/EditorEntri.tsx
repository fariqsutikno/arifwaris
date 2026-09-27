// Editor entri: memuat entri (jenis, slug, revisi terakhir & terbit), menampilkan isi sebagai form per jenis (FormKonten,
// tahap B) atau JSON mentah (tab JSON, semua peran) + PemilihRefs. Memutuskan boleh sunting lewat
// bolehSuntingDraf (UI saja; database tetap penjaga) dan menjelaskan alasannya bila terkunci, lalu menyimpan lewat
// repo.editorial (buatEntri/buatDraf/ubahDraf/ajukan). "Simpan & ajukan" selalu menyimpan isi form dulu. Selama
// menyimpan tombol terkunci; perubahan belum tersimpan dijaga (penjaga.ts). Galat validasi maupun galat repo
// ditampilkan di bilah aksi bawah (sticky) dan bidang pertama yang salah difokuskan, tidak ditelan.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import {
  bacaIsi, bolehSuntingDraf, GLOSARIUM, keJson, periksaRefs, slug as buatSlug, type IsiKonten, type JenisKonten, type Peran,
} from '@waris/content';
import type { RingkasanRevisi } from '@waris/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { LABEL_ISI } from '../navigasi';
import { dariNilaiForm, keNilaiForm, nilaiFormKosong, type HasilForm, type NilaiForm } from '../editor/nilaiForm';
import { FormKonten, type OpsiRuntime } from './FormKonten';
import { usePortal } from '../repo';
import { ambilKilat, lepasPenjaga, setelKilat, usePenjagaPerubahan, type Kilat } from '../penjaga';
import { judulEntri, statusTampil, waktuRelatif } from '../ringkas';
import { tulisRute } from '../rute';
import { ChipStatus } from './Beranda';
import { PemilihRefs } from './PemilihRefs';
import { Pratinjau } from './Pratinjau';
import { RiwayatRevisi } from './RiwayatRevisi';

const JARAK_URUTAN = 10;
type Tab = 'form' | 'json';
type Aksi = 'simpan' | 'ajukan';
const OPSI_ISTILAH = GLOSARIUM.map(entri => ({ nilai: entri.id, label: `${entri.istilah} (${entri.id})` }));
const FIELD_CALON_JUDUL = ['judul', 'pertanyaan', 'slug', 'id', 'kode', 'kunci', 'istilahId'] as const;

type Mode = { mode: 'baca' } | { mode: 'suntingDraf'; revisiId: string } | { mode: 'drafBaru' };
// basis = revisi yang isinya dimuat ke form; terakhir = revisi terbaru (status & catatan review ditampilkan dari sini).
interface Muatan {
  jenis: JenisKonten; slug: string | null; entriId: string | null; basis: RingkasanRevisi | null; terakhir: RingkasanRevisi | null;
  revisiTerbitId: string | null;
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
  const [sukses, setSukses] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [pratinjau, setPratinjau] = useState(false);
  const [berubah, setBerubah] = useState(false);
  const [sibuk, setSibuk] = useState<Aksi | null>(null);
  const wadahForm = useRef<HTMLDivElement>(null);
  const entriIdProp = 'entriId' in props ? props.entriId : null;
  const jenisProp = 'jenis' in props ? props.jenis : null;
  const bacaSaja = mode.mode === 'baca';
  usePenjagaPerubahan(berubah && !bacaSaja);

  useEffect(() => {
    const kilat = ambilKilat();
    if (kilat?.jenis === 'sukses') setSukses(kilat.teks);
    if (kilat?.jenis === 'galat') setGalat(kilat.teks);
  }, []);

  useEffect(() => {
    let dibatalkan = false;
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
      setBerubah(false);
    })().catch(e => { if (!dibatalkan) setGalat(pesan(e)); });
    return () => { dibatalkan = true; };
  }, [repo, entriIdProp, jenisProp, muatUlang]);

  useEffect(() => {
    let dibatalkan = false;
    muatOpsi(repo).then(o => { if (!dibatalkan) setOpsi(o); }).catch(() => { /* opsi kosong: dropdown tetap memuat nilai sekarang */ });
    return () => { dibatalkan = true; };
  }, [repo]);

  // Galat bidang baru → bawa bidang pertama yang salah ke tengah layar dan fokuskan masukannya, supaya galat tidak
  // tersembunyi di atas saat tombol simpan ditekan dari bawah form yang panjang.
  useEffect(() => {
    const bidang = wadahForm.current?.querySelector<HTMLElement>('[data-galat]');
    if (!bidang) return;
    bidang.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    bidang.querySelector<HTMLElement>('input, textarea, select')?.focus({ preventScroll: true });
  }, [galatBidang]);

  async function muatEntri(entriId: string) {
    // ponytail: memuat semua entri untuk menemukan jenis/slug satu entri; ganti dengan repo.konten.bacaEntri(entriId) bila jumlah entri besar.
    const semua = await repo.konten.daftarEntri();
    const entri = semua.find(e => e.entriId === entriId);
    if (!entri) throw new Error(`entri ${entriId} tidak ditemukan`);
    const terakhir = entri.revisiTerakhir;
    // Draf/diajukan/dikembalikan: isinya sendiri jadi basis (dikembalikan boleh didrafkan ulang dari isinya).
    // Disetujui: basis = revisi yang sedang terbit (bisa berbeda bila pernah terbitkanUlang revisi lama).
    const basis = entri.revisiTerbitId && terakhir?.status === 'disetujui'
      ? (await repo.konten.daftarRevisi(entriId)).find(r => r.id === entri.revisiTerbitId) ?? terakhir
      : terakhir;
    const muatan: Muatan = { jenis: entri.jenis, slug: entri.slug, entriId, basis, terakhir, revisiTerbitId: entri.revisiTerbitId };
    return { muatan, bentuk: basis ? bentukDariRevisi(entri.jenis, basis) : bentukKosong(entri.jenis) };
  }

  function tentukanMode(m: Muatan): Mode {
    if (!m.entriId) return { mode: 'drafBaru' };
    const basis = m.basis;
    if (basis?.status === 'draf' && bolehSuntingDraf({ peran, pelakuId: sesi.userId, pembuatId: basis.dibuatOleh, status: basis.status })) {
      return { mode: 'suntingDraf', revisiId: basis.id };
    }
    // Revisi yang dikembalikan ke pembuatnya (atau admin) langsung bisa diperbaiki: simpan = draf baru dari isinya.
    if (basis?.status === 'dikembalikan' && peran !== 'reviewer' && (peran === 'admin' || basis.dibuatOleh === sesi.userId)) {
      return { mode: 'drafBaru' };
    }
    return { mode: 'baca' };
  }

  const ubahBentuk = (nilai: NilaiForm) => { setBentuk(nilai); setBerubah(true); };
  const ubahRefs = (nilai: string[]) => { setRefs(nilai); setBerubah(true); };
  const ubahJson = (nilai: string) => { setTeksJson(nilai); setBerubah(true); };

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

  /** Simpan isi sekarang sebagai draf. null = tidak tersimpan (galat validasi sudah ditampilkan). */
  async function simpanIsi(): Promise<{ entriId: string; revisiId: string } | null> {
    if (!muatan || !bentuk) return null;
    const hasil = isiSekarang();
    if (!hasil.ok) { setGalat(hasil.galat); setGalatBidang(hasil.galatBidang); return null; }
    if (mode.mode === 'suntingDraf') {
      await repo.editorial.ubahDraf(mode.revisiId, muatan.jenis, hasil.isi, refs);
      return { entriId: muatan.entriId!, revisiId: mode.revisiId };
    }
    if (muatan.entriId) {
      return { entriId: muatan.entriId, revisiId: await repo.editorial.buatDraf(muatan.entriId, muatan.jenis, hasil.isi, refs) };
    }
    const slugBaru = slugDariIsi(hasil.isi);
    if (!slugBaru) { setGalat(`isi butuh salah satu field: ${FIELD_CALON_JUDUL.join(', ')} (untuk slug)`); return null; }
    // Periksa refs di klien sebelum buatEntri supaya entri kosong tidak tertinggal; database tetap penjaga.
    const refsDikenal = new Set((await repo.konten.daftarRefs()).map(ref => ref.kode));
    const galatRefs = periksaRefs(muatan.jenis, hasil.isi, refs, refsDikenal);
    if (galatRefs) { setGalat(galatRefs); return null; }
    const daftar = await repo.konten.daftarEntri(muatan.jenis);
    const maksUrutan = Math.max(0, ...daftar.map(e => e.urutan));
    // ponytail: entri & draf dua panggilan, tidak atomik. entriId disimpan dulu supaya bila buatDraf gagal,
    // simpan ulang memakai entri yang sama (cabang di atas). RPC atomik bila perlu.
    const entriId = await repo.editorial.buatEntri(muatan.jenis, slugBaru, maksUrutan + JARAK_URUTAN);
    setMuatan({ ...muatan, entriId, slug: slugBaru });
    return { entriId, revisiId: await repo.editorial.buatDraf(entriId, muatan.jenis, hasil.isi, refs) };
  }

  // "Simpan & ajukan" selalu menyimpan isi form dulu, supaya yang diajukan persis yang sedang dilihat penulis.
  async function jalankan(aksi: Aksi) {
    if (sibuk) return;
    setSibuk(aksi);
    setGalat(null);
    setGalatBidang({});
    setSukses(null);
    try {
      const tersimpan = await simpanIsi();
      if (!tersimpan) return;
      setBerubah(false);
      lepasPenjaga();
      let kilat: Kilat = { jenis: 'sukses', teks: 'Draf tersimpan.' };
      if (aksi === 'ajukan') {
        try {
          await repo.editorial.ajukan(tersimpan.revisiId);
          kilat = { jenis: 'sukses', teks: 'Tersimpan dan diajukan ke antrean review.' };
        } catch (e) {
          kilat = { jenis: 'galat', teks: `Draf tersimpan, tapi gagal diajukan: ${pesan(e)}` };
        }
      }
      if (tersimpan.entriId === entriIdProp) {
        if (kilat.jenis === 'sukses') setSukses(kilat.teks); else setGalat(kilat.teks);
        setMuatUlang(n => n + 1);
      } else {
        setelKilat(kilat);
        location.hash = tulisRute({ layar: 'entri', entriId: tersimpan.entriId });
      }
    } catch (e) {
      setGalat(pesan(e));
    } finally {
      setSibuk(null);
    }
  }

  function batal() {
    if (berubah && !window.confirm('Buang perubahan yang belum disimpan?')) return;
    setGalat(null);
    setSukses(null);
    setMuatUlang(n => n + 1);
  }

  if (!muatan || !bentuk) {
    return galat
      ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert>
      : <div aria-busy="true" className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-96" /></div>;
  }
  const bolehDrafBaru = bacaSaja && peran !== 'reviewer' && muatan.entriId && muatan.terakhir?.status !== 'draf' && muatan.terakhir?.status !== 'diajukan';
  // Batal: buang perubahan, atau keluar dari "draf baru" yang dibuka manual dari versi terbit.
  const bolehBatal = !!muatan.entriId && !bacaSaja && (berubah || tentukanMode(muatan).mode === 'baca');
  const alasan = bacaSaja ? alasanBacaSaja(muatan, peran, sesi.userId) : null;
  const status = muatan.terakhir ? statusTampil({ revisiTerbitId: muatan.revisiTerbitId, revisiTerakhir: muatan.terakhir }) : null;
  const judul = muatan.slug ? judulEntri({ slug: muatan.slug, revisiTerakhir: muatan.basis }) : `${LABEL_ISI[muatan.jenis]} baru`;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{LABEL_ISI[muatan.jenis]}</p>
        <h1 className="text-2xl font-bold break-words">{judul}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {status ? <ChipStatus status={status} /> : <Badge variant="outline">Belum disimpan</Badge>}
          {muatan.terakhir ? (
            <span>
              {muatan.terakhir.dibuatOleh === sesi.userId ? 'revisi Anda' : 'revisi penulis lain'} · {waktuRelatif(muatan.terakhir.dibuatPada, new Date())}
            </span>
          ) : null}
          {muatan.slug ? <span className="font-mono text-xs">{muatan.slug}</span> : null}
        </div>
      </div>
      {muatan.terakhir?.catatanReview ? (
        <Alert><AlertTitle>Catatan review</AlertTitle><AlertDescription>{muatan.terakhir.catatanReview}</AlertDescription></Alert>
      ) : null}
      {alasan ? <Alert><Lock /><AlertTitle>Hanya baca</AlertTitle><AlertDescription>{alasan}</AlertDescription></Alert> : null}
      <Card>
        <CardContent>
          <div ref={wadahForm} className="grid gap-4">
          <Tabs value={tab} onValueChange={gantiTab}>
            <TabsList>
              <TabsTrigger value="form">Form</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="pt-2">
              <FormKonten jenis={muatan.jenis} form={bentuk} saatUbah={ubahBentuk} bacaSaja={bacaSaja} galatBidang={galatBidang} opsi={opsi} />
            </TabsContent>
            <TabsContent value="json" className="pt-2">
              <Bidang label="JSON">
                <Textarea rows={20} className="font-mono text-xs" value={teksJson} readOnly={bacaSaja} onChange={e => ubahJson(e.target.value)} />
              </Bidang>
            </TabsContent>
          </Tabs>
          <PemilihRefs nilai={refs} saatUbah={ubahRefs} bacaSaja={bacaSaja} />
          </div>
        </CardContent>
      </Card>
      {pratinjau ? <Pratinjauan jenis={muatan.jenis} slug={muatan.slug ?? 'pratinjau'} hitungIsi={isiSekarang} kunci={[bentuk, teksJson, tab]} saatTutup={() => setPratinjau(false)} /> : null}
      <div className="sticky bottom-0 z-10 -mx-4 space-y-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
        <div className="flex flex-wrap items-center gap-2">
          {!bacaSaja ? (
            <>
              <Button disabled={!!sibuk} onClick={() => void jalankan('ajukan')}>{sibuk === 'ajukan' ? 'Mengajukan…' : 'Simpan & ajukan'}</Button>
              <Button variant="secondary" disabled={!!sibuk} onClick={() => void jalankan('simpan')}>{sibuk === 'simpan' ? 'Menyimpan…' : 'Simpan draf'}</Button>
            </>
          ) : null}
          {bolehDrafBaru ? <Button variant="secondary" onClick={() => setMode({ mode: 'drafBaru' })}>Buat draf baru dari versi ini</Button> : null}
          {bolehBatal ? <Button variant="ghost" disabled={!!sibuk} onClick={batal}>Batal</Button> : null}
          <Button variant="outline" onClick={() => setPratinjau(v => !v)}>{pratinjau ? 'Tutup pratinjau' : 'Pratinjau'}</Button>
          <span aria-live="polite" className="ml-auto text-sm text-muted-foreground">
            {berubah && !bacaSaja ? 'Ada perubahan belum disimpan' : sukses}
          </span>
        </div>
      </div>
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

/** Kenapa form terkunci, dalam bahasa penulis. Cerminan bolehSuntingDraf & tentukanMode; database tetap penjaga. */
function alasanBacaSaja(muatan: Muatan, peran: Peran, userId: string): string {
  const terakhir = muatan.terakhir;
  if (peran === 'reviewer') {
    return terakhir?.status === 'diajukan'
      ? 'Revisi ini menunggu review. Setujui atau kembalikan lewat Antrean review.'
      : 'Reviewer hanya bisa membaca entri; penyuntingan dilakukan penulis.';
  }
  switch (terakhir?.status) {
    case 'diajukan':
      return 'Revisi ini sedang menunggu review, jadi belum bisa diubah. Anda bisa menyunting lagi setelah disetujui atau dikembalikan.';
    case 'draf':
      return 'Ada draf milik penulis lain yang belum diajukan. Entri ini bisa disunting lagi setelah draf itu diajukan dan diperiksa.';
    case 'dikembalikan':
      return terakhir.dibuatOleh === userId
        ? 'Revisi ini dikembalikan. Buat draf baru untuk memperbaikinya.'
        : 'Revisi ini dikembalikan ke penulisnya. Anda juga bisa membuat draf baru dari versi ini.';
    default:
      return 'Ini versi yang sedang terbit. Klik "Buat draf baru dari versi ini" untuk mengubahnya; versi terbit tetap tampil sampai draf baru disetujui.';
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
  // pratinjau terbuka (refs, mode, dst.); tanpa memo, objek `isi` baru tiap kali membuat <Pratinjau> memasang ulang
  // snapshotnya (kehilangan state di dalam pratinjau, mis. pilihan kuis yang sudah dijawab).
  const hasil = useMemo(hitungIsi, kunci);
  if (!hasil.ok) return <Alert variant="destructive" role="alert"><AlertDescription>{hasil.galat}</AlertDescription></Alert>;
  return <Pratinjau jenis={jenis} slug={slug} isi={hasil.isi} saatTutup={saatTutup} />;
}

function muatBaru(jenis: JenisKonten) {
  return {
    muatan: { jenis, slug: null, entriId: null, basis: null, terakhir: null, revisiTerbitId: null } satisfies Muatan,
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
  const modul = daftarModul.flatMap(e => {
    const isi = isiDari('modul', e.revisiTerakhir?.isi);
    return isi ? [{ nilai: String(isi.nomor), label: `${isi.nomor}. ${isi.judul}` }] : [];
  }).sort((a, b) => Number(a.nilai) - Number(b.nilai));
  const kelompok = new Set(daftarFaq.flatMap(e => {
    const isi = isiDari('faq', e.revisiTerakhir?.isi);
    return isi ? [isi.kelompok] : [];
  }));
  return { modul, kelompokFaq: [...kelompok].sort().map(k => ({ nilai: k, label: k })), istilah: OPSI_ISTILAH };
}
