export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
      <div
        aria-label="loading"
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          border: '2px solid rgba(255,255,255,.25)',
          borderTopColor: 'rgba(124,58,237,.9)',
          animation: 'rc-spin 1s linear infinite',
        }}
      />
      <div style={{ fontSize: 14, opacity: 0.8 }}>{label}</div>
      <style>
        {`@keyframes rc-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}
      </style>
    </div>
  )
}

