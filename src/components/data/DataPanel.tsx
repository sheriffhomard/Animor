/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  UploadCloud,
  AlertTriangle,
  RotateCcw,
  Clipboard,
  Info,
} from 'lucide-react';
import { Dataset, DataRow, ValidationResult } from '../../models/Dataset.ts';
import { parseCsv } from '../../core/data/parsers/csvParser.ts';
import { inspectExcelBuffer, parseExcelSheet } from '../../core/data/parsers/excelParser.ts';
import { validateRawData } from '../../core/data/validator.ts';
import { datasetToRaw, normalizeRawData } from '../../core/data/normalizer.ts';
import { SheetSelectModal } from '../modals/SheetSelectModal.tsx';
import * as XLSX from 'xlsx';

interface DataPanelProps {
  dataset: Dataset;
  onDatasetChange: (newDataset: Dataset) => void;
  onOpenPasteModal: () => void;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  dataset,
  onDatasetChange,
  onOpenPasteModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Multi-sheet Excel state
  const [pendingWorkbook, setPendingWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  // Validate current dataset state
  const validation: ValidationResult = React.useMemo(() => {
    return validateRawData(datasetToRaw(dataset));
  }, [dataset]);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
        const text = await file.text();
        const raw = parseCsv(text);
        const valRes = validateRawData(raw);

        if (!valRes.isValid) {
          const firstErr = valRes.issues.find((i) => i.type === 'error')?.message;
          setErrorMessage(firstErr || 'Fichier CSV incompatible avec les critères V1.');
          return;
        }

        const normalized = normalizeRawData(raw);
        onDatasetChange(normalized);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const info = inspectExcelBuffer(buffer);

        if (info.sheetNames.length > 1) {
          setPendingWorkbook(info.workbook);
          setSheetNames(info.sheetNames);
          setIsSheetModalOpen(true);
        } else {
          const raw = parseExcelSheet(info.workbook, info.sheetNames[0]);
          const valRes = validateRawData(raw);

          if (!valRes.isValid) {
            const firstErr = valRes.issues.find((i) => i.type === 'error')?.message;
            setErrorMessage(firstErr || 'Feuille Excel incompatible avec les critères V1.');
            return;
          }

          const normalized = normalizeRawData(raw);
          onDatasetChange(normalized);
        }
      } else {
        setErrorMessage('Format non supporté. Veuillez importer un fichier .xlsx ou .csv.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Erreur de lecture : ${msg}`);
    }
  };

  const handleSheetSelected = (sheetName: string) => {
    if (!pendingWorkbook) return;
    try {
      const raw = parseExcelSheet(pendingWorkbook, sheetName);
      const valRes = validateRawData(raw);
      if (!valRes.isValid) {
        const firstErr = valRes.issues.find((i) => i.type === 'error')?.message;
        setErrorMessage(firstErr || 'Feuille Excel incompatible avec les critères V1.');
      } else {
        const normalized = normalizeRawData(raw);
        onDatasetChange(normalized);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsSheetModalOpen(false);
      setPendingWorkbook(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    // reset input
    e.target.value = '';
  };

  // Editable row handlers
  const handleUpdateRow = (id: string, field: 'label' | 'value', value: string) => {
    const updatedRows = dataset.rows.map((row) => {
      if (row.id !== id) return row;
      if (field === 'label') {
        return { ...row, label: value };
      } else {
        const clean = value.replace(',', '.');
        const num = parseFloat(clean);
        return { ...row, value: Number.isNaN(num) ? 0 : num };
      }
    });
    onDatasetChange({ ...dataset, rows: updatedRows });
  };

  const handleAddRow = () => {
    if (dataset.rows.length >= 10) return;
    const newRow: DataRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: `Élément ${dataset.rows.length + 1}`,
      value: 50,
    };
    onDatasetChange({ ...dataset, rows: [...dataset.rows, newRow] });
  };

  const handleDeleteRow = (id: string) => {
    if (dataset.rows.length <= 1) {
      setErrorMessage('Le jeu de données doit comporter au moins 1 ligne.');
      return;
    }
    onDatasetChange({
      ...dataset,
      rows: dataset.rows.filter((r) => r.id !== id),
    });
  };

  const handleClearTable = () => {
    onDatasetChange({
      ...dataset,
      rows: [{ id: 'row-init-1', label: 'Item 1', value: 10 }],
    });
  };

  const isMaxReached = dataset.rows.length >= 10;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Drag & drop upload box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10 scale-[0.99]'
            : 'border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/60 bg-slate-950/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,text/csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition">
            Déposez votre fichier Excel ou CSV
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Formats : .xlsx, .csv (2 colonnes, max 10 lignes)
          </p>
        </div>
      </div>

      {/* Alternative actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPasteModal}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition"
        >
          <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
          <span>Coller des données</span>
        </button>

        <button
          onClick={handleClearTable}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
          title="Vider le tableau"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1 text-[11px] leading-relaxed">
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Validation issues warning */}
      {!validation.isValid && (
        <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Attention sur les données :
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-amber-200/90">
            {validation.issues.map((i, idx) => (
              <li key={idx}>{i.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Editable Table */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Table Title Bar */}
        <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300">
            Édition des données ({dataset.rows.length}/10)
          </span>
          <button
            onClick={handleAddRow}
            disabled={isMaxReached}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
              isMaxReached
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30'
            }`}
            title={isMaxReached ? 'Maximum 10 lignes atteint en V1' : 'Ajouter une ligne'}
          >
            <Plus className="w-3 h-3" />
            <span>Ajouter</span>
          </button>
        </div>

        {/* Scrollable table rows */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/50 text-slate-400 sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="py-1.5 px-3 font-semibold text-[11px] w-1/2">
                  <input
                    type="text"
                    value={dataset.labelColumn}
                    onChange={(e) =>
                      onDatasetChange({ ...dataset, labelColumn: e.target.value })
                    }
                    className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none w-full text-slate-300 font-semibold"
                    title="Nom de la colonne Label"
                  />
                </th>
                <th className="py-1.5 px-3 font-semibold text-[11px] text-right w-1/3">
                  <input
                    type="text"
                    value={dataset.valueColumn}
                    onChange={(e) =>
                      onDatasetChange({ ...dataset, valueColumn: e.target.value })
                    }
                    className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none w-full text-right text-slate-300 font-semibold"
                    title="Nom de la colonne Valeur"
                  />
                </th>
                <th className="py-1.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-mono">
              {dataset.rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-900/60 transition group text-slate-200"
                >
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => handleUpdateRow(row.id, 'label', e.target.value)}
                      className="w-full bg-transparent hover:bg-slate-900 focus:bg-slate-900 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      placeholder={`Label ${index + 1}`}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      step="any"
                      value={row.value}
                      onChange={(e) => handleUpdateRow(row.id, 'value', e.target.value)}
                      className="w-full bg-transparent hover:bg-slate-900 focus:bg-slate-900 rounded px-1.5 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1 rounded text-slate-600 hover:text-rose-400 group-hover:opacity-100 transition opacity-40"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info badge */}
        <div className="p-2 border-t border-slate-900 bg-slate-900/40 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Règles V1 : 2 colonnes • 1 à 10 lignes</span>
          <span>Valeurs négatives autorisées</span>
        </div>
      </div>

      {/* Multi-sheet selection modal */}
      <SheetSelectModal
        isOpen={isSheetModalOpen}
        sheets={sheetNames}
        onSelectSheet={handleSheetSelected}
        onClose={() => {
          setIsSheetModalOpen(false);
          setPendingWorkbook(null);
        }}
      />
    </div>
  );
};
