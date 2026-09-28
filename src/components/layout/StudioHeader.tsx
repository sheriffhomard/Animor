/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, FolderOpen, Play, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton.tsx';

interface StudioHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  onOpenProjects: () => void;
  onOpenExport: () => void;
  onOpenHelp: () => void;
  onResetSample: () => void;
  rowCount: number;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  title,
  onTitleChange,
  onOpenProjects,
  onOpenExport,
  onOpenHelp,
  onResetSample,
  rowCount,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Play className="w-4 h-4 text-indigo-400 fill-indigo-400 ml-0.5" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
                Animor
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Studio V1
              </span>
            </div>
          </div>
        </div>

        <div className="hidden sm:block h-4 w-px bg-slate-800 mx-1" />

        {/* Title Input */}
        <div className="relative group max-w-xs sm:max-w-sm">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent hover:bg-slate-900 focus:bg-slate-900 border border-transparent hover:border-slate-800 focus:border-indigo-500/50 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition truncate w-48 sm:w-64"
            title="Cliquez pour renommer le projet"
          />
        </div>
      </div>

      {/* Center Data Status Pill */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3 py-1 rounded-full">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Données prêtes : <strong className="text-slate-200">{rowCount}/10 lignes</strong></span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onResetSample}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition"
          title="Charger l'exemple par défaut"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Exemple</span>
        </button>

        <button
          onClick={onOpenProjects}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition"
          title="Projets sauvegardés (IndexedDB)"
        >
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Mes projets</span>
        </button>

        <PWAInstallButton />

        <button
          onClick={onOpenHelp}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          title="Guide & Raccourcis"
          aria-label="Guide et Raccourcis"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter</span>
        </button>
      </div>
    </header>
  );
};
