function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function LinearProgress({ value, label }) {
  const v = clamp(value)
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.85 }}>
        <span>{label ?? 'Progress'}</span>
        <span>{v}%</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, border: '1px solid var(--border)', background: 'rgba(255,255,255,.03)', marginTop: 8 }}>
        <div
          style={{
            height: '100%',
            width: `${v}%`,
            borderRadius: 999,
            background: 'linear-gradient(90deg, rgba(124,58,237,.95), rgba(34,197,94,.75))',
          }}
        />
      </div>
    </div>
  )
}

export function CircularProgress({ value, label }) {
  const v = clamp(value)
  const size = 110
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (v / 100) * c

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,.10)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(124,58,237,.95)"
          strokeWidth={stroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div>
        <div style={{ fontWeight: 900, fontSize: 22 }}>{v}%</div>
        <div style={{ opacity: 0.75, fontSize: 13 }}>{label ?? 'Completion'}</div>
      </div>
    </div>
  )
}

