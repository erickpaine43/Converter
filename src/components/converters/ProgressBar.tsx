interface Props {
  done: number;
  total: number;
  label: string;
}

export default function ProgressBar({ done, total, label }: Props) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">{label} ({done}/{total})</span>
    </div>
  );
}
