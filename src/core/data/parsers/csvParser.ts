/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RawParsedData } from '../validator.ts';

/**
 * Detects the most probable delimiter: comma, semicolon, or tab.
 */
export function detectDelimiter(text: string): string {
  const firstLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 5);
  if (firstLines.length === 0) return ',';

  const counts: Record<string, number> = { '\t': 0, ';': 0, ',': 0 };

  for (const line of firstLines) {
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (!inQuotes) {
        if (char in counts) {
          counts[char]++;
        }
      }
    }
  }

  // Pick candidate with highest non-zero occurrence
  let best = ',';
  let max = -1;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      best = delim;
    }
  }
  return max > 0 ? best : ',';
}

/**
 * Robust CSV line tokenizer respecting quoted fields and escaped quotes.
 */
export function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parses full CSV string into RawParsedData.
 */
export function parseCsv(csvText: string, customDelimiter?: string): RawParsedData {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM if present
  if (!cleanText) {
    return { headers: [], rows: [] };
  }

  const delimiter = customDelimiter || detectDelimiter(cleanText);
  const rawLines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (rawLines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(rawLines[0], delimiter);
  const rows: (string | number)[][] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const cols = parseCsvLine(rawLines[i], delimiter);
    rows.push(cols);
  }

  return {
    headers,
    rows,
  };
}
