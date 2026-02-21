/**
 * SubScreenHeader — Back arrow + title for all sub-screens
 */

interface SubScreenHeaderProps {
  title: string;
  onBack: () => void;
}

export function SubScreenHeader({ title, onBack }: SubScreenHeaderProps) {
  return (
    <header className="sub-screen-header">
      <button className="back-btn" onClick={onBack} aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h1 className="sub-screen-title">{title}</h1>
    </header>
  );
}
