/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from './useOnlineStatus.ts';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600/90 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white shadow-xl border border-amber-400/40 animate-pulse">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Mode hors-ligne — Animor fonctionne localement</span>
    </div>
  );
};
