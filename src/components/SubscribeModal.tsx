import { useMemo, useState } from 'react';
import type { Play } from '../lib/types';
import { daysAgo, fmtPct, fmtSince, startOfYear, today } from '../lib/format';
import { useAppState } from '../state/AppState';

interface Props {
  play: Play | null;
  onClose: () => void;
}

export default function SubscribeModal({ play, onClose }: Props) {
  const { subscribe } = useAppState();
  const [date, setDate] = useState<string>(today());

  if (!play) return null;

  const presets: { label: string; value: string }[] = [
    { label: 'Today', value: today() },
    { label: '30 days ago', value: daysAgo(30) },
    { label: '90 days ago', value: daysAgo(90) },
    { label: 'Start of year', value: startOfYear() },
    { label: 'Play inception', value: play.created },
  ];

  const preview = useMemo(() => {
    // Simple linear interpolation across the play's YTD value, scaled by
    // how far back the inception is. Real performance comes from the server
    // when Supabase is wired up.
    const days = Math.max(
      1,
      Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)
    );
    const ytd = play.performance.ytd ?? 0;
    const vsSpy = play.performance.vs_spy ?? 0;
    const factor = Math.min(1.2, days / 200);
    const playReturn = ytd * factor;
    const benchReturn = playReturn - vsSpy * factor;
    const alpha = playReturn - benchReturn;
    return {
      play: playReturn,
      bench: benchReturn,
      alpha,
    };
  }, [date, play]);

  const isBackdated =
    Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000) > 7;

  function confirm() {
    subscribe(play!.id, date);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Track {play.name}</h3>
        <p className="modal-sub">
          Choose when your tracking begins. We'll compute your personal return from that date,
          using adjusted closes. You can edit this later.
        </p>

        <div className="form-group">
          <label className="form-label">Inception preset</label>
          <div className="preset-row">
            {presets.map((p) => (
              <button
                key={p.label}
                className={`chip${date === p.value ? ' active' : ''}`}
                onClick={() => setDate(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Or pick a date</label>
          <input
            className="date-input"
            type="date"
            max={today()}
            min={play.created}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="perf-preview">
          <div className="perf-preview-label">Preview · since {fmtSince(date)}</div>
          <div className="perf-preview-grid">
            <div className="perf-preview-stat">
              <span className="label">Play</span>
              <span className={`value ${preview.play >= 0 ? 'pos' : 'neg'}`}>
                {fmtPct(preview.play)}
              </span>
            </div>
            <div className="perf-preview-stat">
              <span className="label">Benchmark</span>
              <span className={`value ${preview.bench >= 0 ? 'pos' : 'neg'}`}>
                {fmtPct(preview.bench)}
              </span>
            </div>
            <div className="perf-preview-stat">
              <span className="label">Alpha</span>
              <span className={`value ${preview.alpha >= 0 ? 'pos' : 'neg'}`}>
                {fmtPct(preview.alpha)}
              </span>
            </div>
          </div>
        </div>

        {isBackdated ? (
          <div className="disclaimer-note">
            Backdating earlier than 7 days creates a theoretical "since inception" line.
            It's marked clearly on your profile.
          </div>
        ) : null}

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={confirm}>
            Confirm subscription
          </button>
        </div>
      </div>
    </div>
  );
}
