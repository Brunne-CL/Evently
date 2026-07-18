import { AuthProvider } from './context/AuthContext.jsx'
import { EventDataProvider } from './context/EventDataContext.jsx'
import LandingPage from './LandingPage.jsx'
import WatchSimulator from './WatchSimulator.jsx'

function App() {
  const isWatchSimulator = window.location.pathname === '/watch'

  return (
    <AuthProvider>
      <EventDataProvider>
        {isWatchSimulator ? <WatchSimulator /> : <LandingPage />}
      </EventDataProvider>
    </AuthProvider>
  )
}

export default App
