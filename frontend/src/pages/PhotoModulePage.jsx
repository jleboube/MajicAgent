import SectionCard from '../components/SectionCard.jsx';
import { useAgentProfile } from '../hooks/useAgentProfile.js';

const STUDIO_URL = 'https://majic-photo.com';

function PhotoModulePage() {
  const agentQuery = useAgentProfile();
  const moduleInfo = agentQuery.data?.modules?.available?.find((module) => module.slug === 'majic-photo');

  if (agentQuery.isLoading) {
    return (
      <div className="app-shell">
        <div className="card">
          <p>Loading Majic Photo Studio…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h1>{moduleInfo?.name || 'Majic Photo Studio'}</h1>
          <p className="header-subtitle">
            Bring every listing to life with AI-powered staging, sequencing, and syndication.
          </p>
          <p className="header-meta">Status: {moduleInfo?.status === 'available' ? 'Live' : moduleInfo?.status}</p>
        </div>
        <div className="header-actions">
          <a className="ghost-button" href={STUDIO_URL} target="_blank" rel="noreferrer">
            Open in new tab
          </a>
        </div>
      </header>

      <SectionCard title="Studio" action={null}>
        <div className="studio-frame__wrapper">
          <iframe
            title="Majic Photo Studio"
            src={STUDIO_URL}
            className="studio-frame"
            allow="clipboard-write"
          />
        </div>
      </SectionCard>

      <SectionCard title="Workflow Tips" action={null}>
        <ol>
          <li>Select a listing and drop in the room photos you want staged.</li>
          <li>Pick a design preset—or let MajicAgent recommend one based on property style.</li>
          <li>Publish the enhanced images straight to your Listing Command Center and marketing channels.</li>
        </ol>
      </SectionCard>

      <SectionCard title="Automation" action={null}>
        <p>
          Prefer to automate? Majic Photo exposes an API for batch staging and MLS ingestion. Use it to feed image
          pipelines from Dropbox, Google Drive, or your photographer&apos;s S3 bucket.
        </p>
        <p>
          <a className="module-card__action" href={moduleInfo?.actions?.find((a) => a.type === 'external')?.url ?? '#'} target="_blank" rel="noreferrer">
            View Photo API Docs
          </a>
        </p>
      </SectionCard>
    </div>
  );
}

export default PhotoModulePage;
