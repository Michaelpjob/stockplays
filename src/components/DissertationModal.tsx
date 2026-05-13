import { useState } from 'react';
import { useAppState } from '../state/AppState';
import { supabase } from '../lib/supabase';
import type { DiscussionItem, Play } from '../lib/types';

interface Props {
  open: boolean;
  play: Play | null;
  onClose: () => void;
  onPosted: (item: DiscussionItem) => void;
}

export default function DissertationModal({ open, play, onClose, onPosted }: Props) {
  const { user, isSignedIn, profileNeedsSetup, openAuthModal } = useAppState();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open || !play) return null;

  if (!isSignedIn || profileNeedsSetup) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>Write a dissertation</h3>
          <p className="modal-sub">
            {!isSignedIn
              ? 'Sign in to post a long-form take on this play.'
              : 'Finish setting up your profile (pick a handle) before posting a dissertation.'}
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                if (!isSignedIn) openAuthModal();
              }}
            >
              {!isSignedIn ? 'Sign in' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !supabase) return;
    setErr(null);
    const t = title.trim();
    const b = body.trim();
    if (t.length < 6) {
      setErr('Title needs at least 6 characters.');
      return;
    }
    if (b.length < 40) {
      setErr('A dissertation should be at least 40 characters. Make the case.');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from('discussion_items')
      .insert({
        play_id: play!.id,
        author_id: user.id,
        type: 'dissertation',
        title: t,
        body: b,
      })
      .select(
        'id, type, title, body, pinned, upvotes, downvotes, reply_count, created_at'
      )
      .single();
    setSubmitting(false);
    if (error) {
      setErr(error.message);
      return;
    }
    onPosted({
      id: data.id,
      type: 'dissertation',
      author: user.handle,
      authorDisplay: user.displayName,
      title: t,
      pinned: false,
      body: b,
      date: data.created_at,
      upvotes: 0,
      downvotes: 0,
      replies: 0,
    });
    setTitle('');
    setBody('');
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720 }}
      >
        <h3>Dissertation on {play.name}</h3>
        <p className="modal-sub">
          Long-form takes get a dedicated card at the top of the discussion. Be specific,
          falsifiable, and grounded.
        </p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Reconsidering NVDA share durability"
              maxLength={140}
            />
            <div className="tip">{title.length} / 140</div>
          </div>

          <div className="form-group">
            <label className="form-label">Body</label>
            <textarea
              className="textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Lay out the argument. Cite specifics. State what would change your mind."
              style={{ minHeight: 220, lineHeight: 1.65 }}
              maxLength={4000}
            />
            <div className="tip">
              {body.length} / 4000 · plain text for now, markdown support coming later
            </div>
          </div>

          {err ? <div className="disclaimer-note">{err}</div> : null}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Publishing…' : 'Publish dissertation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
