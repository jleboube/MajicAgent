import { Link } from 'react-router-dom';

function ModuleCard({ module, enabled, active }) {
  const { name, shortDescription, status, actions, category } = module;

  const statusLabel = {
    available: 'Live',
    beta: 'Beta',
    'coming-soon': 'Coming soon'
  }[status] || status;

  return (
    <article className={`module-card module-card--${status} ${active ? 'module-card--active' : ''}`}>
      <header>
        <span className="module-card__badge">{statusLabel}</span>
        <h3>{name}</h3>
        <p className="module-card__category">{category?.replace('-', ' ')}</p>
      </header>
      <p className="module-card__description">{shortDescription}</p>
      <footer>
        {actions?.map((action) => {
          if (action.type === 'external') {
            return (
              <a key={action.label} href={action.url} target="_blank" rel="noreferrer" className="module-card__action">
                {action.label}
              </a>
            );
          }

          const className = `module-card__action${enabled ? '' : ' module-card__action--soft'}`;
          return <Link key={action.label} to={action.path} className={className}>{action.label}</Link>;
        })}
      </footer>
    </article>
  );
}

export default ModuleCard;
