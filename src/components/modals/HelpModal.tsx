/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, X, Keyboard, ShieldCheck, Zap } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Guide rapide d'Animor</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 overflow-y-auto text-xs text-slate-300 pr-1">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Workflow en 1 minute
            </h4>
            <ol className="list-decimal pl-4 space-y-1 text-slate-300">
              <li>Déposez un fichier Excel/CSV ou collez vos données (Ctrl+V).</li>
              <li>Ajustez les valeurs directement dans le tableau si besoin.</li>
              <li>Appuyez sur ▶ Play pour visualiser l'animation.</li>
              <li>Personnalisez le mode (Barres, Classement, Bulles) et les couleurs.</li>
              <li>Exportez en SVG, PNG ou vidéo WebM !</li>
            </ol>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-indigo-400" />
              Raccourcis clavier
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Lecture / Pause</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold">Espace</kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Recommencer</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold">R</kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Reculer (-5%)</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold">←</kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Avancer (+5%)</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold">→</kbd>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Confidentialité & Offline-First
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Vos données restent strictement sur votre machine. Aucun fichier n'est téléversé sur un serveur distant. Animor est une Progressive Web App (PWA) fonctionnant sans connexion internet.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
