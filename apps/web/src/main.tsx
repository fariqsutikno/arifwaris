// Titik masuk: pasang <Aplikasi/> ke #akar.
import './gaya/token.css';
import './gaya/komponen.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Aplikasi } from './Aplikasi';

createRoot(document.getElementById('akar')!).render(<StrictMode><Aplikasi /></StrictMode>);
