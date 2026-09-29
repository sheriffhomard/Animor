/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export type ChartMode = 'bars' | 'ranking' | 'bubbles' | 'grouped_bars';

export type MultiSeriesMode = 'time_race' | 'grouped' | 'single';

export type AspectRatio = '16:9' | '1:1' | '9:16';

export interface Resolution {
  width: number;
  height: number;
}

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, Resolution> = {
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
};

export type FilterStrategy = 'top' | 'bottom' | 'first';

export interface AnimationConfig {
  duration: number; // in seconds (e.g. 3)
  easing: EasingType;
  mode: ChartMode;
  autoplay: boolean;
  aspectRatio: AspectRatio;
  loop?: boolean;
  maxVisibleItems?: number; // 0 for all items, or e.g. 10, 15, 20, 30, 50, 100
  filterStrategy?: FilterStrategy; // 'top' (highest values), 'bottom' (lowest values), 'first' (file order)
  
  // Multi-Series & Temporal Dimensions
  multiSeriesMode?: MultiSeriesMode; // 'time_race' (Bar Chart Race), 'grouped' (Grouped Bars), 'single'
  activeSeries?: string; // Selected series if single mode or initial
  showTimeWatermark?: boolean; // Display large period/year watermark during time race
  showLegend?: boolean; // Display legend for multi-series
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 4,
  easing: 'easeInOut',
  mode: 'bars',
  autoplay: true,
  aspectRatio: '16:9',
  loop: false,
  maxVisibleItems: 15,
  filterStrategy: 'top',
  multiSeriesMode: 'time_race',
  showTimeWatermark: true,
  showLegend: true,
};
