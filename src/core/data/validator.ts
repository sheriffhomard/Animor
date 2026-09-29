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
 * Validates raw extracted data:
 * - At least 2 columns: Column 1 = Label, Column 2..N = Numeric Series (temporal or categorical)
 * - Minimum 1 data row, up to several thousand rows supported
 * - Header present
 * - Numeric values valid across all series columns (positive, negative, zero allowed)
 * - Empty cells detected
 * - Duplicate labels flagged as warning
 */
export function validateRawData(raw: RawParsedData): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Check headers
  if (!raw.headers || raw.headers.length === 0) {
    issues.push({
      type: 'error',
      message: 'Aucun en-tête trouvé. La première ligne doit contenir les noms des colonnes.',
    });
    return { isValid: false, issues, detectedSeriesCount: 0 };
  }

  if (raw.headers.length < 2) {
    issues.push({
      type: 'error',
      message: `Animor nécessite au minimum 2 colonnes (1 colonne Label et au moins 1 colonne numérique). Détecté : ${raw.headers.length} colonne.`,
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
  } else if (rowCount > 10000) {
    issues.push({
      type: 'warning',
      message: `Jeu de données très volumineux (${rowCount} lignes). Pour préserver les performances du navigateur, une limite d'affichage sera appliquée.`,
    });
  }

  const seenLabels = new Set<string>();
  const totalCols = raw.headers.length;
  const seriesCount = Math.max(0, totalCols - 1);

  // Check each row
  raw.rows.forEach((row, index) => {
    const rowNum = index + 2; // 1-indexed, accounting for header row

    // Column count in row: can be less if trailing empty cells, or more
    if (row.length !== totalCols) {
      issues.push({
        type: 'warning',
        message: `La ligne ${rowNum} comporte ${row.length} colonne(s) au lieu de ${totalCols}. Les cellules manquantes seront traitées comme nulles.`,
        row: rowNum,
      });
    }

    const rawLabel = row[0];

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

    // Check numeric values across all series columns (index 1 to totalCols - 1)
    for (let c = 1; c < totalCols; c++) {
      const rawValue = row[c];
      const colName = raw.headers[c] || `Série ${c}`;

      if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
        // empty cell in series: warning, can default to 0
        issues.push({
          type: 'warning',
          message: `La ligne ${rowNum} a une valeur vide dans la colonne "${colName}". Elle sera initialisée à 0.`,
          row: rowNum,
          column: colName,
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
            message: `La ligne ${rowNum} contient une valeur non numérique dans "${colName}" : "${rawValue}".`,
            row: rowNum,
            column: colName,
          });
        } else if (!Number.isFinite(numVal)) {
          issues.push({
            type: 'error',
            message: `La ligne ${rowNum} contient une valeur infinie ou invalide dans "${colName}".`,
            row: rowNum,
            column: colName,
          });
        }
      }
    }
  });

  const hasFatalErrors = issues.some((i) => i.type === 'error');
  return {
    isValid: !hasFatalErrors,
    issues,
    detectedSeriesCount: seriesCount,
  };
}
