/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ValidationIssue, ValidationResult } from '../../models/Dataset.ts';

export interface RawParsedData {
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

/**
 * Validates raw extracted data according to Animor V1 rules:
 * - Exactly 2 columns
 * - Minimum 1 data row, maximum 10 data rows
 * - Header present
 * - Numeric values valid (positive, negative, zero allowed; NaN / Infinity forbidden)
 * - Empty cells detected
 * - Duplicate labels flagged
 */
export function validateRawData(raw: RawParsedData): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Check headers
  if (!raw.headers || raw.headers.length === 0) {
    issues.push({
      type: 'error',
      message: 'Aucun en-tête trouvé. La première ligne doit contenir les noms des deux colonnes.',
    });
    return { isValid: false, issues };
  }

  if (raw.headers.length !== 2) {
    issues.push({
      type: 'error',
      message: `Animor V1 accepte exactement 2 colonnes (Label et Valeur). Détecté : ${raw.headers.length} colonnes.`,
    });
  }

  // Check headers empty
  if (raw.headers.some((h) => !h || String(h).trim() === '')) {
    issues.push({
      type: 'error',
      message: "Un nom de colonne d'en-tête est vide ou invalide.",
    });
  }

  // Check row count
  const rowCount = raw.rows.length;
  if (rowCount === 0) {
    issues.push({
      type: 'error',
      message: 'Le jeu de données ne contient aucune ligne de données (minimum 1 ligne requise).',
    });
  } else if (rowCount > 10) {
    issues.push({
      type: 'error',
      message: `Animor V1 accepte au maximum 10 lignes de données. Reçu : ${rowCount} lignes.`,
    });
  }

  const seenLabels = new Set<string>();

  // Check each row
  raw.rows.forEach((row, index) => {
    const rowNum = index + 2; // 1-indexed, accounting for header row

    // Column count in row
    if (row.length !== 2) {
      issues.push({
        type: 'error',
        message: `La ligne ${rowNum} comporte ${row.length} colonne(s) au lieu de 2.`,
        row: rowNum,
      });
      return;
    }

    const [rawLabel, rawValue] = row;

    // Check label
    if (rawLabel === null || rawLabel === undefined || String(rawLabel).trim() === '') {
      issues.push({
        type: 'error',
        message: `La ligne ${rowNum} possède un label vide.`,
        row: rowNum,
        column: raw.headers[0] || 'Colonne 1',
      });
    } else {
      const trimmedLabel = String(rawLabel).trim();
      if (seenLabels.has(trimmedLabel.toLowerCase())) {
        issues.push({
          type: 'warning',
          message: `Le label "${trimmedLabel}" apparaît en double (ligne ${rowNum}).`,
          row: rowNum,
          column: raw.headers[0] || 'Colonne 1',
        });
      }
      seenLabels.add(trimmedLabel.toLowerCase());
    }

    // Check numeric value
    if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
      issues.push({
        type: 'error',
        message: `La ligne ${rowNum} a une valeur manquante.`,
        row: rowNum,
        column: raw.headers[1] || 'Colonne 2',
      });
    } else {
      let numVal: number;
      if (typeof rawValue === 'number') {
        numVal = rawValue;
      } else {
        const cleanStr = String(rawValue).trim().replace(/\s+/g, '').replace(',', '.');
        numVal = Number(cleanStr);
      }

      if (Number.isNaN(numVal)) {
        issues.push({
          type: 'error',
          message: `La ligne ${rowNum} contient une valeur non numérique : "${rawValue}".`,
          row: rowNum,
          column: raw.headers[1] || 'Colonne 2',
        });
      } else if (!Number.isFinite(numVal)) {
        issues.push({
          type: 'error',
          message: `La ligne ${rowNum} contient une valeur infinie ou invalide.`,
          row: rowNum,
          column: raw.headers[1] || 'Colonne 2',
        });
      }
    }
  });

  const hasFatalErrors = issues.some((i) => i.type === 'error');
  return {
    isValid: !hasFatalErrors,
    issues,
  };
}
