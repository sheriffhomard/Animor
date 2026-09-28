/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';

import { parseCsv, detectDelimiter } from '../core/data/parsers/csvParser.ts';
import { parseExcelSheet, inspectExcelBuffer } from '../core/data/parsers/excelParser.ts';
import { validateRawData } from '../core/data/validator.ts';
import { normalizeRawData } from '../core/data/normalizer.ts';
import { easingFunctions, getEasing } from '../core/animation/easing.ts';
import { AnimationEngine } from '../core/animation/AnimationEngine.ts';
import { SvgRenderer } from '../core/renderer/SvgRenderer.ts';
import { generateStandaloneHtml } from '../core/export/standaloneHtml.ts';
import { SAMPLE_DATASET } from '../core/data/sampleData.ts';
import { DEFAULT_ANIMATION_CONFIG } from '../models/AnimationConfig.ts';
import { DEFAULT_THEME } from '../models/Theme.ts';
import { createDefaultProject } from '../models/Project.ts';

describe('CSV Parser', () => {
  it('detects comma delimiter in simple CSV', () => {
    const csv = 'Pays,Valeur\nFrance,82\nAllemagne,76';
    expect(detectDelimiter(csv)).toBe(',');
    const parsed = parseCsv(csv);
    expect(parsed.headers).toEqual(['Pays', 'Valeur']);
    expect(parsed.rows.length).toBe(2);
    expect(parsed.rows[0]).toEqual(['France', '82']);
  });

  it('detects semicolon delimiter and handles accents', () => {
    const csv = 'Pays;Énergie\nSuède;47\nAutriche;38';
    expect(detectDelimiter(csv)).toBe(';');
    const parsed = parseCsv(csv);
    expect(parsed.headers).toEqual(['Pays', 'Énergie']);
    expect(parsed.rows[0]).toEqual(['Suède', '47']);
  });

  it('handles tab-separated values (copied from Excel)', () => {
    const tsv = 'Item\tValue\nA\t10\nB\t20';
    expect(detectDelimiter(tsv)).toBe('\t');
    const parsed = parseCsv(tsv);
    expect(parsed.headers).toEqual(['Item', 'Value']);
    expect(parsed.rows.length).toBe(2);
  });

  it('handles quoted fields and commas inside quotes', () => {
    const csv = 'Label,Valeur\n"Paris, France",100\n"Berlin, Germany",90';
    const parsed = parseCsv(csv);
    expect(parsed.rows[0][0]).toBe('Paris, France');
    expect(parsed.rows[0][1]).toBe('100');
  });

  it('returns empty structures for invalid/empty CSV', () => {
    const parsed = parseCsv('');
    expect(parsed.headers).toEqual([]);
    expect(parsed.rows).toEqual([]);
  });
});

describe('Excel Parser', () => {
  it('parses valid XLSX buffer and sheets', () => {
    // Generate a test workbook in-memory using xlsx
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Pays', 'Valeur'],
      ['France', 82],
      ['Italie', 63],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Donnees');
    const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const info = inspectExcelBuffer(u8);
    expect(info.sheetNames).toEqual(['Donnees']);

    const parsed = parseExcelSheet(info.workbook, 'Donnees');
    expect(parsed.headers).toEqual(['Pays', 'Valeur']);
    expect(parsed.rows.length).toBe(2);
    expect(parsed.rows[0]).toEqual(['France', 82]);
  });
});

describe('Validator', () => {
  it('accepts valid 2-column, 10-row dataset', () => {
    const raw = {
      headers: ['Pays', 'Valeur'],
      rows: [
        ['France', '82'],
        ['Allemagne', '76'],
      ],
    };
    const res = validateRawData(raw);
    expect(res.isValid).toBe(true);
    expect(res.issues.length).toBe(0);
  });

  it('rejects 3 columns', () => {
    const raw = {
      headers: ['A', 'B', 'C'],
      rows: [['x', '1', '2']],
    };
    const res = validateRawData(raw);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.message.includes('2 colonnes'))).toBe(true);
  });

  it('rejects 11 rows (max 10 allowed)', () => {
    const rows = Array.from({ length: 11 }, (_, i) => [`Item ${i + 1}`, `${i * 10}`]);
    const raw = {
      headers: ['Label', 'Value'],
      rows,
    };
    const res = validateRawData(raw);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.message.includes('au maximum 10 lignes'))).toBe(true);
  });

  it('flags non-numeric / NaN values', () => {
    const raw = {
      headers: ['Pays', 'Valeur'],
      rows: [['France', 'abc']],
    };
    const res = validateRawData(raw);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.message.includes('non numérique'))).toBe(true);
  });

  it('allows negative and zero values', () => {
    const raw = {
      headers: ['Pays', 'Valeur'],
      rows: [
        ['France', '-15'],
        ['Allemagne', '0'],
      ],
    };
    const res = validateRawData(raw);
    expect(res.isValid).toBe(true);
  });

  it('flags duplicate labels with a warning', () => {
    const raw = {
      headers: ['Pays', 'Valeur'],
      rows: [
        ['France', '10'],
        ['France', '20'],
      ],
    };
    const res = validateRawData(raw);
    expect(res.issues.some((i) => i.type === 'warning' && i.message.includes('double'))).toBe(true);
  });
});

describe('Normalizer', () => {
  it('converts raw data to standard Dataset format with numeric values', () => {
    const raw = {
      headers: ['Pays', 'Valeur'],
      rows: [
        ['France', '82,5'],
        ['Allemagne', 76],
      ],
    };
    const dataset = normalizeRawData(raw);
    expect(dataset.labelColumn).toBe('Pays');
    expect(dataset.valueColumn).toBe('Valeur');
    expect(dataset.rows.length).toBe(2);
    expect(dataset.rows[0].value).toBe(82.5);
    expect(dataset.rows[1].value).toBe(76);
    expect(dataset.rows[0].id).toBeDefined();
  });
});

describe('Easing', () => {
  it('clamps and evaluates bounds [0, 1] correctly', () => {
    const linear = getEasing('linear');
    expect(linear(0)).toBe(0);
    expect(linear(0.5)).toBe(0.5);
    expect(linear(1)).toBe(1);

    const easeInOut = getEasing('easeInOut');
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);

    const easeIn = easingFunctions.easeIn;
    expect(easeIn(0)).toBe(0);
    expect(easeIn(1)).toBe(1);

    const easeOut = easingFunctions.easeOut;
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
  });
});

describe('AnimationEngine', () => {
  const engine = new AnimationEngine(SAMPLE_DATASET, DEFAULT_ANIMATION_CONFIG);

  it('evaluates progress = 0', () => {
    const state = engine.getStateAt(0);
    expect(state.progress).toBe(0);
    expect(state.items.length).toBe(10);
    expect(state.items[0].currentValue).toBe(0);
  });

  it('evaluates progress = 0.5', () => {
    const state = engine.getStateAt(0.5);
    expect(state.progress).toBe(0.5);
    expect(state.items[0].currentValue).toBeGreaterThan(0);
    expect(state.items[0].currentValue).toBeLessThanOrEqual(SAMPLE_DATASET.rows[0].value);
  });

  it('evaluates progress = 1 (final state)', () => {
    const state = engine.getStateAt(1);
    expect(state.progress).toBe(1);
    expect(Math.round(state.items[0].currentValue)).toBe(SAMPLE_DATASET.rows[0].value);
  });
});

describe('SvgRenderer', () => {
  const engine = new AnimationEngine(SAMPLE_DATASET, DEFAULT_ANIMATION_CONFIG);
  const renderer = new SvgRenderer();

  it('renders valid SVG string for Bar Chart', () => {
    const state = engine.getStateAt(1);
    const svg = renderer.renderToSvgString(state, {
      width: 1920,
      height: 1080,
      theme: DEFAULT_THEME,
      mode: 'bars',
      title: 'Mon Graphique',
      labelColumn: 'Pays',
      valueColumn: 'Valeur',
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 1920 1080"');
    expect(svg).toContain('Mon Graphique');
    expect(svg).toContain('France');
    expect(svg).toContain('</svg>');
  });

  it('renders valid SVG string for Ranking and Bubbles modes', () => {
    const state = engine.getStateAt(1);
    const svgRanking = renderer.renderToSvgString(state, {
      width: 1080,
      height: 1080,
      theme: DEFAULT_THEME,
      mode: 'ranking',
      title: 'Classement',
      labelColumn: 'Pays',
      valueColumn: 'Valeur',
    });
    expect(svgRanking).toContain('#1');

    const svgBubbles = renderer.renderToSvgString(state, {
      width: 1920,
      height: 1080,
      theme: DEFAULT_THEME,
      mode: 'bubbles',
      title: 'Bulles',
      labelColumn: 'Pays',
      valueColumn: 'Valeur',
    });
    expect(svgBubbles).toContain('class="bubbles-layer"');
  });
});

describe('Export Standalone HTML', () => {
  it('generates self-contained HTML file containing project data', () => {
    const project = createDefaultProject(SAMPLE_DATASET);
    const html = generateStandaloneHtml(project);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Animor Player');
    expect(html).toContain('France');
    expect(html).toContain('requestAnimationFrame');
  });
});
