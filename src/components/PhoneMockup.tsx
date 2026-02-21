/**
 * iPhone Mockup Wrapper
 * Clean phone mockup without status bar
 */

import type { ReactNode } from 'react';

interface PhoneMockupProps {
  children: ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className="phone-container">
      <div className="phone-mockup">
        {/* Screen content */}
        <div className="phone-screen">
          {/* App content */}
          <div className="app-viewport">
            {children}
          </div>
        </div>
        
        {/* Home indicator */}
        <div className="home-indicator-container">
          <div className="home-indicator"></div>
        </div>
      </div>
    </div>
  );
}
