// Tampilan perbandingan dua versi isi per bidang (hasil daftarPerubahan): label bidang, lalu teksnya dengan kata yang
// dihapus dicoret merah dan yang ditambah disorot hijau. Bagian panjang yang tidak berubah diringkas jadi "…" supaya
// perubahan kecil di materi panjang tetap mudah ditemukan. Dipakai riwayat entri & antrean review.
import type { BarisDiff } from '../editor/diff';
import type { PerubahanBidang } from '../editor/banding';

const KATA_KONTEKS = 12;

export function Perbandingan({ perubahan, keterangan }: { perubahan: PerubahanBidang[]; keterangan?: string }) {
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        {keterangan ? `${keterangan} ` : ''}<del className="bg-destructive/15 text-destructive">Dicoret</del> = dihapus,{' '}
        <ins className="bg-emerald-500/20 text-emerald-800 no-underline dark:text-emerald-300">disorot</ins> = ditambahkan.
      </p>
      {perubahan.length === 0 ? <p className="text-sm text-muted-foreground">Tidak ada perubahan isi.</p> : (
        <dl className="grid gap-3">
          {perubahan.map(({ label, arab, potongan }) => (
            <div key={label} className="grid gap-1">
              <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
              <dd className="text-sm whitespace-pre-wrap" {...(arab ? { dir: 'rtl', lang: 'ar' } : {})}>
                {ringkasSama(potongan).map((bagian, i, semua) => <Potongan key={i} bagian={bagian} sesudahHapus={semua[i - 1]?.jenis === 'hapus'} />)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function Potongan({ bagian, sesudahHapus }: { bagian: BarisDiff; sesudahHapus: boolean }) {
  if (bagian.jenis === 'hapus') return <del className="bg-destructive/15 text-destructive">{bagian.teks}</del>;
  if (bagian.jenis === 'tambah') return <ins className={`${sesudahHapus ? 'ml-1 ' : ''}bg-emerald-500/20 text-emerald-800 no-underline dark:text-emerald-300`}>{bagian.teks}</ins>;
  return <span>{bagian.teks}</span>;
}

/** Potongan "sama" yang panjang dipotong di tengah, menyisakan beberapa kata di tiap sisi perubahan. */
export function ringkasSama(potongan: BarisDiff[]): BarisDiff[] {
  return potongan.map((bagian, i) => {
    if (bagian.jenis !== 'sama') return bagian;
    const kata = bagian.teks.split(/(\s+)/);
    const batas = KATA_KONTEKS * 2;
    if (kata.length <= batas * 2) return bagian;
    const awal = i === 0 ? [] : kata.slice(0, batas);
    const akhir = i === potongan.length - 1 ? [] : kata.slice(-batas);
    return { jenis: 'sama', teks: `${awal.join('')} … ${akhir.join('')}` };
  });
}
