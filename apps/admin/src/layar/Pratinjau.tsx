// Pratinjau: menampilkan satu entri yang sedang disunting lewat layar web sungguhan (Materi, KartuSoalKuis, Faq,
// TanyaJawab), bukan tiruan tampilan. Saat mount, entri ditambal ke snapshot terpasang (menggantikan entri lama
// dengan jenis+slug sama bila ada); saat unmount, snapshot asal dipasang kembali supaya tidak bocor ke layar lain.
// Jenis tanpa layar web (ahwal, teks_edukasi, dst.) ditampilkan sebagai JSON berindentasi.
// ponytail: pratinjau memakai snapshot bawaan build sebagai latar, bukan data DB terbaru; cukup untuk melihat
// tampilan satu entri.
import { useEffect, useState } from 'react';
import { keJson, type EntriFaq, type IsiKonten, type JenisKonten, type SoalKuis } from '@waris/content';
import { pasangSnapshot, snapshotTerpasang } from '@waris/web/sumber';
import { Materi } from '@waris/web/belajar/Materi';
import { KartuSoalKuis } from '@waris/web/belajar/KartuSoalKuis';
import { Faq } from '@waris/web/belajar/Faq';
import { TanyaJawab } from '@waris/web/belajar/TanyaJawab';
import { Tombol } from '@waris/web/ui/komponen';

interface Props<J extends JenisKonten> { jenis: J; slug: string; isi: IsiKonten[J]; saatTutup: () => void }

export function Pratinjau<J extends JenisKonten>({ jenis, slug, isi, saatTutup }: Props<J>) {
  // asal ditangkap sekali (state lazy-init), dipulihkan lewat cleanup useEffect saat unmount (Review Focus 4).
  const [asal] = useState(() => snapshotTerpasang());
  // Dipasang langsung di badan render (bukan efek): React merender anak (Materi dkk.) sebagai bagian dari render
  // ini juga, sebelum efek mana pun sempat jalan, jadi snapshot pratinjau harus sudah terpasang di titik ini.
  pasangSnapshot({
    ...asal,
    konten: [
      ...asal.konten.filter(baris => !(baris.jenis === jenis && baris.slug === slug)),
      { entriId: 'pratinjau', jenis, slug, urutan: 0, revisiId: 'pratinjau', isi: keJson(jenis, isi), refs: [], versiTerbit: asal.versi },
    ],
  });
  useEffect(() => () => pasangSnapshot(asal), [asal]);

  return (
    <div className="aw-pratinjau">
      <Tombol varian="secondary" onClick={saatTutup}>Tutup pratinjau</Tombol>
      <LayarUntukJenis jenis={jenis} slug={slug} isi={isi} />
    </div>
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
          <pre>{JSON.stringify(keJson(jenis, isi), null, 2)}</pre>
        </div>
      );
  }
}
