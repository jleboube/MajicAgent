import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import SectionCard from '../components/SectionCard.jsx';
import { useAgentProfile } from '../hooks/useAgentProfile.js';
import { useAuthContext } from '../context/AuthContext.jsx';
import { apiFetch } from '../api/client.js';

function InsightsModulePage() {
  const { token } = useAuthContext();
  const agentQuery = useAgentProfile();
  const moduleInfo = agentQuery.data?.modules?.available?.find((module) => module.slug === 'majic-insights');

  const insightsQuery = useQuery({
    queryKey: ['insights', 'summary'],
    queryFn: () => apiFetch('/api/insights/summary', { token }),
    enabled: Boolean(token)
  });

  const leadStages = insightsQuery.data?.leadStages ?? [];
  const listingStatuses = insightsQuery.data?.listingStatuses ?? [];
  const totals = insightsQuery.data?.totals ?? { leads: 0, listings: 0 };
  const openTasks = insightsQuery.data?.openTasks ?? [];
  const recentInteractions = insightsQuery.data?.recentInteractions ?? [];

  const hottestLeadStage = useMemo(() => {
    if (!leadStages.length) return null;
    return leadStages.reduce((top, current) => (current.count > (top?.count ?? 0) ? current : top), null);
  }, [leadStages]);

  if (agentQuery.isLoading || insightsQuery.isLoading) {
    return (
      <div className="app-shell">
        <div className="card">
          <p>Loading Market Insights…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h1>{moduleInfo?.name || 'Market Insights'}</h1>
          <p className="header-subtitle">Predict the next listing opportunity and monitor your portfolio from one hub.</p>
          <p className="header-meta">
            Leads tracked: {totals.leads} • Listings tracked: {totals.listings}
          </p>
        </div>
      </header>

      <SectionCard title="Lead Pipeline" action={null}>
        {leadStages.length === 0 ? (
          <p className="empty">No leads yet. Capture leads to unlock stage distribution.</p>
        ) : (
          <div className="insights-grid">
            {leadStages.map((stage) => (
              <div key={stage._id} className="insights-card">
                <p className="insights-card__label">{stage._id || 'unspecified'}</p>
                <p className="insights-card__value">{stage.count}</p>
              </div>
            ))}
          </div>
        )}
        {hottestLeadStage ? (
          <p className="header-meta">
            Momentum: {hottestLeadStage._id || 'unspecified'} leads are hottest right now.
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title="Listing Rollup" action={null}>
        {listingStatuses.length === 0 ? (
          <p className="empty">No listings yet. Add listings to see portfolio metrics.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Total value</th>
                </tr>
              </thead>
              <tbody>
                {listingStatuses.map((status) => (
                  <tr key={status._id}>
                    <td>{status._id}</td>
                    <td>{status.count}</td>
                    <td>{status.totalValue ? `$${Number(status.totalValue).toLocaleString()}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Focus Tasks" action={null}>
        {openTasks.length === 0 ? (
          <p className="empty">No outstanding tasks. Keep the momentum going!</p>
        ) : (
          <ul className="task-list">
            {openTasks.map((task) => (
              <li key={task._id}>
                <strong>{task.title}</strong> — due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'soon'} •
                {` ${task.priority.toUpperCase()}`}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Latest Activity" action={null}>
        {recentInteractions.length === 0 ? (
          <p className="empty">Engagement history will surface here once you start logging comms.</p>
        ) : (
          <ul className="interaction-list">
            {recentInteractions.map((interaction) => (
              <li key={interaction._id}>
                <span className="pill pill--medium">{interaction.channel}</span> {interaction.subject || 'Conversation'} &middot;{' '}
                {interaction.lead?.contact?.firstName} {interaction.lead?.contact?.lastName} —{' '}
                {new Date(interaction.occurredAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export default InsightsModulePage;
