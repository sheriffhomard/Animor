/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset, DataRow } from '../../models/Dataset.ts';
import { RawParsedData } from './validator.ts';

export function normalizeRawData(raw: RawParsedData): Dataset {
  const labelColumn = (raw.headers[0] || 'Label').trim();
  const valueColumn = (raw.headers[1] || 'Valeur').trim();

  const rows: DataRow[] = raw.rows.map((row, idx) => {
    const rawLabel = row[0];
    const rawVal = row[1];

    const label = rawLabel !== null && rawLabel !== undefined ? String(rawLabel).trim() : `Élément ${idx + 1}`;
    let value = 0;

    if (typeof rawVal === 'number') {
      value = Number.isFinite(rawVal) ? rawVal : 0;
    } else if (rawVal !== null && rawVal !== undefined) {
      const cleanStr = String(rawVal).trim().replace(/\s+/g, '').replace(',', '.');
      const parsed = parseFloat(cleanStr);
      value = Number.isFinite(parsed) ? parsed : 0;
    }

    return {
      id: `row-${idx + 1}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      value,
    };
  });

  return {
    labelColumn,
    valueColumn,
    rows,
  };
}

/**
 * Creates a raw parsed data representation from current Dataset for re-validation or export.
 */
export function datasetToRaw(dataset: Dataset): RawParsedData {
  return {
    headers: [dataset.labelColumn, dataset.valueColumn],
    rows: dataset.rows.map((r) => [r.label, r.value]),
  };
}
