// Penanda orang di daftar hasil dan di kotak pohon: lingkaran berwarna dengan huruf awal nama.
// Warnanya tetap untuk nama yang sama, supaya orang yang sama dikenali di pohon dan di daftar.
// Satu tempat untuk nanti diganti foto lokal; saat ini selalu inisial.

const WARNA_AVATAR = ['#b8501a', '#2a7461', '#3a58b8', '#7d42a8', '#b8355a', '#5a6826', '#9c5219', '#226a88'] as const;

/** FNV-1a 32-bit: nama yang mirip ("Ayah", "Anak") tetap jatuh ke warna berbeda sejauh mungkin. */
const acak = (teks: string) => [...teks].reduce((nilai, huruf) => Math.imul(nilai ^ huruf.codePointAt(0)!, 16777619) >>> 0, 2166136261);

/** Warna tetap per nama; dipakai juga oleh ruas pita bagian supaya orang yang sama berwarna sama. */
export const warnaAvatar = (nama: string): string => WARNA_AVATAR[(acak(nama.trim()) >>> 13) % WARNA_AVATAR.length]!;

export function AvatarOrang({ nama, ukuran = 40 }: { nama: string; ukuran?: number }) {
  const bersih = nama.trim();
  return (
    <span className="avatar-orang" aria-hidden="true" style={{ width: ukuran, height: ukuran, fontSize: Math.round(ukuran * 0.42), background: warnaAvatar(bersih) }}>
      {[...bersih][0]?.toUpperCase() ?? '?'}
    </span>
  );
}
