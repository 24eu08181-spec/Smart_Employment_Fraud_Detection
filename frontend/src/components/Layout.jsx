import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', to: '/' },
  { name: 'Analyze Job', to: '/analyze' },
  { name: 'History', to: '/history' },
  { name: 'Analytics', to: '/analytics' },
  { name: 'Model Info', to: '/model-info' },
  { name: 'About', to: '/about' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72">
          <div className="card-surface h-full p-5">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Fraud Detection</p>
              <h1 className="mt-3 text-2xl font-bold text-white">Smart Employment</h1>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>

            <div className="mt-10 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
              Academic ML + NLP pipeline for recruitment fraud analysis.
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
