// Hero mini di kepala halaman utama tiap menu (Hitung, Latihan, Rujukan, FAQ, Glosarium, Tanya jawab): judul dan satu kalimat sebagai satu grup,
// ikon menu di kanan. Gayanya sama dengan hero Pusat belajar.

import { Ikon, type NamaIkon } from './Ikon';

export function HeroMini({ judul, keterangan, ikon }: { judul: string; keterangan: string; ikon: NamaIkon }) {
  return (
    <section className="hero-belajar hero-mini">
      <div className="tumpuk-rapat">
        <h1>{judul}</h1>
        <p className="lead">{keterangan}</p>
      </div>
      <Ikon nama={ikon} ukuran={56} />
    </section>
  );
}
