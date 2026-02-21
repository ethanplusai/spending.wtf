/**
 * LoadingCard — Skeleton loading states
 */

interface LoadingCardProps {
  variant?: 'row' | 'chart' | 'full';
  count?: number;
}

export function LoadingCard({ variant = 'row', count = 3 }: LoadingCardProps) {
  if (variant === 'chart') {
    return (
      <div className="card loading-card loading-chart">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-chart" />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="card loading-card loading-full">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text short" />
        <div className="skeleton skeleton-chart" />
      </div>
    );
  }

  return (
    <div className="card loading-card">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`loading-row ${i < count - 1 ? 'border-b' : ''}`}>
          <div className="skeleton skeleton-icon" />
          <div className="loading-row-text">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text short" />
          </div>
          <div className="skeleton skeleton-value" />
        </div>
      ))}
    </div>
  );
}
