/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { X, Clipboard, CheckCircle, AlertTriangle } from 'lucide-react';
import { parseCsv } from '../../core/data/parsers/csvParser.ts';
import { validateRawData } from '../../core/data/validator.ts';
import { normalizeRawData } from '../../core/data/normalizer.ts';
import { Dataset } from '../../models/Dataset.ts';

interface PasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDataset: (dataset: Dataset) => void;
}

export const PasteModal: React.FC<PasteModalProps> = ({ isOpen, onClose, onApplyDataset }) => {
  const [pasteContent, setPasteContent] = useState('');

  const parsedAnalysis = useMemo(() => {
    if (!pasteContent.trim()) {
      return null;
    }
    const raw = parseCsv(pasteContent);
    const validation = validateRawData(raw);
    return { raw, validation };
  }, [pasteContent]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!parsedAnalysis || !parsedAnalysis.validation.isValid) return;
    const dataset = normalizeRawData(parsedAnalysis.raw);
    onApplyDataset(dataset);
    setPasteContent('');
    onClose();
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPasteContent(text);
      }
    } catch {
      // Clipboard API might be restricted by browser permissions
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Coller des données depuis Excel ou CSV</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-3 overflow-y-auto">
          <p className="text-xs text-slate-300">
            Copiez des cellules depuis Excel ou un fichier texte (séparées par tabulations, virgules ou points-virgules) puis collez-les ci-dessous.
          </p>

          <div className="relative">
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder={`Pays\tValeur\nFrance\t82\nAllemagne\t76\nItalie\t63\nEspagne\t58`}
              rows={6}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
            {navigator.clipboard && (
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 border border-slate-700 transition"
              >
                Coller du presse-papier
              </button>
            )}
          </div>

          {/* Validation & Preview */}
          {parsedAnalysis && (
            <div className="rounded-xl p-3 bg-slate-950/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold">
                {parsedAnalysis.validation.isValid ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">
                      Données valides : {parsedAnalysis.raw.rows.length} lignes détectées
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-300">Données non conformes V1</span>
                  </>
                )}
              </div>

              {parsedAnalysis.validation.issues.length > 0 && (
                <ul className="space-y-1 text-[11px] text-slate-300 pl-4 list-disc">
                  {parsedAnalysis.validation.issues.map((issue, idx) => (
                    <li
                      key={idx}
                      className={issue.type === 'error' ? 'text-rose-300' : 'text-amber-300'}
                    >
                      {issue.message}
                    </li>
                  ))}
                </ul>
              )}

              {/* Mini preview table */}
              {parsedAnalysis.raw.headers.length === 2 && (
                <div className="max-h-32 overflow-y-auto rounded border border-slate-800 text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800 text-slate-200 font-semibold sticky top-0">
                      <tr>
                        <th className="p-1.5">{parsedAnalysis.raw.headers[0]}</th>
                        <th className="p-1.5 text-right">{parsedAnalysis.raw.headers[1]}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                      {parsedAnalysis.raw.rows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="p-1.5">{String(r[0] ?? '')}</td>
                          <td className="p-1.5 text-right">{String(r[1] ?? '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleApply}
            disabled={!parsedAnalysis || !parsedAnalysis.validation.isValid}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md transition"
          >
            Appliquer au projet
          </button>
        </div>
      </div>
    </div>
  );
};
