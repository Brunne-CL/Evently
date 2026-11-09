import { AuthProvider } from './context/AuthContext.jsx'
import { EventDataProvider } from './context/EventDataContext.jsx'
import LandingPage from './LandingPage.jsx'
import EventlyTVWidget from './widgets/EventlyTVWidget.jsx'
import FlutterDashboardEmbed from './components/FlutterDashboardEmbed.jsx'
import OpenInApp from './components/OpenInApp.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

function App() {
  const path = window.location.pathname
  const isTvWidget = path === '/tv' || path.startsWith('/tv/')
  const isDashboard = path === '/dashboard' || path.startsWith('/dashboard/')
  const isOpenApp = path === '/abrir' || path.startsWith('/abrir/')
  const isAdmin = path === '/admin' || path.startsWith('/admin/')

  let page = <LandingPage />
  if (isAdmin) page = <AdminDashboard />
  else if (isOpenApp) page = <OpenInApp />
  else if (isTvWidget) page = <EventlyTVWidget />
  else if (isDashboard) page = <FlutterDashboardEmbed />

  return (
    <AuthProvider>
      <EventDataProvider>{page}</EventDataProvider>
    </AuthProvider>
  )
}

export default App
