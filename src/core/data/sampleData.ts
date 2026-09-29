/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset, DataRow } from '../../models/Dataset.ts';

export const SAMPLE_DATASET: Dataset = {
  labelColumn: 'Pays',
  valueColumn: 'Valeur',
  seriesColumns: ['Valeur'],
  isMultiSeries: false,
  rows: [
    { id: 'row-1', label: 'France', value: 82, values: { Valeur: 82 } },
    { id: 'row-2', label: 'Allemagne', value: 76, values: { Valeur: 76 } },
    { id: 'row-3', label: 'Italie', value: 63, values: { Valeur: 63 } },
    { id: 'row-4', label: 'Espagne', value: 58, values: { Valeur: 58 } },
    { id: 'row-5', label: 'Belgique', value: 41, values: { Valeur: 41 } },
    { id: 'row-6', label: 'Portugal', value: 35, values: { Valeur: 35 } },
    { id: 'row-7', label: 'Pays-Bas', value: 52, values: { Valeur: 52 } },
    { id: 'row-8', label: 'Autriche', value: 38, values: { Valeur: 38 } },
    { id: 'row-9', label: 'Suède', value: 47, values: { Valeur: 47 } },
    { id: 'row-10', label: 'Danemark', value: 34, values: { Valeur: 34 } },
  ],
};

// 1. Time Race: PIB des Grandes Puissances 2000-2024 (en Milliards USD)
export const GDP_TIME_RACE_DATASET: Dataset = {
  labelColumn: 'Pays',
  valueColumn: '2024',
  seriesColumns: ['2000', '2005', '2010', '2015', '2020', '2024'],
  isMultiSeries: true,
  rows: [
    {
      id: 'gdp-usa',
      label: 'États-Unis',
      value: 28780,
      values: { '2000': 10250, '2005': 13040, '2010': 15000, '2015': 18200, '2020': 21060, '2024': 28780 },
    },
    {
      id: 'gdp-chn',
      label: 'Chine',
      value: 18530,
      values: { '2000': 1210, '2005': 2300, '2010': 6090, '2015': 11060, '2020': 14690, '2024': 18530 },
    },
    {
      id: 'gdp-deu',
      label: 'Allemagne',
      value: 4590,
      values: { '2000': 1950, '2005': 2850, '2010': 3400, '2015': 3360, '2020': 3890, '2024': 4590 },
    },
    {
      id: 'gdp-jpn',
      label: 'Japon',
      value: 4110,
      values: { '2000': 4970, '2005': 4830, '2010': 5700, '2015': 4440, '2020': 5050, '2024': 4110 },
    },
    {
      id: 'gdp-ind',
      label: 'Inde',
      value: 3940,
      values: { '2000': 468, '2005': 820, '2010': 1710, '2015': 2100, '2020': 2670, '2024': 3940 },
    },
    {
      id: 'gdp-gbr',
      label: 'Royaume-Uni',
      value: 3500,
      values: { '2000': 1660, '2005': 2540, '2010': 2490, '2015': 2930, '2020': 2710, '2024': 3500 },
    },
    {
      id: 'gdp-fra',
      label: 'France',
      value: 3130,
      values: { '2000': 1370, '2005': 2200, '2010': 2640, '2015': 2440, '2020': 2640, '2024': 3130 },
    },
    {
      id: 'gdp-bra',
      label: 'Brésil',
      value: 2330,
      values: { '2000': 655, '2005': 892, '2010': 2210, '2015': 1800, '2020': 1450, '2024': 2330 },
    },
    {
      id: 'gdp-ita',
      label: 'Italie',
      value: 2330,
      values: { '2000': 1145, '2005': 1855, '2010': 2130, '2015': 1836, '2020': 1897, '2024': 2330 },
    },
    {
      id: 'gdp-can',
      label: 'Canada',
      value: 2240,
      values: { '2000': 744, '2005': 1170, '2010': 1617, '2015': 1556, '2020': 1645, '2024': 2240 },
    },
  ],
};

// 2. Multi-Séries: Ventes trimestrielles par Catégorie de Produits (en k€)
export const SALES_QUARTERS_DATASET: Dataset = {
  labelColumn: 'Catégorie Produit',
  valueColumn: 'T4',
  seriesColumns: ['T1', 'T2', 'T3', 'T4'],
  isMultiSeries: true,
  rows: [
    { id: 'sale-1', label: 'Smartphones', value: 850, values: { T1: 520, T2: 610, T3: 740, T4: 850 } },
    { id: 'sale-2', label: 'Ordinateurs', value: 620, values: { T1: 410, T2: 480, T3: 530, T4: 620 } },
    { id: 'sale-3', label: 'Audio & Casques', value: 490, values: { T1: 280, T2: 320, T3: 390, T4: 490 } },
    { id: 'sale-4', label: 'Objets Connectés', value: 430, values: { T1: 190, T2: 240, T3: 310, T4: 430 } },
    { id: 'sale-5', label: 'Accessoires', value: 310, values: { T1: 150, T2: 190, T3: 230, T4: 310 } },
    { id: 'sale-6', label: 'Logiciels & Cloud', value: 710, values: { T1: 450, T2: 520, T3: 630, T4: 710 } },
  ],
};

// 3. Multi-Séries: Mix Énergétique Comparatif (en TWh)
export const ENERGY_MIX_DATASET: Dataset = {
  labelColumn: 'Pays',
  valueColumn: 'Solaire',
  seriesColumns: ['Solaire', 'Éolien', 'Hydro', 'Nucléaire', 'Fossile'],
  isMultiSeries: true,
  rows: [
    { id: 'en-fra', label: 'France', value: 23, values: { Solaire: 23, Éolien: 48, Hydro: 62, Nucléaire: 320, Fossile: 45 } },
    { id: 'en-deu', label: 'Allemagne', value: 60, values: { Solaire: 60, Éolien: 140, Hydro: 20, Nucléaire: 0, Fossile: 210 } },
    { id: 'en-esp', label: 'Espagne', value: 38, values: { Solaire: 38, Éolien: 64, Hydro: 31, Nucléaire: 58, Fossile: 65 } },
    { id: 'en-ita', label: 'Italie', value: 31, values: { Solaire: 31, Éolien: 23, Hydro: 44, Nucléaire: 0, Fossile: 145 } },
    { id: 'en-gbr', label: 'Royaume-Uni', value: 14, values: { Solaire: 14, Éolien: 82, Hydro: 8, Nucléaire: 41, Fossile: 110 } },
    { id: 'en-nor', label: 'Norvège', value: 1, values: { Solaire: 1, Éolien: 16, Hydro: 135, Nucléaire: 0, Fossile: 3 } },
  ],
};

export const PRESET_DATASETS = [
  { id: 'gdp-time-race', name: '⏱️ Course Temporelle : PIB Mondial 2000-2024 (Multi-années)', dataset: GDP_TIME_RACE_DATASET },
  { id: 'sales-quarters', name: '📊 Ventes Trimestrielles T1-T4 (Multi-Séries)', dataset: SALES_QUARTERS_DATASET },
  { id: 'energy-mix', name: '⚡ Mix Énergétique par Filière (Multi-Colonnes)', dataset: ENERGY_MIX_DATASET },
  { id: 'sample-10', name: 'Top 10 Pays européens (Série standard)', dataset: SAMPLE_DATASET },
];
