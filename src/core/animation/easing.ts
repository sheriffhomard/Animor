/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EasingType } from '../../models/AnimationConfig.ts';

export type EasingFunction = (t: number) => number;

/**
 * Standard easing functions normalized for t ∈ [0, 1].
 */
export const easingFunctions: Record<EasingType, EasingFunction> = {
  linear: (t: number): number => {
    return Math.max(0, Math.min(1, t));
  },

  easeIn: (t: number): number => {
    const clamped = Math.max(0, Math.min(1, t));
    return clamped * clamped * clamped; // cubic easeIn
  },

  easeOut: (t: number): number => {
    const clamped = Math.max(0, Math.min(1, t));
    const inv = 1 - clamped;
    return 1 - inv * inv * inv; // cubic easeOut
  },

  easeInOut: (t: number): number => {
    const clamped = Math.max(0, Math.min(1, t));
    return clamped < 0.5
      ? 4 * clamped * clamped * clamped
      : 1 - Math.pow(-2 * clamped + 2, 3) / 2; // cubic easeInOut
  },
};

export function getEasing(type: EasingType): EasingFunction {
  return easingFunctions[type] || easingFunctions.easeInOut;
}
