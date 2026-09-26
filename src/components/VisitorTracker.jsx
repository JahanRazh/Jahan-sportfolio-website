'use client';

import { useEffect } from 'react';
import { recordPortfolioVisit } from '../lib/firestore';

export default function VisitorTracker() {
  useEffect(() => {
    // Only execute on browser client
    if (typeof window !== 'undefined') {
      recordPortfolioVisit();
    }
  }, []);

  return null;
}
