import { AuthProvider } from './AuthContext'

export function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

