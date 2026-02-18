import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import GlobalErrorFallback from './components/GlobalErrorFallback.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorFallback>
      <App />
    </GlobalErrorFallback>
  </StrictMode>,
)
