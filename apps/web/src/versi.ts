// Versi engine yang dipakai build ini (disuntik vite.config.ts). Admin mengimpor layar web tanpa suntikan itu,
// jadi nilainya jatuh ke 'tak-diketahui' di sana.

declare const __VERSI_ENGINE__: string | undefined;

export const VERSI_ENGINE: string = typeof __VERSI_ENGINE__ === 'string' ? __VERSI_ENGINE__ : 'tak-diketahui';
