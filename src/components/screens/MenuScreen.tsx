/**
 * Menu Screen - Info, Navigation, and Sources
 * All menu items now functional
 */

import { useState } from 'react';
import type { SubScreen } from '../../types';

interface MenuScreenProps {
  data: {
    lastUpdated: string;
    dataSource: string;
  };
  onNavigate?: (subScreen: SubScreen) => void;
  onRefresh?: () => void;
}

export function MenuScreen({ data, onNavigate, onRefresh }: MenuScreenProps) {
  const [lastUpdated, setLastUpdated] = useState(data.lastUpdated);
  const [shareMsg, setShareMsg] = useState('');

  const handleRefresh = () => {
    onRefresh?.();
    setLastUpdated(new Date().toLocaleDateString());
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'spending.wtf',
      text: 'Track U.S. federal spending, programs, and national debt in real time.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShareMsg('Link copied!');
        setTimeout(() => setShareMsg(''), 2000);
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className="screen menu-screen">
      <header className="screen-header">
        <h1 className="header-title">More</h1>
      </header>

      <div className="screen-content">
        {/* App Info Card */}
        <div className="card profile-card">
          <div className="profile-avatar gov-avatar">
            <span className="avatar-text">🏛️</span>
          </div>
          <div className="profile-info">
            <h2 className="profile-name">spending.wtf</h2>
            <p className="profile-email">Federal Spending Dashboard</p>
          </div>
        </div>

        {/* Data Status */}
        <div className="card premium-card gov-premium">
          <div className="premium-badge">
            <LiveIcon />
            <span>Live Data</span>
          </div>
          <p className="premium-text">Last updated: {lastUpdated}</p>
          <button className="btn btn-white btn-sm" onClick={handleRefresh}>Refresh</button>
        </div>

        {/* Explore */}
        <div className="section">
          <span className="section-title">Explore</span>
          <div className="card menu-list">
            <MenuItem icon={<SearchNavIcon />} label="Search" onClick={() => onNavigate?.('search')} />
            <MenuItem icon={<StoryIcon />} label="The Story" badge="New" onClick={() => onNavigate?.('journey')} />
            <MenuItem icon={<HistoryIcon />} label="Historical Data" onClick={() => onNavigate?.('historical')} />
            <MenuItem icon={<CompareIcon />} label="Compare Years" onClick={() => onNavigate?.('compare-years')} />
            <MenuItem icon={<AgencyIcon />} label="By Agency" onClick={() => onNavigate?.('agency-list')} />
            <MenuItem icon={<StateIcon />} label="By State" onClick={() => onNavigate?.('state-list')} />
            <MenuItem icon={<TreemapNavIcon />} label="Spending Treemap" onClick={() => onNavigate?.('spending-treemap')} />
            <MenuItem icon={<RevVsSpendIcon />} label="Revenue vs Spending" onClick={() => onNavigate?.('revenue-vs-spending')} />
            <MenuItem icon={<InterestNavIcon />} label="Interest Rates" onClick={() => onNavigate?.('interest-rates')} />
          </div>
        </div>

        {/* Data Sources */}
        <div className="section">
          <span className="section-title">Data Sources</span>
          <div className="card menu-list">
            <MenuItem
              icon={<SourceIcon />}
              label="USAspending.gov"
              badge="Primary"
              external
              onClick={() => handleExternalLink('https://www.usaspending.gov')}
            />
            <MenuItem icon={<SourceIcon />} label="Treasury.gov" external onClick={() => handleExternalLink('https://fiscaldata.treasury.gov')} />
            <MenuItem icon={<SourceIcon />} label="CBO.gov" external onClick={() => handleExternalLink('https://www.cbo.gov')} />
            <MenuItem icon={<SourceIcon />} label="BLS.gov" external onClick={() => handleExternalLink('https://www.bls.gov')} />
          </div>
        </div>

        {/* About */}
        <div className="section">
          <span className="section-title">About</span>
          <div className="card menu-list">
            <MenuItem icon={<InfoIcon />} label="How We Calculate" onClick={() => onNavigate?.('methodology')} />
            <MenuItem icon={<MethodIcon />} label="Methodology" onClick={() => onNavigate?.('methodology')} />
            <MenuItem icon={<FeedbackIcon />} label="Send Feedback" onClick={() => window.location.href = 'mailto:feedback@spending.wtf?subject=Feedback'} />
            <MenuItem icon={<ShareIcon />} label={shareMsg || 'Share App'} onClick={handleShare} />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="card disclaimer-card">
          <p className="disclaimer-text">
            Data is sourced from official U.S. government websites.
            This app provides estimates and may not reflect real-time changes.
            Not affiliated with any government agency.
          </p>
        </div>
      </div>
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  external?: boolean;
  onClick?: () => void;
}

function MenuItem({ icon, label, badge, external, onClick }: MenuItemProps) {
  return (
    <div className="menu-item clickable" onClick={onClick}>
      <div className="menu-item-info">
        <span className="menu-item-icon">{icon}</span>
        <span className="menu-item-label">{label}</span>
        {badge && <span className="menu-item-badge">{badge}</span>}
      </div>
      {external ? <ExternalLinkIcon /> : <ChevronIcon />}
    </div>
  );
}

// Icons
function ChevronIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>; }
function ExternalLinkIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>; }
function LiveIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function HistoryIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function CompareIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>; }
function AgencyIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" /></svg>; }
function StateIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>; }
function SourceIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>; }
function InfoIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>; }
function MethodIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>; }
function FeedbackIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>; }
function ShareIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>; }
function TreemapNavIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>; }
function RevVsSpendIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>; }
function InterestNavIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>; }
function SearchNavIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function StoryIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>; }
