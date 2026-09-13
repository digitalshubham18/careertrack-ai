import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Plus, Power, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminJobSourceService } from '../services/adminJobSource.service';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import { timeAgo } from '../utils/format';

const TYPE_LABELS = { remotive: 'Remotive (public API)', greenhouse: 'Greenhouse job board', rss: 'RSS/JSON feed' };

export default function AdminJobSources() {
  const [sources, setSources] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'remotive', configText: '{}' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sourcesRes, logsRes] = await Promise.all([
        adminJobSourceService.list(),
        adminJobSourceService.logs(15),
      ]);
      setSources(sourcesRes.data.data.sources);
      setLogs(logsRes.data.data.logs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggleEnabled = async (source) => {
    try {
      await adminJobSourceService.update(source._id, { enabled: !source.enabled });
      toast.success(`${source.name} ${source.enabled ? 'disabled' : 'enabled'}`);
      fetchAll();
    } catch (err) {
      toast.error('Failed to update source');
    }
  };

  const handleDelete = async (source) => {
    if (!window.confirm(`Delete source "${source.name}"? This does not delete already-imported jobs.`)) return;
    await adminJobSourceService.remove(source._id);
    toast.success('Source deleted');
    fetchAll();
  };

  const handleSyncOne = async (source) => {
    setSyncingId(source._id);
    try {
      const res = await adminJobSourceService.syncOne(source._id);
      const r = res.data.data.result;
      toast.success(`Synced: ${r.fetched} fetched, ${r.created} new, ${r.updated} updated, ${r.duplicates} duplicates`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await adminJobSourceService.syncAll();
      toast.success('Sync completed for all enabled sources');
      fetchAll();
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    let config;
    try {
      config = JSON.parse(form.configText || '{}');
    } catch {
      return toast.error('Config must be valid JSON');
    }
    setCreating(true);
    try {
      await adminJobSourceService.create({ name: form.name, type: form.type, config });
      toast.success('Job source created');
      setShowCreate(false);
      setForm({ name: '', type: 'remotive', configText: '{}' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create source');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Job Sources</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">Manage automatic job discovery sources.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSyncAll} loading={syncingAll}>
            <RefreshCw size={15} /> Sync All Now
          </Button>
          <Button onClick={() => setShowCreate(true)}><Plus size={15} /> Add Source</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : sources.length === 0 ? (
        <EmptyState title="No job sources configured" description="Add a source to start automatically discovering jobs." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sources.map((source) => (
            <Card key={source._id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold">{source.name}</h3>
                  <p className="text-xs text-ink/50 dark:text-paper/50">{TYPE_LABELS[source.type] || source.type}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${source.enabled ? 'bg-accent/10 text-accent-dark dark:bg-accent/20 dark:text-accent-light' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                  {source.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink/60 dark:text-paper/60">
                <span>Last sync: {source.lastSyncAt ? timeAgo(source.lastSyncAt) : 'Never'}</span>
                <span>Fetched: <span className="font-data font-semibold">{source.jobsFetched}</span></span>
                <span>Created: <span className="font-data font-semibold text-accent-dark">{source.jobsCreated}</span></span>
                <span>Updated: <span className="font-data font-semibold">{source.jobsUpdated}</span></span>
                <span>Duplicates: <span className="font-data font-semibold">{source.duplicatesSkipped}</span></span>
                <span>Failed: <span className="font-data font-semibold text-danger">{source.jobsInvalid}</span></span>
              </div>

              {source.lastErrorMessage && (
                <p className="mt-3 rounded-lg bg-danger/10 p-2 text-xs text-danger">{source.lastErrorMessage}</p>
              )}

              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => handleSyncOne(source)} loading={syncingId === source._id}>
                  <RefreshCw size={13} /> Sync Now
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleToggleEnabled(source)}>
                  <Power size={13} /> {source.enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(source)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5">
        <h3 className="mb-3 font-display text-sm font-semibold">Recent Sync Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-paper-line text-xs uppercase tracking-wide text-ink/50 dark:border-ink-line dark:text-paper/50">
              <tr>
                <th className="py-2 pr-4 font-medium">Source</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Fetched</th>
                <th className="py-2 pr-4 font-medium">New</th>
                <th className="py-2 pr-4 font-medium">Updated</th>
                <th className="py-2 pr-4 font-medium">Duplicates</th>
                <th className="py-2 pr-4 font-medium">Duration</th>
                <th className="py-2 pr-4 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-b border-paper-line last:border-0 dark:border-ink-line">
                  <td className="py-2 pr-4">{log.source}</td>
                  <td className="py-2 pr-4">
                    <span className={log.status === 'success' ? 'text-accent-dark' : 'text-danger'}>{log.status}</span>
                  </td>
                  <td className="py-2 pr-4 font-data">{log.fetched}</td>
                  <td className="py-2 pr-4 font-data">{log.created}</td>
                  <td className="py-2 pr-4 font-data">{log.updated}</td>
                  <td className="py-2 pr-4 font-data">{log.duplicates}</td>
                  <td className="py-2 pr-4 font-data">{(log.durationMs / 1000).toFixed(1)}s</td>
                  <td className="py-2 pr-4 text-ink/60 dark:text-paper/60">{timeAgo(log.createdAt)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-ink/50 dark:text-paper/50">No syncs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Job Source">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Select label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="remotive">Remotive (public API, no config needed)</option>
            <option value="greenhouse">Greenhouse job board (needs boardToken + companyName)</option>
            <option value="rss">RSS/JSON feed (needs feedUrl)</option>
          </Select>
          <Input
            label="Config (JSON)"
            textarea
            rows={4}
            value={form.configText}
            onChange={(e) => setForm((f) => ({ ...f, configText: e.target.value }))}
            placeholder='e.g. {"boardToken": "acme", "companyName": "Acme Inc"}'
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create source</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
