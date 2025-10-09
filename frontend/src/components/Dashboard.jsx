import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import SectionCard from './SectionCard.jsx';
import { apiFetch } from '../api/client.js';
import { useAuthContext } from '../context/AuthContext.jsx';
import ArtifactUploader from './ArtifactUploader.jsx';
import ModuleCard from './ModuleCard.jsx';
import { useAgentProfile } from '../hooks/useAgentProfile.js';
import { useStorageStatus } from '../hooks/useStorageStatus.js';
import { useAiStatus } from '../hooks/useAiStatus.js';

const initialLeadForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  source: 'manual',
  tags: '',
  notes: ''
};

const initialListingForm = {
  street1: '',
  street2: '',
  city: '',
  state: '',
  postalCode: '',
  listPrice: '',
  bedrooms: '',
  bathrooms: '',
  squareFeet: '',
  description: ''
};

const initialTaskForm = {
  title: '',
  description: '',
  category: 'lead',
  priority: 'medium',
  dueDate: ''
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function safeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && value !== '' ? numeric : null;
}

function Dashboard() {
  const { token, logout, role } = useAuthContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [leadForm, setLeadForm] = useState(initialLeadForm);
  const [listingForm, setListingForm] = useState(initialListingForm);
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [generatedCopy, setGeneratedCopy] = useState(null);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch('/api/auth/me', { token }),
    enabled: Boolean(token)
  });

  const agentQuery = useAgentProfile();

  const leadsQuery = useQuery({
    queryKey: ['leads'],
    queryFn: () => apiFetch('/api/leads', { token }),
    enabled: Boolean(token)
  });

  const listingsQuery = useQuery({
    queryKey: ['listings'],
    queryFn: () => apiFetch('/api/listings', { token }),
    enabled: Boolean(token)
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiFetch('/api/tasks', { token }),
    enabled: Boolean(token)
  });

  const artifactsQuery = useQuery({
    queryKey: ['artifacts'],
    queryFn: () => apiFetch('/api/artifacts', { token }),
    enabled: Boolean(token),
    retry: false
  });

  const leadMutation = useMutation({
    mutationFn: async (payload) => apiFetch('/api/leads', { token, method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setLeadForm(initialLeadForm);
    }
  });

  const listingMutation = useMutation({
    mutationFn: async (payload) => apiFetch('/api/listings', { token, method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setListingForm(initialListingForm);
    }
  });

  const taskMutation = useMutation({
    mutationFn: async (payload) => apiFetch('/api/tasks', { token, method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTaskForm(initialTaskForm);
    }
  });

  const copyMutation = useMutation({
    mutationFn: async ({ listingId }) =>
      apiFetch(`/api/listings/${listingId}/generate-copy`, { token, method: 'POST' }),
    onSuccess: (data, variables) => {
      setGeneratedCopy({
        listingId: variables.listingId,
        listingLabel: variables.listingLabel,
        copy: data
      });
    }
  });

  const user = meQuery.data;
  const agentProfile = agentQuery.data?.profile;
  const storageStatusQuery = useStorageStatus();
  const aiStatusQuery = useAiStatus();

  const storageHealthy = storageStatusQuery.data?.ok ?? false;
  const storageMessage = storageStatusQuery.error
    ? 'Storage status unavailable'
    : storageHealthy
      ? 'Secure storage ready'
      : 'Storage not yet provisioned';

  const aiHealthy = aiStatusQuery.data?.openai || aiStatusQuery.data?.anthropic || false;
  const aiMessage = aiStatusQuery.error
    ? 'AI connectivity unavailable'
    : aiHealthy
      ? 'AI ready'
      : 'AI not ready';

  const automationHealthy = aiStatusQuery.data?.n8n || false;
  const automationMessage = aiStatusQuery.error
    ? 'Automation unavailable'
    : automationHealthy
      ? 'Automation ready'
      : 'Automation not configured';

  useEffect(() => {
    if (meQuery.error?.status === 401 || agentQuery.error?.status === 401) {
      logout();
    }
  }, [meQuery.error, agentQuery.error, logout]);
  const modulesAvailable = agentQuery.data?.modules?.available ?? [];
  const modulesEnabled = new Set(agentQuery.data?.modules?.enabled ?? []);
  const activeModuleSlug = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/modules/photo')) return 'majic-photo';
    if (path.startsWith('/modules/listings')) return 'majic-listing-agent';
    if (path.startsWith('/modules/messenger')) return 'majic-messenger';
    if (path.startsWith('/modules/insights')) return 'majic-insights';
    return null;
  }, [location.pathname]);
  const leads = leadsQuery.data ?? [];
  const listings = listingsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const artifacts = artifactsQuery.data ?? [];
  const taskSuggestions = useMemo(() => {
    const sortable = (date) => (date ? new Date(date).getTime() : Number.MAX_SAFE_INTEGER);
    const listingMap = new Map(listings.map((listing) => [listing._id?.toString(), listing]));
    const tasksByListing = tasks
      .filter((task) => task.relatedListing)
      .map((task) => ({
        task,
        listing: listingMap.get(task.relatedListing?.toString())
      }))
      .filter(({ listing, task }) => listing && task.status !== 'completed')
      .sort((a, b) => sortable(a.task.dueDate) - sortable(b.task.dueDate));

    const leadMap = new Map(leads.map((lead) => [lead._id?.toString(), lead]));
    const tasksByLead = tasks
      .filter((task) => task.relatedLead)
      .map((task) => ({
        task,
        lead: leadMap.get(task.relatedLead?.toString())
      }))
      .filter(({ lead, task }) => lead && task.status !== 'completed')
      .sort((a, b) => sortable(a.task.dueDate) - sortable(b.task.dueDate));

    const listingSuggestion = tasksByListing[0]
      ? {
          type: 'listing',
          title: tasksByListing[0].listing.address?.street1 || 'Active listing',
          task: tasksByListing[0].task
        }
      : null;

    const leadSuggestion = tasksByLead[0]
      ? {
          type: 'lead',
          title: `${tasksByLead[0].lead.contact?.firstName || ''} ${tasksByLead[0].lead.contact?.lastName || ''}`.trim() ||
            'Lead follow-up',
          task: tasksByLead[0].task
        }
      : null;

    return { listingSuggestion, leadSuggestion };
  }, [tasks, listings, leads]);

  const licenseMessage = useMemo(() => {
    if (!user) return '';
    if (user.isUnlimited) return 'Unlimited staging credits active';
    return `${user.remainingCredits} of ${user.photoCredits} photo credits remaining`;
  }, [user]);

  const heroMeta = useMemo(() => {
    return [user?.displayName || user?.email, role || user?.role || 'agent', licenseMessage]
      .filter(Boolean)
      .join(' • ');
  }, [user, role, licenseMessage]);

  const handleLeadSubmit = (event) => {
    event.preventDefault();
    const payload = {
      contact: {
        firstName: leadForm.firstName.trim(),
        lastName: leadForm.lastName.trim(),
        email: leadForm.email.trim() || undefined,
        phone: leadForm.phone.trim() || undefined
      },
      source: leadForm.source,
      tags: leadForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      notes: leadForm.notes.trim() || undefined
    };

    leadMutation.mutate(payload);
  };

  const handleListingSubmit = (event) => {
    event.preventDefault();
    const payload = {
      address: {
        street1: listingForm.street1.trim(),
        street2: listingForm.street2.trim() || undefined,
        city: listingForm.city.trim(),
        state: listingForm.state.trim(),
        postalCode: listingForm.postalCode.trim(),
        country: 'USA'
      },
      listPrice: safeNumber(listingForm.listPrice),
      description: listingForm.description.trim(),
      propertyDetails: {
        bedrooms: safeNumber(listingForm.bedrooms),
        bathrooms: safeNumber(listingForm.bathrooms),
        squareFeet: safeNumber(listingForm.squareFeet)
      }
    };

    listingMutation.mutate(payload);
  };

  const handleTaskSubmit = (event) => {
    event.preventDefault();
    if (!user) return;

    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      category: taskForm.category,
      priority: taskForm.priority,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
      assignee: user.id
    };

    taskMutation.mutate(payload);
  };

  const handleGenerateCopy = (listing) => {
    if (!listing?._id) return;
    copyMutation.mutate({
      listingId: listing._id,
      listingLabel: `${listing.address?.street1 || 'Listing'} ${listing.address?.city ? `• ${listing.address.city}` : ''}`.trim()
    });
  };

  const experienceLoading = meQuery.isLoading || agentQuery.isLoading;

  if (experienceLoading) {
    return (
      <div className="app-shell">
        <div className="card">
          <p>Preparing your MajicAgent workspace…</p>
        </div>
      </div>
    );
  }

  if (agentQuery.error) {
    if (agentQuery.error.status === 401) {
      return null;
    }
    return (
      <div className="app-shell">
        <div className="card">
          <p>We hit a snag loading your MajicAgent modules: {agentQuery.error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h1>{agentProfile?.brandName || 'MajicAgent Command Center'}</h1>
          <p className="header-subtitle">
            {agentProfile?.tagline || 'One stop growth platform for real estate professionals.'}
          </p>
          <p className="header-meta">{heroMeta}</p>
        </div>
        <div className="header-actions">
          <span className={`storage-indicator ${storageHealthy ? 'storage-indicator--ok' : 'storage-indicator--warn'}`}>
            {storageMessage}
          </span>
          <span className={`storage-indicator ${aiHealthy ? 'storage-indicator--ok' : 'storage-indicator--warn'}`}>
            {aiMessage}
          </span>
          <span className={`storage-indicator ${automationHealthy ? 'storage-indicator--ok' : 'storage-indicator--warn'}`}>
            {automationMessage}
          </span>
          <button type="button" className="ghost-button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <SectionCard title="MajicAgent Modules" action={null}>
        <p>
          Activate the components that remove friction for your business. Every module works from the same data, so
          your photos, messages, and transactions stay orchestrated.
        </p>
        <div className="module-grid">
          {modulesAvailable.map((module) => (
            <ModuleCard
              key={module.slug}
              module={module}
              enabled={modulesEnabled.has(module.slug)}
              active={activeModuleSlug === module.slug}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Next Best Actions" action={null}>
        {taskSuggestions.listingSuggestion || taskSuggestions.leadSuggestion ? (
          <ul className="task-list">
            {taskSuggestions.listingSuggestion ? (
              <li>
                <strong>Listing · {taskSuggestions.listingSuggestion.title}</strong> —{' '}
                {taskSuggestions.listingSuggestion.task.title} (due{' '}
                {taskSuggestions.listingSuggestion.task.dueDate
                  ? new Date(taskSuggestions.listingSuggestion.task.dueDate).toLocaleDateString()
                  : 'soon'}
                )
              </li>
            ) : null}
            {taskSuggestions.leadSuggestion ? (
              <li>
                <strong>Lead · {taskSuggestions.leadSuggestion.title || 'Prospect follow-up'}</strong> —{' '}
                {taskSuggestions.leadSuggestion.task.title} (due{' '}
                {taskSuggestions.leadSuggestion.task.dueDate
                  ? new Date(taskSuggestions.leadSuggestion.task.dueDate).toLocaleDateString()
                  : 'soon'}
                )
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="empty">No immediate actions pending. You&apos;re all caught up!</p>
        )}
      </SectionCard>

      <div className="grid">
        <SectionCard title="Create Lead" action={null}>
          <form className="form-grid" onSubmit={handleLeadSubmit}>
            <div className="form-row">
              <label>
                First name
                <input
                  type="text"
                  required
                  value={leadForm.firstName}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, firstName: event.target.value }))}
                />
              </label>
              <label>
                Last name
                <input
                  type="text"
                  required
                  value={leadForm.lastName}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, lastName: event.target.value }))}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Email
                <input
                  type="email"
                  value={leadForm.email}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={leadForm.phone}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Source
                <select
                  value={leadForm.source}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, source: event.target.value }))}
                >
                  <option value="manual">Manual</option>
                  <option value="website">Website</option>
                  <option value="zillow">Zillow</option>
                  <option value="referral">Referral</option>
                </select>
              </label>
              <label>
                Tags
                <input
                  type="text"
                  placeholder="comma separated"
                  value={leadForm.tags}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, tags: event.target.value }))}
                />
              </label>
            </div>
            <label>
              Notes
              <textarea
                rows={2}
                value={leadForm.notes}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </label>
            {leadMutation.error ? <p className="form-error">{leadMutation.error.message}</p> : null}
            <button type="submit" className="primary-button" disabled={leadMutation.isPending}>
              {leadMutation.isPending ? 'Creating…' : 'Save lead'}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Add Listing">
          <form className="form-grid" onSubmit={handleListingSubmit}>
            <label>
              Street address
              <input
                type="text"
                required
                value={listingForm.street1}
                onChange={(event) => setListingForm((prev) => ({ ...prev, street1: event.target.value }))}
              />
            </label>
            <label>
              Address line 2
              <input
                type="text"
                value={listingForm.street2}
                onChange={(event) => setListingForm((prev) => ({ ...prev, street2: event.target.value }))}
              />
            </label>
            <div className="form-row">
              <label>
                City
                <input
                  type="text"
                  required
                  value={listingForm.city}
                  onChange={(event) => setListingForm((prev) => ({ ...prev, city: event.target.value }))}
                />
              </label>
              <label>
                State
                <input
                  type="text"
                  required
                  value={listingForm.state}
                  onChange={(event) => setListingForm((prev) => ({ ...prev, state: event.target.value }))}
                />
              </label>
              <label>
                Postal code
                <input
                  type="text"
                  required
                  value={listingForm.postalCode}
                  onChange={(event) => setListingForm((prev) => ({ ...prev, postalCode: event.target.value }))}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                List price
                <input
                  type="number"
                  value={listingForm.listPrice}
                  onChange={(event) => setListingForm((prev) => ({ ...prev, listPrice: event.target.value }))}
                />
              </label>
              <label>
                Beds
                <input
                  type="number"
                  value={listingForm.bedrooms}
                  onChange={(event) => setListingForm((prev) => ({ ...prev, bedrooms: event.target.value }))}
                />
              </label>
              <label>
                Baths
                <input
                  type="number"
                  value={listingForm.bathrooms}
                  onChange={(event) => setListingForm((prev) => ({ ...prev, bathrooms: event.target.value }))}
                />
              </label>
              <label>
                Sq ft
                <input
                  type="number"
                  value={listingForm.squareFeet}
                  onChange={(event) => setListingForm((prev) => ({ ...prev, squareFeet: event.target.value }))}
                />
              </label>
            </div>
            <label>
              Description
              <textarea
                rows={3}
                value={listingForm.description}
                onChange={(event) => setListingForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>
            {listingMutation.error ? <p className="form-error">{listingMutation.error.message}</p> : null}
            <button type="submit" className="primary-button" disabled={listingMutation.isPending}>
              {listingMutation.isPending ? 'Saving…' : 'Save listing'}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Upcoming Tasks">
          <form className="form-grid" onSubmit={handleTaskSubmit}>
            <label>
              Title
              <input
                type="text"
                required
                value={taskForm.title}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label>
              Description
              <textarea
                rows={2}
                value={taskForm.description}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>
            <div className="form-row">
              <label>
                Category
                <select
                  value={taskForm.category}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, category: event.target.value }))}
                >
                  <option value="lead">Lead</option>
                  <option value="listing">Listing</option>
                  <option value="transaction">Transaction</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>
                Priority
                <select
                  value={taskForm.priority}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>
                Due date
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                />
              </label>
            </div>
            {taskMutation.error ? <p className="form-error">{taskMutation.error.message}</p> : null}
            <button type="submit" className="primary-button" disabled={taskMutation.isPending}>
              {taskMutation.isPending ? 'Saving…' : 'Save task'}
            </button>
          </form>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty">No tasks yet</td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task._id}>
                      <td>{task.title}</td>
                      <td>{task.status}</td>
                      <td>{formatDate(task.dueDate)}</td>
                      <td className={`pill pill--${task.priority}`}>{task.priority}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Lead Pipeline">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Stage</th>
                  <th>Source</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty">No leads yet</td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead._id}>
                      <td>{`${lead.contact?.firstName || ''} ${lead.contact?.lastName || ''}`.trim()}</td>
                      <td>{lead.stage}</td>
                      <td>{lead.source}</td>
                      <td>{formatDate(lead.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Active Listings"
          action={
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate('/modules/listings')}
            >
              Manage Listings
            </button>
          }
        >
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Updated</th>
                  <th>Marketing</th>
                </tr>
              </thead>
              <tbody>
                {listings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty">No listings yet</td>
                  </tr>
                ) : (
                  listings.map((listing) => (
                    <tr key={listing._id}>
                      <td>
                        {listing.address?.street1}, {listing.address?.city}
                      </td>
                      <td>{listing.status}</td>
                      <td>{listing.listPrice ? `$${Number(listing.listPrice).toLocaleString()}` : '—'}</td>
                      <td>{formatDate(listing.updatedAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => handleGenerateCopy(listing)}
                          disabled={copyMutation.isPending && copyMutation.variables?.listingId === listing._id}
                        >
                          {copyMutation.isPending && copyMutation.variables?.listingId === listing._id
                            ? 'Generating…'
                            : 'Generate copy'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {copyMutation.error ? <p className="form-error">{copyMutation.error.message}</p> : null}
          {generatedCopy ? (
            <div className="generated-copy">
              <h3>Marketing copy for {generatedCopy.listingLabel}</h3>
              <div className="generated-copy__grid">
                <div className="generated-copy__item">
                  <h4>MLS Description</h4>
                  <p>{generatedCopy.copy.mlsDescription}</p>
                </div>
                <div className="generated-copy__item">
                  <h4>Social Caption</h4>
                  <p>{generatedCopy.copy.socialCaption}</p>
                </div>
                <div className="generated-copy__item">
                  <h4>Email Subject</h4>
                  <p>{generatedCopy.copy.emailSubject}</p>
                </div>
                <div className="generated-copy__item">
                  <h4>Email Body</h4>
                  <p>{generatedCopy.copy.emailBody}</p>
                </div>
              </div>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="Artifact Vault">
          <ArtifactUploader />
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Uploaded</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {artifacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty">Artifacts will appear here after uploads</td>
                  </tr>
                ) : (
                  artifacts.map((artifact) => (
                    <tr key={artifact._id}>
                      <td>{artifact.fileName}</td>
                      <td>{artifact.category}</td>
                      <td>{formatDate(artifact.createdAt)}</td>
                      <td>
                        {artifact.downloadUrl ? (
                          <a href={artifact.downloadUrl} target="_blank" rel="noreferrer">
                            Download
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {artifactsQuery.error ? (
            <p className="form-error">Unable to load artifacts: {artifactsQuery.error.message}</p>
          ) : null}
        </SectionCard>
      </div>
    </div>
  );
}

export default Dashboard;
