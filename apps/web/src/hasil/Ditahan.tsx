// Bagian layar Hasil untuk kasus yang sebagian/seluruhnya ditahan (acuan-hasil-final.html: Hamil + hilang, Menunggu lahir,
// Meninggal bersamaan): kelompok Ditahan di daftar, ubin Uang ditahan, daftar menunggu kelahiran, tabel kemungkinan per sumber,
// tabel per harta (gharqa), dan tabel kemungkinan urutan (gharqa keadaan 3). Semua angka dari ringkasan (engine).

import type { GrafKeluarga, IdOrang, NilaiTaqdir } from '@waris/engine';
import { formatRupiah, namaOrang } from '../format';
import { Istilah } from '../ui/Tooltip';
import { angka, t } from '../terjemah';
import { BarisOrang, JudulKelompok } from './KartuPembagian';
import { pecahanTeks, persenTeks, type HartaRingkas, type RingkasanHasil, type SebabDitahan } from './ringkasan';
import { useAtributOrang } from './sorot';

interface Umum { graf: GrafKeluarga; ringkasan: RingkasanHasil; sembunyiNominal: boolean; saatPilih: (id: IdOrang) => void }

const uangAtau = (nilai: bigint, sembunyi: boolean) => (sembunyi ? t('hitung.rp') : formatRupiah(nilai));
const bisaDipilih = (id: IdOrang, saatPilih: (id: IdOrang) => void) => ({
  tabIndex: 0, onClick: () => saatPilih(id), onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter') saatPilih(id); },
});

const TEKS_SEBAB: Record<SebabDitahan, () => string> = {
  bayi: () => t('hasil.titipan.menunggu_bayi'),
  kabar: () => t('hasil.titipan.menunggu_kabar'),
  bersamaBayi: () => t('hasil.ditahan.berbagi_dengan_bayi'),
  kepastian: () => t('hasil.titipan.menunggu_kepastian'),
  urutan: () => t('hasil.ditahan.menunggu_urutan'),
};
const DIBUKA_SETELAH: Record<SebabDitahan, () => string> = {
  bayi: () => t('hasil.ditahan.dibuka_bayi'),
  kabar: () => t('hasil.ditahan.dibuka_kabar'),
  bersamaBayi: () => t('hasil.ditahan.dibuka_bersama_bayi'),
  kepastian: () => t('hasil.ditahan.dibuka_kepastian'),
  urutan: () => t('hasil.ditahan.dibuka_urutan'),
};

/** Kelompok di daftar pembagian: orang yang bagiannya ditahan atau menunggu. */
export function KelompokDitahan({ ringkasan, judul, label = t('hasil.ditahan.ditahan'), saatPilih }: Pick<Umum, 'ringkasan' | 'saatPilih'> & { judul: string; label?: string }) {
  const daftar = ringkasan.ditahan?.orang ?? [];
  if (!daftar.length) return null;
  return (
    <section aria-labelledby="judul-ditahan">
      <JudulKelompok id="judul-ditahan" judul={judul} jumlah={daftar.length} />
      <ul className="daftar-bagian kelompok-ditahan">
        {daftar.map(orang => <BarisOrang key={orang.id} orang={orang} redup saatPilih={saatPilih} uang={label} pecahan={TEKS_SEBAB[orang.sebab]()} />)}
      </ul>
    </section>
  );
}

export function UbinDitahan({ ringkasan, sembunyiNominal }: Pick<Umum, 'ringkasan' | 'sembunyiNominal'>) {
  const ditahan = ringkasan.ditahan;
  if (!ditahan || ditahan.nominal === 0n) return null;
  return (
    <section className="ubin-h ubin-ditahan" aria-labelledby="judul-uang-ditahan">
      <h2 id="judul-uang-ditahan">{t('hasil.ditahan.uang_ditahan')} <small><Istilah id="mauquf">{t('hasil.titipan.istilah')}</Istilah></small></h2>
      <p className="sub-kartu">{uangAtau(ditahan.nominal, sembunyiNominal)} · {t('hasil.ditahan.jangan_dipakai')}</p>
      <ul className="baris-ditahan">
        {ditahan.orang.map(orang => <li key={orang.id}><b>{orang.nama}</b><span>{DIBUKA_SETELAH[orang.sebab]()}</span></li>)}
      </ul>
    </section>
  );
}

/** Menunggu kelahiran [R13-17]: harta belum dibagi; yang sudah pasti ditampilkan sebagai bagian paling sedikit. */
export function UbinMenunggu({ ringkasan, saatPilih, saatBagiSekarang }: Pick<Umum, 'ringkasan' | 'saatPilih'> & { saatBagiSekarang?: (() => void) | undefined }) {
  const daftarDunia = ringkasan.taqdir?.daftarDunia ?? [];
  const tetap = (id: IdOrang) => daftarDunia.every(dunia => dunia.saham[id] === ringkasan.taqdir?.diberikan[id]);
  return (
    <section className="ubin-h kartu-utama" aria-labelledby="judul-menunggu">
      <h2 id="judul-menunggu">{t('hasil.ditahan.yang_sudah_pasti')}</h2>
      <p className="sub-kartu">{t('hasil.ditahan.menunggu_sub')}</p>
      {ringkasan.penerima.length > 0 && (
        <>
          <JudulKelompok judul={t('hasil.ditahan.sudah_pasti')} jumlah={ringkasan.penerima.length} />
          <ul className="daftar-bagian">
            {ringkasan.penerima.map(orang => (
              <BarisOrang key={orang.id} orang={orang} saatPilih={saatPilih} uang={pecahanTeks(orang.saham, ringkasan.penyebut, 'sederhana')}
                pecahan={tetap(orang.id) ? persenTeks(orang.saham, ringkasan.penyebut) : t('hasil.ditahan.paling_sedikit')} />
            ))}
          </ul>
        </>
      )}
      <KelompokDitahan ringkasan={ringkasan} judul={t('hasil.ditahan.menunggu_bayi_lahir')} label={t('hasil.ditahan.belum_dibagi_kecil')} saatPilih={saatPilih} />
      {saatBagiSekarang && (
        <div className="catatan-menunggu">
          <b>{t('hasil.ditahan.perlu_dibagi_sekarang')}</b>
          <p>{t('hasil.ditahan.perlu_dibagi_sekarang_isi')}</p>
          <button type="button" className="tautan-aksi" onClick={saatBagiSekarang}>{t('hasil.ditahan.bagi_sekarang')}</button>
        </div>
      )}
    </section>
  );
}

function teksTaqdir(nilai: NilaiTaqdir, khuntsa: boolean): string {
  switch (nilai) {
    case 'mati': return t('hasil.titipan.taqdir_mati');
    case 'hidup': return t('hasil.titipan.taqdir_hidup');
    case 'lk': return khuntsa ? t('hasil.titipan.taqdir_khuntsa_lk') : t('hasil.titipan.taqdir_lk');
    case 'pr': return khuntsa ? t('hasil.titipan.taqdir_khuntsa_pr') : t('hasil.titipan.taqdir_pr');
    case 'duaLk': return t('hasil.titipan.taqdir_dua_lk');
    case 'duaPr': return t('hasil.titipan.taqdir_dua_pr');
    case 'lkPr': return t('hasil.titipan.taqdir_lk_pr');
  }
}

/** Tabel kemungkinan: satu kolom per kemungkinan (keadaan tiap sumber), lalu kolom yang diberikan sekarang di jami'ah. */
export function TabelKemungkinan({ graf, ringkasan, sembunyiNominal, saatPilih }: Umum) {
  const atribut = useAtributOrang();
  const taqdir = ringkasan.taqdir;
  if (!taqdir) return null;
  const jamiah = ringkasan.penyebut;
  const daftarId = [...ringkasan.penerima.map(o => o.id), ...(ringkasan.ditahan?.orang ?? []).map(o => o.id)];
  return (
    <table className="faraidh tabel-kemungkinan">
      <thead>
        <tr>
          <th rowSpan={2} className="kiri">{t('hitung.ahli_waris')}</th>
          {taqdir.daftarDunia.map((dunia, indeks) => (
            <th key={indeks}>{Object.entries(dunia.taqdir).map(([id, nilai]) => (
              <span key={id} className="ket">{graf.orang[id]?.nama?.trim() || namaOrang(graf, ringkasan.statusOrang, id)}: {teksTaqdir(nilai, !!graf.orang[id]?.khuntsa)}</span>
            ))}<span className="pengali">× {angka(String(jamiah / dunia.masalah))}</span></th>
          ))}
          <th className="jami">{t('hasil.ditahan.diberi_sekarang')}</th>
          <th rowSpan={2}>{t('hitung.nominal')}</th>
        </tr>
        <tr>
          {taqdir.daftarDunia.map((dunia, indeks) => <th key={indeks}><small>{angka(String(dunia.masalah))}</small></th>)}
          <th className="jami"><small>{angka(String(jamiah))}</small></th>
        </tr>
      </thead>
      <tbody>
        {daftarId.map(id => {
          const { className, ...pemicu } = atribut(id);
          return (
            <tr key={id} {...pemicu} className={className || undefined} {...bisaDipilih(id, saatPilih)}>
              <td className="kiri">{namaOrang(graf, ringkasan.statusOrang, id)}</td>
              {taqdir.daftarDunia.map((dunia, indeks) => {
                const saham = dunia.saham[id];
                return <td key={indeks} className="angka">{saham ? angka(String(saham / (jamiah / dunia.masalah))) : '—'}</td>;
              })}
              <td className="angka jami">{angka(String(taqdir.diberikan[id] ?? 0n))}</td>
              <td className="uang">{(taqdir.diberikan[id] ?? 0n) > 0n ? uangAtau(ringkasan.penerima.find(o => o.id === id)?.nominal ?? 0n, sembunyiNominal) : t('hasil.ditahan.ditahan')}</td>
            </tr>
          );
        })}
        <tr className="baris-ditahan-tabel">
          <td className="kiri">{t('hasil.ditahan.ditahan')}</td>
          {taqdir.daftarDunia.map((_, indeks) => <td key={indeks} />)}
          <td className="angka jami">{angka(String(taqdir.mauquf))}</td>
          <td className="uang">{uangAtau(ringkasan.ditahan?.nominal ?? 0n, sembunyiNominal)}</td>
        </tr>
      </tbody>
    </table>
  );
}

/** Gharqa: satu tabel per harta (tiap anggota dibagi sendiri). */
export function TabelPerHarta({ graf, ringkasan, daftarHarta, sembunyiNominal, saatPilih }: Umum & { daftarHarta: HartaRingkas[] }) {
  const atribut = useAtributOrang();
  return (
    <div className="tumpuk-tabel">
      {daftarHarta.map(harta => (
        <table key={harta.mayit} className="faraidh">
          <thead><tr>
            <th className="kiri">{t('hasil.titipan.harta_nama', { nama: harta.nama })}</th>
            <th>{t('hasil.saham')}<small>{angka(String(harta.jamiah))}</small></th>
            <th>{t('hitung.nominal')}<small>{uangAtau(harta.bersih, sembunyiNominal)}</small></th>
          </tr></thead>
          <tbody>
            {Object.entries(harta.saham).filter(([id, saham]) => saham > 0n && graf.orang[id]).map(([id, saham]) => {
              const { className, ...pemicu } = atribut(id);
              return (
                <tr key={id} {...pemicu} className={className || undefined} {...bisaDipilih(id, saatPilih)}>
                  <td className="kiri">{namaOrang(graf, ringkasan.statusOrang, id)}</td>
                  <td className="angka">{angka(String(saham))}</td>
                  <td className="uang">{uangAtau(harta.nominal[id] ?? 0n, sembunyiNominal)}</td>
                </tr>
              );
            })}
            {harta.nominalMauquf > 0n && <tr className="baris-ditahan-tabel"><td className="kiri">{t('hasil.ditahan.ditahan')}</td><td /><td className="uang">{uangAtau(harta.nominalMauquf, sembunyiNominal)}</td></tr>}
          </tbody>
        </table>
      ))}
    </div>
  );
}

/** Gharqa keadaan 3 [R13-10] [SYF]: semua ditahan; total tiap orang per kemungkinan urutan, sebagai bahan musyawarah. */
export function UbinKemungkinanUrutan({ graf, ringkasan, sembunyiNominal, saatPilih }: Umum) {
  const skenario = ringkasan.gharqa?.skenario ?? [];
  const atribut = useAtributOrang();
  const namaMayit = (id: IdOrang) => skenario.flatMap(sk => sk.harta).find(h => h.mayit === id)?.nama ?? namaOrang(graf, ringkasan.statusOrang, id);
  const total = (harta: HartaRingkas[], id: IdOrang) => harta.reduce((jumlah, h) => jumlah + (h.nominal[id] ?? 0n), 0n);
  return (
    <section className="ubin-h kartu-utama" aria-labelledby="judul-kemungkinan-urutan">
      <h2 id="judul-kemungkinan-urutan">{t('hasil.gharqa.kemungkinan_urutan', { jumlah: angka(String(skenario.length)) })}</h2>
      <p className="sub-kartu">{t('hasil.gharqa.kemungkinan_urutan_sub')}</p>
      <div className="wadah-tabel">
        <table className="faraidh ringkas">
          <thead><tr><th className="kiri">{t('hitung.ahli_waris')}</th>
            {skenario.map((sk, indeks) => <th key={indeks}>{t('hasil.titipan.kalau_duluan', { nama: namaMayit(sk.urutan[0]!) })}</th>)}</tr></thead>
          <tbody>
            {(ringkasan.ditahan?.orang ?? []).map(orang => {
              const { className, ...pemicu } = atribut(orang.id);
              return (
                <tr key={orang.id} {...pemicu} className={className || undefined} {...bisaDipilih(orang.id, saatPilih)}>
                  <td className="kiri">{orang.nama}</td>
                  {skenario.map((sk, indeks) => <td key={indeks} className="uang">{uangAtau(total(sk.harta, orang.id), sembunyiNominal)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Tabel gharqa keadaan 3: per kemungkinan urutan, tiap harta dalam tabelnya sendiri. */
export function TabelSkenarioGharqa(props: Umum) {
  const namaMayit = (id: IdOrang) => props.ringkasan.gharqa?.skenario?.flatMap(sk => sk.harta).find(h => h.mayit === id)?.nama ?? id;
  return (
    <div className="tumpuk-tabel">
      {(props.ringkasan.gharqa?.skenario ?? []).map((sk, indeks) => (
        <section key={indeks}>
          <h4 className="judul-skenario">{t('hasil.titipan.kalau_duluan', { nama: namaMayit(sk.urutan[0]!) })}</h4>
          <TabelPerHarta {...props} daftarHarta={sk.harta} />
        </section>
      ))}
    </div>
  );
}
