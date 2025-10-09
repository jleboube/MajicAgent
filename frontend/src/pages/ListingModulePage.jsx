import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SectionCard from '../components/SectionCard.jsx';
import { apiFetch } from '../api/client.js';
import { useAuthContext } from '../context/AuthContext.jsx';
import { useAgentProfile } from '../hooks/useAgentProfile.js';

const listingDefaults = {
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

function formatDate(value) {
  if (!value) return '—';
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? value : dt.toLocaleDateString();
}

function safeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && value !== '' ? numeric : null;
}

function ListingModulePage() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(listingDefaults);
  const [generatedCopy, setGeneratedCopy] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const agentQuery = useAgentProfile();
  const moduleInfo = agentQuery.data?.modules?.available?.find((module) => module.slug === 'majic-listing-agent');

  const listingsQuery = useQuery({
    queryKey: ['listings'],
    queryFn: () => apiFetch('/api/listings', { token }),
    enabled: Boolean(token)
  });

  const listingMutation = useMutation({
    mutationFn: async (payload) => apiFetch('/api/listings', { token, method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setForm(listingDefaults);
    }
  });

  const copyMutation = useMutation({
    mutationFn: async ({ listingId }) => apiFetch(`/api/listings/${listingId}/generate-copy`, { token, method: 'POST' }),
    onSuccess: (data, variables) => {
      setGeneratedCopy({ listingId: variables.listingId, listingLabel: variables.listingLabel, copy: data });
      setActionMessage(null);
    }
  });

  const messengerMutation = useMutation({
    mutationFn: async ({ listingId, copy }) =>
      apiFetch('/api/messenger/cadences/from-copy', {
        token,
        method: 'POST',
        body: { listingId, copy }
      }),
    onSuccess: () => {
      setActionMessage('Messenger cadence created from listing copy.');
      queryClient.invalidateQueries({ queryKey: ['messenger', 'cadences'] });
    },
    onError: (error) => {
      setActionMessage(error?.message || 'Unable to create messenger cadence from copy.');
    }
  });

  const handleClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setActionMessage(`${label} copied to clipboard.`);
    } catch (error) {
      console.error('Clipboard error:', error);
      setActionMessage('Unable to copy to clipboard.');
    }
  };

  const listings = listingsQuery.data ?? [];

  const heroMeta = useMemo(() => {
    return moduleInfo?.status === 'beta' ? 'Beta Access' : moduleInfo?.status === 'available' ? 'Live' : 'Preview';
  }, [moduleInfo]);

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h1>{moduleInfo?.name || 'Listing Command Center'}</h1>
          <p className="header-subtitle">
            Orchestrate every listing task—from intake checklists to launch marketing—in one workspace.
          </p>
          <p className="header-meta">Status: {heroMeta}</p>
        </div>
      </header>

      <SectionCard title="Create or Import Listing" action={null}>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const payload = {
              address: {
                street1: form.street1.trim(),
                street2: form.street2.trim() || undefined,
                city: form.city.trim(),
                state: form.state.trim(),
                postalCode: form.postalCode.trim(),
                country: 'USA'
              },
              listPrice: safeNumber(form.listPrice),
              description: form.description.trim(),
              propertyDetails: {
                bedrooms: safeNumber(form.bedrooms),
                bathrooms: safeNumber(form.bathrooms),
                squareFeet: safeNumber(form.squareFeet)
              }
            };

            listingMutation.mutate(payload);
          }}
        >
          <label>
            Street address
            <input type="text" required value={form.street1} onChange={(event) => setForm((prev) => ({ ...prev, street1: event.target.value }))} />
          </label>
          <label>
            Address line 2
            <input type="text" value={form.street2} onChange={(event) => setForm((prev) => ({ ...prev, street2: event.target.value }))} />
          </label>
          <div className="form-row">
            <label>
              City
              <input type="text" required value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
            </label>
            <label>
              State
              <input type="text" required value={form.state} onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} />
            </label>
            <label>
              Postal code
              <input type="text" required value={form.postalCode} onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))} />
            </label>
          </div>
          <div className="form-row">
            <label>
              List price
              <input type="number" value={form.listPrice} onChange={(event) => setForm((prev) => ({ ...prev, listPrice: event.target.value }))} />
            </label>
            <label>
              Beds
              <input type="number" value={form.bedrooms} onChange={(event) => setForm((prev) => ({ ...prev, bedrooms: event.target.value }))} />
            </label>
            <label>
              Baths
              <input type="number" value={form.bathrooms} onChange={(event) => setForm((prev) => ({ ...prev, bathrooms: event.target.value }))} />
            </label>
            <label>
              Sq ft
              <input type="number" value={form.squareFeet} onChange={(event) => setForm((prev) => ({ ...prev, squareFeet: event.target.value }))} />
            </label>
          </div>
          <label>
            Description
            <textarea rows={3} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
          </label>
          {listingMutation.error ? <p className="form-error">{listingMutation.error.message}</p> : null}
          <button type="submit" className="primary-button" disabled={listingMutation.isPending}>
            {listingMutation.isPending ? 'Saving…' : 'Save listing'}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Portfolio" action={null}>
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
                    <td>{listing.address?.street1}, {listing.address?.city}</td>
                    <td>{listing.status}</td>
                    <td>{listing.listPrice ? `$${Number(listing.listPrice).toLocaleString()}` : '—'}</td>
                    <td>{formatDate(listing.updatedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() =>
                          copyMutation.mutate({
                            listingId: listing._id,
                            listingLabel: `${listing.address?.street1 || 'Listing'} ${listing.address?.city ? `• ${listing.address.city}` : ''}`.trim()
                          })
                        }
                        disabled={copyMutation.isPending && copyMutation.variables?.listingId === listing._id}
                      >
                        {copyMutation.isPending && copyMutation.variables?.listingId === listing._id ? 'Generating…' : 'Generate copy'}
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
            <div className="generated-copy__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  handleClipboard(
                    `${generatedCopy.copy.mlsDescription}\n\n${generatedCopy.copy.socialCaption}\n\n${generatedCopy.copy.emailSubject}\n${generatedCopy.copy.emailBody}`,
                    'All copy'
                  )
                }
              >
                Copy all content
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => handleClipboard(generatedCopy.copy.emailBody, 'Email body')}
              >
                Copy email body
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  messengerMutation.mutate({ listingId: generatedCopy.listingId, copy: generatedCopy.copy })
                }
                disabled={messengerMutation.isPending}
              >
                {messengerMutation.isPending ? 'Sending…' : 'Create messenger cadence'}
              </button>
            </div>
            {actionMessage ? <p className="action-message">{actionMessage}</p> : null}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Roadmap" action={null}>
        <ul>
          <li>Template library for contracts, disclosures, and compliance packets.</li>
          <li>Listing launch automations that coordinate messaging with Majic Messenger.</li>
          <li>Brokerage analytics for pipeline velocity and listing health.</li>
        </ul>
      </SectionCard>
    </div>
  );
}

export default ListingModulePage;
