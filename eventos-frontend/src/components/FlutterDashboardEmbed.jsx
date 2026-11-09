/**
 * Embebe el dashboard Flutter (StatsWidget + tareas) en React.
 * Fuente: eventos-watch build web con MODE=dashboard
 * Ruta: /dashboard
 */
export default function FlutterDashboardEmbed() {
  return (
    <main className="min-h-screen bg-evently-bg text-evently-text p-4 sm:p-8">
      <div className="max-w-5xl mx-auto mb-4">
        <a
          href="/"
          className="text-sm text-evently-textSecondary hover:text-evently-text mb-3 inline-block"
        >
          ← Volver a Evently
        </a>
        <h1 className="font-display font-black text-2xl sm:text-3xl mb-1">
          Dashboard Evently
        </h1>
        <p className="text-sm text-evently-textSecondary">
          React + módulo Flutter Web: <code>StatsWidget</code> (mismo del
          wearable) y lista de tareas interactivas.
        </p>
      </div>
      <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-evently-border bg-white shadow-soft min-h-[70vh]">
        <iframe
          title="Evently Flutter Dashboard"
          src="/flutter-dashboard/index.html"
          className="w-full min-h-[70vh] border-0"
          allow="fullscreen"
        />
      </div>
    </main>
  )
}
