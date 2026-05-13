import { useCallback, useEffect, useState } from 'react';
import { useAppState } from '../state/AppState';
import { supabase } from '../lib/supabase';
import { fmtRelative } from '../lib/format';

interface ReportRow {
  id: string;
  target_type: 'comment' | 'play' | 'user';
  target_id: string;
  reason: string;
  note: string | null;
  status: 'pending' | 'dismissed' | 'actioned_hide' | 'actioned_strike';
  created_at: string;
  reporter: { handle: string; display_name: string } | null;
}

export default function AdminReports() {
  const { user } = useAppState();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    let q = supabase
      .from('reports')
      .select(
        'id, target_type, target_id, reason, note, status, created_at, reporter:profiles!reports_reporter_id_fkey(handle, display_name)'
      )
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter === 'pending') q = q.eq('status', 'pending');
    const { data, error: err } = await q;
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setReports((data ?? []) as unknown as ReportRow[]);
    setError(null);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(
    id: string,
    next: ReportRow['status']
  ) {
    if (!supabase || !user) return;
    const { error: err } = await supabase
      .from('reports')
      .update({
        status: next,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (err) {
      setError(err.message);
      return;
    }
    // If hiding the target comment, also update its visibility.
    const report = reports.find((r) => r.id === id);
    if (report && next === 'actioned_hide' && report.target_type === 'comment') {
      await supabase
        .from('discussion_items')
        .update({ visibility: 'hidden_by_admin' })
        .eq('id', report.target_id);
    }
    load();
  }

  if (!user) {
    return <div className="empty-state">Sign in required.</div>;
  }

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>Moderation</h1>
          <p className="subtitle">
            Pending reports across the site. Dismiss false positives, hide comments that
            violate the Terms, or add a strike for repeat offenders.
          </p>
        </div>
      </div>

      <div className="controls-row">
        <button
          className={`chip${filter === 'pending' ? ' active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`chip${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
      </div>

      {error ? <div className="disclaimer-note">{error}</div> : null}

      {loading ? (
        <div className="loading">Loading reports…</div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          {filter === 'pending'
            ? 'No pending reports. Nothing to do.'
            : 'No reports yet.'}
        </div>
      ) : (
        <div className="discussion-items">
          {reports.map((r) => (
            <div key={r.id} className="disc-item">
              <div className="vote-col">
                <span
                  className="disc-type-pill"
                  style={{
                    background:
                      r.status === 'pending' ? 'var(--neon-dim)' : 'var(--panel-2)',
                    color:
                      r.status === 'pending' ? 'var(--neon)' : 'var(--muted)',
                  }}
                >
                  {r.status === 'pending' ? '!' : '✓'}
                </span>
              </div>
              <div className="disc-body">
                <div className="disc-meta">
                  <span className="author">{r.reason}</span>
                  <span>· {r.target_type} · {r.target_id.slice(0, 8)}…</span>
                  <span>· {fmtRelative(r.created_at)}</span>
                  <span style={{ color: 'var(--muted-2)' }}>
                    by @{r.reporter?.handle ?? 'unknown'}
                  </span>
                </div>
                {r.note ? <div className="disc-text">{r.note}</div> : null}
                <div className="disc-actions">
                  {r.status === 'pending' ? (
                    <>
                      <a onClick={() => setStatus(r.id, 'dismissed')}>Dismiss</a>
                      <a onClick={() => setStatus(r.id, 'actioned_hide')}>
                        Hide content
                      </a>
                      <a onClick={() => setStatus(r.id, 'actioned_strike')}>
                        Strike + hide
                      </a>
                    </>
                  ) : (
                    <span style={{ color: 'var(--muted-2)' }}>
                      Resolved: {r.status.replace('actioned_', '')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
