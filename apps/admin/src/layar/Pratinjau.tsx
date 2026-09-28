// Pratinjau: menampilkan satu entri yang sedang disunting lewat layar web sungguhan (Materi, KartuSoalKuis, Faq,
// TanyaJawab), bukan tiruan tampilan. Saat mount, entri ditambal ke snapshot terpasang (menggantikan entri lama
// dengan jenis+slug sama bila ada); saat unmount, snapshot asal dipasang kembali supaya tidak bocor ke layar lain.
// Soal hitung ditampilkan sebagai baris latihan + hasil hitung engine (layar Hasil mode belajar); modul & cheatsheet
// lewat halaman Belajar, syahid & kitab lewat halaman Rujukan, glosarium Arab lewat Glosarium. Jenis tanpa layar web
// (ahwal, teks_edukasi) ditampilkan sebagai teks/daftar sederhana. Lebar bisa diganti HP / desktop, dan "Perbesar"
// menjadikannya layar penuh (elemen yang sama, jadi isi pratinjau tidak dipasang ulang). Klik tautan internal web
// (#/…) dicegat: rute portal tidak berubah, cukup diberi keterangan.
// ponytail: pratinjau memakai snapshot bawaan build sebagai latar, bukan data DB terbaru; cukup untuk melihat
// tampilan satu entri.
import { useEffect, useLayoutEffect, useState, type MouseEvent } from 'react';
import { keJson, type EntriFaq, type IsiKonten, type JenisKonten, type SoalHitung, type SoalKuis } from '@waris/content';
import { pasangSnapshot, snapshotTerpasang } from '@waris/web/sumber';
import { Materi } from '@waris/web/belajar/Materi';
import { KartuSoalKuis } from '@waris/web/belajar/KartuSoalKuis';
import { Faq } from '@waris/web/belajar/Faq';
import { TanyaJawab } from '@waris/web/belajar/TanyaJawab';
import { Belajar } from '@waris/web/belajar/Belajar';
import { Rujukan } from '@waris/web/belajar/Rujukan';
import { Glosarium } from '@waris/web/belajar/Glosarium';
import { Hasil } from '@waris/web/layar/Hasil';
import { kasusDariContoh } from '@waris/web/contoh';
import { Maximize2, Minimize2, Monitor, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props<J extends JenisKonten> { jenis: J; slug: string; isi: IsiKonten[J]; saatTutup: () => void }

export function Pratinjau<J extends JenisKonten>({ jenis, slug, isi, saatTutup }: Props<J>) {
  // siap baru true setelah efek terpasang: anak (Materi dkk.) digerbang di baliknya supaya render pertamanya
  // sudah melihat snapshot pratinjau, bukan snapshot lama.
  const [siap, setSiap] = useState(false);
  const [lebarHp, setLebarHp] = useState(false);
  const [besar, setBesar] = useState(false);
  const [tautanDicegat, setTautanDicegat] = useState(false);
  useEffect(() => {
    if (!besar) return;
    const tutupDenganEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setBesar(false); };
    window.addEventListener('keydown', tutupDenganEsc);
    return () => window.removeEventListener('keydown', tutupDenganEsc);
  }, [besar]);
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
    <Card className={cn('gap-0 overflow-hidden py-0', besar && 'fixed inset-0 z-50 rounded-none')}
      role={besar ? 'dialog' : undefined} aria-modal={besar || undefined} aria-label={besar ? 'Pratinjau layar penuh' : undefined}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted px-4 py-2">
        <span className="mr-auto text-sm font-semibold">Pratinjau</span>
        <Button variant={lebarHp ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Lebar HP" aria-pressed={lebarHp} onClick={() => setLebarHp(true)}><Smartphone /></Button>
        <Button variant={lebarHp ? 'ghost' : 'secondary'} size="icon-sm" aria-label="Lebar desktop" aria-pressed={!lebarHp} onClick={() => setLebarHp(false)}><Monitor /></Button>
        <Button variant="ghost" size="sm" aria-pressed={besar} onClick={() => setBesar(!besar)}>
          {besar ? <><Minimize2 />Perkecil</> : <><Maximize2 />Perbesar</>}
        </Button>
        <Button variant="ghost" size="sm" onClick={saatTutup}><X />Tutup pratinjau</Button>
      </div>
      {tautanDicegat ? (
        <p role="status" className="border-b bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
          Tautan itu menuju halaman lain di aplikasi, jadi tidak dibuka di pratinjau.
        </p>
      ) : null}
      {/* Layar web memakai gaya komponen.css sendiri (body 16px/26px), bukan Tailwind. transform menjadikan kotak ini
          acuan elemen position:fixed web (bar bawah Hasil), supaya tidak keluar menutupi portal. */}
      <div className={cn('overflow-auto bg-background p-4 text-base leading-[26px] [transform:translateZ(0)]', besar && 'min-h-0 flex-1')}
        onClickCapture={cegatTautanInternal}>
        <div className={lebarHp ? 'mx-auto max-w-[375px] rounded-lg border' : undefined}>{siap ? <LayarUntukJenis jenis={jenis} slug={slug} isi={isi} /> : null}</div>
      </div>
    </Card>
  );

  function cegatTautanInternal(e: MouseEvent) {
    const tautan = (e.target as Element).closest('a[href^="#"]');
    if (!tautan) return;
    e.preventDefault();
    setTautanDicegat(true);
  }
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
    case 'soal_hitung':
      return <PratinjauSoalHitung soal={isi as unknown as SoalHitung} />;
    case 'modul': case 'cheatsheet':
      return <Belajar />;
    case 'syahid':
      return <Rujukan kategori="quran" />;
    case 'kitab':
      return <Rujukan kategori="kitab" />;
    case 'glosarium_ar':
      return <Glosarium id={(isi as IsiKonten['glosarium_ar']).istilahId} />;
    case 'teks_edukasi': {
      const teks = isi as IsiKonten['teks_edukasi'];
      return <div className="tumpuk"><p>{teks.id}</p>{teks.ar ? <p dir="rtl" lang="ar">{teks.ar}</p> : null}</div>;
    }
    case 'ahwal':
      return (
        <ul className="tumpuk">
          {(isi as IsiKonten['ahwal']).baris.map((baris, i) => <li key={i}><b>{baris.bagian}</b>: {baris.syarat}</li>)}
        </ul>
      );
    case 'rujukan': {
      const rujukan = isi as IsiKonten['rujukan'];
      return <div className="tumpuk"><b>{rujukan.klaim}</b><span className="keterangan">{rujukan.sumber}</span><p>{rujukan.kutipan}</p></div>;
    }
    default:
      return <p className="keterangan">Jenis ini belum ada pratinjaunya.</p>;
  }
}

/** Baris soal seperti di halaman Latihan, lalu kasusnya dihitung engine seperti saat pengguna menekan Kerjakan. */
function PratinjauSoalHitung({ soal }: { soal: SoalHitung }) {
  let kasus;
  try {
    kasus = kasusDariContoh(soal.kasus);
  } catch (e) {
    return <p role="alert" className="keterangan">Kasus belum bisa dihitung: {e instanceof Error ? e.message : String(e)}</p>;
  }
  return (
    <div className="tumpuk">
      <div className="baris-soal">
        <div className="isi-soal">
          <b>{soal.judul}</b>
          <span className="keterangan"><span className={`tingkat tingkat-${soal.tingkat}`}>{soal.tingkat}</span> · {soal.topik}</span>
        </div>
      </div>
      <Hasil kasus={kasus} idSesi={`pratinjau-${soal.kode}`} tujuan="belajar" kirim={() => {}} terkunci />
    </div>
  );
}
