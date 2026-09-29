/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  UploadCloud,
  AlertTriangle,
  RotateCcw,
  Clipboard,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  BarChart3,
  Sparkles,
  Columns,
  X,
} from 'lucide-react';
import { Dataset, DataRow, ValidationResult } from '../../models/Dataset.ts';
import { parseCsv } from '../../core/data/parsers/csvParser.ts';
import { inspectExcelBuffer, parseExcelSheet } from '../../core/data/parsers/excelParser.ts';
import { validateRawData } from '../../core/data/validator.ts';
import { datasetToRaw, normalizeRawData } from '../../core/data/normalizer.ts';
import { SheetSelectModal } from '../modals/SheetSelectModal.tsx';
import { PRESET_DATASETS } from '../../core/data/sampleData.ts';
import { AnimationConfig, FilterStrategy } from '../../models/AnimationConfig.ts';
import * as XLSX from 'xlsx';

interface DataPanelProps {
  dataset: Dataset;
  onDatasetChange: (newDataset: Dataset) => void;
  onOpenPasteModal: () => void;
  animationConfig?: AnimationConfig;
  onAnimationConfigChange?: (config: AnimationConfig) => void;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  dataset,
  onDatasetChange,
  onOpenPasteModal,
  animationConfig,
  onAnimationConfigChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Multi-sheet Excel state
  const [pendingWorkbook, setPendingWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  // Table pagination & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Active series list
  const seriesCols = useMemo(() => {
    if (dataset.seriesColumns && dataset.seriesColumns.length > 0) {
      return dataset.seriesColumns;
    }
    return [dataset.valueColumn || 'Valeur'];
  }, [dataset.seriesColumns, dataset.valueColumn]);

  // Validate current dataset state
  const validation: ValidationResult = useMemo(() => {
    return validateRawData(datasetToRaw(dataset));
  }, [dataset]);

  // Dataset statistics
  const stats = useMemo(() => {
    const rows = dataset.rows;
    if (rows.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, sum: 0 };
    }
    const primarySeries = seriesCols[0];
    const vals = rows.map((r) => (r.values ? (r.values[primarySeries] ?? r.value) : r.value));
    const sum = vals.reduce((acc, v) => acc + v, 0);
    return {
      count: rows.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
      avg: sum / rows.length,
      sum,
    };
  }, [dataset.rows, seriesCols]);

  // Filtered & Sorted rows for table view
  const filteredRows = useMemo(() => {
    let rows = dataset.rows;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter((r) => {
        if (r.label.toLowerCase().includes(q)) return true;
        if (r.values) {
          return Object.values(r.values).some((v) => v.toString().includes(q));
        }
        return r.value.toString().includes(q);
      });
    }

    if (sortField) {
      rows = [...rows].sort((a, b) => {
        if (sortField === 'label') {
          return sortAsc ? a.label.localeCompare(b.label) : b.label.localeCompare(a.label);
        } else {
          const valA = a.values ? (a.values[sortField] ?? a.value) : a.value;
          const valB = b.values ? (b.values[sortField] ?? b.value) : b.value;
          return sortAsc ? valA - valB : valB - valA;
        }
      });
    }

    return rows;
  }, [dataset.rows, searchQuery, sortField, sortAsc]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const pageRows = filteredRows.slice(startIndex, startIndex + pageSize);

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
          setErrorMessage(firstErr || 'Fichier CSV incompatible.');
          return;
        }

        const normalized = normalizeRawData(raw);
        onDatasetChange(normalized);
        setCurrentPage(1);
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
            setErrorMessage(firstErr || 'Feuille Excel incompatible.');
            return;
          }

          const normalized = normalizeRawData(raw);
          onDatasetChange(normalized);
          setCurrentPage(1);
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
        setErrorMessage(firstErr || 'Feuille Excel incompatible.');
      } else {
        const normalized = normalizeRawData(raw);
        onDatasetChange(normalized);
        setCurrentPage(1);
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
    e.target.value = '';
  };

  // Row update handlers
  const handleUpdateLabel = (id: string, newLabel: string) => {
    const updatedRows = dataset.rows.map((row) => (row.id === id ? { ...row, label: newLabel } : row));
    onDatasetChange({ ...dataset, rows: updatedRows });
  };

  const handleUpdateValue = (id: string, colName: string, strVal: string) => {
    const clean = strVal.replace(',', '.');
    const num = parseFloat(clean);
    const validNum = Number.isNaN(num) ? 0 : num;

    const updatedRows = dataset.rows.map((row) => {
      if (row.id !== id) return row;
      const values = { ...(row.values || {}), [colName]: validNum };
      return {
        ...row,
        value: colName === dataset.valueColumn ? validNum : row.value,
        values,
      };
    });
    onDatasetChange({ ...dataset, rows: updatedRows });
  };

  const handleAddRow = () => {
    const initialVals: Record<string, number> = {};
    seriesCols.forEach((col) => {
      initialVals[col] = 50;
    });

    const newRow: DataRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: `Élément ${dataset.rows.length + 1}`,
      value: 50,
      values: initialVals,
    };
    onDatasetChange({ ...dataset, rows: [...dataset.rows, newRow] });
    const newTotal = dataset.rows.length + 1;
    setCurrentPage(Math.ceil(newTotal / pageSize));
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

  // Add / Rename / Delete Series Columns
  const handleAddSeriesColumn = () => {
    const newColName = `Série ${seriesCols.length + 1}`;
    const newSeriesList = [...seriesCols, newColName];

    const updatedRows = dataset.rows.map((row) => ({
      ...row,
      values: { ...(row.values || {}), [newColName]: 0 },
    }));

    onDatasetChange({
      ...dataset,
      seriesColumns: newSeriesList,
      isMultiSeries: true,
      rows: updatedRows,
    });
  };

  const handleRenameSeriesColumn = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    const trimmed = newName.trim();
    const newSeriesList = seriesCols.map((s) => (s === oldName ? trimmed : s));

    const updatedRows = dataset.rows.map((row) => {
      const values = { ...(row.values || {}) };
      if (oldName in values) {
        values[trimmed] = values[oldName];
        delete values[oldName];
      }
      return { ...row, values };
    });

    onDatasetChange({
      ...dataset,
      seriesColumns: newSeriesList,
      valueColumn: dataset.valueColumn === oldName ? trimmed : dataset.valueColumn,
      rows: updatedRows,
    });
  };

  const handleDeleteSeriesColumn = (colName: string) => {
    if (seriesCols.length <= 1) return;
    const newSeriesList = seriesCols.filter((s) => s !== colName);

    const updatedRows = dataset.rows.map((row) => {
      const values = { ...(row.values || {}) };
      delete values[colName];
      return {
        ...row,
        value: colName === dataset.valueColumn ? (values[newSeriesList[0]] ?? 0) : row.value,
        values,
      };
    });

    onDatasetChange({
      ...dataset,
      seriesColumns: newSeriesList,
      isMultiSeries: newSeriesList.length > 1,
      valueColumn: dataset.valueColumn === colName ? newSeriesList[0] : dataset.valueColumn,
      rows: updatedRows,
    });
  };

  const handleClearTable = () => {
    const initialVals: Record<string, number> = {};
    seriesCols.forEach((col) => (initialVals[col] = 10));

    onDatasetChange({
      ...dataset,
      rows: [{ id: 'row-init-1', label: 'Item 1', value: 10, values: initialVals }],
    });
    setCurrentPage(1);
    setSearchQuery('');
  };

  const handleSortToggle = (field: string) => {
    if (sortField === field) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortField(null);
        setSortAsc(true);
      }
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const limitPresets = [10, 15, 20, 30, 50, 100, 0];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 1. Drag & drop upload box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 group ${
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
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition">
            Déposez votre fichier Excel ou CSV
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Prend en charge plusieurs séries de données et dimensions temporelles
          </p>
        </div>
      </div>

      {/* 2. Actions & Presets */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPasteModal}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Coller (Ctrl+V)</span>
          </button>

          <button
            onClick={handleAddSeriesColumn}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition"
            title="Ajouter une nouvelle colonne de série"
          >
            <Columns className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ Série</span>
          </button>

          <button
            onClick={handleClearTable}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
            title="Vider le tableau"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Example Datasets Dropdown */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Exemples :
          </span>
          <select
            onChange={(e) => {
              const found = PRESET_DATASETS.find((p) => p.id === e.target.value);
              if (found) {
                onDatasetChange(found.dataset);
                setCurrentPage(1);
              }
            }}
            value=""
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="" disabled>
              Charger un exemple multi-séries ou temporel...
            </option>
            {PRESET_DATASETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Configurable Animation Display Limit */}
      {animationConfig && onAnimationConfigChange && (
        <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              Éléments animés dans le graphique
            </span>
            <span className="font-mono text-[11px] font-semibold text-indigo-300">
              {animationConfig.maxVisibleItems && animationConfig.maxVisibleItems > 0
                ? `Top ${Math.min(animationConfig.maxVisibleItems, dataset.rows.length)} / ${dataset.rows.length}`
                : `Tous (${dataset.rows.length})`}
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {limitPresets.map((limit) => {
              const isSelected = (animationConfig.maxVisibleItems ?? 15) === limit;
              const label = limit === 0 ? 'Tous' : `${limit}`;
              return (
                <button
                  key={limit}
                  onClick={() =>
                    onAnimationConfigChange({
                      ...animationConfig,
                      maxVisibleItems: limit,
                    })
                  }
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
            <span className="text-slate-400">Critère :</span>
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'top', label: 'Plus hauts' },
                  { id: 'bottom', label: 'Plus bas' },
                  { id: 'first', label: 'Ordre fichier' },
                ] as { id: FilterStrategy; label: string }[]
              ).map((strat) => (
                <button
                  key={strat.id}
                  onClick={() =>
                    onAnimationConfigChange({
                      ...animationConfig,
                      filterStrategy: strat.id,
                    })
                  }
                  className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                    (animationConfig.filterStrategy ?? 'top') === strat.id
                      ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {strat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Statistics Badge */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-950/60 border border-slate-800 rounded-xl p-2 text-center text-[10px]">
        <div>
          <span className="text-slate-500 block">Lignes</span>
          <span className="font-bold text-slate-200 font-mono">{stats.count}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Séries</span>
          <span className="font-bold text-indigo-400 font-mono">{seriesCols.length}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Moyenne</span>
          <span className="font-bold text-slate-200 font-mono">
            {stats.avg.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Max</span>
          <span className="font-bold text-indigo-300 font-mono">
            {stats.max.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
          </span>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1 text-[11px] leading-relaxed">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
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

      {/* 5. Multi-Column Editable Table with Horizontal Scroll & Pagination */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Table Controls Bar */}
        <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="relative flex-1 max-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filtrer..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleAddRow}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition shrink-0"
            title="Ajouter une ligne au tableau"
          >
            <Plus className="w-3 h-3" />
            <span>Ajouter Ligne</span>
          </button>
        </div>

        {/* Scrollable table container */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse min-w-full">
            <thead className="bg-slate-900/60 text-slate-400 sticky top-0 z-10 border-b border-slate-800 select-none">
              <tr>
                <th className="py-2 px-3 font-semibold text-[11px] min-w-[140px] sticky left-0 bg-slate-900/90 z-20 backdrop-blur-sm border-r border-slate-800/60">
                  <div className="flex items-center justify-between gap-1">
                    <input
                      type="text"
                      value={dataset.labelColumn}
                      onChange={(e) => onDatasetChange({ ...dataset, labelColumn: e.target.value })}
                      className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none w-full text-slate-300 font-semibold"
                      title="Nom de la colonne des catégories / entités"
                    />
                    <button
                      onClick={() => handleSortToggle('label')}
                      className={`p-1 rounded hover:bg-slate-800 transition ${
                        sortField === 'label' ? 'text-indigo-400' : 'text-slate-500'
                      }`}
                      title="Trier par label"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </div>
                </th>

                {seriesCols.map((colName) => (
                  <th key={colName} className="py-2 px-2 font-semibold text-[11px] min-w-[110px] text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleSortToggle(colName)}
                        className={`p-1 rounded hover:bg-slate-800 transition ${
                          sortField === colName ? 'text-indigo-400' : 'text-slate-500'
                        }`}
                        title={`Trier par ${colName}`}
                      >
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                      <input
                        type="text"
                        defaultValue={colName}
                        onBlur={(e) => handleRenameSeriesColumn(colName, e.target.value)}
                        className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none w-20 text-right text-slate-300 font-semibold font-mono"
                        title="Cliquez pour renommer cette série"
                      />
                      {seriesCols.length > 1 && (
                        <button
                          onClick={() => handleDeleteSeriesColumn(colName)}
                          className="p-1 rounded text-slate-600 hover:text-rose-400 transition"
                          title="Supprimer cette série"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}

                <th className="py-2 px-2 w-8 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-mono">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={seriesCols.length + 2} className="py-8 text-center text-slate-500 text-xs">
                    Aucune ligne trouvée.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, index) => {
                  const globalIndex = startIndex + index + 1;
                  return (
                    <tr key={row.id} className="hover:bg-slate-900/60 transition group text-slate-200">
                      <td className="p-1.5 sticky left-0 bg-slate-950/90 group-hover:bg-slate-900/90 z-10 border-r border-slate-800/60">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-600 font-mono w-5 text-right shrink-0">
                            {globalIndex}
                          </span>
                          <input
                            type="text"
                            value={row.label}
                            onChange={(e) => handleUpdateLabel(row.id, e.target.value)}
                            className="w-full bg-transparent hover:bg-slate-900 focus:bg-slate-900 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            placeholder={`Label ${globalIndex}`}
                          />
                        </div>
                      </td>

                      {seriesCols.map((colName) => {
                        const val = row.values ? (row.values[colName] ?? row.value) : row.value;
                        return (
                          <td key={colName} className="p-1.5 text-right">
                            <input
                              type="number"
                              step="any"
                              value={val}
                              onChange={(e) => handleUpdateValue(row.id, colName, e.target.value)}
                              className="w-full bg-transparent hover:bg-slate-900 focus:bg-slate-900 rounded px-1.5 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          </td>
                        );
                      })}

                      <td className="p-1.5 text-center">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 rounded text-slate-600 hover:text-rose-400 group-hover:opacity-100 transition opacity-30"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Pagination Footer Bar */}
        <div className="p-2 border-t border-slate-900 bg-slate-900/40 text-[11px] text-slate-400 flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5">
            <span>
              {filteredRows.length > 0 ? startIndex + 1 : 0}-
              {Math.min(startIndex + pageSize, filteredRows.length)} sur {filteredRows.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
            >
              <option value={10}>10 / p.</option>
              <option value={25}>25 / p.</option>
              <option value={50}>50 / p.</option>
              <option value={100}>100 / p.</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={activePage <= 1}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Première page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={activePage <= 1}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Page précédente"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-[10px] text-slate-300 px-1">
              {activePage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={activePage >= totalPages}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Page suivante"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={activePage >= totalPages}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Dernière page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
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
