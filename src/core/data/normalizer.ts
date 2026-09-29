/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset, DataRow } from '../../models/Dataset.ts';
import { RawParsedData } from './validator.ts';

export function normalizeRawData(raw: RawParsedData): Dataset {
  const labelColumn = (raw.headers[0] || 'Label').trim();
  
  // All columns from index 1 are numeric series
  const seriesColumns = raw.headers.slice(1).map((h, i) => (h ? String(h).trim() : `Série ${i + 1}`));
  const valueColumn = seriesColumns[0] || 'Valeur';
  const isMultiSeries = seriesColumns.length > 1;

  const rows: DataRow[] = raw.rows.map((row, idx) => {
    const rawLabel = row[0];
    const label = rawLabel !== null && rawLabel !== undefined ? String(rawLabel).trim() : `Élément ${idx + 1}`;
    
    const values: Record<string, number> = {};

    seriesColumns.forEach((colName, colIdx) => {
      const rawVal = row[colIdx + 1];
      let val = 0;
      if (typeof rawVal === 'number') {
        val = Number.isFinite(rawVal) ? rawVal : 0;
      } else if (rawVal !== null && rawVal !== undefined) {
        const cleanStr = String(rawVal).trim().replace(/\s+/g, '').replace(',', '.');
        const parsed = parseFloat(cleanStr);
        val = Number.isFinite(parsed) ? parsed : 0;
      }
      values[colName] = val;
    });

    const primaryValue = values[valueColumn] ?? 0;

    return {
      id: `row-${idx + 1}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      value: primaryValue,
      values,
    };
  });

  return {
    labelColumn,
    valueColumn,
    seriesColumns,
    isMultiSeries,
    rows,
  };
}

/**
 * Creates a raw parsed data representation from current Dataset for re-validation, editing or export.
 */
export function datasetToRaw(dataset: Dataset): RawParsedData {
  const seriesCols = dataset.seriesColumns && dataset.seriesColumns.length > 0
    ? dataset.seriesColumns
    : [dataset.valueColumn || 'Valeur'];

  const headers = [dataset.labelColumn, ...seriesCols];

  const rows = dataset.rows.map((r) => {
    const rowVals = seriesCols.map((col) => {
      if (r.values && col in r.values) {
        return r.values[col];
      }
      return r.value;
    });
    return [r.label, ...rowVals];
  });

  return {
    headers,
    rows,
  };
}
