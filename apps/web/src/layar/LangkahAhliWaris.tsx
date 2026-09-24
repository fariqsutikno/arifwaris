// Langkah 4: checklist ahli waris relatif ke satu mayit (pewaris, atau mayit munasakhat di langkah 5).
// Menerima graf + idMayit; menyerahkan graf baru lewat ubahGraf. Kartu bertingkat (cucu, keponakan,
// sepupu) menanyakan "dari siapa" bila ada lebih dari satu calon induk.

import { useState } from 'react';
import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import { DAFTAR_JENIS, daftarInduk, hitungIsian, jenisDari, kurangiAhliWaris, tambahAhliWaris, type JenisAhliWaris } from '../checklist';
import { KartuAhliWaris, Pilihan } from '../ui/komponen';

interface Props { graf: GrafKeluarga; idMayit: IdOrang; ubahGraf: (ubah: (graf: GrafKeluarga) => GrafKeluarga) => void }

export function LangkahAhliWaris({ graf, idMayit, ubahGraf }: Props) {
  const [pesan, setPesan] = useState<string | null>(null);
  const isian = hitungIsian(graf, idMayit);
  const jenisKelaminMayit = graf.orang[idMayit]!.jenisKelamin;
  const daftarTampil = DAFTAR_JENIS.filter(jenis => !jenis.hanyaUntuk || jenis.hanyaUntuk === jenisKelaminMayit);

  const coba = (ubah: (graf: GrafKeluarga) => GrafKeluarga) => {
    try {
      ubahGraf(ubah);
      setPesan(null);
    } catch (galat) {
      setPesan(galat instanceof Error ? galat.message : String(galat));
    }
  };

  return (
    <div className="tumpuk">
      {pesan && <p className="isian-salah" role="alert">{pesan}</p>}
      <div className="aw-heirs">
        {daftarTampil.map(jenis => (
          <KartuJenis key={jenis.kunci} jenis={jenis} graf={graf} idMayit={idMayit} jumlah={isian[jenis.kunci]?.length ?? 0} coba={coba} />
        ))}
      </div>
    </div>
  );
}

function KartuJenis({ jenis, graf, idMayit, jumlah, coba }: {
  jenis: JenisAhliWaris; graf: GrafKeluarga; idMayit: IdOrang; jumlah: number;
  coba: (ubah: (graf: GrafKeluarga) => GrafKeluarga) => void;
}) {
  const calonInduk = jenis.kunciInduk ? daftarInduk(graf, idMayit, jenis.kunciInduk) : [];
  const [idInduk, setIdInduk] = useState<IdOrang | undefined>(undefined);
  const indukTerpilih = idInduk && calonInduk.includes(idInduk) ? idInduk : undefined;
  return (
    <KartuAhliWaris
      nama={jenis.label} kelompok={jenis.kelompok} jumlah={jumlah}
      saatTambah={() => coba(g => tambahAhliWaris(g, idMayit, jenis.kunci, indukTerpilih ? { idInduk: indukTerpilih } : {}))}
      saatKurang={() => coba(g => kurangiAhliWaris(g, idMayit, jenis.kunci))}
    >
      {calonInduk.length > 1 && (
        <div className="chip-deret" aria-label={`${jenis.label} dari siapa?`}>
          {calonInduk.map(id => (
            <Pilihan key={id} terpilih={indukTerpilih === id} saatKlik={() => setIdInduk(id)}>
              {labelOrangChecklist(graf, idMayit, id, jenis.kunciInduk!)}
            </Pilihan>
          ))}
        </div>
      )}
    </KartuAhliWaris>
  );
}

/** "Anak laki-laki 2" atau "Anak laki-laki (sudah wafat)" untuk penghubung. */
export function labelOrangChecklist(graf: GrafKeluarga, idMayit: IdOrang, idOrang: IdOrang, kunci?: KunciAhliWaris): string {
  const orang = graf.orang[idOrang]!;
  if (orang.nama) return orang.nama;
  const kunciOrang = kunci ?? (Object.entries(hitungIsian(graf, idMayit)).find(([, ids]) => ids!.includes(idOrang))?.[0] as KunciAhliWaris | undefined);
  const label = kunciOrang ? jenisDari(kunciOrang)?.label ?? 'Kerabat' : 'Kerabat';
  if (orang.penghubung) return `${label} (sudah wafat)`;
  const sePeran = kunciOrang ? hitungIsian(graf, idMayit)[kunciOrang] ?? [] : [];
  return sePeran.length > 1 ? `${label} ${sePeran.indexOf(idOrang) + 1}` : label;
}
