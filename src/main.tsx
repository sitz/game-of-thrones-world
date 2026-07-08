import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'

// Dev-only: headless/occluded tabs suspend rAF, which stalls MapLibre's render
// loop (and its `load` event). Fall back to timers so previews still render.
if (import.meta.env.DEV) {
  const nativeRaf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    if (document.visibilityState === 'hidden') {
      return window.setTimeout(() => cb(performance.now()), 33)
    }
    return nativeRaf(cb)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
