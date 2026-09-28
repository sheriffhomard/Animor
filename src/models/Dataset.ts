/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DataRow {
  id: string;
  label: string;
  value: number;
}

export interface Dataset {
  labelColumn: string;
  valueColumn: string;
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
}
