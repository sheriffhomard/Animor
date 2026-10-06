/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimationConfig, ChartMode, MultiSeriesMode } from '../../models/AnimationConfig.ts';
import { Dataset, DataRow } from '../../models/Dataset.ts';
import { AnimationState, GroupedBarSeriesValue, InterpolatedItem } from '../renderer/types.ts';
import { getEasing } from './easing.ts';

export class AnimationEngine {
  private dataset: Dataset;
  private config: AnimationConfig;

  // Filtered/selected items for visualization
  private visibleRows: DataRow[] = [];

  // Precomputed metrics
  private minValue = 0;
  private maxValue = 0;
  private absMax = 1;
  private hasNegative = false;
  private zeroRatio = 0;

  // Initial and target rankings for Mode B
  private initialRanks = new Map<string, number>();
  private targetRanks = new Map<string, number>();

  // Deterministic bubble coordinates
  private bubbleCoords = new Map<string, { xRatio: number; yRatio: number }>();

  // Multi-series palette colors for grouped bars
  private seriesColors = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

  constructor(dataset: Dataset, config: AnimationConfig) {
    this.dataset = dataset;
    this.config = config;
    this.recompute();
  }

  public update(dataset: Dataset, config: AnimationConfig) {
    this.dataset = dataset;
    this.config = config;
    this.recompute();
  }

  public getVisibleCount(): number {
    return this.visibleRows.length;
  }

  public getTotalCount(): number {
    return this.dataset.rows.length;
  }

  private getSeriesList(): string[] {
    if (this.dataset.seriesColumns && this.dataset.seriesColumns.length > 0) {
      return this.dataset.seriesColumns;
    }
    return [this.dataset.valueColumn || 'Valeur'];
  }

  private recompute() {
    let rows = this.dataset.rows;
    if (rows.length === 0) {
      this.visibleRows = [];
      this.minValue = 0;
      this.maxValue = 0;
      this.absMax = 1;
      this.hasNegative = false;
      this.zeroRatio = 0;
      return;
    }

    const maxItems = this.config.maxVisibleItems ?? 0;
    const strategy = this.config.filterStrategy ?? 'top';
    const seriesList = this.getSeriesList();
    const activeSeries = this.config.activeSeries || seriesList[0];

    // Reference value for initial filtering & sorting
    const getSortVal = (r: DataRow) => {
      if (r.values) {
        // If multi-series temporal race, sort by max across series or final series
        const lastSeries = seriesList[seriesList.length - 1];
        return r.values[lastSeries] ?? r.value;
      }
      return r.value;
    };

    if (maxItems > 0 && rows.length > maxItems) {
      if (strategy === 'top') {
        rows = [...rows].sort((a, b) => getSortVal(b) - getSortVal(a)).slice(0, maxItems);
      } else if (strategy === 'bottom') {
        rows = [...rows].sort((a, b) => getSortVal(a) - getSortVal(b)).slice(0, maxItems);
      } else {
        rows = rows.slice(0, maxItems);
      }
    }

    this.visibleRows = rows;

    // Calculate global bounds across all active series for consistent axis scaling
    let allValues: number[] = [];
    rows.forEach((r) => {
      if (r.values) {
        seriesList.forEach((s) => {
          if (typeof r.values![s] === 'number') {
            allValues.push(r.values![s]);
          }
        });
      } else {
        allValues.push(r.value);
      }
    });

    if (allValues.length === 0) allValues = [0];

    this.minValue = Math.min(...allValues);
    this.maxValue = Math.max(...allValues);
    this.hasNegative = this.minValue < 0;

    const maxAbs = Math.max(...allValues.map((v) => Math.abs(v)));
    this.absMax = maxAbs > 0 ? maxAbs : 1;

    if (this.hasNegative) {
      const span = Math.max(this.maxValue, 0) - Math.min(this.minValue, 0);
      const positiveSpan = span > 0 ? span : 1;
      this.zeroRatio = Math.abs(Math.min(this.minValue, 0)) / positiveSpan;
    } else {
      this.zeroRatio = 0;
    }

    // Initial ranks (first series order or input order)
    this.initialRanks.clear();
    this.targetRanks.clear();

    const firstSeries = seriesList[0];
    const lastSeries = seriesList[seriesList.length - 1];

    const sortedStart = [...rows].sort((a, b) => {
      const valA = a.values ? (a.values[firstSeries] ?? a.value) : a.value;
      const valB = b.values ? (b.values[firstSeries] ?? b.value) : b.value;
      return valB - valA;
    });

    sortedStart.forEach((r, idx) => {
      this.initialRanks.set(r.id, idx);
    });

    const sortedEnd = [...rows].sort((a, b) => {
      const valA = a.values ? (a.values[lastSeries] ?? a.value) : a.value;
      const valB = b.values ? (b.values[lastSeries] ?? b.value) : b.value;
      return valB - valA;
    });

    sortedEnd.forEach((r, rankIdx) => {
      this.targetRanks.set(r.id, rankIdx);
    });

    this.computeBubbleCoordinates();
  }

  private computeBubbleCoordinates() {
    this.bubbleCoords.clear();
    const rows = this.visibleRows;
    const n = rows.length;
    if (n === 0) return;

    const sortedByAbs = [...rows].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const scaleFactor = 0.42 / Math.sqrt(Math.max(1, n));

    sortedByAbs.forEach((row, i) => {
      if (i === 0) {
        this.bubbleCoords.set(row.id, { xRatio: 0.5, yRatio: 0.5 });
        return;
      }

      const r = scaleFactor * Math.sqrt(i);
      const theta = i * goldenAngle;
      const x = 0.5 + r * Math.cos(theta) * 1.35;
      const y = 0.5 + r * Math.sin(theta) * 0.95;

      const clampedX = Math.max(0.12, Math.min(0.88, x));
      const clampedY = Math.max(0.15, Math.min(0.85, y));

      this.bubbleCoords.set(row.id, { xRatio: clampedX, yRatio: clampedY });
    });
  }

  public getStateAt(rawProgress: number): AnimationState {
    const progress = Math.max(0, Math.min(1, rawProgress));
    const easeFn = getEasing(this.config.easing);

    const seriesList = this.getSeriesList();
    const isMultiSeries = seriesList.length > 1;
    const multiMode = this.config.multiSeriesMode ?? (isMultiSeries ? 'time_race' : 'single');

    let timeWatermark: string | undefined = undefined;
    let activeSeriesIdx = 0;

    // Temporal Race progression
    let getRowCurrentValue: (row: DataRow) => number;
    let getRowTargetValue: (row: DataRow) => number;

    if (isMultiSeries && multiMode === 'time_race') {
      const K = seriesList.length;
      // Progress across K periods
      const floatIdx = progress * (K - 1);
      const idx0 = Math.min(K - 2, Math.floor(floatIdx));
      const idx1 = Math.min(K - 1, idx0 + 1);
      const frac = Math.max(0, Math.min(1, floatIdx - idx0));
      const easedFrac = easeFn(frac);

      activeSeriesIdx = Math.min(K - 1, Math.round(floatIdx));
      timeWatermark = seriesList[activeSeriesIdx];

      getRowCurrentValue = (row: DataRow) => {
        const v0 = row.values ? (row.values[seriesList[idx0]] ?? row.value) : row.value;
        const v1 = row.values ? (row.values[seriesList[idx1]] ?? row.value) : row.value;
        return v0 + (v1 - v0) * easedFrac;
      };

      getRowTargetValue = (row: DataRow) => {
        return row.values ? (row.values[seriesList[K - 1]] ?? row.value) : row.value;
      };
    } else {
      // Standard Single Series / Grouped growth from 0 -> target
      const growthProgress = Math.min(1, Math.max(0, (progress - 0.05) / 0.8));
      const easedGrowth = easeFn(growthProgress);

      const chosenSeries = this.config.activeSeries || seriesList[0];
      timeWatermark = isMultiSeries ? chosenSeries : undefined;

      getRowCurrentValue = (row: DataRow) => {
        const target = row.values ? (row.values[chosenSeries] ?? row.value) : row.value;
        return target * easedGrowth;
      };

      getRowTargetValue = (row: DataRow) => {
        return row.values ? (row.values[chosenSeries] ?? row.value) : row.value;
      };
    }

    const count = this.visibleRows.length;

    // Compute live dynamic ranking at progress for Bar Chart Race
    const liveValues = new Map<string, number>();
    this.visibleRows.forEach((row) => {
      liveValues.set(row.id, getRowCurrentValue(row));
    });

    // Sort descending by current live values to get exact live rank
    const sortedLive = [...this.visibleRows].sort((a, b) => {
      return (liveValues.get(b.id) ?? 0) - (liveValues.get(a.id) ?? 0);
    });

    const liveRanks = new Map<string, number>();
    sortedLive.forEach((r, idx) => {
      liveRanks.set(r.id, idx);
    });

    const items: InterpolatedItem[] = this.visibleRows.map((row, idx) => {
      const initialRank = this.initialRanks.get(row.id) ?? idx;
      const targetRank = this.targetRanks.get(row.id) ?? idx;
      const dynamicRank = liveRanks.get(row.id) ?? targetRank;

      const isRankingMode = this.config.mode === 'ranking';
      let currentRank = initialRank;

      if (isRankingMode) {
        if (isMultiSeries && multiMode === 'time_race') {
          // Continuous live rank tracking in Bar Chart Race
          currentRank = dynamicRank;
        } else {
          // Interpolated rank from initial to target
          const rankProgress = Math.min(1, Math.max(0, (progress - 0.15) / 0.7));
          const easedRank = easeFn(rankProgress);
          currentRank = initialRank + (targetRank - initialRank) * easedRank;
        }
      }

      const maxStaggerDelay = Math.min(0.15, 0.2 / Math.max(1, count));
      const staggerDelay = (idx / Math.max(1, count)) * maxStaggerDelay;
      const itemProgress = Math.min(1, Math.max(0, (progress - staggerDelay) / 0.35));
      const opacity = easeFn(itemProgress);

      const currentValue = liveValues.get(row.id) ?? getRowCurrentValue(row);
      const targetValue = getRowTargetValue(row);

      const barLengthRatio = this.absMax > 0 ? currentValue / this.absMax : 0;
      const absRatio = this.absMax > 0 ? Math.abs(currentValue) / this.absMax : 0;
      const bubbleRadiusRatio = Math.sqrt(absRatio);

      // Multi-series values support for grouped, stacked, lines, area, combo
      let groupedSeriesValues: GroupedBarSeriesValue[] | undefined = undefined;
      if (
        isMultiSeries ||
        multiMode === 'grouped' ||
        this.config.mode === 'grouped_bars' ||
        this.config.mode === 'stacked_bars' ||
        this.config.mode === 'lines' ||
        this.config.mode === 'area' ||
        this.config.mode === 'combo'
      ) {
        const growth = easeFn(Math.min(1, Math.max(0, (progress - 0.05) / 0.8)));
        groupedSeriesValues = seriesList.map((col, sIdx) => {
          const rawVal = row.values ? (row.values[col] ?? 0) : row.value;
          const val = rawVal * growth;
          return {
            name: col,
            value: val,
            barLengthRatio: this.absMax > 0 ? val / this.absMax : 0,
            color: this.seriesColors[sIdx % this.seriesColors.length],
          };
        });
      }

      const bubblePos = this.bubbleCoords.get(row.id) ?? { xRatio: 0.5, yRatio: 0.5 };

      return {
        id: row.id,
        label: row.label,
        currentValue,
        targetValue,
        initialRank,
        targetRank,
        currentRank,
        barLengthRatio,
        bubbleRadiusRatio,
        opacity,
        colorIndex: targetRank % 6,
        groupedSeriesValues,
        bubbleXRatio: bubblePos.xRatio,
        bubbleYRatio: bubblePos.yRatio,
      };
    });

    return {
      progress,
      easedProgress: easeFn(progress),
      items,
      minValue: this.minValue,
      maxValue: this.maxValue,
      absMax: this.absMax,
      hasNegative: this.hasNegative,
      zeroRatio: this.zeroRatio,
      timeWatermark,
      seriesColumns: seriesList,
      activeSeriesIndex: activeSeriesIdx,
    };
  }
}
