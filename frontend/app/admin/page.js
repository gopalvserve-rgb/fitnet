'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const STATUSES = ['new', 'contacted', 'booked', 'closed'];
const DEST = { 'jim-corbett': 'Jim Corbett', 'delhi-ncr': 'Delhi NCR', undecided: 'Undecided' };

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const call = useCallback(async (url, opts = {}) => {
    const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts.headers } });
    if (res.status === 401) {
      router.replace('/admin/login');
      throw new Error('unauthorised');
    }
    if (!res.ok && res.status !== 204) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
    return res.status === 204 ? null : res.json();
  }, [router]);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: '20', ...(filter && { status: filter }) });
      setData(await call(`/api/admin/enquiries?${qs}`));
      setError('');
    } catch (e) {
      if (e.message !== 'unauthorised') setError(e.message);
    }
  }, [call, filter, page]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id, status) {
    await call(`/api/admin/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }).catch((e) => setError(e.message));
    load();
  }
  async function remove(id) {
    if (!window.confirm('Delete this enquiry permanently?')) return;
    await call(`/api/admin/enquiries/${id}`, { method: 'DELETE' }).catch((e) => setError(e.message));
    load();
  }
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    router.replace('/admin/login');
  }

  const stats = data?.stats || {};
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="container admin">
      <div className="admin__bar">
        <div><span className="eyebrow">Dashboard</span><h1 style={{ fontSize: '2.6rem', margin: 0 }}>Wedding Enquiries</h1></div>
        <button className="btn btn--outline btn--sm" onClick={logout}>Log out</button>
      </div>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      <div className="admin__stats">
        {STATUSES.map((s) => (
          <div className="admin__stat" key={s} data-testid={`stat-${s}`}><b>{stats[s] || 0}</b><span>{s}</span></div>
        ))}
      </div>
      <div className="tabs" style={{ justifyContent: 'flex-start', marginBottom: 20 }}>
        {['', ...STATUSES].map((s) => (
          <button key={s || 'all'} className={`btn btn--sm ${filter === s ? '' : 'btn--outline'}`} onClick={() => { setFilter(s); setPage(1); }}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Received</th><th>Couple</th><th>Contact</th><th>Wedding</th><th>Message</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {!data && <tr><td colSpan={7}>Loading…</td></tr>}
            {data?.items.length === 0 && <tr><td colSpan={7}>No enquiries yet.</td></tr>}
            {data?.items.map((e) => (
              <tr key={e.id} data-testid="enquiry-row">
                <td>{new Date(`${e.created_at}Z`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                <td><strong>{e.name}</strong></td>
                <td>{e.email}<br />{e.phone}</td>
                <td>{DEST[e.destination]}<br />{e.wedding_date || 'Date TBD'} · {e.guests ? `${e.guests} guests` : '—'}<br />{e.budget || ''}</td>
                <td><div className="msg">{e.message}</div></td>
                <td>
                  <select aria-label={`Status for ${e.name}`} value={e.status} onChange={(ev) => setStatus(e.id, ev.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td><button className="link-btn" onClick={() => remove(e.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>Page {page} of {pages}</span>
        <button className="btn btn--outline btn--sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
