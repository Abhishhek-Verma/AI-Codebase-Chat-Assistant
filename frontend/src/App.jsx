import './index.css'
import ChatPage from './pages/ChatPage'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <ChatPage />
    </AuthProvider>
  )
}

export default App
