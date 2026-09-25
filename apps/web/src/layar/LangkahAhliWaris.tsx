// Langkah 4: isian ahli waris relatif ke satu mayit (pewaris, atau mayit munasakhat di langkah 5).
// Mulai kosong: tambah cepat (−/+) untuk kerabat yang paling sering ada, kerabat lain dibuka bila perlu, urut silsilah.
// Yang sudah ditambahkan bisa dilihat sebagai daftar atau pohon; tiap orang bisa dihapus. Menyerahkan graf baru lewat ubahGraf.

import { useState } from 'react';
import { KONFIGURASI_BAWAAN, turunkanPeran, type GrafKeluarga, type IdOrang, type KunciAhliWaris } from '@waris/engine';
import { daftarInduk, hapusAhliWaris, hitungIsian, jenisDari, kurangiAhliWaris, tambahAhliWaris } from '../checklist';
import { HUBUNGAN_PAMAN, HUBUNGAN_SAUDARA, LABEL_SEHARI, TAMBAH_CEPAT, URUTAN_KERABAT_LAIN, type KelompokLain } from '../konten/ahliWaris';
import { PohonDasar } from '../hasil/Pohon';

interface Props { graf: GrafKeluarga; idMayit: IdOrang; ubahGraf: (ubah: (graf: GrafKeluarga) => GrafKeluarga) => void }

export function LangkahAhliWaris({ graf, idMayit, ubahGraf }: Props) {
  const [pesan, setPesan] = useState<string | null>(null);
  const [kerabatLainTerbuka, setKerabatLainTerbuka] = useState(false);
  const [tampilan, setTampilan] = useState<'daftar' | 'pohon'>('daftar');
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
  const hapus = (idOrang: IdOrang) => coba(g => hapusAhliWaris(g, idOrang));
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

      <section className="terisi-ahli-waris" aria-labelledby={`judul-terisi-${idMayit}`}>
        <div className="kepala-grup">
          <h3 id={`judul-terisi-${idMayit}`} className="judul-bagian-kecil">Sudah ditambahkan</h3>
          <div className="tab-kecil" role="tablist" aria-label="Tampilan ahli waris">
            <button type="button" role="tab" aria-selected={tampilan === 'daftar'} onClick={() => setTampilan('daftar')}>Daftar</button>
            <button type="button" role="tab" aria-selected={tampilan === 'pohon'} onClick={() => setTampilan('pohon')}>Pohon keluarga</button>
          </div>
        </div>
        {tampilan === 'daftar'
          ? <DaftarTerisi graf={graf} idMayit={idMayit} saatHapus={hapus} />
          : <PohonIsian graf={graf} idMayit={idMayit} saatHapus={hapus} />}
      </section>

      <section className="tambah-ahli-waris" aria-labelledby={`judul-cepat-${idMayit}`}>
        <h3 id={`judul-cepat-${idMayit}`} className="judul-bagian-kecil">Tambah cepat</h3>
        <div className="kontrol-jumlah-deret">
          {TAMBAH_CEPAT.filter(tampilUntukMayit).map(kunci => {
            const label = LABEL_SEHARI[kunci]!;
            const jumlah = isian[kunci]?.length ?? 0;
            return (
              <div key={kunci} className={jumlah > 0 ? 'kontrol-jumlah ada' : 'kontrol-jumlah'} role="group" aria-label={label}>
                <span className="nama-kontrol">{label}</span>
                <button type="button" aria-label={`Kurangi ${label}`} disabled={jumlah === 0} onClick={() => coba(g => kurangiAhliWaris(g, idMayit, kunci))}>−</button>
                <span className="angka-kontrol" aria-live="polite">{jumlah}</span>
                <button type="button" aria-label={`Tambah ${label}`} disabled={sudahPenuh(kunci)} onClick={() => tambah(kunci)}>+</button>
              </div>
            );
          })}
        </div>
      </section>

      <button type="button" className="buka-kerabat" aria-expanded={kerabatLainTerbuka} onClick={() => setKerabatLainTerbuka(!kerabatLainTerbuka)}>
        {kerabatLainTerbuka ? 'Tutup kerabat lain' : 'Tambah kerabat lain'}
        <small>kakek-nenek, cucu, kakak/adik, paman, keponakan</small>
      </button>

      {kerabatLainTerbuka && (
        <div className="kerabat-lain">
          {URUTAN_KERABAT_LAIN.map((bagian, indeks) => {
            if (bagian.jenis === 'saudara') return <PilihSaudara key={indeks} saatTambah={tambah} />;
            if (bagian.jenis === 'paman') return <PilihPamanSepupu key={indeks} graf={graf} idMayit={idMayit} saatTambah={tambah} />;
            return <KelompokKerabat key={indeks} kelompok={bagian.kelompok} graf={graf} idMayit={idMayit} sudahPenuh={sudahPenuh} saatTambah={tambah} />;
          })}
        </div>
      )}
    </div>
  );
}

function KelompokKerabat({ kelompok, graf, idMayit, sudahPenuh, saatTambah }: {
  kelompok: KelompokLain; graf: GrafKeluarga; idMayit: IdOrang; sudahPenuh: (kunci: KunciAhliWaris) => boolean;
  saatTambah: (kunci: KunciAhliWaris, idInduk?: IdOrang) => void;
}) {
  return (
    <fieldset className="kelompok-kerabat">
      <legend>{kelompok.judul}</legend>
      {kelompok.catatan && <p className="caption-isian">{kelompok.catatan}</p>}
      <div className="tombol-cepat">
        {kelompok.pilihan.map(kunci => (
          <TombolDenganInduk key={kunci} kunci={kunci} graf={graf} idMayit={idMayit} penuh={sudahPenuh(kunci)} saatTambah={saatTambah} />
        ))}
      </div>
    </fieldset>
  );
}

/** Orang yang sudah ditambahkan, masing-masing bisa dihapus. */
function DaftarTerisi({ graf, idMayit, saatHapus }: { graf: GrafKeluarga; idMayit: IdOrang; saatHapus: (idOrang: IdOrang) => void }) {
  const isian = Object.entries(hitungIsian(graf, idMayit)) as Array<[KunciAhliWaris, IdOrang[]]>;
  const orang = isian.flatMap(([kunci, daftar]) => daftar.map(idOrang => ({ idOrang, kunci, label: labelOrangChecklist(graf, idMayit, idOrang, kunci) })));
  if (orang.length === 0) return <p className="kosong-ahli-waris">Belum ada yang ditambahkan. Mulai dari tombol di bawah.</p>;
  return (
    <ul className="daftar-terisi" aria-label="Ahli waris yang sudah ditambahkan">
      {orang.map(({ idOrang, kunci, label }) => (
        <li key={idOrang} className={`orang-terisi g-${jenisDari(kunci)?.kelompok ?? 'saudara'}`}>
          <span className="orang-terisi-teks"><b>{label}</b>
            {jenisDari(kunci)?.label !== LABEL_SEHARI[kunci] && <small>{jenisDari(kunci)?.label}</small>}</span>
          <button type="button" aria-label={`Hapus ${label}`} onClick={() => saatHapus(idOrang)}>×</button>
        </li>
      ))}
    </ul>
  );
}

/** Pohon dari orang yang sudah ditambahkan (tanpa angka): hubungan antarorang terlihat, tiap orang bisa dihapus (×).
 * Orang tua yang dibuat otomatis supaya garis tersambung (penghubung) ditandai "tidak diisi", bukan "sudah wafat". */
function PohonIsian({ graf, idMayit, saatHapus }: { graf: GrafKeluarga; idMayit: IdOrang; saatHapus: (idOrang: IdOrang) => void }) {
  const isian = hitungIsian(graf, idMayit);
  const kunciDari = (id: IdOrang) => (Object.entries(isian) as Array<[KunciAhliWaris, IdOrang[]]>).find(([, ids]) => ids.includes(id))?.[0];
  // Orang penghubung dinamai menurut perannya terhadap pewaris, misalnya "Ayah (tidak diisi)".
  const { daftarPeran: peran } = turunkanPeran({ ...graf, idPewaris: idMayit }, KONFIGURASI_BAWAAN);
  const tombolHapus = (id: IdOrang, label: string) =>
    <button type="button" className="hapus-node" aria-label={`Hapus ${label}`} onClick={() => saatHapus(id)}>×</button>;
  return (
    <section className="pohon-isian" aria-label="Pohon keluarga">
      <PohonDasar graf={{ ...graf, idPewaris: idMayit }} isiNode={id => {
        const orang = graf.orang[id]!;
        if (id === idMayit) return { kelas: 'almarhum', peran: 'Pewaris', nama: orang.nama ?? 'Almarhum' };
        if (orang.penghubung || orang.statusHidup === 'wafat') {
          const kunciPeran = peran[id]?.kunci as KunciAhliWaris | undefined;
          return { kelas: 'penghubung', peran: '', nama: `${(kunciPeran && LABEL_SEHARI[kunciPeran]) || 'Kerabat'} (tidak diisi)` };
        }
        const kunci = kunciDari(id);
        const nama = kunci ? labelOrangChecklist(graf, idMayit, id, kunci) : orang.nama ?? 'Kerabat';
        return kunci
          ? { kelas: `g-${jenisDari(kunci)?.kelompok ?? 'saudara'}`, peran: '', nama, aksi: tombolHapus(id, nama) }
          : { kelas: 'putus', peran: '', nama, aksi: tombolHapus(id, nama) };
      }} />
    </section>
  );
}

/** Paman & sepupu (pihak ayah): paman atau sepupu dulu, lalu hubungan paman dengan ayah pewaris. */
function PilihPamanSepupu({ graf, idMayit, saatTambah }: {
  graf: GrafKeluarga; idMayit: IdOrang; saatTambah: (kunci: KunciAhliWaris, idInduk?: IdOrang) => void;
}) {
  const [siapa, setSiapa] = useState<'PAMAN' | 'SEPUPU' | null>(null);
  const [hubungan, setHubungan] = useState<typeof HUBUNGAN_PAMAN[number] | null>(null);
  return (
    <fieldset className="kelompok-kerabat" aria-label="Paman & sepupu dari pihak ayah">
      <legend>Paman & sepupu dari pihak ayah</legend>
      <div className="tahap-pilih" role="radiogroup" aria-label="Siapa">
        {([['PAMAN', 'Paman'], ['SEPUPU', 'Sepupu laki-laki']] as const).map(([nilai, label]) => (
          <button key={nilai} type="button" role="radio" aria-checked={siapa === nilai} className="chip-pilih" onClick={() => setSiapa(nilai)}>{label}</button>
        ))}
      </div>
      {siapa && (
        <div className="tahap-pilih" role="radiogroup" aria-label="Hubungan paman dengan ayah pewaris">
          {HUBUNGAN_PAMAN.map(pilihan => (
            <button key={pilihan.nilai} type="button" role="radio" aria-checked={hubungan?.nilai === pilihan.nilai} className="chip-pilih" onClick={() => setHubungan(pilihan)}>
              {pilihan.label}
            </button>
          ))}
        </div>
      )}
      {siapa && hubungan && (
        <TombolDenganInduk kunci={hubungan[siapa]} graf={graf} idMayit={idMayit} penuh={false} saatTambah={saatTambah}
          label={`Tambah ${siapa === 'PAMAN' ? 'paman' : 'sepupu laki-laki'} (${hubungan.ringkas})`} />
      )}
    </fieldset>
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
function TombolDenganInduk({ kunci, graf, idMayit, penuh, saatTambah, label }: {
  kunci: KunciAhliWaris; graf: GrafKeluarga; idMayit: IdOrang; penuh: boolean; saatTambah: (kunci: KunciAhliWaris, idInduk?: IdOrang) => void; label?: string;
}) {
  const kunciInduk = jenisDari(kunci)?.kunciInduk;
  const calonInduk = kunciInduk ? daftarInduk(graf, idMayit, kunciInduk) : [];
  const [idInduk, setIdInduk] = useState<IdOrang | undefined>(undefined);
  const indukTerpilih = idInduk && calonInduk.includes(idInduk) ? idInduk : undefined;
  return (
    <div className="tambah-berinduk">
      <button type="button" className="tombol-tambah" aria-label={label ?? `Tambah ${LABEL_SEHARI[kunci]}`} disabled={penuh}
        onClick={() => saatTambah(kunci, indukTerpilih)}>
        <span aria-hidden="true">+</span>{label ?? LABEL_SEHARI[kunci]}
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
