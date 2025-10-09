import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="app-shell">
      <div className="card">
        <h1>404</h1>
        <p>This page doesn&apos;t exist yet. Return to the MajicAgent Command Center to keep building momentum.</p>
        <Link to="/" className="module-card__action">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
