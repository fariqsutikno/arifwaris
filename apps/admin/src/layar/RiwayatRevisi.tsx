// Riwayat satu entri sebagai linimasa (terbaru di atas): tiap revisi dan tiap kejadian Sampah (jejak_entri) ditulis
// sebagai kalimat manusia — siapa, melakukan apa, kapan — lengkap dengan catatan review/alasan. Tiap versi bisa
// dibandingkan dengan versi sebelumnya (alur "awalnya begini → diperbaiki begini"), dilihat isinya, dan dipakai sebagai
// draf baru (lewat EditorEntri; versi tayang tidak ditimpa); reviewer/admin bisa menayangkan lagi revisi disetujui
// yang bukan versi tayang (terbitkanUlang). Database tetap penjaga sebenarnya; tombol ini cuma sinyal UI. Entri di Sampah dipulihkan lewat
// tombol Pulihkan di editor, bukan dari sini, supaya pemulihan tercatat.
import { useEffect, useState } from 'react';
import type { JenisKonten } from '@waris/content';
import type { JejakEntri, RingkasanRevisi } from '@waris/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { bidangBanding, daftarPerubahan } from '../editor/banding';
import { useNamaTim } from '../hooks/useNamaTim';
import { waktuRelatif } from '../ringkas';
import { usePortal, type RepoPortal } from '../repo';
import { pesanGalat } from '../pesanGalat';
import { Perbandingan } from './Perbandingan';

const CATATAN_TARIK = 'pengajuan ditarik kembali';
type NamaDari = (userId: string) => string;
type Butir =
  | { jenis: 'revisi'; pada: string; revisi: RingkasanRevisi }
  | { jenis: 'jejak'; pada: string; jejak: JejakEntri };

/** `versi` berubah tiap kali editor menyimpan, supaya draf baru langsung muncul di riwayat. */
export function RiwayatRevisi(props: {
  entriId: string; jenis: JenisKonten; revisiTerbitId: string | null; versi?: number; saatBerubah: () => void;
  /** Ada = pengguna boleh menyunting entri ini; isi versi lama disalin menjadi draf. */
  pakaiSebagaiDraf?: ((revisi: RingkasanRevisi) => void) | undefined;
}) {
  const { repo, peran } = usePortal();
  const namaDari = useNamaTim();
  const [data, setData] = useState<{ revisi: RingkasanRevisi[]; jejak: JejakEntri[] } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    Promise.all([repo.konten.daftarRevisi(props.entriId), repo.konten.daftarJejak(props.entriId)])
      .then(([revisi, jejak]) => { if (!dibatalkan) setData({ revisi, jejak }); })
      .catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo, props.entriId, props.revisiTerbitId, props.versi]);

  if (galat) return <p role="alert" className="text-sm text-destructive">{galat}</p>;
  if (!data) return null;
  const terbit = data.revisi.find(r => r.id === props.revisiTerbitId) ?? null;
  const versi = data.revisi.filter(r => !r.hapus);
  const bolehTayangkanLagi = (peran === 'reviewer' || peran === 'admin') && !terbit?.hapus;
  const sekarang = new Date();

  return (
    <section aria-label="Riwayat" className="space-y-2">
      <Card className="gap-0 divide-y py-0">
        {susunLinimasa(data.revisi, data.jejak).map(butir => butir.jenis === 'jejak' ? (
          <article key={butir.jejak.id} aria-label="kejadian Sampah" className="space-y-1 px-4 py-3">
            <p className="text-sm">{kalimatJejak(butir.jejak, namaDari)} · <Waktu iso={butir.pada} sekarang={sekarang} /></p>
            {butir.jejak.catatan ? <p className="text-sm text-muted-foreground">Alasan: {butir.jejak.catatan}</p> : null}
          </article>
        ) : (
          <BarisRevisi
            key={butir.revisi.id}
            revisi={butir.revisi}
            jenis={props.jenis}
            sebelumnya={versi[versi.indexOf(butir.revisi) - 1] ?? null}
            pakaiSebagaiDraf={props.pakaiSebagaiDraf && !butir.revisi.hapus && butir.revisi.status !== 'draf' ? () => props.pakaiSebagaiDraf!(butir.revisi) : undefined}
            sedangTayang={butir.revisi.id === props.revisiTerbitId && !butir.revisi.hapus}
            bolehTayangkanLagi={bolehTayangkanLagi && butir.revisi.status === 'disetujui' && !butir.revisi.hapus && butir.revisi.id !== props.revisiTerbitId}
            namaDari={namaDari}
            sekarang={sekarang}
            repo={repo}
            saatBerubah={props.saatBerubah}
          />
        ))}
      </Card>
    </section>
  );
}

/** Revisi & jejak digabung, terbaru di atas. Pengajuan ke Sampah yang masih menunggu atau yang dibuang langsung sudah
 * diwakili jejaknya (beserta alasan), jadi revisi penandanya tidak ditulis dua kali. */
export function susunLinimasa(revisi: RingkasanRevisi[], jejak: JejakEntri[]): Butir[] {
  const butirRevisi = revisi
    .filter(r => !(r.hapus && (r.status === 'diajukan' || (r.status === 'disetujui' && r.diperiksaOleh === r.dibuatOleh))))
    .map((r): Butir => ({ jenis: 'revisi', pada: r.diperiksaPada ?? r.dibuatPada, revisi: r }));
  const butirJejak = jejak.map((j): Butir => ({ jenis: 'jejak', pada: j.pada, jejak: j }));
  return [...butirRevisi, ...butirJejak].sort((a, b) => b.pada.localeCompare(a.pada));
}

export function kalimatRevisi(r: RingkasanRevisi, namaDari: NamaDari): string {
  const pembuat = namaDari(r.dibuatOleh);
  const pemeriksa = r.diperiksaOleh ? namaDari(r.diperiksaOleh) : 'reviewer';
  if (r.hapus) {
    if (r.status === 'disetujui') return `${pemeriksa} menyetujui pemindahan ke Sampah (diajukan ${pembuat})`;
    if (r.catatanReview === CATATAN_TARIK) return `${pembuat} membatalkan pengajuan ke Sampah`;
    return `${pemeriksa} menolak pemindahan ke Sampah (diajukan ${pembuat})`;
  }
  switch (r.status) {
    case 'draf': return `${pembuat} menyimpan draf (belum dikirim)`;
    case 'diajukan': return `${pembuat} mengirim perubahan untuk review`;
    case 'disetujui': return r.diperiksaOleh === r.dibuatOleh ? `${pembuat} menerbitkan perubahan` : `${pemeriksa} menyetujui perubahan dari ${pembuat}`;
    case 'dikembalikan': return `${pemeriksa} mengembalikan perubahan dari ${pembuat}`;
  }
}

export function kalimatJejak(j: JejakEntri, namaDari: NamaDari): string {
  const pelaku = namaDari(j.pelaku);
  switch (j.aksi) {
    case 'dibuang': return `${pelaku} memindahkan entri ke Sampah`;
    case 'buang_diajukan': return `${pelaku} mengajukan pemindahan ke Sampah`;
    case 'dipulihkan': return `${pelaku} memulihkan entri dari Sampah`;
    case 'diarsipkan': return `${pelaku} mengarsipkan entri (ditarik dari web)`;
    case 'dikeluarkan_arsip': return `${pelaku} mengeluarkan entri dari Arsip`;
  }
}

function BarisRevisi(props: {
  revisi: RingkasanRevisi; jenis: JenisKonten; sebelumnya: RingkasanRevisi | null; sedangTayang: boolean; bolehTayangkanLagi: boolean;
  namaDari: NamaDari; sekarang: Date; repo: RepoPortal; saatBerubah: () => void; pakaiSebagaiDraf: (() => void) | undefined;
}) {
  const { revisi, jenis, sebelumnya } = props;
  const [tampil, setTampil] = useState<'banding' | 'isi' | null>(null);
  const alih = (bagian: 'banding' | 'isi') => setTampil(v => (v === bagian ? null : bagian));
  const [galat, setGalat] = useState<string | null>(null);

  async function tayangkanLagi() {
    if (!window.confirm('Tayangkan lagi versi ini? Versi yang sekarang tayang di web akan digantikan.')) return;
    setGalat(null);
    try {
      await props.repo.editorial.terbitkanUlang(revisi.id);
      props.saatBerubah();
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  }

  return (
    <article aria-label={`revisi ${revisi.id.slice(0, 8)}`} className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm">{kalimatRevisi(revisi, props.namaDari)} · <Waktu iso={revisi.diperiksaPada ?? revisi.dibuatPada} sekarang={props.sekarang} /></p>
        {props.sedangTayang ? <Badge>Tayang</Badge> : null}
        {!revisi.hapus ? (
          <span className="ml-auto flex flex-wrap gap-x-3 gap-y-1">
            <Button variant="link" size="sm" className="h-auto p-0" aria-pressed={tampil === 'banding'} onClick={() => alih('banding')}>Bandingkan dengan versi sebelumnya</Button>
            <Button variant="link" size="sm" className="h-auto p-0" aria-pressed={tampil === 'isi'} onClick={() => alih('isi')}>Lihat isi versi ini</Button>
            {props.pakaiSebagaiDraf ? <Button variant="link" size="sm" className="h-auto p-0" onClick={props.pakaiSebagaiDraf}>Pakai versi ini sebagai draf</Button> : null}
            {props.bolehTayangkanLagi ? <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void tayangkanLagi()}>Tayangkan lagi</Button> : null}
          </span>
        ) : null}
      </div>
      {revisi.catatanReview && revisi.catatanReview !== CATATAN_TARIK ? <p className="text-sm text-muted-foreground">Catatan review: {revisi.catatanReview}</p> : null}
      {galat ? <p role="alert" className="text-sm text-destructive">{galat}</p> : null}
      {tampil === 'banding' ? (
        <Perbandingan perubahan={daftarPerubahan(sebelumnya && bidangBanding(jenis, sebelumnya.isi, sebelumnya.refs), bidangBanding(jenis, revisi.isi, revisi.refs))}
          keterangan={sebelumnya ? 'Dibandingkan dengan versi sebelumnya.' : 'Versi pertama: semua isi ditambahkan.'} />
      ) : null}
      {tampil === 'isi' ? (
        <dl className="grid gap-2 rounded-lg border bg-muted/30 p-3">
          {bidangBanding(jenis, revisi.isi, revisi.refs).filter(b => b.teks).map(b => (
            <div key={b.label} className="grid gap-0.5">
              <dt className="text-xs font-semibold text-muted-foreground">{b.label}</dt>
              <dd className="text-sm whitespace-pre-wrap" {...(b.arab ? { dir: 'rtl', lang: 'ar' } : {})}>{b.teks}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}

function Waktu({ iso, sekarang }: { iso: string; sekarang: Date }) {
  return <time dateTime={iso} title={new Date(iso).toLocaleString('id-ID')} className="text-muted-foreground">{waktuRelatif(iso, sekarang)}</time>;
}
