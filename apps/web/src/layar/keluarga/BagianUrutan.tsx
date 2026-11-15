// Bagian Urutan wafat (spec kanvas 5.6): satu pertanyaan berpasangan "{A} wafat sebelum atau sesudah {B}?" per kartu.
// Menerima Kasus; menyerahkan Kasus lewat ubah(). Pencarian biner (urutan.ts) bisa lebih dari satu langkah, jadi
// langkah yang sedang berjalan disimpan di sini; Kasus baru berubah saat posisi akhir diketahui, ditunda, atau serentak.

import { useId, useState } from 'react';
import type { IdOrang } from '@waris/engine';
import { pertanyaanUrutanBerikut, selesaikanUrutan, tundaUrutan } from '../../antreanUrutan';
import type { Kasus } from '../../kasus';
import { namaSingkat } from '../../keadaanOrang';
import type { Bagian } from '../../kelompok';
import { t } from '../../terjemah';
import { jawabSisip, pembanding, type Sisipan } from '../../urutan';
import { Ikon } from '../../ui/Ikon';
import { DialogKeadaan } from '../keadaan/DialogKeadaan';

interface Props { kasus: Kasus; bagian: Bagian; ubah: (f: (k: Kasus) => Kasus) => void }

export function BagianUrutan({ kasus, ubah }: Props) {
  const idLabel = useId();
  const [langkah, setLangkah] = useState<{ orang: IdOrang; sisipan: Sisipan } | null>(null);
  const [serentak, setSerentak] = useState(false);
  const berikut = pertanyaanUrutanBerikut(kasus);
  if (!berikut) return null;
  const { orang } = berikut;
  const sisipan = langkah?.orang === orang ? langkah.sisipan : berikut.sisipan;
  const lawan = pembanding(sisipan);
  if (!lawan) return null;
  const nama = namaSingkat(kasus, orang);
  const namaLawan = namaSingkat(kasus, lawan);

  const jawabSebelumSesudah = (orangLebihDulu: boolean) => {
    const sesudahJawab = jawabSisip(sisipan, orangLebihDulu);
    if (pembanding(sesudahJawab)) return setLangkah({ orang, sisipan: sesudahJawab });
    setLangkah(null);
    ubah(k => selesaikanUrutan(k, orang, sesudahJawab));
  };
  const pilihan: Array<[string, string, string | undefined, () => void]> = [
    ['sebelum', t('hitung.kanvas.urutan_sebelum', { nama: namaLawan }), undefined, () => jawabSebelumSesudah(true)],
    ['sesudah', t('hitung.kanvas.urutan_sesudah', { nama: namaLawan }), undefined, () => jawabSebelumSesudah(false)],
    ['serentak', t('hitung.kanvas.urutan_serentak'), undefined, () => setSerentak(true)],
    ['belum', t('hitung.kanvas.urutan_belum_tahu'), t('hitung.kanvas.urutan_belum_tahu_ket'), () => ubah(k => tundaUrutan(k, orang, lawan))],
  ];
  return (
    <>
      <span className="keadaan-label" id={idLabel}>{t('hitung.kanvas.tanya_urutan', { a: nama, b: namaLawan })}</span>
      {/* Belum ada yang terpilih: jawaban langsung mengubah Kasus dan pertanyaan berganti, jadi tak ada keadaan "terpilih". */}
      <div className="pilihan-urutan" role="radiogroup" aria-labelledby={idLabel}>
        {pilihan.map(([kunci, label, keterangan, saatKlik]) => (
          <button key={kunci} type="button" role="radio" aria-checked={false} className="opsi-urutan" onClick={saatKlik}>
            <span>{label}</span>{keterangan && <small>{keterangan}</small>}
          </button>
        ))}
      </div>
      <details className="rinci">
        <summary><Ikon nama="kembali" ukuran={14} />{t('hitung.kanvas.kenapa_urutan_judul')}</summary>
        <div>{t('hitung.kanvas.kenapa_urutan_isi', { pewaris: namaSingkat(kasus, kasus.graf.idPewaris), a: nama, b: namaLawan })}</div>
      </details>
      {serentak && <DialogKeadaan kasus={kasus} idOrang={orang} mulaiDi="serentak" saatBatal={() => setSerentak(false)}
        saatSelesai={baru => { setSerentak(false); ubah(() => baru); }} />}
    </>
  );
}
