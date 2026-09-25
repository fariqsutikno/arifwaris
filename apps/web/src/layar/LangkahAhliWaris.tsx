// Langkah 4: isian ahli waris relatif ke satu mayit (pewaris, atau mayit munasakhat di langkah 5).
// Mulai kosong: tambah cepat untuk kerabat yang paling sering ada, kerabat lain dibuka bila perlu (beban pikir rendah).
// Label sehari-hari sebagai judul, istilah fikih sebagai caption. Menyerahkan graf baru lewat ubahGraf.

import { useState } from 'react';
import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import { daftarInduk, hapusAhliWaris, hitungIsian, jenisDari, tambahAhliWaris } from '../checklist';
import { HUBUNGAN_SAUDARA, KELOMPOK_LAIN, LABEL_SEHARI, TAMBAH_CEPAT } from '../konten/ahliWaris';

interface Props { graf: GrafKeluarga; idMayit: IdOrang; ubahGraf: (ubah: (graf: GrafKeluarga) => GrafKeluarga) => void }

export function LangkahAhliWaris({ graf, idMayit, ubahGraf }: Props) {
  const [pesan, setPesan] = useState<string | null>(null);
  const [kerabatLainTerbuka, setKerabatLainTerbuka] = useState(false);
  const isian = hitungIsian(graf, idMayit);
  const jenisKelaminMayit = graf.orang[idMayit]!.jenisKelamin;

  const coba = (ubah: (graf: GrafKeluarga) => GrafKeluarga) => {
    try {
      ubahGraf(ubah);
      setPesan(null);
    } catch (galat) {
      setPesan(galat instanceof Error ? galat.message : String(galat));
    }
  };
  const tambah = (kunci: KunciAhliWaris, idInduk?: IdOrang) =>
    coba(g => tambahAhliWaris(g, idMayit, kunci, idInduk ? { idInduk } : {}));
  const sudahPenuh = (kunci: KunciAhliWaris) => {
    const maksimal = jenisDari(kunci)?.maksimal;
    return maksimal !== undefined && (isian[kunci]?.length ?? 0) >= maksimal;
  };
  const tampilUntukMayit = (kunci: KunciAhliWaris) => {
    const hanyaUntuk = jenisDari(kunci)?.hanyaUntuk;
    return !hanyaUntuk || hanyaUntuk === jenisKelaminMayit;
  };

  return (
    <div className="isian-ahli-waris">
      {pesan && <p className="isian-salah" role="alert">{pesan}</p>}

      <DaftarTerisi graf={graf} idMayit={idMayit} saatHapus={idOrang => coba(g => hapusAhliWaris(g, idOrang))} />

      <section className="tambah-ahli-waris" aria-labelledby={`judul-cepat-${idMayit}`}>
        <h3 id={`judul-cepat-${idMayit}`} className="judul-bagian-kecil">Tambah cepat</h3>
        <div className="tombol-cepat">
          {TAMBAH_CEPAT.filter(tampilUntukMayit).map(kunci => (
            <button key={kunci} type="button" className="tombol-tambah" aria-label={`Tambah ${LABEL_SEHARI[kunci]}`}
              disabled={sudahPenuh(kunci)} onClick={() => tambah(kunci)}>
              <span aria-hidden="true">+</span>{LABEL_SEHARI[kunci]}
            </button>
          ))}
        </div>
      </section>

      <button type="button" className="buka-kerabat" aria-expanded={kerabatLainTerbuka} onClick={() => setKerabatLainTerbuka(!kerabatLainTerbuka)}>
        {kerabatLainTerbuka ? 'Tutup kerabat lain' : 'Tambah kerabat lain'}
        <small>cucu, kakak/adik, kakek-nenek, keponakan, paman</small>
      </button>

      {kerabatLainTerbuka && (
        <div className="kerabat-lain">
          <PilihSaudara saatTambah={tambah} />
          {KELOMPOK_LAIN.map(kelompok => (
            <fieldset key={kelompok.judul} className="kelompok-kerabat">
              <legend>{kelompok.judul}</legend>
              {kelompok.catatan && <p className="caption-isian">{kelompok.catatan}</p>}
              <div className="tombol-cepat">
                {kelompok.pilihan.map(kunci => (
                  <TombolDenganInduk key={kunci} kunci={kunci} graf={graf} idMayit={idMayit} penuh={sudahPenuh(kunci)} saatTambah={tambah} />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}

/** Orang yang sudah ditambahkan, dikelompokkan per jenis, masing-masing bisa dihapus. */
function DaftarTerisi({ graf, idMayit, saatHapus }: { graf: GrafKeluarga; idMayit: IdOrang; saatHapus: (idOrang: IdOrang) => void }) {
  const isian = Object.entries(hitungIsian(graf, idMayit)) as Array<[KunciAhliWaris, IdOrang[]]>;
  const orang = isian.flatMap(([kunci, daftar]) => daftar.map(idOrang => ({ idOrang, kunci, label: labelOrangChecklist(graf, idMayit, idOrang, kunci) })));
  if (orang.length === 0) return <p className="kosong-ahli-waris">Belum ada yang ditambahkan. Mulai dari tombol di bawah.</p>;
  return (
    <ul className="daftar-terisi" aria-label="Ahli waris yang sudah ditambahkan">
      {orang.map(({ idOrang, kunci, label }) => {
        const istilah = jenisDari(kunci)?.label;
        return (
          <li key={idOrang} className={`orang-terisi g-${jenisDari(kunci)?.kelompok ?? 'saudara'}`}>
            <span className="orang-terisi-teks"><b>{label}</b>{istilah && istilah !== LABEL_SEHARI[kunci] && <small>{istilah}</small>}</span>
            <button type="button" aria-label={`Hapus ${label}`} onClick={() => saatHapus(idOrang)}>×</button>
          </li>
        );
      })}
    </ul>
  );
}

/** Kakak/adik: jenis kelamin dulu, lalu hubungan orang tua, baru ditambahkan. */
function PilihSaudara({ saatTambah }: { saatTambah: (kunci: KunciAhliWaris) => void }) {
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P' | null>(null);
  const [hubungan, setHubungan] = useState<typeof HUBUNGAN_SAUDARA[number] | null>(null);
  return (
    <fieldset className="kelompok-kerabat" aria-label="Kakak/adik almarhum">
      <legend>Kakak/adik almarhum</legend>
      <div className="tahap-pilih" role="radiogroup" aria-label="Jenis kelamin">
        {(['L', 'P'] as const).map(nilai => (
          <button key={nilai} type="button" role="radio" aria-checked={jenisKelamin === nilai} className="chip-pilih" onClick={() => setJenisKelamin(nilai)}>
            {nilai === 'L' ? 'Laki-laki' : 'Perempuan'}
          </button>
        ))}
      </div>
      {jenisKelamin && (
        <div className="tahap-pilih" role="radiogroup" aria-label="Hubungan orang tua">
          {HUBUNGAN_SAUDARA.map(pilihan => (
            <button key={pilihan.nilai} type="button" role="radio" aria-checked={hubungan?.nilai === pilihan.nilai} className="chip-pilih" onClick={() => setHubungan(pilihan)}>
              {pilihan.label}
            </button>
          ))}
        </div>
      )}
      {jenisKelamin && hubungan && (
        <button type="button" className="tombol-tambah" onClick={() => saatTambah(hubungan[jenisKelamin])}>
          <span aria-hidden="true">+</span>Tambah kakak/adik {jenisKelamin === 'L' ? 'laki-laki' : 'perempuan'} ({hubungan.label.toLowerCase()})
        </button>
      )}
    </fieldset>
  );
}

/** Kerabat bertingkat (cucu, keponakan, sepupu): bila calon induknya lebih dari satu, tanya "dari siapa". */
function TombolDenganInduk({ kunci, graf, idMayit, penuh, saatTambah }: {
  kunci: KunciAhliWaris; graf: GrafKeluarga; idMayit: IdOrang; penuh: boolean; saatTambah: (kunci: KunciAhliWaris, idInduk?: IdOrang) => void;
}) {
  const kunciInduk = jenisDari(kunci)?.kunciInduk;
  const calonInduk = kunciInduk ? daftarInduk(graf, idMayit, kunciInduk) : [];
  const [idInduk, setIdInduk] = useState<IdOrang | undefined>(undefined);
  const indukTerpilih = idInduk && calonInduk.includes(idInduk) ? idInduk : undefined;
  return (
    <div className="tambah-berinduk">
      <button type="button" className="tombol-tambah" aria-label={`Tambah ${LABEL_SEHARI[kunci]}`} disabled={penuh}
        onClick={() => saatTambah(kunci, indukTerpilih)}>
        <span aria-hidden="true">+</span>{LABEL_SEHARI[kunci]}
      </button>
      {calonInduk.length > 1 && (
        <div className="tahap-pilih" role="radiogroup" aria-label={`${LABEL_SEHARI[kunci]} dari siapa?`}>
          <span className="caption-isian">dari:</span>
          {calonInduk.map(id => (
            <button key={id} type="button" role="radio" aria-checked={indukTerpilih === id} className="chip-pilih" onClick={() => setIdInduk(id)}>
              {labelOrangChecklist(graf, idMayit, id, kunciInduk!)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** "Anak laki-laki 2" atau "Anak laki-laki (sudah wafat)" untuk penghubung. Dipakai juga di langkah 5. */
export function labelOrangChecklist(graf: GrafKeluarga, idMayit: IdOrang, idOrang: IdOrang, kunci?: KunciAhliWaris): string {
  const orang = graf.orang[idOrang]!;
  if (orang.nama) return orang.nama;
  const isian = hitungIsian(graf, idMayit);
  const kunciOrang = kunci ?? (Object.entries(isian).find(([, ids]) => ids!.includes(idOrang))?.[0] as KunciAhliWaris | undefined);
  const label = kunciOrang ? LABEL_SEHARI[kunciOrang] ?? jenisDari(kunciOrang)?.label ?? 'Kerabat' : 'Kerabat';
  if (orang.penghubung) return `${label} (sudah wafat)`;
  const sePeran = kunciOrang ? isian[kunciOrang] ?? [] : [];
  return sePeran.length > 1 ? `${label} ${sePeran.indexOf(idOrang) + 1}` : label;
}
