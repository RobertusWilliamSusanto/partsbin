import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { reloadOnceForChunkError } from './utils/chunkReload'

// Tangkap preload error Vite secara global dan pulihkan dengan satu kali reload
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadOnceForChunkError();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
