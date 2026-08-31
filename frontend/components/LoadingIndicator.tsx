export default function LoadingIndicator({ label, animate = true }: { label: string; animate?: boolean }) {
  const dotClass = animate ? 'loading-dot' : 'loading-dot loading-dot-static';
  return (
    <div className="loading-indicator">
      <span className={dotClass} />
      <span className={dotClass} />
      <span className={dotClass} />
      <span className="loading-label">{label}</span>
    </div>
  );
}
