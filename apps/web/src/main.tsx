// How does the application start?
// React needs an entry point that mounts the component tree to the DOM.
// StrictMode intentionally double-invokes some functions in development
// to reveal side effects. It does nothing in production.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
