/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimationConfig, ChartMode } from '../../models/AnimationConfig.ts';
import { Dataset } from '../../models/Dataset.ts';
import { AnimationState, InterpolatedItem } from '../renderer/types.ts';
import { getEasing } from './easing.ts';

export class AnimationEngine {
  private dataset: Dataset;
  private config: AnimationConfig;

  // Precomputed metrics
  private minValue = 0;
  private maxValue = 0;
  private absMax = 1;
  private hasNegative = false;
  private zeroRatio = 0;

  // Initial and target rankings for Mode B
  private initialRanks = new Map<string, number>();
  private targetRanks = new Map<string, number>();

  // Precomputed deterministic bubble coordinates
  private bubbleCoords = new Map<string, { xRatio: number; yRatio: number }>();

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

  private recompute() {
    const rows = this.dataset.rows;
    if (rows.length === 0) {
      this.minValue = 0;
      this.maxValue = 0;
      this.absMax = 1;
      this.hasNegative = false;
      this.zeroRatio = 0;
      return;
    }

    const values = rows.map((r) => r.value);
    this.minValue = Math.min(...values);
    this.maxValue = Math.max(...values);
    this.hasNegative = this.minValue < 0;

    const maxAbs = Math.max(...values.map((v) => Math.abs(v)));
    this.absMax = maxAbs > 0 ? maxAbs : 1;

    // Zero position ratio: if has negative, zero is between [0, 1]
    if (this.hasNegative) {
      const span = Math.max(this.maxValue, 0) - Math.min(this.minValue, 0);
      const positiveSpan = span > 0 ? span : 1;
      this.zeroRatio = Math.abs(Math.min(this.minValue, 0)) / positiveSpan;
    } else {
      this.zeroRatio = 0;
    }

    // Compute ranks:
    // Initial ranks: input order (0, 1, 2...)
    rows.forEach((r, idx) => {
      this.initialRanks.set(r.id, idx);
    });

    // Target ranks: sorted descending by value
    const sorted = [...rows].sort((a, b) => b.value - a.value);
    sorted.forEach((r, rankIdx) => {
      this.targetRanks.set(r.id, rankIdx);
    });

    // Compute deterministic bubble positions (Vogel spiral / deterministic pack)
    this.computeBubbleCoordinates();
  }

  /**
   * Deterministic placement of bubbles using Fermat's spiral with golden angle
   * centered around (0.5, 0.5) inside the chart area.
   */
  private computeBubbleCoordinates() {
    this.bubbleCoords.clear();
    const rows = this.dataset.rows;
    const n = rows.length;
    if (n === 0) return;

    // Sort by descending absolute value for optimal center packing
    const sortedByAbs = [...rows].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

    sortedByAbs.forEach((row, i) => {
      if (i === 0) {
        this.bubbleCoords.set(row.id, { xRatio: 0.5, yRatio: 0.5 });
        return;
      }

      // Radius scales with sqrt(i)
      const r = 0.16 * Math.sqrt(i) * 1.05;
      const theta = i * goldenAngle;

      // Slight aspect ratio compression (1.2 horizontal stretch for wide viewports)
      const x = 0.5 + r * Math.cos(theta) * 1.35;
      const y = 0.5 + r * Math.sin(theta) * 0.95;

      // Clamping to safe zone [0.15, 0.85]
      const clampedX = Math.max(0.18, Math.min(0.82, x));
      const clampedY = Math.max(0.2, Math.min(0.8, y));

      this.bubbleCoords.set(row.id, { xRatio: clampedX, yRatio: clampedY });
    });
  }

  /**
   * Evaluates the animation state at normalized progress [0, 1].
   */
  public getStateAt(rawProgress: number): AnimationState {
    const progress = Math.max(0, Math.min(1, rawProgress));
    const easeFn = getEasing(this.config.easing);

    // Timeline staging:
    // 0.00 -> 0.10: Staggered entry / opacity fade in
    // 0.05 -> 0.85: Value interpolation & bar growth / bubble scale
    // 0.20 -> 0.85: Rank shifts (Mode B)
    // 0.85 -> 1.00: Settle and hold
    const growthProgress = Math.min(1, Math.max(0, (progress - 0.05) / 0.8));
    const easedGrowth = easeFn(growthProgress);

    // Rank interpolation with smooth easing
    const rankProgress = Math.min(1, Math.max(0, (progress - 0.15) / 0.7));
    const easedRankProgress = easeFn(rankProgress);

    const items: InterpolatedItem[] = this.dataset.rows.map((row, idx) => {
      const initialRank = this.initialRanks.get(row.id) ?? idx;
      const targetRank = this.targetRanks.get(row.id) ?? idx;

      // In Mode B (ranking), elements transition from initialRank to targetRank.
      // In other modes, position remains initialRank.
      const isRankingMode = this.config.mode === 'ranking';
      const currentRank = isRankingMode
        ? initialRank + (targetRank - initialRank) * easedRankProgress
        : initialRank;

      // Staggered opacity: slightly offset by item index for elegant reveal
      const staggerDelay = Math.min(0.15, (idx / Math.max(1, this.dataset.rows.length)) * 0.12);
      const itemProgress = Math.min(1, Math.max(0, (progress - staggerDelay) / 0.35));
      const opacity = easeFn(itemProgress);

      // Smooth value counter
      const currentValue = row.value * easedGrowth;

      // Bar length ratio [-1, 1]
      const barLengthRatio = this.absMax > 0 ? currentValue / this.absMax : 0;

      // Bubble radius ratio [0, 1] based on area proportional to abs(value)
      const absRatio = this.absMax > 0 ? Math.abs(currentValue) / this.absMax : 0;
      const bubbleRadiusRatio = Math.sqrt(absRatio);

      // Deterministic coordinates for bubbles
      const bubblePos = this.bubbleCoords.get(row.id) ?? { xRatio: 0.5, yRatio: 0.5 };

      return {
        id: row.id,
        label: row.label,
        currentValue,
        targetValue: row.value,
        initialRank,
        targetRank,
        currentRank,
        barLengthRatio,
        bubbleRadiusRatio,
        opacity,
        colorIndex: targetRank % 6,
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
    };
  }
}
