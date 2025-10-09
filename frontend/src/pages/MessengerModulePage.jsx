import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SectionCard from '../components/SectionCard.jsx';
import { useAgentProfile } from '../hooks/useAgentProfile.js';
import { useAuthContext } from '../context/AuthContext.jsx';
import { apiFetch } from '../api/client.js';

const initialCadenceForm = {
  name: '',
  description: '',
  channel: 'email',
  triggerType: 'manual',
  triggerValue: '',
  delayMinutes: 0,
  templateSubject: '',
  templateBody: ''
};

function MessengerModulePage() {
  const { token } = useAuthContext();
  const agentQuery = useAgentProfile();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialCadenceForm);
  const moduleInfo = agentQuery.data?.modules?.available?.find((module) => module.slug === 'majic-messenger');

  const cadencesQuery = useQuery({
    queryKey: ['messenger', 'cadences'],
    queryFn: () => apiFetch('/api/messenger/cadences', { token }),
    enabled: Boolean(token)
  });

  const createCadenceMutation = useMutation({
    mutationFn: async (payload) =>
      apiFetch('/api/messenger/cadences', { token, method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'cadences'] });
      setForm(initialCadenceForm);
    }
  });

  const updateCadenceMutation = useMutation({
    mutationFn: async ({ id, update }) =>
      apiFetch(`/api/messenger/cadences/${id}`, { token, method: 'PATCH', body: update }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'cadences'] });
    }
  });

  const cadences = cadencesQuery.data ?? [];
  const activeCadenceCount = useMemo(() => cadences.filter((cadence) => cadence.status === 'active').length, [cadences]);

  if (agentQuery.isLoading) {
    return (
      <div className="app-shell">
        <div className="card">
          <p>Loading Majic Messenger…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h1>{moduleInfo?.name || 'Majic Messenger'}</h1>
          <p className="header-subtitle">Build omnichannel cadences that react instantly to lead behavior.</p>
          <p className="header-meta">Active cadences: {activeCadenceCount}</p>
        </div>
      </header>

      <SectionCard title="Compose Cadence" action={null}>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            createCadenceMutation.mutate({
              ...form,
              delayMinutes: Number(form.delayMinutes)
            });
          }}
        >
          <div className="form-row">
            <label>
              Cadence name
              <input
                type="text"
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>
            <label>
              Channel
              <select
                value={form.channel}
                onChange={(event) => setForm((prev) => ({ ...prev, channel: event.target.value }))}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="voice">Voice drop</option>
              </select>
            </label>
            <label>
              Trigger
              <select
                value={form.triggerType}
                onChange={(event) => setForm((prev) => ({ ...prev, triggerType: event.target.value }))}
              >
                <option value="manual">Manual</option>
                <option value="new_lead">New lead</option>
                <option value="lead_stage">Lead enters stage</option>
                <option value="listing_status">Listing status change</option>
              </select>
            </label>
          </div>
          <label>
            Description (internal)
            <input
              type="text"
              placeholder="e.g. New lead instant reply"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>
          {form.triggerType !== 'manual' ? (
            <label>
              Trigger value
              <input
                type="text"
                placeholder="e.g. nurturing, under_contract"
                value={form.triggerValue}
                onChange={(event) => setForm((prev) => ({ ...prev, triggerValue: event.target.value }))}
              />
            </label>
          ) : null}
          <label>
            Delay (minutes)
            <input
              type="number"
              min="0"
              value={form.delayMinutes}
              onChange={(event) => setForm((prev) => ({ ...prev, delayMinutes: event.target.value }))}
            />
          </label>
          <label>
            Subject (optional)
            <input
              type="text"
              value={form.templateSubject}
              onChange={(event) => setForm((prev) => ({ ...prev, templateSubject: event.target.value }))}
            />
          </label>
          <label>
            Message body
            <textarea
              rows={4}
              required
              value={form.templateBody}
              onChange={(event) => setForm((prev) => ({ ...prev, templateBody: event.target.value }))}
            />
          </label>
          {createCadenceMutation.error ? (
            <p className="form-error">{createCadenceMutation.error.message}</p>
          ) : null}
          <button type="submit" className="primary-button" disabled={createCadenceMutation.isPending}>
            {createCadenceMutation.isPending ? 'Saving…' : 'Save cadence'}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Cadence Library" action={null}>
        {cadencesQuery.isLoading ? (
          <p>Loading cadences…</p>
        ) : cadences.length === 0 ? (
          <p className="empty">No cadences yet. Create a cadence above to start automating follow-ups.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Channel</th>
                  <th>Trigger</th>
                  <th>Delay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cadences.map((cadence) => (
                  <tr key={cadence._id}>
                    <td>{cadence.name}</td>
                    <td>{cadence.channel}</td>
                    <td>{cadence.triggerType === 'manual' ? 'Manual' : `${cadence.triggerType} → ${cadence.triggerValue || 'any'}`}</td>
                    <td>{cadence.delayMinutes}m</td>
                    <td className={`pill pill--${cadence.status === 'active' ? 'high' : cadence.status === 'paused' ? 'medium' : 'low'}`}>
                      {cadence.status}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() =>
                          updateCadenceMutation.mutate({
                            id: cadence._id,
                            update: {
                              status: cadence.status === 'active' ? 'paused' : 'active'
                            }
                          })
                        }
                      >
                        {cadence.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Workflow Tips" action={null}>
        <ul>
          <li>Stack cadences by trigger: new leads get instant responses, nurtures get periodic check-ins.</li>
          <li>Pair with Listing Command Center tasks so transaction coordinators know when messaging fires.</li>
          <li>Loop in Market Insights once live to send targeted market updates to high-likelihood sellers.</li>
        </ul>
      </SectionCard>
    </div>
  );
}

export default MessengerModulePage;
