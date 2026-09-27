// Pratinjau: menampilkan satu entri yang sedang disunting lewat layar web sungguhan (Materi, KartuSoalKuis, Faq,
// TanyaJawab), bukan tiruan tampilan. Saat mount, entri ditambal ke snapshot terpasang (menggantikan entri lama
// dengan jenis+slug sama bila ada); saat unmount, snapshot asal dipasang kembali supaya tidak bocor ke layar lain.
// Jenis tanpa layar web (ahwal, teks_edukasi, dst.) ditampilkan sebagai JSON berindentasi.
// ponytail: pratinjau memakai snapshot bawaan build sebagai latar, bukan data DB terbaru; cukup untuk melihat
// tampilan satu entri.
import { useLayoutEffect, useState } from 'react';
import { keJson, type EntriFaq, type IsiKonten, type JenisKonten, type SoalKuis } from '@waris/content';
import { pasangSnapshot, snapshotTerpasang } from '@waris/web/sumber';
import { Materi } from '@waris/web/belajar/Materi';
import { KartuSoalKuis } from '@waris/web/belajar/KartuSoalKuis';
import { Faq } from '@waris/web/belajar/Faq';
import { TanyaJawab } from '@waris/web/belajar/TanyaJawab';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props<J extends JenisKonten> { jenis: J; slug: string; isi: IsiKonten[J]; saatTutup: () => void }

export function Pratinjau<J extends JenisKonten>({ jenis, slug, isi, saatTutup }: Props<J>) {
  // siap baru true setelah efek terpasang: anak (Materi dkk.) digerbang di baliknya supaya render pertamanya
  // sudah melihat snapshot pratinjau, bukan snapshot lama.
  const [siap, setSiap] = useState(false);
  // Kunci efek = isi yang sudah diserialisasi, bukan referensi `isi` itu sendiri: pemanggil (Pratinjauan di
  // EditorEntri) idealnya memoize `isi`, tapi kalau suatu saat ada pemanggil lain yang lupa, referensi baru
  // dengan konten sama tidak boleh memicu pasang-ulang snapshot (kehilangan state di dalam pratinjau, mis.
  // pilihan kuis yang sudah dijawab).
  const kunciIsi = JSON.stringify(keJson(jenis, isi));
  // asal ditangkap DI DALAM efek (bukan lazy-init state) supaya benar di StrictMode: efek mount di-run-cleanup-
  // run-ulang (dev only), jadi tiap kali efek ini jalan, asal = snapshot yang terpasang saat itu (yang di run
  // kedua sudah snapshot asli lagi karena cleanup run pertama sudah memulihkannya) — bukan snapshot pratinjau
  // yang terlanjur ditangkap sebagai "asal" oleh invocation kedua.
  useLayoutEffect(() => {
    const asal = snapshotTerpasang();
    pasangSnapshot({
      ...asal,
      konten: [
        ...asal.konten.filter(baris => !(baris.jenis === jenis && baris.slug === slug)),
        { entriId: 'pratinjau', jenis, slug, urutan: 0, revisiId: 'pratinjau', isi: keJson(jenis, isi), refs: [], versiTerbit: asal.versi },
      ],
    });
    setSiap(true);
    return () => { pasangSnapshot(asal); setSiap(false); };
  }, [jenis, slug, kunciIsi]);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-center justify-between border-b bg-muted px-4 py-2">
        <span className="text-sm font-semibold">Pratinjau</span>
        <Button variant="ghost" size="sm" onClick={saatTutup}><X />Tutup pratinjau</Button>
      </div>
      {/* Layar web memakai gaya komponen.css sendiri (body 16px/26px), bukan Tailwind. */}
      <div className="bg-background p-4 text-base leading-[26px]">{siap ? <LayarUntukJenis jenis={jenis} slug={slug} isi={isi} /> : null}</div>
    </Card>
  );
}

function LayarUntukJenis<J extends JenisKonten>({ jenis, slug, isi }: { jenis: J; slug: string; isi: IsiKonten[J] }) {
  switch (jenis) {
    case 'materi':
      return <Materi slug={slug} kasusSekarang={null} saatCoba={() => {}} />;
    case 'soal_kuis':
      return <KartuSoalKuis soal={isi as unknown as SoalKuis} />;
    case 'faq':
      return <Faq id={(isi as unknown as EntriFaq).id} kasusSekarang={null} saatCoba={() => {}} />;
    case 'tanya_jawab':
      return <TanyaJawab slug={slug} kasusSekarang={null} saatCoba={() => {}} />;
    default:
      return (
        <div>
          <p className="keterangan">Jenis ini belum ada pratinjau; berikut isi mentahnya.</p>
          <pre className="overflow-auto font-mono text-xs">{JSON.stringify(keJson(jenis, isi), null, 2)}</pre>
        </div>
      );
  }
}
