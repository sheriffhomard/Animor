/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChartMode } from '../../models/AnimationConfig.ts';
import { Theme } from '../../models/Theme.ts';

export interface InterpolatedItem {
  id: string;
  label: string;
  currentValue: number;
  targetValue: number;
  initialRank: number;
  targetRank: number;
  currentRank: number; // smoothly interpolated float for vertical translation
  barLengthRatio: number; // relative to absolute max value [-1, 1]
  bubbleRadiusRatio: number; // [0, 1]
  opacity: number;
  colorIndex: number;
  // Deterministic bubble positions
  bubbleXRatio?: number;
  bubbleYRatio?: number;
}

export interface AnimationState {
  progress: number;
  easedProgress: number;
  items: InterpolatedItem[];
  minValue: number;
  maxValue: number;
  absMax: number;
  hasNegative: boolean;
  zeroRatio: number; // 0..1 horizontal position of value 0
}

export interface RenderConfig {
  width: number;
  height: number;
  theme: Theme;
  mode: ChartMode;
  title: string;
  subtitle?: string;
  source?: string;
  labelColumn: string;
  valueColumn: string;
}

export interface ChartRenderer {
  renderToSvgString(state: AnimationState, config: RenderConfig): string;
}
