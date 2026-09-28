/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export type ChartMode = 'bars' | 'ranking' | 'bubbles';

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

export interface AnimationConfig {
  duration: number; // in seconds (e.g. 3)
  easing: EasingType;
  mode: ChartMode;
  autoplay: boolean;
  aspectRatio: AspectRatio;
  loop?: boolean;
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 3,
  easing: 'easeInOut',
  mode: 'bars',
  autoplay: true,
  aspectRatio: '16:9',
  loop: false,
};
