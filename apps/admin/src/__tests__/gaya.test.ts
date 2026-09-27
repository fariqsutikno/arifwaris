// Tailwind preflight me-reset elemen polos; layar lama (editor, diksi, review, peran) memakai input/textarea/select/
// table/h2/h3 tanpa kelas, jadi admin.css wajib memberi gaya dasar untuk elemen itu (jsdom tidak menerapkan CSS).
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../admin.css'), 'utf8');

const lapisDasarLayarLama = css.slice(css.indexOf('/* layar lama'));

test.each(['input', 'textarea', 'select', 'h2', 'h3', 'th', 'td'])('gaya dasar layar lama untuk %s', elemen => {
  expect(lapisDasarLayarLama).toMatch(new RegExp(`\\b${elemen}\\b`));
});
