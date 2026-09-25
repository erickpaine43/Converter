import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// En el build cada ruta llega pre-renderizada (scripts/prerender.mjs): se hidrata
// ese HTML en vez de descartarlo y volver a pintarlo. Con `vite dev` el #root
// llega vacío, así que ahí se renderiza desde cero.
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
