// Simpan kasus sebagai file JSON di perangkat pengguna.

import { keJson, type Kasus } from './kasus';

export function unduhKasus(kasus: Kasus): void {
  const tautan = document.createElement('a');
  tautan.href = URL.createObjectURL(new Blob([keJson(kasus)], { type: 'application/json' }));
  tautan.download = 'kasus-waris.json';
  tautan.click();
  URL.revokeObjectURL(tautan.href);
}
