import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './providers/ThemeProvider'
import { FontProvider } from './providers/FontProvider'
import { ToastProvider } from './providers/ToastProvider'
import { AuthProvider } from './providers/AuthProvider'
import { router } from './router'

export function App() {
  return (
    <ThemeProvider>
      <FontProvider>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </FontProvider>
    </ThemeProvider>
  )
}

export default App
