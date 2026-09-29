// Keluaran narasi dibekukan sebelum migrasi ke templat diksi: semua kasus × semua mode harus identik setelah tiap task.
import { hitung, hitungMunasakhat, type InputEngine, type Ruleset } from '@waris/engine';
import { expect, test } from 'vitest';
import * as bab16 from '../../../engine/src/__tests__/fixtures/bab16.js';
import { KASUS_MADZHAB } from '../../../engine/src/__tests__/fixtures/madzhab.js';
import { MUNASAKHAT_FIXTURES } from '../../../engine/src/__tests__/fixtures/munasakhat.js';
import { jelaskan, jelaskanMunasakhat } from '../index.js';

const MODE = ['cerita', 'ringkas', 'arab'] as const;

test('keluaran narasi identik dengan emas', async () => {
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
    for (const mode of MODE) hasil[`${nama}/${mode}`] = jelaskan(hasilHitung, input.graf, { mode });
  }
  for (const fixture of MUNASAKHAT_FIXTURES) {
    const hasilHitung = hitungMunasakhat(fixture.input);
    if (hasilHitung.status !== 'OK') continue;
    for (const mode of ['cerita', 'ringkas'] as const) {
      hasil[`munasakhat:${fixture.id}/${mode}`] = jelaskanMunasakhat(hasilHitung, fixture.input.dasar.graf, { mode });
    }
  }
  expect(Object.keys(hasil).length).toBeGreaterThan(100);
  await expect(JSON.stringify(hasil, null, 1)).toMatchFileSnapshot('./__snapshots__/emas.json');
});
