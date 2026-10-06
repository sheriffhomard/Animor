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

  it('accepts multi-series datasets with 3 or more columns', () => {
    const raw = {
      headers: ['Pays', '2020', '2021', '2022'],
      rows: [
        ['France', '80', '85', '90'],
        ['Allemagne', '75', '78', '82'],
      ],
    };
    const res = validateRawData(raw);
    expect(res.isValid).toBe(true);
    expect(res.detectedSeriesCount).toBe(3);
  });

  it('rejects dataset with less than 2 columns', () => {
    const raw = {
      headers: ['SeuleColonne'],
      rows: [['A'], ['B']],
    };
    const res = validateRawData(raw);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.message.includes('au minimum 2 colonnes'))).toBe(true);
  });

  it('accepts large datasets with 500 rows', () => {
    const rows = Array.from({ length: 500 }, (_, i) => [`Item ${i + 1}`, `${(i + 1) * 2}`]);
    const raw = {
      headers: ['Label', 'Value'],
      rows,
    };
    const res = validateRawData(raw);
    expect(res.isValid).toBe(true);
    expect(res.issues.length).toBe(0);
  });

  it('rejects empty dataset (0 rows)', () => {
    const raw = {
      headers: ['Label', 'Value'],
      rows: [],
    };
    const res = validateRawData(raw);
    expect(res.isValid).toBe(false);
    expect(res.issues.some((i) => i.message.includes('minimum 1 ligne'))).toBe(true);
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

  it('normalizes multi-series data with multiple value columns', () => {
    const raw = {
      headers: ['Produit', 'T1', 'T2', 'T3'],
      rows: [
        ['Laptop', '100', '150', '200'],
        ['Phone', '80', '120', '160'],
      ],
    };
    const dataset = normalizeRawData(raw);
    expect(dataset.isMultiSeries).toBe(true);
    expect(dataset.seriesColumns).toEqual(['T1', 'T2', 'T3']);
    expect(dataset.rows[0].values?.['T2']).toBe(150);
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

  it('filters a large dataset down to configured Top N items', () => {
    const largeRows = Array.from({ length: 200 }, (_, i) => ({
      id: `row-${i + 1}`,
      label: `Entity ${i + 1}`,
      value: (i + 1) * 5,
    }));
    const largeDataset = {
      labelColumn: 'Entity',
      valueColumn: 'Score',
      rows: largeRows,
    };

    const top10Engine = new AnimationEngine(largeDataset, {
      ...DEFAULT_ANIMATION_CONFIG,
      maxVisibleItems: 10,
      filterStrategy: 'top',
    });

    expect(top10Engine.getTotalCount()).toBe(200);
    expect(top10Engine.getVisibleCount()).toBe(10);
    const state = top10Engine.getStateAt(1);
    expect(state.items.length).toBe(10);
    // Top 1 value should be 200 * 5 = 1000
    expect(state.items[0].targetValue).toBe(1000);
  });

  it('interpolates multi-series values across temporal race periods', () => {
    const temporalDataset = {
      labelColumn: 'Pays',
      valueColumn: '2022',
      seriesColumns: ['2020', '2021', '2022'],
      isMultiSeries: true,
      rows: [
        { id: 'fra', label: 'France', value: 30, values: { '2020': 10, '2021': 20, '2022': 30 } },
        { id: 'deu', label: 'Allemagne', value: 15, values: { '2020': 25, '2021': 20, '2022': 15 } },
      ],
    };

    const raceEngine = new AnimationEngine(temporalDataset, {
      ...DEFAULT_ANIMATION_CONFIG,
      multiSeriesMode: 'time_race',
      easing: 'linear',
    });

    // At progress 0: 2020 values (France: 10, Allemagne: 25)
    const state0 = raceEngine.getStateAt(0);
    expect(state0.items.find((i) => i.id === 'fra')?.currentValue).toBe(10);
    expect(state0.timeWatermark).toBe('2020');

    // At progress 0.5: middle of race, exactly period 2021 (France: 20, Allemagne: 20)
    const stateHalf = raceEngine.getStateAt(0.5);
    expect(Math.round(stateHalf.items.find((i) => i.id === 'fra')?.currentValue ?? 0)).toBe(20);
    expect(stateHalf.timeWatermark).toBe('2021');

    // At progress 1.0: end of race, period 2022 (France: 30, Allemagne: 15)
    const state1 = raceEngine.getStateAt(1);
    expect(state1.items.find((i) => i.id === 'fra')?.currentValue).toBe(30);
    expect(state1.timeWatermark).toBe('2022');
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

  it('renders valid SVG for Line chart (Courbes) with progressive paths and points', () => {
    const state = engine.getStateAt(1);
    const svgLines = renderer.renderToSvgString(state, {
      width: 1920,
      height: 1080,
      theme: DEFAULT_THEME,
      mode: 'lines',
      title: 'Courbes de Tendance',
      labelColumn: 'Pays',
      valueColumn: 'Valeur',
      curveType: 'smooth',
      showPoints: true,
    });
    expect(svgLines).toContain('class="lines-layer"');
    expect(svgLines).toContain('stroke-dasharray');
  });

  it('renders valid SVG for Area chart (Aires) with gradient fills', () => {
    const state = engine.getStateAt(1);
    const svgArea = renderer.renderToSvgString(state, {
      width: 1920,
      height: 1080,
      theme: DEFAULT_THEME,
      mode: 'area',
      title: 'Aires de Croissance',
      labelColumn: 'Pays',
      valueColumn: 'Valeur',
      areaOpacity: 0.4,
    });
    expect(svgArea).toContain('class="area-layer"');
    expect(svgArea).toContain('linearGradient');
  });

  it('renders valid SVG for Stacked Bars (Graphiques Empilés)', () => {
    const state = engine.getStateAt(1);
    const svgStacked = renderer.renderToSvgString(state, {
      width: 1920,
      height: 1080,
      theme: DEFAULT_THEME,
      mode: 'stacked_bars',
      title: 'Ventes Empilées',
      labelColumn: 'Pays',
      valueColumn: 'Valeur',
      stackedMode: 'absolute',
    });
    expect(svgStacked).toContain('class="stacked-bars-layer"');
  });

  it('renders valid SVG for Animated Pie / Donut Chart', () => {
    const state = engine.getStateAt(1);
    const svgPie = renderer.renderToSvgString(state, {
      width: 1080,
      height: 1080,
      theme: DEFAULT_THEME,
      mode: 'pie',
      title: 'Répartition Donut',
      labelColumn: 'Pays',
      valueColumn: 'Valeur',
      pieStyle: 'donut',
      donutHoleRatio: 0.55,
      showPieLabels: true,
    });
    expect(svgPie).toContain('class="pie-layer"');
    expect(svgPie).toContain('TOTAL');
  });

  it('renders valid SVG for Scatter Plot with trendline', () => {
    const state = engine.getStateAt(1);
    const svgScatter = renderer.renderToSvgString(state, {
      width: 1920,
      height: 1080,
      theme: DEFAULT_THEME,
      mode: 'scatter',
      title: 'Dispersion',
      labelColumn: 'Pays',
      valueColumn: 'Valeur',
      showTrendline: true,
    });
    expect(svgScatter).toContain('class="scatter-points-layer"');
  });

  it('renders valid SVG for Combo Chart (Barres + Courbe combinées)', () => {
    const state = engine.getStateAt(1);
    const svgCombo = renderer.renderToSvgString(state, {
      width: 1920,
      height: 1080,
      theme: DEFAULT_THEME,
      mode: 'combo',
      title: 'Graphique Combiné',
      labelColumn: 'Pays',
      valueColumn: 'Valeur',
    });
    expect(svgCombo).toContain('class="combo-bars"');
    expect(svgCombo).toContain('class="combo-line"');
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
