// Import teks mentah KB lewat Vite (`?raw`), supaya KB tetap satu-satunya sumber.
declare module '*.md?raw' {
  const content: string;
  export default content;
}
