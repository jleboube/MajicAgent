import { NavLink, Outlet } from 'react-router-dom';
import { useAgentProfile } from '../hooks/useAgentProfile.js';

const moduleRouteMap = {
  'majic-photo': '/modules/photo',
  'majic-listing-agent': '/modules/listings',
  'majic-messenger': '/modules/messenger',
  'majic-insights': '/modules/insights'
};

function AppLayout() {
  const agentQuery = useAgentProfile();
  const modules = agentQuery.data?.modules?.available ?? [];
  const enabled = new Set(agentQuery.data?.modules?.enabled ?? []);

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="app-nav__brand">
          <img src="/majicagent-logo.svg" alt="" aria-hidden="true" />
          <NavLink to="/">MajicAgent</NavLink>
        </div>
        <nav className="app-nav__links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}>
            Dashboard
          </NavLink>
          {modules.map((module) => {
            const path = moduleRouteMap[module.slug];
            if (!path) return null;

            const isEnabled = enabled.has(module.slug) || module.status !== 'available';

            if (!isEnabled) {
              return (
                <span key={module.slug} className="nav-link nav-link--disabled">
                  {module.name}
                </span>
              );
            }

            return (
              <NavLink
                key={module.slug}
                to={path}
                className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
              >
                {module.name}
              </NavLink>
            );
          })}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
