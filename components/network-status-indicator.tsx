
'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function NetworkStatusIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Check initial status
    if (typeof window.navigator.onLine !== 'undefined') {
        setIsOffline(!window.navigator.onLine);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 text-white text-center p-2 text-sm flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span>אתה עובד כרגע במצב לא מקוון. השינויים יישמרו ויסונכרנו כשתתחבר מחדש.</span>
    </div>
  );
}
