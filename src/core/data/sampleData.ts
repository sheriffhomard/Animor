/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../models/Dataset.ts';

export const SAMPLE_DATASET: Dataset = {
  labelColumn: 'Pays',
  valueColumn: 'Valeur',
  rows: [
    { id: 'row-1', label: 'France', value: 82 },
    { id: 'row-2', label: 'Allemagne', value: 76 },
    { id: 'row-3', label: 'Italie', value: 63 },
    { id: 'row-4', label: 'Espagne', value: 58 },
    { id: 'row-5', label: 'Belgique', value: 41 },
    { id: 'row-6', label: 'Portugal', value: 35 },
    { id: 'row-7', label: 'Pays-Bas', value: 52 },
    { id: 'row-8', label: 'Autriche', value: 38 },
    { id: 'row-9', label: 'Suède', value: 47 },
    { id: 'row-10', label: 'Danemark', value: 34 },
  ],
};
