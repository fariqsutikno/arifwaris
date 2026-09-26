// Editor entri hibrida: memuat entri (jenis, slug, revisi terakhir & terbit), menampilkan isi sebagai BentukEditor
// (input teks, Markdown blok materi Indonesia/Arab, sisa JSON) + PemilihRefs. Memutuskan boleh sunting lewat
// bolehSuntingDraf (UI saja; database tetap penjaga), lalu menyimpan lewat repo.editorial (buatEntri/buatDraf/
// ubahDraf/ajukan). Galat validasi (dariBentuk) maupun galat repo ditampilkan, tidak ditelan.
import { useEffect, useState } from 'react';
import { bacaIsi, bolehSuntingDraf, periksaRefs, JENIS_KONTEN, slug as buatSlug, type JenisKonten } from '@waris/content';
import type { RingkasanRevisi } from '@waris/data';
import { Tombol } from '@waris/web/ui/komponen';
import { dariBentuk, keBentuk, type BentukEditor } from '../editor/bentuk';
import { usePortal } from '../repo';
import { tulisRute } from '../rute';
import { PemilihRefs } from './PemilihRefs';
import { Pratinjau } from './Pratinjau';

const JARAK_URUTAN = 10;
const FIELD_CALON_JUDUL = ['judul', 'pertanyaan', 'slug', 'id', 'kode', 'kunci', 'istilahId'] as const;

type Mode = { mode: 'baca' } | { mode: 'suntingDraf'; revisiId: string } | { mode: 'drafBaru' };
// basis = revisi yang isinya dimuat ke form; terakhir = revisi terbaru (status & catatan review ditampilkan dari sini).
interface Muatan { jenis: JenisKonten; slug: string | null; entriId: string | null; basis: RingkasanRevisi | null; terakhir: RingkasanRevisi | null }

export function EditorEntri(props: { entriId: string } | { jenis: JenisKonten }) {
  const { repo, sesi, peran } = usePortal();
  const [muatan, setMuatan] = useState<Muatan | null>(null);
  const [bentuk, setBentuk] = useState<BentukEditor | null>(null);
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
      setMuatan(hasil.muatan);
      setBentuk(hasil.bentuk);
      setRefs(hasil.muatan.basis?.refs ?? []);
      setMode(tentukanMode(hasil.muatan));
    })().catch(e => { if (!dibatalkan) setGalat(pesan(e)); });
    return () => { dibatalkan = true; };
  }, [repo, entriIdProp, jenisProp, muatUlang]);

  async function muatEntri(entriId: string) {
    // ponytail: memindai daftarEntri semua jenis untuk menemukan jenis/slug satu entri; ganti dengan repo.konten.bacaEntri(entriId) bila jumlah entri besar.
    const semua = (await Promise.all(JENIS_KONTEN.map(jenis => repo.konten.daftarEntri(jenis)))).flat();
    const entri = semua.find(e => e.entriId === entriId);
    if (!entri) throw new Error(`entri ${entriId} tidak ditemukan`);
    const terakhir = entri.revisiTerakhir;
    // Draf/diajukan/dikembalikan: isinya sendiri jadi basis (dikembalikan boleh didrafkan ulang dari isinya).
    // Disetujui: basis = revisi yang sedang terbit (bisa berbeda bila pernah terbitkanUlang revisi lama).
    const basis = entri.revisiTerbitId && terakhir?.status === 'disetujui'
      ? (await repo.konten.daftarRevisi(entriId)).find(r => r.id === entri.revisiTerbitId) ?? terakhir
      : terakhir;
    const muatan: Muatan = { jenis: entri.jenis, slug: entri.slug, entriId, basis, terakhir };
    return { muatan, bentuk: basis ? bentukDariRevisi(entri.jenis, basis) : bentukKosong(entri.jenis) };
  }

  function tentukanMode(m: Muatan): Mode {
    if (!m.entriId) return { mode: 'drafBaru' };
    const basis = m.basis;
    if (basis?.status === 'draf' && bolehSuntingDraf({ peran, pelakuId: sesi.userId, pembuatId: basis.dibuatOleh, status: basis.status })) {
      return { mode: 'suntingDraf', revisiId: basis.id };
    }
    return { mode: 'baca' };
  }

  async function simpan() {
    if (!muatan || !bentuk) return;
    setGalat(null);
    const hasil = dariBentuk(muatan.jenis, muatan.slug ?? 'baru', bentuk);
    if (!hasil.ok) { setGalat(hasil.galat); return; }
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

  if (!muatan || !bentuk) return galat ? <p role="alert">{galat}</p> : null;
  const bacaSaja = mode.mode === 'baca';
  const ubahTeks = (kunci: string, nilai: string) => setBentuk({ ...bentuk, teks: { ...bentuk.teks, [kunci]: nilai } });

  return (
    <div>
      <h2>{muatan.jenis}: {muatan.slug ?? 'entri baru'}</h2>
      {muatan.terakhir ? <p>Status: {muatan.terakhir.status}</p> : null}
      {muatan.terakhir?.catatanReview ? <p>Catatan review: {muatan.terakhir.catatanReview}</p> : null}
      {galat ? <p role="alert">{galat}</p> : null}
      {Object.entries(bentuk.teks).map(([kunci, nilai]) => (
        <label key={kunci} style={{ display: 'block' }}>
          {kunci}{' '}
          <input value={nilai} readOnly={bacaSaja} onChange={e => ubahTeks(kunci, e.target.value)} />
        </label>
      ))}
      {bentuk.blok !== null ? (
        <label style={{ display: 'block' }}>
          Blok (Indonesia)
          <textarea rows={16} value={bentuk.blok} readOnly={bacaSaja} onChange={e => setBentuk({ ...bentuk, blok: e.target.value })} />
        </label>
      ) : null}
      {bentuk.blokAr !== null ? (
        <label style={{ display: 'block' }}>
          Blok (Arab)
          <textarea rows={16} dir="rtl" value={bentuk.blokAr} readOnly={bacaSaja} onChange={e => setBentuk({ ...bentuk, blokAr: e.target.value })} />
        </label>
      ) : null}
      <label style={{ display: 'block' }}>
        JSON
        <textarea rows={12} style={{ fontFamily: 'monospace' }} value={bentuk.json} readOnly={bacaSaja} onChange={e => setBentuk({ ...bentuk, json: e.target.value })} />
      </label>
      <PemilihRefs nilai={refs} saatUbah={setRefs} bacaSaja={bacaSaja} />
      <Tombol varian="secondary" onClick={() => setPratinjau(true)}>Pratinjau</Tombol>
      {pratinjau ? <Pratinjauan jenis={muatan.jenis} slug={muatan.slug ?? 'pratinjau'} bentuk={bentuk} saatTutup={() => setPratinjau(false)} /> : null}
      {!bacaSaja ? <Tombol onClick={() => void simpan()}>Simpan draf</Tombol> : null}
      {mode.mode === 'suntingDraf' ? <Tombol varian="secondary" onClick={() => void ajukan()}>Ajukan</Tombol> : null}
      {bacaSaja && peran !== 'reviewer' && muatan.entriId && muatan.terakhir?.status !== 'draf' && muatan.terakhir?.status !== 'diajukan' ? (
        <Tombol varian="secondary" onClick={() => setMode({ mode: 'drafBaru' })}>Buat draf baru dari versi ini</Tombol>
      ) : null}
    </div>
  );
}

// Menggabung bentuk form jadi isi konten lewat dariBentuk sebelum diserahkan ke <Pratinjau>; kalau bentuknya
// tidak sah (JSON/Markdown rusak, gagal validasi), galat itu sendiri ditampilkan menggantikan pratinjau.
function Pratinjauan({ jenis, slug, bentuk, saatTutup }: { jenis: JenisKonten; slug: string; bentuk: BentukEditor; saatTutup: () => void }) {
  const hasil = dariBentuk(jenis, slug, bentuk);
  if (!hasil.ok) return <p role="alert">{hasil.galat}</p>;
  return <Pratinjau jenis={jenis} slug={slug} isi={hasil.isi} saatTutup={saatTutup} />;
}

function muatBaru(jenis: JenisKonten) {
  return { muatan: { jenis, slug: null, entriId: null, basis: null, terakhir: null } satisfies Muatan, bentuk: bentukKosong(jenis) };
}

function bentukKosong(jenis: JenisKonten): BentukEditor {
  return { teks: {}, blok: jenis === 'materi' ? '' : null, blokAr: null, json: '{}' };
}

function bentukDariRevisi(jenis: JenisKonten, revisi: RingkasanRevisi): BentukEditor {
  const hasil = bacaIsi(jenis, revisi.isi);
  if (!hasil.ok) throw new Error(`isi revisi tidak sah: ${hasil.galat}`);
  return keBentuk(jenis, hasil.isi);
}

function slugDariIsi(isi: unknown): string | null {
  const objek = isi as Record<string, unknown>;
  const calon = FIELD_CALON_JUDUL.map(kunci => objek[kunci]).find((n): n is string => typeof n === 'string' && n.length > 0);
  return calon ? buatSlug(calon) : null;
}

const pesan = (e: unknown) => (e instanceof Error ? e.message : String(e));
