// Semua kasus uji (bab 16, overlay madzhab per ruleset, munasakhat) × semua mode → penjelasannya; dipakai tes emas & cakupan.
import { hitung, hitungDzawilArham, hitungMunasakhat, type InputEngine, type Ruleset } from '@waris/engine';
import * as bab16 from '../../../engine/src/__tests__/fixtures/bab16.js';
import { DZAWIL_ARHAM_FIXTURES, KASUS_DZAWIL_ARHAM_MADZHAB, dengan } from '../../../engine/src/__tests__/fixtures/dzawilArham.js';
import { KASUS_MADZHAB } from '../../../engine/src/__tests__/fixtures/madzhab.js';
import { MUNASAKHAT_FIXTURES } from '../../../engine/src/__tests__/fixtures/munasakhat.js';
import { jelaskan, jelaskanMunasakhat } from '../index.js';
import { kamusSnapshot } from './kamus.js';

const MODE = ['cerita', 'ringkas', 'arab'] as const;

export function semuaPenjelasan(): Record<string, unknown> {
  const hasil: Record<string, unknown> = {};
  const daftarKasus: Array<readonly [string, InputEngine]> = [
    ...Object.entries(bab16).filter(([, kasus]) => typeof kasus === 'object' && kasus && 'input' in kasus)
      .map(([nama, kasus]) => [nama, (kasus as { input: InputEngine }).input] as const),
    ...KASUS_MADZHAB.flatMap(kasus => (Object.keys(kasus.harapan) as Ruleset[])
      .map(ruleset => [`madzhab:${kasus.id}:${ruleset}`, { ...bab16.input(kasus.graf), ruleset }] as const)),
  ];
  for (const [nama, input] of daftarKasus) {
    const hasilHitung = hitung(input);
    if (hasilHitung.status !== 'OK') continue;
    for (const mode of MODE) {
      hasil[`${nama}/${mode}`] = jelaskan(hasilHitung, input.graf,
        mode === 'arab' ? { bahasa: 'ar', kamus: kamusSnapshot } : { gaya: mode, kamus: kamusSnapshot });
    }
  }
  const kasusDzawilArham: Array<readonly [string, InputEngine]> = [
    ...DZAWIL_ARHAM_FIXTURES.map(fixture => [fixture.id, fixture.input] as const),
    ...KASUS_DZAWIL_ARHAM_MADZHAB.flatMap(kasus => (Object.entries(kasus.harapan) as Array<[Ruleset, { status: string }]>)
      .filter(([, harapan]) => harapan.status === 'OK')
      .map(([ruleset]) => [`${kasus.id}:${ruleset}`, dengan(kasus.graf, ruleset, kasus.konfigurasi)] as const)),
  ];
  for (const [nama, input] of kasusDzawilArham) {
    const hasilHitung = hitungDzawilArham(input);
    if (hasilHitung.status !== 'OK') continue;
    for (const mode of MODE) {
      hasil[`dzawilArham:${nama}/${mode}`] = jelaskan(hasilHitung, input.graf,
        mode === 'arab' ? { bahasa: 'ar', kamus: kamusSnapshot } : { gaya: mode, kamus: kamusSnapshot });
    }
  }
  for (const fixture of MUNASAKHAT_FIXTURES) {
    const hasilHitung = hitungMunasakhat(fixture.input);
    if (hasilHitung.status !== 'OK') continue;
    for (const mode of ['cerita', 'ringkas'] as const) {
      hasil[`munasakhat:${fixture.id}/${mode}`] = jelaskanMunasakhat(hasilHitung, fixture.input.dasar.graf, { gaya: mode, kamus: kamusSnapshot });
    }
  }
  return hasil;
}
