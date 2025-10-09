import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';
import { useAuthContext } from '../context/AuthContext.jsx';

const categories = [
  { value: 'listing', label: 'Listing' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'other', label: 'Other' }
];

function ArtifactUploader() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();

  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('listing');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const artifactMutation = useMutation({
    mutationFn: async (payload) =>
      apiFetch('/api/artifacts', { token, method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artifacts'] });
      setFile(null);
      setTags('');
      setCategory('listing');
    }
  });

  const handleFileChange = (event) => {
    setError(null);
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.size > 200 * 1024 * 1024) {
      setError('Files must be smaller than 200MB');
      return;
    }

    setFile(selected);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Select a file before uploading');
      return;
    }

    try {
      setError(null);
      setUploading(true);

      const normalizedTags = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const signPayload = {
        fileName: file.name,
        fileType: file.type || 'application/octet-stream'
      };

      const { key, uploadUrl } = await apiFetch('/api/artifacts/sign-upload', {
        token,
        method: 'POST',
        body: signPayload
      });

      const putResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });

      if (!putResponse.ok) {
        throw new Error('Upload to storage failed');
      }
      setError(null);

      await artifactMutation.mutateAsync({
        key,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        category,
        tags: normalizedTags
      });
    } catch (err) {
      console.error('Artifact upload error:', err);
      setError(err.message || 'Artifact upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="artifact-uploader" onSubmit={handleUpload}>
      <label className="artifact-input">
        <span>Choose file</span>
        <input type="file" onChange={handleFileChange} />
      </label>

      <label>
        Category
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Tags
        <input
          type="text"
          placeholder="comma separated"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
      </label>

      <button type="submit" className="primary-button" disabled={uploading || artifactMutation.isPending}>
        {uploading || artifactMutation.isPending ? 'Uploading…' : 'Upload artifact'}
      </button>

      <div className="artifact-status">
        {file ? <span>{file.name}</span> : <span>No file selected</span>}
        {error ? <span className="form-error">{error}</span> : null}
      </div>
    </form>
  );
}

export default ArtifactUploader;
