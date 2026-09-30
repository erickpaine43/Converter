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

// In the build every route comes pre-rendered (scripts/prerender.mjs), so that
// HTML is hydrated instead of thrown away and repainted. With `vite dev` #root
// is empty, so it renders from scratch there.
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
