/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Theme {
  id: string;
  name: string;
  background: string;
  primary: string;
  secondary: string;
  text: string;
  accent: string;
  fontFamily: string;
  gridColor?: string;
}

export const THEME_PRESETS: Theme[] = [
  {
    id: 'cyber-indigo',
    name: 'Cyber Indigo',
    background: '#090d16',
    primary: '#6366f1',
    secondary: '#a855f7',
    text: '#f8fafc',
    accent: '#38bdf8',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    gridColor: 'rgba(255, 255, 255, 0.07)',
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Coral',
    background: '#130c1e',
    primary: '#f97316',
    secondary: '#ec4899',
    text: '#ffffff',
    accent: '#fbbf24',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    gridColor: 'rgba(255, 255, 255, 0.08)',
  },
  {
    id: 'emerald-flow',
    name: 'Emerald Neo',
    background: '#061715',
    primary: '#10b981',
    secondary: '#06b6d4',
    text: '#f0fdf4',
    accent: '#34d399',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    gridColor: 'rgba(255, 255, 255, 0.07)',
  },
  {
    id: 'editorial-dark',
    name: 'Editorial Luxury',
    background: '#121214',
    primary: '#e2b34a',
    secondary: '#b48625',
    text: '#f5f5f7',
    accent: '#f9d479',
    fontFamily: "'Playfair Display', serif",
    gridColor: 'rgba(255, 255, 255, 0.06)',
  },
  {
    id: 'technical-mono',
    name: 'Technical Terminal',
    background: '#020617',
    primary: '#22d3ee',
    secondary: '#38bdf8',
    text: '#e2e8f0',
    accent: '#4ade80',
    fontFamily: "'JetBrains Mono', monospace",
    gridColor: 'rgba(34, 211, 238, 0.12)',
  },
  {
    id: 'clean-light',
    name: 'Clean Studio Light',
    background: '#f8fafc',
    primary: '#4f46e5',
    secondary: '#0284c7',
    text: '#0f172a',
    accent: '#0d9488',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    gridColor: 'rgba(0, 0, 0, 0.06)',
  },
];

export const FONT_OPTIONS = [
  { label: 'Plus Jakarta Sans (Moderne)', value: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { label: 'JetBrains Mono (Technique)', value: "'JetBrains Mono', monospace" },
  { label: 'Playfair Display (Éditorial)', value: "'Playfair Display', serif" },
  { label: 'System UI (Neutre)', value: "system-ui, -apple-system, sans-serif" },
];

export const DEFAULT_THEME: Theme = THEME_PRESETS[0];
