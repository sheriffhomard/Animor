/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DataRow {
  id: string;
  label: string;
  value: number; // Primary value (used for backward compatibility / single series)
  values?: Record<string, number>; // Series values: { "2020": 45, "2021": 52, ... }
}

export interface Dataset {
  labelColumn: string;
  valueColumn: string; // Active or primary series column
  seriesColumns?: string[]; // All numeric series columns: e.g. ["2020", "2021", "2022", "2023", "2024"]
  isMultiSeries?: boolean;
  rows: DataRow[];
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  row?: number;
  column?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  detectedSeriesCount?: number;
}
