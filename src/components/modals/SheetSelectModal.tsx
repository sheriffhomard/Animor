/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileSpreadsheet, X } from 'lucide-react';

interface SheetSelectModalProps {
  isOpen: boolean;
  sheets: string[];
  onSelectSheet: (sheetName: string) => void;
  onClose: () => void;
}

export const SheetSelectModal: React.FC<SheetSelectModalProps> = ({
  isOpen,
  sheets,
  onSelectSheet,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Sélectionner une feuille Excel</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-300">
          Ce classeur comporte plusieurs feuilles. Choisissez la feuille à importer :
        </p>

        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
          {sheets.map((sheet) => (
            <button
              key={sheet}
              onClick={() => onSelectSheet(sheet)}
              className="w-full text-left px-3 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600/20 hover:border-indigo-500/50 border border-slate-700/70 text-xs font-semibold text-slate-200 transition flex items-center justify-between group"
            >
              <span>{sheet}</span>
              <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 font-mono">
                Choisir →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
