import { useState } from 'react';
import { useAppState } from '../state/AppState';
import { supabase } from '../lib/supabase';

interface Props {
  open: boolean;
  targetType: 'comment' | 'play' | 'user';
  targetId: string;
  targetLabel: string;
  onClose: () => void;
}

const REASONS: { value: string; label: string }[] = [
  { value: 'manipulation', label: 'Market manipulation / pump-and-dump' },
  { value: 'spam', label: 'Spam or low-effort content' },
  { value: 'harassment', label: 'Harassment or personal attack' },
  { value: 'misinformation', label: 'Misleading or factually wrong' },
  { value: 'inappropriate', label: 'Off-topic or inappropriate' },
  { value: 'other', label: 'Other' },
];

export default function ReportModal({
  open,
  targetType,
  targetId,
  targetLabel,
  onClose,
}: Props) {
  const { user, openAuthModal } = useAppState();
  const [reason, setReason] = useState(REASONS[0].value);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      onClose();
      openAuthModal();
      return;
    }
    if (!supabase) {
      setMsg('Reporting requires Supabase to be configured.');
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      note: note.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg('Thanks — your report was submitted. Our team will review it.');
    setNote('');
    setTimeout(onClose, 1400);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Report content</h3>
        <p className="modal-sub">{targetLabel}</p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <select
              className="select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <textarea
              className="textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything else the moderator should know?"
              maxLength={500}
              style={{ minHeight: 70 }}
            />
          </div>

          {msg ? <div className="disclaimer-note">{msg}</div> : null}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
