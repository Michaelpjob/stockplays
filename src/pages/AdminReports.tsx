import { useCallback, useEffect, useState } from 'react';
import { useAppState } from '../state/AppState';
import { supabase } from '../lib/supabase';
import { fmtRelative } from '../lib/format';
import { usePageTitle } from '../lib/usePageTitle';

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

interface CommentDetail {
  id: string;
  type: 'comment' | 'dissertation';
  body: string;
  title: string | null;
  visibility: string;
  author: { handle: string; display_name: string } | null;
  play: { slug: string; name: string } | null;
}

export default function AdminReports() {
  const { user } = useAppState();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [details, setDetails] = useState<Record<string, CommentDetail>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [error, setError] = useState<string | null>(null);

  usePageTitle('Reports');

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
    const rows = (data ?? []) as unknown as ReportRow[];
    setReports(rows);
    setError(null);

    const commentIds = rows
      .filter((r) => r.target_type === 'comment')
      .map((r) => r.target_id);
    if (commentIds.length > 0) {
      const { data: comments } = await supabase
        .from('discussion_items')
        .select(
          'id, type, body, title, visibility, author:profiles!discussion_items_author_id_fkey(handle, display_name), play:plays!discussion_items_play_id_fkey(slug, name)'
        )
        .in('id', commentIds);
      const m: Record<string, CommentDetail> = {};
      for (const c of (comments ?? []) as unknown as CommentDetail[]) {
        m[c.id] = c;
      }
      setDetails(m);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, next: ReportRow['status']) {
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
  if (user.role !== 'admin') {
    return (
      <div className="empty-state">
        This is the admin reports queue. You don't have access.
      </div>
    );
  }

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>Moderation</h1>
          <p className="subtitle">
            Pending reports across the site. Dismiss false positives, hide content that
            violates the Terms, or add a strike for repeat offenders. Three substantiated
            strikes auto-suspends the user for 30 days.
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
          {filter === 'pending' ? 'No pending reports.' : 'No reports yet.'}
        </div>
      ) : (
        <div className="discussion-items">
          {reports.map((r) => {
            const detail = r.target_type === 'comment' ? details[r.target_id] : null;
            return (
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
                    <span style={{ color: 'var(--muted-2)' }}>
                      · {r.target_type}
                    </span>
                    <span>· {fmtRelative(r.created_at)}</span>
                    <span style={{ color: 'var(--muted-2)' }}>
                      by @{r.reporter?.handle ?? 'unknown'}
                    </span>
                  </div>

                  {detail ? (
                    <div
                      style={{
                        background: 'var(--panel-2)',
                        borderLeft: '2px solid var(--border-strong)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-s)',
                        margin: '8px 0',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--muted-2)',
                          marginBottom: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 600,
                        }}
                      >
                        {detail.type} by @{detail.author?.handle ?? 'unknown'} on{' '}
                        {detail.play?.name ?? '?'}
                        {detail.visibility !== 'visible' ? (
                          <span style={{ color: 'var(--loss)' }}>
                            {' '}
                            · already {detail.visibility.replace('hidden_by_', 'hidden by ')}
                          </span>
                        ) : null}
                      </div>
                      {detail.title ? (
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            marginBottom: 4,
                          }}
                        >
                          {detail.title}
                        </div>
                      ) : null}
                      <div className="disc-text" style={{ whiteSpace: 'pre-line' }}>
                        {detail.body}
                      </div>
                    </div>
                  ) : r.target_type === 'comment' ? (
                    <div className="tip">Loading reported content…</div>
                  ) : null}

                  {r.note ? (
                    <div className="disc-text" style={{ fontStyle: 'italic' }}>
                      Reporter's note: {r.note}
                    </div>
                  ) : null}

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
            );
          })}
        </div>
      )}
    </>
  );
}
