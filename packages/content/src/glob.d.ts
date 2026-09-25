// `import.meta.glob` Vite, hanya untuk typecheck paket ini sendiri (apps/web sudah memakai tipe vite/client).
interface ImportMeta {
  glob(pola: string, opsi: { query: '?raw'; import: 'default'; eager: true }): Record<string, unknown>;
}
