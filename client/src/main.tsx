import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/library-tokens.css'
import './styles/bookending.css'
import { AuthProvider } from './features/auth'
import { QuietModeProvider } from './features/quiet-mode/QuietModeContext'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <QuietModeProvider>
        <App />
      </QuietModeProvider>
    </AuthProvider>
  </StrictMode>,
)
