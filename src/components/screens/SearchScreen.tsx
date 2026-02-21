/**
 * Search Screen — Search federal awards via USAspending API
 */

import { useState, useEffect, useRef } from 'react';
import { SubScreenHeader } from '../SubScreenHeader';
import { LoadingCard } from '../LoadingCard';
import { useDebounce } from '../../hooks/useDebounce';
import { searchAwards } from '../../services/usaspending';
import { formatCurrency } from '../../utils/format';
import type { AwardSearchResult } from '../../types';

interface SearchScreenProps {
  onBack: () => void;
}

type AwardFilter = 'all' | 'contracts' | 'grants' | 'loans';

const FILTER_MAP: Record<AwardFilter, string | undefined> = {
  all: undefined,
  contracts: 'A',
  grants: '02',
  loans: '07',
};

const SUGGESTIONS = [
  'defense contracts',
  'healthcare grants',
  'infrastructure',
  'NASA',
  'education funding',
  'cybersecurity',
];

export function SearchScreen({ onBack }: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AwardFilter>('all');
  const [results, setResults] = useState<AwardSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search on debounced query change
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setHasSearched(true);

    searchAwards(debouncedQuery, {
      awardType: FILTER_MAP[filter],
    }).then(data => {
      if (!cancelled) {
        setResults(data);
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [debouncedQuery, filter]);

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <div className="screen sub-screen search-screen">
      <SubScreenHeader title="Search Awards" onBack={onBack} />
      <div className="screen-content">
        {/* Search input */}
        <div className="search-input-wrap">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search federal awards..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')}>
              <ClearIcon />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="filter-chips">
          {(['all', 'contracts', 'grants', 'loans'] as const).map(f => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading && <LoadingCard count={4} />}

        {!isLoading && results.length > 0 && (
          <div className="search-results">
            <span className="section-title" style={{ margin: '0 0 8px', display: 'block' }}>
              {results.length} RESULTS
            </span>
            {results.map((award, i) => (
              <div key={award.internal_id || i} className="card search-result-card">
                <div className="result-header">
                  <span className="result-amount">{formatCurrency(award.Award_Amount)}</span>
                  <span className="result-type">{award.Award_Type || 'Award'}</span>
                </div>
                <p className="result-description">{award.Description}</p>
                <div className="result-meta">
                  <span className="result-recipient">{award.Recipient}</span>
                  <span className="result-agency">{award.Awarding_Agency}</span>
                </div>
                {award.Start_Date && (
                  <span className="result-date">{award.Start_Date}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && hasSearched && results.length === 0 && (
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>
              No awards found for "{query}"
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Try a different search term or filter
            </p>
          </div>
        )}

        {/* Suggestions (when empty) */}
        {!query && !hasSearched && (
          <div style={{ marginTop: '12px' }}>
            <span className="section-title" style={{ display: 'block', marginBottom: '8px' }}>Suggestions</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className="filter-chip"
                  onClick={() => handleSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
