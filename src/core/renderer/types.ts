/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChartMode, MultiSeriesMode } from '../../models/AnimationConfig.ts';
import { Theme } from '../../models/Theme.ts';

export interface GroupedBarSeriesValue {
  name: string;
  value: number;
  barLengthRatio: number;
  color: string;
}

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
  
  // Grouped bars multi-series support
  groupedSeriesValues?: GroupedBarSeriesValue[];

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
  
  // Temporal Watermark & Multi-Series Info
  timeWatermark?: string; // e.g. "2024", "T3"
  seriesColumns?: string[];
  activeSeriesIndex?: number;
}

export interface RenderConfig {
  width: number;
  height: number;
  theme: Theme;
  mode: ChartMode;
  multiSeriesMode?: MultiSeriesMode;
  title: string;
  subtitle?: string;
  source?: string;
  labelColumn: string;
  valueColumn: string;
  seriesColumns?: string[];
  showTimeWatermark?: boolean;
  showLegend?: boolean;
}

export interface ChartRenderer {
  renderToSvgString(state: AnimationState, config: RenderConfig): string;
}
