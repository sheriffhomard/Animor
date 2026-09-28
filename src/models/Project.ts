/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimationConfig, DEFAULT_ANIMATION_CONFIG } from './AnimationConfig.ts';
import { Dataset } from './Dataset.ts';
import { DEFAULT_THEME, Theme } from './Theme.ts';

export interface Project {
  id: string;
  title: string;
  subtitle?: string;
  source?: string;
  dataset: Dataset;
  animation: AnimationConfig;
  theme: Theme;
  createdAt: number;
  updatedAt: number;
}

export function createDefaultProject(dataset: Dataset): Project {
  return {
    id: `project_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: 'Visualisation Dynamique',
    subtitle: 'Animation générée avec Animor',
    source: 'Source : Données fournies',
    dataset,
    animation: { ...DEFAULT_ANIMATION_CONFIG },
    theme: { ...DEFAULT_THEME },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
