interface Props {
  trend?: 'up' | 'down';
  values?: number[];
}

export default function Sparkline({ trend = 'up', values }: Props) {
  const data = values ?? defaultSeries(trend);
  const W = 320;
  const H = 64;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(1, max - min);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / span) * (H - 4) - 2;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = trend === 'up' ? 'var(--gain)' : 'var(--loss)';

  return (
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <path d={points.join(' ')} stroke={stroke} fill="none" strokeWidth={1.5} />
    </svg>
  );
}

function defaultSeries(trend: 'up' | 'down') {
  const slope = trend === 'up' ? 1 : -1;
  return Array.from({ length: 60 }, (_, i) => {
    const wave = Math.sin(i / 6) * 4 + Math.cos(i / 11) * 2;
    return 50 + (i / 60) * 30 * slope + wave;
  });
}
