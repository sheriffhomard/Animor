/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { RawParsedData } from '../validator.ts';

export interface ExcelWorkbookInfo {
  sheetNames: string[];
  workbook: XLSX.WorkBook;
}

/**
 * Reads binary buffer / ArrayBuffer and returns workbook information and sheets.
 */
export function inspectExcelBuffer(buffer: ArrayBuffer | Uint8Array): ExcelWorkbookInfo {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Le fichier Excel ne contient aucune feuille de calcul.');
    }
    return {
      sheetNames: workbook.SheetNames,
      workbook,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Impossible de lire le fichier Excel : ${msg}`);
  }
}

/**
 * Extracts a RawParsedData structure from a given sheet in the workbook.
 */
export function parseExcelSheet(workbook: XLSX.WorkBook, sheetName?: string): RawParsedData {
  const targetSheetName = sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheetName];

  if (!sheet) {
    throw new Error(`La feuille "${targetSheetName}" est introuvable dans le classeur.`);
  }

  // Convert sheet to array of rows (header: 1 returns 2D array)
  const rawRows: (string | number | boolean | null | undefined)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    raw: true,
  });

  if (rawRows.length === 0) {
    return { headers: [], rows: [] };
  }

  // First non-empty row is header
  const headerRow = rawRows[0].map((cell) => (cell !== null && cell !== undefined ? String(cell).trim() : ''));
  const dataRows = rawRows.slice(1).map((row) => {
    return row.map((cell) => {
      if (cell === null || cell === undefined) return '';
      if (typeof cell === 'number') return cell;
      return String(cell).trim();
    });
  });

  return {
    headers: headerRow,
    rows: dataRows,
  };
}
